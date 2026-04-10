#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
from datetime import datetime, timezone
from io import StringIO
from pathlib import Path
from typing import Any

from web_screen_ir_manifest import (
    ADMIN_RUNTIME,
    APP_RUNTIME,
    COMMON_GUIDELINE_REFS,
    LANDING_RUNTIME,
    TEMPLATE_SCREEN_IR_CONFIG,
    PUBLIC_LANDING_ROUTES,
    ROOT,
    SPEC_TRACEABILITY,
    UI_PARITY_CONTRACT,
)


EXTRACTOR_VERSION = "0.4.0"
HEADER_ROWS = {"화면명", "화면ID", "PALCA"}
GRID_COLUMNS = 24
LEGACY_GRID_COLUMNS = 12


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Palcar seller/dealer/admin screen IR packages.")
    parser.add_argument("--service", action="append", choices=sorted(TEMPLATE_SCREEN_IR_CONFIG.keys()), help="Service to build. Repeatable.")
    parser.add_argument("--screen", action="append", dest="screens", help="Limit to specific screen code. Repeatable.")
    return parser.parse_args()


def repo_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_code(code: str) -> str:
    match = re.fullmatch(r"([A-Z]+)_(\d+)", code.strip())
    if not match:
        raise ValueError(f"Unsupported screen code: {code}")
    return f"{match.group(1)}_{int(match.group(2)):03d}"


def parse_inventory(spec_pdf: Path, prefix: str) -> list[dict[str, Any]]:
    result = subprocess.run(
        ["pdftotext", "-f", "1", "-l", "1", str(spec_pdf), "-"],
        check=True,
        capture_output=True,
        text=True,
    )
    code_pattern = re.compile(rf"^{prefix}_(\d{{3}}|\d+)$")
    entries: list[dict[str, Any]] = []
    name_parts: list[str] = []
    for raw_line in result.stdout.splitlines():
        line = raw_line.strip()
        if not line or line in HEADER_ROWS:
            continue
        if code_pattern.fullmatch(line):
            code = normalize_code(line)
            name = "".join(name_parts).strip()
            if not name:
                raise SystemExit(f"Missing inventory name before {code} in {spec_pdf}")
            entries.append({"screen_code": code, "screen_name": name})
            name_parts = []
            continue
        name_parts.append(line.replace(" ", ""))
    if not entries:
        raise SystemExit(f"Unable to extract inventory rows from {spec_pdf}")
    return sorted(entries, key=lambda item: int(item["screen_code"].split("_", 1)[1]))


def parse_route_contract() -> dict[str, dict[str, str]]:
    rows: dict[str, dict[str, str]] = {}
    current: dict[str, str] | None = None
    for raw_line in UI_PARITY_CONTRACT.read_text(encoding="utf-8").splitlines():
        line = raw_line.rstrip()
        matched = re.match(r"\s*-\s+id:\s+([A-Z]+_\d+)\s*$", line)
        if matched:
            code = normalize_code(matched.group(1))
            current = {"screen_code": code}
            rows[code] = current
            continue
        if current is None:
            continue
        matched = re.match(r"\s+name:\s+(.+?)\s*$", line)
        if matched:
            current["screen_name"] = matched.group(1).strip()
            continue
        matched = re.match(r"\s+route:\s+(.+?)\s*$", line)
        if matched:
            current["route"] = matched.group(1).strip()
    return rows


def parse_status_trace() -> dict[str, dict[str, str]]:
    rows: dict[str, dict[str, str]] = {}
    table_pattern = re.compile(r"^\|\s*([A-Z]+_\d+)\s*\|\s*(.+?)\s*\|\s*([a-z]+)\s*(?:\[[^\]]+\])?\s*\|")
    for line in SPEC_TRACEABILITY.read_text(encoding="utf-8").splitlines():
        matched = table_pattern.match(line.strip())
        if not matched:
            continue
        code = normalize_code(matched.group(1))
        rows[code] = {
            "screen_code": code,
            "screen_name": matched.group(2).strip(),
            "implementation_status": matched.group(3).strip(),
        }
    return rows


def infer_runtime_path(route: str) -> Path:
    if route.startswith("/admin"):
        return ADMIN_RUNTIME
    if route in PUBLIC_LANDING_ROUTES:
        return LANDING_RUNTIME
    return APP_RUNTIME


def infer_access(service: str, route: str) -> str:
    if service == "admin":
        return "role:ADMIN" if route.startswith("/admin") else "public"
    if service == "dealer":
        return "role:DEALER"
    if route in PUBLIC_LANDING_ROUTES:
        return "public"
    return "role:SELLER"


def infer_shell_kind(service: str, route: str) -> str:
    if route in PUBLIC_LANDING_ROUTES:
        return "landing-public-shell"
    if service == "admin":
        return "admin-shell"
    if service == "dealer":
        return "dealer-app-shell"
    return "seller-app-shell"


def infer_header_kind(service: str, route: str) -> str:
    if route in PUBLIC_LANDING_ROUTES:
        return "landing-public-header"
    if service == "admin":
        return "admin-topbar"
    return "app-secondary-header"


def infer_bottom_nav_kind(service: str, route: str) -> str:
    if route in PUBLIC_LANDING_ROUTES or service == "admin":
        return "none"
    if route.startswith("/dealer/"):
        return "dealer-bottom-nav-or-tab-shell"
    if route.startswith("/seller/") or route.startswith("/settings") or route.startswith("/support"):
        return "seller-bottom-nav-or-tab-shell"
    return "none"


def load_guide_surface(config: dict[str, Any], page_number: int) -> dict[str, Any]:
    guide = read_json(Path(config["guide_json"]))
    surfaces = [surface for surface in guide.get("surfaces", []) if int(surface.get("page_number", -1)) == page_number]
    if not surfaces:
        raise SystemExit(f"Missing guide surface for {config['service']} page {page_number}")
    return max(
        surfaces,
        key=lambda item: (item["bbox"]["right"] - item["bbox"]["left"]) * (item["bbox"]["bottom"] - item["bbox"]["top"]),
    )


def screen_dir_path(output_root: Path, screen_code: str) -> Path:
    return output_root / screen_code


def screen_ui_grid_path(output_root: Path, screen_code: str) -> Path:
    return screen_dir_path(output_root, screen_code) / "ui_grid.csv"


def screen_ui_spec_path(output_root: Path, screen_code: str) -> Path:
    return screen_dir_path(output_root, screen_code) / "ui_spec.md"


def screen_ui_img_path(output_root: Path, screen_code: str) -> Path:
    return screen_dir_path(output_root, screen_code) / "ui_img.png"


def screen_ui_context_path(output_root: Path, screen_code: str) -> Path:
    return screen_dir_path(output_root, screen_code) / "ui_context.json"


def screen_artifact_paths(output_root: Path, screen_code: str) -> dict[str, str]:
    return {
        "screen_dir_path": repo_path(screen_dir_path(output_root, screen_code)),
        "ui_grid_path": repo_path(screen_ui_grid_path(output_root, screen_code)),
        "ui_spec_path": repo_path(screen_ui_spec_path(output_root, screen_code)),
        "ui_img_path": repo_path(screen_ui_img_path(output_root, screen_code)),
        "ui_context_path": repo_path(screen_ui_context_path(output_root, screen_code)),
    }


def normalize_block_id(token: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", token.lower()).strip("-")
    return slug or "block"


def analyze_grid_rows(rows: list[list[str]]) -> dict[str, Any]:
    ordered_tokens: list[str] = []
    blocks: dict[str, dict[str, Any]] = {}

    for row_index, row in enumerate(rows, start=1):
        current_token = ""
        start_col = 1
        for col_index, raw_token in enumerate(row + ["__END__"], start=1):
            token = raw_token.strip()
            if col_index == 1:
                current_token = token
                start_col = 1
                continue
            if token == current_token:
                continue
            if current_token:
                if current_token not in blocks:
                    ordered_tokens.append(current_token)
                    blocks[current_token] = {
                        "id": normalize_block_id(current_token),
                        "token": current_token,
                        "segments": [],
                        "rows": [],
                        "column_start": start_col,
                        "column_end": col_index - 1,
                    }
                block = blocks[current_token]
                block["segments"].append(
                    {
                        "row": row_index,
                        "column_start": start_col,
                        "column_end": col_index - 1,
                        "width": col_index - start_col,
                    }
                )
                block["rows"].append(row_index)
                block["column_start"] = min(int(block["column_start"]), start_col)
                block["column_end"] = max(int(block["column_end"]), col_index - 1)
            current_token = token
            start_col = col_index

    block_rows: list[dict[str, Any]] = []
    for token in ordered_tokens:
        block = blocks[token]
        unique_rows = sorted(set(block["rows"]))
        segments = block["segments"]
        block_rows.append(
            {
                "id": block["id"],
                "token": token,
                "row_start": min(unique_rows),
                "row_end": max(unique_rows),
                "column_start": int(block["column_start"]),
                "column_end": int(block["column_end"]),
                "segment_count": len(segments),
                "segments": segments,
            }
        )

    return {
        "columns": GRID_COLUMNS,
        "row_count": len(rows),
        "ordered_tokens": ordered_tokens,
        "blocks": block_rows,
    }


def token_aliases(token: str) -> list[str]:
    aliases = {token.lower()}
    lower = token.lower()
    if "header" in lower or "top bar" in lower:
        aliases.update({"header", "상단", "헤더", "topbar"})
    if "title" in lower:
        aliases.update({"title", "제목", "타이틀", "화면명"})
    if "action" in lower or "button" in lower:
        aliases.update({"action", "버튼", "액션", "cta", "등록", "수정", "저장", "삭제", "완료", "보기"})
    if "hero" in lower or "media" in lower or "brand logo" in lower:
        aliases.update({"hero", "대표", "메인", "배너", "이미지", "사진", "미디어", "썸네일"})
    if "identity" in lower:
        aliases.update({"identity", "차량", "차량 정보", "제조사", "모델", "연식", "번호"})
    if "basics" in lower or "info" in lower or "fields" in lower:
        aliases.update({"info", "정보", "기본 정보", "상세 정보", "옵션", "연료", "변속기", "색상", "주행"})
    if "photo" in lower or "gallery" in lower:
        aliases.update({"photo", "사진", "이미지", "갤러리", "슬라이드", "더보기", "옵션"})
    if "summary" in lower or "status" in lower or "kpi" in lower:
        aliases.update({"summary", "요약", "현황", "상태", "카드", "입찰", "정산", "검차", "감가"})
    if "progress" in lower or "timeline" in lower:
        aliases.update({"progress", "진행", "단계", "타임라인", "프로세스"})
    if "activity" in lower or "history" in lower:
        aliases.update({"activity", "활동", "이력", "내역", "로그", "이벤트"})
    if "notification" in lower:
        aliases.update({"notification", "알림"})
    if "filter" in lower or "selector" in lower:
        aliases.update({"filter", "필터", "검색", "정렬", "선택"})
    if "list" in lower or "table" in lower or "item" in lower:
        aliases.update({"list", "목록", "리스트", "테이블", "항목"})
    if "nav" in lower:
        aliases.update({"nav", "navigation", "네비게이션", "하단 네비게이션", "bottom nav"})
    return sorted(aliases)


def build_screen_context(
    *,
    service: str,
    screen_code: str,
    screen_name: str,
    page_number: int,
    source_spec: Path,
    surface_id: str,
    primary_route: str,
    access: str,
    implementation_status: str,
    runtime_path: Path,
    shared_shell_kind: str,
    header_kind: str,
    bottom_nav_kind: str,
    output_root: Path,
    grid_rows: list[list[str]],
) -> dict[str, Any]:
    return {
        "artifact_version": EXTRACTOR_VERSION,
        "service": service,
        "screen_code": screen_code,
        "screen_name": screen_name,
        "page_number": page_number,
        "source_spec": repo_path(source_spec),
        "surface_id": surface_id,
        "primary_route": primary_route,
        "access": access,
        "implementation_status": implementation_status,
        "runtime_context": {
            "runtime_entry": repo_path(runtime_path),
            "shared_shell_kind": shared_shell_kind,
            "header_kind": header_kind,
            "bottom_nav_kind": bottom_nav_kind,
        },
        "artifacts": screen_artifact_paths(output_root, screen_code),
        "grid": analyze_grid_rows(grid_rows),
        "requirements": [],
        "connections": {
            "requirement_to_blocks": [],
            "block_to_requirements": [],
        },
    }


def cleanup_legacy_flat_files(output_root: Path, screen_code: str) -> None:
    for suffix in ("ui_grid.csv", "ui_spec.md", "ui_img.png"):
        legacy_path = output_root / f"{screen_code}_{suffix}"
        if legacy_path.exists():
            legacy_path.unlink()


def blank_row() -> list[str]:
    return [""] * GRID_COLUMNS


def fill_row(token: str) -> list[str]:
    return [token] * GRID_COLUMNS


def span_row(*segments: tuple[str, int]) -> list[str]:
    row: list[str] = []
    total_width = sum(width for _, width in segments)
    if total_width == GRID_COLUMNS:
        scale = 1
    elif total_width == LEGACY_GRID_COLUMNS and GRID_COLUMNS % LEGACY_GRID_COLUMNS == 0:
        scale = GRID_COLUMNS // LEGACY_GRID_COLUMNS
    else:
        raise ValueError(f"Invalid span row width: {total_width}")
    for token, width in segments:
        row.extend([token] * (width * scale))
    if len(row) != GRID_COLUMNS:
        raise ValueError(f"Invalid span row width: {len(row)}")
    return row


def footer_row(bottom_nav_kind: str) -> list[str]:
    return fill_row("bottom nav") if bottom_nav_kind != "none" else blank_row()


def auth_login_rows() -> list[list[str]]:
    return [
        span_row(("logo", 2), ("top bar", 10)),
        blank_row(),
        span_row(("", 3), ("login card", 6), ("", 3)),
        span_row(("", 3), ("login card", 1), ("brand logo", 4), ("login card", 1), ("", 3)),
        span_row(("", 3), ("login card", 1), ("login title", 4), ("login card", 1), ("", 3)),
        span_row(("", 3), ("login card", 1), ("id label", 1), ("id input", 3), ("login card", 1), ("", 3)),
        span_row(("", 3), ("login card", 1), ("password label", 1), ("password input", 3), ("login card", 1), ("", 3)),
        span_row(("", 3), ("login card", 1), ("remember id", 2), ("forgot password", 2), ("login card", 1), ("", 3)),
        span_row(("", 3), ("login card", 6), ("", 3)),
        span_row(("", 3), ("login card", 1), ("login button", 4), ("login card", 1), ("", 3)),
        span_row(("", 3), ("login card", 6), ("", 3)),
        span_row(("", 3), ("support note", 6), ("", 3)),
        blank_row(),
    ]


def auth_reset_rows() -> list[list[str]]:
    return [
        span_row(("logo", 2), ("top bar", 10)),
        blank_row(),
        span_row(("", 3), ("reset card", 6), ("", 3)),
        span_row(("", 3), ("reset card", 1), ("reset title", 4), ("reset card", 1), ("", 3)),
        span_row(("", 3), ("reset card", 1), ("guide text", 4), ("reset card", 1), ("", 3)),
        span_row(("", 3), ("reset card", 1), ("email label", 1), ("email input", 3), ("reset card", 1), ("", 3)),
        span_row(("", 3), ("reset card", 1), ("role selector", 4), ("reset card", 1), ("", 3)),
        span_row(("", 3), ("reset card", 1), ("send button", 4), ("reset card", 1), ("", 3)),
        span_row(("", 3), ("reset card", 6), ("", 3)),
        span_row(("", 3), ("support note", 6), ("", 3)),
        blank_row(),
    ]


def auth_signup_select_rows() -> list[list[str]]:
    return [
        span_row(("logo", 2), ("top bar", 10)),
        blank_row(),
        fill_row("signup title"),
        fill_row("signup guide"),
        span_row(("", 2), ("seller signup card", 4), ("dealer signup card", 4), ("", 2)),
        span_row(("", 2), ("seller signup card", 4), ("dealer signup card", 4), ("", 2)),
        span_row(("", 2), ("seller signup action", 4), ("dealer signup action", 4), ("", 2)),
        blank_row(),
    ]


def auth_signup_form_rows(role_token: str) -> list[list[str]]:
    return [
        span_row(("logo", 2), ("top bar", 10)),
        blank_row(),
        span_row(("", 2), ("signup form", 8), ("", 2)),
        span_row(("", 2), ("signup form", 1), (f"{role_token} title", 6), ("signup form", 1), ("", 2)),
        span_row(("", 2), ("signup form", 1), ("account fields", 6), ("signup form", 1), ("", 2)),
        span_row(("", 2), ("signup form", 1), ("profile fields", 6), ("signup form", 1), ("", 2)),
        span_row(("", 2), ("signup form", 1), ("agreement fields", 6), ("signup form", 1), ("", 2)),
        span_row(("", 2), ("signup form", 1), ("submit button", 6), ("signup form", 1), ("", 2)),
        blank_row(),
    ]


def auth_complete_rows(role_token: str) -> list[list[str]]:
    return [
        span_row(("logo", 2), ("top bar", 10)),
        blank_row(),
        span_row(("", 3), ("complete card", 6), ("", 3)),
        span_row(("", 3), ("complete card", 1), (f"{role_token} complete title", 4), ("complete card", 1), ("", 3)),
        span_row(("", 3), ("complete card", 1), ("complete message", 4), ("complete card", 1), ("", 3)),
        span_row(("", 3), ("complete card", 1), ("next action", 4), ("complete card", 1), ("", 3)),
        blank_row(),
    ]


def dashboard_rows(bottom_nav_kind: str) -> list[list[str]]:
    return [
        fill_row("header"),
        span_row(("dashboard title", 6), ("dashboard action", 6)),
        span_row(("kpi card", 3), ("kpi card", 3), ("kpi card", 3), ("kpi card", 3)),
        span_row(("kpi card", 3), ("kpi card", 3), ("kpi card", 3), ("kpi card", 3)),
        span_row(("chart panel", 7), ("activity panel", 5)),
        span_row(("chart panel", 7), ("activity panel", 5)),
        span_row(("table panel", 8), ("status panel", 4)),
        footer_row(bottom_nav_kind),
    ]


def notification_rows(bottom_nav_kind: str) -> list[list[str]]:
    return [
        fill_row("header"),
        span_row(("notification title", 6), ("notification action", 6)),
        fill_row("filter bar"),
        fill_row("notification item"),
        fill_row("notification item"),
        fill_row("notification item"),
        fill_row("notification item"),
        footer_row(bottom_nav_kind),
    ]


def list_rows(bottom_nav_kind: str) -> list[list[str]]:
    return [
        fill_row("header"),
        span_row(("screen title", 6), ("screen action", 6)),
        fill_row("filter bar"),
        fill_row("primary list"),
        fill_row("primary list"),
        fill_row("primary list"),
        fill_row("supporting panel"),
        footer_row(bottom_nav_kind),
    ]


def detail_rows(summary_token: str, bottom_nav_kind: str) -> list[list[str]]:
    return [
        fill_row("header"),
        span_row(("screen title", 7), ("header action", 5)),
        span_row(("detail hero", 8), (summary_token, 4)),
        span_row(("detail hero", 8), (summary_token, 4)),
        fill_row("detail identity"),
        fill_row("detail info"),
        span_row(("supporting panel", 6), ("activity panel", 6)),
        footer_row(bottom_nav_kind),
    ]


def special_seller_detail_rows(screen_code: str, bottom_nav_kind: str) -> list[list[str]] | None:
    rows_by_code = {
        "FRT_014": [
            fill_row("header"),
            span_row(("screen title", 7), ("header action", 5)),
            span_row(("hero media", 8), ("bidding summary", 4)),
            span_row(("hero media", 8), ("bidding summary", 4)),
            fill_row("vehicle identity"),
            fill_row("vehicle basics"),
            fill_row("photo strip"),
            span_row(("trade progress", 6), ("recent activity", 6)),
            footer_row(bottom_nav_kind),
        ],
        "FRT_017": [
            fill_row("header"),
            span_row(("screen title", 7), ("header action", 5)),
            span_row(("hero media", 8), ("closed bidding summary", 4)),
            span_row(("hero media", 8), ("closed bidding summary", 4)),
            fill_row("vehicle identity"),
            fill_row("vehicle basics"),
            fill_row("photo strip"),
            span_row(("trade progress", 6), ("recent activity", 6)),
            footer_row(bottom_nav_kind),
        ],
        "FRT_019": [
            fill_row("header"),
            span_row(("screen title", 7), ("header action", 5)),
            span_row(("hero media", 8), ("inspection pending summary", 4)),
            span_row(("hero media", 8), ("inspection pending summary", 4)),
            fill_row("vehicle identity"),
            fill_row("inspection guide"),
            fill_row("photo strip"),
            span_row(("trade progress", 6), ("recent activity", 6)),
            footer_row(bottom_nav_kind),
        ],
        "FRT_022": [
            fill_row("header"),
            span_row(("screen title", 7), ("header action", 5)),
            span_row(("hero media", 8), ("inspection completed summary", 4)),
            span_row(("hero media", 8), ("inspection completed summary", 4)),
            fill_row("vehicle identity"),
            fill_row("inspection result"),
            fill_row("photo strip"),
            span_row(("trade progress", 6), ("recent activity", 6)),
            footer_row(bottom_nav_kind),
        ],
        "FRT_024": [
            fill_row("header"),
            span_row(("screen title", 7), ("header action", 5)),
            span_row(("hero media", 8), ("depreciation pending summary", 4)),
            span_row(("hero media", 8), ("depreciation pending summary", 4)),
            fill_row("vehicle identity"),
            fill_row("depreciation guide"),
            fill_row("photo strip"),
            span_row(("trade progress", 6), ("recent activity", 6)),
            footer_row(bottom_nav_kind),
        ],
        "FRT_027": [
            fill_row("header"),
            span_row(("screen title", 7), ("header action", 5)),
            span_row(("hero media", 8), ("depreciation completed summary", 4)),
            span_row(("hero media", 8), ("depreciation completed summary", 4)),
            fill_row("vehicle identity"),
            fill_row("depreciation result"),
            fill_row("photo strip"),
            span_row(("trade progress", 6), ("recent activity", 6)),
            footer_row(bottom_nav_kind),
        ],
    }
    return rows_by_code.get(screen_code)


def build_ui_ir_rows(*, service: str, screen_code: str, screen_name: str, route: str, bottom_nav_kind: str) -> list[list[str]]:
    compact_name = screen_name.replace(" ", "")
    lower_route = route.lower()

    special_rows = special_seller_detail_rows(screen_code, bottom_nav_kind)
    if special_rows is not None:
        return special_rows

    if "login" in lower_route or "로그인" in compact_name:
        return auth_login_rows()
    if "forgot-password" in lower_route or "reset-password" in lower_route or "비밀번호찾" in compact_name or "비밀번호변경" in compact_name:
        return auth_reset_rows()
    if route == "/signup" or "회원가입유형" in compact_name or compact_name == "회원가입":
        return auth_signup_select_rows()
    if "signup" in lower_route and ("complete" in lower_route or "완료" in compact_name):
        role_token = "seller" if "seller" in lower_route or "판매자" in compact_name else "dealer" if "dealer" in lower_route or "딜러" in compact_name else "signup"
        return auth_complete_rows(role_token)
    if "signup" in lower_route or "회원가입" in compact_name:
        role_token = "seller" if "seller" in lower_route or "판매자" in compact_name else "dealer" if "dealer" in lower_route or "딜러" in compact_name else "signup"
        return auth_signup_form_rows(role_token)
    if "dashboard" in lower_route or "대시보드" in compact_name or compact_name == "인덱스":
        return dashboard_rows(bottom_nav_kind)
    if "notification" in lower_route or "알림" in compact_name:
        return notification_rows(bottom_nav_kind)
    if "detail" in lower_route or "상세" in compact_name:
        return detail_rows("detail summary", bottom_nav_kind)
    if any(keyword in lower_route for keyword in ("faq", "notice", "inquiries", "list", "market", "bids", "vehicles", "settlement", "accounts", "permissions", "reports")):
        return list_rows(bottom_nav_kind)
    return list_rows(bottom_nav_kind)


def build_ui_ir_csv(*, service: str, screen_code: str, screen_name: str, route: str, bottom_nav_kind: str) -> str:
    rows = build_ui_ir_rows(
        service=service,
        screen_code=screen_code,
        screen_name=screen_name,
        route=route,
        bottom_nav_kind=bottom_nav_kind,
    )
    buffer = StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerows(rows)
    return buffer.getvalue()


def render_ui_ir_csv(rows: list[list[str]]) -> str:
    buffer = StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerows(rows)
    return buffer.getvalue()


def build_service(service: str, selected_screens: set[str] | None, routes: dict[str, dict[str, str]], statuses: dict[str, dict[str, str]]) -> None:
    config = TEMPLATE_SCREEN_IR_CONFIG[service]
    inventory = parse_inventory(Path(config["spec_pdf"]), str(config["screen_prefix"]))
    if selected_screens is not None:
        inventory = [row for row in inventory if row["screen_code"] in selected_screens]
    output_root = Path(config["output_root"])
    output_root.mkdir(parents=True, exist_ok=True)

    registry_rows: list[dict[str, Any]] = []
    for index, row in enumerate(inventory, start=1):
        screen_code = row["screen_code"]
        route_info = routes.get(screen_code, {})
        status_info = statuses.get(screen_code, {})
        page_number = index + int(config["page_offset"])
        surface = load_guide_surface(config, page_number)
        surface_id = str(surface["surface_id"])

        route = route_info.get("route", "")
        runtime_path = infer_runtime_path(route) if route else APP_RUNTIME
        access = infer_access(service, route)
        shared_shell_kind = infer_shell_kind(service, route)
        header_kind = infer_header_kind(service, route)
        bottom_nav_kind = infer_bottom_nav_kind(service, route)
        implementation_status = status_info.get("implementation_status", "unknown")
        screen_dir = screen_dir_path(output_root, screen_code)
        screen_dir.mkdir(parents=True, exist_ok=True)
        grid_rows = build_ui_ir_rows(
            service=service,
            screen_code=screen_code,
            screen_name=row["screen_name"],
            route=route,
            bottom_nav_kind=bottom_nav_kind,
        )
        ui_grid_path = screen_ui_grid_path(output_root, screen_code)
        ui_grid_path.write_text(render_ui_ir_csv(grid_rows), encoding="utf-8")
        write_json(
            screen_ui_context_path(output_root, screen_code),
            build_screen_context(
                service=service,
                screen_code=screen_code,
                screen_name=row["screen_name"],
                page_number=page_number,
                source_spec=Path(config["spec_pdf"]),
                surface_id=surface_id,
                primary_route=route,
                access=access,
                implementation_status=implementation_status,
                runtime_path=runtime_path,
                shared_shell_kind=shared_shell_kind,
                header_kind=header_kind,
                bottom_nav_kind=bottom_nav_kind,
                output_root=output_root,
                grid_rows=grid_rows,
            ),
        )

        registry_rows.append(
            {
                "source_code": screen_code,
                "screen_code": screen_code,
                "screen_name": row["screen_name"],
                "page_number": page_number,
                "surface_id": surface_id,
                "primary_route": route,
                "access": access,
                "implementation_status": implementation_status,
                **screen_artifact_paths(output_root, screen_code),
            }
        )

        cleanup_legacy_flat_files(output_root, screen_code)

    write_json(
        output_root / "registry.json",
        {
            "service": service,
            "source_spec": repo_path(Path(config["spec_pdf"])),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "artifact_version": EXTRACTOR_VERSION,
            "scope": "full" if selected_screens is None else "partial",
            "screens": registry_rows,
        },
    )
    (output_root / "README.md").write_text(
        "\n".join(
            [
                f"# {service.title()} Screen IR",
                "",
                f"- canonical source: `{repo_path(Path(config['spec_pdf']))}`",
                "- builder: `python3 sdd/99_toolchain/01_automation/build_template_screen_ir.py`",
                "- validator: `python3 sdd/99_toolchain/01_automation/validate_template_screen_ir.py`",
                "- canonical artifacts: `<SCREEN_CODE>/ui_grid.csv`, `<SCREEN_CODE>/ui_spec.md`, `<SCREEN_CODE>/ui_img.png`, `<SCREEN_CODE>/ui_context.json`",
                "- variant rule: desktop-only screens use `ui_grid.csv`; if one screen code carries both desktop and mobile variants, split into `ui_grid_desktop.csv` and `ui_grid_mobile.csv` and record the chosen variant in `ui_context.json`",
                "- package shape: per-screen folder under each service root with service-level `registry.json` index",
                "- row rule: each csv row is a horizontal screen slice and each file keeps a 24-column semantic matrix",
            ]
        )
        + "\n",
        encoding="utf-8",
    )


def main() -> None:
    args = parse_args()
    services = args.service or list(TEMPLATE_SCREEN_IR_CONFIG.keys())
    selected_screens = {normalize_code(code) for code in args.screens} if args.screens else None
    routes = parse_route_contract()
    statuses = parse_status_trace()
    for service in services:
        build_service(service, selected_screens, routes, statuses)


if __name__ == "__main__":
    main()
