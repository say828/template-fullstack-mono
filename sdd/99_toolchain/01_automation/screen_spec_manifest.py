from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
REPORT_PATH = ROOT / "sdd/03_verify/10_test/screen_spec_factory_latest.md"

SCREEN_SPEC_ARTIFACTS = [
    {
        "id": "seller",
        "label": "seller screen spec",
        "kind": "pdf",
        "path": ROOT / "sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf",
    },
    {
        "id": "dealer",
        "label": "dealer screen spec",
        "kind": "pdf",
        "path": ROOT / "sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf",
    },
    {
        "id": "admin",
        "label": "admin screen spec",
        "kind": "pdf",
        "path": ROOT / "sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf",
    },
    {
        "id": "landing",
        "label": "landing screen spec",
        "kind": "markdown",
        "path": ROOT / "sdd/01_planning/02_screen/landing_screen_spec.md",
    },
]
