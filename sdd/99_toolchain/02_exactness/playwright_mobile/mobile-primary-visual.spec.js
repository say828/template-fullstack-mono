import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const HOME_SCREENSHOT_PATH = resolve(RESULTS_DIR, "mobile-home-primary-visual.png");
const NOTIFICATIONS_SCREENSHOT_PATH = resolve(RESULTS_DIR, "mobile-notifications-primary-visual.png");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-primary-visual-regression.json");

const PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user";
const RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session";
const RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding";
const PREVIEW_NOTIFICATIONS_STORAGE_KEY = "passv-in.preview.notifications.v2";

function ensureResultsDir() {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

async function seedPreviewSession(page) {
  await page.evaluate(
    ({ onboardingKey, previewKey, runtimeKey, notificationsKey }) => {
      window.localStorage.clear();
      window.localStorage.setItem(
        previewKey,
        JSON.stringify({
          id: "preview-mobile-primary-visual",
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
      window.localStorage.setItem(
        notificationsKey,
        JSON.stringify([
          {
            id: "preview-notice-1",
            title: "새로운 일자리 추천이 도착했어요",
            content: "진로 검사 결과에 맞는 채용 안내 3건이 등록되었습니다.",
            type: "job",
            isRead: false,
            linkUrl: "/jobs/result",
            createdAt: new Date(Date.now() - 49 * 60 * 1000).toISOString(),
          },
          {
            id: "preview-notice-2",
            title: "새로운 교육 콘텐츠가 등록되었습니다",
            content: "언어 교육 영상이 추가되었습니다. 지금 학습해보세요.",
            type: "education",
            isRead: true,
            linkUrl: "/education/list",
            createdAt: new Date("2025-07-21T09:00:00+09:00").toISOString(),
          },
          {
            id: "preview-notice-3",
            title: "권익 보호 가이드가 업데이트되었습니다",
            content: "임금 체불 대응 절차가 새로 정리되었습니다.",
            type: "rights",
            isRead: true,
            linkUrl: "/rights/result",
            createdAt: new Date("2025-07-21T08:00:00+09:00").toISOString(),
          },
        ]),
      );
    },
    {
      onboardingKey: RUNTIME_ONBOARDING_STORAGE_KEY,
      previewKey: PREVIEW_STORAGE_KEY,
      runtimeKey: RUNTIME_SESSION_STORAGE_KEY,
      notificationsKey: PREVIEW_NOTIFICATIONS_STORAGE_KEY,
    },
  );
}

async function collectHomeMetrics(page) {
  return page.evaluate(() => {
    function collectNonWhiteBBox(img) {
      if (!img) {
        return null;
      }
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return null;
      }
      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const offset = (y * width + x) * 4;
          const red = data[offset];
          const green = data[offset + 1];
          const blue = data[offset + 2];
          const alpha = data[offset + 3];
          if (alpha > 0 && !(red >= 245 && green >= 245 && blue >= 245)) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (maxX < 0) {
        return null;
      }

      return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      };
    }

    const panel = document.querySelector('nav[aria-label], nav');
    const cards = Array.from(document.querySelectorAll('a[href="/administration"], a[href="/jobs"], a[href="/education"], a[href="/rights"], a[href="/health"], a[href="/health/interpretation"]'));
    const searchField = document.querySelector('input[aria-label="상담 검색"]')?.parentElement;
    const greeting = Array.from(document.querySelectorAll("p")).find((node) => node.textContent?.includes("안녕하세요"));
    const title = document.querySelector("h1");
    const recommendationHeading = Array.from(document.querySelectorAll("h2")).find((node) => node.textContent?.trim() === "추천 서비스");
    const notificationIcon = document.querySelector('a[aria-label="알림"] img');
    const heroOrbStage = document.querySelector('[data-testid="home-hero-orb-stage"]');
    const heroOrbCore = document.querySelector('[data-hero-orb-layer="core"]');
    const heroOrbLayers = Array.from(document.querySelectorAll("[data-hero-orb-layer]"));
    const panelStyle = panel ? getComputedStyle(panel.firstElementChild ?? panel) : null;
    const searchStyle = searchField ? getComputedStyle(searchField) : null;
    const panelBox = (panel?.firstElementChild ?? panel)?.getBoundingClientRect?.();
    const heroOrbStageBox = heroOrbStage?.getBoundingClientRect?.();
    const heroOrbCoreBox = heroOrbCore?.getBoundingClientRect?.();
    return {
      greeting: greeting?.textContent?.trim() ?? "",
      title: title?.textContent?.trim() ?? "",
      cardCount: cards.length,
      searchHeight: searchStyle ? Number.parseFloat(searchStyle.height) : null,
      searchRadius: searchStyle ? Number.parseFloat(searchStyle.borderRadius) : null,
      recommendationVisible: Boolean(recommendationHeading),
      bottomNavHeight: panelBox ? Math.round(panelBox.height) : null,
      bottomNavRadius: panelStyle ? Number.parseFloat(panelStyle.borderTopLeftRadius) : null,
      notificationVisualBox: collectNonWhiteBBox(notificationIcon),
      heroOrbLayerCount: heroOrbLayers.length,
      heroOrbStageWidth: heroOrbStageBox ? Math.round(heroOrbStageBox.width) : null,
      heroOrbStageHeight: heroOrbStageBox ? Math.round(heroOrbStageBox.height) : null,
      heroOrbCoreWidth: heroOrbCoreBox ? Math.round(heroOrbCoreBox.width) : null,
      heroOrbCoreHeight: heroOrbCoreBox ? Math.round(heroOrbCoreBox.height) : null,
    };
  });
}

async function collectNotificationsMetrics(page) {
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('button[type="button"]')).filter((node) => node.textContent?.includes("도착했어요") || node.textContent?.includes("등록되었습니다") || node.textContent?.includes("업데이트되었습니다"));
    const firstRow = rows[0];
    const title = firstRow?.querySelector("p");
    const message = firstRow?.querySelectorAll("p")[1];
    const time = firstRow?.querySelector("span");
    const headerTitle = document.querySelector("h1")?.textContent?.trim() ?? "";
    const firstStyle = firstRow ? getComputedStyle(firstRow) : null;
    const titleStyle = title ? getComputedStyle(title) : null;
    const icon = firstRow?.querySelector("img");
    return {
      headerTitle,
      rowCount: rows.length,
      titles: rows.map((row) => row.querySelector("p")?.textContent?.trim() ?? ""),
      firstMessage: message?.textContent?.trim() ?? "",
      firstTime: time?.textContent?.trim() ?? "",
      firstRowPaddingTop: firstStyle ? Number.parseFloat(firstStyle.paddingTop) : null,
      firstRowRadius: firstStyle ? Number.parseFloat(firstStyle.borderRadius) : null,
      titleFontSize: titleStyle ? Number.parseFloat(titleStyle.fontSize) : null,
      titleFontWeight: titleStyle ? Number.parseFloat(titleStyle.fontWeight) : null,
      iconSrc: icon?.getAttribute("src") ?? "",
      iconNaturalWidth: icon?.naturalWidth ?? null,
      iconNaturalHeight: icon?.naturalHeight ?? null,
    };
  });
}

test("primary visual exactness retains APP_009 home and APP_010 notifications baseline", async ({ page, baseURL }) => {
  ensureResultsDir();
  const resolvedBaseUrl = baseURL ?? process.env.BASE_URL ?? "http://127.0.0.1:3002";

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${resolvedBaseUrl}/login`, { waitUntil: "networkidle" });
  await seedPreviewSession(page);

  await page.goto(`${resolvedBaseUrl}/home`, { waitUntil: "networkidle" });
  await page.screenshot({ path: HOME_SCREENSHOT_PATH, fullPage: false });
  const home = await collectHomeMetrics(page);

  expect(home.greeting).toContain("홍길동");
  expect(home.title).toBe("무엇을 도와드릴까요?");
  expect(home.cardCount).toBe(6);
  expect(home.recommendationVisible).toBe(true);
  expect(home.searchHeight).toBeGreaterThanOrEqual(46);
  expect(home.searchHeight).toBeLessThanOrEqual(50);
  expect(home.searchRadius).toBeGreaterThanOrEqual(15);
  expect(home.searchRadius).toBeLessThanOrEqual(17);
  expect(home.heroOrbLayerCount).toBe(4);
  expect(home.heroOrbStageWidth).toBeGreaterThanOrEqual(250);
  expect(home.heroOrbStageWidth).toBeLessThanOrEqual(262);
  expect(home.heroOrbStageHeight).toBeGreaterThanOrEqual(120);
  expect(home.heroOrbStageHeight).toBeLessThanOrEqual(128);
  expect(home.heroOrbCoreWidth).toBe(home.heroOrbCoreHeight);
  expect(home.heroOrbCoreWidth).toBeGreaterThanOrEqual(86);
  expect(home.heroOrbCoreWidth).toBeLessThanOrEqual(90);
  expect(home.bottomNavRadius).toBeGreaterThanOrEqual(26);
  expect(home.bottomNavRadius).toBeLessThanOrEqual(30);
  expect(home.notificationVisualBox?.width).toBeGreaterThanOrEqual(16);
  expect(home.notificationVisualBox?.height).toBeGreaterThanOrEqual(18);
  expect(home.notificationVisualBox?.y).toBeLessThanOrEqual(4);

  await page.goto(`${resolvedBaseUrl}/notifications`, { waitUntil: "networkidle" });
  await page.screenshot({ path: NOTIFICATIONS_SCREENSHOT_PATH, fullPage: false });
  const notifications = await collectNotificationsMetrics(page);

  expect(notifications.headerTitle).toBe("알림");
  expect(notifications.rowCount).toBeGreaterThanOrEqual(3);
  expect(notifications.titles.slice(0, 3)).toEqual([
    "새로운 일자리 추천이 도착했어요",
    "새로운 교육 콘텐츠가 등록되었습니다",
    "권익 보호 가이드가 업데이트되었습니다",
  ]);
  expect(notifications.firstMessage).toBe("진로 검사 결과에 맞는 채용 안내 3건이 등록되었습니다.");
  expect(notifications.firstTime).toBe("49분전");
  expect(notifications.firstRowPaddingTop).toBeGreaterThanOrEqual(12);
  expect(notifications.firstRowPaddingTop).toBeLessThanOrEqual(14);
  expect(notifications.firstRowRadius).toBeGreaterThanOrEqual(14);
  expect(notifications.firstRowRadius).toBeLessThanOrEqual(16);
  expect(notifications.titleFontSize).toBeGreaterThanOrEqual(13);
  expect(notifications.titleFontSize).toBeLessThanOrEqual(14.5);
  expect(notifications.titleFontWeight).toBeGreaterThanOrEqual(700);
  expect(notifications.iconSrc.length).toBeGreaterThan(20);
  expect(notifications.iconNaturalWidth).toBeGreaterThanOrEqual(40);
  expect(notifications.iconNaturalHeight).toBeGreaterThanOrEqual(60);

  writeFileSync(
    SUMMARY_PATH,
    JSON.stringify(
      {
        baseURL: resolvedBaseUrl,
        home,
        notifications,
      },
      null,
      2,
    ),
  );
});
