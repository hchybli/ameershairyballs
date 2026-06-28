import { createClient } from "npm:@supabase/supabase-js@2";
import { parseAppMetadata } from "../../../packages/auth/src/session.ts";
import type { HandlerAuth } from "../../../packages/handlers/src/types.ts";

export function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing Supabase env vars.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAuth(req: Request): Promise<{ ok: true; auth: HandlerAuth } | { ok: false; response: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized", code: "FORBIDDEN" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const token = authHeader.slice("Bearer ".length);
  const admin = createAdminClient();
  const { data, error } = await admin.auth.getUser(token);

  if (error || !data.user) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Invalid token", code: "FORBIDDEN" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const meta = parseAppMetadata(data.user.app_metadata);
  if (!meta) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Missing app metadata", code: "FORBIDDEN" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return {
    ok: true,
    auth: {
      userId: data.user.id,
      tenantId: meta.tenantId,
      clinicId: meta.clinicId,
      role: meta.role,
    },
  };
}
