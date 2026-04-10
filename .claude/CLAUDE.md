# CLAUDE.md

## What This Is

범용 웹 제품 템플릿에서 Claude/Codex 실행 규칙과 자동화 하네스 위치를 설명하는 문서다.

## Environment Naming Policy

- 문서/대화/로그에서 실행 환경은 항상 `DEV(개발계)`로 표기한다.
- `local`, `localhost 환경` 같은 표현은 운영 용어로 사용하지 않는다.

## Harness Layout

```text
templates/
├── .agent/          # Ralph loop harness, PRD scaffold, run state
├── .claude/         # Claude 설정
│   ├── agents/      # Claude role agents
│   └── skills/      # Claude Code repo-local skills (.claude/skills/<name>/SKILL.md)
├── .codex/          # Codex 설정, 에이전트, 스킬
├── client/
│   ├── web/    # 일반 앱 템플릿
│   ├── admin/       # 어드민 템플릿
│   ├── mobile/      # 현장형 모바일 템플릿
│   └── landing/     # 랜딩 템플릿
├── server/          # HTTP 서버 템플릿
└── sdd/             # toolchain 정책/자동화 문서
```

## Working Rules

- 컨벤션과 실행 규칙의 정본은 `sdd/99_toolchain/02_policies`에 둔다.
- DEV 반영이 필요한 작업은 항상 `main push -> DEV 배포 -> DEV 검증` 순서를 따른다.
- 템플릿은 특정 서비스/도메인/실환경에 종속된 문자열, URL, 자격증명, 브라우저 상태를 포함하지 않는다.
- 브라우저 자동화 예시는 generic 흐름만 제공하고, 실제 실행 산출물이나 프로필 데이터는 저장하지 않는다.
- `sdd/03_build`는 runtime assembly를 설명하는 current-state 문서이며 dated execution narrative를 남기지 않는다.
- AST-style build current-state 적합성은 `scripts/dev/audit_sdd_build_ast.py`로 검증한다.

## Claude Skills

- Claude Code 최신 project skill 표면은 `.claude/skills/<name>/SKILL.md`다.
- Claude Code의 custom commands와 skills는 merge된 표면으로 취급한다. 이 템플릿은 공식 skills 디렉터리 구조를 기본값으로 쓴다.
- Codex와 Claude가 같은 실행 하네스를 공유해야 할 때는 `.codex/skills/*`의 정본 스크립트와 계약을 재사용하고, Claude skill은 그 진입 규칙과 운영 가이드를 얇게 감싼다.
- 기본 제공 표면은 `otro`, `planning-with-files`, `ralph-loop`, `commit`, `dev-browser`, `prd`, `sdd`, `sdd-development`다.
