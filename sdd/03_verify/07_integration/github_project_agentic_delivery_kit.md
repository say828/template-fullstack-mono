# github project agentic delivery kit verification

- Owner: Codex
- Status: pass

## Scope

- core kit 문서, role surface, bootstrap/sync script, consumer workflow가 coherent한지 확인한다.
- 첫 consumer인 `template`에 contract bootstrap과 source-artifact backlog generation이 가능한지 확인한다.

## Executed Commands

```bash
python3 /home/sh/Documents/Github/agentic-core/scripts/agentic-core/github_project_kit.py --help
python3 -m py_compile /home/sh/Documents/Github/agentic-core/scripts/agentic-core/github_project_kit.py /home/sh/Documents/Github/agentic-core/scripts/agentic-core/artifact_backlog.py
git diff --check
python3 /home/sh/Documents/Github/agentic-core/scripts/agentic-core/github_project_kit.py inspect --repo-root /home/sh/Documents/Github/template
python3 /home/sh/Documents/Github/agentic-core/scripts/agentic-core/artifact_backlog.py generate-catalog --repo-root /home/sh/Documents/Github/template
python3 /home/sh/Documents/Github/agentic-core/scripts/agentic-core/artifact_backlog.py run --repo-root /home/sh/Documents/Github/template
python3 - <<'PY'
import json
from pathlib import Path
payload = json.loads(Path("/home/sh/Documents/Github/template-fullstack-mono/sdd/99_toolchain/01_automation/github-project-kit/task-sync-state.json").read_text(encoding="utf-8"))
print(len(payload.get("issues", {})))
PY
gh issue list --repo example/template --state open --limit 200 --json number,title,labels --jq 'map(select(any(.labels[]?; .name=="agentic-task"))) | {count:length, first:.[-1], last:.[0]}'
gh project item-list 2 --owner example --limit 200 --format json --jq '.items[] | select(.content.type=="Issue" and .content.number==73)'
gh project field-list 2 --owner example --format json
gh label list --repo example/template --limit 200 | rg '^role:' -N
tmp=$(mktemp); printf '{"action":"opened","issue":{"number":1}}' > "$tmp"; python3 /home/sh/Documents/Github/agentic-core/scripts/agentic-core/github_project_kit.py sync-event --repo-root /home/sh/Documents/Github/template --event-path "$tmp"; rm -f "$tmp"
```

## Results

- `github_project_kit.py --help`: pass
- python compile: pass
- `git diff --check`: pass
- `template` contract inspect: pass
- `artifact_backlog.py generate-catalog`: pass
- `artifact_backlog.py run`: pass (`task_count=66`, `touched=66`, `created=0`, `ir_status=valid`)
- `task-sync-state.json`: pass (`issue_count=66`)
- live issue count check: pass (`agentic-task` open issue `66`)
- live project sample check: pass (`#73` item has `Status=Todo`, `Priority=P1`, `Size=M`, `Agent Role=ui`)
- live project field verify: pass
- role label bootstrap: pass
- synthetic issue sync-event: pass

## Verified Points

- core에 GitHub Project kit README, contract templates, bootstrap/sync script가 추가되었다.
- core에 source artifact -> IR gate -> backlog sync를 담당하는 `artifact_backlog.py`와 `artifact-contract.template.json`이 추가되었다.
- 공용 role surface에 `project` codex/claude agent가 추가되었다.
- consumer용 workflow `github-project-agentic-sync.yml`, `github-project-agentic-backlog.yml`, issue template `agentic-task.md`가 sync surface에 포함되었다.
- `template`는 automation runtime copy를 보관하지 않고 external `agentic-core` path를 사용한다.
- `template`에서 project 2 metadata를 가진 repo-local contract가 생성되었다.
- `template`에서 source artifact 기준 task catalog가 생성되었다.
- `template`에서 source artifact -> IR gate -> GitHub backlog sync가 실제로 완료되었다.
- live project 2에 `Agent Role` field가 생성되었다.
- `example/template`에 `role:*` labels가 생성되었다.
- synthetic `issues.opened` event를 받아 project item status sync가 오류 없이 수행되었다.

## Residual Risk

- organization project write 권한은 consumer workflow에서 `AGENTIC_PROJECT_TOKEN` 또는 동등한 권한 token이 필요할 수 있다.
