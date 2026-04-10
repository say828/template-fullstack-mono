from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
MOBILE_SCREEN_SPEC = ROOT / "sdd/01_planning/02_screen/mobile_screen_spec.pdf"
GUIDE_OUTPUT_DIR = ROOT / "sdd/01_planning/02_screen/guidelines/mobile"


GUIDE_CONFIG = {
    "service": "mobile",
    "spec_pdf": MOBILE_SCREEN_SPEC,
    "spec_pdf_display": "sdd/01_planning/02_screen/mobile_screen_spec.pdf",
    "dpi": 110,
    "analysis_max_width": 280,
    "page_start": 1,
    "page_end": 113,
    "output_json": GUIDE_OUTPUT_DIR / "mobile_screen_design_guide.json",
    "preview_dir": GUIDE_OUTPUT_DIR / "assets",
    "surface_detection": {
        "visual_region_ratio": 0.78,
        "downsample": 4,
        "page_deviation_threshold": 18,
        "min_component_area_ratio": 0.004,
        "min_component_width_ratio": 0.08,
        "min_component_height_ratio": 0.10,
        "surface_padding": 8,
        "max_surfaces_per_page": 8,
        "prefer_framed_surfaces": True,
        "minimum_relative_width": 0.6,
    },
    "page_aliases": {},
}
