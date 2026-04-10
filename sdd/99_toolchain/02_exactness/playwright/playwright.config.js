import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  use: {
    browserName: "chromium",
    channel: "chrome",
    baseURL: process.env.BASE_URL || "http://127.0.0.1:3003",
    viewport: { width: 1440, height: 1100 },
    launchOptions: {
      args: ["--no-sandbox"],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
