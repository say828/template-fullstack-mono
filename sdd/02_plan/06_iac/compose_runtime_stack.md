# compose runtime stack

- Owner: Codex
- Status: completed

## Scope

- root `compose.yml`을 현재 frontend/runtime 구조에 맞게 갱신한다.
- local baseline에 `mysql + server + client/web + client/admin` graph를 추가한다.
- compose 실행 스크립트와 README, IAC plan/verify 문서를 같은 기준으로 동기화한다.

## Assumptions

- root compose는 local baseline이다.
- customer-facing frontend는 `client/web`, admin frontend는 `client/admin`이 정본이다.
- 브라우저는 compose 내부 DNS가 아니라 host port(`localhost:8000`)를 기준으로 API를 호출한다.

## Acceptance Criteria

- `docker compose config`가 성공한다.
- `docker compose up -d --build`로 `mysql`, `server`, `template`, `admin`이 올라온다.
- 브라우저 진입 포트는 `5173`, `5174`, `8000`으로 유지되고, MySQL도 기본 `3306`을 그대로 사용한다.
- README, `sdd/02_plan/06_iac`, `sdd/03_verify/06_iac`가 같은 baseline을 설명한다.

## Execution Checklist

- [x] compose baseline 정책과 현재 runtime ownership을 확인한다.
- [x] frontend dev container 정의와 compose graph를 추가한다.
- [x] 실행 스크립트와 README를 compose baseline 기준으로 맞춘다.
- [x] plan/verify 문서를 동기화한다.
- [x] `docker compose` 실행으로 baseline을 검증한다.
- [x] frontend compose mount를 app-specific source와 service-local `node_modules` volume만 쓰는 구조로 축소한다.

## Current Notes

- 기존 root compose는 `mysql + server`만 포함하고 있어 현재 `client/web`, `client/admin` 구조와 어긋나 있었다.
- frontend는 local baseline이므로 static nginx가 아니라 Vite dev server 기준으로 컨테이너화했다.
- frontend local Dockerfile은 `client/Dockerfile` 하나로 유지하고, compose가 `APP_DIR`로 `client/web`, `client/admin`을 분기한다.
- frontend runtime은 더 이상 repo root 전체를 bind mount하지 않고, 각 앱 디렉터리와 service-local `node_modules` volume만 attach한다.
- frontend dependency install은 container startup이 아니라 image build 단계에서 수행하고, startup은 prebuilt `node_modules`를 volume에 bootstrap한 뒤 `pnpm dev`만 실행한다.
- `VITE_API_BASE_URL`은 브라우저가 실제로 도달하는 `http://localhost:8000/api/v1`를 기준으로 설정한다.
- compose 포트/env는 local-only 기준으로 `TEMPLATE_DB_PORT`, `TEMPLATE_API_PORT`, `TEMPLATE_WEB_PORT`, `TEMPLATE_ADMIN_WEB_PORT`를 사용한다.

## Validation

- `docker compose config`
- `docker compose up -d --build`
- `docker compose ps`
