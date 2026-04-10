import { expect, test } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../../../..");
const RESULTS_DIR = resolve(ROOT_DIR, "sdd/99_toolchain/02_exactness/results");
const SCREENSHOT_PATH = resolve(RESULTS_DIR, "mobile-home-hero-prototype-comparison.png");
const SUMMARY_PATH = resolve(RESULTS_DIR, "mobile-home-hero-prototype-summary.json");
const SPEC_PREVIEW_PATH = resolve(
  ROOT_DIR,
  "sdd/01_planning/02_screen/guidelines/mobile/assets/page-010-surface-01.png",
);
const SPEC_PREVIEW_DATA_URL = `data:image/png;base64,${readFileSync(SPEC_PREVIEW_PATH).toString("base64")}`;

function ensureResultsDir() {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

test("home hero blend prototype aligns with APP_009 first-fold intent without touching production code", async ({ page }) => {
  ensureResultsDir();

  await page.setViewportSize({ width: 760, height: 980 });
  await page.setContent(`
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
            background:
              radial-gradient(circle at top, rgba(238, 243, 251, 0.92), rgba(248, 249, 251, 0.7) 32%, rgba(247, 247, 248, 0.92) 100%);
            color: #263444;
          }
          .layout {
            display: grid;
            grid-template-columns: 273px 273px;
            justify-content: center;
            gap: 28px;
            padding: 28px 24px 40px;
          }
          .panel {
            border-radius: 32px;
            background: rgba(255, 255, 255, 0.74);
            box-shadow: 0 18px 48px rgba(41, 61, 93, 0.08);
            padding: 18px 14px 22px;
          }
          .label {
            margin: 0 0 12px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.01em;
            color: #60748d;
          }
          .frame {
            overflow: hidden;
            border-radius: 26px;
            background: #fcfcfd;
          }
          .frame img {
            display: block;
            width: 100%;
            height: auto;
          }
          .prototype {
            position: relative;
            width: 273px;
            min-height: 592px;
            overflow: hidden;
            border-radius: 26px;
            background:
              radial-gradient(circle at 50% 0%, rgba(234, 241, 252, 0.98) 0%, rgba(244, 247, 252, 0.94) 35%, rgba(251, 252, 253, 0.82) 62%, rgba(252, 252, 253, 1) 100%);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 16px 0;
          }
          .brand {
            font-size: 11px;
            font-weight: 900;
            color: #2f5ea8;
          }
          .actions {
            display: flex;
            gap: 7px;
            align-items: center;
          }
          .badge {
            width: 22px;
            height: 22px;
            border-radius: 999px;
            background: #f12b91;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 700;
          }
          .icon {
            width: 10px;
            height: 10px;
            border-radius: 999px;
            border: 1.5px solid #9ca7b4;
            opacity: 0.9;
          }
          .hero {
            position: relative;
            padding: 18px 16px 0;
          }
          .hero-stage {
            position: relative;
            padding-bottom: 42px;
          }
          .orb-halo {
            position: absolute;
            left: 50%;
            top: -8px;
            width: 212px;
            height: 150px;
            transform: translateX(-50%);
            border-radius: 999px;
            background:
              radial-gradient(circle at 50% 34%, rgba(152, 185, 229, 0.44) 0%, rgba(190, 214, 242, 0.24) 24%, rgba(235, 242, 252, 0.1) 48%, rgba(252, 252, 253, 0) 74%);
            filter: blur(7px);
          }
          .orb-mist {
            position: absolute;
            left: 50%;
            top: 20px;
            width: 258px;
            height: 186px;
            transform: translateX(-50%);
            border-radius: 999px;
            background:
              radial-gradient(circle at 50% 50%, rgba(234, 241, 252, 0.82) 0%, rgba(238, 244, 253, 0.55) 34%, rgba(247, 249, 253, 0.14) 58%, rgba(252, 252, 253, 0) 80%);
            filter: blur(18px);
          }
          .orb {
            position: relative;
            width: 88px;
            height: 88px;
            margin: 0 auto;
          }
          .orb-core {
            position: absolute;
            inset: 0;
            border-radius: 999px;
            background: linear-gradient(180deg, #7ea0d1 0%, #7594c2 54%, #86a8d7 100%);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.34), 0 22px 40px rgba(118,149,195,0.16);
          }
          .orb-core::before {
            content: "";
            position: absolute;
            inset: 1px;
            border-radius: inherit;
            background: radial-gradient(circle at 50% 18%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 28%, rgba(255,255,255,0) 58%);
          }
          .orb-core::after {
            content: "";
            position: absolute;
            left: 50%;
            top: 76%;
            width: 72%;
            height: 18px;
            transform: translateX(-50%);
            border-radius: 999px;
            background: radial-gradient(circle at 50% 50%, rgba(214,228,247,0.82) 0%, rgba(224,236,250,0.42) 44%, rgba(245,249,253,0) 76%);
            filter: blur(3px);
          }
          .greeting {
            margin: 15px 0 0;
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            color: #313b49;
          }
          .title {
            margin: 6px 0 0;
            text-align: center;
            font-size: 27px;
            line-height: 1.16;
            letter-spacing: -0.055em;
            font-weight: 900;
            color: #3a3c41;
          }
          .body-copy {
            margin: 7px 0 0;
            text-align: center;
            font-size: 10.5px;
            line-height: 1.55;
            font-weight: 600;
            color: #9ba6b6;
          }
          .search {
            position: relative;
            margin-top: 12px;
            border-radius: 16px;
            padding: 12px 14px;
            background: rgba(255, 255, 255, 0.96);
            box-shadow: 0 10px 22px rgba(36, 49, 69, 0.03);
            border: 1px solid #eff2f6;
          }
          .search-row {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .search-leading {
            width: 28px;
            height: 28px;
            border-radius: 999px;
            background: #f5f7fb;
          }
          .search-placeholder {
            flex: 1;
            font-size: 12px;
            font-weight: 600;
            color: #b1b8c5;
          }
          .search-mic {
            width: 16px;
            height: 16px;
            border-radius: 999px;
            border: 1.5px solid #d5dbe5;
          }
          .search-status {
            margin-top: 9px;
            text-align: center;
            font-size: 9px;
            font-weight: 600;
            color: #b4bbc8;
          }
          .hero-bridge {
            position: absolute;
            left: -18px;
            right: -18px;
            bottom: -64px;
            height: 150px;
            background: radial-gradient(ellipse at 50% 0%, rgba(237, 243, 252, 0.88) 0%, rgba(244, 247, 252, 0.52) 40%, rgba(252, 252, 253, 0) 74%);
            filter: blur(6px);
          }
        </style>
      </head>
      <body>
        <main class="layout">
          <section class="panel">
            <p class="label">Spec Preview</p>
            <div class="frame">
              <img alt="APP_009 spec preview" src="${SPEC_PREVIEW_DATA_URL}" />
            </div>
          </section>
          <section class="panel">
            <p class="label">Prototype</p>
            <div class="prototype">
              <div class="header">
                <div class="brand">PASSVIEW</div>
                <div class="actions">
                  <div class="badge">1</div>
                  <div class="icon"></div>
                  <div class="icon" style="border-color:#ff8768;"></div>
                </div>
              </div>
              <section class="hero">
                <div class="hero-stage">
                  <div class="orb-halo" data-testid="orb-halo"></div>
                  <div class="orb-mist" data-testid="orb-mist"></div>
                  <div class="orb" data-testid="orb-core">
                    <div class="orb-core"></div>
                  </div>
                  <p class="greeting">안녕하세요 홍길동 님👋</p>
                  <h1 class="title">무엇을 도와드릴까요?</h1>
                  <p class="body-copy">상황을 말해주시면, 필요한 안내를 정리해드려요.</p>
                  <div class="search">
                    <div class="search-row">
                      <div class="search-leading"></div>
                      <div class="search-placeholder">지금 어떤 도움이 필요하신가요?</div>
                      <div class="search-mic"></div>
                    </div>
                    <div class="search-status">말하거나 입력하면, 안내가 시작돼요.</div>
                  </div>
                  <div class="hero-bridge" data-testid="hero-bridge"></div>
                </div>
              </section>
            </div>
          </section>
        </main>
      </body>
    </html>
  `);

  const summary = await page.evaluate(() => {
    const prototype = document.querySelector(".prototype");
    const halo = document.querySelector('[data-testid="orb-halo"]');
    const mist = document.querySelector('[data-testid="orb-mist"]');
    const core = document.querySelector(".orb-core");
    const bridge = document.querySelector('[data-testid="hero-bridge"]');
    const title = document.querySelector(".title");
    const bodyCopy = document.querySelector(".body-copy");

    return {
      prototypeWidth: prototype?.getBoundingClientRect().width ?? null,
      ambientLayerCount: [halo, mist, bridge].filter(Boolean).length,
      title: title?.textContent?.trim() ?? "",
      bodyCopy: bodyCopy?.textContent?.trim() ?? "",
      haloBackground: halo ? getComputedStyle(halo).backgroundImage : "",
      mistBackground: mist ? getComputedStyle(mist).backgroundImage : "",
      coreBackground: core ? getComputedStyle(core).backgroundImage : "",
      bridgeBackground: bridge ? getComputedStyle(bridge).backgroundImage : "",
    };
  });

  expect(summary.prototypeWidth).toBeGreaterThanOrEqual(272);
  expect(summary.ambientLayerCount).toBe(3);
  expect(summary.title).toBe("무엇을 도와드릴까요?");
  expect(summary.bodyCopy).toContain("필요한 안내를 정리해드려요.");
  expect(summary.haloBackground).toContain("radial-gradient");
  expect(summary.mistBackground).toContain("radial-gradient");
  expect(summary.coreBackground).toContain("linear-gradient");
  expect(summary.bridgeBackground).toContain("radial-gradient");

  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
  writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
});
