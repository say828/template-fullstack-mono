import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-admin-emergency-visual-regression.json");
const ADMIN_SCREENSHOT_PATH = resolve(RESULTS_DIR, "mobile-administration-visual.png");
const DIAGNOSIS_SCREENSHOT_PATH = resolve(RESULTS_DIR, "mobile-administration-diagnosis-visual.png");
const EMERGENCY_SCREENSHOT_PATH = resolve(RESULTS_DIR, "mobile-emergency-visual.png");

const PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user";
const RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session";
const RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding";

function ensureResultsDir() {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

async function seedPreviewSession(page) {
  await page.evaluate(
    ({ onboardingKey, previewKey, runtimeKey }) => {
      window.localStorage.clear();
      window.localStorage.setItem(
        previewKey,
        JSON.stringify({
          id: "preview-admin-emergency-visual",
          email: "admin-visual@passv.preview",
          role: "member",
          nickname: "홍길동",
          phone: "010-0000-0000",
        }),
      );
      window.localStorage.setItem(
        runtimeKey,
        JSON.stringify({
          id: "in-01000000000",
          fullName: "홍길동",
          phoneNumber: "010-0000-0000",
          locale: "ko",
          authMethod: "phone",
          registeredAt: "2026-03-18T00:00:00.000Z",
          preview: true,
        }),
      );
      window.localStorage.setItem(onboardingKey, JSON.stringify(true));
    },
    {
      onboardingKey: RUNTIME_ONBOARDING_STORAGE_KEY,
      previewKey: PREVIEW_STORAGE_KEY,
      runtimeKey: RUNTIME_SESSION_STORAGE_KEY,
    },
  );
}

async function collectAdministrationMetrics(page) {
  return page.evaluate(() => {
    const heroHeading = Array.from(document.querySelectorAll("h2")).find((node) => node.textContent?.includes("체류·고용 절차"));
    const cardTitles = Array.from(document.querySelectorAll("h3")).map((node) => node.textContent?.trim()).filter(Boolean);
    const chipLabels = Array.from(document.querySelectorAll("a")).map((node) => node.textContent?.trim()).filter((text) => text && text.includes("요"));
    const topActions = document.querySelectorAll("header img");
    return {
      heroHeading: heroHeading?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      cardTitles,
      quickStartCount: chipLabels.length,
      topActionCount: topActions.length,
      pathname: window.location.pathname,
    };
  });
}

async function collectDiagnosisMetrics(page) {
  return page.evaluate(() => ({
    pathname: window.location.pathname,
    headerTitle: document.querySelector("h1")?.textContent?.trim() ?? "",
    hasQ1: document.body.textContent?.includes("Q1. 현재 체류자격(비자)이 무엇인가요?") ?? false,
    hasQ5: document.body.textContent?.includes("Q5. 현재 근무 중인가요?") ?? false,
    hasQ9: document.body.textContent?.includes("Q9. 체류기간 초과(오버스테이) 경험이 있나요?") ?? false,
  }));
}

async function collectEmergencyMetrics(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const overlay = dialog?.parentElement;
    const overlayStyle = overlay ? getComputedStyle(overlay) : null;
    return {
      title: dialog?.querySelector("h1")?.textContent?.trim() ?? "",
      bodyText: dialog?.textContent ?? "",
      overlayBackground: overlayStyle?.backgroundColor ?? overlayStyle?.backgroundImage ?? "",
    };
  });
}

test("APP_011~013 retain admin/emergency visual baseline", async ({ page, baseURL }) => {
  ensureResultsDir();
  const resolvedBaseUrl = baseURL ?? process.env.BASE_URL ?? "http://127.0.0.1:3002";

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${resolvedBaseUrl}/login`, { waitUntil: "networkidle" });
  await seedPreviewSession(page);

  await page.goto(`${resolvedBaseUrl}/administration`, { waitUntil: "networkidle" });
  await page.screenshot({ path: ADMIN_SCREENSHOT_PATH, fullPage: false });
  const administration = await collectAdministrationMetrics(page);

  expect(administration.pathname).toBe("/administration");
  expect(administration.heroHeading.replace(/\s+/g, "")).toContain("체류·고용절차를단계별로안내합니다");
  expect(administration.cardTitles).toEqual(expect.arrayContaining(["내 상황 진단하기", "AI에게 바로 물어보기", "빠른 시작", "자주 찾는 행정 안내"]));
  expect(administration.quickStartCount).toBeGreaterThanOrEqual(4);
  expect(administration.topActionCount).toBe(2);

  await page.goto(`${resolvedBaseUrl}/administration/diagnosis`, { waitUntil: "networkidle" });
  let diagnosis = await collectDiagnosisMetrics(page);
  await page.screenshot({ path: DIAGNOSIS_SCREENSHOT_PATH, fullPage: false });

  expect(diagnosis.pathname).toBe("/administration/diagnosis");
  expect(diagnosis.headerTitle).toBe("행정 진단");
  expect(diagnosis.hasQ1).toBe(true);
  expect(diagnosis.hasQ5).toBe(false);
  expect(diagnosis.hasQ9).toBe(false);

  await page.getByRole("button", { name: "E-9" }).click();
  await page.locator('input[type="date"]').fill("2026-12-31");
  await page.getByRole("button", { name: "예, 있어요" }).nth(0).click();
  await page.getByRole("button", { name: "네, 한국이에요" }).click();
  await page.getByRole("button", { name: "다음" }).click();

  diagnosis = await collectDiagnosisMetrics(page);
  expect(diagnosis.hasQ1).toBe(false);
  expect(diagnosis.hasQ5).toBe(true);

  await page.goto(`${resolvedBaseUrl}/emergency`, { waitUntil: "networkidle" });
  await page.screenshot({ path: EMERGENCY_SCREENSHOT_PATH, fullPage: false });
  const emergency = await collectEmergencyMetrics(page);

  expect(emergency.title).toBe("긴급 도움이 필요하신가요?");
  expect(emergency.bodyText).toContain("119 연결");
  expect(emergency.bodyText).toContain("112(경찰) 도움 요청");
  expect(emergency.bodyText).toContain("가까운 병원 찾기");
  expect(emergency.bodyText).toContain("상담하기");
  expect(emergency.bodyText).toContain("통역 켜기");
  expect(emergency.overlayBackground).toBeTruthy();

  writeFileSync(
    SUMMARY_PATH,
    JSON.stringify(
      {
        baseURL: resolvedBaseUrl,
        administration,
        diagnosis,
        emergency,
      },
      null,
      2,
    ),
  );
});
