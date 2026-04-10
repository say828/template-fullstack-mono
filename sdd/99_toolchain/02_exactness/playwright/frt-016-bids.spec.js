import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const RESULTS_DIR = path.resolve(ROOT, "sdd/99_toolchain/02_exactness/results");

const API_BASE_URL = process.env.API_BASE_URL || "http://127.0.0.1:8000/api/v1";
const SELLER_EMAIL = process.env.E2E_SELLER_EMAIL || "sl@template.com";
const SELLER_PASSWORD = process.env.E2E_SELLER_PASSWORD || "test1234";

function parseAmountText(text) {
  const sanitized = text.replace(/[^0-9.-]/g, "");
  const value = Number.parseInt(sanitized, 10);
  return Number.isNaN(value) ? 0 : value;
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

async function findVehicleWithBids(request, token) {
  const list = await request.get(`${API_BASE_URL}/vehicles/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(list.ok()).toBeTruthy();
  const vehicles = await list.json();
  expect(vehicles.length, "판매 차량이 존재해야 함").toBeGreaterThan(0);

  const target = vehicles[0];
  const bidResponse = await request.get(`${API_BASE_URL}/seller/vehicles/${target.id}/bids`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(bidResponse.ok()).toBeTruthy();
  const bids = await bidResponse.json();
  return { vehicleId: target.id, bids };
}

test("FRT_016 bid list page is aligned to screen requirements", async ({ page, request }) => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const token = await loginSeller(request);
  const { vehicleId, bids } = await findVehicleWithBids(request, token);

  await page.context().addInitScript((tokenValue) => {
    localStorage.setItem("template_access_token", tokenValue);
    sessionStorage.removeItem("template_session_access_token");
  }, token);

  await page.goto(`/seller/vehicles/${vehicleId}/bids`, { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "입찰 현황" })).toBeVisible();
  await expect(page.getByRole("link", { name: "차량 상세 보기" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "딜러명" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "입찰가" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "입찰 시간" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "국가" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "비고" })).toBeVisible();
  await expect(page.getByText("입찰 관리 패널")).toBeVisible();

  await expect(page.getByText("새 입찰 알림 받기")).toBeVisible();
  await expect(page.getByText("최고가 자동 갱신 알림")).toBeVisible();
  await expect(page.getByRole("button", { name: "새 입찰 알림 토글" })).toBeVisible();
  await expect(page.getByRole("button", { name: "최고가 자동 갱신 알림 토글" })).toBeVisible();

  const newestBadge = page.getByText("Highest");
  const rows = page.locator("tbody tr");

  if (await rows.count() > 0) {
    await expect(newestBadge.first()).toBeVisible();
    const firstAmount = parseAmountText((await rows.first().locator("td").nth(1).innerText()).trim());
    if ((await rows.count()) > 1) {
      const secondAmount = parseAmountText((await rows.nth(1).locator("td").nth(1).innerText()).trim());
      expect(firstAmount, "최고 입찰가 기준 내림차순 정렬").toBeGreaterThanOrEqual(secondAmount);
    }
  } else if (bids.length > 0) {
    expect(rows).toHaveCount(bids.length);
  } else {
    await expect(page.getByText("조건에 맞는 입찰 내역이 없습니다.")).toBeVisible();
  }

  if (await page.getByText("더 보기 +").count() > 0) {
    const nextBidCount = await rows.count();
    await page.getByRole("button", { name: "새 입찰 알림 토글" }).click();
    await page.getByRole("button", { name: "최고가 자동 갱신 알림 토글" }).click();
    await page.getByRole("button", { name: "새 입찰 알림 토글" }).click();
    await page.getByRole("button", { name: "최고가 자동 갱신 알림 토글" }).click();
    await page.getByText("더 보기 +").click();
    await page.waitForTimeout(200);
    expect(await rows.count()).toBeGreaterThan(nextBidCount);
  }

  await expect(page.getByRole("heading", { name: "입찰 현황" })).toBeVisible();
  await expect(page.getByRole("link", { name: "차량 상세 보기" })).toBeVisible();

  await page.getByRole("link", { name: "차량 상세 보기" }).click();
  await expect(page).toHaveURL(new RegExp(`/seller/vehicles/${vehicleId}(\\?|$)`));
  await expect(page.getByRole("heading", { name: "차량 상세 정보" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/seller/vehicles/${vehicleId}/bids(\\?|$)`));

  await page.screenshot({
    path: path.resolve(RESULTS_DIR, `frt-016-bids-playwright.png`),
    fullPage: true,
  });
});
