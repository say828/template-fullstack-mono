# github project agentic delivery kit

- Owner: Codex
- Status: completed

## Scope

- `agentic-core`를 one-time setup kit로 만들어 downstream repo가 GitHub Project 기반 agent collaboration을 켤 수 있게 한다.
- 공용 contract template, bootstrap/sync script, consumer workflow, issue template, role agent surface를 제공한다.
- 원본 산출물만 있는 consumer repo도 IR validate/regenerate를 거쳐 backlog를 만들 수 있게 한다.
- 첫 consumer로 `template`에 필요한 최소 파일과 contract를 적용한다.

## Assumptions

- GitHub Project는 issue 중심 운영을 기본으로 한다.
- PR은 linked pull request field로 연결하고, 별도 project item으로 추가하지 않는다.
- repo별 산출물/SDD는 각 consumer repo에 남고, core는 공용 kit만 가진다.

## Acceptance Criteria

- `agentic-core`에 GitHub Project kit README, template contract, bootstrap/sync script가 존재한다.
- artifact backlog script가 source artifact -> IR gate -> task catalog -> GitHub sync 순서를 지원한다.
- 공용 role surface에 `project` 역할이 추가된다.
- consumer repo로 sync 가능한 workflow와 issue template가 제공된다.
- bootstrap script가 live project metadata를 읽어 repo-local contract를 생성한다.
- `template`에서 contract bootstrap, catalog generation, backlog sync 검증이 통과한다.

## Execution Checklist

- [x] feature spec과 현재 core/runtime 경계를 확인한다.
- [x] core kit 문서와 template contract를 추가한다.
- [x] bootstrap/sync automation을 추가한다.
- [x] source artifact만으로 backlog를 만들 수 있는 IR gate automation을 추가한다.
- [x] consumer workflow와 issue template를 sync surface에 포함한다.
- [x] role-specialized agent surface를 확장한다.
- [x] `template`에 sync + bootstrap + backlog sync 적용 후 verify 문서를 남긴다.

## Current Notes

- 기존 core는 shared inventory sync는 있지만 GitHub Project 기반 task orchestration kit은 없다.
- OTRO/Ralph는 이번 범위에서 제외하고, project + SDD + role agents + multi-agent 운영 표면에 집중한다.
- 공용 킷은 `agentic-core`에 두고, consumer repo는 `project-contract.json`, `artifact-contract.json`, retained SDD 문서와 consumer workflow만 로컬에 가진다.
- worker runtime, host env, dispatcher, long-running service template는 consumer repo에 두지 않는다.
- canonical input은 원본 산출물이고, IR은 validate/regenerate 가능한 파생 산출물이다.

## Validation

- `python3 ../agentic-core/scripts/agentic-core/github_project_kit.py --help`
- `python3 ../agentic-core/scripts/agentic-core/github_project_kit.py inspect --repo-root /path/to/repo`
- `python3 ../agentic-core/scripts/agentic-core/artifact_backlog.py run --repo-root /path/to/repo`
- consumer repo bootstrap/catalog/backlog evidence
