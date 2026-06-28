import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type BackstopServiceClient = SupabaseClient<Database>;

let serviceClient: BackstopServiceClient | null = null;

function readEnv(key: string): string | undefined {
  const deno = (globalThis as { Deno?: { env: { get: (name: string) => string | undefined } } }).Deno;
  if (deno) {
    return deno.env.get(key);
  }
  return process.env[key];
}

/** Server-only client (service role). Bypasses RLS — never import in browser bundles. */
export function createServiceClient(): BackstopServiceClient {
  const url = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Required for seed/scripts only.",
    );
  }

  if (!serviceClient) {
    serviceClient = createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serviceClient;
}

export function isServiceClientConfigured(): boolean {
  const url = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  return Boolean(url && readEnv("SUPABASE_SERVICE_ROLE_KEY"));
}
