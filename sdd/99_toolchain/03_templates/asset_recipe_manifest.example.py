from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SCREEN_SPEC = ROOT / "sdd/01_planning/02_screen/example_screen_spec.pdf"
OUTPUT_DIR = ROOT / "sdd/99_toolchain/03_templates/generated_assets"


ASSET_RECIPES = [
    {
        "id": "example-asset-source",
        "source": {"kind": "pdf_page", "path": SCREEN_SPEC, "page": 1, "dpi": 150},
        "crop_box": (100, 100, 600, 600),
        "transparent_white_threshold": 245,
        "trim": True,
        "children": [
            {
                "id": "example-brand-mark",
                "output": OUTPUT_DIR / "example-brand-mark.svg",
            }
        ],
    }
]
