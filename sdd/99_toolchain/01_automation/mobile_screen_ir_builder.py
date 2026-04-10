from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[3]
PLANNING_ROOT = ROOT / "sdd/01_planning/02_screen"
OUTPUT_ROOT = PLANNING_ROOT / "ir/mobile"
GUIDE_JSON = PLANNING_ROOT / "guidelines/mobile/mobile_screen_design_guide.json"
APP_TSX = ROOT / "client/mobile/src/app/App.tsx"
SCREEN_SCREENS = ROOT / "client/mobile/src/lib/specScreens.json"
SCREEN_ROUTES = ROOT / "client/mobile/src/lib/specRouteCatalog.json"
EXTRACTOR_VERSION = "0.1.0"

SOURCE_REQUIREMENTS = {
    "/login": ["AUT-F001", "AUT-F002"],
    "/": ["FUL-F001", "FUL-F002"],
    "/fulfillment": ["FUL-F001", "FUL-F002"],
    "/shipping": ["SHP-F001", "SHP-F002", "SHP-F003"],
}

ROUTE_COMPONENTS = {
    "/login": "LoginPage",
    "/": "DashboardPage",
    "/fulfillment": "FulfillmentPage",
    "/shipping": "ShippingPage",
}


def repo_path(path: Path) -> str:
    return str(path.resolve())


def read_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build mobile screen IR packages from the canonical mobile spec.")
    parser.add_argument("--screen", action="append", dest="screens", help="Screen id such as TIN_001. Repeatable.")
    return parser.parse_args()


def load_screens() -> list[dict[str, object]]:
    screens = read_json(SCREEN_SCREENS)
    if not isinstance(screens, list):
        raise SystemExit("specScreens.json must contain a list")
    routes = read_json(SCREEN_ROUTES)
    if not isinstance(routes, list):
        raise SystemExit("specRouteCatalog.json must contain a list")

    route_map = {str(entry["id"]): str(entry["route"]) for entry in routes}
    screen_rows: list[dict[str, object]] = []
    for index, screen in enumerate(screens, start=1):
        screen_id = str(screen["id"])
        route = route_map.get(screen_id)
        if route is None:
            raise SystemExit(f"Missing route mapping for {screen_id}")
        if route not in ROUTE_COMPONENTS:
            raise SystemExit(f"Missing route component mapping for {route}")
        screen_rows.append(
            {
                "index": index,
                "source_code": screen_id,
                "screen_code": f"MOB-S{index:03d}",
                "screen_name": str(screen["title"]),
                "route": route,
                "surface_id": f"page-{index:03d}-surface-01",
                "route_component": ROUTE_COMPONENTS[route],
                "checklist_trace": SOURCE_REQUIREMENTS[route],
            }
        )
    return screen_rows


def build_package(screen: dict[str, object], guide: dict[str, object]) -> None:
    index = int(screen["index"])
    screen_id = str(screen["source_code"])
    package_root = OUTPUT_ROOT / "screens" / screen_id
    surface = next(
        (item for item in guide["surfaces"] if item["surface_id"] == screen["surface_id"]),
        None,
    )
    if surface is None:
        raise SystemExit(f"Missing design guide surface for {screen_id}")

    preview_path = Path(surface["preview_path"]).resolve()
    if not preview_path.exists():
        raise SystemExit(f"Missing design guide preview: {preview_path}")

    package_root.mkdir(parents=True, exist_ok=True)
    surfaces_root = package_root / "surfaces"
    surfaces_root.mkdir(parents=True, exist_ok=True)

    preview_image = Image.open(preview_path).convert("RGBA")
    raw_path = surfaces_root / f"{screen['surface_id']}.raw.png"
    masked_path = surfaces_root / f"{screen['surface_id']}.masked.png"
    preview_image.save(raw_path, format="PNG")
    preview_image.save(masked_path, format="PNG")

    geometry = {
        "viewport_box": {
            "left": 0,
            "top": 0,
            "width": preview_image.width,
            "height": preview_image.height,
        },
        "content_bbox": surface["content_bbox"],
    }
    (surfaces_root / f"{screen['surface_id']}.geometry.json").write_text(
        json.dumps(geometry, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (surfaces_root / f"{screen['surface_id']}.mask.json").write_text(
        json.dumps(
            {
                "mask_kind": "full_surface",
                "surface_size": {"width": preview_image.width, "height": preview_image.height},
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    metadata = {
        "source_code": screen_id,
        "screen_code": screen["screen_code"],
        "screen_name": screen["screen_name"],
        "primary_route": screen["route"],
        "page_number": index,
        "surface_ids": [screen["surface_id"]],
        "runtime_entry": {
            "component": screen["route_component"],
            "source": repo_path(APP_TSX),
        },
    }
    requirements = {
        "source_code": screen_id,
        "runtime_source_code": screen_id,
        "checklist_trace": [
            {
                "id": requirement_id,
                "route": screen["route"],
                "screen_code": screen["screen_code"],
            }
            for requirement_id in screen["checklist_trace"]
        ],
    }
    provenance = {
        "page_number": index,
        "runtime_source_code": screen_id,
        "extractor_version": EXTRACTOR_VERSION,
        "source_spec_path": "sdd/01_planning/02_screen/mobile_screen_spec.pdf",
        "source_guide_path": repo_path(GUIDE_JSON),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    links = {
        "route_component": {
            "path": repo_path(APP_TSX),
            "component": screen["route_component"],
        },
        "screen_contract_ref": None,
    }

    (package_root / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (package_root / "requirements.json").write_text(json.dumps(requirements, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (package_root / "requirements.md").write_text(
        "\n".join(
            [
                f"# {screen['screen_code']} requirements",
                "",
                f"- source code: `{screen_id}`",
                f"- route: `{screen['route']}`",
                f"- screen name: {screen['screen_name']}",
                "- checklist trace:",
                *[f"  - {req}" for req in screen["checklist_trace"]],
                "",
            ]
        ),
        encoding="utf-8",
    )
    (package_root / "provenance.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (package_root / "links.json").write_text(json.dumps(links, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    args = parse_args()
    screens = load_screens()
    if args.screens:
        selected = {screen_id for screen_id in args.screens}
        screens = [screen for screen in screens if screen["source_code"] in selected]

    guide = read_json(GUIDE_JSON)
    if not isinstance(guide, dict):
        raise SystemExit("mobile_screen_design_guide.json must contain a dict")

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    registry_rows: list[dict[str, object]] = []
    for screen in screens:
        build_package(screen, guide)
        registry_rows.append(
            {
                "source_code": screen["source_code"],
                "runtime_source_code": screen["source_code"],
                "screen_code": screen["screen_code"],
                "route": screen["route"],
                "page_number": int(screen["index"]),
            }
        )

    (OUTPUT_ROOT / "registry.json").write_text(
        json.dumps(
            {
                "scope": "full",
                "artifact_version": EXTRACTOR_VERSION,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "screens": registry_rows,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    (OUTPUT_ROOT / "README.md").write_text(
        "\n".join(
            [
                "# Mobile Screen IR",
                "",
                "- canonical source: `sdd/01_planning/02_screen/mobile_screen_spec.pdf`",
                "- current state: generated from `client/mobile/src/lib/specScreens.json` and `specRouteCatalog.json`",
                "- output root: `sdd/01_planning/02_screen/ir/mobile/`",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print(OUTPUT_ROOT / "registry.json")


if __name__ == "__main__":
    main()
