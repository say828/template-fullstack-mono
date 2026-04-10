from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
MOBILE_SCREEN_SPEC = ROOT / "sdd/01_planning/02_screen/mobile_screen_spec.pdf"
MOBILE_GUIDE_ASSET_DIR = ROOT / "sdd/01_planning/02_screen/guidelines/mobile/assets"
MOBILE_VERIFY_ASSET_DIR = ROOT / "sdd/03_verify/02_screen/app/artifacts"
MOBILE_ASSET_DIR = ROOT / "client/mobile/src/assets"
DEFAULT_DPI = 150
WHITE_THRESHOLD = 245


ASSET_RECIPES = [
    {
        "id": "passview_lockup_source",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 2, "dpi": DEFAULT_DPI},
        "crop_box": (294, 750, 738, 1151),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "children": [
            {
                "id": "passview-lockup",
                "output": MOBILE_ASSET_DIR / "passview-lockup.svg",
            },
            {
                "id": "passview-mark",
                "crop_box": (123, 0, 288, 180),
                "output": MOBILE_ASSET_DIR / "passview-mark.svg",
            },
            {
                "id": "passview-wordmark",
                "crop_box": (50, 324, 363, 381),
                "output": MOBILE_ASSET_DIR / "passview-wordmark.svg",
            },
        ],
    },
    {
        "id": "passview-onboarding-care",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 3, "dpi": DEFAULT_DPI},
        "crop_box": (250, 420, 760, 1030),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "passview-onboarding-care.svg",
    },
    {
        "id": "passview-onboarding-chat",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 3, "dpi": DEFAULT_DPI},
        "crop_box": (1130, 410, 1710, 1040),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "passview-onboarding-chat.svg",
    },
    {
        "id": "passview-onboarding-checklist",
        "source": {"kind": "pdf_page", "path": MOBILE_SCREEN_SPEC, "page": 3, "dpi": DEFAULT_DPI},
        "crop_box": (2070, 380, 2620, 980),
        "transparent_white_threshold": WHITE_THRESHOLD,
        "trim": True,
        "output": MOBILE_ASSET_DIR / "passview-onboarding-checklist.svg",
    },
    {
        "id": "home-primary-ui-source",
        "source": {"kind": "image", "path": MOBILE_GUIDE_ASSET_DIR / "page-010-surface-01.png"},
        "children": [
            {
                "id": "home-hero-orb",
                "crop_box": (210, 180, 390, 410),
                "transparent_white_threshold": WHITE_THRESHOLD,
                "trim": True,
                "output": MOBILE_ASSET_DIR / "home-hero-orb.png",
            },
            {
                "id": "primary-nav-home-active",
                "crop_box": (50, 1810, 160, 1935),
                "transparent_white_threshold": WHITE_THRESHOLD,
                "trim": False,
                "output": MOBILE_ASSET_DIR / "primary-nav-home-active.png",
            },
            {
                "id": "primary-nav-profile-inactive",
                "crop_box": (445, 1810, 560, 1935),
                "transparent_white_threshold": WHITE_THRESHOLD,
                "trim": False,
                "output": MOBILE_ASSET_DIR / "primary-nav-profile-inactive.png",
            },
            {
                "id": "primary-nav-counsel",
                "crop_box": (238, 1790, 356, 1945),
                "transparent_white_threshold": WHITE_THRESHOLD,
                "trim": False,
                "output": MOBILE_ASSET_DIR / "primary-nav-counsel.png",
            },
        ],
    },
    {
        "id": "profile-primary-nav-source",
        "source": {"kind": "image", "path": MOBILE_GUIDE_ASSET_DIR / "page-046-surface-01.png"},
        "children": [
            {
                "id": "home-notification",
                "crop_box": (481, 86, 517, 126),
                "transparent_white_threshold": 252,
                "trim": True,
                "fit_size": (24, 24),
                "canvas_size": (24, 24),
                "output": MOBILE_ASSET_DIR / "home-notification.png",
            },
            {
                "id": "primary-nav-home-inactive",
                "crop_box": (52, 1842, 162, 1967),
                "transparent_white_threshold": WHITE_THRESHOLD,
                "trim": False,
                "output": MOBILE_ASSET_DIR / "primary-nav-home-inactive.png",
            },
            {
                "id": "primary-nav-profile-active",
                "crop_box": (445, 1842, 560, 1967),
                "transparent_white_threshold": WHITE_THRESHOLD,
                "trim": False,
                "output": MOBILE_ASSET_DIR / "primary-nav-profile-active.png",
            },
        ],
    },
    {
        "id": "home-emergency-capture-source",
        "source": {"kind": "image", "path": MOBILE_VERIFY_ASSET_DIR / "APP_009_header_emergency_icon_capture.png"},
        "children": [
            {
                "id": "home-emergency",
                "transparent_white_threshold": WHITE_THRESHOLD,
                "trim": True,
                "fit_size": (20, 20),
                "canvas_size": (24, 24),
                "output": MOBILE_ASSET_DIR / "home-emergency.png",
            }
        ],
    },
    {
        "id": "notifications-ui-source",
        "source": {"kind": "image", "path": MOBILE_GUIDE_ASSET_DIR / "page-011-surface-02.png"},
        "children": [
            {
                "id": "notifications-feed-icon",
                "crop_box": (34, 165, 90, 250),
                "transparent_white_threshold": WHITE_THRESHOLD,
                "trim": True,
                "output": MOBILE_ASSET_DIR / "notifications-feed-icon.png",
            },
        ],
    },
]

MOBILE_ASSET_RECIPES = ASSET_RECIPES
BRAND_ASSET_RECIPES = MOBILE_ASSET_RECIPES
