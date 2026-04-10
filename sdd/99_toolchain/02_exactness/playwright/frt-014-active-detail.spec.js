import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const RESULTS_DIR = path.resolve(ROOT, "sdd/99_toolchain/02_exactness/results");

const API_BASE_URL = process.env.API_BASE_URL || "http://127.0.0.1:8000/api/v1";
const SELLER_EMAIL = process.env.E2E_SELLER_EMAIL || "sl@template.com";
const SELLER_PASSWORD = process.env.E2E_SELLER_PASSWORD || "test1234";

function fuelLabel(value) {
  if (value === "GASOLINE") return "가솔린";
  if (value === "DIESEL") return "디젤";
  if (value === "HYBRID") return "하이브리드";
  if (value === "EV") return "전기";
  return "미등록";
}

function transmissionLabel(value) {
  if (value === "AUTO") return "자동변속기";
  if (value === "MANUAL") return "수동변속기";
  if (value === "DCT") return "DCT";
  return "미등록";
}

function canEditNow(detail) {
  if (detail.status !== "ACTIVE") return false;
  if (!detail.bidding_started_at) return true;
  const startedAt = new Date(detail.bidding_started_at).getTime();
  if (Number.isNaN(startedAt)) return true;
  return Date.now() < startedAt;
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

async function findActiveVehicle(request, token) {
  const list = await request.get(`${API_BASE_URL}/vehicles/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(list.ok()).toBeTruthy();
  const vehicles = await list.json();

  const active = vehicles.find((vehicle) => vehicle.status === "ACTIVE");
  expect(active, "ACTIVE 차량이 존재해야 함").toBeTruthy();
  expect(active.id, "ACTIVE 차량 상세 id가 있어야 함").toBeTruthy();
  return active.id;
}

async function getVehicleDetail(request, token, vehicleId) {
  const detailResponse = await request.get(`${API_BASE_URL}/seller/vehicles/${vehicleId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(detailResponse.ok()).toBeTruthy();
  return detailResponse.json();
}

test("FRT_014 active detail page aligns with screen spec and live runtime shell", async ({ page, request }) => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const token = await loginSeller(request);
  const vehicleId = await findActiveVehicle(request, token);
  const detail = await getVehicleDetail(request, token, vehicleId);

  await page.context().addInitScript((tokenValue) => {
    localStorage.setItem("template_access_token", tokenValue);
    sessionStorage.removeItem("template_session_access_token");
  }, token);

  await page.goto(`/seller/vehicles/${vehicleId}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "차량 상세 정보" })).toBeVisible();
  await expect(page.getByText("입찰 진행 현황")).toBeVisible();
  await expect(page.getByText("차량 기본 정보")).toBeVisible();
  await expect(page.getByText("차량 사진 및 옵션")).toBeVisible();
  await expect(page.getByText("거래 진행 단계")).toBeVisible();
  await expect(page.getByText("최근 활동")).toBeVisible();
  await expect(page.getByText("입찰 현황 보기")).toBeVisible();

  const expectedEditVisible = canEditNow(detail);
  const editLink = page.getByRole("link", { name: "차량 정보 수정" });
  if (expectedEditVisible) {
    await expect(editLink).toBeVisible();
    await expect(editLink).toHaveAttribute("href", `/seller/vehicles/${vehicleId}/edit`);
    await expect(editLink.locator("svg")).toBeVisible();
  } else {
    await expect(editLink).toHaveCount(0);
  }

  const biddingSummary = page.getByRole("heading", { name: "입찰 진행 현황" });
  const basicsHeading = page.getByRole("heading", { name: "차량 기본 정보" });
  const photosHeading = page.getByRole("heading", { name: "차량 사진 및 옵션" });
  const tradeHeading = page.getByRole("heading", { name: "거래 진행 단계" });
  const recentHeading = page.getByRole("heading", { name: "최근 활동" });

  const [heroBox, biddingBox, basicsBox, photosBox, tradeBox, recentBox] = await Promise.all([
    page.locator("section img").first().boundingBox(),
    biddingSummary.boundingBox(),
    basicsHeading.boundingBox(),
    photosHeading.boundingBox(),
    tradeHeading.boundingBox(),
    recentHeading.boundingBox(),
  ]);

  expect(heroBox && biddingBox && basicsBox && photosBox && tradeBox && recentBox).toBeTruthy();
  expect(biddingBox.y).toBeGreaterThanOrEqual(heroBox.y - 40);
  expect(basicsBox.y).toBeGreaterThanOrEqual(Math.min(heroBox.y, biddingBox.y));
  expect(photosBox.y).toBeGreaterThanOrEqual(basicsBox.y);
  expect(tradeBox.y).toBeGreaterThanOrEqual(photosBox.y);
  expect(recentBox.y).toBeGreaterThanOrEqual(tradeBox.y);

  await expect(page.getByText("입찰중")).toBeVisible();
  await expect(page.getByText(/국내 거래|해외\(수출\)|수출 가능/).first()).toBeVisible();
  await expect(page.getByText(`${detail.year}년식`)).toBeVisible();
  await expect(page.getByText(`${detail.make}`)).toBeVisible();
  await expect(page.getByText(`${detail.model}`)).toBeVisible();
  await expect(page.getByText(fuelLabel(detail.fuel_type))).toBeVisible();
  await expect(page.getByText(transmissionLabel(detail.transmission))).toBeVisible();

  const firstPhoto = page.locator("button.h-20.min-w-\\[112px\\]").first();
  if (await firstPhoto.count() > 0) {
    await firstPhoto.click();
    await expect(page.getByRole("button", { name: "닫기" })).toBeVisible();
    await expect(page.getByRole("button", { name: "이전 이미지" })).toBeVisible();
    await expect(page.getByRole("button", { name: "다음 이미지" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "닫기" })).toBeHidden();
  }

  const galleryLink = page.getByRole("link", { name: /^\+\d+장 더보기$/ });
  if ((await galleryLink.count()) > 0) {
    await galleryLink.click();
    await expect(page).toHaveURL(new RegExp(`/seller/vehicles/${vehicleId}/images`));
    await expect(page.getByRole("button", { name: "이전 이미지" })).toBeVisible();
    await expect(page.getByRole("button", { name: "다음 이미지" })).toBeVisible();
    await expect(page.getByRole("button", { name: "닫기" })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/seller/vehicles/${vehicleId}(\\?|$)`));
  }

  await expect(page.getByText("입찰 현황 보기")).toBeVisible();
  await page.getByRole("link", { name: "입찰 현황 보기" }).click();
  await expect(page).toHaveURL(new RegExp(`/seller/vehicles/${vehicleId}/bids`));
  await expect(page.getByRole("heading", { name: /입찰 현황|입찰자 선택/ })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/seller/vehicles/${vehicleId}(\\?|$)`));

  await expect(page.getByText("차량 기본 정보")).toBeVisible();
  await expect(page.getByText("차량 사진 및 옵션")).toBeVisible();
  await page.screenshot({
    path: path.resolve(RESULTS_DIR, `frt-014-active-detail-playwright.png`),
    fullPage: true,
  });
});
