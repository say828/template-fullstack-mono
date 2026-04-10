#!/usr/bin/env python3
"""Generate feature-level quality results for template DEV E2E gate."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import random
import re
import sys
import time
from typing import Any
from urllib import error, request

FEATURE_HEADING_RE = re.compile(r"^###\s+([A-Za-z]{2,5}[-_]?\d{1,4})\b", re.MULTILINE)
FEATURE_TOKEN_RE = re.compile(r"\b([A-Za-z]{2,5})[-_]?(\d{1,4})\b")


def normalize_feature_code(token: str) -> str:
    raw = str(token or "").strip().upper()
    match = FEATURE_TOKEN_RE.fullmatch(raw)
    if not match:
        return ""
    return f"{match.group(1)}_{int(match.group(2))}"


def read_text(path: Path) -> str:
    for enc in ("utf-8", "utf-8-sig", "cp949", "euc-kr"):
        try:
            return path.read_text(encoding=enc)
        except Exception:
            continue
    return ""


def collect_feature_codes(spec_target_dir: Path) -> list[str]:
    out: set[str] = set()
    for path in sorted(spec_target_dir.rglob("*.md")):
        text = read_text(path)
        if not text:
            continue
        if text.lstrip().startswith("# Source Artifact Conversion"):
            continue
        for match in FEATURE_HEADING_RE.finditer(text):
            code = normalize_feature_code(match.group(1))
            if code:
                out.add(code)
    return sorted(out)


def http_json(
    method: str,
    url: str,
    *,
    body: dict[str, Any] | None = None,
    token: str = "",
    timeout: int = 30,
) -> tuple[int, str]:
    payload = None
    headers = {"Content-Type": "application/json"}
    if body is not None:
        payload = json.dumps(body).encode("utf-8")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = request.Request(url=url, data=payload, method=method.upper(), headers=headers)
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="ignore")
            return int(resp.getcode()), raw
    except error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="ignore")
        return int(exc.code), raw
    except Exception as exc:
        return 0, str(exc)


def parse_json(text: str) -> Any:
    try:
        return json.loads(text)
    except Exception:
        return {}


def check_case(
    cases: list[dict[str, Any]],
    *,
    category: str,
    name: str,
    status: int,
    allowed: set[int] | None = None,
    status_range: tuple[int, int] | None = None,
    detail: str = "",
) -> bool:
    if allowed is not None:
        passed = status in allowed
        expect = f"in={sorted(allowed)}"
    elif status_range is not None:
        lo, hi = status_range
        passed = lo <= status < hi
        expect = f"range=[{lo},{hi})"
    else:
        passed = status >= 200 and status < 300
        expect = "2xx"
    cases.append(
        {
            "category": category,
            "name": name,
            "status": status,
            "expect": expect,
            "passed": passed,
            "detail": detail[:500],
        }
    )
    return passed


def short_id() -> int:
    return int(time.time() * 1000) + random.randint(10, 999)


def build_vehicle_payload(run_id: int, *, hours: int, suffix: str) -> dict[str, Any]:
    plate_head = (run_id % 80) + 10
    plate_tail = (run_id % 8000) + 1000
    return {
        "title": f"QA 차량 {suffix} {run_id}",
        "make": "Hyundai",
        "model": "Sonata",
        "year": 2022,
        "mileage_km": 12000,
        "license_plate": f"{plate_head}가{plate_tail}",
        "fuel_type": "GASOLINE",
        "transaction_type": "DOMESTIC",
        "reserve_price": 1000000,
        "min_bid_increment": 100000,
        "bidding_hours": hours,
        "currency": "KRW",
    }


def run_quality(
    *,
    api_base_url: str,
    health_url: str,
    seed_evidence_path: Path,
    categories: list[str],
) -> dict[str, Any]:
    run_id = short_id()
    cases: list[dict[str, Any]] = []
    category_status = {x: True for x in categories}

    # Functional: seed evidence 존재 + health + 기본 공개 API
    functional_ok = True
    if not seed_evidence_path.exists():
        functional_ok = False
        cases.append(
            {
                "category": "functional",
                "name": "seed_evidence_exists",
                "status": 0,
                "expect": "file exists",
                "passed": False,
                "detail": f"missing: {seed_evidence_path}",
            }
        )
    else:
        seed_payload = parse_json(seed_evidence_path.read_text(encoding="utf-8"))
        has_core = bool(seed_payload.get("run_id")) and bool(seed_payload.get("vehicle_ids"))
        cases.append(
            {
                "category": "functional",
                "name": "seed_evidence_core_fields",
                "status": 1 if has_core else 0,
                "expect": "run_id+vehicle_ids",
                "passed": has_core,
                "detail": f"seed_file={seed_evidence_path}",
            }
        )
        functional_ok = functional_ok and has_core

    status, raw = http_json("GET", health_url)
    functional_ok = check_case(
        cases,
        category="functional",
        name="health_check",
        status=status,
        allowed={200},
        detail=raw,
    ) and functional_ok

    status, raw = http_json("GET", f"{api_base_url}/support/notices")
    functional_ok = check_case(
        cases,
        category="functional",
        name="public_support_notices",
        status=status,
        allowed={200},
        detail=raw,
    ) and functional_ok
    category_status["functional"] = functional_ok

    # 공통 테스트 계정 준비 (boundary/equivalence/security)
    seller_email = f"quality.seller.{run_id}@example.com"
    password = "DevPass123!@#"
    register_payload = {
        "full_name": f"Quality Seller {run_id}",
        "email": seller_email,
        "password": password,
        "phone": "010-9999-9999",
        "country": "KR",
    }
    status, raw = http_json("POST", f"{api_base_url}/auth/register/seller", body=register_payload)
    identity_setup_ok = check_case(
        cases,
        category="equivalence",
        name="seller_register_valid",
        status=status,
        allowed={200, 201},
        detail=raw,
    )

    login_payload = {"email": seller_email, "password": password, "role": "SELLER"}
    status, raw = http_json("POST", f"{api_base_url}/auth/login", body=login_payload)
    login_ok = check_case(
        cases,
        category="equivalence",
        name="seller_login_valid_role",
        status=status,
        allowed={200},
        detail=raw,
    )
    login_data = parse_json(raw)
    seller_token = str(login_data.get("access_token", "")) if login_ok else ""
    identity_setup_ok = identity_setup_ok and login_ok and bool(seller_token)

    # Boundary
    boundary_ok = identity_setup_ok
    if not identity_setup_ok:
        boundary_ok = False
    else:
        status, raw = http_json(
            "POST",
            f"{api_base_url}/vehicles",
            body=build_vehicle_payload(run_id, hours=0, suffix="H0"),
            token=seller_token,
        )
        boundary_ok = check_case(
            cases,
            category="boundary",
            name="vehicle_create_bidding_hours_0_invalid",
            status=status,
            status_range=(400, 500),
            detail=raw,
        ) and boundary_ok

        status, raw = http_json(
            "POST",
            f"{api_base_url}/vehicles",
            body=build_vehicle_payload(run_id + 1, hours=721, suffix="H721"),
            token=seller_token,
        )
        boundary_ok = check_case(
            cases,
            category="boundary",
            name="vehicle_create_bidding_hours_721_invalid",
            status=status,
            status_range=(400, 500),
            detail=raw,
        ) and boundary_ok

        status, raw = http_json(
            "POST",
            f"{api_base_url}/vehicles",
            body=build_vehicle_payload(run_id + 2, hours=1, suffix="H1"),
            token=seller_token,
        )
        boundary_ok = check_case(
            cases,
            category="boundary",
            name="vehicle_create_bidding_hours_1_valid",
            status=status,
            allowed={200, 201},
            detail=raw,
        ) and boundary_ok

        status, raw = http_json(
            "POST",
            f"{api_base_url}/vehicles",
            body=build_vehicle_payload(run_id + 3, hours=720, suffix="H720"),
            token=seller_token,
        )
        boundary_ok = check_case(
            cases,
            category="boundary",
            name="vehicle_create_bidding_hours_720_valid",
            status=status,
            allowed={200, 201},
            detail=raw,
        ) and boundary_ok
    category_status["boundary"] = boundary_ok

    # Equivalence
    equivalence_ok = identity_setup_ok
    status, raw = http_json(
        "POST",
        f"{api_base_url}/auth/password-reset/request",
        body={"email": seller_email, "role": "SELLER"},
    )
    equivalence_ok = check_case(
        cases,
        category="equivalence",
        name="password_reset_valid_role",
        status=status,
        allowed={200},
        detail=raw,
    ) and equivalence_ok

    status, raw = http_json(
        "POST",
        f"{api_base_url}/auth/password-reset/request",
        body={"email": seller_email, "role": "INVALID_ROLE"},
    )
    equivalence_ok = check_case(
        cases,
        category="equivalence",
        name="password_reset_invalid_role",
        status=status,
        status_range=(400, 500),
        detail=raw,
    ) and equivalence_ok

    status, raw = http_json(
        "POST",
        f"{api_base_url}/auth/login",
        body={"email": seller_email, "password": password, "role": "DEALER"},
    )
    equivalence_ok = check_case(
        cases,
        category="equivalence",
        name="seller_login_wrong_role",
        status=status,
        status_range=(400, 500),
        detail=raw,
    ) and equivalence_ok
    category_status["equivalence"] = equivalence_ok

    # Security
    security_ok = True
    status, raw = http_json("GET", f"{api_base_url}/admin/dealers/pending")
    security_ok = check_case(
        cases,
        category="security",
        name="admin_endpoint_without_token",
        status=status,
        status_range=(400, 500),
        detail=raw,
    ) and security_ok

    status, raw = http_json("GET", f"{api_base_url}/admin/dealers/pending", token=seller_token)
    security_ok = check_case(
        cases,
        category="security",
        name="admin_endpoint_with_seller_token",
        status=status,
        status_range=(400, 500),
        detail=raw,
    ) and security_ok

    status, raw = http_json(
        "POST",
        f"{api_base_url}/vehicles",
        body=build_vehicle_payload(run_id + 4, hours=72, suffix="SEC"),
        token="",
    )
    security_ok = check_case(
        cases,
        category="security",
        name="vehicle_create_without_token",
        status=status,
        status_range=(400, 500),
        detail=raw,
    ) and security_ok

    status, raw = http_json("GET", f"{api_base_url}/settings/me")
    security_ok = check_case(
        cases,
        category="security",
        name="settings_without_token",
        status=status,
        status_range=(400, 500),
        detail=raw,
    ) and security_ok
    category_status["security"] = security_ok

    return {
        "run_id": run_id,
        "category_status": category_status,
        "cases": cases,
    }


def build_feature_results(
    feature_codes: list[str],
    categories: list[str],
    category_status: dict[str, bool],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for code in feature_codes:
        for category in categories:
            rows.append(
                {
                    "feature_code": code,
                    "category": category,
                    "passed": bool(category_status.get(category, False)),
                    "detail": f"category={category} gate={category_status.get(category, False)}",
                }
            )
    return rows


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="template spec quality runner")
    parser.add_argument("--api-base-url", default="", help="e.g. http://api-template.127.0.0.1.nip.io:8088/api/v1")
    parser.add_argument("--health-url", default="", help="e.g. http://api-template.127.0.0.1.nip.io:8088/health")
    parser.add_argument("--seed-evidence", default="sdd/03_verify/10_test/dev_seed_latest.json")
    parser.add_argument("--output", default="sdd/03_verify/10_test/spec_quality_latest.json")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[2]
    spec_target_dir = repo_root / "sdd" / "02_plan"
    feature_codes = collect_feature_codes(spec_target_dir)
    if not feature_codes:
        print("[ERROR] feature code를 sdd/02_plan에서 찾지 못했습니다.", file=sys.stderr)
        return 1

    api_base_url = (
        os.environ.get("DEV_API_BASE_URL", "").strip()
        or (args.api_base_url or "").strip()
        or "http://127.0.0.1:8000/api/v1"
    )
    health_url = (
        os.environ.get("DEV_HEALTH_URL", "").strip()
        or (args.health_url or "").strip()
        or api_base_url.removesuffix("/api/v1") + "/health"
    )

    categories = ["functional", "boundary", "equivalence", "security"]
    seed_evidence_path = (repo_root / args.seed_evidence).resolve()
    quality = run_quality(
        api_base_url=api_base_url.rstrip("/"),
        health_url=health_url.rstrip("/"),
        seed_evidence_path=seed_evidence_path,
        categories=categories,
    )
    rows = build_feature_results(feature_codes, categories, quality["category_status"])

    output_path = (repo_root / args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "repo": "template",
        "api_base_url": api_base_url,
        "health_url": health_url,
        "seed_evidence_path": str(seed_evidence_path),
        "feature_count": len(feature_codes),
        "required_categories": categories,
        "category_status": quality["category_status"],
        "cases": quality["cases"],
        "results": rows,
    }
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    ok = all(bool(quality["category_status"].get(x, False)) for x in categories)
    print(
        "[spec-quality] "
        f"features={len(feature_codes)} categories={len(categories)} "
        f"category_status={quality['category_status']} output={output_path}"
    )
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
