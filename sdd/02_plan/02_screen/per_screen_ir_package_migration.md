# per-screen ir package migration

- Owner: Codex
- Status: completed

## Scope

- `sdd/01_planning/02_screen/ir/seller`, `dealer`, `admin`의 screen IR 산출물을 screen-code별 폴더 구조로 전환한다.
- 각 screen 폴더 아래에 `ui_grid.csv`, `ui_spec.md`, `ui_img.png`, `ui_context.json` 연결층을 둔다.
- `registry.json`은 service inventory/index 역할만 유지하고 per-screen 연결 정보의 주 저장소로 사용하지 않는다.
- IR builder, spec builder, img builder, validator, 관련 README/plan/build 문서를 새 구조로 맞춘다.

## Assumptions

- service root의 `registry.json`, `README.md`, `<service>_screen_spec.pdf`는 유지한다.
- per-screen 연결층은 사람과 에이전트가 screen 단위로 바로 읽을 수 있는 `ui_context.json`으로 둔다.
- `ui_context.json`은 grid block 분석, requirement section, artifact path, runtime/shell metadata, block-requirement 연결을 함께 담는다.

## Acceptance Criteria

- 각 service의 모든 screen code에 대해 `ir/<service>/<SCREEN_CODE>/` 폴더가 존재한다.
- 각 폴더 안에 `ui_grid.csv`, `ui_spec.md`, `ui_img.png`, `ui_context.json`이 존재한다.
- service root에 legacy flat `*_ui_grid.csv`, `*_ui_spec.md`, `*_ui_img.png` 파일이 남지 않는다.
- `registry.json`은 새 per-screen folder path를 가리킨다.
- validator가 새 구조와 연결층을 검증하고 pass한다.

## Execution Checklist

- [x] 새 per-screen folder + connection-layer schema를 정의한다.
- [x] IR builder를 새 구조로 전환한다.
- [x] ui_spec / ui_img builder를 새 구조와 연결층 갱신 흐름으로 전환한다.
- [x] validator를 새 구조 검증 규칙으로 전환한다.
- [x] seller/dealer/admin 전체 IR 산출물을 새 구조로 재생성한다.
- [x] 관련 planning/build README를 새 구조 기준으로 갱신한다.
- [x] validator를 실행해 pass 여부를 기록한다.

## Work Log

- 2026-04-09: 사용자 요청에 따라 service root flat IR를 screen-code별 folder package로 전환하기로 결정했다.
- 2026-04-09: 연결층은 registry 확장이 아니라 screen 단위 `ui_context.json`으로 두고, registry는 inventory/index로 축소한다.
- 2026-04-09: seller/dealer/admin 149개 screen package를 새 폴더 구조로 재생성했고 `validate_template_screen_ir.py`가 pass했다.

## Validation

- `python3 sdd/99_toolchain/01_automation/build_template_screen_ir.py`
- `python3 sdd/99_toolchain/01_automation/build_template_screen_ui_specs.py`
- `python3 sdd/99_toolchain/01_automation/build_template_screen_ui_imgs.py`
- `python3 sdd/99_toolchain/01_automation/validate_template_screen_ir.py`
