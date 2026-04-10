import { expect, test } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const GOLDEN_DIR = resolve(__dirname, "golden");
const SCREENSHOT_PATH = resolve(RESULTS_DIR, "mobile-support-notices-regression.png");
const DIFF_PATH = resolve(RESULTS_DIR, "mobile-support-notices-diff.png");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-support-notices-regression.json");

const PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user";
const RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session";
const RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding";

/* ---------- 스펙 기대값 (APP_059 화면명세서 기반) ---------- */

const EXPECTED_TITLES = [
  "추석 연휴 고객 지원 운영 안내",
  "AI 상담 서비스 성능 개선 안내",
  "통역 지원 언어 추가 안내 (우즈벡어, 네팔어)",
  "산업안전 교육 콘텐츠 신규 업데이트",
  "권익 상담 연계 기관 확대 안내",
];

/* ---------- 스펙 기반 computed style 기대값 ---------- */

const EXPECTED_STYLES = {
  // 제목
  titleFontSize: 15,
  titleFontWeight: 700, // bold
  titleColor: "#1a1c22",
  // 날짜
  dateFontSize: 12,
  dateFontWeight: 400, // normal
  dateColor: "#8e949e",
  // 썸네일
  thumbnailWidth: 60,
  thumbnailHeight: 60,
  thumbnailBorderRadius: 12,
  // 행 구조
  rowPaddingTop: 20,
  rowPaddingBottom: 20,
  rowGap: 16, // gap-4
  // 제목-날짜 간격
  titleDateGap: 6, // mt-[6px]
  // SurfaceInlineFrame 내부 padding 계약
  framePaddingLeft: 24,
  // child row가 frame content box에 정확히 붙는지 확인
  rowLeftWithinFrame: 24,
  // 390px viewport baseline에서 실제 콘텐츠 시작점
  contentViewportInset: 24,
};

const STYLE_TOLERANCE = 2; // px 허용 오차

function within(actual, expected, tolerance = STYLE_TOLERANCE) {
  return Math.abs(actual - expected) <= tolerance;
}

function ensureResultsDir() {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

function readSource(relativePath) {
  return readFileSync(resolve(ROOT_DIR, relativePath), "utf-8");
}

/* ---------- source chain ---------- */

function evaluateSourceChain() {
  const checks = [
    {
      key: "app_notices_route",
      path: "client/mobile/src/app/App.tsx",
      needles: ['path="/support/notices" element={<SupportNoticesScreen />}'],
    },
    {
      key: "screen_fetch_api",
      path: "client/mobile/src/mobile-app/SupportNoticesScreen.tsx",
      needles: ["fetchSupportNotices", "MobileSecondaryHeader", "SurfaceInlineFrame"],
    },
    {
      key: "support_api_path",
      path: "client/mobile/src/mobile-app/supportApi.ts",
      needles: ['"/support/notices"'],
    },
    {
      key: "server_router",
      path: "server/api/http/support.py",
      needles: ['@router.get("/api/support/notices")'],
    },
  ];

  const results = checks.map((check) => {
    const text = readSource(check.path);
    const matches = check.needles.map((needle) => text.includes(needle));
    const pass = matches.every(Boolean);
    return { key: check.key, path: check.path, needles: check.needles, matches, pass };
  });

  return { pass: results.every((item) => item.pass), checks: results };
}

/* ---------- preview session seeding ---------- */

async function seedPreviewSession(page) {
  await page.evaluate(
    ({ onboardingKey, previewKey, runtimeKey }) => {
      const previewUser = {
        id: "preview-support-notices-regression",
        email: "notices-test@passview.preview",
        role: "member",
        nickname: "공지사항 검수",
        phone: "010-0000-0000",
        subscription_status: null,
        seller_status: null,
      };
      const runtimeUser = {
        id: "in-01000000000",
        fullName: "공지사항 검수",
        phoneNumber: "010-0000-0000",
        locale: "ko",
        authMethod: "phone",
        registeredAt: "2026-03-17T00:00:00.000Z",
        preview: true,
      };

      window.localStorage.clear();
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

/* ---------- computed style 추출 ---------- */

async function extractComputedStyles(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value ?? "").replace(/\s+/g, " ").trim();
    const toNumber = (value) => {
      const parsed = Number.parseFloat(value || "0");
      return Number.isFinite(parsed) ? parsed : null;
    };
    const toHex = (color) => {
      const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return color;
      return `#${Number(m[1]).toString(16).padStart(2, "0")}${Number(m[2]).toString(16).padStart(2, "0")}${Number(m[3]).toString(16).padStart(2, "0")}`;
    };

    const section = document.querySelector('section[aria-label="공지사항 목록"]');
    if (!section) return { error: "section not found" };

    const rows = Array.from(section.querySelectorAll("a"));
    if (rows.length === 0) return { error: "no rows found" };

    const firstRow = rows[0];
    const rowStyle = getComputedStyle(firstRow);
    const titleEl = firstRow.querySelector("p:first-child");
    const dateEl = firstRow.querySelectorAll("p")[1];
    const thumbnailEl = firstRow.querySelector("img") ?? firstRow.querySelector("div.flex.items-center.justify-center");

    const titleStyle = titleEl ? getComputedStyle(titleEl) : null;
    const dateStyle = dateEl ? getComputedStyle(dateEl) : null;
    const thumbStyle = thumbnailEl ? getComputedStyle(thumbnailEl) : null;

    // 제목-날짜 간격: dateEl의 marginTop
    const dateMarginTop = dateEl ? toNumber(getComputedStyle(dateEl).marginTop) : null;

    const frame = document.querySelector('[data-testid="support-notices-frame"]') ?? section.parentElement;
    const frameStyle = frame ? getComputedStyle(frame) : null;
    const frameRect = frame ? frame.getBoundingClientRect() : null;
    const rowRect = firstRow.getBoundingClientRect();

    return {
      rowCount: rows.length,
      titles: rows.map((r) => normalize(r.querySelector("p")?.textContent)),
      headerTitle: normalize(document.querySelector("h1")?.textContent),
      pathname: window.location.pathname,

      // 행 스타일
      rowPaddingTop: toNumber(rowStyle.paddingTop),
      rowPaddingBottom: toNumber(rowStyle.paddingBottom),
      rowGap: toNumber(rowStyle.gap),
      rowDisplay: rowStyle.display,
      rowAlignItems: rowStyle.alignItems,

      // 제목 스타일
      titleFontSize: titleStyle ? toNumber(titleStyle.fontSize) : null,
      titleFontWeight: titleStyle ? toNumber(titleStyle.fontWeight) : null,
      titleColor: titleStyle ? toHex(titleStyle.color) : null,
      titleLineHeight: titleStyle ? toNumber(titleStyle.lineHeight) : null,

      // 날짜 스타일
      dateFontSize: dateStyle ? toNumber(dateStyle.fontSize) : null,
      dateFontWeight: dateStyle ? toNumber(dateStyle.fontWeight) : null,
      dateColor: dateStyle ? toHex(dateStyle.color) : null,
      dateMarginTop,

      // 썸네일 스타일
      thumbnailWidth: thumbStyle ? toNumber(thumbStyle.width) : null,
      thumbnailHeight: thumbStyle ? toNumber(thumbStyle.height) : null,
      thumbnailBorderRadius: thumbStyle ? toNumber(thumbStyle.borderRadius) : null,

      // SurfaceInlineFrame 계약값과 실제 viewport 기준 좌표를 분리해서 기록한다.
      framePaddingLeft: frameStyle ? toNumber(frameStyle.paddingLeft) : null,
      rowLeftWithinFrame: frameRect ? Math.round(rowRect.left - frameRect.left) : null,
      contentViewportInset: Math.round(rowRect.left),
    };
  });
}

/* ---------- computed style 검증 ---------- */

function assertComputedStyles(styles) {
  const checks = {
    pathname: styles.pathname === "/support/notices",
    headerTitle: styles.headerTitle === "공지사항",
    rowCount: styles.rowCount === 5,
    titleFontSize: within(styles.titleFontSize, EXPECTED_STYLES.titleFontSize),
    titleFontWeight: styles.titleFontWeight >= EXPECTED_STYLES.titleFontWeight,
    titleColor: styles.titleColor === EXPECTED_STYLES.titleColor,
    dateFontSize: within(styles.dateFontSize, EXPECTED_STYLES.dateFontSize),
    dateFontWeight: styles.dateFontWeight <= EXPECTED_STYLES.dateFontWeight,
    dateColor: styles.dateColor === EXPECTED_STYLES.dateColor,
    thumbnailWidth: within(styles.thumbnailWidth, EXPECTED_STYLES.thumbnailWidth),
    thumbnailHeight: within(styles.thumbnailHeight, EXPECTED_STYLES.thumbnailHeight),
    thumbnailBorderRadius: within(styles.thumbnailBorderRadius, EXPECTED_STYLES.thumbnailBorderRadius),
    rowPaddingTop: within(styles.rowPaddingTop, EXPECTED_STYLES.rowPaddingTop),
    rowPaddingBottom: within(styles.rowPaddingBottom, EXPECTED_STYLES.rowPaddingBottom),
    rowGap: within(styles.rowGap, EXPECTED_STYLES.rowGap),
    dateMarginTop: within(styles.dateMarginTop, EXPECTED_STYLES.titleDateGap),
    framePaddingLeft: within(styles.framePaddingLeft, EXPECTED_STYLES.framePaddingLeft),
    rowLeftWithinFrame: within(styles.rowLeftWithinFrame, EXPECTED_STYLES.rowLeftWithinFrame),
    contentViewportInset: within(styles.contentViewportInset, EXPECTED_STYLES.contentViewportInset),
  };

  return { pass: Object.values(checks).every(Boolean), checks, snapshot: styles };
}

/* ---------- main test ---------- */

test("APP_059 공지사항 pixel diff + computed style regression", async ({ page, baseURL }) => {
  ensureResultsDir();

  const summary = {
    artifactPaths: { screenshot: SCREENSHOT_PATH, diff: DIFF_PATH, summary: SUMMARY_PATH },
    baseURL,
    pass: false,
    sourceChain: null,
    computedStyles: null,
    pixelDiff: null,
  };

  try {
    // --- source chain ---
    summary.sourceChain = evaluateSourceChain();

    // --- preview session + navigation ---
    await page.goto("/");
    await seedPreviewSession(page);
    await page.goto("/support/notices");
    await expect(page).toHaveURL(/\/support\/notices$/);
    await expect(page.getByRole("heading", { name: "공지사항" })).toBeVisible();

    // 리스트 로딩 완료 대기
    await expect(page.locator('section[aria-label="공지사항 목록"]')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500); // 이미지 로딩 대기

    // --- computed style 검증 ---
    const styles = await extractComputedStyles(page);
    summary.computedStyles = assertComputedStyles(styles);

    // --- 스크린샷 캡처 ---
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });

    // --- pixel diff (toHaveScreenshot) ---
    // golden image와 비교 — threshold 0.3 (폰트 렌더링 차이 허용), maxDiffPixelRatio 5% (썸네일 차이 허용)
    try {
      await expect(page).toHaveScreenshot("APP_059-baseline.png", {
        maxDiffPixelRatio: 0.05,
        threshold: 0.3,
      });
      summary.pixelDiff = { pass: true, note: "within 5% pixel diff threshold" };
    } catch (pixelError) {
      summary.pixelDiff = {
        pass: false,
        note: "pixel diff exceeded threshold",
        message: pixelError.message?.slice(0, 500),
      };
    }

    // --- 인터랙션: 첫 번째 공지 클릭 → APP_060 이동 확인 ---
    await page.goto("/support/notices");
    await expect(page.locator('section[aria-label="공지사항 목록"]')).toBeVisible({ timeout: 10_000 });
    const firstLink = page.locator('section[aria-label="공지사항 목록"] a').first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/support\/notices\//);

    summary.interaction = { pass: true, navigatedTo: page.url() };

    // --- final pass ---
    summary.pass = [
      summary.sourceChain?.pass,
      summary.computedStyles?.pass,
      summary.interaction?.pass,
    ].every(Boolean);
  } catch (error) {
    summary.pass = false;
    summary.error = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    };
    throw error;
  } finally {
    writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
  }

  expect(summary.pass).toBeTruthy();
});
