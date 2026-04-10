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

EXPECTED_SELECTED_RUNTIME = {
    "pathname": "/settings/account/delete",
    "headerTitle": "회원탈퇴",
    "heroTitle": "😢 정말 탈퇴하시겠어요?",
    "introLines": [
        "회원 탈퇴 시 아래 정보가 모두 삭제되며 복구할 수 없습니다.",
        "- 개인 기본 정보 및 체류 정보",
        "- 상담 기록 및 진단 결과",
        "- 교육 이력 및 퀴즈 결과",
        "- 즐겨찾기 콘텐츠",
        "- 1:1 문의 내역",
        "- 통역 설정 및 긴급 기능 설정",
    ],
    "reasonHeading": "계정을 삭제하려는 이유가 궁금해요",
    "reasonOptions": [
        "원하는 정보를 찾기 어려워요",
        "상담 답변이 충분하지 않아요",
        "교육 콘텐츠가 도움이 되지 않았어요",
        "앱 사용이 불편해요",
        "기타",
    ],
    "selectedReason": "기타",
    "textareaPlaceholder": "계정을 삭제하려는 이유를 알려주세요.",
    "ctaLabel": "탈퇴하기",
}

EXPECTED_DETAIL_VALIDATION = {
    "pathname": "/settings/account/delete",
    "message": "기타 사유를 입력해주세요.",
}

EXPECTED_PREVIEW_GUARD = {
    "pathname": "/settings/account/delete",
    "message": "실제 로그인 후 회원 탈퇴를 진행할 수 있습니다.",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4306)
    parser.add_argument("--server-mode", choices=["dev", "preview"], default="dev")
    parser.add_argument("--keep-server", action="store_true")
    parser.add_argument(
        "--results-file",
        default=str(RESULTS_DIR / "mobile-account-delete-regression.json"),
    )
    parser.add_argument(
        "--screenshot-file",
        default=str(RESULTS_DIR / "mobile-account-delete-regression.png"),
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
        "id": "preview-account-delete-regression",
        "email": "account-delete-regression@passview.preview",
        "role": "member",
        "nickname": "계정 삭제 검수 사용자",
        "phone": "010-1234-5678",
        "subscription_status": None,
        "seller_status": None,
    }
    runtime_user = {
        "id": "in-01012345678",
        "fullName": "계정 삭제 검수 사용자",
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


def runtime_dom_script() -> str:
    return """() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      const sections = Array.from(document.querySelectorAll('section'));
      const introLines = (sections[0]?.querySelector('p')?.innerText || '').split('\\n').map(normalize).filter(Boolean);
      const reasonButtons = Array.from(sections[1]?.querySelectorAll('button') || []).map((button) => {
        const spans = button.querySelectorAll('span');
        const dot = spans[2];
        const dotColor = dot ? window.getComputedStyle(dot).backgroundColor : '';
        return {
          label: normalize(spans[0]?.textContent),
          active: Boolean(dotColor && dotColor !== 'rgba(0, 0, 0, 0)' && dotColor !== 'transparent'),
        };
      });
      const feedbackMessages = Array.from(document.querySelectorAll('p'))
        .map((node) => normalize(node.textContent))
        .filter((value) => value === '기타 사유를 입력해주세요.' || value === '실제 로그인 후 회원 탈퇴를 진행할 수 있습니다.');
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitButton = buttons.find((button) => {
        const label = normalize(button.innerText || button.textContent);
        return label === '탈퇴하기' || label === '탈퇴 처리 중...';
      });
      const textarea = document.querySelector('textarea');

      return JSON.stringify({
        pathname: window.location.pathname,
        headerTitle: normalize(document.querySelector('h1')?.textContent),
        heroTitle: normalize(document.querySelector('h2')?.textContent),
        introLines,
        reasonHeading: normalize(sections[1]?.querySelector('h3')?.textContent),
        reasonOptions: reasonButtons.map((item) => item.label),
        selectedReason: reasonButtons.find((item) => item.active)?.label || null,
        textareaPlaceholder: textarea?.getAttribute('placeholder') || null,
        textareaValue: textarea?.value || '',
        ctaLabel: normalize(submitButton?.innerText || submitButton?.textContent),
        message: feedbackMessages.at(-1) || null,
      });
    }"""


def capture_height_script() -> str:
    return """() => JSON.stringify((() => {
      const nodes = [
        document.querySelector('header'),
        ...Array.from(document.querySelectorAll('section')),
        ...Array.from(document.querySelectorAll('button')).slice(-1),
      ].filter(Boolean);
      const bottom = nodes.reduce((maxBottom, node) => Math.max(maxBottom, Math.ceil(node.getBoundingClientRect().bottom)), 0);
      return { height: Math.min(document.documentElement.scrollHeight, bottom + 24) };
    })())"""


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
        ("app_delete_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/settings/account/delete" element={<AccountDeleteScreen />}'),
        ("app_delete_removed_from_generic", ROOT / "client/mobile/src/app/App.tsx", '"/settings/account/delete"'),
        ("protected_route_runtime_access", ROOT / "client/mobile/src/auth/ProtectedRoute.tsx", "const runtimeAccess = hasFlowSession || Boolean(currentUser);"),
        ("screen_uses_mobile_shell", ROOT / "client/mobile/src/mobile-app/AccountDeleteScreen.tsx", "<MobileAppShell"),
        ("screen_calls_delete_account", ROOT / "client/mobile/src/mobile-app/AccountDeleteScreen.tsx", "await deleteAccount(accessToken, {"),
        ("screen_requires_real_login", ROOT / "client/mobile/src/mobile-app/AccountDeleteScreen.tsx", "실제 로그인 후 회원 탈퇴를 진행할 수 있습니다."),
        ("screen_requires_detail_for_other_reason", ROOT / "client/mobile/src/mobile-app/AccountDeleteScreen.tsx", "기타 사유를 입력해주세요."),
        ("screen_sends_detail_only_for_other_reason", ROOT / "client/mobile/src/mobile-app/AccountDeleteScreen.tsx", 'detail: selectedReason === "기타" ? normalizedDetail : null'),
        ("auth_client_delete_endpoint", ROOT / "client/mobile/src/auth/auth-client.ts", 'method: "DELETE"'),
        ("auth_client_delete_users_me", ROOT / "client/mobile/src/auth/auth-client.ts", '"/users/me"'),
        ("user_router_delete_route", ROOT / "server/contexts/user/contracts/router.py", '@router.delete("/api/users/me")'),
        ("user_service_requires_other_detail", ROOT / "server/contexts/user/application/services.py", 'if normalized_reason == "기타" and not normalized_detail:'),
        ("user_repository_cleans_payment_method", ROOT / "server/contexts/user/infrastructure/repository.py", "delete(PaymentMethod).where(PaymentMethod.user_id == user_id)"),
        ("user_repository_cleans_org_membership", ROOT / "server/contexts/user/infrastructure/repository.py", "delete(OrganizationMember).where(OrganizationMember.user_id == user_id)"),
    ]

    results = []
    passed = True
    for key, path, needle in checks:
        text = path.read_text(encoding="utf-8")
        check_pass = needle in text
        passed = passed and check_pass
        results.append({"key": key, "path": str(path), "needle": needle, "pass": check_pass})

    return {"pass": passed, "checks": results}


def assert_selected_runtime(dom: dict[str, Any]) -> dict[str, Any]:
    checks = {key: dom.get(key) == value for key, value in EXPECTED_SELECTED_RUNTIME.items()}
    return {"pass": all(checks.values()), "checks": checks}


def assert_detail_validation(dom: dict[str, Any]) -> dict[str, Any]:
    checks = {key: dom.get(key) == value for key, value in EXPECTED_DETAIL_VALIDATION.items()}
    return {"pass": all(checks.values()), "checks": checks}


def assert_preview_guard(dom: dict[str, Any]) -> dict[str, Any]:
    checks = {key: dom.get(key) == value for key, value in EXPECTED_PREVIEW_GUARD.items()}
    return {"pass": all(checks.values()), "checks": checks}


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
        await page.evaluate(seed_script())
        await page.goto(f"{base_url}/settings/account/delete")
        await asyncio.sleep(2)

        await click_button_containing_text(page, "기타")
        selected_dom = await collect_dom(page)
        capture_height = json.loads(await page.evaluate(capture_height_script()))["height"]
        screenshot_b64 = await page.screenshot()
        screenshot_path.write_bytes(base64.b64decode(screenshot_b64))
        crop_screenshot_to_height(screenshot_path, capture_height)

        await click_button_containing_text(page, "탈퇴하기")
        detail_validation_dom = await collect_dom(page)

        await click_button_containing_text(page, "원하는 정보를 찾기 어려워요")
        await click_button_containing_text(page, "탈퇴하기")
        preview_guard_dom = await collect_dom(page)

        selected_assertions = assert_selected_runtime(selected_dom)
        detail_validation_assertions = assert_detail_validation(detail_validation_dom)
        preview_guard_assertions = assert_preview_guard(preview_guard_dom)
        source_chain = evaluate_source_chain()
        exact_pass = all(
            [
                selected_assertions["pass"],
                detail_validation_assertions["pass"],
                preview_guard_assertions["pass"],
                source_chain["pass"],
            ]
        )

        payload = {
            "baseUrl": base_url,
            "serverMode": args.server_mode,
            "specPage": 67,
            "specPreview": str(ROOT / "sdd/01_planning/02_screen/guidelines/mobile/assets/page-067-surface-02.png"),
            "screenshot": str(screenshot_path),
            "captureHeight": capture_height,
            "selectedDom": selected_dom,
            "detailValidationDom": detail_validation_dom,
            "previewGuardDom": preview_guard_dom,
            "runtimeAssertions": {
                "selected": selected_assertions,
                "detailValidation": detail_validation_assertions,
                "previewGuard": preview_guard_assertions,
                "pass": selected_assertions["pass"] and detail_validation_assertions["pass"] and preview_guard_assertions["pass"],
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
    except Exception as exc:  # pragma: no cover
        print(json.dumps({"pass": False, "error": str(exc)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
