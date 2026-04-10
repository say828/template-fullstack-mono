from __future__ import annotations

import atexit
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image


TEMP_DIR = Path(tempfile.mkdtemp(prefix="spec-source-runtime-"))
PAGE_CACHE: dict[tuple[str, int, int], Image.Image] = {}


def cleanup_tempdir() -> None:
    shutil.rmtree(TEMP_DIR, ignore_errors=True)


atexit.register(cleanup_tempdir)


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
