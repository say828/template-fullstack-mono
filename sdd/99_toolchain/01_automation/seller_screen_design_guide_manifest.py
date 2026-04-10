from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
GUIDE_OUTPUT_DIR = ROOT / "sdd/01_planning/02_screen/guidelines"


GUIDE_CONFIG = {
    "service": "seller",
    "spec_pdf": ROOT / "sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf",
    "spec_pdf_display": "sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf",
    "dpi": 110,
    "analysis_max_width": 320,
    "page_start": 2,
    "page_end": 50,
    "output_json": GUIDE_OUTPUT_DIR / "seller_screen_design_guide.json",
    "surface_detection": {
        "visual_region_ratio": 0.78,
        "downsample": 4,
        "page_deviation_threshold": 18,
        "min_component_area_ratio": 0.004,
        "min_component_width_ratio": 0.12,
        "min_component_height_ratio": 0.12,
        "surface_padding": 8,
        "max_surfaces_per_page": 6,
        "prefer_framed_surfaces": True,
        "minimum_relative_width": 0.55,
    },
    "page_aliases": {},
}
