import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";


const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const RESULTS_DIR = path.join(ROOT, "sdd/99_toolchain/02_exactness/results");
const GOLDEN_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "golden");
const STORAGE_KEY = "mobile.auth.token";

const authToken = {
  access_token: "exactness-token",
  token_type: "bearer",
  user_id: "mobile-exactness",
};

const authUser = {
  id: "mobile-exactness",
  name: "Template Mobile Operator",
  email: "operator@example.com",
  role: "operator",
  status: "active",
};

const fulfillmentOverview = {
  throughput_total: "128",
  stats: [
    { label: "Open tasks", value: "18", tone: "success" },
    { label: "Blocked", value: "3", tone: "warning" },
    { label: "Outbound ready", value: "27", tone: "info" },
  ],
  timeline: [
    { time: "08:00", title: "Packing 시작", tone: "success" },
    { time: "10:30", title: "Exception review", tone: "warning" },
    { time: "13:10", title: "Outbound ready", tone: "info" },
  ],
  stage_load: [
    { label: "Picking", value: "42" },
    { label: "Packing", value: "31" },
    { label: "Dispatch", value: "18" },
  ],
};

const fulfillmentBoard = {
  tasks: [
    { id: "1", order_id: "ORD-1001", title: "Carrier label review", assignee: "Mina", stage: "Packing", status: "In progress", priority: "P1", sla: "20m" },
    { id: "2", order_id: "ORD-1002", title: "Outbox confirmation", assignee: "Joon", stage: "Dispatch", status: "Blocked", priority: "P2", sla: "35m" },
  ],
  notes: [
    { id: "n1", note: "오늘 출고 전 SLA가 빠르게 줄어들고 있다.", emphasis: "warning" },
  ],
};

const shippingOverview = {
  stats: [
    { label: "In transit", value: "18", tone: "info" },
    { label: "Delayed", value: "4", tone: "warning" },
    { label: "Delivered", value: "72", tone: "success" },
  ],
  carriers: [
    { label: "Carrier A", value: "31" },
    { label: "Carrier B", value: "26" },
  ],
  highlighted_route: "Seoul -> Daejeon",
};

const shipments = [
  {
    shipment_id: "SHP-1001",
    order_id: "ORD-1001",
    carrier: "Carrier A",
    destination: "Seoul",
    tracking_number: "TRK-1001",
    status: "In transit",
    eta: "2026.03.14 18:40",
    last_event: "센터 출발",
  },
  {
    shipment_id: "SHP-1002",
    order_id: "ORD-1002",
    carrier: "Carrier B",
    destination: "Busan",
    tracking_number: "TRK-1002",
    status: "Delayed",
    eta: "2026.03.14 20:10",
    last_event: "재배차 대기",
  },
];

async function ensureScreenshot(page, name) {
  await fs.mkdir(RESULTS_DIR, { recursive: true });
  await fs.mkdir(GOLDEN_DIR, { recursive: true });
  const actualPath = path.join(RESULTS_DIR, `${name}.png`);
  const goldenPath = path.join(GOLDEN_DIR, `${name}.png`);
  const buffer = await page.screenshot({ fullPage: true });
  await fs.writeFile(actualPath, buffer);
  try {
    await fs.access(goldenPath);
  } catch {
    await fs.writeFile(goldenPath, buffer);
    return;
  }

  const [actualBuffer, goldenBuffer] = await Promise.all([fs.readFile(actualPath), fs.readFile(goldenPath)]);
  const actual = PNG.sync.read(actualBuffer);
  const golden = PNG.sync.read(goldenBuffer);
  expect(actual.width).toBe(golden.width);
  expect(actual.height).toBe(golden.height);
  const diff = new PNG({ width: actual.width, height: actual.height });
  const mismatch = pixelmatch(actual.data, golden.data, diff.data, actual.width, actual.height, { threshold: 0.12 });
  if (mismatch > 0) {
    await fs.writeFile(path.join(RESULTS_DIR, `${name}.diff.png`), PNG.sync.write(diff));
  }
  expect(mismatch, `${name} screenshot mismatch`).toBe(0);
}

async function seedProtectedRoute(page) {
  await page.addInitScript(({ storageKey, token }) => {
    window.localStorage.setItem(storageKey, JSON.stringify(token));
  }, { storageKey: STORAGE_KEY, token: authToken });
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authUser),
    });
  });
}

async function mockOverviewApis(page) {
  await seedProtectedRoute(page);
  await page.route("**/api/fulfillment/overview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fulfillmentOverview),
    });
  });
  await page.route("**/api/fulfillment/board", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fulfillmentBoard),
    });
  });
}

async function mockShippingApis(page) {
  await seedProtectedRoute(page);
  await page.route("**/api/shipping/overview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(shippingOverview),
    });
  });
  await page.route("**/api/shipping/shipments", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(shipments),
    });
  });
  await page.route("**/api/shipping/shipments/*/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        shipment_id: "SHP-1001",
        previous_status: "In transit",
        status: "Delivered",
        previous_last_event: "센터 출발",
        last_event: "고객 인수 완료",
      }),
    });
  });
}

test("mobile login visual baseline", async ({ page }) => {
  await page.goto("/login", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "상담 흐름과 운영 상태를 동시에 여는 로그인 템플릿" })).toBeVisible();
  await expect(page.getByText("operator@example.com")).toBeVisible();
  await ensureScreenshot(page, "mobile-login");
});

test("mobile dashboard visual baseline", async ({ page }) => {
  await mockOverviewApis(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "주문 이행 상태와 예외 대응을 한 화면에서 이어붙이는 모바일 셸" })).toBeVisible();
  await expect(page.getByText("128 units")).toBeVisible();
  await ensureScreenshot(page, "mobile-dashboard");
});

test("mobile fulfillment visual baseline", async ({ page }) => {
  await mockOverviewApis(page);
  await page.goto("/fulfillment", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Fulfillment board" })).toBeVisible();
  await expect(page.getByText("ORD-1001")).toBeVisible();
  await ensureScreenshot(page, "mobile-fulfillment");
});

test("mobile shipping visual baseline", async ({ page }) => {
  await mockShippingApis(page);
  await page.goto("/shipping", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Shipping operations" })).toBeVisible();
  await expect(page.getByText("SHP-1001")).toBeVisible();
  await ensureScreenshot(page, "mobile-shipping");
});
