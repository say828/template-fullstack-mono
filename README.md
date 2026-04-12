# template-fullstack-mono

`template-fullstack-mono`는 `client/web + server`만 제공하는 generic fullstack mono 템플릿이다.

이 레포는 앱 payload만 포함한다. 공용 `sdd`, 에이전트 설정, 스킬, 오케스트레이션 자산은 `agentic-dev`가 설치 시 `agentic-core`에서 동기화한다.

## 구성

- `client/web`: generic React + Vite frontend skeleton
- `server`: generic FastAPI backend skeleton
- `compose.yml`: `web + server` local baseline
- `sdd/99_toolchain/01_automation/agentic-dev/*`: agentic-dev bootstrap and parity helpers

## 시작

```sh
pnpm install
pnpm --dir client/web dev
uv run --project server uvicorn api.app:app --reload
```

브라우저:

- web: `http://127.0.0.1:5173`
- server health: `http://127.0.0.1:8000/health`

## Docker Compose

```sh
docker compose up --build
```

## UI Parity

```sh
cd client/web
npm run ui:parity:bootstrap
```

## 원칙

- 템플릿에는 특정 도메인 기능, 샘플 운영 데이터, admin 전용 surface를 넣지 않는다.
- 프로젝트별 기능과 화면은 설치 후 SDD 플로우에서 생성한다.
