import { expect, test } from "@playwright/test";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-auth-visual-regression.json");

const SCREENSHOT_PATHS = {
  APP_001: resolve(RESULTS_DIR, "mobile-auth-app001-language.png"),
  APP_002: resolve(RESULTS_DIR, "mobile-auth-app002-onboarding.png"),
  APP_003: resolve(RESULTS_DIR, "mobile-auth-app003-login.png"),
  APP_004: resolve(RESULTS_DIR, "mobile-auth-app004-phone.png"),
  APP_005: resolve(RESULTS_DIR, "mobile-auth-app005-verify.png"),
  APP_006: resolve(RESULTS_DIR, "mobile-auth-app006-terms.png"),
  APP_007: resolve(RESULTS_DIR, "mobile-auth-app007-signup.png"),
  APP_008: resolve(RESULTS_DIR, "mobile-auth-app008-complete.png"),
};

const STORAGE_KEYS = {
  locale: "passv-in.runtime.locale",
  onboarding: "passv-in.runtime.onboarding",
};

const AUTH_USER = {
  id: "mobile-auth-visual-user",
  email: "mobile-auth-visual@passv.preview",
  role: "member",
  nickname: "홍길동",
  phone: "010-1234-5678",
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

async function installGoogleIdentityMock(page) {
  await page.addInitScript(() => {
    window.google = {
      accounts: {
        id: {
          initialize() {},
          renderButton(parent) {
            const button = document.createElement("div");
            button.setAttribute("role", "button");
            button.setAttribute("aria-label", "Google 계정으로 로그인 버튼");
            button.textContent = "Google 계정으로 로그인 버튼";
            parent.appendChild(button);
          },
        },
      },
    };
  });
}

async function seedPublicEntry(page) {
  await page.evaluate(({ localeKey, onboardingKey }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem(localeKey, JSON.stringify(null));
    window.localStorage.setItem(onboardingKey, JSON.stringify(false));
  }, STORAGE_KEYS);
}

async function installAuthApiMocks(page) {
  await page.route("**/auth/phone/start", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session_id: "phone-session-auth-visual",
        requested_at: "2026-03-18T00:00:00.000Z",
        expires_in_seconds: 180,
        masked_phone_number: "010-1234-●●●●",
      }),
    });
  });

  await page.route("**/auth/phone/verify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        next_step: "signup",
        signup_token: "signup-token-auth-visual",
        verified_phone_number: "010-1234-5678",
      }),
    });
  });

  await page.route("**/auth/phone/signup", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "auth-visual-token",
        token_type: "bearer",
        user: AUTH_USER,
      }),
    });
  });

  await page.route("**/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(AUTH_USER),
    });
  });
}

async function collectLanguageMetrics(page) {
  return page.evaluate(() => {
    const heading = document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const helper = Array.from(document.querySelectorAll("p")).find((node) => node.textContent?.includes("사용 언어를 선택하세요"))?.textContent?.trim() ?? "";
    const optionLabels = Array.from(document.querySelectorAll("button p:first-child")).map((node) => node.textContent?.trim() ?? "").filter(Boolean);
    return {
      heading,
      helper,
      optionCount: optionLabels.length,
      firstOption: optionLabels[0] ?? "",
    };
  });
}

async function collectOnboardingMetrics(page) {
  return page.evaluate(() => ({
    heading: document.querySelector("h1")?.textContent?.trim() ?? "",
    skipLabel: Array.from(document.querySelectorAll("button")).find((node) => node.textContent?.trim() === "건너뛰기")?.textContent?.trim() ?? "",
    dotCount: document.querySelectorAll("span.h-2").length,
  }));
}

async function collectLoginMetrics(page) {
  return page.evaluate(() => {
    const heading = document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const buttons = Array.from(document.querySelectorAll("button span")).map((node) => node.textContent?.trim() ?? "").filter(Boolean);
    const googleBridge = document.querySelector('[aria-label="Google 계정으로 로그인 버튼"]');
    return {
      heading,
      buttons,
      googleBridgePresent: Boolean(googleBridge),
    };
  });
}

async function collectPhoneStartMetrics(page) {
  return page.evaluate(() => ({
    heading: document.querySelector("h1")?.textContent?.trim() ?? "",
    labelCount: Array.from(document.querySelectorAll("label span")).filter((node) => ["이름", "생년월일", "통신사", "휴대폰번호"].includes(node.textContent?.trim() ?? "")).length,
    cta: Array.from(document.querySelectorAll("button")).find((node) => node.textContent?.includes("인증번호 요청"))?.textContent?.trim() ?? "",
  }));
}

async function collectVerificationMetrics(page) {
  return page.evaluate(() => ({
    heading: document.querySelector("h1")?.textContent?.trim() ?? "",
    maskedPhone: Array.from(document.querySelectorAll("div")).find((node) => node.textContent?.includes("010-1234"))?.textContent?.trim() ?? "",
    resendLabel: Array.from(document.querySelectorAll("button")).find((node) => node.textContent?.includes("인증코드 재전송"))?.textContent?.trim() ?? "",
  }));
}

async function collectTermsMetrics(page) {
  return page.evaluate(() => ({
    heading: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
    consentCount: Array.from(document.querySelectorAll("span")).filter((node) => node.textContent?.includes("동의")).length,
    cta: Array.from(document.querySelectorAll("button")).find((node) => node.textContent?.includes("동의하고 시작하기"))?.textContent?.trim() ?? "",
  }));
}

async function collectSignupMetrics(page) {
  return page.evaluate(() => ({
    heading: document.querySelector("h1")?.textContent?.trim() ?? "",
    hasStickyFooter: Boolean(Array.from(document.querySelectorAll("div")).find((node) => getComputedStyle(node).position === "sticky")),
    primaryCta: Array.from(document.querySelectorAll("button")).find((node) => node.textContent?.trim() === "다음")?.textContent?.trim() ?? "",
  }));
}

async function collectSignupCompleteMetrics(page) {
  return page.evaluate(() => ({
    heading: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
    description: document.querySelector("p")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
    cta: Array.from(document.querySelectorAll("button")).find((node) => node.textContent?.includes("패스뷰 시작하기"))?.textContent?.trim() ?? "",
  }));
}

test("public auth visual exactness retains APP_001 to APP_008 baseline", async ({ page, baseURL }) => {
  ensureResultsDir();
  await installGoogleIdentityMock(page);
  await installAuthApiMocks(page);

  const resolvedBaseUrl = baseURL ?? process.env.BASE_URL ?? "http://127.0.0.1:4173";
  const hostSuffix = buildHostSuffix(resolvedBaseUrl);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(resolvedBaseUrl, { waitUntil: "domcontentloaded" });
  await seedPublicEntry(page);

  await page.goto(`${resolvedBaseUrl}/language`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /한국어 \(Korean\)/ }).click();
  await page.screenshot({ path: SCREENSHOT_PATHS.APP_001, fullPage: false });
  preserveHostArtifact(SCREENSHOT_PATHS.APP_001, hostSuffix);
  const language = await collectLanguageMetrics(page);
  expect(language.heading).toContain("Welcome");
  expect(language.optionCount).toBe(6);

  await page.getByRole("button", { name: "확인" }).click();
  await page.waitForURL("**/onboarding");
  await page.screenshot({ path: SCREENSHOT_PATHS.APP_002, fullPage: false });
  preserveHostArtifact(SCREENSHOT_PATHS.APP_002, hostSuffix);
  const onboarding = await collectOnboardingMetrics(page);
  expect(onboarding.heading).toBe("필요한 순간, 바로 안내받으세요");
  expect(onboarding.skipLabel).toBe("건너뛰기");

  await page.getByRole("button", { name: "건너뛰기" }).click();
  await page.waitForURL("**/login");
  await page.locator('[aria-label="Google 계정으로 로그인 버튼"]').waitFor();
  await page.screenshot({ path: SCREENSHOT_PATHS.APP_003, fullPage: false });
  preserveHostArtifact(SCREENSHOT_PATHS.APP_003, hostSuffix);
  const login = await collectLoginMetrics(page);
  expect(login.heading).toContain("패스뷰가 함께할게요.");
  expect(login.buttons).toContain("휴대폰 번호로 시작하기");
  expect(login.buttons).toContain("구글로 시작하기");
  expect(login.googleBridgePresent).toBe(true);

  await page.getByRole("button", { name: "휴대폰 번호로 시작하기" }).click();
  await page.waitForURL("**/auth/phone");
  await page.screenshot({ path: SCREENSHOT_PATHS.APP_004, fullPage: false });
  preserveHostArtifact(SCREENSHOT_PATHS.APP_004, hostSuffix);
  const phoneStart = await collectPhoneStartMetrics(page);
  expect(phoneStart.heading).toBe("휴대폰 번호를 입력해주세요.");
  expect(phoneStart.labelCount).toBe(4);

  await page.getByLabel("이름").fill("홍길동");
  await page.getByLabel("생년월일").fill("19990101");
  await page.locator("select").selectOption("KT");
  await page.getByLabel("휴대폰번호").fill("01012345678");
  await page.getByRole("button", { name: "인증번호 요청" }).click();
  await page.waitForURL("**/auth/verify");
  await page.screenshot({ path: SCREENSHOT_PATHS.APP_005, fullPage: false });
  preserveHostArtifact(SCREENSHOT_PATHS.APP_005, hostSuffix);
  const verification = await collectVerificationMetrics(page);
  expect(verification.heading).toBe("인증코드를 입력해주세요.");
  expect(verification.maskedPhone).toContain("010-1234");

  await page.locator('input[inputmode="numeric"]').fill("123456");
  await page.getByRole("button", { name: "확인" }).click();
  await page.waitForURL("**/auth/terms");
  await page.screenshot({ path: SCREENSHOT_PATHS.APP_006, fullPage: false });
  preserveHostArtifact(SCREENSHOT_PATHS.APP_006, hostSuffix);
  const terms = await collectTermsMetrics(page);
  expect(terms.heading).toContain("몇 가지 동의가 필요해요");
  expect(terms.cta).toBe("동의하고 시작하기");

  await page.getByRole("button", { name: "모두 동의하기" }).click();
  await page.getByRole("button", { name: "동의하고 시작하기" }).click();
  await page.waitForURL("**/auth/signup");
  await page.screenshot({ path: SCREENSHOT_PATHS.APP_007, fullPage: false });
  preserveHostArtifact(SCREENSHOT_PATHS.APP_007, hostSuffix);
  const signup = await collectSignupMetrics(page);
  expect(signup.heading).toBe("사용자 정보를 입력해주세요");
  expect(signup.hasStickyFooter).toBe(true);

  await page.getByPlaceholder("여권상 성명 입력").fill("HONG GILDONG");
  await page.locator('input[type="date"]').first().fill("1999-01-01");
  await page.locator("select").first().selectOption("대한민국");
  await page.locator("select").nth(1).selectOption("고등학교");
  await page.getByRole("button", { name: "다음" }).click();

  await page.locator("select").first().selectOption("E-9");
  await page.locator("button").filter({ hasText: "응시함 (합격)" }).first().click();
  await page.getByPlaceholder("여권번호 입력").fill("M12345678");
  await page.locator("input").nth(1).fill("2028-12-31");
  await page.locator("select").nth(1).selectOption("1~3년");
  await page.getByRole("button", { name: "다음" }).click();

  await page.locator("button").filter({ hasText: "제조업" }).first().click();
  await page.getByRole("button", { name: "가입 완료" }).click();
  await page.waitForURL("**/auth/complete");
  await page.screenshot({ path: SCREENSHOT_PATHS.APP_008, fullPage: false });
  preserveHostArtifact(SCREENSHOT_PATHS.APP_008, hostSuffix);
  const complete = await collectSignupCompleteMetrics(page);
  expect(complete.heading).toContain("가입이 완료되었어요.");
  expect(complete.cta).toBe("패스뷰 시작하기");

  writeFileSync(
    SUMMARY_PATH,
    JSON.stringify(
      {
        baseURL: resolvedBaseUrl,
        screens: {
          APP_001: language,
          APP_002: onboarding,
          APP_003: login,
          APP_004: phoneStart,
          APP_005: verification,
          APP_006: terms,
          APP_007: signup,
          APP_008: complete,
        },
      },
      null,
      2,
    ),
  );
  preserveHostArtifact(SUMMARY_PATH, hostSuffix);
});
