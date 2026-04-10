# github project agentic execution loop verification

## Status

- pass

## Executed Commands

```bash
test ! -e /home/sh/Documents/Github/template-fullstack-mono/scripts/agentic-core
test ! -e /home/sh/Documents/Github/template-fullstack-mono/.agent
python3 /home/sh/Documents/Github/agentic-core/scripts/agentic-core/github_project_kit.py --help
```

## Verified Points

- `template` repo에는 local `scripts/agentic-core` runtime surface가 존재하지 않는다.
- `template` repo에는 tracked `.agent` scaffold가 존재하지 않는다.
- GitHub Project automation entrypoint 검증은 external `agentic-core` path에서 수행한다.
- task issue body는 hidden `agentic-task-meta`를 포함해 upstream worker가 구조화 metadata를 읽을 수 있다.
- quality validation profile과 residual marker contract는 repo-local contract 안에 남아 있다.
- `.codex/agents/*.toml` role surface는 `name`과 `description` contract를 포함한다.

## Residual Risk

- live webhook 수신과 GitHub App token 발급은 실제 app credentials가 있어야 end-to-end로 검증된다.
- `agentic-core` upstream sync manifest가 아직 local runtime exclusion을 모르기 때문에, template에서는 자동 sync를 꺼 두고 upstream 반영 전까지 수동 sync만 사용해야 한다.
