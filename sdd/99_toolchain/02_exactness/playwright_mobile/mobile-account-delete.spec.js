import { expect, test } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const SCREENSHOT_PATH = resolve(RESULTS_DIR, "mobile-account-delete-regression.png");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-account-delete-regression.json");

const PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user";
const RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session";
const RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding";

const EXPECTED_BULLETS = [
  "개인 기본 정보",
  "상담 기록",
  "교육 이력",
  "즐겨찾기",
  "1:1 문의",
  "통역 설정",
];

const EXPECTED_REASON_OPTIONS = [
  "원하는 정보를 찾기 어려워요",
  "상담 답변이 충분하지 않아요",
  "교육 콘텐츠가 도움이 되지 않았어요",
  "앱 사용이 불편해요",
  "기타",
];

function normalizeText(value) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function ensureResultsDir() {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

function readSource(relativePath) {
  return readFileSync(resolve(ROOT_DIR, relativePath), "utf-8");
}

function evaluateSourceChain() {
  const checks = [
    {
      key: "app_account_delete_route",
      path: "client/mobile/src/app/App.tsx",
      mode: "all",
      needles: ['path="/settings/account/delete" element={<AccountDeleteScreen />}'],
    },
    {
      key: "screen_delete_account_and_navigate",
      path: "client/mobile/src/mobile-app/AccountDeleteScreen.tsx",
      mode: "all",
      needles: ["deleteAccount", 'navigate("/", { replace: true })'],
    },
    {
      key: "auth_client_delete_account",
      path: "client/mobile/src/auth/auth-client.ts",
      mode: "all",
      needles: ["deleteAccount"],
    },
    {
      key: "server_router_delete",
      path: "server/api/http/user.py",
      mode: "all",
      needles: ['@router.delete("/api/users/me")'],
    },
  ];

  const results = checks.map((check) => {
    const text = readSource(check.path);
    const matches = check.needles.map((needle) => text.includes(needle));
    const pass = check.mode === "all" ? matches.every(Boolean) : matches.some(Boolean);
    return {
      key: check.key,
      path: check.path,
      mode: check.mode,
      needles: check.needles,
      matches,
      pass,
    };
  });

  return {
    pass: results.every((item) => item.pass),
    checks: results,
  };
}

async function seedPreviewSession(page) {
  await page.evaluate(
    ({ onboardingKey, previewKey, runtimeKey }) => {
      const previewUser = {
        id: "preview-mobile-account-delete",
        email: "account-delete@passview.preview",
        role: "member",
        nickname: "회원탈퇴 검수",
        phone: "010-1234-5678",
        subscription_status: null,
        seller_status: null,
      };
      const runtimeUser = {
        id: "in-01012345678",
        fullName: "회원탈퇴 검수",
        phoneNumber: "010-1234-5678",
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

async function snapshotAccountDeletePage(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value ?? "").replace(/\s+/g, " ").trim();
    const main = document.querySelector("main") ?? document.body;

    const h1Text = normalize(document.querySelector("h1")?.textContent);
    const h2Text = normalize(main.querySelector("h2")?.textContent);

    const bulletItems = Array.from(main.querySelectorAll("li"))
      .map((node) => normalize(node.textContent))
      .filter(Boolean);

    const bulletDots = Array.from(main.querySelectorAll("li span"))
      .map((node) => normalize(node.textContent))
      .filter((text) => text === "\u00B7");

    const headings = Array.from(main.querySelectorAll("h1, h2, h3"))
      .map((node) => normalize(node.textContent))
      .filter(Boolean);

    const reasonHeading = headings.find((text) => text.includes("계정을 삭제하려는 이유가 궁금해요")) ?? null;

    const buttons = Array.from(main.querySelectorAll("button"));
    const reasonButtons = buttons
      .map((node) => normalize(node.textContent))
      .filter((text) => text.length > 0 && text !== "뒤로가기" && !text.includes("탈퇴"));

    const submitButton = buttons.find((node) => normalize(node.textContent).includes("탈퇴하기")) ?? null;
    const submitButtonText = submitButton ? normalize(submitButton.textContent) : null;
    const submitButtonDisabled = submitButton ? submitButton.disabled : null;

    const textarea = main.querySelector("textarea");
    const textareaVisible = textarea !== null;

    return {
      pathname: window.location.pathname,
      h1Text,
      h2Text,
      bulletItems,
      bulletDotCount: bulletDots.length,
      headings,
      reasonHeading,
      reasonButtons,
      submitButtonText,
      submitButtonDisabled,
      textareaVisible,
    };
  });
}

function assertDomSnapshot(snapshot) {
  const checks = {
    pathname: snapshot.pathname === "/settings/account/delete",
    heading: snapshot.h1Text === "회원탈퇴",
    title: normalizeText(snapshot.h2Text).includes("정말 탈퇴하시겠어요?"),
    bulletDotCount: snapshot.bulletDotCount === 6,
    bulletContent: EXPECTED_BULLETS.every((bullet) =>
      snapshot.bulletItems.some((item) => item.includes(bullet)),
    ),
    reasonHeading: snapshot.reasonHeading !== null,
    reasonOptionCount: snapshot.reasonButtons.length === 5,
    reasonOptions: EXPECTED_REASON_OPTIONS.every((option) =>
      snapshot.reasonButtons.some((btn) => btn.includes(option)),
    ),
    submitButtonExists: snapshot.submitButtonText === "탈퇴하기",
    submitButtonDisabled: snapshot.submitButtonDisabled === true,
    textareaHidden: snapshot.textareaVisible === false,
  };

  return { pass: Object.values(checks).every(Boolean), checks, snapshot };
}

async function snapshotAfterInteraction(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value ?? "").replace(/\s+/g, " ").trim();
    const main = document.querySelector("main") ?? document.body;

    const textarea = main.querySelector("textarea");
    const textareaVisible = textarea !== null;
    const textareaValue = textarea ? textarea.value : null;

    const buttons = Array.from(main.querySelectorAll("button"));
    const submitButton = buttons.find((node) => normalize(node.textContent).includes("탈퇴하기")) ?? null;
    const submitButtonDisabled = submitButton ? submitButton.disabled : null;

    const messageElement = main.querySelector("p");
    const allParagraphs = Array.from(main.querySelectorAll("p"))
      .map((node) => normalize(node.textContent))
      .filter(Boolean);
    const previewMessage = allParagraphs.find((text) => text.includes("실제 로그인 후")) ?? null;

    return {
      textareaVisible,
      textareaValue,
      submitButtonDisabled,
      previewMessage,
    };
  });
}

function assertInteraction(snapshot) {
  const checks = {
    textareaVisible: snapshot.textareaVisible === true,
    textareaFilled: snapshot.textareaValue === "테스트 사유",
    submitButtonEnabled: snapshot.submitButtonDisabled === false,
  };

  return { pass: Object.values(checks).every(Boolean), checks, snapshot };
}

test("APP_066 account delete screen regression", async ({ baseURL, page }) => {
  ensureResultsDir();

  const summary = {
    artifactPaths: {
      screenshot: SCREENSHOT_PATH,
      summary: SUMMARY_PATH,
    },
    baseURL,
    pass: false,
    sourceChain: null,
    domSnapshot: null,
    interaction: null,
  };

  try {
    // --- source chain evaluation ---
    summary.sourceChain = evaluateSourceChain();

    // --- preview session seeding & navigation ---
    await page.goto("/");
    await seedPreviewSession(page);
    await page.goto("/settings/account/delete");
    await expect(page).toHaveURL(/\/settings\/account\/delete$/);
    await expect(page.getByRole("heading", { name: "회원탈퇴" })).toBeVisible();

    // --- DOM snapshot ---
    const domSnapshot = await snapshotAccountDeletePage(page);
    summary.domSnapshot = assertDomSnapshot(domSnapshot);

    // --- interaction: click "기타" reason ---
    const etcButton = page.getByRole("button", { name: "기타" });
    await etcButton.click();

    // textarea should appear after selecting "기타"
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();

    // fill textarea
    await textarea.fill("테스트 사유");

    // submit button should become enabled
    const submitButton = page.getByRole("button", { name: "탈퇴하기" });
    await expect(submitButton).toBeEnabled();

    // click submit - preview session has no real token, so expect message
    await submitButton.click();
    await page.waitForTimeout(500);

    const interactionSnapshot = await snapshotAfterInteraction(page);
    summary.interaction = assertInteraction(interactionSnapshot);

    // --- screenshot ---
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });

    // --- final pass evaluation ---
    summary.pass = [
      summary.sourceChain?.pass,
      summary.domSnapshot?.pass,
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
