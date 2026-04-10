import { expect, test } from "@playwright/test";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-admin-jobs-visual-regression.json");

const SCREENSHOT_PATHS = {
  APP_014: resolve(RESULTS_DIR, "mobile-admin-jobs-app014-result.png"),
  APP_015: resolve(RESULTS_DIR, "mobile-admin-jobs-app015-document-preview.png"),
  APP_016: resolve(RESULTS_DIR, "mobile-admin-jobs-app016-content-detail.png"),
  APP_017: resolve(RESULTS_DIR, "mobile-admin-jobs-app017-jobs-hub.png"),
  APP_018: resolve(RESULTS_DIR, "mobile-admin-jobs-app018-job-diagnosis.png"),
  APP_019: resolve(RESULTS_DIR, "mobile-admin-jobs-app019-job-result.png"),
  APP_020: resolve(RESULTS_DIR, "mobile-admin-jobs-app020-jobs-list.png"),
  APP_021: resolve(RESULTS_DIR, "mobile-admin-jobs-app021-region-filter.png"),
  APP_022: resolve(RESULTS_DIR, "mobile-admin-jobs-app022-job-detail.png"),
};

const PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user";
const RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session";
const RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding";
const JOB_DIAGNOSIS_STORAGE_KEY = "passv-in.jobs.latest-diagnosis.v2";
const JOB_UI_STORAGE_KEY = "passv-in.jobs.ui-state.v1";

const SEEDED_DIAGNOSIS = {
  currentStatus: "한국에 있어요 (바로 구직 가능해요)",
  startTiming: "바로 가능",
  koreanLevel: "초급 (기본적인 의사표현만 가능)",
  experiences: ["제조/조립", "포장/검수"],
  workTime: "주간 고정",
  dormNeed: "꼭 필요해요",
  preferredRegion: "경기도",
  useCurrentLocation: false,
  currentLocation: null,
  payType: "월급",
  priorityLevel: "평균 수준",
  physicalDemand: "보통 (대부분의 생산직 업무)",
  environments: ["실내 선호"],
  qualifications: ["없어요"],
  additionalCondition: "",
};

const SEEDED_UI_STATE = {
  bookmarkedJobIds: ["bluefarm-harvest"],
  recentJobIds: ["bluefarm-harvest", "seongjin-assembly"],
};

function ensureResultsDir() {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

function buildHostSuffix(baseUrl) {
  try {
    return new URL(baseUrl).host.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  } catch {
    return "unknown-host";
  }
}

function withHostSuffix(filePath, hostSuffix) {
  const extension = extname(filePath);
  return `${filePath.slice(0, -extension.length)}.${hostSuffix}${extension}`;
}

function preserveHostArtifact(filePath, hostSuffix) {
  copyFileSync(filePath, withHostSuffix(filePath, hostSuffix));
}

async function seedProtectedPreviewSession(page) {
  await page.addInitScript(
    ({ diagnosisKey, diagnosisValue, onboardingKey, previewKey, runtimeKey, runtimeValue, uiKey, uiValue }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(
        previewKey,
        JSON.stringify({
          id: "preview-admin-jobs-visual",
          email: "admin-jobs-visual@passv.preview",
          role: "member",
          nickname: "행정 일자리 검수",
          phone: "010-1111-3333",
        }),
      );
      window.localStorage.setItem(runtimeKey, JSON.stringify(runtimeValue));
      window.localStorage.setItem(onboardingKey, JSON.stringify(true));
      window.localStorage.setItem(diagnosisKey, JSON.stringify(diagnosisValue));
      window.localStorage.setItem(uiKey, JSON.stringify(uiValue));
    },
    {
      diagnosisKey: JOB_DIAGNOSIS_STORAGE_KEY,
      diagnosisValue: SEEDED_DIAGNOSIS,
      onboardingKey: RUNTIME_ONBOARDING_STORAGE_KEY,
      previewKey: PREVIEW_STORAGE_KEY,
      runtimeKey: RUNTIME_SESSION_STORAGE_KEY,
      runtimeValue: {
        id: "in-01011113333",
        fullName: "행정 일자리 검수",
        phoneNumber: "010-1111-3333",
        locale: "ko",
        authMethod: "phone",
        registeredAt: "2026-03-18T00:00:00.000Z",
        preview: true,
      },
      uiKey: JOB_UI_STORAGE_KEY,
      uiValue: SEEDED_UI_STATE,
    },
  );
}

async function collectAdministrationResultMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "진단 결과" }).first().textContent())?.trim() ?? "",
    summaryTileCount: await page.locator("section").first().locator("article").count(),
    requiredDocumentCount: await page.locator('a[aria-label$="서류 예시 보기"]').count(),
    primaryCta: (await page.getByRole("link", { name: "AI 상담 이어가기" }).textContent())?.trim() ?? "",
  };
}

async function collectDocumentPreviewMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "서류 미리보기" }).first().textContent())?.trim() ?? "",
    documentTitle: (await page.getByRole("heading", { name: "외국인등록증" }).textContent())?.trim() ?? "",
    checklistCount: await page.locator("li").filter({ hasText: /확인해요|보여야 해요|준비해요/ }).count(),
    fieldCount:
      (await page.locator("text=APP_014 연결").count()) +
      (await page.locator("text=제출 위치").count()) +
      (await page.locator("text=준비 메모").count()),
  };
}

async function collectContentDetailMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "행정 서류 준비 전에 꼭 볼 내용" }).textContent())?.trim() ?? "",
    introCount: await page.locator("article > div > p").count(),
    blockHeadingCount: await page.locator("article section h2").count(),
    imageCount: await page.locator("article img").count(),
  };
}

async function collectJobsHubMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "일자리" }).first().textContent())?.trim() ?? "",
    guideCount: await page.locator("a").filter({ hasText: "지원 전에 꼭 확인할 5가지" }).count(),
    recommendedCount: await page.locator("section").filter({ hasText: "추천 일자리" }).locator("article").count(),
    recentCount: await page.locator("section").filter({ hasText: "최근 본 일자리" }).locator("a").count(),
  };
}

async function collectJobDiagnosisMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "일자리 진단" }).first().textContent())?.trim() ?? "",
    questionCount: await page.locator("text=/Q[1-4]\\./").count(),
    hasCounselHandoff: await page.getByRole("link", { name: "복잡해요, 상담부터 받을래요" }).isVisible(),
    primaryCta: (await page.getByRole("button", { name: "다음" }).textContent())?.trim() ?? "",
  };
}

async function collectJobResultMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "진단 결과" }).first().textContent())?.trim() ?? "",
    headline: (await page.locator("section").first().locator("h2").textContent())?.replace(/\s+/g, " ").trim() ?? "",
    topRoleCount: await page.locator("section").filter({ hasText: "추천 직무 TOP 3" }).locator("article").count(),
    recommendedCount: await page.getByRole("link", { name: "상세보기" }).count(),
  };
}

async function collectJobsListMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "일자리" }).first().textContent())?.trim() ?? "",
    filterChipCount: await page.locator('button').filter({ hasText: /지역|추천순|기숙사 있음/ }).count(),
    visibleJobCount: await page.locator('a').filter({ hasText: "상세보기" }).count(),
    searchPlaceholder: await page.getByPlaceholder("검색어를 입력해주세요").getAttribute("placeholder"),
  };
}

async function collectRegionFilterMetrics(page) {
  return page.evaluate(() => {
    const title = document.querySelector("#job-region-filter-title")?.textContent?.trim() ?? "";
    const cityButtons = Array.from(document.querySelectorAll("button"))
      .map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
      .filter((text) => ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "충남/세종", "충북", "전남"].includes(text));
    const districtButtons = Array.from(document.querySelectorAll("button"))
      .map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
      .filter((text) => text.includes("성남/분당/판교") || text.includes("수원/용인") || text.includes("남양주/하남/구리"));

    return {
      pathname: window.location.pathname,
      title,
      cityRailCount: cityButtons.length,
      defaultDistrictCount: districtButtons.length,
      completeLabel:
        Array.from(document.querySelectorAll("button")).find((node) => node.textContent?.includes("지역 선택 완료"))?.textContent?.trim() ?? "",
    };
  });
}

async function collectJobDetailMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "자동차 부품 조립 및 검사 (주간)" }).textContent())?.trim() ?? "",
    topTagCount: await page.locator("section").first().locator("span").filter({ hasText: /즉시 지원 가능|기숙사|초보 가능/ }).count(),
    workConditionCount: await page.locator("text=근무 조건 상세").locator("..").locator("div[class*='justify-between']").count(),
    hasApplicationCta: await page.getByRole("link", { name: "AI 상담 이어가기" }).isVisible(),
  };
}

async function takeRetainedScreenshot(page, path, hostSuffix) {
  await page.screenshot({ path, fullPage: false });
  preserveHostArtifact(path, hostSuffix);
}

test("APP_014~APP_022 retain administration/jobs visual baseline", async ({ page, baseURL }) => {
  ensureResultsDir();
  await seedProtectedPreviewSession(page);

  const resolvedBaseUrl = baseURL ?? process.env.BASE_URL ?? "http://127.0.0.1:4173";
  const hostSuffix = buildHostSuffix(resolvedBaseUrl);

  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto(`${resolvedBaseUrl}/administration/result`, { waitUntil: "networkidle" });
  await expect(page.getByText("연장 가능성", { exact: false })).toBeVisible();
  const administrationResult = await collectAdministrationResultMetrics(page);
  await expect(administrationResult.pathname).toBe("/administration/result");
  expect(administrationResult.summaryTileCount).toBe(4);
  expect(administrationResult.requiredDocumentCount).toBe(6);
  expect(administrationResult.primaryCta).toBe("AI 상담 이어가기");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_014, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/administration/document-preview?doc=registration-card`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "외국인등록증" })).toBeVisible();
  const documentPreview = await collectDocumentPreviewMetrics(page);
  await expect(documentPreview.pathname).toBe("/administration/document-preview");
  expect(documentPreview.checklistCount).toBe(3);
  expect(documentPreview.fieldCount).toBe(3);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_015, hostSuffix);

  await page.getByRole("link", { name: "행정 콘텐츠 보기" }).click();
  await page.waitForURL("**/contents/administration-doc");
  await expect(page.getByRole("heading", { name: "행정 서류 준비 전에 꼭 볼 내용" })).toBeVisible();
  const contentDetail = await collectContentDetailMetrics(page);
  await expect(contentDetail.pathname).toBe("/contents/administration-doc");
  expect(contentDetail.introCount).toBe(3);
  expect(contentDetail.blockHeadingCount).toBe(1);
  expect(contentDetail.imageCount).toBe(2);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_016, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/jobs`, { waitUntil: "networkidle" });
  await expect(page.getByText("내 조건에 맞는 일자리,", { exact: false })).toBeVisible();
  const jobsHub = await collectJobsHubMetrics(page);
  await expect(jobsHub.pathname).toBe("/jobs");
  expect(jobsHub.recommendedCount).toBe(2);
  expect(jobsHub.guideCount).toBe(1);
  expect(jobsHub.recentCount).toBe(2);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_017, hostSuffix);

  await page.getByRole("link", { name: "진단 시작" }).click();
  await page.waitForURL("**/jobs/diagnosis");
  await expect(page.getByText("Q1. 현재 상태가 어떤가요?")).toBeVisible();
  const jobDiagnosis = await collectJobDiagnosisMetrics(page);
  await expect(jobDiagnosis.pathname).toBe("/jobs/diagnosis");
  expect(jobDiagnosis.questionCount).toBe(4);
  expect(jobDiagnosis.hasCounselHandoff).toBe(true);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_018, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/jobs/result`, { waitUntil: "networkidle" });
  await expect(page.getByText("잘 맞아요", { exact: false })).toBeVisible();
  const jobResult = await collectJobResultMetrics(page);
  await expect(jobResult.pathname).toBe("/jobs/result");
  expect(jobResult.topRoleCount).toBe(3);
  expect(jobResult.recommendedCount).toBeGreaterThanOrEqual(2);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_019, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/jobs/list`, { waitUntil: "networkidle" });
  await expect(page.getByPlaceholder("검색어를 입력해주세요")).toBeVisible();
  const jobsList = await collectJobsListMetrics(page);
  await expect(jobsList.pathname).toBe("/jobs/list");
  expect(jobsList.filterChipCount).toBeGreaterThanOrEqual(3);
  expect(jobsList.visibleJobCount).toBeGreaterThanOrEqual(2);
  expect(jobsList.searchPlaceholder).toBe("검색어를 입력해주세요");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_020, hostSuffix);

  await page.getByRole("button", { name: /지역/ }).first().click();
  await page.waitForURL("**/jobs/filter/region");
  await expect(page.getByRole("heading", { name: "지역 선택" })).toBeVisible();
  const regionFilter = await collectRegionFilterMetrics(page);
  await expect(regionFilter.pathname).toBe("/jobs/filter/region");
  expect(regionFilter.cityRailCount).toBeGreaterThanOrEqual(10);
  expect(regionFilter.defaultDistrictCount).toBe(3);
  expect(regionFilter.completeLabel).toBe("지역 선택 완료");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_021, hostSuffix);

  await page.getByRole("button", { name: "지역 선택 완료" }).click();
  await page.waitForURL("**/jobs/list");
  await page.locator("a").filter({ hasText: "상세보기" }).first().click();
  await page.waitForURL(/\/jobs\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "자동차 부품 조립 및 검사 (주간)" })).toBeVisible();
  const jobDetail = await collectJobDetailMetrics(page);
  expect(jobDetail.pathname).toContain("/jobs/");
  expect(jobDetail.topTagCount).toBe(3);
  expect(jobDetail.workConditionCount).toBe(5);
  expect(jobDetail.hasApplicationCta).toBe(true);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_022, hostSuffix);

  writeFileSync(
    SUMMARY_PATH,
    `${JSON.stringify(
      {
        baseURL: resolvedBaseUrl,
        generatedAt: new Date().toISOString(),
        runtimeTree: [
          "App.tsx",
          "ProtectedRoute",
          "AdministrationResultScreen",
          "AdministrationDocumentPreviewScreen",
          "GenericScreenPage(ContentDetailScreen)",
          "JobsScreen",
          "JobDiagnosisScreen",
          "JobResultScreen",
          "JobsListScreen",
          "JobRegionFilterScreen",
          "GenericScreenPage(JobDetailScreen)",
        ],
        screens: {
          APP_014: administrationResult,
          APP_015: documentPreview,
          APP_016: contentDetail,
          APP_017: jobsHub,
          APP_018: jobDiagnosis,
          APP_019: jobResult,
          APP_020: jobsList,
          APP_021: regionFilter,
          APP_022: jobDetail,
        },
      },
      null,
      2,
    )}\n`,
  );
  preserveHostArtifact(SUMMARY_PATH, hostSuffix);
});
