# screen root assets removal

- Owner: Codex
- Status: completed

## Scope

- `sdd/01_planning/02_screen/assets/` 루트 planning 폴더를 제거한다.
- root `assets`를 canonical로 가정하는 문서와 automation manifest를 정리한다.
- `spec_asset_factory`는 root asset inventory 검사에서 retired status report로 전환한다.

## Assumptions

- reusable planning asset inventory는 더 이상 `02_screen` root 바로 아래에 두지 않는다.
- design guide는 규칙 JSON만 유지하고, screen image evidence는 `ir/<service>/<SCREEN_CODE>/ui_img.png`에서 관리한다.
- runtime static asset은 각 app repo와 generic asset builder output에서 관리한다.

## Acceptance Criteria

- `sdd/01_planning/02_screen/assets/README.md`와 `assets/common/README.md`가 제거된다.
- `02_screen` root 문서에서 `assets/README.md` 참조가 제거된다.
- `spec_asset_factory`는 root assets 부재로 실패하지 않고 retired report를 생성한다.
- py_compile과 `check_spec_asset_bundle.py`가 통과한다.

## Execution Checklist

- [x] root `assets` 참조 경로를 전수 검색한다.
- [x] planning/build/automation 문서에서 root `assets` 전제를 제거한다.
- [x] `spec_asset_recipe_manifest.py`와 `check_spec_asset_bundle.py`를 retired flow로 바꾼다.
- [x] root `assets` 파일을 삭제한다.
- [x] py_compile 및 retired report 생성으로 검증한다.

## Validation

- `python3 -m py_compile sdd/99_toolchain/01_automation/check_spec_asset_bundle.py sdd/99_toolchain/01_automation/spec_asset_recipe_manifest.py`
- `python3 sdd/99_toolchain/01_automation/check_spec_asset_bundle.py`
