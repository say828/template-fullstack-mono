from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
EXACTNESS_ROOT = ROOT / "sdd" / "99_toolchain" / "02_exactness"
PLAYWRIGHT_HARNESS_ROOT = EXACTNESS_ROOT / "playwright"
PLAYWRIGHT_CONFIG = PLAYWRIGHT_HARNESS_ROOT / "playwright.config.js"
PLAYWRIGHT_PACKAGE = PLAYWRIGHT_HARNESS_ROOT / "package.json"
PLAYWRIGHT_RESULTS_DIR = EXACTNESS_ROOT / "results"


PLAYWRIGHT_SUITES: list[dict[str, object]] = [
    {
        "id": "frt-005-signup-type",
        "kind": "screen-exactness",
        "description": "FRT_005 회원가입 유형 선택 구조 exactness gate",
        "spec": PLAYWRIGHT_HARNESS_ROOT / "frt-005-signup-type.spec.js",
    },
    {
        "id": "frt-014-active-detail",
        "kind": "screen-exactness",
        "description": "FRT_014 상세보기(입찰중) shell, data binding, viewer flow, bids CTA",
        "spec": PLAYWRIGHT_HARNESS_ROOT / "frt-014-active-detail.spec.js",
    },
    {
        "id": "frt-016-bids",
        "kind": "screen-exactness",
        "description": "FRT_016 입찰 현황 table/list 정렬, toggle persistence, 상세 이동, 더 보기",
        "spec": PLAYWRIGHT_HARNESS_ROOT / "frt-016-bids.spec.js",
    },
    {
        "id": "frt-018-winner-select",
        "kind": "screen-exactness",
        "description": "FRT_018 입찰자 선택 summary, dealer selection, confirm enablement",
        "spec": PLAYWRIGHT_HARNESS_ROOT / "frt-018-winner-select.spec.js",
    },
    {
        "id": "frt-019-inspection-pending",
        "kind": "screen-exactness",
        "description": "FRT_019 검차 진행 현황 detail shell, summary data, inspection CTA",
        "spec": PLAYWRIGHT_HARNESS_ROOT / "frt-019-inspection-pending.spec.js",
    },
    {
        "id": "frt-020-inspection-modal",
        "kind": "screen-exactness",
        "description": "FRT_020 검차 일정 정보 modal shell, proposal data, action buttons",
        "spec": PLAYWRIGHT_HARNESS_ROOT / "frt-020-inspection-modal.spec.js",
    }
]


def get_suite_by_id(suite_id: str) -> dict[str, object]:
    for suite in PLAYWRIGHT_SUITES:
        if suite["id"] == suite_id:
            return suite
    raise KeyError(suite_id)
