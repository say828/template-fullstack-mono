#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import base64
import json
import os
import shutil
import signal
import subprocess
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from PIL import Image

from browser_use import BrowserSession


ROOT = Path(__file__).resolve().parents[4]
CLIENT_MOBILE_DIR = ROOT / "client" / "mobile"
SERVER_DIR = ROOT / "server"
RESULTS_DIR = ROOT / "research" / "agent-browser" / "results"
TMP_DIR = ROOT / ".tmp" / "mobile_app_settings_regression"
DB_PATH = TMP_DIR / "app_settings_regression.db"
DATA_DIR = TMP_DIR / "data"

AUTH_TOKEN_STORAGE_KEY = "passv-in.auth.token"
AUTH_PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user"
RUNTIME_AUTH_BRIDGE_STORAGE_KEY = "passv-in.runtime.auth-bridge.v1"
RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding"
RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session"

EXPECTED_PREVIEW_DEFAULT = {
    "pathname": "/settings/app",
    "title": "앱설정",
    "sectionTitles": ["마케팅 정보 수신", "서비스 안내", "계정관리"],
    "toggleLabels": ["메일 수신 동의", "SMS 수신동의"],
    "togglePressed": [False, False],
    "toggleDisabled": [True, True],
    "policyLabels": ["이용약관", "개인정보처리방침", "위치기반 서비스 이용약관"],
    "versionLabel": "버전정보",
    "versionValue": "V6.0.0",
    "accountLabels": ["로그아웃", "회원 탈퇴"],
    "message": "실제 로그인 세션에서는 메일/SMS 수신 동의를 서버에 저장합니다.",
}

EXPECTED_AUTH_INITIAL = {
    "pathname": "/settings/app",
    "title": "앱설정",
    "toggleLabels": ["메일 수신 동의", "SMS 수신동의"],
    "togglePressed": [False, False],
    "toggleDisabled": [False, False],
    "message": None,
}

EXPECTED_AUTH_UPDATED = {
    "togglePressed": [True, True],
    "toggleDisabled": [False, False],
}

EXPECTED_DIALOG = {
    "title": "로그아웃 하시겠어요?",
    "description": "현재 기기에서 저장된 로그인 정보를 정리하고 로그인 화면으로 이동합니다.",
    "buttons": ["취소", "확인"],
}

EXPECTED_LOGIN = {
    "pathname": "/login",
    "buttons": ["휴대폰 번호로 시작하기", "구글로 시작하기"],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4305)
    parser.add_argument("--api-port", type=int, default=8002)
    parser.add_argument("--server-mode", choices=["dev", "preview"], default="dev")
    parser.add_argument("--keep-server", action="store_true")
    parser.add_argument(
        "--results-file",
        default=str(RESULTS_DIR / "mobile-app-settings-regression.json"),
    )
    parser.add_argument(
        "--screenshot-file",
        default=str(RESULTS_DIR / "mobile-app-settings-regression.png"),
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


def prepare_tmp_dir() -> None:
    if TMP_DIR.exists():
        shutil.rmtree(TMP_DIR)
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def start_mobile_server(port: int, api_port: int, mode: str) -> subprocess.Popen[str]:
    env = os.environ.copy()
    env["VITE_API_BASE_URL"] = "/api"
    env["VITE_DEV_API_ORIGIN"] = f"http://127.0.0.1:{api_port}"

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
    env["PYTHONPATH"] = str(ROOT)
    env["DATABASE_URL"] = f"sqlite:///{DB_PATH}"
    env["DATA_DIR"] = str(DATA_DIR)
    env["AUTO_CREATE_ADMIN_ON_INIT"] = "false"
    return subprocess.Popen(
        [str(SERVER_DIR / ".venv" / "bin" / "uvicorn"), "server.main:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=TMP_DIR,
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


def crop_screenshot_to_height(screenshot_path: Path, capture_height: int) -> None:
    with Image.open(screenshot_path) as image:
        bounded_height = max(1, min(image.height, capture_height))
        if bounded_height == image.height:
            return
        image.crop((0, 0, image.width, bounded_height)).save(screenshot_path)


def request_json(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    next_headers = dict(headers or {})
    data: bytes | None = None

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        next_headers.setdefault("Content-Type", "application/json")

    request = Request(url, data=data, headers=next_headers, method=method)

    try:
        with urlopen(request, timeout=15) as response:  # noqa: S310
            raw = response.read()
            return json.loads(raw.decode("utf-8")) if raw else {}
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {url} failed with {exc.code}: {detail}") from exc


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def get_user_settings(api_base_url: str, *, token: str) -> dict[str, Any]:
    return request_json(
        f"{api_base_url}/users/settings",
        headers=auth_headers(token),
    )


def preview_seed_script() -> str:
    preview_user = {
        "id": "preview-app-settings-regression",
        "email": "app-settings-regression@passview.preview",
        "role": "member",
        "nickname": "모바일 설정 검수 사용자",
        "phone": "010-1234-5678",
        "subscription_status": None,
        "seller_status": None,
    }
    runtime_user = {
        "id": "in-01012345678",
        "fullName": "모바일 설정 검수 사용자",
        "phoneNumber": "010-1234-5678",
        "locale": "ko",
        "authMethod": "phone",
        "registeredAt": "2026-03-17T00:00:00.000Z",
        "preview": True,
    }
    return f"""() => {{
      localStorage.clear();
      localStorage.setItem("{AUTH_PREVIEW_STORAGE_KEY}", JSON.stringify({json.dumps(preview_user, ensure_ascii=False)}));
      localStorage.setItem("{RUNTIME_SESSION_STORAGE_KEY}", JSON.stringify({json.dumps(runtime_user, ensure_ascii=False)}));
      localStorage.setItem("{RUNTIME_ONBOARDING_STORAGE_KEY}", JSON.stringify(true));
      return true;
    }}"""


def runtime_session_seed_script() -> str:
    runtime_user = {
        "id": "in-01012345678",
        "fullName": "모바일 설정 검수 사용자",
        "phoneNumber": "010-1234-5678",
        "locale": "ko",
        "authMethod": "phone",
        "registeredAt": "2026-03-17T00:00:00.000Z",
        "preview": True,
    }
    return f"""() => {{
      localStorage.clear();
      localStorage.setItem("{RUNTIME_SESSION_STORAGE_KEY}", JSON.stringify({json.dumps(runtime_user, ensure_ascii=False)}));
      localStorage.setItem("{RUNTIME_ONBOARDING_STORAGE_KEY}", JSON.stringify(true));
      return true;
    }}"""


def read_auth_token_script() -> str:
    return f"""() => {{
      const raw = localStorage.getItem("{AUTH_TOKEN_STORAGE_KEY}");
      if (!raw) return JSON.stringify(null);
      try {{
        return JSON.stringify(JSON.parse(raw));
      }} catch {{
        return JSON.stringify(null);
      }}
    }}"""


def read_runtime_auth_bridge_script() -> str:
    return f"""() => {{
      const raw = localStorage.getItem("{RUNTIME_AUTH_BRIDGE_STORAGE_KEY}");
      if (!raw) return JSON.stringify(null);
      try {{
        return JSON.stringify(JSON.parse(raw));
      }} catch {{
        return JSON.stringify(null);
      }}
    }}"""


def default_dom_script() -> str:
    return """() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      const sectionTitles = Array.from(document.querySelectorAll('section > p:first-child'))
        .map((node) => normalize(node.textContent))
        .filter(Boolean);
      const toggleRows = Array.from(document.querySelectorAll('button[aria-pressed]')).map((button) => {
        const row = button.parentElement;
        const labelNode = row?.querySelector('span, p');
        return {
          label: normalize(labelNode?.textContent),
          pressed: button.getAttribute('aria-pressed') === 'true',
          disabled: Boolean(button.disabled),
        };
      });
      const links = Array.from(document.querySelectorAll('a')).map((node) => normalize(node.textContent)).filter(Boolean);
      const buttons = Array.from(document.querySelectorAll('button'))
        .map((node) => normalize(node.textContent))
        .filter(Boolean);
      const versionRow = Array.from(document.querySelectorAll('div.flex.items-center.justify-between.py-3')).find((row) =>
        normalize(row.querySelector('span:first-child')?.textContent) === '버전정보'
      );
      const messageNodes = Array.from(document.querySelectorAll('p'))
        .map((node) => normalize(node.textContent))
        .filter(Boolean);

      return JSON.stringify({
        pathname: window.location.pathname,
        title: normalize(document.querySelector('h1')?.textContent),
        sectionTitles,
        toggleLabels: toggleRows.map((row) => row.label),
        togglePressed: toggleRows.map((row) => row.pressed),
        toggleDisabled: toggleRows.map((row) => row.disabled),
        policyLabels: links.filter((label) => ['이용약관', '개인정보처리방침', '위치기반 서비스 이용약관'].includes(label)),
        versionLabel: normalize(versionRow?.querySelector('span:first-child')?.textContent),
        versionValue: normalize(versionRow?.querySelector('span:last-child')?.textContent),
        accountLabels: buttons.filter((label) => ['로그아웃'].includes(label)).concat(links.filter((label) => ['회원 탈퇴'].includes(label))),
        message: messageNodes.find((value) =>
          value.includes('실제 로그인 세션에서는')
          || value.includes('실제 로그인 세션을 준비하는 중입니다.')
          || value.includes('실제 로그인 세션을 준비하지 못했습니다.')
          || value.includes('앱 설정을 불러오지 못했습니다.')
        ) || null,
      });
    }"""


def dialog_dom_script() -> str:
    return """() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) {
        return JSON.stringify({ open: false });
      }

      return JSON.stringify({
        open: true,
        title: normalize(dialog.querySelector('h2')?.textContent),
        description: normalize(dialog.querySelector('p')?.innerText || dialog.querySelector('p')?.textContent),
        buttons: Array.from(dialog.querySelectorAll('button')).map((node) => normalize(node.textContent)).filter(Boolean),
      });
    }"""


def login_dom_script() -> str:
    return """() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      return JSON.stringify({
        pathname: window.location.pathname,
        buttons: Array.from(document.querySelectorAll('button')).map((node) => normalize(node.textContent)).filter(Boolean),
      });
    }"""


def capture_height_script() -> str:
    return """() => JSON.stringify((() => {
      const nodes = Array.from(document.querySelectorAll('header, section, p, button')).filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      const contentBottom = nodes.reduce((maxBottom, node) => Math.max(maxBottom, Math.ceil(node.getBoundingClientRect().bottom)), 0);
      return { height: Math.min(window.innerHeight, contentBottom + 24) };
    })())"""


def evaluate_source_chain() -> dict[str, Any]:
    checks: list[tuple[str, Path, str]] = [
        ("main_renders_app", ROOT / "client/mobile/src/main.tsx", "<App />"),
        ("main_wraps_auth_provider", ROOT / "client/mobile/src/main.tsx", "<AuthProvider>"),
        ("main_wraps_runtime_provider", ROOT / "client/mobile/src/main.tsx", "<InRuntimeProvider>"),
        ("app_settings_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/settings/app" element={<AppSettingsScreen />}'),
        ("profile_links_settings", ROOT / "client/mobile/src/mobile-app/ProfileScreen.tsx", 'label: "앱 설정", to: "/settings/app"'),
        ("protected_route_runtime_access", ROOT / "client/mobile/src/auth/ProtectedRoute.tsx", "const runtimeAccess = hasFlowSession || Boolean(currentUser);"),
        ("runtime_auth_bridge_helper", ROOT / "client/mobile/src/mobile-auth/runtimeAuthBridge.ts", "export function ensureRuntimeAuthBridge"),
        ("runtime_provider_uses_auth_bridge", ROOT / "client/mobile/src/mobile-auth/InRuntimeProvider.tsx", "ensureRuntimeAuthBridge(runtimeUser);"),
        ("runtime_provider_retries_auth_bridge", ROOT / "client/mobile/src/mobile-auth/InRuntimeProvider.tsx", "retryAuthProvisioning()"),
        ("runtime_provider_recovers_register_race", ROOT / "client/mobile/src/mobile-auth/InRuntimeProvider.tsx", "for (const retryDelay of [200, 500, 1_000])"),
        ("shared_settings_switch_component", ROOT / "client/mobile/src/components/common/SettingsSwitch.tsx", "export function SettingsSwitch"),
        ("app_settings_uses_shared_switch", ROOT / "client/mobile/src/mobile-app/AppSettingsScreen.tsx", "<SettingsSwitch"),
        ("notifications_uses_shared_switch", ROOT / "client/mobile/src/mobile-app/NotificationsSettingsScreen.tsx", "<SettingsSwitch"),
        ("emergency_uses_shared_switch", ROOT / "client/mobile/src/mobile-app/EmergencySettingsScreen.tsx", "<SettingsSwitch"),
        ("interpretation_uses_shared_switch", ROOT / "client/mobile/src/mobile-app/InterpretationSettingsScreen.tsx", "<SettingsSwitch"),
        ("notifications_time_uses_shared_switch", ROOT / "client/mobile/src/mobile-app/NotificationsTimeSettingsScreen.tsx", "<SettingsSwitch"),
        ("settings_uses_get_settings", ROOT / "client/mobile/src/mobile-app/AppSettingsScreen.tsx", "await getSettings(currentAccessToken);"),
        ("settings_uses_update_settings", ROOT / "client/mobile/src/mobile-app/AppSettingsScreen.tsx", "const saved = await updateSettings(accessToken, {"),
        ("settings_has_retry", ROOT / "client/mobile/src/mobile-app/AppSettingsScreen.tsx", "다시 시도"),
        ("settings_has_provision_message", ROOT / "client/mobile/src/mobile-app/AppSettingsScreen.tsx", "실제 로그인 세션을 준비하는 중입니다."),
        ("settings_has_provision_retry", ROOT / "client/mobile/src/mobile-app/AppSettingsScreen.tsx", "로그인 세션 다시 준비"),
        ("settings_has_logout_dialog", ROOT / "client/mobile/src/mobile-app/AppSettingsScreen.tsx", "로그아웃 하시겠어요?"),
        ("settings_links_account_delete", ROOT / "client/mobile/src/mobile-app/AppSettingsScreen.tsx", 'to="/settings/account/delete"'),
        ("settings_links_terms", ROOT / "client/mobile/src/mobile-app/AppSettingsScreen.tsx", 'to="/policy/terms?type=terms&from=settings"'),
        ("user_settings_router_get", ROOT / "server/contexts/user/contracts/router.py", '@router.get("/api/users/settings")'),
        ("user_settings_router_put", ROOT / "server/contexts/user/contracts/router.py", '@router.put("/api/users/settings")'),
        ("user_settings_integration_test", ROOT / "server/tests/integration/test_auth_api.py", '"/api/users/settings"'),
    ]

    results = []
    passed = True
    for key, path, needle in checks:
        text = path.read_text(encoding="utf-8")
        check_pass = needle in text
        passed = passed and check_pass
        results.append({"key": key, "path": str(path), "needle": needle, "pass": check_pass})

    return {"pass": passed, "checks": results}


def assert_expected_subset(dom: dict[str, Any], expected: dict[str, Any]) -> dict[str, Any]:
    checks = {key: dom.get(key) == value for key, value in expected.items()}
    return {"pass": all(checks.values()), "checks": checks}


def assert_dialog_state(dom: dict[str, Any]) -> dict[str, Any]:
    checks = {
        "open": dom.get("open") is True,
        "title": dom.get("title") == EXPECTED_DIALOG["title"],
        "description": dom.get("description") == EXPECTED_DIALOG["description"],
        "buttons": dom.get("buttons") == EXPECTED_DIALOG["buttons"],
    }
    return {"pass": all(checks.values()), "checks": checks}


def assert_login_state(dom: dict[str, Any]) -> dict[str, Any]:
    checks = {
        "pathname": dom.get("pathname") == EXPECTED_LOGIN["pathname"],
        "buttons": dom.get("buttons") == EXPECTED_LOGIN["buttons"],
    }
    return {"pass": all(checks.values()), "checks": checks}


def assert_api_settings(settings_payload: dict[str, Any], *, email: bool, sms: bool) -> dict[str, Any]:
    checks = {
        "marketing_email_agreed": settings_payload.get("marketing_email_agreed") is email,
        "marketing_sms_agreed": settings_payload.get("marketing_sms_agreed") is sms,
        "marketing_agreed": settings_payload.get("marketing_agreed") is (email or sms),
    }
    return {"pass": all(checks.values()), "checks": checks}


async def collect_json(page: Any, script: str) -> dict[str, Any]:
    return json.loads(await page.evaluate(script))


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
        raise RuntimeError(f"Unable to find button with text={text}")
    await asyncio.sleep(0.4)


async def click_toggle(page: Any, label: str) -> None:
    clicked = await page.evaluate(
        f"""() => {{
          const target = document.querySelector(`button[aria-label={json.dumps(label)}]`);
          if (!target) return false;
          target.click();
          return true;
        }}"""
    )
    if not clicked:
        raise RuntimeError(f"Unable to find toggle with aria-label={label}")
    await asyncio.sleep(0.4)


async def wait_for_runtime_auth_token(page: Any, timeout_seconds: int = 20) -> dict[str, Any]:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        token_payload = json.loads(await page.evaluate(read_auth_token_script()))
        if token_payload and token_payload.get("access_token"):
            return token_payload
        await asyncio.sleep(0.3)
    raise TimeoutError("Timed out waiting for runtime auth token provisioning")


def wait_for_settings(api_base_url: str, *, token: str, marketing_email_agreed: bool, marketing_sms_agreed: bool, timeout_seconds: int = 20) -> dict[str, Any]:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        payload = get_user_settings(api_base_url, token=token)
        if (
            payload.get("marketing_email_agreed") is marketing_email_agreed
            and payload.get("marketing_sms_agreed") is marketing_sms_agreed
        ):
            return payload
        time.sleep(0.3)
    raise TimeoutError("Timed out waiting for settings persistence")


async def run_regression(args: argparse.Namespace) -> int:
    base_url = f"http://127.0.0.1:{args.port}"
    api_base_url = f"http://127.0.0.1:{args.api_port}/api"
    results_path = Path(args.results_file).resolve()
    screenshot_path = Path(args.screenshot_file).resolve()
    results_path.parent.mkdir(parents=True, exist_ok=True)
    screenshot_path.parent.mkdir(parents=True, exist_ok=True)

    prepare_tmp_dir()

    api_proc = start_api_server(args.api_port)
    server_proc: subprocess.Popen[str] | None = None
    browser = BrowserSession(
        executable_path="/usr/bin/google-chrome",
        headless=True,
        is_local=True,
        args=["--headless=new", "--no-sandbox", "--window-size=390,960"],
    )

    try:
        wait_for_http(f"{api_base_url}/health")
        server_proc = start_mobile_server(args.port, args.api_port, args.server_mode)
        wait_for_http(f"{base_url}/")

        await browser.start()
        page = await browser.new_page()
        await page.goto(f"{base_url}/")
        await asyncio.sleep(1)

        await page.evaluate(preview_seed_script())
        await page.goto(f"{base_url}/settings/app")
        await asyncio.sleep(1.5)
        preview_dom = await collect_json(page, default_dom_script())

        await page.evaluate(runtime_session_seed_script())
        await page.goto(f"{base_url}/home")
        await asyncio.sleep(0.2)
        await page.goto(f"{base_url}/settings/app")
        runtime_auth_token = await wait_for_runtime_auth_token(page)
        await asyncio.sleep(1)
        auth_default_dom = await collect_json(page, default_dom_script())
        runtime_auth_bridge = json.loads(await page.evaluate(read_runtime_auth_bridge_script()))
        api_settings_before = get_user_settings(api_base_url, token=str(runtime_auth_token["access_token"]))

        await click_toggle(page, "메일 수신 동의")
        api_settings_after_email = wait_for_settings(
            api_base_url,
            token=str(runtime_auth_token["access_token"]),
            marketing_email_agreed=True,
            marketing_sms_agreed=False,
        )
        auth_after_email_dom = await collect_json(page, default_dom_script())

        await click_toggle(page, "SMS 수신동의")
        api_settings_after_both = wait_for_settings(
            api_base_url,
            token=str(runtime_auth_token["access_token"]),
            marketing_email_agreed=True,
            marketing_sms_agreed=True,
        )
        auth_after_both_dom = await collect_json(page, default_dom_script())

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

        await click_button_containing_text(page, "로그아웃")
        dialog_dom = await collect_json(page, dialog_dom_script())

        await click_button_containing_text(page, "취소")
        after_cancel_dom = await collect_json(page, default_dom_script())
        dialog_after_cancel = await collect_json(page, dialog_dom_script())

        await click_button_containing_text(page, "로그아웃")
        await click_button_containing_text(page, "확인")
        await asyncio.sleep(1)
        login_dom = await collect_json(page, login_dom_script())

        preview_assertions = assert_expected_subset(preview_dom, EXPECTED_PREVIEW_DEFAULT)
        auth_default_assertions = assert_expected_subset(auth_default_dom, EXPECTED_AUTH_INITIAL)
        runtime_auth_bridge_assertions = {
            "pass": bool(runtime_auth_token.get("access_token")) and isinstance(runtime_auth_bridge, dict) and len(runtime_auth_bridge) >= 1,
            "checks": {
                "authTokenPresent": bool(runtime_auth_token.get("access_token")),
                "bridgeStored": isinstance(runtime_auth_bridge, dict),
                "bridgeEntryCount": isinstance(runtime_auth_bridge, dict) and len(runtime_auth_bridge) >= 1,
            },
        }
        auth_after_email_assertions = {
            "pass": auth_after_email_dom.get("togglePressed") == [True, False] and auth_after_email_dom.get("toggleDisabled") == [False, False],
            "checks": {
                "togglePressed": auth_after_email_dom.get("togglePressed") == [True, False],
                "toggleDisabled": auth_after_email_dom.get("toggleDisabled") == [False, False],
            },
        }
        auth_after_both_assertions = assert_expected_subset(auth_after_both_dom, EXPECTED_AUTH_UPDATED)
        api_before_assertions = assert_api_settings(api_settings_before, email=False, sms=False)
        api_after_email_assertions = assert_api_settings(api_settings_after_email, email=True, sms=False)
        api_after_both_assertions = assert_api_settings(api_settings_after_both, email=True, sms=True)
        dialog_assertions = assert_dialog_state(dialog_dom)
        after_cancel_assertions = {
            "pass": after_cancel_dom.get("pathname") == EXPECTED_AUTH_INITIAL["pathname"] and dialog_after_cancel.get("open") is False,
            "checks": {
                "pathname": after_cancel_dom.get("pathname") == EXPECTED_AUTH_INITIAL["pathname"],
                "dialogClosed": dialog_after_cancel.get("open") is False,
            },
        }
        login_assertions = assert_login_state(login_dom)
        source_chain = evaluate_source_chain()
        exact_pass = all(
            [
                preview_assertions["pass"],
                auth_default_assertions["pass"],
                runtime_auth_bridge_assertions["pass"],
                auth_after_email_assertions["pass"],
                auth_after_both_assertions["pass"],
                api_before_assertions["pass"],
                api_after_email_assertions["pass"],
                api_after_both_assertions["pass"],
                dialog_assertions["pass"],
                after_cancel_assertions["pass"],
                login_assertions["pass"],
                source_chain["pass"],
            ]
        )

        payload = {
            "baseUrl": base_url,
            "apiBaseUrl": api_base_url,
            "serverMode": args.server_mode,
            "specPage": 65,
            "specPreview": str(ROOT / "sdd/01_planning/02_screen/mobile_screen_spec.pdf"),
            "runtimeAuthToken": {"tokenType": runtime_auth_token.get("token_type", "bearer")},
            "runtimeAuthBridge": runtime_auth_bridge,
            "screenshot": str(screenshot_path),
            "browserViewport": viewport_info,
            "captureHeight": capture_height,
            "previewDom": preview_dom,
            "authDefaultDom": auth_default_dom,
            "authAfterEmailDom": auth_after_email_dom,
            "authAfterBothDom": auth_after_both_dom,
            "apiSettingsBefore": api_settings_before,
            "apiSettingsAfterEmail": api_settings_after_email,
            "apiSettingsAfterBoth": api_settings_after_both,
            "dialogDom": dialog_dom,
            "afterCancelDom": after_cancel_dom,
            "dialogAfterCancel": dialog_after_cancel,
            "loginDom": login_dom,
            "runtimeAssertions": {
                "preview": preview_assertions,
                "authDefault": auth_default_assertions,
                "runtimeAuthBridge": runtime_auth_bridge_assertions,
                "authAfterEmail": auth_after_email_assertions,
                "authAfterBoth": auth_after_both_assertions,
                "dialog": dialog_assertions,
                "afterCancel": after_cancel_assertions,
                "login": login_assertions,
                "pass": all(
                    [
                        preview_assertions["pass"],
                        auth_default_assertions["pass"],
                        runtime_auth_bridge_assertions["pass"],
                        auth_after_email_assertions["pass"],
                        auth_after_both_assertions["pass"],
                        dialog_assertions["pass"],
                        after_cancel_assertions["pass"],
                        login_assertions["pass"],
                    ]
                ),
            },
            "apiAssertions": {
                "before": api_before_assertions,
                "afterEmail": api_after_email_assertions,
                "afterBoth": api_after_both_assertions,
                "pass": all(
                    [
                        api_before_assertions["pass"],
                        api_after_email_assertions["pass"],
                        api_after_both_assertions["pass"],
                    ]
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
            stop_process(server_proc)
            stop_process(api_proc)


def main() -> int:
    args = parse_args()
    try:
        return asyncio.run(run_regression(args))
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
