#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
from pathlib import Path

from build_template_screen_ir import (
    EXTRACTOR_VERSION,
    GRID_COLUMNS,
    normalize_code,
    parse_inventory,
    parse_route_contract,
    parse_status_trace,
    read_json,
    screen_artifact_paths,
    screen_dir_path,
    screen_ui_context_path,
    screen_ui_grid_path,
    screen_ui_img_path,
    screen_ui_spec_path,
)
from web_screen_ir_manifest import TEMPLATE_SCREEN_IR_CONFIG


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate Palcar seller/dealer/admin screen IR packages.")
    parser.add_argument("--service", action="append", choices=sorted(TEMPLATE_SCREEN_IR_CONFIG.keys()), help="Service to validate. Repeatable.")
    parser.add_argument("--screen", action="append", dest="screens", help="Limit to specific screen code. Repeatable.")
    return parser.parse_args()


def validate_service(service: str, selected_screens: set[str] | None, routes: dict[str, dict[str, str]], statuses: dict[str, dict[str, str]]) -> list[str]:
    config = TEMPLATE_SCREEN_IR_CONFIG[service]
    inventory = parse_inventory(Path(config["spec_pdf"]), str(config["screen_prefix"]))
    if selected_screens is not None:
        inventory = [row for row in inventory if row["screen_code"] in selected_screens]
    output_root = Path(config["output_root"])
    registry_path = output_root / "registry.json"
    errors: list[str] = []
    if not registry_path.exists():
        return [f"{service}: missing {registry_path}"]
    registry = read_json(registry_path)
    rows = registry.get("screens", [])
    if registry.get("artifact_version") != EXTRACTOR_VERSION:
        errors.append(f"{service}: artifact version mismatch")
    if not inventory:
        errors.append(f"{service}: source inventory is empty")
    if len(rows) != len(inventory):
        errors.append(f"{service}: registry count mismatch")
    for index, row in enumerate(inventory, start=1):
        screen_code = row["screen_code"]
        page_number = index + int(config["page_offset"])
        screen_dir = screen_dir_path(output_root, screen_code)
        ui_grid_path = screen_ui_grid_path(output_root, screen_code)
        if not ui_grid_path.exists():
            errors.append(f"{screen_code}: missing {ui_grid_path}")
            continue
        if not screen_dir.is_dir():
            errors.append(f"{screen_code}: missing screen dir {screen_dir}")
        ui_spec_path = screen_ui_spec_path(output_root, screen_code)
        if not ui_spec_path.exists():
            errors.append(f"{screen_code}: missing {ui_spec_path}")
        elif not ui_spec_path.read_text(encoding="utf-8").strip():
            errors.append(f"{screen_code}: ui spec is empty")
        ui_img_path = screen_ui_img_path(output_root, screen_code)
        if not ui_img_path.exists():
            errors.append(f"{screen_code}: missing {ui_img_path}")
        context_path = screen_ui_context_path(output_root, screen_code)
        if not context_path.exists():
            errors.append(f"{screen_code}: missing {context_path}")
        else:
            context = read_json(context_path)
            if context.get("screen_code") != screen_code:
                errors.append(f"{screen_code}: context screen code mismatch")
            if context.get("grid", {}).get("columns") != GRID_COLUMNS:
                errors.append(f"{screen_code}: context grid column mismatch")
            if not context.get("grid", {}).get("blocks"):
                errors.append(f"{screen_code}: context grid blocks missing")
            if not context.get("requirements"):
                errors.append(f"{screen_code}: context requirements missing")
            if not context.get("connections", {}).get("requirement_to_blocks"):
                errors.append(f"{screen_code}: context requirement connections missing")

        rows_in_csv = list(csv.reader(ui_grid_path.open(encoding="utf-8")))
        if not rows_in_csv:
            errors.append(f"{screen_code}: csv is empty")
        widths = {len(csv_row) for csv_row in rows_in_csv}
        if widths != {GRID_COLUMNS}:
            errors.append(f"{screen_code}: csv column width mismatch {sorted(widths)}")
        if not any(any(cell.strip() for cell in csv_row) for csv_row in rows_in_csv):
            errors.append(f"{screen_code}: csv has no semantic tokens")

        route = routes.get(screen_code, {}).get("route", "")
        implementation_status = statuses.get(screen_code, {}).get("implementation_status", "unknown")
        registry_row = next((item for item in rows if item.get("screen_code") == screen_code), None)
        if registry_row is None:
            errors.append(f"{screen_code}: missing registry row")
            continue
        if registry_row.get("page_number") != page_number:
            errors.append(f"{screen_code}: page number mismatch")
        if registry_row.get("primary_route", "") != route:
            errors.append(f"{screen_code}: route mismatch")
        if registry_row.get("implementation_status") != implementation_status:
            errors.append(f"{screen_code}: implementation status mismatch")
        for key, expected_path in screen_artifact_paths(output_root, screen_code).items():
            if registry_row.get(key) != expected_path:
                errors.append(f"{screen_code}: {key} mismatch")

    legacy_flat_paths = sorted(path.name for path in output_root.glob("*_ui_grid.csv"))
    legacy_flat_paths.extend(sorted(path.name for path in output_root.glob("*_ui_spec.md")))
    legacy_flat_paths.extend(sorted(path.name for path in output_root.glob("*_ui_img.png")))
    if legacy_flat_paths:
        errors.append(f"{service}: legacy flat files remain under {output_root}: {', '.join(legacy_flat_paths)}")
    return errors


def main() -> None:
    args = parse_args()
    services = args.service or list(TEMPLATE_SCREEN_IR_CONFIG.keys())
    selected_screens = {normalize_code(code) for code in args.screens} if args.screens else None
    routes = parse_route_contract()
    statuses = parse_status_trace()
    errors: list[str] = []
    for service in services:
        errors.extend(validate_service(service, selected_screens, routes, statuses))
    if errors:
        for error in errors:
            print(error)
        raise SystemExit(1)
    print("validation: pass")


if __name__ == "__main__":
    main()
