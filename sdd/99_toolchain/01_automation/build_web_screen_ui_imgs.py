#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

from build_template_screen_ir import read_json, repo_path, screen_ui_context_path, screen_ui_img_path, write_json
from web_screen_ir_manifest import TEMPLATE_SCREEN_IR_CONFIG
from spec_source_runtime import load_pdf_page

ROOT = Path(__file__).resolve().parents[3]
IR_ROOT = ROOT / "sdd/01_planning/02_screen/ir"
SERVICES = ("seller", "dealer", "admin")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Palcar screen ui_img assets from spec-derived surface crops.")
    parser.add_argument("--service", action="append", choices=SERVICES, help="Service to build. Repeatable.")
    parser.add_argument("--screen", action="append", dest="screens", help="Limit to specific screen code. Repeatable.")
    return parser.parse_args()


def load_registry(service: str) -> dict:
    path = IR_ROOT / service / "registry.json"
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_services(selected: list[str] | None) -> list[str]:
    if not selected:
        return list(SERVICES)
    return list(dict.fromkeys(selected))


def resolve_screens(selected: list[str] | None) -> set[str] | None:
    if not selected:
        return None
    return {screen.strip().upper() for screen in selected if screen.strip()}


def load_guide_surfaces(service: str) -> dict[str, dict]:
    config = TEMPLATE_SCREEN_IR_CONFIG[service]
    payload = json.loads(Path(config["guide_json"]).read_text(encoding="utf-8"))
    return {str(surface["surface_id"]): surface for surface in payload.get("surfaces", [])}


def crop_surface_image(service: str, page_number: int, surface: dict) -> Image.Image:
    config = TEMPLATE_SCREEN_IR_CONFIG[service]
    page_image = load_pdf_page(Path(config["spec_pdf"]), page_number, int(config["guide_dpi"]))
    bbox = surface["bbox"]
    return page_image.crop((int(bbox["left"]), int(bbox["top"]), int(bbox["right"]), int(bbox["bottom"])))


def build_service(service: str, selected_screens: set[str] | None) -> tuple[list[Path], dict]:
    registry = load_registry(service)
    surfaces = load_guide_surfaces(service)
    written: list[Path] = []
    updated_rows: list[dict] = []

    for row in registry.get("screens", []):
        screen_code = str(row["screen_code"]).strip().upper()
        if selected_screens is not None and screen_code not in selected_screens:
            updated_rows.append(dict(row))
            continue

        surface_id = str(row["surface_id"]).strip()
        surface = surfaces.get(surface_id)
        if surface is None:
            raise SystemExit(f"{service}:{screen_code}: missing guide surface for {surface_id}")

        dest = screen_ui_img_path(IR_ROOT / service, screen_code)
        dest.parent.mkdir(parents=True, exist_ok=True)
        crop_surface_image(service, int(row["page_number"]), surface).save(dest, format="PNG")
        context_path = screen_ui_context_path(IR_ROOT / service, screen_code)
        context = read_json(context_path)
        context["artifacts"]["ui_img_path"] = repo_path(dest)
        write_json(context_path, context)
        updated_row = dict(row)
        updated_row["ui_img_path"] = repo_path(dest)
        updated_rows.append(updated_row)
        written.append(dest)

    updated_registry = dict(registry)
    updated_registry["screens"] = updated_rows
    return written, updated_registry


def main() -> None:
    args = parse_args()
    services = resolve_services(args.service)
    selected_screens = resolve_screens(args.screens)

    total = 0
    for service in services:
        written, updated_registry = build_service(service, selected_screens)
        total += len(written)
        if selected_screens is None:
            write_json(IR_ROOT / service / "registry.json", updated_registry)
        print(f"{service}: {len(written)} ui_img file(s) written")

    print(f"total: {total} ui_img file(s) written")


if __name__ == "__main__":
    main()
