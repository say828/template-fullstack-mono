# screen artifact factory governance

- Owner: Codex
- Status: active

## Decision

- canonical UI source-of-truth count는 `1`이다.
- 정본은 `sdd/01_planning/02_screen/`의 승인된 화면 명세서 묶음이다.
  - `seller_screen_spec.pdf`
  - `dealer_screen_spec.pdf`
  - `admin_screen_spec.pdf`
  - `landing_screen_spec.md`
- canonical derived artifact class는 `3`개만 유지한다.
  - design guide: `sdd/01_planning/02_screen/guidelines/`
  - spec-derived asset: generic asset builder output과 구현 repo runtime asset output
  - verification summary: `sdd/03_verify/10_test/`
- mandatory verification bucket은 `3`개다.
  - source freshness: 명세서/manifest 최신성
  - derived exactness: 정적 자산의 source crop exact match
  - runtime function: API/e2e/route-state 검증
- exactness source/evidence package는 `sdd/99_toolchain/02_exactness/`에 둔다.
- `run_playwright_exactness.py`는 screen-local exactness의 canonical runner다.
- default runtime pixel parity gate 수는 `0`이다.
- UI parity는 canonical 흐름이 아니라 retained legacy/debug evidence로만 취급한다.
- current executable screen/delivery guard task 수는 `5`개다.
  - screen spec bundle report
  - screen design guide bundle report
  - screen brand asset inventory report
  - delivery status report
  - retained exactness suite run

## Why

- UI parity를 기본 축으로 두면 정본이 `screen spec`와 `runtime capture` 두 벌로 늘어나 drift가 구조적으로 생긴다.
- 화면 명세서 기반 factory는 설계 기준, 가이드, 자산을 모두 같은 upstream source에서 파생시키므로 변경 추적이 단순하다.
- pixel exactness는 runtime 전체 화면이 아니라 spec-derived static asset에만 적용하는 것이 비용 대비 정확도가 가장 높다.
- route/screen coverage는 별도 parity catalog보다 `spec_traceability.md`와 screen manifest에서 파생하는 편이 유지비가 낮고 정합성이 높다.

## Palcar Rule

- surface canonical split은 `4`개다: `seller`, `dealer`, `admin`, `landing`.
- P0 factory는 `3`개다.
  - `screen_spec_manifest.py`
  - `screen_design_guide_manifest.py`
  - `spec_asset_recipe_manifest.py`
- structured inventory가 필요하면 runtime route catalog를 별도 정본으로 두지 않고 screen spec manifest에서 파생한다.
- `specScreens.json`, `specRouteCatalog.json`, `ui_parity_contract.yaml`은 default prerequisite로 승격하지 않는다.
- 구현 검증은 먼저 기능/계약을 통과시키고, 화면 자산 정합성은 spec-derived artifact exactness와 retained exactness suite로 닫는다.

## Validation

- `sdd/01_planning/02_screen/`
- `sdd/02_plan/03_architecture/spec_traceability.md`
- `sdd/99_toolchain/01_automation/README.md`
- `sdd/99_toolchain/01_automation/sdd_preflight_manifest.py`
- `sdd/99_toolchain/01_automation/spec_asset_builder.py`
- `sdd/99_toolchain/01_automation/screen_design_guide_builder.py`
- `sdd/99_toolchain/01_automation/run_playwright_exactness.py`
- `sdd/99_toolchain/02_exactness/README.md`
