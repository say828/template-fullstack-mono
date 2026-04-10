import { expect, test } from "@playwright/test";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-domain-visual-regression.json");

const SCREENSHOT_PATHS = {
  APP_023: resolve(RESULTS_DIR, "mobile-domain-app023-education-hub.png"),
  APP_024: resolve(RESULTS_DIR, "mobile-domain-app024-education-diagnosis.png"),
  APP_025: resolve(RESULTS_DIR, "mobile-domain-app025-education-result.png"),
  APP_026: resolve(RESULTS_DIR, "mobile-domain-app026-education-list.png"),
  APP_027: resolve(RESULTS_DIR, "mobile-domain-app027-education-learning-start.png"),
  APP_028: resolve(RESULTS_DIR, "mobile-domain-app028-education-learning-completed.png"),
  APP_029: resolve(RESULTS_DIR, "mobile-domain-app029-education-quiz.png"),
  APP_030: resolve(RESULTS_DIR, "mobile-domain-app030-education-quiz-result.png"),
  APP_031: resolve(RESULTS_DIR, "mobile-domain-app031-rights-hub.png"),
  APP_032: resolve(RESULTS_DIR, "mobile-domain-app032-rights-diagnosis.png"),
  APP_033: resolve(RESULTS_DIR, "mobile-domain-app033-rights-result.png"),
  APP_034: resolve(RESULTS_DIR, "mobile-domain-app034-health-hub.png"),
  APP_035: resolve(RESULTS_DIR, "mobile-domain-app035-health-diagnosis.png"),
  APP_036: resolve(RESULTS_DIR, "mobile-domain-app036-health-result.png"),
  APP_037: resolve(RESULTS_DIR, "mobile-domain-app037-health-location-permission.png"),
  APP_038: resolve(RESULTS_DIR, "mobile-domain-app038-health-location-manual.png"),
  APP_039: resolve(RESULTS_DIR, "mobile-domain-app039-health-facilities.png"),
  APP_040: resolve(RESULTS_DIR, "mobile-domain-app040-health-interpretation.png"),
  APP_041: resolve(RESULTS_DIR, "mobile-domain-app041-counseling-home.png"),
  APP_042: resolve(RESULTS_DIR, "mobile-domain-app042-counseling-answer.png"),
  APP_043: resolve(RESULTS_DIR, "mobile-domain-app043-counseling-voice.png"),
  APP_044: resolve(RESULTS_DIR, "mobile-domain-app044-counseling-options.png"),
};

const PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user";
const RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session";
const RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding";
const COUNSEL_SESSION_STORAGE_KEY = "passv-in.counsel.session";
const COUNSEL_MESSAGE_STORAGE_KEY = "passv-in.counsel.messages";
const COUNSEL_FILE_STORAGE_KEY = "passv-in.counsel.files";
const COUNSEL_GALLERY_STORAGE_KEY = "passv-in.counsel.gallery";

const SEEDED_PREVIEW_USER = {
  id: "preview-domain-visual",
  email: "mobile-domain-visual@passv.preview",
  role: "member",
  nickname: "교육 권익 건강 검수",
  phone: "010-1111-4444",
};

const SEEDED_RUNTIME_USER = {
  id: "in-01011114444",
  fullName: "교육 권익 건강 검수",
  phoneNumber: "010-1111-4444",
  locale: "ko",
  authMethod: "phone",
  registeredAt: "2026-03-18T00:00:00.000Z",
  preview: true,
};

const SEEDED_COUNSELING_SESSION = {
  agentId: "agent-health-visual",
  aiCategory: "health",
  origin: "/health/result",
  title: "건강 결과 이어보기",
};

const SEEDED_COUNSELING_MESSAGES = [
  {
    localId: "seed-user-1",
    role: "user",
    text: "건강 진단 결과를 받았어요. 병원에 가야 할까요?",
  },
  {
    localId: "seed-assistant-1",
    role: "assistant",
    text: "배 통증이 계속되면 오늘 중으로 병원이나 약국 상담을 먼저 받아보는 편이 좋아요.",
  },
];

const SEEDED_GALLERY = [
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9s1s3W8AAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AApMBgXl16r0AAAAASUVORK5CYII=",
];

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

async function installProtectedPreviewSession(page) {
  await page.addInitScript(
    ({
      counselingFilesKey,
      counselingGalleryKey,
      counselingMessages,
      counselingMessagesKey,
      counselingSession,
      counselingSessionKey,
      onboardingKey,
      previewKey,
      previewUser,
      recentGallery,
      runtimeKey,
      runtimeUser,
    }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(previewKey, JSON.stringify(previewUser));
      window.localStorage.setItem(runtimeKey, JSON.stringify(runtimeUser));
      window.localStorage.setItem(onboardingKey, JSON.stringify(true));
      window.localStorage.setItem(counselingSessionKey, JSON.stringify(counselingSession));
      window.localStorage.setItem(counselingMessagesKey, JSON.stringify(counselingMessages));
      window.localStorage.setItem(counselingFilesKey, JSON.stringify({}));
      window.localStorage.setItem(counselingGalleryKey, JSON.stringify(recentGallery));

      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          async writeText() {},
        },
      });

      if (!navigator.mediaDevices) {
        Object.defineProperty(navigator, "mediaDevices", {
          configurable: true,
          value: {},
        });
      }

      navigator.mediaDevices.getUserMedia = async () => ({
        getTracks() {
          return [{ stop() {} }];
        },
      });

      class MockAnalyser {
        fftSize = 512;

        getByteTimeDomainData(array) {
          for (let index = 0; index < array.length; index += 1) {
            array[index] = 140;
          }
        }
      }

      class MockAudioContext {
        createAnalyser() {
          return new MockAnalyser();
        }

        createMediaStreamSource() {
          return {
            connect() {},
          };
        }

        async close() {}
      }

      class MockMediaRecorder {
        static isTypeSupported() {
          return true;
        }

        constructor(stream, options = {}) {
          this.stream = stream;
          this.mimeType = options.mimeType ?? "audio/webm";
          this.state = "inactive";
          this.ondataavailable = null;
          this.onerror = null;
          this.onstop = null;
        }

        start() {
          this.state = "recording";
        }

        stop() {
          this.state = "inactive";
          this.onstop?.();
        }
      }

      Object.defineProperty(window, "AudioContext", {
        configurable: true,
        value: MockAudioContext,
      });
      Object.defineProperty(window, "webkitAudioContext", {
        configurable: true,
        value: MockAudioContext,
      });
      Object.defineProperty(window, "MediaRecorder", {
        configurable: true,
        value: MockMediaRecorder,
      });

      class MockSpeechRecognition {
        constructor() {
          this.continuous = false;
          this.interimResults = true;
          this.lang = "ko-KR";
          this.maxAlternatives = 1;
          this.onend = null;
          this.onerror = null;
          this.onresult = null;
          this.onstart = null;
        }

        abort() {
          this.onend?.(new Event("end"));
        }

        start() {
          this.onstart?.(new Event("start"));
          this.onresult?.({
            resultIndex: 0,
            results: {
              0: {
                0: { transcript: "도움이 필요해요" },
                isFinal: true,
                length: 1,
              },
              length: 1,
            },
          });
          this.onend?.(new Event("end"));
        }

        stop() {
          this.onend?.(new Event("end"));
        }
      }

      Object.defineProperty(window, "SpeechRecognition", {
        configurable: true,
        value: MockSpeechRecognition,
      });
      Object.defineProperty(window, "webkitSpeechRecognition", {
        configurable: true,
        value: MockSpeechRecognition,
      });
    },
    {
      counselingFilesKey: COUNSEL_FILE_STORAGE_KEY,
      counselingGalleryKey: COUNSEL_GALLERY_STORAGE_KEY,
      counselingMessages: SEEDED_COUNSELING_MESSAGES,
      counselingMessagesKey: COUNSEL_MESSAGE_STORAGE_KEY,
      counselingSession: SEEDED_COUNSELING_SESSION,
      counselingSessionKey: COUNSEL_SESSION_STORAGE_KEY,
      onboardingKey: RUNTIME_ONBOARDING_STORAGE_KEY,
      previewKey: PREVIEW_STORAGE_KEY,
      previewUser: SEEDED_PREVIEW_USER,
      recentGallery: SEEDED_GALLERY,
      runtimeKey: RUNTIME_SESSION_STORAGE_KEY,
      runtimeUser: SEEDED_RUNTIME_USER,
    },
  );
}

async function collectEducationHubMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "내 수준에 맞는 공부," }).textContent())?.replace(/\s+/g, " ").trim() ?? "",
    primaryCardCount: await page.locator("a").filter({ hasText: /진단 시작|상담 하기/ }).count(),
    recommendedCount: await page.locator("section").filter({ hasText: "추천 교육" }).locator("article").count(),
    categoryCount: await page.locator("section").filter({ hasText: "카테고리별 교육" }).locator("a").count(),
    faqCount: await page.locator("a").filter({ hasText: /한국에서 일할 때 꼭 알아야 할 말|현장에서 자주 쓰는 표현 모음|안전교육 왜 중요할까요\?/ }).count(),
    continueCount: await page.locator("section").filter({ hasText: "계속 공부하기" }).locator("a").count(),
  };
}

async function collectEducationDiagnosisMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "교육 진단" }).first().textContent())?.trim() ?? "",
    questionCount: await page.locator("text=/Q[0-9]+\\./").count(),
    hasCounselLink: await page.getByRole("link", { name: "복잡해요, 상담부터 받을래요" }).isVisible(),
    primaryLabel: (await page.getByRole("button", { name: "다음" }).textContent())?.trim() ?? "",
  };
}

async function collectEducationResultMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "진단 결과" }).first().textContent())?.trim() ?? "",
    understandingRowCount: await page.locator("span").filter({ hasText: /집중 추천|보통 필요|기본 OK|초급 단계/ }).count(),
    recommendedCount: await page.locator("section").filter({ hasText: "지금 먼저 보면 좋아요" }).locator("article").count(),
    orderCount: await page.locator("p").filter({ hasText: /산업 안전|생활 규칙|노동법|한국어/ }).count(),
    counselingCta: (await page.getByRole("link", { name: "AI 상담 이어가기" }).textContent())?.trim() ?? "",
  };
}

async function collectEducationListMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "교육" }).first().textContent())?.trim() ?? "",
    chipCount: await page.locator("button").filter({ hasText: /전체|생활 규칙|노동법|산업안전/ }).count(),
    visibleCourseCount: await page.locator("article").count(),
    searchPlaceholder: await page.getByPlaceholder("콘텐츠 검색").getAttribute("placeholder"),
  };
}

async function collectEducationLearningStartMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.locator("text=현재 학습 중").textContent())?.trim() ?? "",
    courseTitle: (await page.getByRole("heading", { level: 2 }).textContent())?.trim() ?? "",
    progressBadge: (await page.locator("span").filter({ hasText: "2" }).first().textContent())?.trim() ?? "",
    primaryCta: (await page.getByRole("link", { name: "퀴즈 풀기" }).textContent())?.trim() ?? "",
  };
}

async function collectEducationLearningCompletedMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByText("수고했어요! 학습 완료", { exact: false }).textContent())?.replace(/\s+/g, " ").trim() ?? "",
    actionCount: await page.locator("button").filter({ hasText: /나중에|퀴즈 풀기/ }).count(),
    primaryAction: (await page.getByRole("button", { name: "퀴즈 풀기" }).textContent())?.trim() ?? "",
  };
}

async function collectEducationQuizMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "퀴즈" }).first().textContent())?.trim() ?? "",
    choiceCount: await page.locator("button").filter({ hasText: /맞아요|아니에요/ }).count(),
    submitLabel: (await page.getByRole("button", { name: "선택" }).textContent())?.trim() ?? "",
  };
}

async function collectEducationQuizResultMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "퀴즈" }).first().textContent())?.trim() ?? "",
    feedbackTitle: (await page.getByText(/정답이에요!|틀렸어요!/).textContent())?.trim() ?? "",
    actionLabel: (await page.getByRole("button", { name: /다음|완료/ }).textContent())?.trim() ?? "",
  };
}

async function collectRightsHubMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "부당한 일을 겪고 있나요?" }).textContent())?.trim() ?? "",
    categoryCount: await page.locator("button").filter({ hasText: /전체|임금 · 시간|폭언 · 폭행|계약 · 해고|차별/ }).count(),
    contentRowCount: await page.locator("section").filter({ hasText: "야근 했는데 돈을 못받았어요" }).locator("a").count(),
    searchPlaceholder: await page.getByPlaceholder("콘텐츠 검색").getAttribute("placeholder"),
  };
}

async function collectRightsDiagnosisMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "권익 진단" }).first().textContent())?.trim() ?? "",
    questionCount: await page.locator("text=/Q[0-9]+\\./").count(),
    hasCounselLink: await page.getByRole("link", { name: "복잡해요, 상담부터 받을래요" }).isVisible(),
    primaryLabel: (await page.getByRole("button", { name: "다음" }).textContent())?.trim() ?? "",
  };
}

async function collectRightsResultMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "진단 결과" }).first().textContent())?.trim() ?? "",
    resultRowCount: await page.locator("span").filter({ hasText: /높음|확인 필요|낮음/ }).count(),
    nextStepCount: await page.evaluate(() => {
      const labels = new Set(["안전 확보", "증거 확보", "상담", "신고"]);
      return Array.from(document.querySelectorAll("p"))
        .map((node) => node.textContent?.trim() ?? "")
        .filter((text) => labels.has(text)).length;
    }),
    counselingCta: (await page.getByRole("link", { name: "AI 상담 이어가기" }).textContent())?.replace(/\s+/g, " ").trim() ?? "",
  };
}

async function collectHealthHubMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "지금 몸 상태, 간단히 확인해요" }).textContent())?.trim() ?? "",
    cardCount: await page.locator("a").filter({ hasText: /자가 진단 시작|상담하기|병원 · 약국 찾기/ }).count(),
    guideRowCount: await page.locator("section").filter({ hasText: "이렇게 참고 하세요" }).locator("a").count(),
  };
}

async function collectHealthDiagnosisMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "건강진단" }).first().textContent())?.trim() ?? "",
    questionCount: await page.locator("text=/Q[1-9]\\./").count(),
    warningVisible: await page.getByText("즉시 병원 방문이 필요해요").isVisible().catch(() => false),
    primaryLabel: (await page.getByRole("button", { name: "다음" }).textContent())?.trim() ?? "",
  };
}

async function collectHealthResultMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "진단 결과" }).first().textContent())?.trim() ?? "",
    problemRowCount: await page.locator("section").filter({ hasText: "이런 문제가 있을 수 있어요" }).locator("div.flex.items-center.justify-between").count(),
    actionCardCount: await page.locator("section").filter({ hasText: "지금 이렇게 해보세요" }).locator("article").count(),
    counselingCta: (await page.getByRole("link", { name: "AI 상담 이어가기" }).textContent())?.replace(/\s+/g, " ").trim() ?? "",
  };
}

async function collectHealthLocationPermissionMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "현재 위치를 확인할까요?" }).textContent())?.trim() ?? "",
    primaryLabel: (await page.getByRole("button", { name: "위치 권한 허용" }).textContent())?.trim() ?? "",
    secondaryLabel: (await page.getByRole("button", { name: "직접 위치 입력" }).textContent())?.trim() ?? "",
  };
}

async function collectHealthLocationManualMetrics(page) {
  return page.evaluate(() => ({
    pathname: window.location.pathname,
    title: document.querySelector("#health-location-manual-title")?.textContent?.trim() ?? "",
    suggestionCount: Array.from(document.querySelectorAll("button"))
      .map((node) => node.textContent?.trim() ?? "")
      .filter((text) => text.includes("영등포구") || text.includes("안산시"))
      .length,
    primaryLabel:
      Array.from(document.querySelectorAll("button")).find((node) => node.textContent?.trim() === "선택")?.textContent?.trim() ?? "",
  }));
}

async function collectHealthFacilitiesMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "병원 약국 찾기" }).first().textContent())?.trim() ?? "",
    facilityCount: await page.locator("article").count(),
    categoryCount: await page.locator("button").filter({ hasText: /전체|약국|내과|이비인후과|산부인과/ }).count(),
    locationLabel: (await page.getByText("서울 영등포구 대림동", { exact: false }).first().textContent())?.trim() ?? "",
  };
}

async function collectInterpretationMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title: (await page.getByRole("heading", { name: "통역" }).first().textContent())?.trim() ?? "",
    idlePrompt: (await page.getByText("아래 마이크 버튼을 누르고 말해보세요").textContent())?.trim() ?? "",
    languageButtonCount: await page.locator("button").filter({ hasText: /한국어|English|Tiếng Việt|中文/ }).count(),
    micButtonVisible: await page.getByRole("button", { name: "통역 시작" }).isVisible(),
  };
}

async function collectCounselingHomeMetrics(page) {
  const languageLink = page.getByRole("link", { name: "언어 선택" });
  return {
    pathname: new URL(page.url()).pathname,
    promptCount: await page.locator("button").filter({ hasText: /어디로 가야 할지 모르겠어요|지금 뭘 해야할지 모르겠어요|서류를 어떻게 준비하죠\?|상황을 직접 입력할게요/ }).count(),
    helperTitle: (await page.getByText("어떤 도움이 필요한지 알려주세요.").textContent())?.trim() ?? "",
    composerPlaceholder: await page.getByPlaceholder("메시지를 입력해 주세요.").getAttribute("placeholder"),
    composerValue: await page.getByPlaceholder("메시지를 입력해 주세요.").inputValue(),
    languageShortcutHref: await languageLink.getAttribute("href"),
  };
}

async function collectCounselingAnswerMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    headerTitle: (await page.getByRole("heading", { name: "건강 결과 이어보기" }).textContent())?.trim() ?? "",
    bubbleCount: await page.locator("p.whitespace-pre-wrap").count(),
    healthCardCount: await page.locator("article").filter({ hasText: /어디가 불편하신가요\?|서울 김수안내과의원/ }).count(),
    composerPlaceholder: await page.getByPlaceholder("메시지를 입력해 주세요.").getAttribute("placeholder"),
  };
}

async function collectCounselingVoiceMetrics(page) {
  return {
    pathname: new URL(page.url()).pathname,
    title:
      (await page.getByText(/듣고 있어요|마이크가 켜져 있습니다\./).first().textContent().catch(() => ""))?.trim() ?? "",
    actionCount: await page.locator("button").filter({ hasText: /텍스트 입력|음성 중단|대화 종료/ }).count(),
    transcriptText: (await page.getByText("지금 말씀하시면 상담 문장이 바로 정리됩니다.").textContent().catch(() => ""))?.trim() ?? "",
  };
}

async function collectCounselingOptionsMetrics(page) {
  return page.evaluate(() => ({
    pathname: window.location.pathname,
    title: Array.from(document.querySelectorAll("h2")).find((node) => node.textContent?.trim() === "사진 선택")?.textContent?.trim() ?? "",
    tileCount: Array.from(document.querySelectorAll("button")).filter((node) => node.textContent?.includes("사진") || node.textContent?.includes("모든 사진")).length,
    addLabel: Array.from(document.querySelectorAll("button")).find((node) => node.textContent?.includes("사진"))?.textContent?.trim() ?? "",
  }));
}

test("APP_023~APP_044 retain education/rights/health/counseling visual baseline", async ({ page, baseURL }) => {
  test.setTimeout(240_000);
  ensureResultsDir();
  await installProtectedPreviewSession(page);

  const resolvedBaseUrl = baseURL ?? process.env.BASE_URL ?? "http://127.0.0.1:4173";
  const hostSuffix = buildHostSuffix(resolvedBaseUrl);

  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto(`${resolvedBaseUrl}/education`, { waitUntil: "networkidle" });
  await expect(page.getByText("내 수준에 맞는 공부,", { exact: false })).toBeVisible();
  const educationHub = await collectEducationHubMetrics(page);
  await expect(educationHub.pathname).toBe("/education");
  expect(educationHub.recommendedCount).toBe(2);
  expect(educationHub.categoryCount).toBe(3);
  expect(educationHub.faqCount).toBe(3);
  expect(educationHub.continueCount).toBe(2);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_023, hostSuffix);

  await page.getByRole("link", { name: "진단 시작" }).click();
  await page.waitForURL("**/education/diagnosis");
  await expect(page.getByText("Q0. 지금 상황은 어떤가요?")).toBeVisible();
  const educationDiagnosis = await collectEducationDiagnosisMetrics(page);
  await expect(educationDiagnosis.pathname).toBe("/education/diagnosis");
  expect(educationDiagnosis.questionCount).toBe(6);
  expect(educationDiagnosis.hasCounselLink).toBe(true);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_024, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/education/result`, { waitUntil: "networkidle" });
  await expect(page.getByText("안전 교육을", { exact: false })).toBeVisible();
  const educationResult = await collectEducationResultMetrics(page);
  await expect(educationResult.pathname).toBe("/education/result");
  expect(educationResult.understandingRowCount).toBe(4);
  expect(educationResult.recommendedCount).toBe(3);
  expect(educationResult.orderCount).toBe(4);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_025, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/education/list`, { waitUntil: "networkidle" });
  await expect(page.getByPlaceholder("콘텐츠 검색")).toBeVisible();
  const educationList = await collectEducationListMetrics(page);
  await expect(educationList.pathname).toBe("/education/list");
  expect(educationList.chipCount).toBe(4);
  expect(educationList.visibleCourseCount).toBe(4);
  expect(educationList.searchPlaceholder).toBe("콘텐츠 검색");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_026, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/education/learning/safety-basics/start`, { waitUntil: "networkidle" });
  await expect(page.getByText("현재 학습 중")).toBeVisible();
  const educationLearningStart = await collectEducationLearningStartMetrics(page);
  await expect(educationLearningStart.pathname).toBe("/education/learning/safety-basics/start");
  expect(educationLearningStart.courseTitle).toBe("산업안전 기초");
  expect(educationLearningStart.primaryCta).toBe("퀴즈 풀기");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_027, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/education/learning/safety-basics/completed`, { waitUntil: "networkidle" });
  await expect(page.getByText("수고했어요! 학습 완료", { exact: false })).toBeVisible();
  const educationLearningCompleted = await collectEducationLearningCompletedMetrics(page);
  await expect(educationLearningCompleted.pathname).toBe("/education/learning/safety-basics/completed");
  expect(educationLearningCompleted.actionCount).toBe(2);
  expect(educationLearningCompleted.primaryAction).toBe("퀴즈 풀기");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_028, hostSuffix);

  await page.getByRole("button", { name: "퀴즈 풀기" }).click();
  await page.waitForURL("**/education/quiz/safety-basics");
  await expect(page.getByText("쓰레기는 아무 날이나 버려도 된다.")).toBeVisible();
  const educationQuiz = await collectEducationQuizMetrics(page);
  await expect(educationQuiz.pathname).toBe("/education/quiz/safety-basics");
  expect(educationQuiz.choiceCount).toBe(2);
  expect(educationQuiz.submitLabel).toBe("선택");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_029, hostSuffix);

  await page.getByRole("button", { name: "맞아요" }).click();
  await page.getByRole("button", { name: "선택" }).click();
  await page.waitForURL("**/education/quiz/safety-basics/result");
  await expect(page.getByText("정답이에요!", { exact: false })).toBeVisible();
  const educationQuizResult = await collectEducationQuizResultMetrics(page);
  await expect(educationQuizResult.pathname).toBe("/education/quiz/safety-basics/result");
  expect(educationQuizResult.feedbackTitle).toBe("정답이에요!");
  expect(educationQuizResult.actionLabel).toBe("다음");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_030, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/rights`, { waitUntil: "networkidle" });
  await expect(page.getByText("부당한 일을 겪고 있나요?")).toBeVisible();
  const rightsHub = await collectRightsHubMetrics(page);
  await expect(rightsHub.pathname).toBe("/rights");
  expect(rightsHub.categoryCount).toBe(5);
  expect(rightsHub.contentRowCount).toBe(4);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_031, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/rights/diagnosis`, { waitUntil: "networkidle" });
  await expect(page.getByText("Q0. 지금 상황은 어떤가요?")).toBeVisible();
  const rightsDiagnosis = await collectRightsDiagnosisMetrics(page);
  await expect(rightsDiagnosis.pathname).toBe("/rights/diagnosis");
  expect(rightsDiagnosis.questionCount).toBe(5);
  expect(rightsDiagnosis.hasCounselLink).toBe(true);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_032, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/rights/result`, { waitUntil: "networkidle" });
  await expect(page.getByText("지금 이런 문제가", { exact: false })).toBeVisible();
  const rightsResult = await collectRightsResultMetrics(page);
  await expect(rightsResult.pathname).toBe("/rights/result");
  expect(rightsResult.resultRowCount).toBe(3);
  expect(rightsResult.nextStepCount).toBe(4);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_033, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/health`, { waitUntil: "networkidle" });
  await expect(page.getByText("지금 몸 상태, 간단히 확인해요")).toBeVisible();
  const healthHub = await collectHealthHubMetrics(page);
  await expect(healthHub.pathname).toBe("/health");
  expect(healthHub.cardCount).toBe(3);
  expect(healthHub.guideRowCount).toBe(3);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_034, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/health/diagnosis`, { waitUntil: "networkidle" });
  await expect(page.getByText("Q1. 지금 가장 불편한 증상은 무엇인가요?")).toBeVisible();
  const healthDiagnosis = await collectHealthDiagnosisMetrics(page);
  await expect(healthDiagnosis.pathname).toBe("/health/diagnosis");
  expect(healthDiagnosis.questionCount).toBe(3);
  expect(healthDiagnosis.primaryLabel).toBe("다음");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_035, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/health/result`, { waitUntil: "networkidle" });
  await expect(page.getByText("병원 방문을", { exact: false })).toBeVisible();
  const healthResult = await collectHealthResultMetrics(page);
  await expect(healthResult.pathname).toBe("/health/result");
  expect(healthResult.problemRowCount).toBe(3);
  expect(healthResult.actionCardCount).toBe(3);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_036, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/health/location-permission`, { waitUntil: "networkidle" });
  await expect(page.getByText("현재 위치를 확인할까요?")).toBeVisible();
  const healthLocationPermission = await collectHealthLocationPermissionMetrics(page);
  await expect(healthLocationPermission.pathname).toBe("/health/location-permission");
  expect(healthLocationPermission.primaryLabel).toBe("위치 권한 허용");
  expect(healthLocationPermission.secondaryLabel).toBe("직접 위치 입력");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_037, hostSuffix);

  await page.getByRole("button", { name: "직접 위치 입력" }).click();
  await page.waitForURL("**/health/location-manual");
  await expect(page.getByRole("heading", { name: "위치 직접 입력" })).toBeVisible();
  const healthLocationManual = await collectHealthLocationManualMetrics(page);
  await expect(healthLocationManual.pathname).toBe("/health/location-manual");
  expect(healthLocationManual.suggestionCount).toBe(2);
  expect(healthLocationManual.primaryLabel).toBe("선택");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_038, hostSuffix);

  await page.getByRole("button", { name: /서울 영등포구 대림동/ }).click();
  await page.getByRole("button", { name: "선택" }).click();
  await page.waitForURL("**/health/facilities");
  await expect(page.getByRole("heading", { name: "서울중앙내과" })).toBeVisible();
  const healthFacilities = await collectHealthFacilitiesMetrics(page);
  await expect(healthFacilities.pathname).toBe("/health/facilities");
  expect(healthFacilities.facilityCount).toBe(4);
  expect(healthFacilities.categoryCount).toBe(5);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_039, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/health/interpretation`, { waitUntil: "networkidle" });
  await expect(page.getByText("아래 마이크 버튼을 누르고 말해보세요")).toBeVisible();
  const interpretation = await collectInterpretationMetrics(page);
  await expect(interpretation.pathname).toBe("/health/interpretation");
  expect(interpretation.idlePrompt).toBe("아래 마이크 버튼을 누르고 말해보세요");
  expect(interpretation.micButtonVisible).toBe(true);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_040, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/counseling`, { waitUntil: "networkidle" });
  await expect(page.getByText("어떤 도움이 필요한지 알려주세요.")).toBeVisible();
  await page.getByRole("button", { name: "음성 입력 시작" }).click();
  await expect(page.getByPlaceholder("메시지를 입력해 주세요.")).toHaveValue(/도움이 필요해요/);
  const counselingHome = await collectCounselingHomeMetrics(page);
  await expect(counselingHome.pathname).toBe("/counseling");
  expect(counselingHome.promptCount).toBe(4);
  expect(counselingHome.composerPlaceholder).toBe("메시지를 입력해 주세요.");
  expect(counselingHome.composerValue).toBe("도움이 필요해요");
  expect(counselingHome.languageShortcutHref).toBe("/language");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_041, hostSuffix);

  await page.getByRole("link", { name: "언어 선택" }).click();
  await page.waitForURL("**/language");
  await expect(page.getByText("사용 언어를 선택하세요", { exact: false })).toBeVisible();

  await page.goto(`${resolvedBaseUrl}/counseling/answer`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "건강 결과 이어보기" })).toBeVisible();
  const counselingAnswer = await collectCounselingAnswerMetrics(page);
  await expect(counselingAnswer.pathname).toBe("/counseling/answer");
  expect(counselingAnswer.bubbleCount).toBe(2);
  expect(counselingAnswer.healthCardCount).toBe(2);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_042, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/counseling/voice`, { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "텍스트 입력" })).toBeVisible();
  const counselingVoice = await collectCounselingVoiceMetrics(page);
  await expect(counselingVoice.pathname).toBe("/counseling/voice");
  expect(counselingVoice.actionCount).toBe(3);
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_043, hostSuffix);

  await page.goto(`${resolvedBaseUrl}/counseling`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "사진 첨부" }).click();
  await page.waitForURL("**/counseling/options");
  await expect(page.getByRole("heading", { name: "사진 선택" })).toBeVisible();
  const counselingOptions = await collectCounselingOptionsMetrics(page);
  await expect(counselingOptions.pathname).toBe("/counseling/options");
  expect(counselingOptions.addLabel).toContain("사진");
  await takeRetainedScreenshot(page, SCREENSHOT_PATHS.APP_044, hostSuffix);

  writeFileSync(
    SUMMARY_PATH,
    `${JSON.stringify(
      {
        baseURL: resolvedBaseUrl,
        generatedAt: new Date().toISOString(),
        runtimeTree: [
          "App.tsx",
          "ProtectedRoute",
          "EducationScreen",
          "EducationDiagnosisScreen",
          "EducationResultScreen",
          "EducationListScreen",
          "EducationLearningStartScreen",
          "EducationLearningCompletedScreen",
          "EducationQuizScreen",
          "EducationQuizResultScreen",
          "RightsScreen",
          "RightsDiagnosisScreen",
          "RightsResultScreen",
          "HealthHubScreen",
          "HealthDiagnosisScreen",
          "HealthResultScreen",
          "HealthLocationPermissionScreen",
          "HealthLocationManualScreen",
          "HealthFacilitiesScreen",
          "InterpretationScreen",
          "CounselingScreen",
          "CounselingAnswerScreen",
          "CounselingVoiceScreen",
          "CounselingAttachmentSheet",
        ],
        screens: {
          APP_023: educationHub,
          APP_024: educationDiagnosis,
          APP_025: educationResult,
          APP_026: educationList,
          APP_027: educationLearningStart,
          APP_028: educationLearningCompleted,
          APP_029: educationQuiz,
          APP_030: educationQuizResult,
          APP_031: rightsHub,
          APP_032: rightsDiagnosis,
          APP_033: rightsResult,
          APP_034: healthHub,
          APP_035: healthDiagnosis,
          APP_036: healthResult,
          APP_037: healthLocationPermission,
          APP_038: healthLocationManual,
          APP_039: healthFacilities,
          APP_040: interpretation,
          APP_041: counselingHome,
          APP_042: counselingAnswer,
          APP_043: counselingVoice,
          APP_044: counselingOptions,
        },
      },
      null,
      2,
    )}\n`,
  );
  preserveHostArtifact(SUMMARY_PATH, hostSuffix);
});
