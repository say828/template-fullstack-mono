#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import base64
import json
import os
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
INTERPRETATION_SETTINGS_STORAGE_KEY = "passv-in.mobile.interpretation.settings"

EXPECTED_SETTINGS_RUNTIME = {
    "pathname": "/settings/interpretation",
    "title": "통역 기본 설정",
    "baseLanguage": "বাংলা (Bangla)",
    "autoTitles": ["AI 상담 자동 번역", "음성 상담 실시간 통역", "교육 콘텐츠 자막 표시"],
    "translationModes": ["양방향 번역", "한국어 → 모국어만", "모국어 → 한국어만"],
    "speechLabel": "내 음성 인식 언어",
    "speechLanguage": "বাংলা (Bangla)",
    "slowSpeechLabel": "느린 발화 모드",
    "changeButtons": ["기본 언어 변경", "음성 인식 언어 변경"],
}

EXPECTED_INTERPRETATION_RUNTIME = {
    "pathname": "/health/interpretation",
    "title": "통역",
    "languages": ["বাংলা (Bangla)", "한국어 (Korean)"],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4304)
    parser.add_argument("--server-mode", choices=["dev", "preview"], default="dev")
    parser.add_argument("--keep-server", action="store_true")
    parser.add_argument(
        "--results-file",
        default=str(RESULTS_DIR / "mobile-interpretation-settings-regression.json"),
    )
    parser.add_argument(
        "--screenshot-file",
        default=str(RESULTS_DIR / "mobile-interpretation-settings-regression.png"),
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


def seed_script() -> str:
    preview_user = {
        "id": "preview-interpretation-settings-regression",
        "email": "interpretation-settings@passview.preview",
        "role": "member",
        "nickname": "모바일 검수 사용자",
        "phone": "010-1234-5678",
        "subscription_status": None,
        "seller_status": None,
    }
    runtime_user = {
        "id": "in-01012345678",
        "fullName": "모바일 검수 사용자",
        "phoneNumber": "010-1234-5678",
        "locale": "bn",
        "authMethod": "phone",
        "registeredAt": "2026-03-17T00:00:00.000Z",
        "preview": True,
    }
    interpretation_settings = {
        "baseLocale": "bn",
        "speechLocale": "bn",
        "aiChatAutoTranslation": True,
        "voiceCounselLiveTranslation": True,
        "educationCaptionVisible": True,
        "translationMode": "bidirectional",
        "slowSpeechMode": False,
    }

    return f"""() => {{
      localStorage.setItem("{AUTH_PREVIEW_STORAGE_KEY}", JSON.stringify({json.dumps(preview_user, ensure_ascii=False)}));
      localStorage.setItem("{RUNTIME_SESSION_STORAGE_KEY}", JSON.stringify({json.dumps(runtime_user, ensure_ascii=False)}));
      localStorage.setItem("{RUNTIME_ONBOARDING_STORAGE_KEY}", JSON.stringify(true));
      localStorage.setItem("{INTERPRETATION_SETTINGS_STORAGE_KEY}", JSON.stringify({json.dumps(interpretation_settings, ensure_ascii=False)}));
    }}"""


def settings_dom_script() -> str:
    return """() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      const toggleRows = Array.from(document.querySelectorAll('button[aria-pressed]')).map((button) => {
        const row = button.closest('div.flex');
        return row ? normalize(row.querySelector('p')?.textContent) : null;
      }).filter(Boolean);
      const radioTitles = Array.from(document.querySelectorAll('[role="radio"]')).map((node) => {
        return normalize(node.querySelector('span.block')?.textContent);
      });
      const baseContainer = document.querySelector('button[aria-label="기본 언어 변경"]')?.parentElement;
      const speechContainer = document.querySelector('button[aria-label="음성 인식 언어 변경"]')?.parentElement;
      return JSON.stringify({
        pathname: window.location.pathname,
        title: normalize(document.querySelector('h1')?.textContent),
        baseLanguage: normalize(baseContainer?.querySelector('p:last-of-type')?.textContent),
        autoTitles: toggleRows.slice(0, 3),
        translationModes: radioTitles,
        speechLabel: normalize(speechContainer?.querySelector('p:first-of-type')?.textContent),
        speechLanguage: normalize(speechContainer?.querySelector('p:last-of-type')?.textContent),
        slowSpeechLabel: toggleRows[3] || null,
        changeButtons: Array.from(document.querySelectorAll('button[aria-label$="변경"]')).map((node) => normalize(node.getAttribute('aria-label'))),
      });
    }"""


def interpretation_dom_script() -> str:
    return """() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      const firstSection = document.querySelector('section');
      const topButtons = Array.from(firstSection?.querySelectorAll('button') || [])
        .map((node) => normalize(node.innerText))
        .filter(Boolean)
        .slice(0, 2);
      return JSON.stringify({
        pathname: window.location.pathname,
        title: normalize(document.querySelector('h1')?.textContent),
        languages: topButtons,
      });
    }"""


def capture_height_script() -> str:
    return """() => JSON.stringify((() => {
      const nodes = Array.from(document.querySelectorAll('header, section')).filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      const contentBottom = nodes.reduce((maxBottom, node) => Math.max(maxBottom, Math.ceil(node.getBoundingClientRect().bottom)), 0);
      return { height: contentBottom + 24 };
    })())"""


def evaluate_source_chain() -> dict[str, Any]:
    checks: list[tuple[str, Path, str]] = [
        ("main_renders_app", ROOT / "client/mobile/src/main.tsx", "<App />"),
        ("main_wraps_auth_provider", ROOT / "client/mobile/src/main.tsx", "<AuthProvider>"),
        ("main_wraps_runtime_provider", ROOT / "client/mobile/src/main.tsx", "<InRuntimeProvider>"),
        ("app_settings_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/settings/interpretation" element={<InterpretationSettingsScreen />}'),
        ("app_interpretation_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/health/interpretation" element={<InterpretationScreen />}'),
        ("app_language_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/language" element={<LanguagePage />}'),
        ("protected_route_runtime_access", ROOT / "client/mobile/src/auth/ProtectedRoute.tsx", "const runtimeAccess = hasFlowSession || Boolean(currentUser);"),
        ("settings_uses_mobile_shell", ROOT / "client/mobile/src/mobile-app/InterpretationSettingsScreen.tsx", "<MobileAppShell"),
        ("settings_reads_storage", ROOT / "client/mobile/src/mobile-app/InterpretationSettingsScreen.tsx", "readInterpretationSettings"),
        ("settings_routes_to_language", ROOT / "client/mobile/src/mobile-app/InterpretationSettingsScreen.tsx", 'navigate("/language"'),
        ("language_screen_contextual_mode", ROOT / "client/mobile/src/mobile-auth/LanguageScreen.tsx", "allowAuthenticatedContext"),
        ("language_screen_return_payload", ROOT / "client/mobile/src/mobile-auth/LanguageScreen.tsx", "selectionContext"),
        ("interpretation_reads_settings", ROOT / "client/mobile/src/mobile-app/InterpretationScreen.tsx", "readInterpretationSettings"),
        ("interpretation_storage_key", ROOT / "client/mobile/src/mobile-app/interpretationSettings.ts", INTERPRETATION_SETTINGS_STORAGE_KEY),
    ]

    results = []
    passed = True
    for key, path, needle in checks:
      text = path.read_text(encoding="utf-8")
      check_pass = needle in text
      passed = passed and check_pass
      results.append({"key": key, "path": str(path), "needle": needle, "pass": check_pass})

    return {"pass": passed, "checks": results}


def crop_screenshot_to_content(screenshot_path: Path, capture_height: int) -> None:
    with Image.open(screenshot_path) as image:
        bounded_height = max(1, min(image.height, capture_height))
        if bounded_height == image.height:
            return
        cropped = image.crop((0, 0, image.width, bounded_height))
        cropped.save(screenshot_path)


def assert_settings_runtime(dom: dict[str, Any]) -> dict[str, Any]:
    checks = {key: dom.get(key) == value for key, value in EXPECTED_SETTINGS_RUNTIME.items()}
    return {"pass": all(checks.values()), "checks": checks}


def assert_interpretation_runtime(dom: dict[str, Any]) -> dict[str, Any]:
    checks = {key: dom.get(key) == value for key, value in EXPECTED_INTERPRETATION_RUNTIME.items()}
    return {"pass": all(checks.values()), "checks": checks}


async def choose_language(page: Any, language_name: str, base_url: str) -> None:
    await wait_for_path(page, "/language")
    await click_button_containing_text(page, language_name)
    await click_button_containing_text(page, "확인")
    await wait_for_path(page, "/settings/interpretation")
    await asyncio.sleep(0.6)


async def current_path(page: Any) -> str:
    return await page.evaluate("() => window.location.pathname")


async def wait_for_path(page: Any, expected_path: str, timeout_seconds: int = 20) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        if await current_path(page) == expected_path:
            return
        await asyncio.sleep(0.2)
    raise TimeoutError(f"Timed out waiting for path {expected_path}")


async def click_button_by_aria_label(page: Any, label: str) -> None:
    clicked = await page.evaluate(
        f"""() => {{
          const target = Array.from(document.querySelectorAll('button')).find((button) => button.getAttribute('aria-label') === {json.dumps(label)});
          if (!target) return false;
          target.click();
          return true;
        }}"""
    )
    if not clicked:
        raise RuntimeError(f"Unable to find button with aria-label={label}")
    await asyncio.sleep(0.4)


async def click_button_containing_text(page: Any, text: str) -> None:
    clicked = await page.evaluate(
        f"""() => {{
          const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
          const target = Array.from(document.querySelectorAll('button')).find((button) => normalize(button.innerText || button.textContent).includes({json.dumps(text)}));
          if (!target) return false;
          target.click();
          return true;
        }}"""
    )
    if not clicked:
        raise RuntimeError(f"Unable to find button containing text={text}")
    await asyncio.sleep(0.4)


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
        await page.evaluate(seed_script())
        await page.goto(f"{base_url}/settings/interpretation")
        await asyncio.sleep(1.5)

        initial_dom = json.loads(await page.evaluate(settings_dom_script()))
        initial_assertions = assert_settings_runtime(initial_dom)

        await click_button_by_aria_label(page, "기본 언어 변경")
        await choose_language(page, "한국어 (Korean)", base_url)
        base_after_ko = json.loads(await page.evaluate(settings_dom_script()))

        await click_button_by_aria_label(page, "기본 언어 변경")
        await choose_language(page, "বাংলা (Bangla)", base_url)
        base_restored = json.loads(await page.evaluate(settings_dom_script()))

        await click_button_by_aria_label(page, "음성 인식 언어 변경")
        await choose_language(page, "English", base_url)
        speech_after_en = json.loads(await page.evaluate(settings_dom_script()))

        await click_button_by_aria_label(page, "음성 인식 언어 변경")
        await choose_language(page, "বাংলা (Bangla)", base_url)
        final_settings_dom = json.loads(await page.evaluate(settings_dom_script()))
        final_settings_assertions = assert_settings_runtime(final_settings_dom)

        capture_height = json.loads(await page.evaluate(capture_height_script()))["height"]
        screenshot_b64 = await page.screenshot()
        screenshot_path.write_bytes(base64.b64decode(screenshot_b64))
        crop_screenshot_to_content(screenshot_path, capture_height)

        await page.goto(f"{base_url}/health/interpretation")
        await asyncio.sleep(1)
        interpretation_dom = json.loads(await page.evaluate(interpretation_dom_script()))
        interpretation_assertions = assert_interpretation_runtime(interpretation_dom)

        source_chain = evaluate_source_chain()
        flow_assertions = {
            "base_language_changes_to_ko": base_after_ko["baseLanguage"] == "한국어 (Korean)",
            "base_language_restores_to_bn": base_restored["baseLanguage"] == "বাংলা (Bangla)",
            "speech_language_changes_to_en": speech_after_en["speechLanguage"] == "English",
            "speech_language_restores_to_bn": final_settings_dom["speechLanguage"] == "বাংলা (Bangla)",
        }
        exact_pass = initial_assertions["pass"] and final_settings_assertions["pass"] and interpretation_assertions["pass"] and source_chain["pass"] and all(
            flow_assertions.values()
        )

        payload = {
            "baseUrl": base_url,
            "serverMode": args.server_mode,
            "specPreview": str(ROOT / "sdd/01_planning/02_screen/guidelines/mobile/assets/page-056-surface-01.png"),
            "screenshot": str(screenshot_path),
            "captureHeight": capture_height,
            "initialSettingsDom": initial_dom,
            "initialSettingsAssertions": initial_assertions,
            "baseLanguageAfterKo": base_after_ko,
            "baseLanguageRestored": base_restored,
            "speechLanguageAfterEnglish": speech_after_en,
            "finalSettingsDom": final_settings_dom,
            "finalSettingsAssertions": final_settings_assertions,
            "interpretationDom": interpretation_dom,
            "interpretationAssertions": interpretation_assertions,
            "flowAssertions": flow_assertions,
            "sourceChain": source_chain,
            "exactPass": exact_pass,
            "pass": exact_pass,
        }
        results_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(payload, ensure_ascii=False))
        return 0 if exact_pass else 2
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
