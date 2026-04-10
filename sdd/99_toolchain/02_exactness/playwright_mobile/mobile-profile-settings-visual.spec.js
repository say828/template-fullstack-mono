import { expect, test } from "@playwright/test";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-profile-settings-visual-regression.json");

const SCREENSHOT_PATHS = {
  APP_045: resolve(RESULTS_DIR, "mobile-profile-settings-app045-profile.png"),
  APP_046: resolve(RESULTS_DIR, "mobile-profile-settings-app046-profile-me.png"),
  APP_047: resolve(RESULTS_DIR, "mobile-profile-settings-app047-emergency-guide.png"),
  APP_048: resolve(RESULTS_DIR, "mobile-profile-settings-app048-counseling-history.png"),
  APP_049: resolve(RESULTS_DIR, "mobile-profile-settings-app049-counseling-history-rename.png"),
  APP_050: resolve(RESULTS_DIR, "mobile-profile-settings-app050-diagnosis-history.png"),
  APP_051: resolve(RESULTS_DIR, "mobile-profile-settings-app051-education-history.png"),
  APP_052: resolve(RESULTS_DIR, "mobile-profile-settings-app052-favorites.png"),
  APP_053: resolve(RESULTS_DIR, "mobile-profile-settings-app053-notifications-settings.png"),
  APP_054: resolve(RESULTS_DIR, "mobile-profile-settings-app054-notifications-time.png"),
  APP_056: resolve(RESULTS_DIR, "mobile-profile-settings-app056-emergency-settings.png"),
  APP_057: resolve(RESULTS_DIR, "mobile-profile-settings-app057-emergency-contact-form.png"),
};

const STORAGE_KEYS = {
  previewUser: "passv-in.auth.preview-user",
  runtimeOnboarding: "passv-in.runtime.onboarding",
  runtimeSession: "passv-in.runtime.session",
  flowState: "passv-in.flow.state",
  profileActivity: "passv-in.profile.activity.v1",
  profileDetails: "passv-in.profile.detail.v1",
};

const SEEDED_PREVIEW_USER = {
  id: "preview-profile-settings-visual",
  email: "mobile-profile-settings@passv.preview",
  role: "member",
  nickname: "응우옌 민",
  phone: "010-2222-3333",
};

const SEEDED_RUNTIME_USER = {
  id: "in-01022223333",
  fullName: "Nguyen Van Minh",
  phoneNumber: "010-2222-3333",
  locale: "ko",
  authMethod: "phone",
  registeredAt: "2026-03-18T00:00:00.000Z",
  preview: true,
};

const SEEDED_FLOW_STATE = {
  locale: "ko",
  onboardingCompleted: true,
  pendingIdentity: null,
  agreements: ["service", "privacy"],
  sessionProfileId: "profile-visual-001",
  registeredProfiles: [
    {
      id: "profile-visual-001",
      name: "Nguyen Van Minh",
      birthDate: "1995-05-20",
      carrier: "KT",
      phone: "010-2222-3333",
      gender: "남성",
      nationality: "베트남",
      maritalStatus: "미혼",
      education: "고등학교",
      visaType: "E-9 (비전문취업)",
      epsStatus: "응시함",
      passportNumber: "M12345678",
      passportExpiry: "2028-05-20",
      agency: "서울인력개발원",
      koreaExperience: "2년",
      jobSector: "제조업",
      experienceLevel: "1~3년",
      physicalConstraint: "없음",
      dangerousWork: true,
      protectiveEquipment: true,
      chronicCondition: "없음",
      createdAt: "2026-03-18T00:00:00.000Z",
    },
  ],
  contacts: [
    {
      id: "contact-company-manager",
      name: "사장님 (회사)",
      phone: "010-1234-5678",
    },
  ],
  notificationEnabled: true,
  notificationTime: "09:00",
  translationLanguage: "한국어",
  translationMode: "음성 우선",
  emergencyMapButtonVisible: true,
  emergencyAutoDetectionEnabled: true,
  shareLocationInEmergency: true,
};

const SEEDED_PROFILE_ACTIVITY = {
  counselingCount: 12,
  diagnosisCount: 5,
  educationCount: 8,
};

const SEEDED_PROFILE_DETAILS = {
  fullName: "Nguyen Van Minh",
  authMethodLabel: "휴대폰 가입",
  email: "mobile-profile-settings@passv.preview",
  phoneNumber: "010-2222-3333",
  gender: "남성",
  birthDate: "1995-05-20",
  nationality: "베트남",
  visaType: "E-9 (비전문취업)",
  epsStatus: "응시함",
  passportNumber: "M12345678",
  passportExpiry: "2028-05-20",
  agencyName: "서울인력개발원",
  industries: ["제조업", "건설업"],
  workExperience: "1~3년",
  hazardousWorkAvailable: true,
  chronicCondition: "없음",
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

async function takeRetainedScreenshot(page, path, hostSuffix) {
  await page.screenshot({ path, fullPage: false });
  preserveHostArtifact(path, hostSuffix);
}

async function readText(locator) {
  return ((await locator.first().textContent()) ?? "").replace(/\s+/g, " ").trim();
}

async function installProtectedPreviewSession(page) {
  await page.addInitScript(
    ({ flowState, keys, previewUser, profileActivity, profileDetails, runtimeUser }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(keys.previewUser, JSON.stringify(previewUser));
      window.localStorage.setItem(keys.runtimeOnboarding, JSON.stringify(true));
      window.localStorage.setItem(keys.runtimeSession, JSON.stringify(runtimeUser));
      window.localStorage.setItem(keys.flowState, JSON.stringify(flowState));
      window.localStorage.setItem(keys.profileActivity, JSON.stringify(profileActivity));
      window.localStorage.setItem(keys.profileDetails, JSON.stringify(profileDetails));
    },
    {
      flowState: SEEDED_FLOW_STATE,
      keys: STORAGE_KEYS,
      previewUser: SEEDED_PREVIEW_USER,
      profileActivity: SEEDED_PROFILE_ACTIVITY,
      profileDetails: SEEDED_PROFILE_DETAILS,
      runtimeUser: SEEDED_RUNTIME_USER,
    },
  );
}

async function collectProfileMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    headerTitle: await readText(page.getByRole("heading", { name: "프로필" })),
    summaryMetricCount: await page.getByRole("link").filter({ hasText: /상담 내역|진단 기록|교육 이수/ }).count(),
    menuLabelCount: await page.getByRole("link").filter({ hasText: /상담 기록|진단 결과 모아보기|교육 이력|즐겨찾기|알림 설정|통역 기본 설정|긴급 기능 설정|자주하는 질문|공지사항|1:1문의|앱 설정/ }).count(),
    emergencyBannerVisible: await page.getByText("긴급 도움 사용 방법 보기").isVisible(),
  };
}

async function collectProfileMeMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    sectionCount: await page.locator("section").count(),
    infoRowCount: await page.locator("section").locator("button, div").filter({ hasText: /이름|가입 수단|이메일|휴대폰 번호|성별|생년월일|국적|체류 자격|EPS 응시 여부|여권 번호|만료일|파견 기관|희망 업종|주요 경력|위험 작업 가능 여부|만성 질환 여부/ }).count(),
    saveToastVisible: await page.getByText("내 정보를 저장했습니다.").isVisible(),
  };
}

async function collectEmergencyGuideMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    heroTitle: await readText(page.getByRole("heading", { name: /긴급 도움 사용 방법/ })),
    exampleCount: await page.locator("ul").first().locator("li.list-disc").count(),
    stepCount: await page.getByText(/119 연결|112 도움 요청|가까운 병원 찾기/).count(),
  };
}

async function collectCounselingHistoryMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    searchPlaceholder: await page.locator('input[placeholder="상담 내용 검색"]').getAttribute("placeholder"),
    categoryCount: await page.getByRole("button").filter({ hasText: /전체|권익|일자리|교육|건강|행정/ }).count(),
    recordCount: await page.getByRole("button").filter({ hasText: /비자 연장 서류 안내|두통 및 발열 증상 상담/ }).count(),
  };
}

async function collectCounselingRenameMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    dialogTitle: await readText(page.getByRole("heading", { name: "채팅 이름 바꾸기" })),
    confirmDisabled: await page.getByRole("button", { name: "확인", exact: true }).isDisabled(),
  };
}

async function collectDiagnosisHistoryMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    chipCount: await page.getByRole("button").filter({ hasText: /전체|권익|건강|행정|일자리|교육/ }).count(),
    cardCount: await page.getByRole("link").filter({ hasText: /임금 체불과 휴게시간 보호|병원 방문과 통역 도움 필요|체류 서류 준비 상태 점검|조건에 맞는 추천 공고 확인|다음에 들을 교육 코스 정리/ }).count(),
    searchPlaceholder: await page.getByPlaceholder("진단 기록을 검색해보세요").getAttribute("placeholder"),
  };
}

async function collectEducationHistoryMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    chipCount: await page.getByRole("button").filter({ hasText: /전체|생활 규칙|노동법|산업안전/ }).count(),
    summaryCellCount: await page.locator("section").filter({ hasText: /총 학습|학습 완료|퀴즈 완료|평균 점수/ }).locator("div > p").count(),
    itemCount: await page.locator("article").count(),
    overflowVisible: await page.getByRole("button", { name: /임금 체불이 발생했을 때 대처 더보기/ }).isVisible(),
  };
}

async function collectFavoritesMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    searchPlaceholder: await page.getByPlaceholder("즐겨찾기한 콘텐츠 검색").getAttribute("placeholder"),
    chipCount: await page.getByRole("button").filter({ hasText: /전체|행정|일자리|교육|건강/ }).count(),
    cardCount: await page.locator('a[href="/contents/favorite-item"]').count(),
  };
}

async function collectNotificationsSettingsMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    rowCount: await page.locator(
      'button[aria-label="상담 알림"], button[aria-label="진단 결과 알림"], button[aria-label="추천 정보 알림"], button[aria-label="교육 알림"], button[aria-label="행정 안내 알림"], button[aria-label="권익/건강 중요 알림"], button[aria-label="공지/시스템 알림"]',
    ).count(),
    scheduleLabel: await readText(page.getByText(/09:00 - 21:00|08:00 - 20:00/)),
    quietModePressed: await page.getByRole("button", { name: "중요한 알림 모드" }).getAttribute("aria-pressed"),
  };
}

async function collectNotificationsTimeMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    dialogTitle: await readText(page.getByRole("heading", { name: "알림 수신 시간" })),
    startChipCount: await page.getByRole("button").filter({ hasText: /06:00|07:00|08:00|09:00|10:00|18:00|20:00|21:00|22:00/ }).count(),
    quietModePressed: await page.getByRole("button", { name: "조용한 시간 유지" }).getAttribute("aria-pressed"),
  };
}

async function collectEmergencySettingsMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    toggleCount: await page.locator(
      'button[aria-label="앱 상단 긴급 버튼 표시"], button[aria-label="위험 상황 자동 감지"], button[aria-label="긴급 시 위치 자동 사용"]',
    ).count(),
    contactCount: await page.getByText(/사장님 \(회사\)|김영희/).count(),
    helperCopyVisible: await page.getByText("긴급 상황 시 설정한 연락처로 알림을 보낼 수 있습니다.").isVisible(),
  };
}

async function collectEmergencyContactFormMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    dialogTitle: await readText(page.getByRole("heading", { name: "연락처 추가" })),
    saveDisabled: await page.getByRole("button", { name: "저장" }).isDisabled(),
  };
}

test("APP_045~APP_057 retain profile/settings visual baseline", async ({ page, baseURL }) => {
  ensureResultsDir();
  await installProtectedPreviewSession(page);

  const resolvedBaseUrl = baseURL ?? process.env.BASE_URL ?? "http://127.0.0.1:4173";
  const hostSuffix = buildHostSuffix(resolvedBaseUrl);
  const summary = {
    baseURL: resolvedBaseUrl,
    generatedAt: new Date().toISOString(),
    runtimeTree: [
      "main.tsx",
      "BrowserRouter",
      "App.tsx",
      "ProtectedRoute",
      "ProfileScreen",
      "ProfileMeScreen",
      "EmergencyGuideScreen",
      "CounselingHistoryScreen",
      "CounselingHistoryRenameScreen",
      "ProfileDiagnosisHistoryScreen",
      "EducationHistoryScreen",
      "FavoritesScreen",
      "NotificationsSettingsScreen",
      "NotificationsTimeSettingsScreen",
      "EmergencySettingsScreen",
      "EmergencyContactFormScreen",
    ],
    screens: {},
  };

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(resolvedBaseUrl, { waitUntil: "domcontentloaded" });

  await page.goto(`${resolvedBaseUrl}/profile`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "프로필" })).toBeVisible();
  const app045 = await collectProfileMetrics(page);
  expect(app045.pathname).toBe("/profile");
  expect(app045.summaryMetricCount).toBe(3);
  expect(app045.menuLabelCount).toBe(11);
  expect(app045.emergencyBannerVisible).toBe(true);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_045, hostSuffix);
  summary.screens.APP_045 = app045;

  await page.getByRole("link", { name: "내 정보 수정" }).click();
  await page.waitForURL("**/profile/me");
  await expect(page.getByRole("heading", { name: "내 정보" })).toBeVisible();
  await page.getByRole("button", { name: /휴대폰 번호/ }).click();
  await page.getByLabel("휴대폰 번호").fill("010-9999-1212");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText("내 정보를 저장했습니다.")).toBeVisible();
  const app046 = await collectProfileMeMetrics(page);
  expect(app046.pathname).toBe("/profile/me");
  expect(app046.sectionCount).toBeGreaterThanOrEqual(3);
  expect(app046.infoRowCount).toBeGreaterThanOrEqual(15);
  expect(app046.saveToastVisible).toBe(true);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_046, hostSuffix);
  summary.screens.APP_046 = app046;

  await page.goto(`${resolvedBaseUrl}/profile/emergency-guide`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "긴급 도움 사용 방법", exact: true })).toBeVisible();
  const app047 = await collectEmergencyGuideMetrics(page);
  expect(app047.pathname).toBe("/profile/emergency-guide");
  expect(app047.exampleCount).toBe(5);
  expect(app047.stepCount).toBeGreaterThanOrEqual(3);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_047, hostSuffix);
  summary.screens.APP_047 = app047;

  await page.goto(`${resolvedBaseUrl}/profile/counseling-history`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "상담 기록" })).toBeVisible();
  const app048 = await collectCounselingHistoryMetrics(page);
  expect(app048.pathname).toBe("/profile/counseling-history");
  expect(app048.categoryCount).toBe(6);
  expect(app048.recordCount).toBe(2);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_048, hostSuffix);
  summary.screens.APP_048 = app048;

  await page.getByRole("button", { name: "두통 및 발열 증상 상담 메뉴", exact: true }).click();
  await page.getByRole("link", { name: "이름 변경" }).click();
  await page.waitForURL("**/profile/counseling-history/rename");
  await expect(page.getByRole("heading", { name: "채팅 이름 바꾸기" })).toBeVisible();
  const app049 = await collectCounselingRenameMetrics(page);
  expect(app049.pathname).toBe("/profile/counseling-history/rename");
  expect(app049.confirmDisabled).toBe(true);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_049, hostSuffix);
  await page.locator('input[type="text"]').fill("두통 및 발열 증상 상담 메모");
  await page.getByRole("button", { name: "확인", exact: true }).click();
  await page.waitForURL("**/profile/counseling-history");
  await expect(page.getByText("두통 및 발열 증상 상담 메모")).toBeVisible();
  summary.screens.APP_049 = app049;

  await page.goto(`${resolvedBaseUrl}/profile/diagnosis-history`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "진단기록" })).toBeVisible();
  const app050 = await collectDiagnosisHistoryMetrics(page);
  expect(app050.pathname).toBe("/profile/diagnosis-history");
  expect(app050.chipCount).toBe(6);
  expect(app050.cardCount).toBe(5);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_050, hostSuffix);
  await page.getByRole("link", { name: /임금 체불과 휴게시간 보호/ }).click();
  await page.waitForURL("**/rights/result");
  await page.goBack({ waitUntil: "networkidle" });
  await page.waitForURL("**/profile/diagnosis-history");
  summary.screens.APP_050 = app050;

  await page.goto(`${resolvedBaseUrl}/profile/education-history`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "교육 이력" })).toBeVisible();
  const app051 = await collectEducationHistoryMetrics(page);
  expect(app051.pathname).toBe("/profile/education-history");
  expect(app051.chipCount).toBe(4);
  expect(app051.summaryCellCount).toBeGreaterThanOrEqual(8);
  expect(app051.itemCount).toBe(3);
  expect(app051.overflowVisible).toBe(true);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_051, hostSuffix);
  summary.screens.APP_051 = app051;

  await page.goto(`${resolvedBaseUrl}/profile/favorites`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "즐겨찾기" })).toBeVisible();
  const app052 = await collectFavoritesMetrics(page);
  expect(app052.pathname).toBe("/profile/favorites");
  expect(app052.chipCount).toBe(5);
  expect(app052.cardCount).toBe(3);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_052, hostSuffix);
  summary.screens.APP_052 = app052;

  await page.goto(`${resolvedBaseUrl}/settings/notifications`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "알림 설정" })).toBeVisible();
  const app053 = await collectNotificationsSettingsMetrics(page);
  expect(app053.pathname).toBe("/settings/notifications");
  expect(app053.rowCount).toBe(7);
  expect(app053.scheduleLabel).toContain("09:00 - 21:00");
  expect(app053.quietModePressed).toBe("true");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_053, hostSuffix);
  summary.screens.APP_053 = app053;

  await page.getByRole("button", { name: "시간 변경" }).click();
  await page.waitForURL("**/settings/notifications/time");
  await expect(page.getByRole("heading", { name: "알림 수신 시간" })).toBeVisible();
  const app054 = await collectNotificationsTimeMetrics(page);
  expect(app054.pathname).toBe("/settings/notifications/time");
  expect(app054.startChipCount).toBeGreaterThanOrEqual(18);
  expect(app054.quietModePressed).toBe("true");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_054, hostSuffix);
  await page.getByRole("button", { name: "08:00" }).first().click();
  await page.getByRole("button", { name: "20:00" }).last().click();
  await page.getByRole("button", { name: "저장" }).click();
  await page.waitForURL("**/settings/notifications");
  await expect(page.getByText("08:00 - 20:00")).toBeVisible();
  summary.screens.APP_054 = app054;

  await page.goto(`${resolvedBaseUrl}/settings/emergency`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "긴급 기능 설정" })).toBeVisible();
  const app056 = await collectEmergencySettingsMetrics(page);
  expect(app056.pathname).toBe("/settings/emergency");
  expect(app056.toggleCount).toBe(3);
  expect(app056.contactCount).toBe(1);
  expect(app056.helperCopyVisible).toBe(true);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_056, hostSuffix);
  await expect(page.getByRole("button", { name: "앱 상단 긴급 버튼 표시" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "앱 상단 긴급 버튼 표시" }).click();
  await expect(page.getByRole("button", { name: "앱 상단 긴급 버튼 표시" })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "연락처 추가" }).click();
  summary.screens.APP_056 = app056;

  await page.waitForURL("**/settings/contacts/new");
  await expect(page.getByRole("heading", { name: "연락처 추가" })).toBeVisible();
  const app057 = await collectEmergencyContactFormMetrics(page);
  expect(app057.pathname).toBe("/settings/contacts/new");
  expect(app057.saveDisabled).toBe(true);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_057, hostSuffix);
  await page.getByPlaceholder("이름 입력").fill("김영희");
  await page.getByPlaceholder("연락처 입력").fill("01098761234");
  await page.getByRole("button", { name: "저장" }).click();
  await page.waitForURL("**/settings/emergency");
  await expect(page.getByText("김영희")).toBeVisible();
  await expect(page.getByText("010-9876-1234")).toBeVisible();
  summary.screens.APP_057 = app057;

  writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  preserveHostArtifact(SUMMARY_PATH, hostSuffix);
});
