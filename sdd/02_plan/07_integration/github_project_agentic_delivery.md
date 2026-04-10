# github project agentic delivery

- Owner: Codex
- Status: completed

## Scope

- `agentic-core`의 GitHub Project agentic kit를 `template`에 적용한다.
- project 2(`example` org project `template`) metadata를 repo-local contract로 고정한다.
- 원본 산출물만 있어도 IR validate/regenerate 후 backlog를 생성하도록 consumer repo를 연결한다.
- issue template, sync workflow, backlog workflow, role-specialized agent surface를 consumer repo에 반영한다.

## Assumptions

- `template`는 issue 중심으로 task를 만들고 project item status를 운영한다.
- 역할 분류는 `role:*` label과 role map을 함께 사용한다.
- repo-specific 산출물과 retained verify는 계속 `template` repo의 `sdd/`에 남긴다.
- canonical input은 원본 산출물이고, IR은 검토/재생성 가능한 협업용 파생 산출물이다.

## Acceptance Criteria

- `template`에 `project-contract.json`과 `role-map.json`이 생성된다.
- `template`에 `artifact-contract.json`이 생성된다.
- project 2 metadata가 contract에 반영된다.
- `Agent Role` custom field가 project 2에 존재한다.
- `role:*` labels가 repo에 생성된다.
- sync workflow, backlog workflow, issue template가 repo에 존재한다.
- source artifact 기준 task catalog와 GitHub backlog sync가 수행된다.

## Execution Checklist

- [x] core shared inventory를 `template`에 sync한다.
- [x] project 2 metadata를 가진 repo-local contract를 bootstrap한다.
- [x] 원본 산출물/IR gate를 가진 repo-local artifact contract를 만든다.
- [x] role labels와 project field를 live project/repo에 준비한다.
- [x] retained integration verify 문서를 backlog sync 근거까지 포함해 갱신한다.

## Current Notes

- consumer repo는 live project metadata와 source artifact contract를 repo-local로 가진다.
- GitHub Project bootstrap/sync/backlog automation은 local `scripts/agentic-core` copy가 아니라 checkout한 `agentic-core`에서 실행한다.
- `template`는 `example` org project 2를 기준으로 contract를 고정했다.
- task generator는 `artifact_backlog.py`가 맡고, 먼저 IR을 validate한 뒤 drift가 있으면 재생성한다.

## Validation

- `python3 ../agentic-core/scripts/agentic-core/github_project_kit.py inspect --repo-root /home/sh/Documents/Github/template`
- `python3 ../agentic-core/scripts/agentic-core/artifact_backlog.py generate-catalog --repo-root /home/sh/Documents/Github/template`
- `python3 ../agentic-core/scripts/agentic-core/artifact_backlog.py run --repo-root /home/sh/Documents/Github/template`
- `gh project field-list 2 --owner example --format json`
- `gh label list --repo example/template --limit 200 | rg '^role:' -N`
