import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const EMERGENCY_SCREENSHOT_PATH = resolve(RESULTS_DIR, "mobile-emergency-visual.png");
const ADMIN_SCREENSHOT_PATH = resolve(RESULTS_DIR, "mobile-administration-visual.png");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-emergency-admin-visual-regression.json");

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
          id: "preview-emergency-admin-visual",
          email: "visual-test@passv.preview",
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

async function collectEmergencyMetrics(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector("section[role='dialog']");
    const title = dialog?.querySelector("h1")?.textContent?.trim() ?? "";
    const handle = dialog?.querySelector(":scope > div");
    const links = Array.from(dialog?.querySelectorAll("a") ?? []).map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "");
    const majorCards = Array.from(document.querySelectorAll("a, button")).filter((node) => {
      const text = node.textContent ?? "";
      return text.includes("119 연결") || text.includes("112(경찰) 도움 요청") || text.includes("가까운 병원 찾기");
    });
    const firstCard = majorCards[0];
    const firstStyle = firstCard ? getComputedStyle(firstCard) : null;
    const overlay = document.querySelector("section[role='dialog']")?.parentElement;
    const overlayStyle = overlay ? getComputedStyle(overlay) : null;
    return {
      title,
      links,
      majorCount: majorCards.length,
      handleWidth: handle ? Math.round(handle.getBoundingClientRect().width) : null,
      firstCardRadius: firstStyle ? Number.parseFloat(firstStyle.borderRadius) : null,
      overlayBackground: overlayStyle?.backgroundColor ?? overlayStyle?.backgroundImage ?? "",
    };
  });
}

async function collectAdministrationMetrics(page) {
  return page.evaluate(() => {
    const heroTitle = document.querySelector("section h2")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const quickStartTitle = Array.from(document.querySelectorAll("h3")).find((node) => node.textContent?.trim() === "빠른 시작")?.textContent?.trim() ?? "";
    const actionButtons = Array.from(document.querySelectorAll("a")).filter((node) => {
      const text = node.textContent ?? "";
      return text.includes("진단 시작") || text.includes("상담 시작");
    });
    const quickLinks = Array.from(document.querySelectorAll("a")).filter((node) => {
      const text = node.textContent ?? "";
      return (
        text.includes("비자 만료가 다음달이에요") ||
        text.includes("EPS 단계가 궁금해요?") ||
        text.includes("어디부터 가야 하나요?") ||
        text.includes("필요 서류를 알려주세요")
      );
    });
    const guideRows = Array.from(document.querySelectorAll("a")).filter((node) => {
      const text = node.textContent ?? "";
      return (
        text.includes("비자 만료일 확인 방법") ||
        text.includes("출입국 방문 준비물") ||
        text.includes("사업장 변경 절차") ||
        text.includes("표준근로계약서 확인 포인트")
      );
    });
    const firstAction = actionButtons[0];
    const firstActionStyle = firstAction ? getComputedStyle(firstAction) : null;
    return {
      heroTitle,
      quickStartTitle,
      actionCount: actionButtons.length,
      quickLinkCount: quickLinks.length,
      guideRowCount: guideRows.length,
      firstActionHeight: firstActionStyle ? Number.parseFloat(firstActionStyle.height) : null,
      firstActionRadius: firstActionStyle ? Number.parseFloat(firstActionStyle.borderRadius) : null,
    };
  });
}

test("emergency and administration visuals retain current exactness baseline", async ({ page, baseURL }) => {
  ensureResultsDir();
  const resolvedBaseUrl = baseURL ?? process.env.BASE_URL ?? "http://127.0.0.1:3002";

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${resolvedBaseUrl}/login`, { waitUntil: "networkidle" });
  await seedPreviewSession(page);

  await page.goto(`${resolvedBaseUrl}/emergency`, { waitUntil: "networkidle" });
  await page.screenshot({ path: EMERGENCY_SCREENSHOT_PATH, fullPage: false });
  const emergency = await collectEmergencyMetrics(page);

  expect(emergency.title).toBe("긴급 도움이 필요하신가요?");
  expect(emergency.majorCount).toBe(3);
  expect(emergency.links.join(" ")).toContain("상담하기");
  expect(emergency.links.join(" ")).toContain("통역 켜기");
  expect(emergency.handleWidth).toBeGreaterThanOrEqual(40);
  expect(emergency.firstCardRadius).toBeGreaterThanOrEqual(15);
  expect(emergency.firstCardRadius).toBeLessThanOrEqual(17);

  await page.goto(`${resolvedBaseUrl}/administration`, { waitUntil: "networkidle" });
  await page.screenshot({ path: ADMIN_SCREENSHOT_PATH, fullPage: false });
  const administration = await collectAdministrationMetrics(page);

  expect(administration.heroTitle).toContain("체류·고용 절차를");
  expect(administration.quickStartTitle).toBe("빠른 시작");
  expect(administration.actionCount).toBe(2);
  expect(administration.quickLinkCount).toBe(4);
  expect(administration.guideRowCount).toBe(4);
  expect(administration.firstActionHeight).toBeGreaterThanOrEqual(40);
  expect(administration.firstActionHeight).toBeLessThanOrEqual(44);
  expect(administration.firstActionRadius).toBeGreaterThanOrEqual(14);
  expect(administration.firstActionRadius).toBeLessThanOrEqual(15);

  writeFileSync(
    SUMMARY_PATH,
    JSON.stringify(
      {
        baseURL: resolvedBaseUrl,
        emergency,
        administration,
      },
      null,
      2,
    ),
  );
});
