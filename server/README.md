# Template Server

Generic FastAPI skeleton for `template-fullstack-mono`.

## Run

```sh
uv run uvicorn api.app:app --reload
```

## Commands

- `make test-server`: run pytest
- `make lint`: run ruff

## Endpoints

- `GET /health`
- `GET /api/v1/system/info`
