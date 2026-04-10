# github project agentic execution loop

- Owner: Codex
- Status: active

## Scope

- GitHub App webhook worker, SQLite state store, dispatcher, role runner ownership을 `agentic-core`로 고정한다.
- source-artifact backlog로 생성된 issue가 external `agentic-core` execution loop를 통해 claim, branch, PR, validation, merge까지 이어지게 유지한다.
- consumer `template`는 repo contract, role surface, retained SDD, workflow bridge만 유지한다.

## Acceptance Criteria

- `template`에는 `agentic_worker.py`, `runtime/`, worker env/service template가 남지 않는다.
- GitHub Project sync/backlog workflow가 checkout한 `agentic-core` 스크립트를 호출한다.
- `template` repo contract가 validation profile과 delivery gate를 가진다.
- `agentic-core-sync` 자동 재동기화가 consumer boundary를 다시 깨지 않도록 수동 동기화로 제한된다.

## Validation

- `test ! -e /home/sh/Documents/Github/template-fullstack-mono/scripts/agentic-core`
- `test ! -e /home/sh/Documents/Github/template-fullstack-mono/.agent`
- `python3 /home/sh/Documents/Github/agentic-core/scripts/agentic-core/github_project_kit.py --help`
