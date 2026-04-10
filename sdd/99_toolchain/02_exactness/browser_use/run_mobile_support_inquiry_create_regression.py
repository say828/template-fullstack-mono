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

EXPECTED_CREATE_DEFAULT = {
    "pathname": "/support/inquiry/new",
    "headerTitle": "1:1 문의",
    "sectionTitles": ["문의 유형", "제목", "내용", "사진 첨부"],
    "categoryValue": "문의 유형을 선택해주세요",
    "subjectPlaceholder": "제목을 입력해 주세요.",
    "contentPlaceholder": "문의 내용을 자세히 적어주세요.",
    "subjectCount": "0/50",
    "contentCount": "0/500",
    "attachmentGuide": "최대 10장, 10MB 미만의 이미지만 첨부할 수 있어요.",
    "attachmentCount": "0/10",
    "previewNotice": "실제 로그인 세션에서는 문의 내용을 서버에 저장할 수 있습니다.",
    "submitLabel": "등록",
    "submitDisabled": True,
}

EXPECTED_TYPE_DEFAULT = {
    "pathname": "/support/inquiry/type",
    "title": "문의 유형",
    "options": ["기능 개선", "콘텐츠 관련", "계정/로그인", "기타/버그 신고"],
    "submitLabel": "등록",
    "submitDisabled": True,
}

EXPECTED_RETURN_STATE = {
    "pathname": "/support/inquiry/new",
    "categoryValue": "계정/로그인",
    "subjectValue": "로그인 문의",
    "contentValue": "로그인이 자꾸 풀려서 문의드립니다.",
    "subjectCount": "6/50",
    "contentCount": "19/500",
    "attachmentCount": "0/10",
    "previewNotice": "실제 로그인 세션에서는 문의 내용을 서버에 저장할 수 있습니다.",
    "submitDisabled": True,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4305)
    parser.add_argument("--server-mode", choices=["dev", "preview"], default="dev")
    parser.add_argument("--keep-server", action="store_true")
    parser.add_argument(
        "--results-file",
        default=str(RESULTS_DIR / "mobile-support-inquiry-create-regression.json"),
    )
    parser.add_argument(
        "--screenshot-file",
        default=str(RESULTS_DIR / "mobile-support-inquiry-create-regression.png"),
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
        "id": "preview-support-inquiry-create-regression",
        "email": "support-inquiry-create@passview.preview",
        "role": "member",
        "nickname": "모바일 문의 검수 사용자",
        "phone": "010-1234-5678",
        "subscription_status": None,
        "seller_status": None,
    }
    runtime_user = {
        "id": "in-01012345678",
        "fullName": "모바일 문의 검수 사용자",
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
    }}"""


def create_dom_script() -> str:
    return """() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      const attachmentGuideCandidates = Array.from(document.querySelectorAll('div'))
        .map((node) => normalize(node.textContent))
        .filter((text) => text.includes('최대 10장, 10MB 미만의 이미지만 첨부할 수 있어요.'));
      const sectionTitles = Array.from(document.querySelectorAll('section > div > p:first-child, section > p:first-child'))
        .map((node) => normalize(node.textContent))
        .filter(Boolean);
      const counters = Array.from(document.querySelectorAll('section span'))
        .map((node) => normalize(node.textContent))
        .filter((value) => /^\\d+\\/\\d+$/.test(value));
      const attachmentButtonText = Array.from(document.querySelectorAll('button span'))
        .map((node) => normalize(node.textContent))
        .find((value) => /^\\d+\\/\\d+$/.test(value) && value !== counters[0] && value !== counters[1]) || null;
      const submitButton = Array.from(document.querySelectorAll('button'))
        .find((button) => normalize(button.textContent) === '등록' || normalize(button.textContent) === '등록 중...');

      return JSON.stringify({
        pathname: window.location.pathname,
        headerTitle: normalize(document.querySelector('h1')?.textContent),
        sectionTitles,
        categoryValue: normalize(document.querySelector('section button span')?.textContent),
        subjectPlaceholder: document.querySelector('input')?.getAttribute('placeholder') || null,
        subjectValue: document.querySelector('input')?.value || '',
        contentPlaceholder: document.querySelector('textarea')?.getAttribute('placeholder') || null,
        contentValue: document.querySelector('textarea')?.value || '',
        subjectCount: counters[0] || null,
        contentCount: counters[1] || null,
        attachmentGuide: attachmentGuideCandidates.sort((left, right) => left.length - right.length)[0] || null,
        attachmentCount: attachmentButtonText || null,
        previewNotice: Array.from(document.querySelectorAll('p'))
          .map((node) => normalize(node.textContent))
          .find((text) => text.includes('실제 로그인 세션에서는 문의 내용을 서버에 저장할 수 있습니다.')) || null,
        submitLabel: normalize(submitButton?.textContent),
        submitDisabled: Boolean(submitButton?.disabled),
      });
    }"""


def type_dom_script() -> str:
    return """() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      const root = document.querySelector('[role="dialog"][aria-labelledby="support-inquiry-type-title"]') || document.body;
      const buttons = Array.from(root.querySelectorAll('button'));
      const submitButton = buttons.find((button) => normalize(button.textContent) === '등록');
      const options = buttons
        .filter((button) => button !== submitButton)
        .map((button) => normalize(button.textContent))
        .filter(Boolean);

      return JSON.stringify({
        pathname: window.location.pathname,
        title: normalize(root.querySelector('h1')?.textContent),
        options,
        activeOption: normalize(
          buttons
            .filter((button) => button !== submitButton)
            .find((button) => /rgb\\(37, 87, 164\\)|#2557a4/i.test(window.getComputedStyle(button).color))
            ?.textContent
        ),
        submitLabel: normalize(submitButton?.textContent),
        submitDisabled: Boolean(submitButton?.disabled),
      });
    }"""


def capture_height_script() -> str:
    return """() => JSON.stringify((() => {
      const nodes = Array.from(document.querySelectorAll('header, section, button'))
        .filter((node) => {
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
      const bottom = nodes.reduce((maxBottom, node) => Math.max(maxBottom, Math.ceil(node.getBoundingClientRect().bottom)), 0);
      return { height: Math.min(window.innerHeight, bottom + 24) };
    })())"""


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
        ("app_support_inquiry_new_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/support/inquiry/new" element={<SupportInquiryCreateScreen />}'),
        ("app_support_inquiry_type_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/support/inquiry/type" element={<SupportInquiryTypeScreen />}'),
        ("app_overlay_background_route", ROOT / "client/mobile/src/app/App.tsx", 'inquiryTypeOverlayActive'),
        ("app_protected_route", ROOT / "client/mobile/src/app/App.tsx", "<Route element={<ProtectedRoute />}>"),
        ("protected_route_runtime_access", ROOT / "client/mobile/src/auth/ProtectedRoute.tsx", "const runtimeAccess = hasFlowSession || Boolean(currentUser);"),
        ("create_screen_uses_mobile_shell", ROOT / "client/mobile/src/mobile-app/SupportInquiryCreateScreen.tsx", "<MobileAppShell"),
        ("create_screen_routes_to_type", ROOT / "client/mobile/src/mobile-app/SupportInquiryCreateScreen.tsx", 'navigate("/support/inquiry/type"'),
        ("create_screen_calls_api", ROOT / "client/mobile/src/mobile-app/SupportInquiryCreateScreen.tsx", "createSupportInquiry"),
        ("create_screen_attachment_limit", ROOT / "client/mobile/src/mobile-app/SupportInquiryCreateScreen.tsx", "MAX_ATTACHMENTS = 10"),
        ("create_screen_requires_auth", ROOT / "client/mobile/src/mobile-app/SupportInquiryCreateScreen.tsx", "실제 로그인 후 문의를 등록할 수 있습니다."),
        ("create_screen_preview_notice", ROOT / "client/mobile/src/mobile-app/SupportInquiryCreateScreen.tsx", "실제 로그인 세션에서는 문의 내용을 서버에 저장할 수 있습니다."),
        ("type_screen_uses_bottom_sheet", ROOT / "client/mobile/src/mobile-app/SupportInquiryTypeScreen.tsx", "<SurfaceBottomSheetModal"),
        ("type_screen_returns_selected_category", ROOT / "client/mobile/src/mobile-app/SupportInquiryTypeScreen.tsx", 'navigate("/support/inquiry/new"'),
        ("support_api_create_inquiry", ROOT / "client/mobile/src/mobile-app/supportApi.ts", '"/support/inquiries"'),
        ("support_api_category_options", ROOT / "client/mobile/src/mobile-app/supportApi.ts", 'backendCategory: "account_login"'),
        ("support_router_create", ROOT / "server/contexts/support/contracts/router.py", '@router.post("/api/support/inquiries")'),
        ("support_router_list_mine", ROOT / "server/contexts/support/contracts/router.py", '@router.get("/api/support/inquiries/my")'),
    ]

    results = []
    passed = True
    for key, path, needle in checks:
        text = path.read_text(encoding="utf-8")
        check_pass = needle in text
        passed = passed and check_pass
        results.append({"key": key, "path": str(path), "needle": needle, "pass": check_pass})

    return {"pass": passed, "checks": results}


def assert_state(dom: dict[str, Any], expected: dict[str, Any]) -> dict[str, Any]:
    checks = {key: dom.get(key) == value for key, value in expected.items()}
    return {"pass": all(checks.values()), "checks": checks}


async def current_path(page: Any) -> str:
    return await page.evaluate("() => window.location.pathname")


async def wait_for_path(page: Any, expected_path: str, timeout_seconds: int = 20) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        if await current_path(page) == expected_path:
            return
        await asyncio.sleep(0.2)
    raise TimeoutError(f"Timed out waiting for path {expected_path}, current={await current_path(page)}")


async def collect_dom(page: Any, script: str) -> dict[str, Any]:
    payload = await page.evaluate(script)
    return json.loads(payload)


async def set_input_value(page: Any, selector: str, value: str) -> None:
    updated = await page.evaluate(
        f"""() => {{
          const input = document.querySelector({json.dumps(selector)});
          if (!input) return false;
          const prototype = input.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
          const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
          descriptor?.set?.call(input, {json.dumps(value)});
          input.dispatchEvent(new InputEvent('input', {{ bubbles: true, data: {json.dumps(value)} }}));
          input.dispatchEvent(new Event('change', {{ bubbles: true }}));
          return true;
        }}"""
    )
    if not updated:
        raise RuntimeError(f"Unable to find input for selector={selector}")
    await asyncio.sleep(0.4)


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
        raise RuntimeError(f"Unable to find button text={text}")
    await asyncio.sleep(0.5)


async def click_dialog_button_containing_text(page: Any, text: str, *, use_last_match: bool = False) -> None:
    target_expression = "matches[matches.length - 1]" if use_last_match else "matches[0]"
    clicked = await page.evaluate(
        f"""() => {{
          const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
          const root = document.querySelector('[role="dialog"][aria-labelledby="support-inquiry-type-title"]');
          if (!root) return false;
          const matches = Array.from(root.querySelectorAll('button')).filter((button) => normalize(button.innerText || button.textContent) === {json.dumps(text)});
          const target = {target_expression};
          if (!target) return false;
          target.click();
          return true;
        }}"""
    )
    if not clicked:
        raise RuntimeError(f"Unable to find dialog button text={text}")
    await asyncio.sleep(0.5)


async def click_category_trigger(page: Any) -> None:
    clicked = await page.evaluate(
        """() => {
          const button = document.querySelector('section button');
          if (!button) return false;
          button.click();
          return true;
        }"""
    )
    if not clicked:
        raise RuntimeError("Unable to find category trigger")
    await asyncio.sleep(0.5)


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
        await page.evaluate(seed_script())
        await page.goto(f"{base_url}/support/inquiry/new")
        await asyncio.sleep(2)

        default_dom = await collect_dom(page, create_dom_script())
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
        capture_height = json.loads(await page.evaluate(capture_height_script()))["height"]
        screenshot_b64 = await page.screenshot()
        screenshot_path.write_bytes(base64.b64decode(screenshot_b64))
        crop_screenshot_to_height(screenshot_path, capture_height)

        await set_input_value(page, "input", EXPECTED_RETURN_STATE["subjectValue"])
        await set_input_value(page, "textarea", EXPECTED_RETURN_STATE["contentValue"])
        await click_category_trigger(page)
        await wait_for_path(page, EXPECTED_TYPE_DEFAULT["pathname"])

        type_default_dom = await collect_dom(page, type_dom_script())
        await click_dialog_button_containing_text(page, EXPECTED_RETURN_STATE["categoryValue"])
        type_selected_dom = await collect_dom(page, type_dom_script())
        await click_dialog_button_containing_text(page, "등록", use_last_match=True)
        await wait_for_path(page, EXPECTED_RETURN_STATE["pathname"])
        await asyncio.sleep(0.6)

        return_dom = await collect_dom(page, create_dom_script())

        default_assertions = assert_state(default_dom, EXPECTED_CREATE_DEFAULT)
        type_default_assertions = assert_state(type_default_dom, EXPECTED_TYPE_DEFAULT)
        type_selection_assertions = assert_state(
            type_selected_dom,
            {
                **EXPECTED_TYPE_DEFAULT,
                "activeOption": EXPECTED_RETURN_STATE["categoryValue"],
                "submitDisabled": False,
            },
        )
        return_assertions = assert_state(return_dom, EXPECTED_RETURN_STATE)
        source_chain = evaluate_source_chain()
        exact_pass = all(
            [
                default_assertions["pass"],
                type_default_assertions["pass"],
                type_selection_assertions["pass"],
                return_assertions["pass"],
                source_chain["pass"],
            ]
        )

        payload = {
            "baseUrl": base_url,
            "serverMode": args.server_mode,
            "specPage": 63,
            "specPreview": str(ROOT / "sdd/01_planning/02_screen/guidelines/mobile/assets/page-063-surface-01.png"),
            "typeSpecPage": 64,
            "typeSpecPreview": str(ROOT / "sdd/01_planning/02_screen/guidelines/mobile/assets/page-064-surface-01.png"),
            "screenshot": str(screenshot_path),
            "browserViewport": viewport_info,
            "captureHeight": capture_height,
            "defaultDom": default_dom,
            "typeDefaultDom": type_default_dom,
            "typeSelectedDom": type_selected_dom,
            "returnDom": return_dom,
            "runtimeAssertions": {
                "default": default_assertions,
                "typeDefault": type_default_assertions,
                "typeSelection": type_selection_assertions,
                "return": return_assertions,
                "pass": default_assertions["pass"]
                and type_default_assertions["pass"]
                and type_selection_assertions["pass"]
                and return_assertions["pass"],
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
