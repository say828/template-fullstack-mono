# Convention Storage Policy

## Purpose

반복 참조되는 컨벤션, 워크플로우, 실행 규약의 정본 위치를 고정한다.

## Rules

- 공통 컨벤션의 정본은 항상 `sdd/99_toolchain/02_policies`에 저장한다.
- `AGENTS.md`에는 실행 시 반드시 기억해야 할 짧은 핵심 규칙만 둔다.
- `sdd/`는 history 저장소가 아니라 overwrite-only current-state delivery system으로 유지한다.
- `sdd/`를 canonical delivery system으로 쓰는 repo-impact 작업의 기본 skill surface는 `sdd`다.
- mutation/workflow/UI state 변경은 full-layer E2E gate를 통과하기 전까지 완료 상태로 기록하지 않는다.
- mutation/workflow E2E는 seed/reset precondition과 사용자 피드백 확인을 포함한 full-layer evidence로 남긴다.
- 개발 계약, 기능 명세, 화면 명세, 실행 계획, 검증 artifact는 `sdd/`를 정본으로 사용한다.
- `sdd/02_plan`의 active planning은 durable 문서를 직접 갱신한다.
- feature 계획은 `<domain>_todos.md`, screen 계획은 `<surface>_todos.md` 파일을 single source of truth로 사용한다.
