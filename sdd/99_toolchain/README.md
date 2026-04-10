# Toolchain Governance

## Purpose

- `sdd/99_toolchain/`은 단순화된 `sdd` 프로세스를 유지하는 생성기, 자동화, 정책, 템플릿의 canonical root다.
- canonical task flow는 `01_planning -> 02_plan -> implementation -> 03_verify`다.

## Rules

- 정책 문서는 `02_policies`를 정본으로 사용하고, `AGENTS.md`에는 핵심 실행 규칙만 요약한다.
- automation entrypoint와 helper 설명은 `01_automation`에 둔다.
- reusable verification template과 example manifest는 `03_templates`에 둔다.
- browser agent verification 기록 템플릿은 `03_templates/browser_agent_verification_template.md`를 canonical starting point로 사용한다.
