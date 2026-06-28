function readEnv(key: string): string | undefined {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  return viteEnv?.[key];
}

function supabaseUrl(): string {
  const url = readEnv("VITE_SUPABASE_URL");
  if (!url) {
    throw new Error("Missing VITE_SUPABASE_URL");
  }
  return url.replace(/\/$/, "");
}

export function edgeFunctionUrl(name: string): string {
  return `${supabaseUrl()}/functions/v1/${name}`;
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

  return fetch(edgeFunctionUrl(name), {
    ...init,
    headers,
  });
}
