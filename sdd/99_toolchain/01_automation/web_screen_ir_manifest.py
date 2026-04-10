from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
PLANNING_ROOT = ROOT / "sdd/01_planning/02_screen"
IR_ROOT = PLANNING_ROOT / "ir"

TEMPLATE_SCREEN_IR_CONFIG = {
    "seller": {
        "service": "seller",
        "screen_prefix": "FRT",
        "spec_pdf": IR_ROOT / "seller/seller_screen_spec.pdf",
        "guide_json": PLANNING_ROOT / "guidelines/seller_screen_design_guide.json",
        "guide_dpi": 110,
        "output_root": IR_ROOT / "seller",
        "page_offset": 1,
        "plan_refs": [
            "sdd/02_plan/02_screen/app_todos.md",
            "sdd/02_plan/02_screen/landing_todos.md",
            "sdd/02_plan/03_architecture/template_runtime_unification.md",
        ],
        "verify_refs": [
            "sdd/03_verify/02_screen/app/README.md",
            "sdd/03_verify/02_screen/landing/README.md",
        ],
    },
    "dealer": {
        "service": "dealer",
        "screen_prefix": "DL",
        "spec_pdf": IR_ROOT / "dealer/dealer_screen_spec.pdf",
        "guide_json": PLANNING_ROOT / "guidelines/dealer_screen_design_guide.json",
        "guide_dpi": 110,
        "output_root": IR_ROOT / "dealer",
        "page_offset": 1,
        "plan_refs": ["sdd/02_plan/02_screen/app_todos.md"],
        "verify_refs": ["sdd/03_verify/02_screen/app/README.md"],
    },
    "admin": {
        "service": "admin",
        "screen_prefix": "ADM",
        "spec_pdf": IR_ROOT / "admin/admin_screen_spec.pdf",
        "guide_json": PLANNING_ROOT / "guidelines/admin_screen_design_guide.json",
        "guide_dpi": 110,
        "output_root": IR_ROOT / "admin",
        "page_offset": 1,
        "plan_refs": ["sdd/02_plan/02_screen/admin_todos.md"],
        "verify_refs": ["sdd/03_verify/02_screen/admin/README.md"],
    },
}

UI_PARITY_CONTRACT = ROOT / "sdd/02_plan/10_test/ui_parity_contract.yaml"
SPEC_TRACEABILITY = ROOT / "sdd/02_plan/03_architecture/spec_traceability.md"
APP_RUNTIME = ROOT / "client/web/src/app/App.tsx"
ADMIN_RUNTIME = ROOT / "client/admin/src/app/App.tsx"
LANDING_RUNTIME = ROOT / "client/web/src/app/App.tsx"

COMMON_GUIDELINE_REFS = ["sdd/01_planning/02_screen/guidelines/README.md"]

PUBLIC_LANDING_ROUTES = {
    "/",
    "/login?role=seller",
    "/login?role=dealer",
    "/forgot-password?role=seller",
    "/signup",
    "/signup/seller",
    "/signup/seller/complete",
    "/signup/dealer",
    "/signup/dealer/complete",
    "/support/notices",
    "/support/notices/:noticeId",
    "/support/faqs",
}
