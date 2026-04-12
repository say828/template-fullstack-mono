# template-fullstack-mono

`template-fullstack-mono`는 `client/web + client/admin + server` payload를 제공하는 fullstack mono 템플릿이다.
공용 `sdd`, agent harness, GitHub Project kit, shared policy/skill surface는 설치 시 `say828/agentic-core`에서 공급된다.

## 구성

- `client/web`: customer-facing React + Vite surface
- `client/admin`: admin React + Vite surface
- `server`: FastAPI + SQLAlchemy backend
- `sdd/99_toolchain/01_automation/agentic-dev`: 템플릿 로컬 parity/bootstrap contract
- `compose.yml`: `mysql + server + web + admin` local baseline

## 실행

```bash
cp .env.example .env
cp server/.env.example server/.env

npm install -g pnpm
pnpm install

docker compose up -d --build
```

개별 프론트 실행:

```bash
pnpm --dir client/web dev
pnpm --dir client/admin dev
```

- web: `http://127.0.0.1:5173`
- admin: `http://127.0.0.1:5174`
- api: `http://127.0.0.1:8000`

## UI Parity

`agentic-dev init`로 설치하면 먼저 `agentic-core`가 sync되고, 그 위에 이 템플릿 payload가 합쳐진다.
기본 bootstrap 대상은 `web`이다.

```bash
cd client/web
npx playwright install chromium
npm run ui:parity:bootstrap
```

admin proof:

```bash
cd client/admin
npx playwright install chromium
npm run ui:parity:bootstrap
```

`ui:parity:bootstrap`은 아래를 순서대로 실행한다.

1. parity contract 초기화
2. frontend build
3. preview server 실행
4. reference materialize
5. route-gap / plan audit gate
6. proof gate

주요 parity 산출물은 설치된 repo에서 실행 후 생성된다.

## agentic-dev 설치 흐름

이 템플릿은 `say828/template-*` 공개 레포 중 하나로 사용된다.

```bash
npx agentic-dev
```

CLI가 하는 일:

1. GitHub의 공개 `say828/template-*` 레포 목록 조회
2. 템플릿 선택
3. 선택한 레포 payload를 새 디렉터리에 복제
4. `say828/agentic-core`를 sync
5. `.env.example -> .env` 자동 생성
6. `pnpm install` 자동 실행
7. default target(`web`) 기준 Playwright Chromium 설치
8. default target(`web`) 기준 parity bootstrap 실행
