import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const screens = JSON.parse(
  fs.readFileSync(path.resolve(scriptDir, "../src/lib/specScreens.json"), "utf8"),
);
const routes = JSON.parse(
  fs.readFileSync(path.resolve(scriptDir, "../src/lib/specRouteCatalog.json"), "utf8"),
);

const routeMap = new Map(routes.map((entry) => [entry.id, entry.route]));

export default {
  service: "template-fullstack-mono-admin",
  targetBaseUrl: "http://127.0.0.1:4174",
  viewport: {
    width: 1440,
    height: 1024,
  },
  screens: screens.map((screen) => ({
    id: screen.id,
    title: screen.title,
    route: routeMap.get(screen.id) ?? "/login",
    referenceImage: `sdd/03_verify/10_test/ui_parity/reference/${screen.id}.png`,
    readySelector: "body",
    readyTimeoutMs: 10000,
    tags: ["template", "admin"],
  })),
  async waitForReady(page) {
    await page.waitForLoadState("networkidle");
  },
  async resolveMaskRects() {
    return [];
  },
};
