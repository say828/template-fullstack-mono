import path from "node:path";

import { defineConfig } from "vite";

const rootDir = __dirname;
const resolveFromRoot = (...segments: string[]) => path.resolve(rootDir, ...segments);

export default defineConfig({
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
    port: 5174,
    allowedHosts: ["admin.dev.example.com", "admin.example.com", ".example.com", "localhost", "127.0.0.1"],
  },
  preview: {
    host: "0.0.0.0",
    port: 4174,
  },
});
