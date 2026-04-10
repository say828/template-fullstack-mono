# sdd preflight governance

- Owner: Codex
- Status: active

## Scope

- `sdd` 시작 전에 선행 생성해야 하는 automation 산출물을 canonical preflight 진입점으로 묶는다.
- 현재 repo에 이미 있는 builder를 선행 실행하고, 아직 없는 자동화 항목은 `sdd/` section 기반 backlog로 제안한다.

## Current Notes

- canonical entrypoint는 `python3 sdd/99_toolchain/01_automation/run_sdd_preflight.py --run`이다.
- 현재 runnable preflight guard는 `5`개다.
  - validation header
  - screen spec bundle
  - screen design guide bundle
  - screen brand asset inventory
  - delivery status
- screen spec PDF 재생성, design guide, spec-derived asset builder가 canonical preflight 방향이며 `template` manifest 정렬 전까지 proposal backlog로 둔다.
- parity helper는 retained legacy/debug 자산일 뿐 preflight 기본 흐름에 포함하지 않는다.

## Validation

- `sdd/99_toolchain/01_automation/run_sdd_preflight.py`
- `sdd/99_toolchain/01_automation/sdd_preflight.py`
- `sdd/99_toolchain/01_automation/sdd_preflight_manifest.py`
- `sdd/02_plan/03_architecture/screen_artifact_factory_governance.md`
