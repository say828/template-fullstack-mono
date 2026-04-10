# github project agentic delivery

## Purpose

- `template`는 GitHub Project 2를 가시적 task board로 사용한다.
- `sdd/` retained 산출물과 역할별 agent surface를 연결해 멀티 에이전트 협업을 운영한다.
- repo에 원본 산출물만 들어와도 IR validate/regenerate 뒤 visible backlog를 만든다.

## Scope

- repo-local project contract
- repo-local artifact contract
- role map
- GitHub Project sync workflow
- GitHub Project backlog workflow
- issue template
- role-specialized agent surfaces

## Integration Rules

- issue는 canonical task item이다.
- project status는 issue/PR 흐름을 반영한다.
- PR은 linked pull request로 연결하고 issue를 대체하지 않는다.
- 완료는 retained verify까지 반영된 뒤에만 `Done`으로 본다.
- 원본 산출물이 canonical input이고, IR은 validate/regenerate 가능한 파생 산출물이다.
