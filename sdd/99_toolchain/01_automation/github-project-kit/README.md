# GitHub Project Agentic Kit

## Purpose

- downstream repo가 GitHub Project 기반 멀티 에이전트 협업 환경을 빠르게 켜도록 돕는다.
- 공용 코어는 template, script, workflow, role surface만 제공한다.
- 각 repo는 live project metadata를 담은 repo-local contract만 생성한다.

## Core Pieces

- `project-contract.template.json`
- `artifact-contract.template.json`
- `repo-agentic-extension.template.json`
- `role-map.template.json`
- consumer workflow `github-project-agentic-sync.yml`
- consumer workflow `github-project-agentic-backlog.yml`
- issue template `agentic-task.md`

Downstream repo는 스크립트와 worker runtime을 자체 보관하지 않고, checkout한 `agentic-core`에서 아래 entrypoint를 실행한다.

- `core/scripts/agentic-core/github_project_kit.py`
- `core/scripts/agentic-core/artifact_backlog.py`
- `core/scripts/agentic-core/agentic_worker.py`

## Setup

downstream repo에서:

```bash
python3 ../agentic-core/scripts/agentic-core/github_project_kit.py bootstrap \
  --repo-root . \
  --owner example \
  --project-number 2 \
  --repository example/template \
  --project-title template \
  --ensure-role-labels
```

그리고 repo-local `artifact-contract.json`에 아래를 연결한다.

- 원본 산출물 위치 (`source_artifact_globs`)
- feature spec / todo glob
- screen registry glob
- IR validate command
- IR regenerate command

repo-local 실행 계약은 기존 repo contract에 `repo-agentic-extension.template.json` 조각을 합쳐 사용한다.

- validation profiles by role
- execution watermarks
- auto-merge / prod manual gate policy

## Source-Artifact-First Model

1. consumer repo는 원본 산출물을 `sdd/01_planning` 아래 canonical 위치에 넣는다.
2. backlog generator는 먼저 IR validate를 시도한다.
3. IR이 없거나 drift면 repo-local regenerate command로 다시 만든다.
4. validate를 다시 통과한 IR만 task catalog input으로 사용한다.
5. 그 뒤 issue/project backlog를 sync한다.

즉 IR은 협업용 중간 산출물이고, 정본은 원본 산출물이다.

## Operating Model

- issue = visible task
- project status = public work state
- structured issue comment = agent handoff log
- `sdd/02_plan` + `sdd/03_verify` = retained planning / verification source of truth
- source artifact만 들어와도 generator는 먼저 IR validate를 시도하고, 실패하면 regenerate 후 다시 validate한다.
- IR이 정합한 경우에만 task catalog를 만들고 GitHub issue/project sync로 넘어간다.

## Execution Loop

- webhook worker는 GitHub App으로 이벤트를 받고 상위 `agentic-core`의 `agentic_worker.py serve`로 상주 실행한다.
- `project` role이 `Todo` task를 claim하고 역할별 Codex run을 시작한다.
- role agent는 branch/PR를 만들고 `quality` role이 repo contract validation을 수행한다.
- validation green이면 auto-merge한다.
- prod gate가 필요한 경우 issue는 `agentic:awaiting-prod-sync`로 남기고 comment ack 이후 `Done` 처리한다.

## GitHub App Contract

- App permissions
  - Repository permissions: `Contents` read/write, `Issues` read/write, `Pull requests` read/write, `Metadata` read-only
  - Organization permissions: `Projects` read/write
- Subscribe to events
  - `issues`
  - `issue_comment`
  - `pull_request`
  - `pull_request_review`
  - `push`
- Set the webhook URL to the worker host `/github/webhook`
- worker host env와 GitHub App credential은 consumer repo가 아니라 상위 `agentic-core` 운영 경계에 둔다.

## Host Deployment

worker host deployment는 `template` repo가 아니라 `agentic-core` 운영 기준에서 관리한다.

- consumer workflow는 CI에서 `agentic-core`를 checkout한 뒤 core 스크립트를 호출한다.
- 장기 상주 worker와 env/service template는 `agentic-core`에서만 유지한다.
