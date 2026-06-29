function readEnv(key: string): string | undefined {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  return viteEnv?.[key];
}

function isViteDev(): boolean {
  return Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);
}

function supabaseUrl(): string {
  const url = readEnv("VITE_SUPABASE_URL");
  if (!url) {
    throw new Error("Missing VITE_SUPABASE_URL");
  }
  return url.replace(/\/$/, "");
}

/** In Vite dev, route through same-origin proxy to avoid browser CORS on edge functions. */
export function edgeFunctionUrl(name: string): string {
  if (isViteDev()) {
    return `/supabase-functions/${name}`;
  }
  return `${supabaseUrl()}/functions/v1/${name}`;
}

interface AuthClient {
  auth: {
    getSession: () => Promise<{ data: { session: { access_token: string; expires_at?: number } | null } }>;
    refreshSession: () => Promise<{ data: { session: { access_token: string } | null } }>;
  };
}

/** Fresh access token from Supabase client storage (refreshes when near expiry). */
export async function resolveAccessToken(supabase: AuthClient): Promise<string> {
  const { data: current } = await supabase.auth.getSession();
  let session = current.session;

  const expiresAt = session?.expires_at;
  if (session && expiresAt && expiresAt * 1000 - Date.now() < 60_000) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed.session ?? session;
  }

  if (!session?.access_token) {
    throw new Error("Not signed in — sign out and sign in again.");
  }

  return session.access_token;
}

export async function callEdgeFunction(
  accessToken: string,
  name: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("apikey")) {
    const anon = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
    if (anon) {
      headers.set("apikey", anon);
    }
  }

  try {
    return await fetch(edgeFunctionUrl(name), {
      ...init,
      headers,
    });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        `Could not reach ${name} at ${edgeFunctionUrl(name)}. Check network, ad blockers, or run npm run deploy:edge.`,
      );
    }
    throw err;
  }
}

/** Edge call with live session from Supabase client — refreshes stale JWTs automatically. */
export async function callEdgeFunctionAuthed(
  supabase: AuthClient,
  name: string,
  init: RequestInit = {},
): Promise<Response> {
  let token = await resolveAccessToken(supabase);
  let res = await callEdgeFunction(token, name, init);

  if (res.status === 401) {
    const body = (await res.clone().json().catch(() => ({}))) as { error?: string };
    if (body.error === "Invalid token" || body.error === "Unauthorized") {
      const { data } = await supabase.auth.refreshSession();
      if (data.session?.access_token) {
        token = data.session.access_token;
        res = await callEdgeFunction(token, name, init);
      }
    }
  }

  return res;
}

export function formatEdgeError(status: number, body: { error?: string; message?: string }): string {
  if (body.error === "Invalid token") {
    return "Session expired — sign out, then sign in again.";
  }
  return body.error ?? body.message ?? `Request failed (HTTP ${status})`;
}
