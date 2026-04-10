import { expect, test } from "@playwright/test";


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

test("mobile workspace full flow renders login and protected routes", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authToken),
    });
  });
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authUser),
    });
  });
  await page.route("**/api/fulfillment/overview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        throughput_total: "128",
        stats: [
          { label: "Open tasks", value: "18", tone: "success" },
          { label: "Blocked", value: "3", tone: "warning" },
          { label: "Outbound ready", value: "27", tone: "info" },
        ],
        timeline: [
          { time: "08:00", title: "Packing 시작", tone: "success" },
        ],
        stage_load: [{ label: "Picking", value: "42" }],
      }),
    });
  });
  await page.route("**/api/fulfillment/board", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        tasks: [
          { id: "1", order_id: "ORD-1001", title: "Carrier label review", assignee: "Mina", stage: "Packing", status: "In progress", priority: "P1", sla: "20m" },
        ],
        notes: [{ id: "n1", note: "오늘 출고 전 SLA가 빠르게 줄어들고 있다.", emphasis: "warning" }],
      }),
    });
  });
  await page.route("**/api/shipping/overview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        stats: [{ label: "In transit", value: "18", tone: "info" }],
        carriers: [{ label: "Carrier A", value: "31" }],
        highlighted_route: "Seoul -> Daejeon",
      }),
    });
  });
  await page.route("**/api/shipping/shipments", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
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
      ]),
    });
  });
  await page.addInitScript(({ storageKey, token }) => {
    window.localStorage.setItem(storageKey, JSON.stringify(token));
  }, { storageKey: STORAGE_KEY, token: authToken });

  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("operator@example.com");
  await page.getByLabel("Password").fill("secret");
  await page.getByRole("button", { name: "Continue to IN" }).click();
  await expect(page.getByRole("heading", { name: "주문 이행 상태와 예외 대응을 한 화면에서 이어붙이는 모바일 셸" })).toBeVisible();

  await page.getByRole("link", { name: "Fulfillment" }).click();
  await expect(page.getByRole("heading", { name: "Fulfillment board" })).toBeVisible();

  await page.goto("/shipping", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Shipping operations" })).toBeVisible();
});
