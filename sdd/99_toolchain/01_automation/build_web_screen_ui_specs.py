#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

from build_template_screen_ir import (
    normalize_code,
    read_json,
    repo_path,
    screen_ui_context_path,
    screen_ui_spec_path,
    token_aliases,
    write_json,
)
from web_screen_ir_manifest import TEMPLATE_SCREEN_IR_CONFIG


RIGHT_PANE_MARKER_LEFT_MIN = 2200
RIGHT_PANE_MARKER_LEFT_MAX = 2350
RIGHT_PANE_CONTENT_LEFT = 2400


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Palcar seller/dealer/admin screen UI requirement markdowns.")
    parser.add_argument("--service", action="append", choices=sorted(TEMPLATE_SCREEN_IR_CONFIG.keys()), help="Service to build. Repeatable.")
    parser.add_argument("--screen", action="append", dest="screens", help="Limit to specific screen code. Repeatable.")
    return parser.parse_args()


def parse_xml_text_items(xml_path: Path) -> list[tuple[int, int, str]]:
    root = ET.parse(xml_path).getroot()
    items: list[tuple[int, int, str]] = []
    for text in root.iter("text"):
        left = int(float(text.attrib["left"]))
        top = int(float(text.attrib["top"]))
        content = "".join(text.itertext()).replace("\n", " ").strip()
        if content:
            items.append((top, left, " ".join(content.split())))
    items.sort(key=lambda item: (item[0], item[1]))
    return items


def extract_sections(pdf_path: Path, page_number: int) -> list[dict[str, Any]]:
    with tempfile.TemporaryDirectory() as tmp_dir:
        out_prefix = Path(tmp_dir) / f"page-{page_number:03d}"
        subprocess.run(
            ["pdftohtml", "-xml", "-i", "-q", "-f", str(page_number), "-l", str(page_number), str(pdf_path), str(out_prefix)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        xml_path = out_prefix.with_suffix(".xml")
        items = parse_xml_text_items(xml_path)

    markers = [
        {"top": top, "left": left, "text": text}
        for top, left, text in items
        if RIGHT_PANE_MARKER_LEFT_MIN <= left <= RIGHT_PANE_MARKER_LEFT_MAX and text.isdigit()
    ]
    if not markers:
        return []

    sections: list[dict[str, Any]] = []
    for index, marker in enumerate(markers):
        next_marker_top = markers[index + 1]["top"] if index + 1 < len(markers) else 10**9
        pane_items = [
            (top, left, text)
            for top, left, text in items
            if left >= RIGHT_PANE_CONTENT_LEFT and marker["top"] - 5 <= top < next_marker_top - 1
        ]
        if not pane_items:
            continue
        pane_items.sort(key=lambda item: (item[0], item[1]))
        heading = pane_items[0][2]
        lines = []
        for top, left, text in pane_items[1:]:
            indent = 1 if left >= RIGHT_PANE_CONTENT_LEFT + 30 else 0
            lines.append({"indent": indent, "text": text})
        sections.append({"number": marker["text"], "heading": heading, "lines": lines})
    return sections


def render_section(section: dict[str, Any]) -> list[str]:
    lines = [f"### {section['number']}. {section['heading']}"]
    for item in section["lines"]:
        indent = "  " if item["indent"] else ""
        lines.append(f"{indent}- {item['text']}")
    return lines


def requirement_keyword_set(section: dict[str, Any]) -> set[str]:
    raw_text = " ".join([section["heading"], *[item["text"] for item in section["lines"]]])
    tokens = {
        token.strip()
        for token in re.split(r"[^0-9A-Za-z가-힣]+", raw_text.lower())
        if len(token.strip()) >= 2
    }
    expanded = set(tokens)
    for token in list(tokens):
        if "버튼" in token:
            expanded.update({"버튼", "액션", "보기", "수정", "등록", "저장"})
        if any(keyword in token for keyword in ("이미지", "사진", "썸네일", "갤러리")):
            expanded.update({"이미지", "사진", "갤러리", "더보기"})
        if any(keyword in token for keyword in ("현황", "요약", "상태")):
            expanded.update({"현황", "요약", "상태"})
        if any(keyword in token for keyword in ("정보", "옵션", "상세")):
            expanded.update({"정보", "옵션", "상세", "기본"})
        if any(keyword in token for keyword in ("진행", "단계", "타임라인")):
            expanded.update({"진행", "단계", "타임라인"})
        if any(keyword in token for keyword in ("활동", "이력", "내역", "이벤트")):
            expanded.update({"활동", "이력", "내역", "이벤트"})
        if "알림" in token:
            expanded.update({"알림"})
    return expanded


def score_block(section: dict[str, Any], block: dict[str, Any]) -> int:
    keywords = requirement_keyword_set(section)
    aliases = {alias.lower() for alias in token_aliases(block["token"])}
    score = sum(3 for alias in aliases if alias and alias in keywords)
    heading = section["heading"]
    token = block["token"].lower()
    if ("action" in token or "button" in token) and "버튼" not in heading:
        score -= 2
    if "버튼" in heading and ("action" in token or "button" in token):
        score += 3
    if "대표" in heading and any(keyword in token for keyword in ("hero", "media")):
        score += 6
    if "영역" in heading and any(keyword in token for keyword in ("hero", "summary", "panel", "info", "list", "progress", "activity")):
        score += 1
    if any(keyword in heading for keyword in ("현황", "요약", "상태")) and "summary" in token:
        score += 6
    if any(keyword in heading for keyword in ("이미지", "사진")) and any(keyword in token for keyword in ("hero", "photo", "media")):
        score += 3
    if any(keyword in heading for keyword in ("이력", "활동", "내역")) and "activity" in token:
        score += 3
    if any(keyword in heading for keyword in ("단계", "진행")) and "progress" in token:
        score += 3
    if any(keyword in heading for keyword in ("정보", "옵션")) and any(keyword in token for keyword in ("info", "basics", "identity", "fields")):
        score += 2
    return score


def build_requirement_connections(grid: dict[str, Any], sections: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    blocks = list(grid.get("blocks", []))
    primary_blocks = [block for block in blocks if block["token"] not in {"header", "bottom nav"}]
    requirement_rows: list[dict[str, Any]] = []
    block_refs: dict[str, set[str]] = {block["id"]: set() for block in blocks}

    for index, section in enumerate(sections, start=1):
        scored = sorted(
            ((score_block(section, block), block) for block in blocks),
            key=lambda item: (-item[0], item[1]["row_start"], item[1]["column_start"]),
        )
        matched_blocks: list[dict[str, Any]] = []
        match_method = "keyword"
        if scored and scored[0][0] > 0:
            threshold = scored[0][0]
            matched_blocks = [block for score, block in scored if score == threshold][:2]
        elif primary_blocks:
            block = primary_blocks[min(index - 1, len(primary_blocks) - 1)]
            matched_blocks = [block]
            match_method = "order-fallback"

        requirement_id = f"REQ-{index}"
        matched_ids = [block["id"] for block in matched_blocks]
        for block_id in matched_ids:
            block_refs.setdefault(block_id, set()).add(requirement_id)
        requirement_rows.append(
            {
                "id": requirement_id,
                "number": str(section["number"]),
                "heading": section["heading"],
                "lines": [item["text"] for item in section["lines"]],
                "matched_block_ids": matched_ids,
                "match_method": match_method,
            }
        )

    block_rows = [
        {
            "block_id": block["id"],
            "token": block["token"],
            "requirement_ids": sorted(block_refs.get(block["id"], set())),
        }
        for block in blocks
    ]
    requirement_to_blocks = [
        {
            "requirement_id": requirement["id"],
            "block_ids": requirement["matched_block_ids"],
            "match_method": requirement["match_method"],
        }
        for requirement in requirement_rows
    ]
    return requirement_rows, requirement_to_blocks, block_rows


def build_markdown(*, screen_code: str, screen_name: str, page_number: int, primary_route: str, access: str, pdf_path: Path, sections: list[dict[str, Any]]) -> str:
    rendered: list[str] = [
        f"# {screen_code} UI Spec",
        "",
        f"- screen code: `{screen_code}`",
        f"- screen name: `{screen_name}`",
        f"- primary route: `{primary_route}`",
        f"- access: `{access}`",
        f"- source spec: `{repo_path(pdf_path)}`",
        f"- page number: `{page_number}`",
        "",
        "## Screen Requirements",
        "",
    ]
    for section in sections:
        rendered.extend(render_section(section))
        rendered.append("")
    rendered.extend(
        [
            "## Notes",
            "",
            "- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.",
            "- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.",
            "- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.",
        ]
    )
    return "\n".join(rendered).rstrip() + "\n"


def build_service(service: str, selected_screens: set[str] | None) -> None:
    config = TEMPLATE_SCREEN_IR_CONFIG[service]
    output_root = Path(config["output_root"])
    registry_path = output_root / "registry.json"
    registry = read_json(registry_path)
    screens = registry.get("screens", [])
    if selected_screens is not None:
        screens = [row for row in screens if normalize_code(row["screen_code"]) in selected_screens]

    updated_screens: list[dict[str, Any]] = []
    for row in screens:
        screen_code = normalize_code(row["screen_code"])
        page_number = int(row["page_number"])
        pdf_path = Path(config["spec_pdf"])
        sections = extract_sections(pdf_path, page_number)
        if not sections:
            raise SystemExit(f"{service}:{screen_code}: no right-pane requirements found in page {page_number}")
        md_path = screen_ui_spec_path(output_root, screen_code)
        md_path.parent.mkdir(parents=True, exist_ok=True)
        md_path.write_text(
            build_markdown(
                screen_code=screen_code,
                screen_name=row["screen_name"],
                page_number=page_number,
                primary_route=row.get("primary_route", ""),
                access=row.get("access", ""),
                pdf_path=pdf_path,
                sections=sections,
            ),
            encoding="utf-8",
        )
        context_path = screen_ui_context_path(output_root, screen_code)
        context = read_json(context_path)
        requirements, requirement_to_blocks, block_to_requirements = build_requirement_connections(context.get("grid", {}), sections)
        context["artifacts"]["ui_spec_path"] = repo_path(md_path)
        context["requirements"] = requirements
        context["connections"] = {
            "requirement_to_blocks": requirement_to_blocks,
            "block_to_requirements": block_to_requirements,
        }
        write_json(context_path, context)

        updated_row = dict(row)
        updated_row["ui_spec_path"] = repo_path(md_path)
        updated_screens.append(updated_row)

    if selected_screens is None:
        payload = dict(registry)
        payload["screens"] = updated_screens
        write_json(registry_path, payload)


def main() -> None:
    args = parse_args()
    services = args.service or list(TEMPLATE_SCREEN_IR_CONFIG.keys())
    selected_screens = {normalize_code(code) for code in args.screens} if args.screens else None
    for service in services:
        build_service(service, selected_screens)


if __name__ == "__main__":
    main()
