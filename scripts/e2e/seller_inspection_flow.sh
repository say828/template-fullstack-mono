#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

BASE_URL="${SELLER_INSPECTION_BASE_URL:-http://127.0.0.1:5173}"
API_BASE_URL="${SELLER_INSPECTION_API_BASE_URL:-http://127.0.0.1:8000/api/v1}"
SELLER_EMAIL="${SELLER_INSPECTION_SELLER_EMAIL:-sl@template.com}"
SELLER_PASSWORD="${SELLER_INSPECTION_SELLER_PASSWORD:-test1234}"
PENDING_VEHICLE_ID="${SELLER_INSPECTION_PENDING_VEHICLE_ID:-31160e11-d3fa-4c09-8122-f6dba71cb842}"

TOKEN="$(
  curl -s -X POST "${API_BASE_URL}/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${SELLER_EMAIL}\",\"password\":\"${SELLER_PASSWORD}\",\"role\":\"SELLER\"}" \
    | jq -r '.access_token'
)"

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "seller login failed" >&2
  exit 1
fi

INITIAL_STATUS="$(
  curl -s "${API_BASE_URL}/seller/vehicles/${PENDING_VEHICLE_ID}/trade-workflow" \
    -H "Authorization: Bearer ${TOKEN}" \
    | jq -r '.inspection_status'
)"

if [[ "$INITIAL_STATUS" != "PROPOSED" ]]; then
  echo "pending vehicle must start in PROPOSED state; current=${INITIAL_STATUS}. reset seed state first (for example: docker compose restart server)." >&2
  exit 1
fi

cd "$ROOT_DIR/.codex/skills/dev-browser"

TOKEN="$TOKEN" \
BASE_URL="$BASE_URL" \
PENDING_VEHICLE_ID="$PENDING_VEHICLE_ID" \
npx tsx <<'EOF'
import { chromium } from "playwright";

const token = process.env.TOKEN;
const baseUrl = process.env.BASE_URL;
const vehicleId = process.env.PENDING_VEHICLE_ID;

if (token == null || token === "") throw new Error("missing TOKEN");
if (baseUrl == null || baseUrl === "") throw new Error("missing BASE_URL");
if (vehicleId == null || vehicleId === "") throw new Error("missing PENDING_VEHICLE_ID");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

page.on("response", async (res) => {
  const url = res.url();
  if (url.includes("/inspection/reschedule")) console.log("E2E_RESCHEDULE_STATUS", res.status());
  if (url.includes("/inspection/approve")) console.log("E2E_APPROVE_STATUS", res.status());
});

await page.goto(`${baseUrl}/`);
await page.evaluate((accessToken) => {
  localStorage.setItem("template_access_token", accessToken);
}, token);

await page.goto(`${baseUrl}/seller/vehicles/${vehicleId}/detail/inspection-pending`);
await page.waitForLoadState("networkidle");

await page.getByRole("button", { name: "검차 일정 확인" }).click();
await page.getByRole("button", { name: "다른 일정 요청" }).click();
await page.fill("#inspection-request-date", "2026-04-16");
await page.selectOption("#inspection-request-time", "10:00");
await page.fill("#inspection-request-region", "서울 강서구");
await page.fill("#inspection-request-note", "SDD E2E inspection reschedule");
await page.getByRole("button", { name: "요청 보내기" }).click();
await page.waitForTimeout(1200);

const rescheduleSuccessCopy = await page.locator("text=새로운 검차 일정을 요청했습니다.").count();
const rescheduleConfirmButtonCount = await page.getByRole("button", { name: "확인" }).count();
console.log("E2E_RESCHEDULE_SUCCESS_COPY_COUNT", rescheduleSuccessCopy);
console.log("E2E_RESCHEDULE_CONFIRM_BUTTON_COUNT", rescheduleConfirmButtonCount);
if (rescheduleSuccessCopy < 1 || rescheduleConfirmButtonCount < 1) {
  throw new Error("reschedule success modal missing");
}

await page.getByRole("button", { name: "확인" }).click();
await page.waitForTimeout(500);
const rescheduleAlerts = await page.locator('[role="alert"]').allTextContents();
console.log("E2E_RESCHEDULE_ALERTS", JSON.stringify(rescheduleAlerts));
if (rescheduleAlerts.some((text) => text.includes("다른 검차 일정을 요청했습니다.")) === false) {
  throw new Error("reschedule success alert missing");
}

await page.getByRole("button", { name: "검차 일정 확인" }).click();
await page.getByRole("button", { name: "일정 승인하기" }).click();
await page.waitForURL("**/detail/inspection-completed", { timeout: 10000 });
await page.getByText("검차 일정이 확정되었습니다.").waitFor({ timeout: 5000 });

const approvalAlerts = await page.locator('[role="alert"]').allTextContents();
console.log("E2E_APPROVAL_FINAL_URL", page.url());
console.log("E2E_APPROVAL_ALERTS", JSON.stringify(approvalAlerts));
if (page.url().includes("/detail/inspection-completed") === false) {
  throw new Error("approval did not navigate to inspection-completed");
}
if (approvalAlerts.some((text) => text.includes("검차 일정이 확정되었습니다.")) === false) {
  throw new Error("approval success alert missing");
}

await page.getByRole("button", { name: "검차 일정 확인" }).click();
await page.waitForTimeout(600);
const confirmedCopyCount = await page.locator("text=확정된 검차 일정을 다시 확인할 수 있습니다.").count();
const confirmedButtonCount = await page.getByRole("button", { name: "확인" }).count();
console.log("E2E_CONFIRMED_MODAL_COPY_COUNT", confirmedCopyCount);
console.log("E2E_CONFIRMED_MODAL_BUTTON_COUNT", confirmedButtonCount);
if (confirmedCopyCount < 1 || confirmedButtonCount < 1) {
  throw new Error("confirmed schedule modal missing");
}

await page.getByRole("button", { name: "확인" }).click();
await browser.close();
EOF
