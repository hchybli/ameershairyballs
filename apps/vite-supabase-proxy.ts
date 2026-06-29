import type { ProxyOptions } from "vite";

/** Same-origin proxy for Supabase edge functions during Vite dev (avoids browser CORS). */
export function supabaseFunctionProxy(supabaseUrl: string): Record<string, ProxyOptions> | undefined {
  if (!supabaseUrl) {
    return undefined;
  }

  return {
    "/supabase-functions": {
      target: supabaseUrl,
      changeOrigin: true,
      secure: true,
      rewrite: (requestPath) => requestPath.replace(/^\/supabase-functions/, "/functions/v1"),
      configure: (proxy) => {
        proxy.on("proxyReq", (proxyReq, req) => {
          const auth = req.headers.authorization;
          if (auth) {
            proxyReq.setHeader("Authorization", auth);
          }
          const apikey = req.headers.apikey;
          if (apikey) {
            proxyReq.setHeader("apikey", apikey);
          }
        });
      },
    },
  };
}
