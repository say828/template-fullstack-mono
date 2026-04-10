# toolchain governance

- Owner: Codex
- Status: active

## Scope

- `sdd/99_toolchain` 아래 자동화 도구와 policy 문서의 current rule 유지
- `sdd` 단일 canonical skill 정렬
- browser agent를 보조 진단 도구로 유지
- `02_plan + 03_verify` 중심 retained trail 유지

## Current Notes

- canonical automation root는 `sdd/99_toolchain/01_automation/`이다.
- policy source of truth는 `sdd/99_toolchain/02_policies/`, reusable templates는 `sdd/99_toolchain/03_templates/`다.
- browser agent는 exploratory diagnostic 도구이고, final retained proof는 Playwright 또는 command/manual evidence로 닫는다.

## Validation

- `.codex/skills/sdd/SKILL.md`
- `.claude/skills/sdd/SKILL.md`
- `AGENTS.md`
- `sdd/99_toolchain/README.md`
