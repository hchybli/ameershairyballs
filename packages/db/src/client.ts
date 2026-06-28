import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

export type BackstopSupabaseClient = SupabaseClient<Database>;

let browserClient: BackstopSupabaseClient | null = null;

function readEnv(key: string): string | undefined {
  if (typeof import.meta !== "undefined") {
    const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    if (viteEnv?.[key]) {
      return viteEnv[key];
    }
  }

  return process.env[key];
}

/** Browser / Vite client — publishable key only. Never use service role here. */
export function createBrowserClient(): BackstopSupabaseClient {
  const url = readEnv("VITE_SUPABASE_URL");
  const key = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (!url || !key) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.",
    );
  }

  if (!browserClient) {
    browserClient = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return browserClient;
}

export function isBrowserClientConfigured(): boolean {
  return Boolean(readEnv("VITE_SUPABASE_URL") && readEnv("VITE_SUPABASE_PUBLISHABLE_KEY"));
}
