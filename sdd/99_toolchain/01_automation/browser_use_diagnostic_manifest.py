from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
EXACTNESS_ROOT = ROOT / "sdd" / "99_toolchain" / "02_exactness"
BROWSER_USE_ROOT = EXACTNESS_ROOT / "browser_use"


BROWSER_USE_DIAGNOSTICS: list[dict[str, object]] = [
    {
        "id": "frt-005-signup-type",
        "kind": "screen-diagnostic",
        "description": "FRT_005 회원가입 유형 선택 구조/레이아웃 진단",
        "script": BROWSER_USE_ROOT / "run_frt_005_signup_type_diagnostic.py",
        "default_results_file": EXACTNESS_ROOT / "results" / "frt-005-signup-type-browser-use.json",
        "default_screenshot_file": EXACTNESS_ROOT / "results" / "frt-005-signup-type-browser-use.png",
    }
]


def get_diagnostic_by_id(diagnostic_id: str) -> dict[str, object]:
    for diagnostic in BROWSER_USE_DIAGNOSTICS:
        if diagnostic["id"] == diagnostic_id:
            return diagnostic
    raise KeyError(diagnostic_id)
