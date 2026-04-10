# template-fullstack-mono

`template-fullstack-mono`는 `client/web + client/admin + server + sdd`를 함께 가져가는 fullstack mono 템플릿이다.

## 구성

- `client/web`: customer-facing React + Vite surface
- `client/admin`: admin React + Vite surface
- `server`: FastAPI + SQLAlchemy backend
- `sdd`: planning/build/verify/toolchain contract
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

주요 산출물:

- `sdd/02_plan/10_test/ui_parity_contract.yaml`
- `sdd/03_verify/10_test/ui_parity/web_agentic_dev_latest.json`
- `sdd/03_verify/10_test/ui_parity/web_agentic_admin_latest.json`

## agentic-dev 설치 흐름

이 템플릿은 `say828/template-*` 공개 레포 중 하나로 사용된다.

```bash
npx agentic-dev
```

CLI가 하는 일:

1. GitHub의 공개 `say828/template-*` 레포 목록 조회
2. 템플릿 선택
3. 선택한 레포를 새 디렉터리에 복제
4. `.env.example -> .env` 자동 생성
5. `pnpm install` 자동 실행
6. default target(`web`) 기준 Playwright Chromium 설치
7. default target(`web`) 기준 parity bootstrap 실행
