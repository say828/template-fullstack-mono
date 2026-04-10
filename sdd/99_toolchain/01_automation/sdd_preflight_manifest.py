from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
AUTOMATION_ROOT = ROOT / "sdd/99_toolchain/01_automation"
SCREEN_ROOT = ROOT / "sdd/01_planning/02_screen"
VERIFY_ROOT = ROOT / "sdd/03_verify"
VERIFY_IAC_ROOT = VERIFY_ROOT / "06_iac"
VERIFY_TEST_ROOT = VERIFY_ROOT / "10_test"


PREFLIGHT_TASKS = [
    {
        "id": "validation_header_guard",
        "kind": "automation",
        "section": "10_test",
        "category": "test",
        "coverage": ["shared"],
        "description": "Template validation header 기준 파일이 현재 저장소에서 유효한지 확인한다.",
        "required_for": ["validation guide freshness", "CI header guard"],
        "command": [
            "python3",
            "sdd/99_toolchain/01_automation/check_validation_header.py",
        ],
        "inputs": [
            AUTOMATION_ROOT / "check_validation_header.py",
            ROOT / ".codex/skills/otro/validation/validation.md",
        ],
        "outputs": [
            ROOT / ".codex/skills/otro/validation/validation.md",
        ],
    },
    {
        "id": "screen_spec_factory",
        "kind": "automation",
        "section": "01_planning/02_screen",
        "category": "screen_spec",
        "coverage": ["shared"],
        "description": "Template canonical screen spec bundle을 검증하고 current factory report를 재생성한다.",
        "required_for": ["screen spec drift detection", "design guide baseline", "asset baseline"],
        "command": [
            "python3",
            "sdd/99_toolchain/01_automation/build_screen_spec_pdf.py",
            "--all",
        ],
        "inputs": [
            AUTOMATION_ROOT / "build_screen_spec_pdf.py",
            AUTOMATION_ROOT / "screen_spec_manifest.py",
            SCREEN_ROOT / "ir/seller/seller_screen_spec.pdf",
            SCREEN_ROOT / "ir/dealer/dealer_screen_spec.pdf",
            SCREEN_ROOT / "ir/admin/admin_screen_spec.pdf",
            SCREEN_ROOT / "landing_screen_spec.md",
        ],
        "outputs": [
            VERIFY_TEST_ROOT / "screen_spec_factory_latest.md",
        ],
    },
    {
        "id": "screen_design_guide_factory",
        "kind": "automation",
        "section": "01_planning/02_screen",
        "category": "design_guide",
        "coverage": ["shared"],
        "description": "screen guideline bundle과 current guide factory report를 검증한다.",
        "required_for": ["spacing/layout baseline", "screen implementation drift detection"],
        "command": [
            "python3",
            "sdd/99_toolchain/01_automation/check_screen_design_guides.py",
        ],
        "inputs": [
            AUTOMATION_ROOT / "check_screen_design_guides.py",
            AUTOMATION_ROOT / "screen_design_guide_manifest.py",
            AUTOMATION_ROOT / "screen_design_guide_builder.py",
        ],
        "outputs": [
            VERIFY_TEST_ROOT / "screen_design_guide_factory_latest.md",
        ],
    },
    {
        "id": "spec_asset_factory",
        "kind": "automation",
        "section": "01_planning/02_screen",
        "category": "asset",
        "coverage": ["shared"],
        "description": "screen brand asset inventory root와 current factory report를 검증한다.",
        "required_for": ["asset factory status visibility"],
        "command": [
            "python3",
            "sdd/99_toolchain/01_automation/check_spec_asset_bundle.py",
        ],
        "inputs": [
            AUTOMATION_ROOT / "check_spec_asset_bundle.py",
            AUTOMATION_ROOT / "spec_asset_recipe_manifest.py",
            AUTOMATION_ROOT / "spec_asset_builder.py",
        ],
        "outputs": [
            VERIFY_TEST_ROOT / "spec_asset_factory_latest.md",
        ],
    },
    {
        "id": "delivery_status_factory",
        "kind": "automation",
        "section": "03_verify/06_iac",
        "category": "verification",
        "coverage": ["shared"],
        "description": "delivery status 문서와 current state check report를 재생성한다.",
        "required_for": ["delivery current-state sync"],
        "command": [
            "python3",
            "sdd/99_toolchain/01_automation/check_delivery_status.py",
        ],
        "inputs": [
            AUTOMATION_ROOT / "check_delivery_status.py",
            VERIFY_IAC_ROOT / "service_status.md",
        ],
        "outputs": [
            VERIFY_IAC_ROOT / "service_status_check.md",
        ],
    },
]
