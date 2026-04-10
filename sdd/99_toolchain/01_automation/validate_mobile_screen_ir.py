#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageChops

from build_mobile_screen_ir import (
    APP_TSX,
    EXTRACTOR_VERSION,
    GUIDE_JSON,
    OUTPUT_ROOT,
    SCREEN_CONTRACTS,
    infer_page_number,
    normalize_requested_runtime_screens,
    parse_routes,
    parse_screen_contracts,
    parse_todo_sections,
    repo_path,
    runtime_to_spec_code,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate generated mobile screen IR packages.")
    parser.add_argument("--screen", action="append", dest="screens", help="Spec source code such as APP_010. Repeatable.")
    parser.add_argument("--runtime-screen", action="append", dest="runtime_screens", help="Legacy runtime source code such as APP_009. Repeatable.")
    return parser.parse_args()


def read_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def expected_route_component(source_code: str, todo: dict[str, object], routes: dict[str, dict[str, str]], contracts: dict[str, dict[str, object]]) -> str:
    route = routes.get(todo["route"])
    if route:
        return route["component"]
    if source_code in contracts:
        return "GenericScreenPage"
    raise KeyError(f"missing route mapping for {source_code}")


def validate_screen(runtime_source_code: str, todos: dict[str, dict[str, object]], routes: dict[str, dict[str, str]], contracts: dict[str, dict[str, object]]) -> list[str]:
    errors: list[str] = []
    source_code = runtime_to_spec_code(runtime_source_code)
    package_root = OUTPUT_ROOT / "screens" / source_code
    required_paths = [
        package_root / "metadata.json",
        package_root / "requirements.json",
        package_root / "requirements.md",
        package_root / "provenance.json",
        package_root / "links.json",
    ]

    for path in required_paths:
        if not path.exists():
            errors.append(f"{source_code}: missing {path}")

    if errors:
        return errors

    todo = todos[runtime_source_code]
    metadata = read_json(package_root / "metadata.json")
    requirements = read_json(package_root / "requirements.json")
    provenance = read_json(package_root / "provenance.json")
    links = read_json(package_root / "links.json")
    guide = read_json(GUIDE_JSON)
    surface_ids = metadata["surface_ids"]
    guide_surfaces = {surface["surface_id"]: surface for surface in guide["surfaces"] if surface["surface_id"] in surface_ids}
    if len(guide_surfaces) != len(surface_ids):
        missing = [surface_id for surface_id in surface_ids if surface_id not in guide_surfaces]
        errors.append(f"{source_code}: guide surface missing for {missing}")
        return errors
    page_number = int(min(guide_surfaces[surface_id]["page_number"] for surface_id in surface_ids))
    for surface_id in surface_ids:
        for suffix in ("raw.png", "masked.png", "mask.json", "geometry.json"):
            path = package_root / "surfaces" / f"{surface_id}.{suffix}"
            if not path.exists():
                errors.append(f"{source_code}: missing {path}")
    for existing in (package_root / "surfaces").iterdir():
        if not existing.is_file():
            continue
        if existing.name.endswith((".raw.png", ".masked.png", ".mask.json", ".geometry.json")) and not any(
            existing.name.startswith(f"{surface_id}.") for surface_id in surface_ids
        ):
            errors.append(f"{source_code}: stale surface artifact {existing.name}")
    if errors:
        return errors

    if metadata["source_code"] != source_code:
        errors.append(f"{source_code}: metadata source_code mismatch")
    if metadata.get("runtime_source_code") != runtime_source_code:
        errors.append(f"{source_code}: metadata runtime_source_code mismatch")
    if metadata["screen_code"] != todo["screen_code"]:
        errors.append(f"{source_code}: metadata screen_code mismatch")
    if metadata["screen_name"] != todo["screen_name"]:
        errors.append(f"{source_code}: metadata screen_name mismatch")
    if metadata["primary_route"] != todo["route"]:
        errors.append(f"{source_code}: metadata route mismatch")
    if metadata["page_number"] != page_number:
        errors.append(f"{source_code}: metadata page number mismatch")
    if metadata["runtime_entry"]["component"] != expected_route_component(runtime_source_code, todo, routes, contracts):
        errors.append(f"{source_code}: runtime component mismatch")
    if metadata["runtime_entry"]["source"] != repo_path(APP_TSX):
        errors.append(f"{source_code}: runtime source mismatch")

    if requirements["source_code"] != source_code:
        errors.append(f"{source_code}: requirements source_code mismatch")
    if requirements.get("runtime_source_code") != runtime_source_code:
        errors.append(f"{source_code}: requirements runtime_source_code mismatch")
    if len(requirements["checklist_trace"]) != len(todo["checklist"]):
        errors.append(f"{source_code}: checklist trace count mismatch")

    if provenance["page_number"] != page_number:
        errors.append(f"{source_code}: provenance page number mismatch")
    if provenance.get("runtime_source_code") != runtime_source_code:
        errors.append(f"{source_code}: provenance runtime_source_code mismatch")
    if provenance["extractor_version"] != EXTRACTOR_VERSION:
        errors.append(f"{source_code}: extractor version mismatch")
    if provenance["source_spec_path"] != "sdd/01_planning/02_screen/mobile_screen_spec.pdf":
        errors.append(f"{source_code}: source spec path mismatch")
    if links["route_component"]["path"] != repo_path(APP_TSX):
        errors.append(f"{source_code}: route component path mismatch")
    contract_ref = links["screen_contract_ref"]
    if runtime_source_code in contracts:
        if contract_ref is None:
            errors.append(f"{source_code}: missing screen contract ref")
        elif contract_ref["path"] != repo_path(SCREEN_CONTRACTS):
            errors.append(f"{source_code}: screen contract path mismatch")
        elif contract_ref.get("runtime_source_code") != runtime_source_code:
            errors.append(f"{source_code}: screen contract runtime source mismatch")
    elif contract_ref is not None:
        errors.append(f"{source_code}: unexpected screen contract ref")

    for surface_id in surface_ids:
        raw_image = Image.open(package_root / "surfaces" / f"{surface_id}.raw.png")
        masked_image = Image.open(package_root / "surfaces" / f"{surface_id}.masked.png")
        geometry = read_json(package_root / "surfaces" / f"{surface_id}.geometry.json")
        guide_size = guide_surfaces[surface_id]["metrics"]["surface_size"]
        if raw_image.size != (guide_size["width"], guide_size["height"]):
            errors.append(f"{source_code}: {surface_id} raw size mismatch against guide surface_size")
        if masked_image.size != raw_image.size:
            errors.append(f"{source_code}: {surface_id} masked size mismatch")
        if geometry["viewport_box"]["width"] != raw_image.width or geometry["viewport_box"]["height"] != raw_image.height:
            errors.append(f"{source_code}: {surface_id} geometry viewport mismatch")
        preview_path = guide_surfaces[surface_id].get("preview_path")
        if preview_path:
            preview = Path(str(preview_path))
            if not preview.exists():
                errors.append(f"{source_code}: {surface_id} preview seed missing")
            else:
                preview_image = Image.open(preview).convert("RGBA")
                if preview_image.size != raw_image.size:
                    errors.append(f"{source_code}: {surface_id} preview size mismatch")
                elif ImageChops.difference(preview_image, raw_image.convert("RGBA")).getbbox() is not None:
                    errors.append(f"{source_code}: {surface_id} raw image differs from guide preview")

    return errors


def validate_registry(expected_runtime_screens: list[str]) -> list[str]:
    errors: list[str] = []
    registry = read_json(OUTPUT_ROOT / "registry.json")
    rows = registry.get("screens", [])
    expected_spec_screens = [runtime_to_spec_code(code) for code in expected_runtime_screens]
    if registry.get("scope") != "full":
        errors.append("registry: scope is not full")
    if registry.get("artifact_version") != EXTRACTOR_VERSION:
        errors.append("registry: artifact version mismatch")
    if len(rows) != len(expected_spec_screens):
        errors.append(f"registry: screen count mismatch {len(rows)} != {len(expected_spec_screens)}")
    ordered_source_codes = [row["source_code"] for row in rows]
    if ordered_source_codes != expected_spec_screens:
        errors.append("registry: source code ordering mismatch")
    ordered_runtime_codes = [row.get("runtime_source_code") for row in rows]
    if ordered_runtime_codes != expected_runtime_screens:
        errors.append("registry: runtime source code ordering mismatch")
    return errors


def main() -> None:
    args = parse_args()
    todos = parse_todo_sections()
    routes = parse_routes()
    contracts = parse_screen_contracts()
    screens = normalize_requested_runtime_screens(args.screens, args.runtime_screens, todos)
    full_registry_runtime_screens = [code for code in sorted(todos.keys()) if code != "APP_000"]
    errors = validate_registry(full_registry_runtime_screens) if not args.screens and not args.runtime_screens else []
    for runtime_source_code in screens:
        errors.extend(validate_screen(runtime_source_code, todos, routes, contracts))

    if errors:
        for error in errors:
            print(error)
        raise SystemExit(1)

    print("validation: pass")


if __name__ == "__main__":
    main()
