#!/usr/bin/env node

import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const VIEWPORT = { width: 1690, height: 940 };
const require = createRequire(import.meta.url);

function loadPlaywright() {
  const resolutionRoots = [
    ROOT,
    path.join(ROOT, "client/platform"),
    path.join(ROOT, "client/admin"),
    path.join(ROOT, "client/mobile"),
    path.join(ROOT, "client/web"),
  ];

  for (const base of resolutionRoots) {
    try {
      const resolved = require.resolve("playwright", { paths: [base] });
      return require(resolved);
    } catch {
      // Try the next workspace root.
    }
  }

  throw new Error("Unable to resolve `playwright` from repo root or frontend workspaces.");
}

const { chromium } = loadPlaywright();

const manifests = {
  platform: {
    baseUrl: "http://127.0.0.1:3001",
    apiBase: "http://127.0.0.1:8000/api/v1",
    storageKey: "platform.auth.token",
    credentials: { email: "admin@example.com", password: "<CHANGE_ME>" },
    assetDir: path.join(ROOT, "sdd/99_toolchain/01_automation/assets/platform_screen_capture"),
    screens: [
      { route: "/login", asset: "login.png", requiresAuth: false },
      { route: "/", asset: "dashboard.png", requiresAuth: true },
      { route: "/orders", asset: "orders.png", requiresAuth: true },
    ],
  },
  admin: {
    baseUrl: "http://127.0.0.1:4000",
    apiBase: "http://127.0.0.1:8000/api/v1",
    storageKey: "admin.auth.token",
    credentials: { email: "admin@example.com", password: "<CHANGE_ME>" },
    assetDir: path.join(ROOT, "sdd/99_toolchain/01_automation/assets/admin_screen_capture"),
    screens: [
      { route: "/login", asset: "login.png", requiresAuth: false },
      { route: "/", asset: "dashboard.png", requiresAuth: true },
      { route: "/queue", asset: "queue.png", requiresAuth: true },
      { route: "/support", asset: "support.png", requiresAuth: true },
    ],
  },
  mobile: {
    baseUrl: "http://127.0.0.1:3002",
    apiBase: "http://127.0.0.1:8000/api/v1",
    storageKey: "mobile.auth.token",
    credentials: { email: "operator@example.com", password: "<CHANGE_ME>" },
    assetDir: path.join(ROOT, "sdd/99_toolchain/01_automation/assets/mobile_screen_capture"),
    screens: [
      { route: "/login", asset: "login.png", requiresAuth: false },
      { route: "/", asset: "dashboard.png", requiresAuth: true },
      { route: "/fulfillment", asset: "fulfillment.png", requiresAuth: true },
    ],
  },
  landing: {
    baseUrl: "http://127.0.0.1:3000",
    apiBase: "http://127.0.0.1:8000/api/v1",
    storageKey: "landing.auth.token",
    credentials: { email: "admin@example.com", password: "<CHANGE_ME>" },
    assetDir: path.join(ROOT, "sdd/99_toolchain/01_automation/assets/landing_screen_capture"),
    screens: [
      { route: "/", asset: "home.png", requiresAuth: false },
      { route: "/login", asset: "login.png", requiresAuth: false },
      { route: "/workspace", asset: "workspace.png", requiresAuth: true },
    ],
  },
};

async function login(apiBase, credentials) {
  const response = await fetch(`${apiBase}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    throw new Error(`login failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function captureService(service) {
  const manifest = manifests[service];
  if (!manifest) {
    throw new Error(`unknown service: ${service}`);
  }

  await fs.mkdir(manifest.assetDir, { recursive: true });
  const token = await login(manifest.apiBase, manifest.credentials);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });

  try {
    for (const screen of manifest.screens) {
      const page = await context.newPage();
      await page.addInitScript(
        ({ storageKey, accessToken, requiresAuth }) => {
          if (requiresAuth) {
            window.localStorage.setItem(storageKey, JSON.stringify(accessToken));
            return;
          }
          window.localStorage.removeItem(storageKey);
        },
        { storageKey: manifest.storageKey, accessToken: token, requiresAuth: screen.requiresAuth },
      );
      await page.goto(`${manifest.baseUrl}${screen.route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(manifest.assetDir, screen.asset),
        fullPage: true,
      });
      await page.close();
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  const service = process.argv[2];
  const targets = !service || service === "all" ? Object.keys(manifests) : [service];
  for (const target of targets) {
    await captureService(target);
    console.log(`captured: ${target}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
