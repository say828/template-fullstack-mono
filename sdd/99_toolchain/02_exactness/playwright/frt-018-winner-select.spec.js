import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const RESULTS_DIR = path.resolve(ROOT, "sdd/99_toolchain/02_exactness/results");

const API_BASE_URL = process.env.API_BASE_URL || "http://127.0.0.1:8000/api/v1";
const SELLER_EMAIL = process.env.E2E_SELLER_EMAIL || "sl@template.com";
const SELLER_PASSWORD = process.env.E2E_SELLER_PASSWORD || "test1234";

async function findWinnerSelectionVehicleId(request, token) {
  const response = await request.get(`${API_BASE_URL}/vehicles/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
  const vehicles = await response.json();
  const candidate = vehicles.find((row) => row.status === "ACTIVE" && new Date(row.bidding_ends_at).getTime() <= Date.now());
  expect(candidate).toBeTruthy();
  return candidate.id;
}

function formatCurrency(value, currency = "KRW") {
  return currency === "KRW" ? `${Math.round(value).toLocaleString()}원` : `${Math.round(value).toLocaleString()} ${currency}`;
}

async function loginSeller(request) {
  const login = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email: SELLER_EMAIL, password: SELLER_PASSWORD, role: "SELLER" },
  });
  expect(login.ok()).toBeTruthy();
  const payload = await login.json();
  expect(payload.access_token).toBeTruthy();
  return payload.access_token;
}

test("FRT_018 winner selection summary and selection flow match the screen spec", async ({ page, request }) => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const token = await loginSeller(request);
  const vehicleId = process.env.FRT_018_VEHICLE_ID || (await findWinnerSelectionVehicleId(request, token));
  const detailResponse = await request.get(`${API_BASE_URL}/seller/vehicles/${vehicleId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(detailResponse.ok()).toBeTruthy();
  const detail = await detailResponse.json();

  const bidsResponse = await request.get(`${API_BASE_URL}/seller/vehicles/${vehicleId}/bids`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(bidsResponse.ok()).toBeTruthy();
  const bids = await bidsResponse.json();
  expect(Array.isArray(bids)).toBeTruthy();
  expect(bids.length).toBeGreaterThan(0);

  const sorted = [...bids].sort((left, right) => right.amount - left.amount);
  const target = sorted[sorted.length - 1];
  const highest = sorted[0];

  await page.context().addInitScript((tokenValue) => {
    localStorage.setItem("template_access_token", tokenValue);
    sessionStorage.removeItem("template_session_access_token");
  }, token);

  await page.goto(`/seller/vehicles/${vehicleId}/winner`, { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "입찰자 선택" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "입찰자 목록" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "선택 정보 요약" })).toBeVisible();
  await expect(page.getByRole("link", { name: "차량 상세 보기" })).toHaveAttribute(
    "href",
    `/seller/vehicles/${vehicleId}/detail/closed`,
  );
  await expect(page.locator("p.text-\\[28px\\]").first()).toHaveText(detail.title);
  await expect(page.getByText(`${sorted.length}건`)).toBeVisible();
  await expect(page.getByRole("button", { name: "선택 완료하기" })).toBeDisabled();

  const selectButtons = page.getByRole("button", { name: "이 딜러 선택" });
  expect(await selectButtons.count()).toBeGreaterThan(0);
  const selectedTargetButton = selectButtons.last();
  await selectedTargetButton.click();

  await expect(page.getByRole("button", { name: "선택됨" })).toBeVisible();
  await expect(page.getByText(target.dealer_name).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "선택 완료하기" })).toBeEnabled();

  await page.screenshot({
    path: path.resolve(RESULTS_DIR, "frt-018-winner-select-playwright.png"),
    fullPage: true,
  });
});
