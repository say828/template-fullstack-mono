# screen ir architecture

- scope: `sdd/01_planning/02_screen/`의 seller, dealer, admin screen spec을 모델 친화적 IR로 재구성하기 위한 planning 기준
- goal: agent가 PDF 한 페이지 전체를 직접 읽지 않고 `ui_grid.csv`, `ui_spec.md`, `registry.json`, design guide geometry를 screen unit package로 소비하게 만든다.

## Current Assessment

- `template`는 화면 정본 자체는 이미 분리돼 있다.
  - root screen source:
    - `ir/seller/seller_screen_spec.pdf`
    - `ir/dealer/dealer_screen_spec.pdf`
    - `ir/admin/admin_screen_spec.pdf`
    - `landing_screen_spec.md`
  - 공용 planning layer:
    - `assets/`
    - `guidelines/`
- 하지만 모델 개발용 입력 구조는 아직 불완전하다.
  - seller/dealer/admin에 per-screen `ir` package 기준 정리가 필요하다.
  - 화면 번호 badge, callout, 설명선, 오른쪽 spec text가 모델 입력에서 제거되지 않는다.
  - route/access/runtime linkage가 PDF 바깥의 구조화 JSON으로 정리돼 있지 않다.

## General Design Rule

- 모델 기본 입력은 원본 PDF가 아니라 `ir` package다.
- source spec은 canonical artifact로 유지하되, agent 입력은 아래 4개 family로 분리한다.

### 1. Source IR

- 역할: 사람이 승인한 원천 문서
- 예:
  - `ir/seller/seller_screen_spec.pdf`
  - `ir/dealer/dealer_screen_spec.pdf`
  - `ir/admin/admin_screen_spec.pdf`
  - `landing_screen_spec.md`

### 2. Visual UI IR

- 역할: 실제 구현해야 하는 화면 평면 layout
- 원칙:
  - per-screen canonical artifact는 `<SCREEN_CODE>/ui_grid.csv`다.
  - desktop-only 화면은 `ui_grid.csv` 하나를 canonical로 둔다.
  - 같은 screen code에 desktop/mobile이 같이 존재할 때만 `ui_grid_desktop.csv`, `ui_grid_mobile.csv`로 분리한다.
  - CSV는 24-column semantic matrix로 작성한다.
  - 각 셀에는 UI-only semantic token만 둔다.
  - UX goal, route, access, API, 상태 머신은 넣지 않는다.

### 3. Screen Requirement IR

- 역할: screen-spec PDF의 우측 요구사항 텍스트
- 원칙:
  - per-screen companion artifact는 `<SCREEN_CODE>/ui_spec.md`다.
  - markdown은 PDF 우측 요구사항 문장을 사람이 읽기 좋게 옮긴다.
  - grid/layout syntax는 넣지 않는다.

### 4A. Screen Connection IR

- 역할: grid/spec/img/runtime을 screen 단위로 바로 연결하는 보조 계약
- 원칙:
  - per-screen connection artifact는 `<SCREEN_CODE>/ui_context.json`이다.
  - service-level `registry.json`은 inventory/index만 담당한다.
  - block 분석, requirement section, artifact path, block-requirement mapping을 담는다.

### 4. Screen Metadata IR

- 역할: screen 식별과 runtime linkage
- 최소 필드:
  - `service`
  - `source_code`
  - `screen_code`
  - `screen_name`
  - `page_number`
  - `surface_ids`
  - `primary_route`
  - `access`
  - `runtime_entry`
  - `shared_shell_kind`
  - `header_kind`
  - `bottom_nav_kind`

### 5. Design Guide IR

- 역할: 공통 surface geometry와 visual token baseline
- 최소 필드:
  - `surface_ids`
  - `surface_rects`
  - `content_bounds`
  - `grid_baseline`
  - `preview_assets`

## Proposed Target Structure

```text
sdd/01_planning/02_screen/
  landing_screen_spec.md
  guidelines/
    assets/
  ir/
    seller/
      seller_screen_spec.pdf
      registry.json
      <FRT_###>/
        ui_grid.csv
        ui_spec.md
        ui_img.png
        ui_context.json
    dealer/
      dealer_screen_spec.pdf
      registry.json
      <DL_###>/
        ui_grid.csv
        ui_spec.md
        ui_img.png
        ui_context.json
    admin/
      admin_screen_spec.pdf
      registry.json
      <ADM_###>/
        ui_grid.csv
        ui_spec.md
        ui_img.png
        ui_context.json
```

## Mapping Rule For Palcar

- page/source/order:
  - seller/dealer/admin PDF 1page inventory
- route/runtime mapping:
  - `sdd/02_plan/10_test/ui_parity_contract.yaml`
  - runtime `App.tsx` files
- implementation status:
  - `sdd/02_plan/03_architecture/spec_traceability.md`
- guide surface geometry:
  - `guidelines/<service>_screen_design_guide.json`

## Landing Exception

- landing은 canonical source가 markdown이라 현재 phase에서는 PDF surface extraction 대상이 아니다.
- landing은 `landing_screen_spec.md`를 structured metadata source로 유지하고, 필요 시 별도 markdown-native IR로 분리한다.

## Acceptance Criteria

- seller/dealer/admin에 `ir/<service>/registry.json`이 존재한다.
- 각 service root에 screen-code별 per-screen folder와 `registry.json`이 존재한다.
- 각 per-screen folder는 `ui_grid.csv`, `ui_spec.md`, `ui_img.png`, `ui_context.json`을 포함한다.
- `ui_grid.csv`는 24-column semantic matrix를 유지한다.
- `ui_spec.md`는 PDF 요구사항 원문을 보관한다.
- route/status linkage는 `registry.json`, `ui_parity_contract.yaml`, `spec_traceability.md` 기준으로 기록된다.
