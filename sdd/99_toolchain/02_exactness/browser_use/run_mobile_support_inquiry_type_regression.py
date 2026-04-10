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

EXPECTED_DEFAULT = {
    "pathname": "/support/inquiry/type",
    "backgroundHeaderTitle": "1:1 문의",
    "sheetTitle": "문의 유형",
    "categoryLabels": ["기능 개선", "콘텐츠 관련", "계정/로그인", "기타/버그 신고"],
    "selectedCategory": "",
    "submitDisabled": True,
}

EXPECTED_SELECTED = {
    "selectedCategory": "계정/로그인",
    "submitDisabled": False,
}

EXPECTED_HANDOFF = {
    "pathname": "/support/inquiry/new",
    "selectedCategory": "계정/로그인",
    "subject": "로그인이 안돼요",
    "content": "앱에서 로그인 오류가 반복됩니다.",
    "overlayVisible": False,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4303)
    parser.add_argument("--server-mode", choices=["dev", "preview"], default="dev")
    parser.add_argument("--keep-server", action="store_true")
    parser.add_argument(
        "--results-file",
        default=str(RESULTS_DIR / "mobile-support-inquiry-type-regression.json"),
    )
    parser.add_argument(
        "--screenshot-file",
        default=str(RESULTS_DIR / "mobile-support-inquiry-type-regression.png"),
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
        "id": "preview-support-inquiry-type-regression",
        "email": "support-inquiry-type-regression@passview.preview",
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
      const radioButtons = Array.from(document.querySelectorAll('[role="radio"]'));
      const selectedRadio = radioButtons.find((button) => button.getAttribute('aria-checked') === 'true');
      const typeButton = document.querySelector('button[aria-label="문의 유형 선택"]');
      const subjectInput = document.querySelector('input[aria-label="문의 제목"]');
      const contentInput = document.querySelector('textarea[aria-label="문의 내용"]');
      const submitButton = document.querySelector('button[aria-label="문의 유형 등록"]');

      return JSON.stringify({
        pathname: window.location.pathname,
        backgroundHeaderTitle: normalize(document.querySelector('header h1')?.textContent),
        sheetTitle: normalize(document.querySelector('#support-inquiry-type-title')?.textContent),
        categoryLabels: radioButtons.map((button) => normalize(button.textContent)),
        selectedCategory: normalize(selectedRadio?.textContent),
        submitDisabled: submitButton?.disabled ?? null,
        typeFieldValue: normalize(typeButton?.querySelector('span')?.textContent),
        subjectValue: subjectInput?.value || '',
        contentValue: contentInput?.value || '',
        overlayVisible: Boolean(document.querySelector('#support-inquiry-type-title')),
      });
    }"""


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
        ("app_support_inquiry_create_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/support/inquiry/new" element={<SupportInquiryCreateScreen />}'),
        ("app_support_inquiry_type_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/support/inquiry/type" element={<SupportInquiryTypeScreen />}'),
        ("app_support_inquiry_type_overlay", ROOT / "client/mobile/src/app/App.tsx", 'const inquiryTypeOverlayActive = location.pathname === "/support/inquiry/type";'),
        ("create_screen_opens_overlay", ROOT / "client/mobile/src/mobile-app/SupportInquiryCreateScreen.tsx", 'navigate("/support/inquiry/type", {'),
        ("create_screen_preserves_draft_content", ROOT / "client/mobile/src/mobile-app/SupportInquiryCreateScreen.tsx", "draftContent: content"),
        ("create_screen_preserves_draft_subject", ROOT / "client/mobile/src/mobile-app/SupportInquiryCreateScreen.tsx", "draftSubject: subject"),
        ("type_screen_uses_bottom_sheet", ROOT / "client/mobile/src/mobile-app/SupportInquiryTypeScreen.tsx", "<SurfaceBottomSheetModal"),
        ("type_screen_uses_radiogroup", ROOT / "client/mobile/src/mobile-app/SupportInquiryTypeScreen.tsx", 'role="radiogroup"'),
        ("type_screen_maps_category_options", ROOT / "client/mobile/src/mobile-app/SupportInquiryTypeScreen.tsx", "supportInquiryCategoryOptions.map"),
        ("type_screen_handoff_to_create", ROOT / "client/mobile/src/mobile-app/SupportInquiryTypeScreen.tsx", 'navigate("/support/inquiry/new", {'),
        ("type_screen_uses_background_location", ROOT / "client/mobile/src/mobile-app/SupportInquiryTypeScreen.tsx", "getBottomSheetBackgroundLocation(location.state)"),
    ]

    results = []
    passed = True
    for key, path, needle in checks:
        text = path.read_text(encoding="utf-8")
        check_pass = needle in text
        passed = passed and check_pass
        results.append({"key": key, "path": str(path), "needle": needle, "pass": check_pass})

    return {"pass": passed, "checks": results}


def assert_default_state(dom: dict[str, Any]) -> dict[str, Any]:
    checks = {
        "pathname": dom.get("pathname") == EXPECTED_DEFAULT["pathname"],
        "backgroundHeaderTitle": dom.get("backgroundHeaderTitle") == EXPECTED_DEFAULT["backgroundHeaderTitle"],
        "sheetTitle": dom.get("sheetTitle") == EXPECTED_DEFAULT["sheetTitle"],
        "categoryLabels": dom.get("categoryLabels") == EXPECTED_DEFAULT["categoryLabels"],
        "selectedCategory": dom.get("selectedCategory") == EXPECTED_DEFAULT["selectedCategory"],
        "submitDisabled": dom.get("submitDisabled") == EXPECTED_DEFAULT["submitDisabled"],
    }
    return {"pass": all(checks.values()), "checks": checks}


def assert_selected_state(dom: dict[str, Any]) -> dict[str, Any]:
    checks = {
        "selectedCategory": dom.get("selectedCategory") == EXPECTED_SELECTED["selectedCategory"],
        "submitDisabled": dom.get("submitDisabled") == EXPECTED_SELECTED["submitDisabled"],
    }
    return {"pass": all(checks.values()), "checks": checks}


def assert_handoff_state(dom: dict[str, Any]) -> dict[str, Any]:
    checks = {
        "pathname": dom.get("pathname") == EXPECTED_HANDOFF["pathname"],
        "selectedCategory": dom.get("typeFieldValue") == EXPECTED_HANDOFF["selectedCategory"],
        "subjectValue": dom.get("subjectValue") == EXPECTED_HANDOFF["subject"],
        "contentValue": dom.get("contentValue") == EXPECTED_HANDOFF["content"],
        "overlayVisible": dom.get("overlayVisible") == EXPECTED_HANDOFF["overlayVisible"],
    }
    return {"pass": all(checks.values()), "checks": checks}


async def click_button(page: Any, selector: str) -> None:
    try:
        await page.click(selector)
        await asyncio.sleep(0.4)
        return
    except Exception:
        pass

    clicked = await page.evaluate(
        f"""() => {{
          const target = document.querySelector({json.dumps(selector)});
          if (!target) return false;
          target.dispatchEvent(new MouseEvent('click', {{ bubbles: true, cancelable: true, composed: true }}));
          return true;
        }}"""
    )
    if not clicked:
        raise RuntimeError(f"Unable to click selector={selector}")
    await asyncio.sleep(0.4)


async def click_button_with_label(page: Any, label: str) -> None:
    await click_button(page, f'button[aria-label="{label}"]')


async def set_input_value(page: Any, selector: str, value: str) -> None:
    updated = await page.evaluate(
        f"""() => {{
          const input = document.querySelector({json.dumps(selector)});
          if (!input) return false;
          const prototype = input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
          const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
          descriptor?.set?.call(input, {json.dumps(value)});
          input.dispatchEvent(new InputEvent('input', {{ bubbles: true, data: {json.dumps(value)} }}));
          input.dispatchEvent(new Event('change', {{ bubbles: true }}));
          return true;
        }}"""
    )
    if not updated:
        raise RuntimeError(f"Unable to set selector={selector}")
    await asyncio.sleep(0.4)


async def collect_dom(page: Any) -> dict[str, Any]:
    payload = await page.evaluate(runtime_dom_script())
    return json.loads(payload)


async def wait_for_path(page: Any, expected_path: str, timeout_seconds: float = 3.0) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        pathname = await page.evaluate("() => window.location.pathname")
        if pathname == expected_path:
            return
        await asyncio.sleep(0.1)
    raise TimeoutError(f"Timed out waiting for pathname={expected_path}")


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
        await page.goto(f"{base_url}/support/inquiry/new")
        await asyncio.sleep(2)

        await set_input_value(page, 'input[aria-label="문의 제목"]', EXPECTED_HANDOFF["subject"])
        await set_input_value(page, 'textarea[aria-label="문의 내용"]', EXPECTED_HANDOFF["content"])
        await click_button_with_label(page, "문의 유형 선택")
        await wait_for_path(page, "/support/inquiry/type")
        default_dom = await collect_dom(page)

        await click_button(page, 'button[aria-label="계정/로그인 선택"]')
        selected_dom = await collect_dom(page)

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
        screenshot_b64 = await page.screenshot()
        screenshot_path.write_bytes(base64.b64decode(screenshot_b64))
        crop_screenshot_to_height(screenshot_path, viewport_info["innerHeight"])

        await click_button_with_label(page, "문의 유형 등록")
        await wait_for_path(page, "/support/inquiry/new")
        handoff_dom = await collect_dom(page)

        default_assertions = assert_default_state(default_dom)
        selected_assertions = assert_selected_state(selected_dom)
        handoff_assertions = assert_handoff_state(handoff_dom)
        source_chain = evaluate_source_chain()
        exact_pass = all(
            [
                default_assertions["pass"],
                selected_assertions["pass"],
                handoff_assertions["pass"],
                source_chain["pass"],
            ]
        )

        payload = {
            "baseUrl": base_url,
            "serverMode": args.server_mode,
            "specPage": 64,
            "specPreview": str(ROOT / "sdd/01_planning/02_screen/guidelines/mobile/assets/page-064-surface-01.png"),
            "screenshot": str(screenshot_path),
            "browserViewport": viewport_info,
            "defaultDom": default_dom,
            "selectedDom": selected_dom,
            "handoffDom": handoff_dom,
            "runtimeAssertions": {
                "default": default_assertions,
                "selected": selected_assertions,
                "handoff": handoff_assertions,
                "pass": default_assertions["pass"] and selected_assertions["pass"] and handoff_assertions["pass"],
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
