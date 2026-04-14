# CLAUDE.md

## Repo Guide

- 이 저장소는 `agentic-dev`가 clone하는 generic template payload다.
- 템플릿에는 project-specific 기능, 샘플 도메인 산출물, generated task catalog, execution journal을 커밋하지 않는다.
- 설치 후 생성되는 `.agentic-dev/`, `sdd/01_planning`, `sdd/02_plan`, `sdd/03_verify`, GitHub Project contract는 소비자 레포의 정본이다. 템플릿 레포 정본이 아니다.
- `client/web`는 generic Vite frontend skeleton이고 `server`는 generic FastAPI backend skeleton이다.
- `sdd/99_toolchain/01_automation/agentic-dev/*`는 설치 직후 사용할 bootstrap/parity helper만 담는다.
- 로컬 orchestration 실행 산출물은 `.agentic-dev/generated/` 아래에 남으며 커밋 대상이 아니다.

## Template Rules

- 템플릿 코드는 특정 고객, 서비스명, feature code, sample issue/task state에 결합되지 않아야 한다.
- 새 기능 예시는 문서 설명 수준에만 두고, 실제 구현/verify trail은 소비자 레포에서 생성한다.
- repo-impact 변경은 설치 후 소비자 레포의 `sdd` workflow를 기준으로 검증한다.

## Sanity Commands

- `pnpm install`
- `pnpm --dir client/web build`
- `cd server && uv run --extra dev pytest -q`
