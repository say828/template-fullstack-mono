from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageChops

from mobile_screen_ir_builder import (
    APP_TSX,
    EXTRACTOR_VERSION,
    GUIDE_JSON,
    OUTPUT_ROOT,
    load_screens,
    repo_path,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate generated mobile screen IR packages.")
    parser.add_argument("--screen", action="append", dest="screens", help="Screen id such as TIN_001. Repeatable.")
    return parser.parse_args()


def read_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_screen(screen: dict[str, object], guide: dict[str, object]) -> list[str]:
    errors: list[str] = []
    screen_id = str(screen["source_code"])
    package_root = OUTPUT_ROOT / "screens" / screen_id
    required_paths = [
        package_root / "metadata.json",
        package_root / "requirements.json",
        package_root / "requirements.md",
        package_root / "provenance.json",
        package_root / "links.json",
    ]
    for path in required_paths:
        if not path.exists():
            errors.append(f"{screen_id}: missing {path}")
    if errors:
        return errors

    metadata = read_json(package_root / "metadata.json")
    requirements = read_json(package_root / "requirements.json")
    provenance = read_json(package_root / "provenance.json")
    links = read_json(package_root / "links.json")
    surface = next((item for item in guide["surfaces"] if item["surface_id"] == screen["surface_id"]), None)
    if surface is None:
        errors.append(f"{screen_id}: missing guide surface {screen['surface_id']}")
        return errors

    surface_root = package_root / "surfaces"
    raw_path = surface_root / f"{screen['surface_id']}.raw.png"
    masked_path = surface_root / f"{screen['surface_id']}.masked.png"
    geometry_path = surface_root / f"{screen['surface_id']}.geometry.json"
    mask_path = surface_root / f"{screen['surface_id']}.mask.json"
    for path in (raw_path, masked_path, geometry_path, mask_path):
        if not path.exists():
            errors.append(f"{screen_id}: missing {path}")
    if errors:
        return errors

    raw_image = Image.open(raw_path)
    masked_image = Image.open(masked_path)
    geometry = read_json(geometry_path)
    if metadata["source_code"] != screen_id:
        errors.append(f"{screen_id}: metadata source_code mismatch")
    if metadata["screen_code"] != screen["screen_code"]:
        errors.append(f"{screen_id}: metadata screen_code mismatch")
    if metadata["screen_name"] != screen["screen_name"]:
        errors.append(f"{screen_id}: metadata screen_name mismatch")
    if metadata["primary_route"] != screen["route"]:
        errors.append(f"{screen_id}: metadata route mismatch")
    if metadata["page_number"] != screen["index"]:
        errors.append(f"{screen_id}: metadata page mismatch")
    if metadata["runtime_entry"]["component"] != screen["route_component"]:
        errors.append(f"{screen_id}: runtime component mismatch")
    if metadata["runtime_entry"]["source"] != repo_path(APP_TSX):
        errors.append(f"{screen_id}: runtime source mismatch")
    if requirements["source_code"] != screen_id:
        errors.append(f"{screen_id}: requirements source_code mismatch")
    if requirements["runtime_source_code"] != screen_id:
        errors.append(f"{screen_id}: requirements runtime_source_code mismatch")
    if len(requirements["checklist_trace"]) != len(screen["checklist_trace"]):
        errors.append(f"{screen_id}: checklist trace count mismatch")
    if provenance["extractor_version"] != EXTRACTOR_VERSION:
        errors.append(f"{screen_id}: extractor version mismatch")
    if provenance["source_spec_path"] != "sdd/01_planning/02_screen/mobile_screen_spec.pdf":
        errors.append(f"{screen_id}: source spec path mismatch")
    if provenance["source_guide_path"] != repo_path(GUIDE_JSON):
        errors.append(f"{screen_id}: guide path mismatch")
    if links["route_component"]["path"] != repo_path(APP_TSX):
        errors.append(f"{screen_id}: route component path mismatch")
    if links["screen_contract_ref"] is not None:
        errors.append(f"{screen_id}: unexpected screen contract ref")
    if raw_image.size != (surface["metrics"]["surface_size"]["width"], surface["metrics"]["surface_size"]["height"]):
        errors.append(f"{screen_id}: raw size mismatch against guide surface")
    if masked_image.size != raw_image.size:
        errors.append(f"{screen_id}: masked size mismatch")
    if geometry["viewport_box"]["width"] != raw_image.width or geometry["viewport_box"]["height"] != raw_image.height:
        errors.append(f"{screen_id}: geometry viewport mismatch")
    preview_path = Path(surface["preview_path"])
    if preview_path.exists():
        preview_image = Image.open(preview_path)
        if ImageChops.difference(preview_image.convert("RGBA"), raw_image.convert("RGBA")).getbbox() is not None:
            errors.append(f"{screen_id}: raw image differs from guide preview")
    return errors


def validate_registry(expected_screens: list[dict[str, object]]) -> list[str]:
    errors: list[str] = []
    registry = read_json(OUTPUT_ROOT / "registry.json")
    rows = registry.get("screens", [])
    expected_source_codes = [screen["source_code"] for screen in expected_screens]
    if registry.get("scope") != "full":
        errors.append("registry: scope is not full")
    if registry.get("artifact_version") != EXTRACTOR_VERSION:
        errors.append("registry: artifact version mismatch")
    if len(rows) != len(expected_screens):
        errors.append("registry: screen count mismatch")
    if [row.get("source_code") for row in rows] != expected_source_codes:
        errors.append("registry: source code ordering mismatch")
    if [row.get("runtime_source_code") for row in rows] != expected_source_codes:
        errors.append("registry: runtime source code ordering mismatch")
    return errors


def main() -> None:
    args = parse_args()
    screens = load_screens()
    if args.screens:
        selected = set(args.screens)
        screens = [screen for screen in screens if screen["source_code"] in selected]
    guide = read_json(GUIDE_JSON)
    if not isinstance(guide, dict):
        raise SystemExit("mobile_screen_design_guide.json must contain a dict")

    errors = validate_registry(screens)
    for screen in screens:
        errors.extend(validate_screen(screen, guide))

    if errors:
        for error in errors:
            print(error)
        raise SystemExit(1)

    print("validation: pass")


if __name__ == "__main__":
    main()
