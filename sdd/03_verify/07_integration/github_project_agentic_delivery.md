# github project agentic delivery verification

- Owner: Codex
- Status: pass

## Executed Commands

```bash
python3 /home/sh/Documents/Github/agentic-core/scripts/agentic-core/github_project_kit.py inspect --repo-root /home/sh/Documents/Github/template
python3 /home/sh/Documents/Github/agentic-core/scripts/agentic-core/artifact_backlog.py generate-catalog --repo-root /home/sh/Documents/Github/template
python3 /home/sh/Documents/Github/agentic-core/scripts/agentic-core/artifact_backlog.py run --repo-root /home/sh/Documents/Github/template
python3 - <<'PY'
import json
from pathlib import Path
payload = json.loads(Path("sdd/99_toolchain/01_automation/github-project-kit/task-sync-state.json").read_text(encoding="utf-8"))
print(len(payload.get("issues", {})))
PY
gh issue list --repo example/template --state open --limit 200 --json number,title,labels --jq 'map(select(any(.labels[]?; .name=="agentic-task"))) | {count:length, first:.[-1], last:.[0]}'
gh project item-list 2 --owner example --limit 200 --format json --jq '.items[] | select(.content.type=="Issue" and .content.number==73)'
gh project field-list 2 --owner example --format json
gh label list --repo example/template --limit 200 | rg '^role:' -N
tmp=$(mktemp); printf '{"action":"opened","issue":{"number":1}}' > "$tmp"; python3 /home/sh/Documents/Github/agentic-core/scripts/agentic-core/github_project_kit.py sync-event --repo-root /home/sh/Documents/Github/template --event-path "$tmp"; rm -f "$tmp"
```

## Results

- project contract inspect: pass
- task catalog generation: pass (`task_count=66`, `generated_from=source-artifacts+validated-ir`)
- backlog sync: pass (`touched=66`, `created=0`, `ir_status=valid`)
- task sync state: pass (`issue_count=66`)
- live issue count: pass (`agentic-task` open issue `66`)
- live project sample: pass (`#73` item has `Status=Todo`, `Priority=P1`, `Size=M`, `Agent Role=ui`)
- live project field check: pass
- role labels check: pass
- synthetic issue sync-event: pass

## Verified Points

- `template`에 repo-local `project-contract.json`이 생성되었다.
- `template`에 repo-local `role-map.json`이 생성되었다.
- `template`에 repo-local `artifact-contract.json`이 생성되었다.
- GitHub Project automation은 local script copy가 아니라 external `agentic-core` checkout/path로 실행한다.
- project 2의 `Status/Priority/Size/Agent Role` field ids가 contract에 저장되었다.
- `role:project`, `role:specs`, `role:architecture`, `role:api`, `role:ui`, `role:quality`, `role:runtime`, `role:ci`, `role:gitops`, `role:security` labels가 repo에 생성되었다.
- consumer workflow `github-project-agentic-sync.yml`, `github-project-agentic-backlog.yml`와 issue template `agentic-task.md`가 repo에 존재한다.
- synthetic `issues.opened` event로 issue `#1` project item status sync가 오류 없이 수행되었다.
- source artifact -> IR gate -> task catalog -> live GitHub backlog sync evidence가 남았다.

## Residual Risk

- GitHub Actions에서 org project write가 필요한 경우 `AGENTIC_PROJECT_TOKEN` secret 구성이 필요할 수 있다.
- 현재 sync는 `Status/Priority/Size/Agent Role` field를 순차 편집하므로 task 수가 늘면 runtime이 길어진다. 향후 batch 또는 GraphQL 최적화가 필요하다.
