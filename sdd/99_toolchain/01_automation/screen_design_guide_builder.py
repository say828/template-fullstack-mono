from __future__ import annotations

import argparse
import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence

from PIL import Image, ImageChops

from spec_source_runtime import load_image, load_pdf_page


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build screen design guidelines from a canonical screen spec PDF.")
    parser.add_argument("--manifest", required=True, help="Path to the Python config manifest.")
    parser.add_argument("--config-var", default="GUIDE_CONFIG", help="Manifest variable name that contains the config dict.")
    parser.add_argument("--page", action="append", dest="pages", type=int, help="Page number to analyze. Repeatable.")
    parser.add_argument("--emit-previews", action="store_true", help="Write detected surface preview crops.")
    parser.add_argument("--list-pages", action="store_true", help="List the configured page range and exit.")
    return parser.parse_args(argv)


def load_manifest(manifest_path: Path, config_var: str) -> dict[str, Any]:
    spec = importlib.util.spec_from_file_location("screen_design_guide_manifest", manifest_path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Unable to load manifest: {manifest_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    config = getattr(module, config_var, None)
    if config is None:
        raise SystemExit(f"Manifest {manifest_path} does not define {config_var}")
    if not isinstance(config, dict):
        raise SystemExit(f"{config_var} in {manifest_path} must be a dict")
    return config


def resolve_pages(config: dict[str, Any], selected_pages: Sequence[int] | None) -> list[int]:
    if selected_pages:
        return sorted(dict.fromkeys(int(page) for page in selected_pages))

    if config.get("pages"):
        return sorted(dict.fromkeys(int(page) for page in config["pages"]))

    start = int(config.get("page_start", 1))
    end = int(config["page_end"])
    return list(range(start, end + 1))


def find_content_bbox(image: Image.Image, *, threshold: int = 245, padding: int = 12) -> tuple[int, int, int, int]:
    rgb = image.convert("RGB")
    background = Image.new("RGB", rgb.size, (255, 255, 255))
    diff = ImageChops.difference(rgb, background)
    bbox = diff.getbbox()
    if bbox is None:
        return (0, 0, rgb.width, rgb.height)

    left, top, right, bottom = bbox
    return (
        max(0, left - padding),
        max(0, top - padding),
        min(rgb.width, right + padding),
        min(rgb.height, bottom + padding),
    )


def build_markdown(config: dict[str, Any], surfaces: list[dict[str, Any]]) -> str:
    lines = [
        f"# {config['service']} screen design guide",
        "",
        "## Current Scope",
        "",
        f"- spec pdf: `{config['spec_pdf_display']}`",
        f"- pages: {config['page_start']}..{config['page_end']}",
        f"- output json: `{config['output_json']}`",
        f"- output markdown: `{config['output_markdown']}`",
        "",
        "## Surfaces",
        "",
    ]
    for surface in surfaces:
        size = surface["metrics"]["surface_size"]
        lines.extend(
            [
                f"### {surface['surface_id']} (page {surface['page_number']})",
                "",
                f"- preview: `{surface.get('preview_path', '')}`",
                f"- surface size: {size['width']}x{size['height']}",
                f"- content bbox: {surface['content_bbox']}",
                "",
            ]
        )
    return "\n".join(lines).rstrip() + "\n"


def main(argv: Sequence[str] | None = None) -> None:
    args = parse_args(argv)
    manifest_path = Path(args.manifest).resolve()
    config = load_manifest(manifest_path, args.config_var)
    pages = resolve_pages(config, args.pages)
    spec_pdf = Path(config["spec_pdf"]).resolve()
    preview_dir = Path(config["preview_dir"]).resolve()
    preview_dir.mkdir(parents=True, exist_ok=True)

    if args.list_pages:
        for page in pages:
            print(page)
        return

    surfaces: list[dict[str, Any]] = []
    for page in pages:
        page_image = load_pdf_page(spec_pdf, page, int(config["dpi"]))
        bbox = find_content_bbox(page_image)
        surface_id = f"page-{page:03d}-surface-01"
        preview_path = preview_dir / f"{surface_id}.png"
        preview_image = page_image.crop(bbox)
        if args.emit_previews:
            preview_image.save(preview_path, format="PNG")
        surface = {
            "page_number": page,
            "surface_id": surface_id,
            "preview_path": str(preview_path),
            "content_bbox": {
                "left": bbox[0],
                "top": bbox[1],
                "right": bbox[2],
                "bottom": bbox[3],
            },
            "metrics": {
                "surface_size": {
                    "width": preview_image.width,
                    "height": preview_image.height,
                },
            },
        }
        surfaces.append(surface)

    output_json = Path(config["output_json"]).resolve()
    output_markdown = Path(config["output_markdown"]).resolve()
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(
        json.dumps(
            {
                "service": config["service"],
                "spec_pdf": config["spec_pdf_display"],
                "page_start": int(config["page_start"]),
                "page_end": int(config["page_end"]),
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "surfaces": surfaces,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    output_markdown.write_text(build_markdown(config, surfaces), encoding="utf-8")
    print(output_json)
    print(output_markdown)


if __name__ == "__main__":
    main()
