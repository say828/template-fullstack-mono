# functional e2e gate

- Owner: Codex
- Status: active

## Scope

- requirement-to-test-case traceability
- full-layer E2E gate
- migration/schema gate

## Acceptance Criteria

- [x] 승인된 요구사항/체크리스트 항목마다 최소 1개 이상의 retained test case id가 연결된다.
- [x] auth, API, persistence, side effect가 걸린 기능은 full-layer E2E gate를 기본 completion surface로 가진다.
- [x] migration/schema drift가 영향을 줄 수 있는 기능은 migration apply와 schema parity verification이 gate에 포함된다.
- [x] 미개발 기능이나 verification 없는 approved requirement는 residual risk가 아니라 incomplete gate로 처리한다.
- [x] traceability와 retained 결과는 `sdd/02_plan`과 `sdd/03_verify` 중심으로 유지한다.

## Current Notes

- canonical source는 검수 확인서, acceptance checklist, approved use case inventory 중 하나다.
- test case matrix 시작점은 `sdd/99_toolchain/03_templates/functional_e2e_case_template.md`다.
- 시각 smoke만으로 완료 처리하지 않고, 변경 경계가 있는 기능은 기능 정합성 E2E gate를 completion 기준으로 사용한다.
- persistence나 migration이 영향을 줄 수 있는 기능은 migration apply + DEV/PROD schema verification을 통과하기 전까지 완료로 보지 않는다.
- legacy implementation stage trail이 남아 있더라도 새 process 기준 retained source of truth는 `02_plan + 03_verify`다.

## Validation

- `AGENTS.md`
- `.codex/skills/sdd/SKILL.md`
- `.claude/skills/sdd/SKILL.md`
- `sdd/99_toolchain/02_policies/functional-e2e-gate-policy.md`
- `sdd/99_toolchain/03_templates/functional_e2e_case_template.md`
