# GitHub Project Agentic Policy

## Purpose

- GitHub Project를 agent collaboration의 가시적 control plane으로 사용한다.
- `sdd/` retained artifact와 issue/PR state를 분리하되 정합하게 연결한다.

## Rules

- issue는 canonical task surface다.
- PR은 issue를 대체하지 않고 linked pull request로 연결한다.
- project item status는 issue/PR/comment/verify 상태를 반영해야 한다.
- 역할별 task는 `role:*` label 또는 contract role map으로 분류한다.
- 완료는 merge만으로 충분하지 않고 `sdd/03_verify` retained evidence가 있어야 한다.
- repo-specific project metadata는 core에 하드코딩하지 않고 repo-local contract에 둔다.
