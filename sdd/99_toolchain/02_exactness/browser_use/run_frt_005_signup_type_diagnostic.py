#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import base64
import json
import time
from pathlib import Path
from urllib.request import urlopen

from browser_use import BrowserSession


ROOT = Path(__file__).resolve().parents[4]
RESULTS_DIR = ROOT / "sdd" / "99_toolchain" / "02_exactness" / "results"

EXPECTED = {
    "pathname": "/signup",
    "headerLinks": ["로그인", "회원가입"],
    "brand": "Template",
    "tagline": "글로벌 중고차 경매 플랫폼",
    "title": "회원가입 유형 선택",
    "subtitle": "Template를 어떤 역할로 이용하실 건가요?",
    "cards": [
        {
            "kind": "seller",
            "title": "판매자로 가입하기",
            "description": "내 차량을 등록하고 국내·해외 딜러의 입찰을 받을 수 있습니다.",
            "points": ["차량번호 자동 조회", "입찰가 비교 / 감가 협의 / 정산 지원", "검차+수출 연동 서비스 제공"],
            "cta": "판매자로 가입하기",
            "note": None,
        },
        {
            "kind": "dealer",
            "title": "딜러로 가입하기",
            "description": "전 세계 매물에 실시간으로 입찰하고 거래할 수 있습니다.",
            "points": ["국내·국제 매물 입찰 가능", "감가 입력 / 수출 프로세스 관리", "해외송금 / 서류 지원"],
            "cta": "딜러로 가입하기",
            "note": "딜러 계정은 관리자 승인 후 활성화됩니다.",
        },
    ],
    "loginPrompt": "이미 계정이 있으신가요?",
    "loginLink": "로그인하기",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:3003")
    parser.add_argument(
        "--results-file",
        default=str(RESULTS_DIR / "frt-005-signup-type-browser-use.json"),
    )
    parser.add_argument(
        "--screenshot-file",
        default=str(RESULTS_DIR / "frt-005-signup-type-browser-use.png"),
    )
    return parser.parse_args()


def wait_for_http(url: str, timeout_seconds: int = 30) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with urlopen(url, timeout=3) as response:  # noqa: S310
                if response.status < 500:
                    return
        except Exception:
            time.sleep(1)
    raise TimeoutError(f"Timed out waiting for {url}")


def runtime_dom_script() -> str:
    return """() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();
      const cards = Array.from(document.querySelectorAll('article[data-signup-type]')).map((node) => {
        const rect = node.getBoundingClientRect();
        const links = Array.from(node.querySelectorAll('a')).map((link) => normalize(link.textContent)).filter(Boolean);
        const points = Array.from(node.querySelectorAll('li span')).map((item) => normalize(item.textContent)).filter(Boolean);
        const paragraphs = Array.from(node.querySelectorAll('p')).map((item) => normalize(item.textContent)).filter(Boolean);
        return {
          kind: node.getAttribute('data-signup-type'),
          title: normalize(node.querySelector('h2')?.textContent),
          description: paragraphs[0] || null,
          points,
          note: paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] : null,
          cta: links[links.length - 1] || null,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        };
      });

      const headerLinks = Array.from(document.querySelectorAll('header a')).map((node) => normalize(node.textContent)).filter(Boolean);
      const footerLinks = Array.from(document.querySelectorAll('main > div > p:last-of-type, main > div > div:last-of-type a')).map((node) => normalize(node.textContent)).filter(Boolean);

      return JSON.stringify({
        pathname: window.location.pathname,
        headerLinks,
        brand: normalize(document.querySelector('main > div > p:first-of-type')?.textContent),
        tagline: normalize(document.querySelector('main > div > p:nth-of-type(2)')?.textContent),
        title: normalize(document.querySelector('h1')?.textContent),
        subtitle: normalize(document.querySelector('h1 + p')?.textContent),
        cards,
        loginPrompt: normalize(document.querySelector('main > div > div:last-of-type')?.textContent),
        footerLinks,
      });
    }"""


def evaluate_dom(dom: dict) -> dict:
    cards = dom.get("cards", [])
    cards_by_kind = {item.get("kind"): item for item in cards}
    card_order = [item["kind"] for item in EXPECTED["cards"]]
    expected_cards = {item["kind"]: item for item in EXPECTED["cards"]}
    row_alignment = len(cards) == 2 and abs(cards[0]["y"] - cards[1]["y"]) <= 8
    width_alignment = len(cards) == 2 and abs(cards[0]["width"] - cards[1]["width"]) <= 24
    gap = None
    if len(cards) == 2:
        gap = cards[1]["x"] - (cards[0]["x"] + cards[0]["width"])
    centered_gap = gap is not None and 12 <= gap <= 48

    checks = {
        "pathname": dom.get("pathname") == EXPECTED["pathname"],
        "headerLinks": dom.get("headerLinks", [None, None])[-2:] == EXPECTED["headerLinks"],
        "brand": dom.get("brand") == EXPECTED["brand"],
        "tagline": dom.get("tagline") == EXPECTED["tagline"],
        "title": dom.get("title") == EXPECTED["title"],
        "subtitle": dom.get("subtitle") == EXPECTED["subtitle"],
        "cardCount": len(cards) == 2,
        "cardOrder": list(cards_by_kind.keys()) == card_order,
        "cardContent": all(
            cards_by_kind.get(kind, {}).get("title") == expected_cards[kind]["title"]
            and cards_by_kind.get(kind, {}).get("description") == expected_cards[kind]["description"]
            and cards_by_kind.get(kind, {}).get("points") == expected_cards[kind]["points"]
            and cards_by_kind.get(kind, {}).get("cta") == expected_cards[kind]["cta"]
            and (
                cards_by_kind.get(kind, {}).get("note") == expected_cards[kind]["note"]
                if expected_cards[kind]["note"]
                else True
            )
            for kind in card_order
        ),
        "rowAlignment": row_alignment,
        "widthAlignment": width_alignment,
        "gapAlignment": centered_gap,
        "loginPrompt": EXPECTED["loginPrompt"] in (dom.get("loginPrompt") or ""),
        "loginLink": EXPECTED["loginLink"] in (dom.get("loginPrompt") or ""),
    }
    return {"pass": all(checks.values()), "checks": checks, "gap": gap}


async def run_diagnostic(args: argparse.Namespace) -> int:
    base_url = args.base_url.rstrip("/")
    wait_for_http(f"{base_url}/signup")

    results_path = Path(args.results_file).resolve()
    screenshot_path = Path(args.screenshot_file).resolve()
    results_path.parent.mkdir(parents=True, exist_ok=True)
    screenshot_path.parent.mkdir(parents=True, exist_ok=True)

    browser = BrowserSession(
        executable_path="/usr/bin/google-chrome",
        headless=True,
        is_local=True,
        args=["--headless=new", "--no-sandbox", "--window-size=1440,1100"],
    )

    try:
        await browser.start()
        page = await browser.new_page()
        await page.goto(f"{base_url}/signup")
        await asyncio.sleep(2)

        dom = json.loads(await page.evaluate(runtime_dom_script()))
        screenshot_b64 = await page.screenshot()
        screenshot_path.write_bytes(base64.b64decode(screenshot_b64))

        evaluation = evaluate_dom(dom)
        payload = {
            "baseUrl": base_url,
            "route": "/signup",
            "specScreen": "FRT_005",
            "specPreview": str(ROOT / "sdd/01_planning/02_screen/guidelines/assets/seller/page-006-surface-01.png"),
            "dom": dom,
            "evaluation": evaluation,
            "screenshot": str(screenshot_path),
            "pass": evaluation["pass"],
        }
        results_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(payload, ensure_ascii=False))
        return 0 if payload["pass"] else 2
    finally:
        await browser.stop()


def main() -> int:
    args = parse_args()
    return asyncio.run(run_diagnostic(args))


if __name__ == "__main__":
    raise SystemExit(main())
