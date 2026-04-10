import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const ADMIN_PATH = resolve(RESULTS_DIR, "mobile-administration-visual.png");
const ADMIN_DIAGNOSIS_PATH = resolve(RESULTS_DIR, "mobile-administration-diagnosis-visual.png");
const EMERGENCY_PATH = resolve(RESULTS_DIR, "mobile-emergency-visual.png");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-early-flow-visual-regression.json");

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
          id: "preview-mobile-early-flow",
          email: "early-flow@passv.preview",
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

test("early flow visual baseline retains APP_011 APP_012 APP_013 exactness", async ({ page, baseURL }) => {
  ensureResultsDir();
  const resolvedBaseUrl = baseURL ?? process.env.BASE_URL ?? "http://127.0.0.1:3002";

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${resolvedBaseUrl}/login`, { waitUntil: "networkidle" });
  await seedPreviewSession(page);

  await page.goto(`${resolvedBaseUrl}/administration`, { waitUntil: "networkidle" });
  await page.screenshot({ path: ADMIN_PATH, fullPage: false });
  const administration = await page.evaluate(() => {
    const heroTitle = Array.from(document.querySelectorAll("h2")).find((node) => node.textContent?.includes("체류·고용 절차를"));
    const quickStartHeading = Array.from(document.querySelectorAll("h3")).find((node) => node.textContent?.trim() === "빠른 시작");
    const quickChips = quickStartHeading
      ? Array.from(quickStartHeading.parentElement?.querySelectorAll("a") ?? []).map((node) => node.textContent?.trim() ?? "")
      : [];
    const cardButtons = Array.from(document.querySelectorAll("a")).filter((node) => node.textContent?.includes("진단 시작") || node.textContent?.includes("상담 시작"));
    return {
      heroTitle: heroTitle?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      quickChipCount: quickChips.length,
      firstQuickChip: quickChips[0] ?? "",
      cardButtonCount: cardButtons.length,
    };
  });

  expect(administration.heroTitle).toContain("체류·고용 절차를");
  expect(administration.quickChipCount).toBe(4);
  expect(administration.firstQuickChip).toContain("비자 만료");
  expect(administration.cardButtonCount).toBe(2);

  await page.goto(`${resolvedBaseUrl}/administration/diagnosis`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "E-9" }).click();
  await page.locator('input[type="date"]').fill("2026-12-31");
  await page.getByRole("button", { name: "예, 있어요" }).first().click();
  await page.getByRole("button", { name: "네, 한국이에요" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: ADMIN_DIAGNOSIS_PATH, fullPage: false });
  const diagnosis = await page.evaluate(() => {
    const hero = Array.from(document.querySelectorAll("p")).find((node) => node.textContent?.includes("현재 단계와"));
    const question = Array.from(document.querySelectorAll("h2")).find((node) => node.textContent?.includes("Q5."));
    return {
      heroText: hero?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      questionText: question?.textContent?.trim() ?? "",
      windowScrollY: window.scrollY,
    };
  });

  expect(diagnosis.heroText).toContain("현재 단계와");
  expect(diagnosis.questionText).toContain("Q5.");
  expect(diagnosis.windowScrollY).toBe(0);

  await page.goto(`${resolvedBaseUrl}/home`, { waitUntil: "networkidle" });
  await page.click('a[aria-label="긴급"]');
  await page.waitForURL("**/emergency");
  await page.screenshot({ path: EMERGENCY_PATH, fullPage: false });
  const emergency = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const handle = dialog?.querySelector("div");
    const title = dialog?.querySelector("h1");
    const primaryRows = Array.from(dialog?.querySelectorAll("a, button") ?? []).filter((node) =>
      node.textContent?.includes("119 연결") || node.textContent?.includes("112(경찰) 도움 요청") || node.textContent?.includes("가까운 병원 찾기"),
    );
    const handleStyle = handle ? getComputedStyle(handle) : null;
    return {
      title: title?.textContent?.trim() ?? "",
      primaryRowCount: primaryRows.length,
      handleWidth: handleStyle ? Number.parseFloat(handleStyle.width) : null,
      handleHeight: handleStyle ? Number.parseFloat(handleStyle.height) : null,
    };
  });

  expect(emergency.title).toBe("긴급 도움이 필요하신가요?");
  expect(emergency.primaryRowCount).toBe(3);
  expect(emergency.handleWidth).toBeGreaterThanOrEqual(38);
  expect(emergency.handleHeight).toBeGreaterThanOrEqual(4);

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
