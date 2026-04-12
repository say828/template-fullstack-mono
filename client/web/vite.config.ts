import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = __dirname;
const resolveFromRoot = (...segments: string[]) => path.resolve(rootDir, ...segments);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: resolveFromRoot("node_modules/react"),
      "react-dom": resolveFromRoot("node_modules/react-dom"),
      "react/jsx-runtime": resolveFromRoot("node_modules/react/jsx-runtime.js"),
      "react/jsx-dev-runtime": resolveFromRoot("node_modules/react/jsx-dev-runtime.js"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: ["localhost", "127.0.0.1"],
    proxy: {
      "/api/v1": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
