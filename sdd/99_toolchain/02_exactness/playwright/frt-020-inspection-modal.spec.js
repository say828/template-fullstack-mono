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

test("FRT_020 inspection modal aligns with screen spec shell", async ({ page, request }) => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const token = await loginSeller(request);
  const vehicleId = process.env.FRT_020_VEHICLE_ID || (await findInspectionVehicle(request, token));

  const workflowResponse = await request.get(`${API_BASE_URL}/seller/vehicles/${vehicleId}/trade-workflow`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(workflowResponse.ok()).toBeTruthy();
  const workflow = await workflowResponse.json();

  await page.context().addInitScript((tokenValue) => {
    localStorage.setItem("template_access_token", tokenValue);
    sessionStorage.removeItem("template_session_access_token");
  }, token);

  await page.goto(`/seller/vehicles/${vehicleId}/inspection`, { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "검차 일정 정보" })).toBeVisible();
  await expect(page.getByText("평가사가 아래와 같이 검차 일정을 제안했습니다.")).toBeVisible();
  await expect(page.getByText(workflow.inspection_assignee || "-", { exact: true })).toBeVisible();
  await expect(page.getByText(workflow.inspection_location || "-", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "다른 일정 요청" })).toBeVisible();
  await expect(page.getByRole("button", { name: "일정 승인하기" })).toBeVisible();
  await expect(page.getByText("검차 진행 안내")).toBeVisible();

  await page.screenshot({
    path: path.resolve(RESULTS_DIR, "frt-020-inspection-modal-playwright.png"),
    fullPage: true,
  });
});
