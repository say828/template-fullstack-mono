# Harness Layout

이 저장소의 Claude/Codex 하네스는 다음 위치를 기준으로 유지한다.

- `.claude/`: Claude 설정, 워크스페이스 가이드
- `.codex/`: Codex 설정, generic 에이전트 역할, 스킬

## Purpose

- 새 템플릿 저장소를 만들 때 바로 복사 가능한 generic 하네스 표면을 제공한다.
- 정책 문서(`01_policies`)와 실제 실행 자산(`.claude`, `.codex`)의 연결점을 명시한다.

## Current Contents

- `.claude/CLAUDE.md`
- `.claude/settings*.json`
- `.codex/config.toml`
- `.codex/agents/*.toml`
- `.codex/skills/*`
- `agentic-parity-harness-design.md`
- `parity-execution-tooling-design.md`

## Extension Point

- UI parity와 `agentic-dev` 강제 흐름은 [agentic-parity-harness-design.md](agentic-parity-harness-design.md)에 정의된 계약을 따른다.
- parity 실행 도구 자체의 소유 위치와 계층 분리는 [parity-execution-tooling-design.md](parity-execution-tooling-design.md)를 따른다.
- 프론트 템플릿 복제 직후에는 `bash sdd/99_toolchain/01_automation/agentic-dev/init_frontend_parity.sh . platform`을 먼저 실행해 repo contract와 route-gap/generated parity 기초 자산을 만든다.
- `mobile`도 같은 parity target 규약을 따르며 `run_frontend_target.sh ... mobile`으로 동일하게 실행한다.
- 첫 실행 검증은 `bash sdd/99_toolchain/01_automation/agentic-dev/bootstrap_frontend_parity.sh . platform`으로 route-gap gate와 proof gate까지 닫는다.

## Sanitization Rules

- 특정 서비스명, 회사명, 내부 도메인, 실환경 URL, 자격증명, 브라우저 프로필, 실행 산출물은 저장하지 않는다.
- 브라우저 자동화 skill에는 reusable source만 포함하고 `tmp/`, `profiles/`, `node_modules/` 같은 실행 산출물은 제외한다.
