import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const RESULTS_DIR = path.resolve(ROOT, "sdd/99_toolchain/02_exactness/results");

const API_BASE_URL = process.env.API_BASE_URL || "http://127.0.0.1:8000/api/v1";
const SELLER_EMAIL = process.env.E2E_SELLER_EMAIL || "sl@template.com";
const SELLER_PASSWORD = process.env.E2E_SELLER_PASSWORD || "test1234";

async function loginSeller(request) {
  const login = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email: SELLER_EMAIL, password: SELLER_PASSWORD, role: "SELLER" },
  });
  expect(login.ok()).toBeTruthy();
  const payload = await login.json();
  expect(payload.access_token).toBeTruthy();
  return payload.access_token;
}

async function findInspectionVehicle(request, token) {
  const response = await request.get(`${API_BASE_URL}/vehicles/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
  const vehicles = await response.json();
  const candidate = vehicles.find((row) => row.lifecycle_state === "INSPECTION");
  expect(candidate).toBeTruthy();
  return candidate.id;
}

test("FRT_019 inspection pending detail page aligns with screen spec shell", async ({ page, request }) => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const token = await loginSeller(request);
  const vehicleId = process.env.FRT_019_VEHICLE_ID || (await findInspectionVehicle(request, token));

  const detailResponse = await request.get(`${API_BASE_URL}/seller/vehicles/${vehicleId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(detailResponse.ok()).toBeTruthy();
  const detail = await detailResponse.json();

  const workflowResponse = await request.get(`${API_BASE_URL}/seller/vehicles/${vehicleId}/trade-workflow`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(workflowResponse.ok()).toBeTruthy();
  const workflow = await workflowResponse.json();

  await page.context().addInitScript((tokenValue) => {
    localStorage.setItem("template_access_token", tokenValue);
    sessionStorage.removeItem("template_session_access_token");
  }, token);

  await page.goto(`/seller/vehicles/${vehicleId}/detail/inspection-pending`, { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "차량 상세 정보" })).toBeVisible();
  await expect(page.getByText("검차 진행 현황")).toBeVisible();
  await expect(page.getByText("차량 기본 정보")).toBeVisible();
  await expect(page.getByText("차량 사진 및 옵션")).toBeVisible();
  await expect(page.getByText("거래 진행 단계")).toBeVisible();
  await expect(page.getByText("최근 활동")).toBeVisible();
  await expect(page.getByText(detail.title).first()).toBeVisible();
  await expect(page.getByText("검차", { exact: true }).first()).toBeVisible();

  await expect(page.locator("section").getByText(workflow.dealer_name || "-", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(workflow.inspection_location || "-")).toBeVisible();

  const inspectionButton = page.getByRole("button", { name: "검차 일정 확인" });
  if (workflow.inspection_scheduled_at || workflow.inspection_location) {
    await expect(inspectionButton).toBeVisible();
    await inspectionButton.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "검차 일정 정보" })).toBeVisible();
    await expect(dialog.getByText(workflow.inspection_location || "-", { exact: true })).toBeVisible();
  } else {
    await expect(inspectionButton).toBeDisabled();
  }

  await page.screenshot({
    path: path.resolve(RESULTS_DIR, "frt-019-inspection-pending-playwright.png"),
    fullPage: true,
  });
});
