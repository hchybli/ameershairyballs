import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { supabaseFunctionProxy } from "../vite-supabase-proxy.ts";

const ROOT = path.resolve(__dirname, "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ROOT, "");
  const supabaseUrl = env.VITE_SUPABASE_URL;

  return {
    plugins: [react()],
    envDir: ROOT,
    resolve: {
      alias: {
        "@backstop/db": path.resolve(ROOT, "packages/db/src/index.ts"),
        "@backstop/auth": path.resolve(ROOT, "packages/auth/src/index.ts"),
        "@backstop/api-client": path.resolve(ROOT, "packages/api-client/src/index.ts"),
        "@backstop/ui": path.resolve(ROOT, "packages/ui/src/index.ts"),
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      proxy: supabaseFunctionProxy(supabaseUrl),
    },
  };
});
