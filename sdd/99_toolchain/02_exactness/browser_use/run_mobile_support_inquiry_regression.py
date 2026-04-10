#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import base64
import json
import os
import re
import shutil
import signal
import sqlite3
import subprocess
import time
import uuid
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
TMP_DIR = ROOT / ".tmp" / "mobile_support_inquiry_regression"
DB_PATH = TMP_DIR / "support_inquiry_regression.db"
DATA_DIR = TMP_DIR / "data"

AUTH_TOKEN_STORAGE_KEY = "passv-in.auth.token"
AUTH_PREVIEW_STORAGE_KEY = "passv-in.auth.preview-user"
RUNTIME_ONBOARDING_STORAGE_KEY = "passv-in.runtime.onboarding"
RUNTIME_SESSION_STORAGE_KEY = "passv-in.runtime.session"

ONE_PIXEL_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9p+X8d8AAAAASUVORK5CYII="
)

EXPECTED = {
    "pathname": "/support/inquiry",
    "headerTitle": "1:1 문의",
    "tabCounts": {
        "전체문의": 2,
        "답변완료": 1,
        "답변대기": 1,
    },
    "resolvedSubject": "첨부 이미지 문의",
    "resolvedReply": "첨부 이미지를 확인했고 다음 배포에서 수정하겠습니다.",
    "pendingSubject": "답변 대기 문의",
    "pendingExcerpt": "등록 직후 대기 상태를 확인합니다.",
    "ctaLabel": "문의하기",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4304)
    parser.add_argument("--api-port", type=int, default=8001)
    parser.add_argument("--server-mode", choices=["dev", "preview"], default="dev")
    parser.add_argument("--keep-server", action="store_true")
    parser.add_argument(
        "--results-file",
        default=str(RESULTS_DIR / "mobile-support-inquiry-regression.json"),
    )
    parser.add_argument(
        "--screenshot-file",
        default=str(RESULTS_DIR / "mobile-support-inquiry-regression.png"),
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


def normalize_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def crop_screenshot_to_height(screenshot_path: Path, capture_height: int) -> None:
    with Image.open(screenshot_path) as image:
        bounded_height = max(1, min(image.height, capture_height))
        if bounded_height == image.height:
            return
        image.crop((0, 0, image.width, bounded_height)).save(screenshot_path)


def request_json(url: str, *, method: str = "GET", headers: dict[str, str] | None = None, payload: dict[str, Any] | None = None) -> dict[str, Any]:
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


def encode_multipart_formdata(fields: dict[str, str], files: list[tuple[str, str, bytes, str]]) -> tuple[bytes, str]:
    boundary = f"passv-boundary-{uuid.uuid4().hex}"
    chunks: list[bytes] = []

    for key, value in fields.items():
        chunks.extend(
            [
                f"--{boundary}\r\n".encode("utf-8"),
                f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8"),
                value.encode("utf-8"),
                b"\r\n",
            ]
        )

    for field_name, file_name, content, content_type in files:
        chunks.extend(
            [
                f"--{boundary}\r\n".encode("utf-8"),
                (
                    f'Content-Disposition: form-data; name="{field_name}"; filename="{file_name}"\r\n'
                    f"Content-Type: {content_type}\r\n\r\n"
                ).encode("utf-8"),
                content,
                b"\r\n",
            ]
        )

    chunks.append(f"--{boundary}--\r\n".encode("utf-8"))
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


def request_multipart(url: str, *, headers: dict[str, str] | None = None, fields: dict[str, str], files: list[tuple[str, str, bytes, str]]) -> dict[str, Any]:
    body, content_type = encode_multipart_formdata(fields, files)
    next_headers = dict(headers or {})
    next_headers["Content-Type"] = content_type
    next_headers["Content-Length"] = str(len(body))
    request = Request(url, data=body, headers=next_headers, method="POST")

    try:
        with urlopen(request, timeout=15) as response:  # noqa: S310
            raw = response.read()
            return json.loads(raw.decode("utf-8")) if raw else {}
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"POST {url} failed with {exc.code}: {detail}") from exc


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def register_user(api_base_url: str, email: str) -> dict[str, Any]:
    return request_json(
        f"{api_base_url}/auth/register",
        method="POST",
        payload={"email": email, "password": "TestPassword123!"},
    )


def login_user(api_base_url: str, email: str) -> dict[str, Any]:
    return request_json(
        f"{api_base_url}/auth/login",
        method="POST",
        payload={"email": email, "password": "TestPassword123!"},
    )


def promote_user_to_admin(email: str) -> None:
    deadline = time.time() + 10
    while time.time() < deadline:
        with sqlite3.connect(DB_PATH) as connection:
            cursor = connection.execute('UPDATE "user" SET role = ? WHERE email = ?', ("admin", email))
            connection.commit()
            if cursor.rowcount > 0:
                return
        time.sleep(0.2)
    raise RuntimeError(f"Unable to promote user to admin: {email}")


def create_inquiry(
    api_base_url: str,
    *,
    token: str,
    name: str,
    email: str,
    category: str,
    subject: str,
    content: str,
    phone: str | None = None,
    files: list[tuple[str, str, bytes, str]] | None = None,
) -> dict[str, Any]:
    if files:
        fields = {
            "name": name,
            "email": email,
            "category": category,
            "subject": subject,
            "content": content,
        }
        if phone:
            fields["phone"] = phone
        return request_multipart(
            f"{api_base_url}/support/inquiries",
            headers=auth_headers(token),
            fields=fields,
            files=files,
        )

    return request_json(
        f"{api_base_url}/support/inquiries",
        method="POST",
        headers=auth_headers(token),
        payload={
            "name": name,
            "email": email,
            "phone": phone,
            "category": category,
            "subject": subject,
            "content": content,
        },
    )


def reply_to_inquiry(api_base_url: str, *, token: str, inquiry_id: int, reply: str) -> dict[str, Any]:
    return request_json(
        f"{api_base_url}/support/inquiries/{inquiry_id}/reply",
        method="POST",
        headers=auth_headers(token),
        payload={"reply": reply},
    )


def seed_regression_data(api_base_url: str) -> dict[str, Any]:
    member_email = f"support-inquiry-member-{uuid.uuid4().hex[:8]}@test.com"
    admin_email = f"support-inquiry-admin-{uuid.uuid4().hex[:8]}@test.com"

    member_registration = register_user(api_base_url, member_email)
    register_user(api_base_url, admin_email)
    promote_user_to_admin(admin_email)
    admin_login = login_user(api_base_url, admin_email)

    pending_inquiry = create_inquiry(
        api_base_url,
        token=str(member_registration["access_token"]),
        name="문의 사용자",
        email=member_email,
        phone="010-1234-5678",
        category="account_login",
        subject=EXPECTED["pendingSubject"],
        content=EXPECTED["pendingExcerpt"],
    )

    resolved_inquiry = create_inquiry(
        api_base_url,
        token=str(member_registration["access_token"]),
        name="문의 사용자",
        email=member_email,
        phone="010-1234-5678",
        category="bug_report",
        subject=EXPECTED["resolvedSubject"],
        content="이미지와 함께 오류 화면을 전달합니다.",
        files=[("files", "evidence.png", ONE_PIXEL_PNG, "image/png")],
    )

    reply_to_inquiry(
        api_base_url,
        token=str(admin_login["access_token"]),
        inquiry_id=int(resolved_inquiry["id"]),
        reply=EXPECTED["resolvedReply"],
    )

    my_inquiries = request_json(
        f"{api_base_url}/support/inquiries/my",
        headers=auth_headers(str(member_registration["access_token"])),
    )

    return {
        "memberEmail": member_email,
        "memberToken": member_registration,
        "adminEmail": admin_email,
        "pendingInquiryId": pending_inquiry["id"],
        "resolvedInquiryId": resolved_inquiry["id"],
        "inquiries": my_inquiries.get("inquiries", []),
    }


def seed_script(auth_token: dict[str, Any]) -> str:
    runtime_user = {
        "id": "in-01012345678",
        "fullName": "문의 사용자",
        "phoneNumber": "010-1234-5678",
        "locale": "ko",
        "authMethod": "phone",
        "registeredAt": "2026-03-17T00:00:00.000Z",
        "preview": False,
    }

    return f"""() => {{
      localStorage.setItem("{AUTH_TOKEN_STORAGE_KEY}", JSON.stringify({json.dumps(auth_token, ensure_ascii=False)}));
      localStorage.removeItem("{AUTH_PREVIEW_STORAGE_KEY}");
      localStorage.setItem("{RUNTIME_ONBOARDING_STORAGE_KEY}", JSON.stringify(true));
      localStorage.setItem("{RUNTIME_SESSION_STORAGE_KEY}", JSON.stringify({json.dumps(runtime_user, ensure_ascii=False)}));
      return true;
    }}"""


def runtime_dom_script() -> str:
    return """() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      const cards = Array.from(document.querySelectorAll('article')).map((article) => {
        const paragraphs = Array.from(article.querySelectorAll('p')).map((node) => normalize(node.textContent)).filter(Boolean);
        return {
          status: normalize(article.querySelector('div')?.textContent),
          subject: normalize(article.querySelector('h2')?.textContent),
          meta: paragraphs[0] || null,
          excerpt: paragraphs[1] || null,
          reply: paragraphs.length > 2 ? paragraphs[paragraphs.length - 1] : null,
          attachmentPreviewSources: Array.from(article.querySelectorAll('img')).map((img) => img.getAttribute('src') || ''),
        };
      });

      return JSON.stringify({
        pathname: window.location.pathname,
        headerTitle: normalize(document.querySelector('h1')?.textContent),
        tabButtons: Array.from(document.querySelectorAll('button')).map((button) => normalize(button.textContent)).filter(Boolean),
        cards,
      });
    }"""


def evaluate_source_chain() -> dict[str, Any]:
    checks: list[tuple[str, Path, str]] = [
        ("main_renders_app", ROOT / "client/mobile/src/main.tsx", "<App />"),
        ("main_wraps_auth_provider", ROOT / "client/mobile/src/main.tsx", "<AuthProvider>"),
        ("main_wraps_runtime_provider", ROOT / "client/mobile/src/main.tsx", "<InRuntimeProvider>"),
        ("app_support_inquiry_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/support/inquiry" element={<SupportInquiryScreen />}'),
        ("app_support_inquiry_create_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/support/inquiry/new" element={<SupportInquiryCreateScreen />}'),
        ("app_support_inquiry_type_route", ROOT / "client/mobile/src/app/App.tsx", 'path="/support/inquiry/type" element={<SupportInquiryTypeScreen />}'),
        ("protected_route_runtime_access", ROOT / "client/mobile/src/auth/ProtectedRoute.tsx", "const runtimeAccess = hasFlowSession || Boolean(currentUser);"),
        ("inquiry_screen_fetches_api", ROOT / "client/mobile/src/mobile-app/SupportInquiryScreen.tsx", "fetchMySupportInquiries"),
        ("inquiry_screen_retry_button", ROOT / "client/mobile/src/mobile-app/SupportInquiryScreen.tsx", "다시 시도"),
        ("inquiry_screen_attachment_blob_fetch", ROOT / "client/mobile/src/mobile-app/SupportInquiryScreen.tsx", "fetchSupportInquiryAttachmentBlob"),
        ("support_api_inquiry_list", ROOT / "client/mobile/src/mobile-app/supportApi.ts", '"/support/inquiries/my"'),
        ("support_api_attachment_blob", ROOT / "client/mobile/src/mobile-app/supportApi.ts", "fetchSupportInquiryAttachmentBlob"),
        ("support_router_inquiry_list", ROOT / "server/contexts/support/contracts/router.py", '@router.get("/api/support/inquiries/my")'),
        ("support_router_attachment_download", ROOT / "server/contexts/support/contracts/router.py", '@router.get("/api/support/inquiries/{inquiry_id}/attachments/{attachment_id}")'),
        ("support_inquiry_api_test", ROOT / "server/tests/integration/test_support_inquiries_api.py", "test_create_inquiry_with_multipart_image_attachment_and_download"),
    ]

    results = []
    passed = True
    for key, path, needle in checks:
        text = path.read_text(encoding="utf-8")
        check_pass = needle in text
        passed = passed and check_pass
        results.append({"key": key, "path": str(path), "needle": needle, "pass": check_pass})

    return {"pass": passed, "checks": results}


def parse_tab_counts(labels: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for label in labels:
        match = re.match(r"^(.*)\s+(\d+)$", label)
        if match:
            counts[match.group(1)] = int(match.group(2))
    return counts


def find_card(dom: dict[str, Any], subject: str) -> dict[str, Any] | None:
    for card in dom.get("cards", []):
        if normalize_text(card.get("subject")) == subject:
            return card
    return None


def assert_default_state(dom: dict[str, Any]) -> dict[str, Any]:
    tab_counts = parse_tab_counts(dom.get("tabButtons", []))
    resolved_card = find_card(dom, EXPECTED["resolvedSubject"])
    pending_card = find_card(dom, EXPECTED["pendingSubject"])
    checks = {
        "pathname": dom.get("pathname") == EXPECTED["pathname"],
        "headerTitle": dom.get("headerTitle") == EXPECTED["headerTitle"],
        "allCount": tab_counts.get("전체문의") == EXPECTED["tabCounts"]["전체문의"],
        "doneCount": tab_counts.get("답변완료") == EXPECTED["tabCounts"]["답변완료"],
        "waitingCount": tab_counts.get("답변대기") == EXPECTED["tabCounts"]["답변대기"],
        "ctaLabel": EXPECTED["ctaLabel"] in dom.get("tabButtons", []),
        "resolvedCardPresent": resolved_card is not None,
        "resolvedStatus": resolved_card is not None and normalize_text(resolved_card.get("status")) == "답변완료",
        "resolvedReply": resolved_card is not None and normalize_text(resolved_card.get("reply")) == EXPECTED["resolvedReply"],
        "resolvedAttachmentPreview": resolved_card is not None
        and any(str(src).startswith("blob:") for src in resolved_card.get("attachmentPreviewSources", [])),
        "pendingCardPresent": pending_card is not None,
        "pendingStatus": pending_card is not None and normalize_text(pending_card.get("status")) == "답변대기",
        "pendingExcerpt": pending_card is not None and normalize_text(pending_card.get("excerpt")) == EXPECTED["pendingExcerpt"],
    }
    return {
        "pass": all(checks.values()),
        "checks": checks,
        "snapshot": {
            "tabCounts": tab_counts,
            "subjects": [normalize_text(card.get("subject")) for card in dom.get("cards", [])],
        },
    }


def assert_done_tab_state(dom: dict[str, Any]) -> dict[str, Any]:
    subjects = [normalize_text(card.get("subject")) for card in dom.get("cards", [])]
    checks = {
        "singleResolvedCard": subjects == [EXPECTED["resolvedSubject"]],
    }
    return {"pass": all(checks.values()), "checks": checks, "snapshot": {"subjects": subjects}}


def assert_waiting_tab_state(dom: dict[str, Any]) -> dict[str, Any]:
    subjects = [normalize_text(card.get("subject")) for card in dom.get("cards", [])]
    checks = {
        "singleWaitingCard": subjects == [EXPECTED["pendingSubject"]],
    }
    return {"pass": all(checks.values()), "checks": checks, "snapshot": {"subjects": subjects}}


async def wait_for_browser_condition(page: Any, script: str, timeout_seconds: int = 30) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        if await page.evaluate(script):
            return
        await asyncio.sleep(0.5)
    raise TimeoutError("Timed out waiting for browser condition")


async def click_button_starting_with_text(page: Any, text: str) -> None:
    clicked = await page.evaluate(
        f"""() => {{
          const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
          const target = Array.from(document.querySelectorAll('button')).find((button) => normalize(button.innerText || button.textContent).startsWith({json.dumps(text)}));
          if (!target) return false;
          target.click();
          return true;
        }}"""
    )
    if not clicked:
        raise RuntimeError(f"Unable to find button starting with text={text}")
    await asyncio.sleep(0.6)


async def collect_dom(page: Any) -> dict[str, Any]:
    return json.loads(await page.evaluate(runtime_dom_script()))


async def collect_dom_until(page: Any, validator: Any, timeout_seconds: int = 30) -> dict[str, Any]:
    deadline = time.time() + timeout_seconds
    last_dom: dict[str, Any] | None = None
    while time.time() < deadline:
        dom = await collect_dom(page)
        last_dom = dom
        if validator(dom):
            return dom
        await asyncio.sleep(0.5)
    raise TimeoutError(f"Timed out waiting for expected DOM state: {json.dumps(last_dom, ensure_ascii=False)}")


async def run_regression(args: argparse.Namespace) -> int:
    base_url = f"http://127.0.0.1:{args.port}"
    api_base_url = f"http://127.0.0.1:{args.api_port}/api"
    api_health_url = f"{api_base_url}/health"
    results_path = Path(args.results_file).resolve()
    screenshot_path = Path(args.screenshot_file).resolve()
    results_path.parent.mkdir(parents=True, exist_ok=True)
    screenshot_path.parent.mkdir(parents=True, exist_ok=True)

    if TMP_DIR.exists():
        shutil.rmtree(TMP_DIR)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    api_proc = start_api_server(args.api_port)
    mobile_proc = start_mobile_server(args.port, args.api_port, args.server_mode)
    browser = BrowserSession(
        executable_path="/usr/bin/google-chrome",
        headless=True,
        is_local=True,
        args=["--headless=new", "--no-sandbox", "--window-size=390,960"],
    )

    try:
        wait_for_http(api_health_url)
        seed_payload = seed_regression_data(api_base_url)
        wait_for_http(f"{base_url}/")

        await browser.start()
        page = await browser.new_page()
        await page.goto(f"{base_url}/")
        await asyncio.sleep(1)
        await page.evaluate(seed_script(seed_payload["memberToken"]))
        await page.goto(f"{base_url}/support/inquiry")
        await wait_for_browser_condition(
            page,
            """() => {
              const headerTitle = document.querySelector('h1')?.textContent?.includes('1:1 문의');
              const cardCount = document.querySelectorAll('article').length === 2;
              const hasBlobPreview = Boolean(document.querySelector('article img[src^="blob:"]'));
              return Boolean(headerTitle && cardCount && hasBlobPreview);
            }""",
        )
        default_dom = await collect_dom_until(
            page,
            lambda dom: dom.get("headerTitle") == EXPECTED["headerTitle"] and len(dom.get("cards", [])) == 2,
            timeout_seconds=10,
        )
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
                  const nodes = [
                    document.querySelector('header'),
                    ...Array.from(document.querySelectorAll('article')).slice(0, 2),
                    ...Array.from(document.querySelectorAll('button')).filter((button) => (button.textContent || '').includes('문의하기')).slice(0, 1),
                  ].filter(Boolean);
                  const bottom = nodes.reduce((maxBottom, node) => Math.max(maxBottom, Math.ceil(node.getBoundingClientRect().bottom)), 0);
                  return { height: Math.min(window.innerHeight, bottom + 24) };
                })())"""
            )
        )["height"]

        screenshot_b64 = await page.screenshot()
        screenshot_path.write_bytes(base64.b64decode(screenshot_b64))
        crop_screenshot_to_height(screenshot_path, capture_height)

        await click_button_starting_with_text(page, "답변완료")
        await wait_for_browser_condition(
            page,
            f"""() => {{
              const titles = Array.from(document.querySelectorAll('article h2')).map((node) => (node.textContent || '').replace(/\\s+/g, ' ').trim());
              return titles.length === 1 && titles[0] === {json.dumps(EXPECTED["resolvedSubject"])};
            }}""",
            timeout_seconds=10,
        )
        done_dom = await collect_dom_until(
            page,
            lambda dom: [normalize_text(card.get("subject")) for card in dom.get("cards", [])] == [EXPECTED["resolvedSubject"]],
            timeout_seconds=10,
        )

        await click_button_starting_with_text(page, "답변대기")
        await wait_for_browser_condition(
            page,
            f"""() => {{
              const titles = Array.from(document.querySelectorAll('article h2')).map((node) => (node.textContent || '').replace(/\\s+/g, ' ').trim());
              return titles.length === 1 && titles[0] === {json.dumps(EXPECTED["pendingSubject"])};
            }}""",
            timeout_seconds=10,
        )
        waiting_dom = await collect_dom_until(
            page,
            lambda dom: [normalize_text(card.get("subject")) for card in dom.get("cards", [])] == [EXPECTED["pendingSubject"]],
            timeout_seconds=10,
        )

        default_assertions = assert_default_state(default_dom)
        done_assertions = assert_done_tab_state(done_dom)
        waiting_assertions = assert_waiting_tab_state(waiting_dom)
        source_chain = evaluate_source_chain()
        exact_pass = all(
            [
                default_assertions["pass"],
                done_assertions["pass"],
                waiting_assertions["pass"],
                source_chain["pass"],
            ]
        )

        spec_preview_path = ROOT / "sdd/01_planning/02_screen/guidelines/mobile/assets/page-062-surface-02.png"
        payload = {
            "baseUrl": base_url,
            "apiBaseUrl": api_base_url,
            "apiHealthUrl": api_health_url,
            "serverMode": args.server_mode,
            "specPage": 62,
            "specPreview": str(spec_preview_path) if spec_preview_path.exists() else None,
            "seededData": seed_payload,
            "screenshot": str(screenshot_path),
            "browserViewport": viewport_info,
            "captureHeight": capture_height,
            "defaultDom": default_dom,
            "doneDom": done_dom,
            "waitingDom": waiting_dom,
            "runtimeAssertions": {
                "default": default_assertions,
                "done": done_assertions,
                "waiting": waiting_assertions,
                "pass": default_assertions["pass"] and done_assertions["pass"] and waiting_assertions["pass"],
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
