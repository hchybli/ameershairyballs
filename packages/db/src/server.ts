import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.js";

export type BackstopServiceClient = SupabaseClient<Database>;

let serviceClient: BackstopServiceClient | null = null;

/** Server-only client (service role). Bypasses RLS — never import in browser bundles. */
export function createServiceClient(): BackstopServiceClient {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  return Boolean(url && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
