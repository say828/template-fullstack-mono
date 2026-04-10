# regression verification

## Status

- pass

## Retained Checks

- `sdd/02_plan/10_test/regression_verification.md`가 current regression scope baseline으로 유지된다.
- `AGENTS.md`, `.codex/skills/sdd/SKILL.md`, `.claude/skills/sdd/SKILL.md`, `sdd/99_toolchain/01_automation/README.md`가 direct-only verification 금지와 selected regression surface 기록 규칙을 함께 유지한다.
- screen exact automation gate가 Playwright인 경우 suite id, toolchain runner command, artifact path를 retained check에 함께 남긴다.
- regression surface와 checklist-derived functional E2E gate는 별도 문서로 유지하되, selected surface와 requirement-to-test-case traceability가 서로 어긋나지 않게 current-state로 관리한다.
- `sdd/99_toolchain/03_templates/browser_agent_verification_template.md`가 browser agent diagnostic summary의 canonical template로 유지된다.
- browser agent observation은 retained proof를 대체하지 않고, Playwright artifact 또는 command/manual evidence handoff를 명시해야 한다.

## Residual Risk

- regression scope selection은 아직 자동 selector가 없어서 문서 규칙과 reviewer 판단에 의존한다.
