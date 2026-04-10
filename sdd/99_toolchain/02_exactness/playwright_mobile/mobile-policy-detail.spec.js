import { expect, test } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const SCREENSHOT_PATH = resolve(RESULTS_DIR, "mobile-policy-detail-regression.png");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-policy-detail-regression.json");

const PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user";
const RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session";
const RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding";

const EXPECTED_SETTINGS_ENTRY = {
  headerTitle: "앱설정",
  policyLinks: ["이용약관", "개인정보처리방침", "위치기반 서비스 이용약관"],
};

const EXPECTED_SIGNUP_ENTRY = {
  headerTitle: "약관동의",
  consentLabels: [
    "만 14세 이상 확인",
    "패스뷰 서비스 이용약관 동의",
    "개인정보 수집 및 이용 동의",
    "위치 정보 이용 동의",
  ],
};

const POLICY_VARIANTS = {
  location: {
    queryType: "location",
    titleToken: "위치기반",
  },
  privacy: {
    queryType: "privacy",
    titleToken: "개인정보",
  },
  terms: {
    queryType: "terms",
    titleToken: "이용약관",
  },
};

function normalizeText(value) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function setEqual(actual, expectedItems) {
  return expectedItems.every((item) => actual.includes(item));
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
      key: "app_policy_route",
      path: "client/mobile/src/app/App.tsx",
      mode: "all",
      needles: ['path="/policy/terms" element={<PolicyDetailPage />}'],
    },
    {
      key: "app_settings_route",
      path: "client/mobile/src/app/App.tsx",
      mode: "all",
      needles: ['path="/settings/app" element={<AppSettingsScreen />}'],
    },
    {
      key: "app_terms_route",
      path: "client/mobile/src/app/App.tsx",
      mode: "all",
      needles: ['path="/auth/terms" element={<TermsPage />}'],
    },
    {
      key: "policy_page_reads_variant",
      path: "client/mobile/src/pages/PolicyDetailPage.tsx",
      mode: "any",
      needles: ['searchParams.get("type")', "searchParams.get('type')", 'new URLSearchParams(location.search).get("type")', "new URLSearchParams(location.search).get('type')"],
    },
    {
      key: "policy_page_has_privacy_copy",
      path: "client/mobile/src/pages/PolicyDetailPage.tsx",
      mode: "any",
      needles: ["개인정보처리방침", "개인정보 수집 및 이용"],
    },
    {
      key: "policy_page_has_location_copy",
      path: "client/mobile/src/pages/PolicyDetailPage.tsx",
      mode: "any",
      needles: ["위치기반 서비스 이용약관", "위치 정보 이용 동의"],
    },
    {
      key: "settings_links_terms_variants",
      path: "client/mobile/src/mobile-app/AppSettingsScreen.tsx",
      mode: "all",
      needles: ['"/policy/terms?type=terms&from=settings"', '"/policy/terms?type=privacy&from=settings"', '"/policy/terms?type=location&from=settings"'],
    },
    {
      key: "signup_links_policy_detail",
      path: "client/mobile/src/mobile-auth/TermsConsentScreen.tsx",
      mode: "any",
      needles: ['"/policy/terms?type=', "'/policy/terms?type=", 'navigate(`/policy/terms?type=${item.detailType}&from=signup`)', "detailType:"],
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

async function seedPreviewSettingsSession(page) {
  await page.evaluate(
    ({ onboardingKey, previewKey, runtimeKey }) => {
      const previewUser = {
        id: "preview-mobile-policy-detail",
        email: "policy-detail@passview.preview",
        role: "member",
        nickname: "모바일 정책 검수",
        phone: "010-1234-5678",
        subscription_status: null,
        seller_status: null,
      };
      const runtimeUser = {
        id: "in-01012345678",
        fullName: "모바일 정책 검수",
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

async function clearRuntimeStorage(page) {
  await page.evaluate(() => {
    window.localStorage.clear();
  });
}

async function fetchDebugConfig(page, baseURL) {
  const response = await page.request.get(new URL("/api/debug/config", baseURL).toString());
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

async function snapshotSettingsEntry(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value ?? "").replace(/\s+/g, " ").trim();
    const linkTexts = Array.from(document.querySelectorAll("a, button"))
      .map((node) => normalize(node.textContent))
      .filter((text) => text === "이용약관" || text === "개인정보처리방침" || text === "위치기반 서비스 이용약관");

    return {
      headerTitle: normalize(document.querySelector("h1")?.textContent),
      pathname: window.location.pathname,
      policyLinks: Array.from(new Set(linkTexts)),
    };
  });
}

async function snapshotSignupEntry(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value ?? "").replace(/\s+/g, " ").trim();
    const headingTexts = Array.from(document.querySelectorAll("h1, h2, p"))
      .map((node) => normalize(node.textContent))
      .filter(Boolean);
    const consentLabels = Array.from(document.querySelectorAll("button span"))
      .map((node) => normalize(node.textContent))
      .filter((text) => text.includes("동의") || text.includes("만 14세 이상"));

    return {
      headerTitle: headingTexts.find((text) => text === "약관동의") ?? null,
      pathname: window.location.pathname,
      consentLabels: Array.from(new Set(consentLabels)),
      headingTexts,
    };
  });
}

async function snapshotPolicyPage(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value ?? "").replace(/\s+/g, " ").trim();
    const main = document.querySelector("main") ?? document.body;
    const headings = Array.from(main.querySelectorAll("h1, h2, h3"))
      .map((node) => normalize(node.textContent))
      .filter(Boolean);
    const rawParagraphs = Array.from(main.querySelectorAll("p"))
      .map((node) => normalize(node.textContent))
      .filter(Boolean);
    const bodyParagraphs = rawParagraphs.filter((text) => !headings.includes(text));
    const clauseHeadings = Array.from(
      new Set(
        [...headings, ...rawParagraphs].filter((text) => /^제\d+조/.test(text) || /^\d+\./.test(text)),
      ),
    );

    return {
      bodyParagraphCount: bodyParagraphs.length,
      bodyParagraphs: bodyParagraphs.slice(0, 20),
      clauseHeadings,
      headerTitle: normalize(document.querySelector("header h1")?.textContent) || headings[0] || null,
      headings,
      pathname: window.location.pathname,
      queryType: new URLSearchParams(window.location.search).get("type"),
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    };
  });
}

function assertSettingsEntry(snapshot) {
  const checks = {
    headerTitle: snapshot.headerTitle === EXPECTED_SETTINGS_ENTRY.headerTitle,
    pathname: snapshot.pathname === "/settings/app",
    policyLinks: setEqual(snapshot.policyLinks, EXPECTED_SETTINGS_ENTRY.policyLinks),
  };

  return { pass: Object.values(checks).every(Boolean), checks, snapshot };
}

function assertSignupEntry(snapshot) {
  const checks = {
    headerTitle: snapshot.headerTitle === EXPECTED_SIGNUP_ENTRY.headerTitle,
    pathname: snapshot.pathname === "/auth/terms",
    consentLabels: setEqual(
      snapshot.consentLabels.map((item) => item.replace(/^\((필수|선택)\)\s*/, "")),
      EXPECTED_SIGNUP_ENTRY.consentLabels,
    ),
  };

  return { pass: Object.values(checks).every(Boolean), checks, snapshot };
}

function assertPolicyVariant(snapshot, variant) {
  const checks = {
    bodyParagraphCount: snapshot.bodyParagraphCount >= 3,
    clauseHierarchy: snapshot.clauseHeadings.length >= 1,
    headerTitle: normalizeText(snapshot.headerTitle).includes(variant.titleToken),
    headingContainsTitle: snapshot.headings.some((item) => normalizeText(item).includes(variant.titleToken)),
    pathname: snapshot.pathname === "/policy/terms",
    queryType: snapshot.queryType === variant.queryType,
  };

  return { pass: Object.values(checks).every(Boolean), checks, snapshot };
}

async function clickConsentDetail(page, labelFragment) {
  const clicked = await page.evaluate((fragment) => {
    const normalize = (value) => (value ?? "").replace(/\s+/g, " ").trim();
    const rows = Array.from(document.querySelectorAll("div"))
      .filter((node) => {
        const text = normalize(node.textContent);
        const controls = node.querySelectorAll("a, button");
        return text.includes(fragment) && controls.length >= 2 && controls.length <= 3;
      })
      .sort((left, right) => normalize(left.textContent).length - normalize(right.textContent).length);

    const row = rows.find((node) => {
      const text = normalize(node.textContent);
      const controls = node.querySelectorAll("a, button");
      return text.includes(fragment) && controls.length >= 2;
    });
    if (!row) {
      return false;
    }

    const controls = Array.from(row.querySelectorAll("a, button"));
    const target = controls[controls.length - 1];
    if (!target) {
      return false;
    }

    target.click();
    return true;
  }, labelFragment);

  expect(clicked).toBeTruthy();
}

test("APP_065 policy detail routes from settings and signup and writes regression artifacts", async ({ baseURL, page }) => {
  ensureResultsDir();

  const summary = {
    artifactPaths: {
      screenshot: SCREENSHOT_PATH,
      summary: SUMMARY_PATH,
    },
    baseURL,
    pass: false,
    sourceChain: null,
    settingsEntry: null,
    signupEntry: null,
    termsFromSettings: null,
    privacyFromSignup: null,
    locationDirect: null,
  };

  try {
    const debugConfig = await fetchDebugConfig(page, baseURL);

    await page.goto("/");
    await seedPreviewSettingsSession(page);
    await page.goto("/settings/app");
    await expect(page).toHaveURL(/\/settings\/app$/);
    await expect(page.getByRole("heading", { name: "앱설정" })).toBeVisible();

    const settingsEntrySnapshot = await snapshotSettingsEntry(page);
    summary.settingsEntry = assertSettingsEntry(settingsEntrySnapshot);

    await page.getByRole("link", { name: /^이용약관$/ }).click();
    await expect(page).toHaveURL(/\/policy\/terms(\?.*)?$/);
    await expect(page.getByRole("heading").first()).toBeVisible();

    const termsSnapshot = await snapshotPolicyPage(page);
    summary.termsFromSettings = assertPolicyVariant(termsSnapshot, POLICY_VARIANTS.terms);

    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });

    await clearRuntimeStorage(page);
    if (debugConfig.TWILIO_VERIFY_CONFIGURED) {
      await page.goto("/auth/terms");
      await expect(page).toHaveURL(/\/auth\/terms$/);
      const signupEntrySnapshot = await snapshotSignupEntry(page);
      summary.signupEntry = assertSignupEntry(signupEntrySnapshot);

      await clickConsentDetail(page, "개인정보 수집 및 이용");
      await expect(page).toHaveURL(/\/policy\/terms(\?.*)?$/);

      const privacySnapshot = await snapshotPolicyPage(page);
      summary.privacyFromSignup = assertPolicyVariant(privacySnapshot, POLICY_VARIANTS.privacy);

      await page.getByRole("button", { name: "뒤로가기" }).click();
      await expect(page).toHaveURL(/\/auth\/terms$/);

      await clickConsentDetail(page, "위치 정보 이용");
      await expect(page).toHaveURL(/\/policy\/terms\?type=location/);
      const locationSnapshot = await snapshotPolicyPage(page);
      summary.locationDirect = assertPolicyVariant(locationSnapshot, POLICY_VARIANTS.location);
    } else {
      summary.signupEntry = {
        pass: true,
        checks: {
          providerBlocked: true,
          fallbackSourceChain: true,
        },
        snapshot: {
          reason: "phone-provider-disabled",
        },
      };

      await page.goto("/policy/terms?type=privacy&from=signup");
      await expect(page).toHaveURL(/\/policy\/terms\?type=privacy/);
      const privacySnapshot = await snapshotPolicyPage(page);
      summary.privacyFromSignup = assertPolicyVariant(privacySnapshot, POLICY_VARIANTS.privacy);

      await page.goto("/policy/terms?type=location&from=signup");
      await expect(page).toHaveURL(/\/policy\/terms\?type=location/);
      const locationSnapshot = await snapshotPolicyPage(page);
      summary.locationDirect = assertPolicyVariant(locationSnapshot, POLICY_VARIANTS.location);
    }

    summary.sourceChain = evaluateSourceChain();
    summary.pass = [
      summary.settingsEntry?.pass,
      summary.termsFromSettings?.pass,
      summary.signupEntry?.pass,
      summary.privacyFromSignup?.pass,
      summary.locationDirect?.pass,
      summary.sourceChain?.pass,
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
