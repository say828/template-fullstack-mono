import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-secondary-header-regression.json");

const PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user";
const RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session";
const RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding";

const ROUTES = [
  { path: "/health", title: "건강" },
  { path: "/health/diagnosis", title: "건강진단" },
  { path: "/health/result", title: "진단 결과" },
  { path: "/health/facilities", title: "병원 약국 찾기" },
  { path: "/health/location-permission", title: "위치 권한" },
  { path: "/health/interpretation", title: "통역" },
  { path: "/education", title: "교육" },
  { path: "/education/list", title: "교육" },
  { path: "/education/learning/life-korean-basic/start", title: "교육" },
  { path: "/education/quiz/life-korean-basic", title: "퀴즈" },
  { path: "/education/quiz/life-korean-basic/result", title: "퀴즈" },
  { path: "/notifications", title: "알림" },
  { path: "/support/faq", title: "자주묻는질문" },
  { path: "/support/inquiry", title: "1:1 문의" },
  { path: "/support/inquiry/new", title: "1:1 문의" },
  { path: "/profile/favorites", title: "즐겨찾기" },
  { path: "/settings/account/delete", title: "회원탈퇴" },
  { path: "/settings/interpretation", title: "통역 기본 설정" },
  { path: "/settings/notifications", title: "알림 설정" },
  { path: "/settings/emergency", title: "긴급 기능 설정" },
  { path: "/settings/app", title: "앱설정" },
  { path: "/support/notices", title: "공지사항" },
  { path: "/support/notices/ai-counsel-performance-update", title: "공지사항" },
];

function ensureResultsDir() {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

async function seedPreviewSession(page) {
  await page.addInitScript(
    ({ onboardingKey, previewKey, runtimeKey }) => {
      const previewUser = {
        id: "preview-secondary-header-regression",
        email: "secondary-header@passview.preview",
        role: "member",
        nickname: "헤더 검수",
        phone: "010-1111-2222",
        subscription_status: null,
        seller_status: null,
      };
      const runtimeUser = {
        id: "in-01011112222",
        fullName: "헤더 검수",
        phoneNumber: "010-1111-2222",
        locale: "ko",
        authMethod: "phone",
        registeredAt: "2026-03-17T00:00:00.000Z",
        preview: true,
      };

      window.localStorage.setItem(previewKey, JSON.stringify(previewUser));
      window.localStorage.setItem(runtimeKey, JSON.stringify(runtimeUser));
      window.localStorage.setItem(onboardingKey, JSON.stringify(true));
    },
    {
      onboardingKey: RUNTIME_ONBOARDING_STORAGE_KEY,
      previewKey: PREVIEW_STORAGE_KEY,
      runtimeKey: RUNTIME_SESSION_STORAGE_KEY,
    },
  );
}

async function extractHeaderSnapshot(page) {
  return page.evaluate(() => {
    const header = document.querySelector("header");
    const title = document.querySelector("h1");
    const backButton = document.querySelector('button[aria-label="뒤로가기"]');
    const icon = backButton?.querySelector("svg");
    const headerStyle = header ? getComputedStyle(header) : null;
    const iconStyle = icon ? getComputedStyle(icon) : null;
    const headerRect = header ? header.getBoundingClientRect() : null;
    const iconRect = icon ? icon.getBoundingClientRect() : null;

    return {
      pathname: window.location.pathname,
      title: title?.textContent?.trim() ?? null,
      hasBackButton: Boolean(backButton),
      position: headerStyle?.position ?? null,
      headerTop: headerRect ? Math.round(headerRect.top) : null,
      iconWidth: iconRect ? Math.round(iconRect.width) : null,
      iconHeight: iconRect ? Math.round(iconRect.height) : null,
      iconStrokeWidth: iconStyle?.strokeWidth ?? null,
    };
  });
}

test("mobile secondary header consistency batch", async ({ page, baseURL }) => {
  ensureResultsDir();
  await seedPreviewSession(page);

  const summary = {
    baseURL,
    generatedAt: new Date().toISOString(),
    pass: false,
    routes: [],
  };

  for (const route of ROUTES) {
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toHaveText(route.title);

    const initial = await extractHeaderSnapshot(page);
    await page.evaluate(() => window.scrollTo(0, 240));
    await page.waitForTimeout(120);
    const afterScroll = await extractHeaderSnapshot(page);

    const checks = {
      pathname: initial.pathname === route.path,
      title: initial.title === route.title,
      backButton: initial.hasBackButton === true,
      sticky: initial.position === "sticky",
      stickyAfterScroll: afterScroll.position === "sticky",
      topPinned: Math.abs(afterScroll.headerTop ?? 99) <= 1,
      iconWidth: Math.abs((initial.iconWidth ?? 0) - 18) <= 1,
      iconHeight: Math.abs((initial.iconHeight ?? 0) - 18) <= 1,
    };

    summary.routes.push({
      route,
      initial,
      afterScroll,
      checks,
      pass: Object.values(checks).every(Boolean),
    });
  }

  summary.pass = summary.routes.every((item) => item.pass);
  writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);

  expect(summary.pass, JSON.stringify(summary, null, 2)).toBe(true);
});
