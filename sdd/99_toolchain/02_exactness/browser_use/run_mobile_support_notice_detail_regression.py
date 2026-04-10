#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import base64
import json
import os
import re
import signal
import subprocess
import time
from pathlib import Path
from typing import Any
from urllib.request import urlopen

from PIL import Image

from browser_use import BrowserSession


ROOT = Path(__file__).resolve().parents[4]
CLIENT_MOBILE_DIR = ROOT / "client" / "mobile"
SERVER_DIR = ROOT / "server"
RESULTS_DIR = ROOT / "research" / "agent-browser" / "results"
DETAIL_SPEC_PREVIEW = ROOT / "sdd/01_planning/02_screen/guidelines/mobile/assets/page-061-surface-02.png"
DETAIL_HERO_ASSET = ROOT / "client/mobile/src/assets/support-notice-detail-hero.png"

AUTH_PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user"
RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session"
RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding"

EXPECTED_LIST = {
    "pathname": "/support/notices",
    "headerTitle": "공지사항",
    "titles": [
        "추석 연휴 고객 지원 운영 안내",
        "📢 AI 상담 서비스 성능 개선 안내",
        "통역 지원 언어 추가 안내 (우즈벡어, 네팔어)",
        "산업안전 교육 콘텐츠 신규 업데이트",
        "권익 상담 연계 기관 확대 안내",
    ],
    "detailHref": "/support/notices/ai-counsel-performance-update",
}

EXPECTED_DETAIL = {
    "pathname": "/support/notices/ai-counsel-performance-update",
    "headerTitle": "공지사항",
    "title": "📢 AI 상담 서비스 성능 개선 안내",
    "date": "2025.08.01",
    "paragraphs": [
        "PassView를 이용해 주시는 모든 사용자 여러분께 감사드립니다.",
        "보다 정확하고 빠른 상담 제공을 위해 AI 상담 시스템이 개선되었습니다. 이번 업데이트를 통해 통역 품질, 진단 정확도, 추천 기관 매칭 기능이 강화되었습니다.",
    ],
    "heading": "📌 업데이트 주요 내용",
    "topBullets": ["AI 상담 응답 속도 개선", "자동통역 품질 향상"],
    "nestedBullets": [
        "상담 응답 처리 시간이 평균 30% 단축되었습니다.",
        "음성 상담 모드의 안정성이 향상되었습니다.",
        "벵골어, 베트남어, 태국어 번역 정확도가 개선되었습니다.",
        "기존 모델에서도 문서 전환 속도가 빨라졌습니다.",
    ],
}

EXPECTED_DETAIL_STYLE = {
    "headerTitleFontSize": 15.0,
    "titleFontSize": 22.0,
    "bodyFontSize": 13.0,
    "bodyLineHeight": 22.36,
    "heroInsetRatio": 0.0885,
    "heroWidthRatio": 0.8241,
}
HERO_ASSET_MSE_THRESHOLD = 6500.0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4303)
    parser.add_argument("--api-port", type=int, default=8000)
    parser.add_argument("--server-mode", choices=["dev", "preview"], default="dev")
    parser.add_argument("--keep-server", action="store_true")
    parser.add_argument(
        "--results-file",
        default=str(RESULTS_DIR / "mobile-support-notice-detail-regression.json"),
    )
    parser.add_argument(
        "--screenshot-file",
        default=str(RESULTS_DIR / "mobile-support-notice-detail-regression.png"),
    )
    return parser.parse_args()


def wait_for_http(url: str, timeout_seconds: int = 90) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with urlopen(url, timeout=3) as response:  # noqa: S310
                if response.status < 500:
                    return
        except Exception:
            time.sleep(1)
    raise TimeoutError(f"Timed out waiting for {url}")


def start_mobile_server(port: int, mode: str) -> subprocess.Popen[str]:
    env = os.environ.copy()
    env["VITE_API_BASE_URL"] = "/api"
    env["VITE_DEV_API_ORIGIN"] = "http://127.0.0.1:8000"

    if mode == "preview":
        subprocess.run(["npm", "run", "build"], cwd=CLIENT_MOBILE_DIR, check=True, env=env)
        cmd = ["npm", "run", "preview", "--", "--host", "127.0.0.1", "--port", str(port)]
    else:
        cmd = ["npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", str(port)]

    return subprocess.Popen(
        cmd,
        cwd=CLIENT_MOBILE_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=env,
        start_new_session=True,
    )


def start_api_server(port: int) -> subprocess.Popen[str]:
    env = os.environ.copy()
    env.setdefault("DATABASE_URL", "sqlite:///./support_notice_regression.db")
    env.setdefault("AUTO_CREATE_ADMIN_ON_INIT", "false")
    return subprocess.Popen(
        [str(SERVER_DIR / ".venv" / "bin" / "uvicorn"), "server.main:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=env,
        start_new_session=True,
    )


def stop_process(proc: subprocess.Popen[str] | None) -> None:
    if proc is None or proc.poll() is not None:
        return

    os.killpg(proc.pid, signal.SIGTERM)
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        os.killpg(proc.pid, signal.SIGKILL)
        proc.wait(timeout=5)


def seed_script(base_url: str) -> str:
    preview_user = {
        "id": "preview-support-notice-regression",
        "email": "support-notice-regression@passview.preview",
        "role": "member",
        "nickname": "홍길동",
        "phone": "010-1234-5678",
        "subscription_status": None,
        "seller_status": None,
    }
    runtime_user = {
        "id": "in-01012345678",
        "fullName": "홍길동",
        "phoneNumber": "010-1234-5678",
        "locale": "ko",
        "authMethod": "phone",
        "registeredAt": "2026-03-17T00:00:00.000Z",
        "preview": True,
    }
    return f"""() => {{
      localStorage.setItem("{AUTH_PREVIEW_STORAGE_KEY}", JSON.stringify({json.dumps(preview_user, ensure_ascii=False)}));
      localStorage.setItem("{RUNTIME_SESSION_STORAGE_KEY}", JSON.stringify({json.dumps(runtime_user, ensure_ascii=False)}));
      localStorage.setItem("{RUNTIME_ONBOARDING_STORAGE_KEY}", JSON.stringify(true));
      return {json.dumps(base_url)};
    }}"""


def list_dom_script() -> str:
    return """() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      const hrefPath = (href) => {
        try {
          return new URL(href, window.location.origin).pathname;
        } catch {
          return href || '';
        }
      };
      const rows = Array.from(document.querySelectorAll('section[aria-label="공지사항 목록"] a')).map((node) => ({
        href: hrefPath(node.getAttribute('href') || node.href || ''),
        title: normalize(node.querySelector('p')?.textContent),
        date: normalize(node.querySelectorAll('p')[1]?.textContent),
      }));

      return JSON.stringify({
        pathname: window.location.pathname,
        headerTitle: normalize(document.querySelector('h1')?.textContent),
        rowCount: rows.length,
        rows,
      });
    }"""


def detail_dom_script() -> str:
    return """() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      const article = document.querySelector('article[aria-label="공지사항 상세 본문"]');
      const paragraphs = Array.from(article?.querySelectorAll('div p') || [])
        .map((node) => normalize(node.textContent))
        .filter(Boolean);
      const heading = paragraphs.find((text) => text.includes('업데이트 주요 내용')) || null;
      const listTexts = Array.from(article?.querySelectorAll('div > div.flex p') || [])
        .map((node) => normalize(node.textContent))
        .filter(Boolean);

      return JSON.stringify({
        pathname: window.location.pathname,
        headerTitle: normalize(document.querySelector('h1')?.textContent),
        title: normalize(article?.querySelector('h2')?.textContent),
        date: normalize(article?.querySelector('h2 + p')?.textContent),
        hasHeroImage: Boolean(article?.querySelector('img')),
        allParagraphs: paragraphs,
        heading,
        listTexts,
      });
    }"""


def detail_style_script() -> str:
    return """() => {
      const toRect = (node) => {
        if (!node) {
          return null;
        }
        const rect = node.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        };
      };
      const toNumber = (value) => {
        const parsed = Number.parseFloat(value || '0');
        return Number.isFinite(parsed) ? parsed : null;
      };

      const screen = document.querySelector('[data-testid="support-notice-detail-frame"]');
      const header = document.querySelector('[data-testid="support-notice-detail-header"]');
      const article = document.querySelector('[data-testid="support-notice-detail-article"]');
      const hero = article?.querySelector('img, div');
      const headerTitle = header?.querySelector('h1');
      const title = article?.querySelector('h2');
      const paragraph = article?.querySelector('[data-notice-paragraph]');
      const topBulletRow = article?.querySelector('[data-notice-list-level="0"]');
      const topBullet = topBulletRow?.querySelector('p');

      return JSON.stringify({
        screenRect: toRect(screen),
        headerRect: toRect(header),
        heroRect: toRect(hero),
        headerTitleFontSize: toNumber(headerTitle ? getComputedStyle(headerTitle).fontSize : null),
        titleFontSize: toNumber(title ? getComputedStyle(title).fontSize : null),
        bodyFontSize: toNumber(paragraph ? getComputedStyle(paragraph).fontSize : null),
        bodyLineHeight: toNumber(paragraph ? getComputedStyle(paragraph).lineHeight : null),
        topBulletFontWeight: toNumber(topBullet ? getComputedStyle(topBullet).fontWeight : null),
        hasCheckIcon: Boolean(topBulletRow?.querySelector('svg')),
      });
    }"""


def normalize_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def crop_screenshot_to_height(screenshot_path: Path, capture_height: int) -> None:
    with Image.open(screenshot_path) as image:
        bounded_height = max(1, min(image.height, capture_height))
        if bounded_height == image.height:
            return
        image.crop((0, 0, image.width, bounded_height)).save(screenshot_path)


def evaluate_source_chain() -> dict[str, Any]:
    checks: list[tuple[str, Path, str]] = [
        ("main_renders_app", ROOT / "client/mobile/src/main.tsx", "<App />"),
        ("main_wraps_auth_provider", ROOT / "client/mobile/src/main.tsx", "<AuthProvider>"),
        ("main_wraps_runtime_provider", ROOT / "client/mobile/src/main.tsx", "<InRuntimeProvider>"),
        ("app_support_notices_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/support/notices" element={<SupportNoticesScreen />}'),
        ("app_support_notice_detail_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/support/notices/:noticeId" element={<SupportNoticeDetailScreen />}'),
        ("protected_route_runtime_access", ROOT / "client/mobile/src/auth/ProtectedRoute.tsx", "const runtimeAccess = hasFlowSession || Boolean(currentUser);"),
        ("notices_screen_fetches_api", ROOT / "client/mobile/src/mobile-app/SupportNoticesScreen.tsx", "fetchSupportNotices"),
        ("notices_screen_uses_secondary_header", ROOT / "client/mobile/src/mobile-app/SupportNoticesScreen.tsx", "MobileSecondaryHeader"),
        ("notice_detail_fetches_api", ROOT / "client/mobile/src/mobile-app/SupportNoticeDetailScreen.tsx", "fetchSupportNoticeDetail"),
        ("notice_detail_uses_secondary_header", ROOT / "client/mobile/src/mobile-app/SupportNoticeDetailScreen.tsx", "MobileSecondaryHeader"),
        ("notice_detail_uses_parser", ROOT / "client/mobile/src/mobile-app/SupportNoticeDetailScreen.tsx", "parseSupportNoticeContent"),
        ("support_api_list_path", ROOT / "client/mobile/src/mobile-app/supportApi.ts", '"/support/notices"'),
        ("support_api_detail_path", ROOT / "client/mobile/src/mobile-app/supportApi.ts", '`/support/notices/${slug}`'),
        ("support_router_list", ROOT / "server/contexts/support/contracts/router.py", '@router.get("/api/support/notices")'),
        ("support_router_detail", ROOT / "server/contexts/support/contracts/router.py", '@router.get("/api/support/notices/{slug}")'),
        ("support_notice_model", ROOT / "server/contexts/support/domain/models.py", "class SupportNotice"),
        ("support_notice_seed", ROOT / "server/shared/infrastructure/database.py", "seed_default_support_notices(session)"),
    ]

    results = []
    passed = True
    for key, path, needle in checks:
        text = path.read_text(encoding="utf-8")
        check_pass = needle in text
        passed = passed and check_pass
        results.append({"key": key, "path": str(path), "needle": needle, "pass": check_pass})

    return {"pass": passed, "checks": results}


def assert_list_state(dom: dict[str, Any]) -> dict[str, Any]:
    titles = [normalize_text(item.get("title")) for item in dom.get("rows", [])]
    hrefs = [normalize_text(item.get("href")) for item in dom.get("rows", [])]
    checks = {
        "pathname": dom.get("pathname") == EXPECTED_LIST["pathname"],
        "headerTitle": dom.get("headerTitle") == EXPECTED_LIST["headerTitle"],
        "rowCount": dom.get("rowCount") == len(EXPECTED_LIST["titles"]),
        "titleOrder": titles == EXPECTED_LIST["titles"],
        "detailHref": EXPECTED_LIST["detailHref"] in hrefs,
    }
    return {"pass": all(checks.values()), "checks": checks, "snapshot": {"titles": titles, "hrefs": hrefs}}


def assert_detail_state(dom: dict[str, Any]) -> dict[str, Any]:
    all_paragraphs = [normalize_text(item) for item in dom.get("allParagraphs", [])]
    list_texts = [normalize_text(item) for item in dom.get("listTexts", [])]
    top_bullets = [item for item in EXPECTED_DETAIL["topBullets"] if item in list_texts]
    nested_bullets = [item for item in EXPECTED_DETAIL["nestedBullets"] if item in list_texts]
    checks = {
        "pathname": dom.get("pathname") == EXPECTED_DETAIL["pathname"],
        "headerTitle": dom.get("headerTitle") == EXPECTED_DETAIL["headerTitle"],
        "title": dom.get("title") == EXPECTED_DETAIL["title"],
        "date": dom.get("date") == EXPECTED_DETAIL["date"],
        "hasHeroImage": dom.get("hasHeroImage") is True,
        "paragraphs": all(item in all_paragraphs for item in EXPECTED_DETAIL["paragraphs"]),
        "heading": dom.get("heading") == EXPECTED_DETAIL["heading"],
        "topBullets": top_bullets == EXPECTED_DETAIL["topBullets"],
        "nestedBullets": nested_bullets == EXPECTED_DETAIL["nestedBullets"],
    }
    return {
        "pass": all(checks.values()),
        "checks": checks,
        "snapshot": {"paragraphs": all_paragraphs, "listTexts": list_texts},
    }


def within_tolerance(actual: float | None, expected: float, tolerance: float) -> bool:
    if actual is None:
        return False
    return abs(actual - expected) <= tolerance


def assert_detail_style(dom: dict[str, Any]) -> dict[str, Any]:
    screen_rect = dom.get("screenRect") or {}
    hero_rect = dom.get("heroRect") or {}
    screen_width = float(screen_rect.get("width") or 0)
    hero_width = float(hero_rect.get("width") or 0)
    hero_left = float(hero_rect.get("left") or 0)
    screen_left = float(screen_rect.get("left") or 0)
    hero_inset_ratio = ((hero_left - screen_left) / screen_width) if screen_width else None
    hero_width_ratio = (hero_width / screen_width) if screen_width else None
    checks = {
        "headerTitleFontSize": within_tolerance(dom.get("headerTitleFontSize"), EXPECTED_DETAIL_STYLE["headerTitleFontSize"], 0.6),
        "titleFontSize": within_tolerance(dom.get("titleFontSize"), EXPECTED_DETAIL_STYLE["titleFontSize"], 0.6),
        "bodyFontSize": within_tolerance(dom.get("bodyFontSize"), EXPECTED_DETAIL_STYLE["bodyFontSize"], 0.6),
        "bodyLineHeight": within_tolerance(dom.get("bodyLineHeight"), EXPECTED_DETAIL_STYLE["bodyLineHeight"], 1.0),
        "heroInsetRatio": within_tolerance(hero_inset_ratio, EXPECTED_DETAIL_STYLE["heroInsetRatio"], 0.02),
        "heroWidthRatio": within_tolerance(hero_width_ratio, EXPECTED_DETAIL_STYLE["heroWidthRatio"], 0.03),
        "topBulletFontWeight": (dom.get("topBulletFontWeight") or 0) >= 700,
        "hasCheckIcon": dom.get("hasCheckIcon") is True,
    }
    return {
        "pass": all(checks.values()),
        "checks": checks,
        "snapshot": {
            "headerTitleFontSize": dom.get("headerTitleFontSize"),
            "titleFontSize": dom.get("titleFontSize"),
            "bodyFontSize": dom.get("bodyFontSize"),
            "bodyLineHeight": dom.get("bodyLineHeight"),
            "heroInsetRatio": hero_inset_ratio,
            "heroWidthRatio": hero_width_ratio,
            "topBulletFontWeight": dom.get("topBulletFontWeight"),
            "hasCheckIcon": dom.get("hasCheckIcon"),
        },
    }


def evaluate_hero_asset_alignment() -> dict[str, Any]:
    preview = Image.open(DETAIL_SPEC_PREVIEW).convert("RGB")
    pixels = preview.load()
    coords: list[tuple[int, int]] = []
    for y in range(preview.height):
        for x in range(preview.width):
            red, green, blue = pixels[x, y]
            if red > 230 and 50 < green < 120 and blue < 40:
                coords.append((x, y))

    if not coords:
        return {"pass": False, "checks": {"detectedHeroRegion": False}, "snapshot": {"mse": None}}

    xs = [coord[0] for coord in coords]
    ys = [coord[1] for coord in coords]
    reference = preview.crop((min(xs), min(ys), max(xs) + 1, max(ys) + 1))
    asset = Image.open(DETAIL_HERO_ASSET).convert("RGB").resize(reference.size)
    mse = 0.0
    for (red_a, green_a, blue_a), (red_b, green_b, blue_b) in zip(asset.getdata(), reference.getdata()):
        mse += (red_a - red_b) ** 2 + (green_a - green_b) ** 2 + (blue_a - blue_b) ** 2
    mse /= reference.size[0] * reference.size[1] * 3

    checks = {
        "detectedHeroRegion": True,
        "assetMse": mse <= HERO_ASSET_MSE_THRESHOLD,
    }
    return {"pass": all(checks.values()), "checks": checks, "snapshot": {"mse": mse, "threshold": HERO_ASSET_MSE_THRESHOLD}}


async def run_regression(args: argparse.Namespace) -> int:
    base_url = f"http://127.0.0.1:{args.port}"
    api_url = f"http://127.0.0.1:{args.api_port}/api/health"
    results_path = Path(args.results_file).resolve()
    screenshot_path = Path(args.screenshot_file).resolve()
    results_path.parent.mkdir(parents=True, exist_ok=True)
    screenshot_path.parent.mkdir(parents=True, exist_ok=True)

    api_proc = start_api_server(args.api_port)
    mobile_proc = start_mobile_server(args.port, args.server_mode)
    browser = BrowserSession(
        executable_path="/usr/bin/google-chrome",
        headless=True,
        is_local=True,
        args=["--headless=new", "--no-sandbox", "--window-size=390,960"],
    )

    try:
        wait_for_http(api_url)
        wait_for_http(f"{base_url}/")

        await browser.start()
        page = await browser.new_page()
        await page.goto(f"{base_url}/")
        await asyncio.sleep(1)
        await page.evaluate(seed_script(base_url))
        await page.goto(f"{base_url}/support/notices")
        await asyncio.sleep(2)

        list_dom = json.loads(await page.evaluate(list_dom_script()))
        await page.goto(f"{base_url}{EXPECTED_LIST['detailHref']}")
        await asyncio.sleep(2)

        detail_dom = json.loads(await page.evaluate(detail_dom_script()))
        detail_style = json.loads(await page.evaluate(detail_style_script()))
        viewport_info = json.loads(
            await page.evaluate(
                """() => JSON.stringify({
                  innerWidth: window.innerWidth,
                  innerHeight: window.innerHeight,
                  scrollHeight: document.documentElement.scrollHeight,
                  devicePixelRatio: window.devicePixelRatio,
                })"""
            )
        )
        capture_height = json.loads(
            await page.evaluate(
                """() => JSON.stringify((() => {
                  const article = document.querySelector('article[aria-label="공지사항 상세 본문"]');
                  const bottom = article ? Math.ceil(article.getBoundingClientRect().bottom) : window.innerHeight;
                  return { height: Math.min(window.innerHeight, bottom + 24) };
                })())"""
            )
        )["height"]

        screenshot_b64 = await page.screenshot()
        screenshot_path.write_bytes(base64.b64decode(screenshot_b64))
        crop_screenshot_to_height(screenshot_path, capture_height)

        list_assertions = assert_list_state(list_dom)
        detail_assertions = assert_detail_state(detail_dom)
        detail_style_assertions = assert_detail_style(detail_style)
        hero_asset_alignment = evaluate_hero_asset_alignment()
        source_chain = evaluate_source_chain()
        exact_pass = (
            list_assertions["pass"]
            and detail_assertions["pass"]
            and detail_style_assertions["pass"]
            and hero_asset_alignment["pass"]
            and source_chain["pass"]
        )

        payload = {
            "baseUrl": base_url,
            "apiUrl": api_url,
            "serverMode": args.server_mode,
            "specPages": [60, 61],
            "screenshot": str(screenshot_path),
            "browserViewport": viewport_info,
            "captureHeight": capture_height,
            "listDom": list_dom,
            "detailDom": detail_dom,
            "runtimeAssertions": {
                "list": list_assertions,
                "detail": detail_assertions,
                "detailStyle": detail_style_assertions,
                "heroAssetAlignment": hero_asset_alignment,
                "pass": (
                    list_assertions["pass"]
                    and detail_assertions["pass"]
                    and detail_style_assertions["pass"]
                    and hero_asset_alignment["pass"]
                ),
            },
            "sourceChain": source_chain,
            "exactPass": exact_pass,
            "pass": exact_pass,
        }
        results_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(payload, ensure_ascii=False))
        return 0 if payload["pass"] else 2
    finally:
        await browser.stop()
        if not args.keep_server:
            stop_process(mobile_proc)
            stop_process(api_proc)


def main() -> int:
    args = parse_args()
    try:
        return asyncio.run(run_regression(args))
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
