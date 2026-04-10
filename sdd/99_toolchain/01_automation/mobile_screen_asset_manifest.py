from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
MOBILE_SCREEN_SPEC = ROOT / "sdd/01_planning/02_screen/mobile_screen_spec.pdf"
MOBILE_ASSET_DIR = ROOT / "client/mobile/src/assets"
DEFAULT_DPI = 150
WHITE_THRESHOLD = 245


SCREEN_ASSET_RECIPES = [
    {
        "id": "in-admin-diagnosis-badge",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 14, "dpi": DEFAULT_DPI},
        "crop_box": (340, 260, 500, 420),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-admin-diagnosis-badge.svg",
    },
    {
        "id": "in-job-diagnosis-badge",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 19, "dpi": DEFAULT_DPI},
        "crop_box": (375, 285, 560, 470),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-job-diagnosis-badge.svg",
    },
    {
        "id": "in-education-diagnosis-badge",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 25, "dpi": DEFAULT_DPI},
        "crop_box": (420, 340, 595, 500),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-education-diagnosis-badge.svg",
    },
    {
        "id": "in-admin-document-foreigner-card",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 16, "dpi": DEFAULT_DPI},
        "crop_box": (340, 540, 1050, 1100),
        "output": MOBILE_ASSET_DIR / "in-admin-document-foreigner-card.svg",
    },
    {
        "id": "in-content-detail-phone",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 17, "dpi": DEFAULT_DPI},
        "crop_box": (210, 165, 1020, 1966),
        "children": [
            {
                "id": "in-content-detail-hero",
                "crop_box": (34, 195, 810, 620),
                "output": MOBILE_ASSET_DIR / "in-content-detail-hero.png",
            },
            {
                "id": "in-content-detail-inline-card",
                "crop_box": (68, 1040, 741, 1288),
                "output": MOBILE_ASSET_DIR / "in-content-detail-inline-card.png",
            },
            {
                "id": "in-content-detail-inline-passport",
                "crop_box": (69, 1572, 741, 1801),
                "output": MOBILE_ASSET_DIR / "in-content-detail-inline-passport.png",
            },
        ],
    },
    {
        "id": "in-jobs-hero-badge",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 18, "dpi": DEFAULT_DPI},
        "crop_box": (470, 378, 646, 520),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-jobs-hero-badge.svg",
    },
    {
        "id": "in-jobs-counsel-icon",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 18, "dpi": DEFAULT_DPI},
        "crop_box": (592, 800, 707, 910),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-jobs-counsel-icon.svg",
    },
    {
        "id": "in-jobs-guide-check-icon",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 18, "dpi": DEFAULT_DPI},
        "crop_box": (235, 1956, 355, 2106),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-jobs-guide-check-icon.svg",
    },
    {
        "id": "in-jobs-guide-contract-icon",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 18, "dpi": DEFAULT_DPI},
        "crop_box": (220, 2100, 348, 2250),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-jobs-guide-contract-icon.svg",
    },
    {
        "id": "in-jobs-guide-interview-icon",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 18, "dpi": DEFAULT_DPI},
        "crop_box": (220, 2270, 348, 2420),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-jobs-guide-interview-icon.svg",
    },
    {
        "id": "in-job-detail-housing-preview",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 23, "dpi": DEFAULT_DPI},
        "crop_box": (240, 2350, 908, 2603),
        "output": MOBILE_ASSET_DIR / "in-job-detail-housing-preview.png",
    },
    {
        "id": "in-education-hero-badge",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 24, "dpi": DEFAULT_DPI},
        "crop_box": (470, 375, 648, 512),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-education-hero-badge.svg",
    },
    {
        "id": "in-education-counsel-icon",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 24, "dpi": DEFAULT_DPI},
        "crop_box": (590, 805, 705, 915),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-education-counsel-icon.svg",
    },
    {
        "id": "in-education-course-play-icon",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 24, "dpi": DEFAULT_DPI},
        "crop_box": (225, 1205, 325, 1350),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-education-course-play-icon.svg",
    },
    {
        "id": "in-education-course-headset-icon",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 24, "dpi": DEFAULT_DPI},
        "crop_box": (225, 1485, 330, 1600),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-education-course-headset-icon.svg",
    },
    {
        "id": "in-education-category-basic-icon",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 24, "dpi": DEFAULT_DPI},
        "crop_box": (248, 1810, 386, 1928),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-education-category-basic-icon.svg",
    },
    {
        "id": "in-education-category-safety-icon",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 24, "dpi": DEFAULT_DPI},
        "crop_box": (488, 1810, 626, 1928),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-education-category-safety-icon.svg",
    },
    {
        "id": "in-education-category-contract-icon",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 24, "dpi": DEFAULT_DPI},
        "crop_box": (728, 1810, 866, 1928),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "in-education-category-contract-icon.svg",
    },
    {
        "id": "in-emergency-guide-siren",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 48, "dpi": DEFAULT_DPI},
        "crop_box": (355, 360, 700, 680),
        "output": MOBILE_ASSET_DIR / "in-emergency-guide-siren.png",
    },
    {
        "id": "in-emergency-guide-home-preview",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 48, "dpi": DEFAULT_DPI},
        "crop_box": (250, 1660, 760, 2280),
        "output": MOBILE_ASSET_DIR / "in-emergency-guide-home-preview.png",
    },
    {
        "id": "support-notice-detail-hero",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 61, "dpi": DEFAULT_DPI},
        "crop_box": (274, 472, 784, 982),
        "output": MOBILE_ASSET_DIR / "support-notice-detail-hero.png",
    },
]
