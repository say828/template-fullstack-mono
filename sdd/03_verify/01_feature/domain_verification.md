# domain verification

## Current Status

- `identity`: pass
- `dealers`: pass
- `vehicles`: pass
- `bidding`: pass
- `trades`: partial
- `settlement`: pass
- `support`: partial
- `settings`: partial
- `admin`: partial

## Retained Checks

- route/screen alignment: `sdd/02_plan/03_architecture/spec_traceability.md`
- API quality harness: `sdd/02_plan/10_test/quality_gate.yaml`
- UI parity latest baseline: `sdd/03_verify/10_test/ui_parity/ui_parity_latest.json`
- identity local bootstrap regression: `cd server && .venv/bin/python -m pytest tests/test_identity_bootstrap.py`
- identity local bootstrap live check: `POST /api/v1/auth/login` with `sl@template.com`, `dl1@template.com`, `dl2@template.com` and password `test1234`
- identity admin bootstrap check: `POST /api/v1/auth/login` with `admin@template.com` and password `Admin12!`

## Residual Risk

- 상태 variation이 route 압축으로 대체된 trade/support/settings/admin surface는 다음 변경 시 다시 targeted verification이 필요하다.
