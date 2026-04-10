# Template MySQL Runtime Compatibility

## Verification

- `uv run --extra dev python -m pytest -q` -> `43 passed, 1 warning`
- `uv run --extra dev python -m mypy --config-file pyproject.toml` -> `Success: no issues found in 124 source files`
- `rg -n "UUID\\(as_uuid=True\\)|dialects.postgresql import UUID|psycopg|postgresql\\+psycopg" server/...` -> no matches in server code after the patch

## Residual Risk

- Runtime database connectivity is still environment-dependent until the real MySQL secret/endpoint is supplied by deployment.
- ORM portability is improved, but live MySQL schema parity still needs runtime verification once deployment is wired to the target database.
