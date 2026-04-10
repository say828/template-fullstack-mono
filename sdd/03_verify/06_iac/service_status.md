# service status

## Current Live State

- updated_at: `2026-04-08`
- `app`: `main@4f48311` 기준 DEV frontend workflow [`24045867277`](https://github.com/example/template/actions/runs/24045867277) 성공 후 primary `https://web.dev.example.com`와 legacy `https://web.dev.example.com`가 모두 `HTTP 200`을 반환한다.
- `admin`: `main@4f48311` 기준 같은 DEV frontend workflow [`24045867277`](https://github.com/example/template/actions/runs/24045867277) 성공 후 `https://admin.dev.example.com/`와 legacy `https://ad.web.dev.example.com/`가 모두 `HTTP 200`을 반환하고, 알림 drawer는 투명 backdrop 위에서 헤더를 약 24px 더 덮는 compact floating panel로 렌더링된다.
- `api`: server76의 `template-server:devhotfix` container가 `127.0.0.1:8000`에서 응답하고, `origin.web.dev.example.com` / `web.dev.example.com` Caddy vhost가 그 listener로 reverse proxy한다. `gitops/terraform/services/template/runtime/aws/domain/env/dev.tfvars.example`은 이제 `203.253.84.76`을 가리켜 live origin과 정렬된다. `https://web.dev.example.com/health`와 `https://web.dev.example.com/api/v1/auth/login`은 seller/admin bootstrap 계정에 대해 JSON 200을 반환한다.
  - local runtime follow-up: `sl@template.com` 운영 계정에는 `11가 1301`, `11가 1304`, `11가 1303`, `11가 1302`, `11가 1307`, `11가 1308` 차량 데이터가 live DB에 생성돼 있고, 화면 노출 순서는 `입찰 현황 -> 감가 내용 확인 -> 검차 -> 입찰자 선택하기 -> 정산 확인 -> 상세 보기`다. `11가 1307`은 `SETTLEMENT` workflow를 가진 정산 확인 row라 목록 태그가 `인도/정산`으로 표시된다.

## Monitoring Baseline

- public frontend entries `https://web.dev.example.com/`, `https://web.dev.example.com/` respond `HTTP 200`
- admin frontend entries `https://admin.dev.example.com/`, `https://ad.web.dev.example.com/` respond `HTTP 200`
- primary hidden-origin health checks and login requests `https://web.dev.example.com/health`, `https://web.dev.example.com/api/v1/auth/login`, `https://admin.dev.example.com/health`, `https://admin.dev.example.com/api/v1/auth/login` respond `HTTP 200` with JSON payloads
- backend DEV rollout evidence is the server76 Template container hotfix plus live curl verification
- local runtime verification evidence is `GET /api/v1/vehicles/my` and `GET /api/v1/seller/vehicles/{vehicle_id}/trade-workflow` against `sl@template.com`
- release tags follow `app-*`, `admin-*`, `api-*`
- admin live UX baseline: `https://admin.dev.example.com/` should redirect to `/login` and render admin credential fields, while notifications stay floating over the page instead of dimming it.

## Residual Risk

- primary DEV edge was provisioned directly in AWS as CloudFront `ERFMTP9WLQVNC` / `E3U0ROZAX64XLD` with buckets `template-dev-example-com-741323757384` / `admin-template-dev-example-com-741323757384`; retained GitOps source already matched the target hostnames but this live cutover still needs a later source-of-truth reconciliation in `gitops` if the team wants Terraform-applied history for the new distributions themselves.
- `https://web.dev.example.com/health` and `https://ad.web.dev.example.com/health` are still legacy edge behavior and should not be used as primary same-origin health evidence.
- local kubeconfig in this session could not authenticate to the DEV cluster directly, so backend live-object verification still relies on host-level SSH and curl evidence instead of in-cluster object inspection.
- the server76 Template origin still relies on the host-side recovery path; the gitops DEV example now matches `203.253.84.76`, but the clean next step is to reapply the canonical runtime bootstrap so the manual Caddy state can be retired.
