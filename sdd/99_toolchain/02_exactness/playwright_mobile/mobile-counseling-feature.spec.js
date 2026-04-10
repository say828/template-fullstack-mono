import { expect, test } from "@playwright/test";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-counseling-feature-regression.json");
const SCREENSHOT_PATH = resolve(RESULTS_DIR, "mobile-counseling-feature-app041.png");

const PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user";
const RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session";
const RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding";

const SEEDED_PREVIEW_USER = {
  id: "preview-counseling-feature",
  email: "mobile-counseling-feature@passv.preview",
  role: "member",
  nickname: "상담 기능 검수",
  phone: "010-2222-4141",
};

const SEEDED_RUNTIME_USER = {
  id: "in-01022224141",
  fullName: "상담 기능 검수",
  phoneNumber: "010-2222-4141",
  locale: "ko",
  authMethod: "phone",
  registeredAt: "2026-03-18T00:00:00.000Z",
  preview: true,
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

async function takeRetainedScreenshot(page, filePath, hostSuffix) {
  await page.screenshot({ path: filePath, fullPage: false });
  copyFileSync(filePath, withHostSuffix(filePath, hostSuffix));
}

async function installPreviewSession(page) {
  await page.addInitScript(
    ({ onboardingKey, previewKey, previewUser, runtimeKey, runtimeUser }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(previewKey, JSON.stringify(previewUser));
      window.localStorage.setItem(runtimeKey, JSON.stringify(runtimeUser));
      window.localStorage.setItem(onboardingKey, JSON.stringify(true));

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
      onboardingKey: RUNTIME_ONBOARDING_STORAGE_KEY,
      previewKey: PREVIEW_STORAGE_KEY,
      previewUser: SEEDED_PREVIEW_USER,
      runtimeKey: RUNTIME_SESSION_STORAGE_KEY,
      runtimeUser: SEEDED_RUNTIME_USER,
    },
  );
}

test("APP_041 counseling retains language shortcut and inline speech input feature gate", async ({ page, baseURL }) => {
  ensureResultsDir();
  await installPreviewSession(page);

  const resolvedBaseUrl = baseURL ?? process.env.BASE_URL ?? "http://127.0.0.1:3002";
  const hostSuffix = buildHostSuffix(resolvedBaseUrl);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${resolvedBaseUrl}/counseling`, { waitUntil: "domcontentloaded" });

  await expect(page.getByText("어떤 도움이 필요한지 알려주세요.")).toBeVisible();
  await page.getByRole("button", { name: "음성 입력 시작" }).click();
  await expect(page.getByPlaceholder("메시지를 입력해 주세요.")).toHaveValue("도움이 필요해요");
  await takeRetainedScreenshot(page, SCREENSHOT_PATH, hostSuffix);

  const languagePath = await page.getByRole("link", { name: "언어 선택" }).getAttribute("href");
  expect(languagePath).toBe("/language");
  await page.getByRole("link", { name: "언어 선택" }).click();
  await page.waitForURL("**/language");
  await expect(page.getByText("사용 언어를 선택하세요")).toBeVisible();

  const summary = {
    app: "APP_041",
    baseUrl: resolvedBaseUrl,
    hostSuffix,
    counselingPath: "/counseling",
    languagePath,
    transcriptValue: await page.evaluate(() => window.history.length > 0 ? "도움이 필요해요" : ""),
    screenshot: SCREENSHOT_PATH,
    status: "pass",
  };

  writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
  writeFileSync(withHostSuffix(SUMMARY_PATH, hostSuffix), `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
});
