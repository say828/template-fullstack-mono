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
import sys
import time
from pathlib import Path
from typing import Any
from urllib.request import urlopen

from PIL import Image
from pydantic import BaseModel

from browser_use import Agent, BrowserSession, ChatOllama


ROOT = Path(__file__).resolve().parents[4]
CLIENT_MOBILE_DIR = ROOT / "client" / "mobile"
RESULTS_DIR = ROOT / "research" / "agent-browser" / "results"

AUTH_PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user"
RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session"
RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding"


class HomeSemanticResult(BaseModel):
    greeting: str
    heroTitle: str
    heroDescription: str
    services: list[str]
    recommendations: list[str]
    navLabels: list[str]


EXPECTED_RUNTIME = {
    "greeting": "안녕하세요 홍길동 님👋",
    "heroTitle": "무엇을 도와드릴까요?",
    "heroDescription": "상황을 말해주시면, 필요한 안내를 정리해드려요.",
    "searchPlaceholder": "지금 어떤 도움이 필요하신가요?",
    "searchStatus": "말하거나 입력하면, 안내가 시작돼요.",
    "serviceTitles": ["행정", "일자리", "교육", "권익 보호", "건강 · 응급", "통역"],
    "recommendationTitles": ["나에게 맞는 일자리는?", "내 한국어 실력은"],
    "navLabels": ["홈", "AI 상담", "프로필"],
}

EXPECTED_SEMANTIC = {
    "greeting": EXPECTED_RUNTIME["greeting"],
    "heroTitle": EXPECTED_RUNTIME["heroTitle"],
    "heroDescription": EXPECTED_RUNTIME["heroDescription"],
    "services": EXPECTED_RUNTIME["serviceTitles"],
    "recommendations": EXPECTED_RUNTIME["recommendationTitles"],
    "navLabels": EXPECTED_RUNTIME["navLabels"],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4302)
    parser.add_argument("--server-mode", choices=["dev", "preview"], default="dev")
    parser.add_argument("--model", default="qwen3-vl:30b-a3b-instruct")
    parser.add_argument("--keep-server", action="store_true")
    parser.add_argument(
        "--results-file",
        default=str(RESULTS_DIR / "mobile-home-regression.json"),
    )
    parser.add_argument(
        "--screenshot-file",
        default=str(RESULTS_DIR / "mobile-home-regression.png"),
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

    proc = subprocess.Popen(
        cmd,
        cwd=CLIENT_MOBILE_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        start_new_session=True,
    )
    return proc


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
        "id": "preview-home-regression",
        "email": "home-regression@passview.preview",
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
        "registeredAt": "2026-03-16T00:00:00.000Z",
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
      const hrefPath = (href) => {
        try {
          return new URL(href, window.location.origin).pathname;
        } catch {
          return href || '';
        }
      };

      const links = Array.from(document.querySelectorAll('a')).map((node) => ({
        href: hrefPath(node.getAttribute('href') || node.href || ''),
        text: normalize(node.textContent),
        ariaLabel: node.getAttribute('aria-label'),
        paragraphs: Array.from(node.querySelectorAll('p')).map((child) => normalize(child.textContent)).filter(Boolean),
      }));

      const input = document.querySelector('input[aria-label="상담 검색"]');
      const headings = Array.from(document.querySelectorAll('h1, h2')).map((node) => normalize(node.textContent));
      const paragraphs = Array.from(document.querySelectorAll('p')).map((node) => normalize(node.textContent)).filter(Boolean);

      const serviceTargets = ['/administration', '/jobs', '/education', '/rights', '/health', '/health/interpretation'];
      const recommendationTargets = ['/jobs/diagnosis', '/education/diagnosis'];

      return JSON.stringify({
        pathname: window.location.pathname,
        greeting: paragraphs.find((text) => text.includes('안녕하세요')) || null,
        heroTitle: headings.find((text) => text === '무엇을 도와드릴까요?') || null,
        heroDescription: paragraphs.find((text) => text.includes('필요한 안내를 정리해드려요.')) || null,
        searchPlaceholder: input ? input.getAttribute('placeholder') : null,
        searchStatus: paragraphs.find((text) => text.includes('말하거나 입력하면')) || null,
        hasMicButton: Boolean(document.querySelector('button[aria-label="음성 입력 시작"], button[aria-label="음성 입력 중지"]')),
        headerLinks: links.filter((item) => item.ariaLabel === '알림' || item.ariaLabel === '긴급'),
        serviceLinks: serviceTargets.map((target) => {
          const item = links.find((link) => link.href === target);
          return item
            ? {
                href: item.href,
                ariaLabel: item.ariaLabel,
                title: item.paragraphs[0] || item.text,
                description: item.paragraphs[1] || null,
                text: item.text,
              }
            : null;
        }),
        recommendationLinks: recommendationTargets.map((target) => {
          const item = links.find((link) => link.href === target);
          return item
            ? {
                href: item.href,
                ariaLabel: item.ariaLabel,
                eyebrow: item.paragraphs[0] || null,
                title: item.paragraphs[1] || item.text,
                description: item.paragraphs[2] || null,
                text: item.text,
              }
            : null;
        }),
        navLinks: [
          links.find((item) => item.href === '/home' && item.text.includes('홈')) || null,
          links.find((item) => item.href === '/counseling' && item.ariaLabel === 'AI 상담') || null,
          links.find((item) => item.href === '/profile' && item.text.includes('프로필')) || null,
        ],
      });
    }"""


def evaluate_source_chain() -> dict[str, Any]:
    checks: list[tuple[str, Path, str]] = [
        ("main_renders_app", ROOT / "client/mobile/src/main.tsx", "<App />"),
        ("main_wraps_auth_provider", ROOT / "client/mobile/src/main.tsx", "<AuthProvider>"),
        ("main_wraps_runtime_provider", ROOT / "client/mobile/src/main.tsx", "<InRuntimeProvider>"),
        ("app_home_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/home" element={<HomeScreen />}'),
        ("app_protected_route", ROOT / "client/mobile/src/app/App.tsx", "<Route element={<ProtectedRoute />}>"),
        ("protected_route_runtime_access", ROOT / "client/mobile/src/auth/ProtectedRoute.tsx", "const runtimeAccess = hasFlowSession || Boolean(currentUser);"),
        ("auth_preview_storage", ROOT / "client/mobile/src/auth/AuthProvider.tsx", 'const PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user";'),
        ("runtime_session_storage", ROOT / "client/mobile/src/mobile-auth/InRuntimeProvider.tsx", 'session: "passv-in.runtime.session"'),
        ("home_uses_mobile_app_shell", ROOT / "client/mobile/src/mobile-app/HomeScreen.tsx", "<MobileAppShell"),
        ("home_uses_primary_header", ROOT / "client/mobile/src/mobile-app/HomeScreen.tsx", "<MobilePrimaryHeader"),
        ("home_uses_primary_bottom_nav", ROOT / "client/mobile/src/mobile-app/HomeScreen.tsx", "<MobilePrimaryBottomNavigation"),
        ("home_uses_speech_input", ROOT / "client/mobile/src/mobile-app/HomeScreen.tsx", "<SpeechInputField"),
        ("home_uses_horizontal_pager", ROOT / "client/mobile/src/mobile-app/HomeScreen.tsx", "<HorizontalPager"),
        ("shell_uses_surface_main", ROOT / "client/mobile/src/mobile-app/MobileAppShell.tsx", "<SurfaceMain"),
        ("shell_uses_surface_frame", ROOT / "client/mobile/src/mobile-app/MobileAppShell.tsx", "<AppSinglePaneFrame"),
        ("chrome_exports_header", ROOT / "client/mobile/src/mobile-app/MobilePrimaryChrome.tsx", "export function MobilePrimaryHeader"),
        ("chrome_exports_bottom_nav", ROOT / "client/mobile/src/mobile-app/MobilePrimaryChrome.tsx", "export function MobilePrimaryBottomNavigation"),
        ("speech_field_has_input", ROOT / "client/mobile/src/components/common/SpeechInputField.tsx", "<input"),
        ("speech_field_has_mic_button", ROOT / "client/mobile/src/components/common/SpeechInputField.tsx", '<button'),
        ("horizontal_pager_scrolls", ROOT / "client/mobile/src/components/common/HorizontalPager.tsx", "overflow-x-auto"),
    ]

    results = []
    passed = True
    for key, path, needle in checks:
        text = path.read_text(encoding="utf-8")
        check_pass = needle in text
        passed = passed and check_pass
        results.append({"key": key, "path": str(path), "needle": needle, "pass": check_pass})

    return {"pass": passed, "checks": results}


def normalize_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def filter_expected(raw_values: list[str], expected: list[str]) -> list[str]:
    normalized_values = [normalize_text(value) for value in raw_values if normalize_text(value)]
    return [item for item in expected if item in normalized_values]


def normalize_semantic_result(raw_result: dict[str, Any]) -> dict[str, Any]:
    hero_description = normalize_text(raw_result.get("heroDescription"))
    if EXPECTED_SEMANTIC["heroDescription"] in hero_description:
        hero_description = EXPECTED_SEMANTIC["heroDescription"]

    return {
        "greeting": normalize_text(raw_result.get("greeting")),
        "heroTitle": normalize_text(raw_result.get("heroTitle")),
        "heroDescription": hero_description,
        "services": filter_expected(raw_result.get("services", []), EXPECTED_SEMANTIC["services"]),
        "recommendations": filter_expected(raw_result.get("recommendations", []), EXPECTED_SEMANTIC["recommendations"]),
        "navLabels": filter_expected(raw_result.get("navLabels", []), EXPECTED_SEMANTIC["navLabels"]),
    }


def crop_screenshot_to_content(screenshot_path: Path, capture_height: int) -> None:
    with Image.open(screenshot_path) as image:
        bounded_height = max(1, min(image.height, capture_height))
        if bounded_height == image.height:
            return
        cropped = image.crop((0, 0, image.width, bounded_height))
        cropped.save(screenshot_path)


def assert_runtime(dom: dict[str, Any]) -> dict[str, Any]:
    checks = {
        "pathname": dom.get("pathname") == "/home",
        "greeting": dom.get("greeting") == EXPECTED_RUNTIME["greeting"],
        "heroTitle": dom.get("heroTitle") == EXPECTED_RUNTIME["heroTitle"],
        "heroDescription": dom.get("heroDescription") == EXPECTED_RUNTIME["heroDescription"],
        "searchPlaceholder": dom.get("searchPlaceholder") == EXPECTED_RUNTIME["searchPlaceholder"],
        "searchStatus": dom.get("searchStatus") == EXPECTED_RUNTIME["searchStatus"],
        "micButton": bool(dom.get("hasMicButton")),
        "headerLinks": [item.get("ariaLabel") if item else None for item in dom.get("headerLinks", [])] == ["알림", "긴급"],
        "serviceLinks": [item.get("title", "") if item else "" for item in dom.get("serviceLinks", [])] == EXPECTED_RUNTIME["serviceTitles"],
        "recommendationLinks": [item.get("title", "") if item else "" for item in dom.get("recommendationLinks", [])] == EXPECTED_RUNTIME["recommendationTitles"],
        "navLinks": [
            (item.get("text") if item else None) or (item.get("ariaLabel") if item else None)
            for item in dom.get("navLinks", [])
        ] == ["홈", "AI 상담", "프로필"],
    }
    return {"pass": all(checks.values()), "checks": checks}


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
        args=["--headless=new", "--no-sandbox", "--window-size=390,1800"],
    )

    try:
        wait_for_http(f"{base_url}/")

        await browser.start()
        page = await browser.new_page()
        await page.goto(f"{base_url}/")
        await asyncio.sleep(1)
        await page.evaluate(seed_script(base_url))
        await page.goto(f"{base_url}/home")
        await asyncio.sleep(2)

        dom_payload = await page.evaluate(runtime_dom_script())
        dom = json.loads(dom_payload)
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
                  const contentNodes = Array.from(document.querySelectorAll('header, section, form')).filter((node) => {
                    const rect = node.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0;
                  });
                  const navNode = document.querySelector('nav');
                  const contentBottom = contentNodes.reduce((maxBottom, node) => Math.max(maxBottom, Math.ceil(node.getBoundingClientRect().bottom)), 0);
                  const navHeight = navNode ? Math.ceil(navNode.getBoundingClientRect().height) : 0;
                  return { height: contentBottom + navHeight + 24 };
                })())"""
            )
        )["height"]

        screenshot_b64 = await page.screenshot()
        screenshot_path.write_bytes(base64.b64decode(screenshot_b64))
        crop_screenshot_to_content(screenshot_path, capture_height)

        llm = ChatOllama(model=args.model, host="http://127.0.0.1:11434", timeout=600)
        agent = Agent(
            task=(
                f"Open {base_url}/home and inspect the page. "
                "Extract only the visible greeting, hero title, and hero description. "
                "For services, return only the 6 bold title texts from the service grid and ignore descriptions. "
                "For recommendations, return only the 2 card titles and ignore eyebrow/description text. "
                "For navigation, include the bottom labels 홈, AI 상담, 프로필, and if the middle button has only aria-label then still return AI 상담. "
                "Do not include search helper text, service descriptions, or any secondary captions. "
                "Do not navigate outside the home page."
            ),
            llm=llm,
            browser_session=browser,
            use_vision=True,
            generate_gif=False,
            output_model_schema=HomeSemanticResult,
            max_actions_per_step=3,
            step_timeout=90,
        )
        history = await agent.run(max_steps=8)
        semantic_raw_result = json.loads(history.final_result())
        semantic_result = normalize_semantic_result(semantic_raw_result)

        runtime_assertions = assert_runtime(dom)
        semantic_pass = semantic_result == EXPECTED_SEMANTIC
        source_chain = evaluate_source_chain()
        exact_pass = runtime_assertions["pass"] and source_chain["pass"]

        payload = {
            "baseUrl": base_url,
            "serverMode": args.server_mode,
            "model": args.model,
            "specPreview": str(ROOT / "sdd/01_planning/02_screen/guidelines/mobile/assets/page-010-surface-01.png"),
            "screenshot": str(screenshot_path),
            "browserViewport": viewport_info,
            "captureHeight": capture_height,
            "runtimeDom": dom,
            "runtimeAssertions": runtime_assertions,
            "semanticRawResult": semantic_raw_result,
            "semanticResult": semantic_result,
            "semanticExpected": EXPECTED_SEMANTIC,
            "semanticPass": semantic_pass,
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
