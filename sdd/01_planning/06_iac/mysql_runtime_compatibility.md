# Template MySQL Runtime Compatibility

## Goal

Make the Template backend runtime MySQL-compatible instead of Postgres-specific while keeping the current SQLite-based local test harness working.

## Scope

- Replace the server default `DATABASE_URL` with a MySQL URL.
- Swap the server dependency from `psycopg` to a MySQL driver.
- Remove PostgreSQL-specific SQLAlchemy UUID usage from ORM models.
- Keep database session setup portable across MySQL and SQLite.

## Assumptions

- Runtime secrets or deployment manifests will provide the actual MySQL credentials.
- Local unit tests remain SQLite-backed and must continue to pass.
- The application can stay on SQLAlchemy 2.x without a schema rewrite.

## Acceptance Criteria

- `server/config.py` defaults to a MySQL connection string.
- `server/pyproject.toml` no longer depends on `psycopg`.
- ORM models no longer import `sqlalchemy.dialects.postgresql.UUID`.
- `server/shared/infrastructure/database.py` configures MySQL engines without breaking SQLite tests.
- SDD plan/build/verify records exist for the change.

