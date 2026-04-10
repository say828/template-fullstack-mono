from __future__ import annotations

import argparse
import atexit
import shutil
import subprocess
import tempfile
import textwrap
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont

from screen_spec_manifest import ROOT, SCREEN_MANIFESTS


FONT_PATH = "NotoSansCJK-Regular.ttc"
PAGE_SIZE = (2400, 1500)
BG = "#f3f4f6"
TEXT = "#111827"
MUTED = "#6b7280"
BORDER = "#d1d5db"
PANEL = "#ffffff"
PINK = "#ec4899"
HEADER_FILL = "#e5e7eb"
FIRST_INDEX_ROWS = 8
NEXT_INDEX_ROWS = 12
PDF_TEMP_DIR = Path(tempfile.mkdtemp(prefix="templates-screen-spec-"))
PDF_CACHE: dict[tuple[str, int, int], Path] = {}


def cleanup_tempdir() -> None:
    shutil.rmtree(PDF_TEMP_DIR, ignore_errors=True)


atexit.register(cleanup_tempdir)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    index = 1 if bold else 0
    return ImageFont.truetype(FONT_PATH, size=size, index=index)


def wrap(text: str, width: int) -> list[str]:
    return textwrap.wrap(text, width=width, break_long_words=False, break_on_hyphens=False) or [text]


def parse_viewport_size(value: str) -> tuple[int, int]:
    width, height = value.lower().split("x", 1)
    return int(width), int(height)


def fit_image(image: Image.Image, width: int, height: int) -> tuple[Image.Image, tuple[int, int]]:
    source = image.copy()
    source.thumbnail((width, height))
    x = (width - source.width) // 2
    y = (height - source.height) // 2
    return source, (x, y)


def trim_background(image: Image.Image) -> Image.Image:
    background = Image.new(image.mode, image.size, image.getpixel((0, 0)))
    diff = ImageChops.difference(image, background)
    bbox = diff.getbbox()
    if not bbox:
        return image

    left, top, right, bottom = bbox
    padding = 12
    return image.crop(
        (
            max(0, left - padding),
            max(0, top - padding),
            min(image.width, right + padding),
            min(image.height, bottom + padding),
        )
    )


def trim_dark_border(image: Image.Image, threshold: int = 12) -> Image.Image:
    grayscale = image.convert("L")
    mask = grayscale.point(lambda value: 255 if value > threshold else 0)
    bbox = mask.getbbox()
    if not bbox:
        return image
    return image.crop(bbox)


def resolve_path(path: str | Path) -> Path:
    candidate = Path(path)
    if candidate.is_absolute():
        return candidate
    return ROOT / candidate


def transform_callouts_for_crop(
    callouts: list[tuple[tuple[float, float], str, str]],
    image_size: tuple[int, int],
    crop_box: tuple[int, int, int, int],
) -> list[tuple[tuple[float, float], str, str]]:
    image_width, image_height = image_size
    left, top, right, bottom = crop_box
    crop_width = right - left
    crop_height = bottom - top
    transformed: list[tuple[tuple[float, float], str, str]] = []

    for anchor, title, desc in callouts:
        px = anchor[0] * image_width
        py = anchor[1] * image_height
        if left <= px <= right and top <= py <= bottom:
            transformed.append((((px - left) / crop_width, (py - top) / crop_height), title, desc))

    return transformed


def auto_split_tall_screen(service_config: dict, screen: dict, screenshot: Image.Image) -> list[dict]:
    capture_policy = service_config.get("capture_policy") or {}
    viewport_width, viewport_height = parse_viewport_size(capture_policy.get("default_viewport", "1690x940"))
    segment_height = round(screenshot.width * viewport_height / viewport_width)
    if segment_height <= 0 or segment_height >= screenshot.height:
        return [screen]

    slices: list[tuple[int, int]] = []
    for anchor, _, _ in screen["callouts"]:
        center_y = round(anchor[1] * screenshot.height)
        top = max(0, min(center_y - segment_height // 2, screenshot.height - segment_height))
        bottom = min(screenshot.height, top + segment_height)
        if bottom - top < segment_height:
            top = max(0, bottom - segment_height)
        if slices and top <= slices[-1][1] - 120:
            prev_top, prev_bottom = slices[-1]
            slices[-1] = (prev_top, max(prev_bottom, bottom))
        else:
            slices.append((top, bottom))

    expanded: list[dict] = []
    total = len(slices)
    for index, (top, bottom) in enumerate(slices, start=1):
        crop_box = (0, top, screenshot.width, bottom)
        transformed_callouts = transform_callouts_for_crop(screen["callouts"], screenshot.size, crop_box)
        if not transformed_callouts:
            continue
        detail_screen = dict(screen)
        detail_screen["name"] = f"{screen['name']} ({index}/{total})"
        detail_screen["__image"] = screenshot.crop(crop_box)
        detail_screen["callouts"] = transformed_callouts
        expanded.append(detail_screen)

    return expanded or [screen]


def chunk_screens(screens: list[dict]) -> list[list[dict]]:
    chunks: list[list[dict]] = []
    first = FIRST_INDEX_ROWS if screens else 0
    if first:
        chunks.append(screens[:first])
    rest = screens[first:]
    while rest:
        chunks.append(rest[:NEXT_INDEX_ROWS])
        rest = rest[NEXT_INDEX_ROWS:]
    return chunks or [[]]


def draw_table_pages(config: dict) -> list[Image.Image]:
    pages: list[Image.Image] = []
    screen_chunks = chunk_screens(config["screens"])

    for page_index, chunk in enumerate(screen_chunks, start=1):
        page = Image.new("RGB", PAGE_SIZE, BG)
        draw = ImageDraw.Draw(page)
        draw.rounded_rectangle((50, 40, PAGE_SIZE[0] - 50, PAGE_SIZE[1] - 40), radius=28, fill=PANEL, outline=BORDER, width=2)

        title = config["title"]
        if len(screen_chunks) > 1:
            title = f"{title} ({page_index}/{len(screen_chunks)})"
        draw.text((100, 84), title, font=font(56, bold=True), fill=TEXT)
        meta_y = 166
        draw.text((100, meta_y), "문서 상태: current", font=font(26), fill=MUTED)
        draw.text((392, meta_y), "작성 버전: 1.0.0", font=font(26), fill=MUTED)
        draw.text((704, meta_y), f"대상 서비스: {config['service_label']}", font=font(26), fill=MUTED)

        top = 240
        if page_index == 1 and config.get("source_refs"):
            draw.text((100, 226), "기준 산출물", font=font(28, bold=True), fill=TEXT)
            ref_y = 268
            for ref in config["source_refs"]:
                label = ref.get("label", "source")
                path = ref.get("path", "")
                for line_index, line in enumerate(wrap(f"- {label}: {path}", 84)):
                    prefix = "" if line_index == 0 else "  "
                    draw.text((120, ref_y), f"{prefix}{line}", font=font(22), fill=MUTED)
                    ref_y += 28
            top = max(top, ref_y + 24)

        left = 100
        right = PAGE_SIZE[0] - 100
        columns = [
            ("화면코드", 300),
            ("화면명", 500),
            ("주요 경로", 340),
            ("관련 기능", right - left - 300 - 500 - 340),
        ]

        x = left
        for label, width in columns:
            draw.rectangle((x, top, x + width, top + 72), fill=HEADER_FILL, outline=BORDER)
            draw.text((x + 16, top + 18), label, font=font(28, bold=True), fill=TEXT)
            x += width

        y = top + 72
        for item in chunk:
            x = left
            values = [item["code"], item["name"], item["route"], ", ".join(item["features"])]
            row_height = 84
            for idx, (_, width) in enumerate(columns):
                draw.rectangle((x, y, x + width, y + row_height), fill=PANEL, outline=BORDER)
                wrapped = wrap(values[idx], 16 if idx < 3 else 24)
                ty = y + 12
                for line in wrapped[:2]:
                    draw.text((x + 16, ty), line, font=font(22), fill=TEXT)
                    ty += 28
                x += width
            y += row_height

        if page_index == len(screen_chunks):
            draw.text((100, PAGE_SIZE[1] - 100), config["cover_note"], font=font(24), fill=MUTED)
        pages.append(page)

    return pages


def draw_callout(draw: ImageDraw.ImageDraw, x: int, y: int, label: int) -> None:
    radius = 30
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=PINK, outline="#ffffff", width=4)
    draw.text((x, y), str(label), font=font(30, bold=True), fill="#ffffff", anchor="mm")


def extract_pdf_page(source_path: Path, page: int, dpi: int) -> Path:
    key = (str(source_path), page, dpi)
    if key in PDF_CACHE:
        return PDF_CACHE[key]

    output_prefix = PDF_TEMP_DIR / f"{source_path.stem}-p{page}-{dpi}"
    subprocess.run(
        [
            "pdftoppm",
            "-png",
            "-r",
            str(dpi),
            "-f",
            str(page),
            "-l",
            str(page),
            str(source_path),
            str(output_prefix),
        ],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    candidates = sorted(output_prefix.parent.glob(f"{output_prefix.name}-*.png"))
    if not candidates:
        raise FileNotFoundError(f"failed to extract page {page} from {source_path}")
    output_path = candidates[0]
    PDF_CACHE[key] = output_path
    return output_path


def load_screen_image(service_config: dict, screen: dict) -> Image.Image:
    if "__image" in screen:
        return screen["__image"].copy()

    asset_path: Path
    source = screen.get("source")
    if source:
        source_type = source["type"]
        if source_type == "pdf_page":
            source_path = resolve_path(source["path"])
            asset_path = extract_pdf_page(source_path, int(source["page"]), int(source.get("dpi", 144)))
        elif source_type == "image":
            asset_path = resolve_path(source["path"])
        else:
            raise ValueError(f"unsupported source type: {source_type}")
    else:
        asset_dir = resolve_path(service_config["asset_dir"])
        asset_path = asset_dir / screen["asset"]

    if not asset_path.exists():
        raise FileNotFoundError(f"missing source asset: {asset_path}")

    screenshot = Image.open(asset_path).convert("RGB")
    crop_box = screen.get("crop_box")
    if crop_box:
        left, top, right, bottom = crop_box
        bounded_crop = (
            max(0, min(int(left), screenshot.width)),
            max(0, min(int(top), screenshot.height)),
            max(0, min(int(right), screenshot.width)),
            max(0, min(int(bottom), screenshot.height)),
        )
        if bounded_crop[2] > bounded_crop[0] and bounded_crop[3] > bounded_crop[1]:
            screenshot = screenshot.crop(bounded_crop)

    if source and source["type"] == "pdf_page":
        screenshot = trim_dark_border(screenshot)
    if service_config.get("trim_background"):
        screenshot = trim_background(screenshot)
    return screenshot


def draw_detail_page(service_config: dict, screen: dict) -> Image.Image:
    page = Image.new("RGB", PAGE_SIZE, BG)
    draw = ImageDraw.Draw(page)
    draw.text((60, 46), f"{screen['code']}  {screen['name']}", font=font(48, bold=True), fill=TEXT)
    draw.text((60, 112), f"경로: {screen['route']}", font=font(24), fill=MUTED)
    draw.text((300, 112), f"접근: {screen['access']}", font=font(24), fill=MUTED)
    draw.text((510, 112), f"관련 기능: {', '.join(screen['features'])}", font=font(24), fill=MUTED)

    screenshot = load_screen_image(service_config, screen)
    image_region = (50, 170, 1560, 1420)
    max_inner_width = image_region[2] - image_region[0] - 50
    max_inner_height = image_region[3] - image_region[1] - 50
    screenshot_fit, _ = fit_image(screenshot, max_inner_width, max_inner_height)

    panel_width = screenshot_fit.width + 50
    panel_height = screenshot_fit.height + 50
    image_panel = (
        image_region[0] + (image_region[2] - image_region[0] - panel_width) // 2,
        image_region[1] + (image_region[3] - image_region[1] - panel_height) // 2,
        image_region[0] + (image_region[2] - image_region[0] - panel_width) // 2 + panel_width,
        image_region[1] + (image_region[3] - image_region[1] - panel_height) // 2 + panel_height,
    )
    table_panel = (1600, 170, 2340, 1420)
    draw.rounded_rectangle(image_panel, radius=28, fill=PANEL, outline=BORDER, width=2)
    draw.rounded_rectangle(table_panel, radius=28, fill=PANEL, outline=BORDER, width=2)

    screenshot_x = image_panel[0] + 25
    screenshot_y = image_panel[1] + 25
    page.paste(screenshot_fit, (screenshot_x, screenshot_y))

    overlay = ImageDraw.Draw(page)
    for idx, (anchor, _, _) in enumerate(screen["callouts"], start=1):
        callout_x = int(screenshot_x + screenshot_fit.width * anchor[0])
        callout_y = int(screenshot_y + screenshot_fit.height * anchor[1])
        draw_callout(overlay, callout_x, callout_y, idx)

    header_height = 76
    draw.rectangle((table_panel[0], table_panel[1], table_panel[2], table_panel[1] + header_height), fill=HEADER_FILL, outline=BORDER)
    draw.text((table_panel[0] + 20, table_panel[1] + 20), "화면명", font=font(28, bold=True), fill=TEXT)
    draw.text((table_panel[0] + 170, table_panel[1] + 20), f"{screen['name']} ({screen['code']})", font=font(28, bold=True), fill=TEXT)

    left_col = 96
    row_y = table_panel[1] + header_height
    for idx, (_, title, desc) in enumerate(screen["callouts"], start=1):
        lines = wrap(desc, 22)
        row_height = 56 + max(1, len(lines)) * 36
        draw.rectangle((table_panel[0], row_y, table_panel[0] + left_col, row_y + row_height), fill=PANEL, outline=BORDER)
        draw.rectangle((table_panel[0] + left_col, row_y, table_panel[2], row_y + row_height), fill=PANEL, outline=BORDER)
        draw.text((table_panel[0] + left_col / 2, row_y + row_height / 2), str(idx), font=font(28, bold=True), fill=TEXT, anchor="mm")
        draw.text((table_panel[0] + left_col + 18, row_y + 14), title, font=font(28, bold=True), fill=TEXT)
        text_y = row_y + 54
        for line_index, line in enumerate(lines):
            prefix = "- " if line_index == 0 else "  "
            draw.text((table_panel[0] + left_col + 18, text_y), f"{prefix}{line}", font=font(24), fill=TEXT)
            text_y += 34
        row_y += row_height

    return page


def iter_detail_screens(screen: dict) -> list[dict]:
    segments = screen.get("segments")
    if not segments:
        return [screen]

    expanded: list[dict] = []
    for segment in segments:
        detail_screen = dict(screen)
        detail_screen["name"] = f"{screen['name']} ({segment['label']})"
        detail_screen["crop_box"] = segment["crop_box"]
        detail_screen["callouts"] = segment["callouts"]
        expanded.append(detail_screen)
    return expanded


def expand_detail_screens(service_config: dict, screen: dict) -> list[dict]:
    explicit_segments = iter_detail_screens(screen)
    if len(explicit_segments) > 1 or screen.get("segments"):
        return explicit_segments

    screenshot = load_screen_image(service_config, screen)
    if screenshot.height > screenshot.width:
        return auto_split_tall_screen(service_config, screen, screenshot)
    return [screen]


def build_service(service: str) -> Path:
    config = SCREEN_MANIFESTS[service]
    pages = draw_table_pages(config)
    for screen in config["screens"]:
        for detail_screen in expand_detail_screens(config, screen):
            pages.append(draw_detail_page(config, detail_screen))

    output = resolve_path(config["output"])
    output.parent.mkdir(parents=True, exist_ok=True)
    first, *rest = pages
    first.save(output, "PDF", resolution=220.0, save_all=True, append_images=rest)
    return output


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build screen spec PDFs from the manifest-defined capture assets.")
    parser.add_argument("--service", default="all", choices=["all", *sorted(SCREEN_MANIFESTS.keys())], help="Build a single service or all services.")
    parser.add_argument("--all", action="store_true", help="Build all supported service screen spec PDFs.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    targets = sorted(SCREEN_MANIFESTS.keys()) if args.all or args.service == "all" else [args.service]
    for service in targets:
        output = build_service(service)
        print(output)


if __name__ == "__main__":
    main()
