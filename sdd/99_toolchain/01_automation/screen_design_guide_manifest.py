from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
GUIDE_ROOT = ROOT / "sdd/01_planning/02_screen/guidelines"
GUIDE_README = GUIDE_ROOT / "README.md"
REPORT_PATH = ROOT / "sdd/03_verify/10_test/screen_design_guide_factory_latest.md"
SOURCE_ARTIFACTS = [
    ROOT / "sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf",
    ROOT / "sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf",
    ROOT / "sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf",
    ROOT / "sdd/01_planning/02_screen/landing_screen_spec.md",
]
