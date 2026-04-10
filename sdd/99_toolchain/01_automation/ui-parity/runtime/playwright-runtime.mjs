export async function createPlaywrightRuntime(requireFromAdapter) {
  const playwright = requireFromAdapter("@playwright/test");
  const chromium = playwright.chromium ?? playwright.default?.chromium;
  if (!chromium) {
    throw new Error("Failed to load Playwright chromium runtime from the app workspace.");
  }
  const browser = await chromium.launch({
    headless: true,
  });
  return {
    browser,
    async dispose() {
      await browser.close();
    },
  };
}
