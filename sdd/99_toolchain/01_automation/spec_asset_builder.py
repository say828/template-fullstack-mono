from __future__ import annotations

import argparse
import atexit
import base64
import importlib.util
import re
import shutil
import subprocess
import tempfile
from io import BytesIO
from pathlib import Path
from typing import Sequence

from PIL import Image, ImageChops


TEMP_DIR = Path(tempfile.mkdtemp(prefix="spec-asset-builder-"))
PAGE_CACHE: dict[tuple[str, int, int], Image.Image] = {}
SVG_IMAGE_HREF_PATTERN = re.compile(r'href="data:image/png;base64,([^"]+)"')


def cleanup_tempdir() -> None:
    shutil.rmtree(TEMP_DIR, ignore_errors=True)


atexit.register(cleanup_tempdir)


def parse_args(
    argv: Sequence[str] | None = None,
    *,
    default_manifest: Path | None = None,
    default_recipes_var: str = "ASSET_RECIPES",
) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build static design assets from a recipe manifest.")
    parser.add_argument("--manifest", default=str(default_manifest) if default_manifest else None, help="Path to the Python recipe manifest.")
    parser.add_argument("--recipes-var", default=default_recipes_var, help="Manifest variable name that contains the recipe list.")
    parser.add_argument("--asset", action="append", dest="assets", help="Asset id to build. Repeatable. Default builds all assets.")
    parser.add_argument("--list", action="store_true", help="List available asset ids and exit.")
    parser.add_argument("--verify-exact", action="store_true", help="Verify that each generated output is pixel-identical to the resolved source crop.")
    args = parser.parse_args(argv)

    if not args.manifest:
        parser.error("--manifest is required")

    return args


def load_manifest(manifest_path: Path, recipes_var: str) -> list[dict]:
    spec = importlib.util.spec_from_file_location("asset_recipe_manifest", manifest_path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Unable to load manifest: {manifest_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    recipes = getattr(module, recipes_var, None)
    if recipes is None:
        raise SystemExit(f"Manifest {manifest_path} does not define {recipes_var}")
    if not isinstance(recipes, list):
        raise SystemExit(f"{recipes_var} in {manifest_path} must be a list")
    return recipes


def load_pdf_page(path: Path, page: int, dpi: int) -> Image.Image:
    key = (str(path), page, dpi)
    cached = PAGE_CACHE.get(key)
    if cached is not None:
        return cached.copy()

    output_prefix = TEMP_DIR / f"{path.stem}-p{page}-{dpi}"
    subprocess.run(
        [
            "pdftoppm",
            "-png",
            "-singlefile",
            "-f",
            str(page),
            "-l",
            str(page),
            "-r",
            str(dpi),
            str(path),
            str(output_prefix),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    image = Image.open(output_prefix.with_suffix(".png")).convert("RGBA")
    PAGE_CACHE[key] = image.copy()
    return image


def load_image(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def resolve_source(source: dict) -> Image.Image:
    kind = source["kind"]
    if kind == "pdf_page":
        return load_pdf_page(Path(source["path"]), int(source["page"]), int(source["dpi"]))
    if kind == "image":
        return load_image(Path(source["path"]))
    raise ValueError(f"Unsupported source kind: {kind}")


def make_white_transparent(image: Image.Image, threshold: int) -> Image.Image:
    converted = image.convert("RGBA")
    pixels = []
    for red, green, blue, alpha in converted.getdata():
        if alpha and red >= threshold and green >= threshold and blue >= threshold:
            pixels.append((255, 255, 255, 0))
        else:
            pixels.append((red, green, blue, alpha))
    converted.putdata(pixels)
    return converted


def transform_image(image: Image.Image, recipe: dict) -> Image.Image:
    working = image.copy()

    crop_box = recipe.get("crop_box")
    if crop_box is not None:
        working = working.crop(tuple(crop_box))

    threshold = recipe.get("transparent_white_threshold")
    if threshold is not None:
        working = make_white_transparent(working, int(threshold))

    if recipe.get("trim"):
        bbox = working.getbbox()
        if not bbox:
            raise ValueError(f"Recipe {recipe['id']} trimmed to empty image")
        working = working.crop(bbox)

    return working


def encode_svg(image: Image.Image) -> str:
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    payload = base64.b64encode(buffer.getvalue()).decode("ascii")
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{image.width}" height="{image.height}" '
        f'viewBox="0 0 {image.width} {image.height}" fill="none" role="img" aria-hidden="true">\n'
        f'  <image width="{image.width}" height="{image.height}" href="data:image/png;base64,{payload}" />\n'
        "</svg>\n"
    )


def write_output(image: Image.Image, output_path: Path, output_format: str) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_format == "svg":
        output_path.write_text(encode_svg(image), encoding="utf-8")
        return
    if output_format == "png":
        image.save(output_path, format="PNG")
        return
    raise ValueError(f"Unsupported output format: {output_format}")


def read_output_image(output_path: Path, output_format: str) -> Image.Image:
    if output_format == "png":
        return Image.open(output_path).convert("RGBA")
    if output_format == "svg":
        raw = output_path.read_text(encoding="utf-8")
        matched = SVG_IMAGE_HREF_PATTERN.search(raw)
        if not matched:
            raise ValueError(f"Unable to decode embedded PNG from {output_path}")
        buffer = BytesIO(base64.b64decode(matched.group(1)))
        return Image.open(buffer).convert("RGBA")
    raise ValueError(f"Unsupported output format: {output_format}")


def verify_exact_output(output_path: Path, output_format: str, expected_image: Image.Image) -> None:
    actual = read_output_image(output_path, output_format)
    expected = expected_image.convert("RGBA")

    if actual.size != expected.size:
        raise SystemExit(f"Exact verification failed for {output_path}: size mismatch {actual.size} != {expected.size}")

    if ImageChops.difference(actual, expected).getbbox() is not None:
        raise SystemExit(f"Exact verification failed for {output_path}: pixel mismatch")


def infer_output_format(recipe: dict, output_path: Path) -> str:
    if recipe.get("output_format"):
        return str(recipe["output_format"])
    if output_path.suffix.lower() == ".png":
        return "png"
    return "svg"


def emit_recipe(
    recipe: dict,
    *,
    source_image: Image.Image | None = None,
    selected_assets: set[str] | None = None,
    verify_exact: bool = False,
) -> list[Path]:
    source = source_image if source_image is not None else resolve_source(recipe["source"])
    rendered = transform_image(source, recipe)
    written: list[Path] = []

    output = recipe.get("output")
    if output is not None and (selected_assets is None or recipe["id"] in selected_assets):
        output_path = Path(output)
        output_format = infer_output_format(recipe, output_path)
        write_output(rendered, output_path, output_format)
        if verify_exact:
            verify_exact_output(output_path, output_format, rendered)
        written.append(output_path)

    for child in recipe.get("children", []):
        written.extend(
            emit_recipe(
                child,
                source_image=rendered,
                selected_assets=selected_assets,
                verify_exact=verify_exact,
            )
        )

    return written


def collect_asset_ids(recipes: list[dict]) -> list[str]:
    asset_ids: list[str] = []
    for recipe in recipes:
        if recipe.get("output") is not None:
            asset_ids.append(recipe["id"])
        asset_ids.extend(collect_asset_ids(recipe.get("children", [])))
    return asset_ids


def main(
    argv: Sequence[str] | None = None,
    *,
    default_manifest: Path | None = None,
    default_recipes_var: str = "ASSET_RECIPES",
) -> None:
    args = parse_args(argv, default_manifest=default_manifest, default_recipes_var=default_recipes_var)
    manifest_path = Path(args.manifest).resolve()
    recipes = load_manifest(manifest_path, args.recipes_var)
    asset_ids = collect_asset_ids(recipes)

    if args.list:
        for asset_id in asset_ids:
            print(asset_id)
        return

    selected_assets = set(args.assets) if args.assets else None
    if selected_assets is not None:
        unknown = sorted(selected_assets.difference(asset_ids))
        if unknown:
            raise SystemExit(f"Unknown asset ids: {', '.join(unknown)}")

    written: list[Path] = []
    for recipe in recipes:
        written.extend(
            emit_recipe(
                recipe,
                selected_assets=selected_assets,
                verify_exact=args.verify_exact,
            )
        )

    for path in written:
        print(path)


if __name__ == "__main__":
    main()
