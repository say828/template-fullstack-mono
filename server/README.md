# Template Server

## Tests

### JUnit XML output

`make test-server` can emit a JUnit XML report for CI.

- Enable output by setting `JUNIT=1`.
- Default report path is `.reports/pytest-junit.xml` (relative to `server/`).
- Override the path with `JUNIT_OUT=/path/to/report.xml`.
- When JUNIT is enabled, the Makefile creates the parent directory for `JUNIT_OUT`.

Examples (from the repo root):

```sh
# Default path -> server/.reports/pytest-junit.xml
make -C server JUNIT=1 test-server

# Custom relative path under server/
make -C server JUNIT=1 JUNIT_OUT=.reports/junit/server-tests.xml test-server

# Custom absolute path
make -C server JUNIT=1 JUNIT_OUT=/tmp/template/server-junit.xml test-server
```

CI hint: Always set `JUNIT=1` in CI and upload the file at the path you chose (`server/.reports/pytest-junit.xml` by default) using your CI's test-report or artifact upload step.

## Type Checking

Run mypy using the server config to avoid duplicate-module discovery when running from different working directories.

- Quick (from repo root): `make -C server typecheck`
- From `server/`: `uv run --extra dev python -m mypy --config-file pyproject.toml`
- From repo root (direct mypy invocation): `mypy --config-file server/pyproject.toml`

Notes:
- The mypy config lives in `server/pyproject.toml` and sets `explicit_package_bases = false` with `mypy_path = "."` to map the template-style `api`, `contexts`, and `shared` packages cleanly.
- Always pass `--config-file server/pyproject.toml` when invoking mypy outside the `server/` directory.

## Database

- The runtime default `DATABASE_URL` now targets MySQL via `mysql+pymysql`.
- Local unit tests still use in-memory SQLite in `server/tests/conftest.py`, so the ORM layer must stay portable across both backends.
