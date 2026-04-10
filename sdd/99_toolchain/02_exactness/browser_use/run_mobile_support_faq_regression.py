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
RESULTS_DIR = ROOT / "research" / "agent-browser" / "results"

AUTH_PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user"
RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session"
RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding"

EXPECTED_DEFAULT = {
    "pathname": "/support/faq",
    "headerTitle": "자주묻는질문",
    "heroTitle": "궁금한 사항이 있으신가요?",
    "searchPlaceholder": "검색어를 입력해 주세요",
    "activeCategory": "전체",
    "categories": ["전체", "행정", "일자리", "교육", "권익", "건강", "통역"],
    "questions": [
        "Q. 비자 관련 상담도 가능한가요?",
        "Q. 서류 준비 목록을 알려주나요?",
        "Q. 어떤 방식으로 일자리를 추천하나요?",
        "Q. 바로 지원할 수 있나요?",
        "Q. 어떤 교육 콘텐츠가 있나요?",
        "Q. 직장 내 부당 대우도 상담할 수 있나요?",
        "Q. 아플 때 병원 찾기도 가능한가요?",
        "Q. 통역은 어떤 언어를 지원하나요?",
        "Q. 일자리 추천 결과가 바뀌는 이유가 있나요?",
    ],
    "expandedQuestions": ["Q. 서류 준비 목록을 알려주나요?"],
    "expandedAnswers": ["네. 진단 결과에 따라 필요한 서류 체크리스트를 제공합니다."],
}

EXPECTED_ADMIN_FILTER = {
    "activeCategory": "행정",
    "questions": [
        "Q. 비자 관련 상담도 가능한가요?",
        "Q. 서류 준비 목록을 알려주나요?",
    ],
    "expandedQuestions": ["Q. 서류 준비 목록을 알려주나요?"],
}

EXPECTED_SEARCH = {
    "query": "병원",
    "activeCategory": "전체",
    "questions": ["Q. 아플 때 병원 찾기도 가능한가요?"],
    "expandedQuestions": ["Q. 아플 때 병원 찾기도 가능한가요?"],
    "expandedAnswers": ["건강 화면에서 증상 해석과 함께 가까운 병원, 통역 가능 병원 정보를 확인할 수 있습니다."],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4302)
    parser.add_argument("--server-mode", choices=["dev", "preview"], default="dev")
    parser.add_argument("--keep-server", action="store_true")
    parser.add_argument(
        "--results-file",
        default=str(RESULTS_DIR / "mobile-support-faq-regression.json"),
    )
    parser.add_argument(
        "--screenshot-file",
        default=str(RESULTS_DIR / "mobile-support-faq-regression.png"),
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
    if mode == "preview":
        subprocess.run(["npm", "run", "build"], cwd=CLIENT_MOBILE_DIR, check=True)
        cmd = ["npm", "run", "preview", "--", "--host", "127.0.0.1", "--port", str(port)]
    else:
        cmd = ["npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", str(port)]

    return subprocess.Popen(
        cmd,
        cwd=CLIENT_MOBILE_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
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
        "id": "preview-support-faq-regression",
        "email": "support-faq-regression@passview.preview",
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


def runtime_dom_script() -> str:
    return """() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      const categoryButtons = Array.from(document.querySelectorAll('nav[aria-label="FAQ 카테고리"] button'));
      const articles = Array.from(document.querySelectorAll('article')).map((article) => {
        const button = article.querySelector('button[aria-expanded]');
        const paragraphs = Array.from(article.querySelectorAll('button > p')).map((node) => normalize(node.textContent)).filter(Boolean);
        return {
          category: normalize(article.querySelector('button > span')?.textContent),
          question: paragraphs[0] || null,
          answer: paragraphs[1] || null,
          expanded: button?.getAttribute('aria-expanded') === 'true',
        };
      });

      return JSON.stringify({
        pathname: window.location.pathname,
        headerTitle: normalize(document.querySelector('h1')?.textContent),
        heroTitle: normalize(document.querySelector('h2')?.textContent),
        searchPlaceholder: document.querySelector('input[aria-label="FAQ 검색"]')?.getAttribute('placeholder') || null,
        searchValue: document.querySelector('input[aria-label="FAQ 검색"]')?.value || '',
        activeCategory: normalize(document.querySelector('nav[aria-label="FAQ 카테고리"] button[aria-pressed="true"]')?.textContent),
        categories: categoryButtons.map((node) => normalize(node.textContent)),
        faqs: articles,
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
        ("app_support_faq_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/support/faq" element={<SupportFaqScreen />}'),
        ("app_protected_route", ROOT / "client/mobile/src/app/App.tsx", "<Route element={<ProtectedRoute />}>"),
        ("protected_route_runtime_access", ROOT / "client/mobile/src/auth/ProtectedRoute.tsx", "const runtimeAccess = hasFlowSession || Boolean(currentUser);"),
        ("faq_uses_mobile_app_shell", ROOT / "client/mobile/src/mobile-app/SupportFaqScreen.tsx", "<MobileAppShell"),
        ("faq_has_search_input", ROOT / "client/mobile/src/mobile-app/SupportFaqScreen.tsx", 'aria-label="FAQ 검색"'),
        ("faq_has_category_nav", ROOT / "client/mobile/src/mobile-app/SupportFaqScreen.tsx", 'aria-label="FAQ 카테고리"'),
        ("faq_has_expanded_state", ROOT / "client/mobile/src/mobile-app/SupportFaqScreen.tsx", "aria-expanded={expanded}"),
        ("faq_uses_default_expanded_data", ROOT / "client/mobile/src/mobile-app/SupportFaqScreen.tsx", "item.defaultExpanded"),
        ("support_data_default_expanded", ROOT / "client/mobile/src/mobile-app/supportData.ts", "defaultExpanded: true"),
        ("support_data_category_union", ROOT / "client/mobile/src/mobile-app/supportData.ts", '"행정" | "일자리" | "교육" | "권익" | "건강" | "통역"'),
        ("support_data_default_question", ROOT / "client/mobile/src/mobile-app/supportData.ts", 'question: "Q. 서류 준비 목록을 알려주나요?"'),
        ("shell_uses_surface_main", ROOT / "client/mobile/src/mobile-app/MobileAppShell.tsx", "<SurfaceMain"),
        ("shell_uses_surface_frame", ROOT / "client/mobile/src/mobile-app/MobileAppShell.tsx", "<AppSinglePaneFrame"),
    ]

    results = []
    passed = True
    for key, path, needle in checks:
        text = path.read_text(encoding="utf-8")
        check_pass = needle in text
        passed = passed and check_pass
        results.append({"key": key, "path": str(path), "needle": needle, "pass": check_pass})

    return {"pass": passed, "checks": results}


def build_question_snapshot(dom: dict[str, Any]) -> dict[str, Any]:
    faqs = dom.get("faqs", [])
    return {
        "questions": [normalize_text(item.get("question")) for item in faqs],
        "expandedQuestions": [normalize_text(item.get("question")) for item in faqs if item.get("expanded")],
        "expandedAnswers": [normalize_text(item.get("answer")) for item in faqs if item.get("expanded") and item.get("answer")],
    }


def assert_default_state(dom: dict[str, Any]) -> dict[str, Any]:
    snapshot = build_question_snapshot(dom)
    checks = {
        "pathname": dom.get("pathname") == EXPECTED_DEFAULT["pathname"],
        "headerTitle": dom.get("headerTitle") == EXPECTED_DEFAULT["headerTitle"],
        "heroTitle": dom.get("heroTitle") == EXPECTED_DEFAULT["heroTitle"],
        "searchPlaceholder": dom.get("searchPlaceholder") == EXPECTED_DEFAULT["searchPlaceholder"],
        "activeCategory": dom.get("activeCategory") == EXPECTED_DEFAULT["activeCategory"],
        "categories": dom.get("categories") == EXPECTED_DEFAULT["categories"],
        "questionOrder": snapshot["questions"] == EXPECTED_DEFAULT["questions"],
        "expandedQuestions": snapshot["expandedQuestions"] == EXPECTED_DEFAULT["expandedQuestions"],
        "expandedAnswers": snapshot["expandedAnswers"] == EXPECTED_DEFAULT["expandedAnswers"],
    }
    return {"pass": all(checks.values()), "checks": checks, "snapshot": snapshot}


def assert_admin_filter_state(dom: dict[str, Any]) -> dict[str, Any]:
    snapshot = build_question_snapshot(dom)
    checks = {
        "activeCategory": dom.get("activeCategory") == EXPECTED_ADMIN_FILTER["activeCategory"],
        "questionOrder": snapshot["questions"] == EXPECTED_ADMIN_FILTER["questions"],
        "expandedQuestions": snapshot["expandedQuestions"] == EXPECTED_ADMIN_FILTER["expandedQuestions"],
    }
    return {"pass": all(checks.values()), "checks": checks, "snapshot": snapshot}


def assert_search_state(dom: dict[str, Any]) -> dict[str, Any]:
    snapshot = build_question_snapshot(dom)
    checks = {
        "searchValue": dom.get("searchValue") == EXPECTED_SEARCH["query"],
        "activeCategory": dom.get("activeCategory") == EXPECTED_SEARCH["activeCategory"],
        "questionOrder": snapshot["questions"] == EXPECTED_SEARCH["questions"],
        "expandedQuestions": snapshot["expandedQuestions"] == EXPECTED_SEARCH["expandedQuestions"],
        "expandedAnswers": snapshot["expandedAnswers"] == EXPECTED_SEARCH["expandedAnswers"],
    }
    return {"pass": all(checks.values()), "checks": checks, "snapshot": snapshot}


async def click_button_containing_text(page: Any, text: str) -> None:
    clicked = await page.evaluate(
        f"""() => {{
          const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
          const target = Array.from(document.querySelectorAll('button')).find((button) => normalize(button.innerText || button.textContent) === {json.dumps(text)});
          if (!target) return false;
          target.click();
          return true;
        }}"""
    )
    if not clicked:
        raise RuntimeError(f"Unable to find button containing text={text}")
    await asyncio.sleep(0.4)


async def set_search_value(page: Any, value: str) -> None:
    updated = await page.evaluate(
        f"""() => {{
          const input = document.querySelector('input[aria-label="FAQ 검색"]');
          if (!input) return false;
          const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
          descriptor?.set?.call(input, {json.dumps(value)});
          input.dispatchEvent(new InputEvent('input', {{ bubbles: true, data: {json.dumps(value)} }}));
          input.dispatchEvent(new Event('change', {{ bubbles: true }}));
          return true;
        }}"""
    )
    if not updated:
        raise RuntimeError("Unable to find FAQ search input")
    await asyncio.sleep(0.4)


async def collect_dom(page: Any) -> dict[str, Any]:
    payload = await page.evaluate(runtime_dom_script())
    return json.loads(payload)


async def run_regression(args: argparse.Namespace) -> int:
    base_url = f"http://127.0.0.1:{args.port}"
    results_path = Path(args.results_file).resolve()
    screenshot_path = Path(args.screenshot_file).resolve()
    results_path.parent.mkdir(parents=True, exist_ok=True)
    screenshot_path.parent.mkdir(parents=True, exist_ok=True)

    server_proc = start_mobile_server(args.port, args.server_mode)
    browser = BrowserSession(
        executable_path="/usr/bin/google-chrome",
        headless=True,
        is_local=True,
        args=["--headless=new", "--no-sandbox", "--window-size=390,960"],
    )

    try:
        wait_for_http(f"{base_url}/")

        await browser.start()
        page = await browser.new_page()
        await page.goto(f"{base_url}/")
        await asyncio.sleep(1)
        await page.evaluate(seed_script(base_url))
        await page.goto(f"{base_url}/support/faq")
        await asyncio.sleep(2)

        default_dom = await collect_dom(page)
        viewport_info = json.loads(
            await page.evaluate(
                """() => JSON.stringify({
                  innerWidth: window.innerWidth,
                  innerHeight: window.innerHeight,
                  outerWidth: window.outerWidth,
                  outerHeight: window.outerHeight,
                  devicePixelRatio: window.devicePixelRatio,
                  scrollHeight: document.documentElement.scrollHeight,
                })"""
            )
        )
        capture_height = json.loads(
            await page.evaluate(
                """() => JSON.stringify((() => {
                  const nodes = [
                    document.querySelector('header'),
                    document.querySelector('h2'),
                    document.querySelector('input[aria-label="FAQ 검색"]'),
                    document.querySelector('nav[aria-label="FAQ 카테고리"]'),
                    ...Array.from(document.querySelectorAll('article')).slice(0, 5),
                  ].filter(Boolean);
                  const bottom = nodes.reduce((maxBottom, node) => Math.max(maxBottom, Math.ceil(node.getBoundingClientRect().bottom)), 0);
                  return { height: Math.min(window.innerHeight, bottom + 24) };
                })())"""
            )
        )["height"]

        screenshot_b64 = await page.screenshot()
        screenshot_path.write_bytes(base64.b64decode(screenshot_b64))
        crop_screenshot_to_height(screenshot_path, capture_height)

        await click_button_containing_text(page, "행정")
        admin_dom = await collect_dom(page)

        await click_button_containing_text(page, "전체")
        await set_search_value(page, EXPECTED_SEARCH["query"])
        search_dom = await collect_dom(page)

        default_assertions = assert_default_state(default_dom)
        admin_filter_assertions = assert_admin_filter_state(admin_dom)
        search_assertions = assert_search_state(search_dom)
        source_chain = evaluate_source_chain()
        exact_pass = all(
            [
                default_assertions["pass"],
                admin_filter_assertions["pass"],
                search_assertions["pass"],
                source_chain["pass"],
            ]
        )

        payload = {
            "baseUrl": base_url,
            "serverMode": args.server_mode,
            "specPage": 59,
            "specPreview": str(ROOT / "sdd/01_planning/02_screen/guidelines/mobile/assets/page-059-surface-02.png"),
            "screenshot": str(screenshot_path),
            "browserViewport": viewport_info,
            "captureHeight": capture_height,
            "defaultDom": default_dom,
            "adminFilterDom": admin_dom,
            "searchDom": search_dom,
            "runtimeAssertions": {
                "default": default_assertions,
                "adminFilter": admin_filter_assertions,
                "search": search_assertions,
                "pass": default_assertions["pass"] and admin_filter_assertions["pass"] and search_assertions["pass"],
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
            stop_process(server_proc)


def main() -> int:
    args = parse_args()
    try:
        return asyncio.run(run_regression(args))
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
