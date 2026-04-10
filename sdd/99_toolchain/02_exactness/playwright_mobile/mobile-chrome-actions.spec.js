import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-chrome-actions-regression.json");

const PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user";
const RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session";
const RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding";
const PREVIEW_NOTIFICATIONS_STORAGE_KEY = "passv-in.preview.notifications.v2";

function ensureResultsDir() {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

async function seedPreviewSession(page) {
  await page.addInitScript(
    ({ notificationsKey, onboardingKey, previewKey, runtimeKey }) => {
      const previewUser = {
        id: "preview-chrome-actions",
        email: "chrome-actions@passview.preview",
        role: "member",
        nickname: "크롬 검수",
        phone: "010-3333-4444",
        subscription_status: null,
        seller_status: null,
      };
      const runtimeUser = {
        id: "in-01033334444",
        fullName: "크롬 검수",
        phoneNumber: "010-3333-4444",
        locale: "ko",
        authMethod: "phone",
        registeredAt: "2026-03-17T00:00:00.000Z",
        preview: true,
      };

      window.localStorage.setItem(previewKey, JSON.stringify(previewUser));
      window.localStorage.setItem(runtimeKey, JSON.stringify(runtimeUser));
      window.localStorage.setItem(onboardingKey, JSON.stringify(true));
      window.localStorage.removeItem(notificationsKey);
    },
    {
      notificationsKey: PREVIEW_NOTIFICATIONS_STORAGE_KEY,
      onboardingKey: RUNTIME_ONBOARDING_STORAGE_KEY,
      previewKey: PREVIEW_STORAGE_KEY,
      runtimeKey: RUNTIME_SESSION_STORAGE_KEY,
    },
  );
}

test("mobile chrome actions regression", async ({ page, baseURL }) => {
  ensureResultsDir();
  await seedPreviewSession(page);

  const summary = {
    baseURL,
    generatedAt: new Date().toISOString(),
    checks: [],
    pass: false,
  };

  await page.goto("/support/inquiry", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1")).toHaveText("1:1 문의");
  await page.getByRole("button", { name: "문의하기" }).last().click();
  await expect(page).toHaveURL(/\/support\/inquiry\/new$/);
  summary.checks.push({
    check: "support inquiry bottom cta routes to create",
    pass: page.url().endsWith("/support/inquiry/new"),
  });

  await expect(page.locator('button[aria-label="문의 등록"]')).toBeDisabled();
  await page.getByRole("button", { name: "문의 유형 선택" }).click();
  await expect(page).toHaveURL(/\/support\/inquiry\/type$/);
  await page.getByRole("radio", { name: "계정/로그인 선택" }).click();
  await page.getByRole("button", { name: "문의 유형 등록" }).click();
  await expect(page).toHaveURL(/\/support\/inquiry\/new$/);
  await expect(page.getByRole("button", { name: "문의 유형 선택" })).toContainText("계정/로그인");
  summary.checks.push({
    check: "support inquiry type selection round-trips to create",
    pass: /\/support\/inquiry\/new$/.test(page.url()),
  });

  await page.goto("/settings/account/delete", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1")).toHaveText("회원탈퇴");
  await expect(page.getByRole("button", { name: "탈퇴하기" })).toBeDisabled();
  await page.getByRole("button", { name: "기타" }).click();
  await expect(page.getByPlaceholder("계정을 삭제하려는 이유를 알려주세요.")).toBeVisible();
  await page.getByRole("button", { name: "탈퇴하기" }).click();
  await expect(page.getByText("기타 사유를 입력해주세요.")).toBeVisible();
  await page.getByPlaceholder("계정을 삭제하려는 이유를 알려주세요.").fill("미리보기 검증");
  await page.getByRole("button", { name: "탈퇴하기" }).click();
  await expect(page.getByText("실제 로그인 후 회원 탈퇴를 진행할 수 있습니다.")).toBeVisible();
  summary.checks.push({
    check: "account delete validates detail then blocks unauthenticated delete",
    pass: true,
  });

  await page.goto("/notifications", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1")).toHaveText("알림");
  await page.getByRole("button", { name: "모두 읽음" }).click();
  await page.waitForTimeout(150);
  const notificationState = await page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  }, PREVIEW_NOTIFICATIONS_STORAGE_KEY);
  const allRead = Array.isArray(notificationState) && notificationState.every((item) => item.isRead === true);
  summary.checks.push({
    check: "notifications mark-all-read persists preview state",
    pass: allRead,
  });

  await page.goto("/health/location-permission", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1")).toHaveText("위치 권한");
  await page.getByRole("button", { name: "직접 위치 입력" }).click();
  await expect(page).toHaveURL(/\/health\/location-manual$/);
  await page.getByRole("button", { name: "서울 영등포구 대림동" }).click();
  await expect(page.getByRole("button", { name: "선택" })).toBeEnabled();
  await page.getByRole("button", { name: "선택" }).click();
  await expect(page).toHaveURL(/\/health\/facilities$/);
  await expect(page.locator("h1")).toHaveText("병원 약국 찾기");
  await expect(page.getByText("현재 위치")).toBeVisible();
  await page.getByPlaceholder("병원,약국명 검색").fill("약국");
  await expect(page.getByText("대림365약국")).toBeVisible();
  summary.checks.push({
    check: "health location permission and manual search flow lands on facilities list",
    pass: /\/health\/facilities$/.test(page.url()),
  });

  summary.pass = summary.checks.every((item) => item.pass);
  writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);

  expect(summary.pass, JSON.stringify(summary, null, 2)).toBe(true);
});
