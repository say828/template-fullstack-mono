# functional e2e gate

## Status

- pass

## Retained Checks

- `sdd/99_toolchain/02_policies/functional-e2e-gate-policy.md`가 checklist-derived functional E2E gate의 정본으로 유지된다.
- `sdd/99_toolchain/03_templates/functional_e2e_case_template.md`가 requirement-to-test-case traceability 시작점을 제공한다.
- `sdd/02_plan/10_test/functional_e2e_gate.md`와 `sdd/03_verify/10_test/functional_e2e_gate.md`가 current-state trail을 이룬다.
- `AGENTS.md`, `.codex/skills/sdd/SKILL.md`, `.claude/skills/sdd/SKILL.md`, `sdd/02_plan/10_test/verification_strategy.md`가 checklist source, full-layer E2E, migration/schema gate를 함께 설명한다.

## Residual Risk

- template repo는 concrete service checklist와 E2E suite를 제공하지 않으므로, downstream repo가 자신의 approved requirements를 실제 case matrix로 채워야 한다.
- 자동 selector가 아직 없어서 requirement-to-test-case traceability 작성은 초기에는 문서 기반/manual 유지가 필요하다.
