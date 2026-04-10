# verification harness

## Scope

- `dev_full_api_e2e.sh`와 `spec_quality_runner.py`를 current verification harness로 유지한다.
- UI 정본은 `sdd/01_planning/02_screen/` 화면 명세서 묶음이고, design guide/asset factory는 여기서 파생한다.
- `ui_parity_contract.yaml`은 retained legacy/debug contract로만 유지한다.

## Current Notes

- API quality gate는 seed e2e 결과와 spec quality runner를 함께 사용한다.
- UI/layout 검증 baseline은 planning screen spec과 이후 materialize될 design guide/spec-derived asset이다.
- `03_verify/10_test/ui_parity/`는 과거 parity 증적 보존용이며 default gate가 아니다.

## Validation

- `scripts/e2e/dev_full_api_e2e.sh`
- `scripts/e2e/spec_quality_runner.py`
- `sdd/02_plan/10_test/quality_gate.yaml`
- `sdd/02_plan/03_architecture/screen_artifact_factory_governance.md`
- `sdd/02_plan/10_test/ui_parity_contract.yaml` `retained legacy/debug`
