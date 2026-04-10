import path from "node:path";

import { ensureDirectory } from "./paths.mjs";

export function sanitizeFileName(raw) {
  return String(raw || "screen")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

export async function captureScreen({
  browser,
  screen,
  adapter,
  outputPath,
  baseUrl,
  viewport,
}) {
  ensureDirectory(path.dirname(outputPath));
  const page = await browser.newPage({ viewport });
  try {
    if (typeof adapter.preparePage === "function") {
      await adapter.preparePage(page, { route: screen.route, screen, baseUrl, viewport });
    }
    if (typeof adapter.beforeNavigate === "function") {
      await adapter.beforeNavigate(page, { route: screen.route, screen, baseUrl, viewport });
    }
    const targetUrl = new URL(screen.route, baseUrl).toString();
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    if (screen.readySelector) {
      await page.waitForSelector(screen.readySelector, {
        timeout: Number.isFinite(Number(screen.readyTimeoutMs)) ? Number(screen.readyTimeoutMs) : 10000,
      });
    }
    if (typeof adapter.waitForReady === "function") {
      await adapter.waitForReady(page, { route: screen.route, screen, baseUrl, viewport });
    }
    if (typeof adapter.afterPageReady === "function") {
      await adapter.afterPageReady(page, { route: screen.route, screen, baseUrl, viewport });
    }
    await page.screenshot({
      path: outputPath,
      fullPage: Boolean(screen.captureFullPage ?? false),
    });
    return {
      targetUrl,
      status: "captured",
      detail: "capture_ok",
    };
  } finally {
    await page.close();
  }
}
