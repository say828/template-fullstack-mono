# Template MySQL Runtime Compatibility

- Owner: Codex
- Status: active

## Scope

- Convert the Template backend server from Postgres-specific runtime assumptions to MySQL-compatible runtime assumptions.
- Keep the local SQLite-based test harness intact.
- Record the change in the retained SDD trail.

## Assumptions

- SQLAlchemy portable `Uuid` is sufficient for the existing UUID primary key and foreign key columns.
- `pymysql` is the intended sync driver for Template runtime MySQL connectivity.
- Existing application code does not require a migration framework change for this compatibility pass.

## Acceptance Criteria

- `server/pyproject.toml` depends on `pymysql` instead of `psycopg`.
- `server/config.py`, `server/.env`, and `server/.env.example` default to a MySQL URL.
- `server/shared/infrastructure/database.py` keeps engine creation portable for MySQL and SQLite.
- ORM model files no longer import PostgreSQL dialect UUID types.
- Focused server tests or type checks run after the code changes.

## Execution Checklist

- [x] Inspect Postgres-specific server code paths and locate ORM UUID usage.
- [x] Patch server dependencies and default runtime settings for MySQL.
- [x] Replace PostgreSQL-specific UUID imports with portable SQLAlchemy types.
- [x] Update retained SDD planning/build/verify records.
- [x] Run focused validation for the server package.

## Work Log

- 2026-03-27: confirmed server default `DATABASE_URL` still pointed to `postgresql+psycopg`.
- 2026-03-27: confirmed eight ORM modules imported PostgreSQL dialect UUIDs.
- 2026-03-27: confirmed `psycopg` was the only DB driver dependency in `server/pyproject.toml`.
- 2026-03-27: switched the runtime contract to MySQL-compatible settings and portable `Uuid` columns.
- 2026-03-27: regenerated `uv.lock`, ran pytest and mypy successfully, and verified no Postgres-specific runtime strings remain in server code.

## Validation

- `uv run --extra dev python -m pytest -q`
- `uv run --extra dev python -m mypy --config-file pyproject.toml`
