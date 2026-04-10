# prod tag release safety verification

## Gate Results

- Workflow syntax: pending
- Frontend build checks: pending
- API handoff check: pending

## Evidence To Collect

- `python3 -c 'import yaml; yaml.safe_load(open(".github/workflows/deploy.yml", encoding="utf-8"))'`
- `python3 -c 'import yaml; yaml.safe_load(open(".github/workflows/dispatch-space.yml", encoding="utf-8"))'`
- `pnpm --dir client/web build`
- `pnpm --dir client/admin build`

## Residual Risk

- API release remains a handoff to the downstream backend delivery boundary rather than a full backend deploy in this repository.
