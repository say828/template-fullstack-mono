# github project agentic delivery feature spec

## Purpose

- GitHub Project, issue, PR, comment를 agent collaboration surface로 사용한다.
- `sdd/`는 retained planning/verification source of truth로 유지한다.
- 역할별 agent가 작업을 명시적으로 분담하고, 상태를 가시적으로 남긴다.

## Actors

- project manager agent
- role-specialized implementation agent
- human reviewer
- repository maintainer

## Functional Scope

- source artifact만 repo에 들어와도 IR validate/regenerate를 거쳐 task generation으로 이어진다.
- project item과 issue를 1:1 task surface로 사용한다.
- issue 템플릿이 SDD reference, acceptance criteria, recommended role을 받는다.
- repo-local contract가 GitHub Project id/field/status mapping을 가진다.
- sync script가 issue/PR event를 받아 project status를 맞춘다.
- agent handoff comment가 structured format으로 기록된다.
- role map이 codex/claude role surface와 GitHub label/assignment rule을 연결한다.

## Domain Rules

- project는 operational control plane이고, canonical spec/plan/verify는 `sdd/`다.
- IR은 canonical source artifact가 아니라 validate/regenerate 가능한 collaboration artifact다.
- 상태 전이는 적어도 `Todo -> In progress -> In Review -> Done`을 지원한다.
- PR은 issue를 대체하지 않고, linked pull request로 연결되는 보조 surface다.
- 완료는 PR merge만이 아니라 retained verify까지 포함한다.

## Success Criteria

- 새 repo가 sync + bootstrap 한 번으로 GitHub Project 연동형 agentic 개발 환경을 켤 수 있다.
- 새 repo에 원본 산출물만 넣고 `artifact_backlog.py run`을 실행하면 IR 검토/재생성 후 visible backlog가 생성된다.
- 역할별 agent가 같은 보드 위에서 task/PR/review를 가시적으로 이어갈 수 있다.
- 프로젝트별 repo는 공용 코어가 아니라 contract와 retained 산출물만 로컬에 유지한다.
