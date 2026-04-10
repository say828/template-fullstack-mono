import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["*.spec.js"],
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    ...devices["iPhone 13"],
    baseURL: process.env.BASE_URL ?? "http://127.0.0.1:4302",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
