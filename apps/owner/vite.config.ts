import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, "../.."),
  resolve: {
    alias: {
      "@backstop/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
      "@backstop/auth": path.resolve(__dirname, "../../packages/auth/src/index.ts"),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
