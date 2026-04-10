# DEV FRONTEND AWS DEPLOY

- frontend DEV 배포는 `.github/workflows/frontend-dev-aws.yml` 기준으로 운영한다.
- primary DEV edge baseline은 `client/web` -> `https://web.dev.example.com`, `client/admin` -> `https://admin.dev.example.com` 이다.
- frontend build는 same-origin hidden-origin 계약에 맞춰 `VITE_API_BASE_URL=/api/v1`를 사용한다.
- workflow는 primary DEV bucket/distribution만 sync/invalidate 한다.
- backend DEV runtime deploy는 `.github/workflows/api-dev-k3s.yml`가 별도로 수행하며, frontend deploy와 분리해 관리한다.
