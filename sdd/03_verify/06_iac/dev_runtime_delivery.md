# dev runtime delivery

- current retained references: `.github/workflows/frontend-dev-aws.yml`, `.github/workflows/api-dev-k3s.yml`, `compose.yml`, `example/gitops`
- retained delivery contract check: `frontend-dev-aws.yml` must include `client/web/**` and `client/admin/**` on `main` push, and `api-dev-k3s.yml` must include `server/**` on `main` push.
- retained admin host check: `client/admin/src/app/runtime.ts` must treat `admin.dev.example.com` as `admin`.
- retained CORS check: `server/config.py` must allow `https://web.dev.example.com` and `https://admin.dev.example.com`.
- retained runtime baseline check: primary `web.dev.example.com` and `admin.dev.example.com` must stay reachable during DEV convergence.
- retained local build check: `pnpm --dir client/admin build`
- current retained evidence: `docker build -t template-server:devhotfix /home/khw/template/server` succeeded after removing the in-image pip self-upgrade.
- current retained evidence: `sudo docker run ... template-server:devhotfix` started Uvicorn on `127.0.0.1:8000`, and `docker logs template-server` shows application startup complete.
- current retained evidence: `curl http://127.0.0.1:8000/health` returned `{"status":"ok"}`, and `curl http://127.0.0.1:8000/api/v1/auth/login` returned 200 JSON for `sl@template.com` / `test1234` and `admin@template.com` / `Admin12!`.
- current retained evidence: `curl https://web.dev.example.com/health` and `curl https://web.dev.example.com/api/v1/auth/login` returned 200 JSON through CloudFront after the Caddy vhost restore.
- current retained evidence: `curl http://origin.web.dev.example.com/health` and `curl http://origin.web.dev.example.com/api/v1/auth/login` returned 200 JSON directly from the restored origin.
- current recheck on `2026-04-07`: `https://web.dev.example.com/` serves `assets/index-BAf23Hmm.js`, that bundle targets same-origin `/api/v1`, and `curl -X POST https://web.dev.example.com/api/v1/auth/login -d '{"email":"sl@template.com","password":"test1234","role":"SELLER"}'` returned HTTP 200 with JSON.
- current local compose recheck on `2026-04-07`: `docker compose down --remove-orphans && docker compose up -d --build` completed successfully, `docker compose ps` showed `mysql`, `server`, `template`, and `admin` up, and local `http://127.0.0.1:8000/health` plus `http://127.0.0.1:8000/api/v1/auth/login` returned JSON 200.
- current retained evidence: `dig +short origin.web.dev.example.com` resolves to `203.253.84.76`, matching the corrected gitops dev example.
- current manual dispatch on `2026-04-10T06:07:25Z`: frontend DEV workflow run `24229112124` completed `success` for both `deploy-admin-dev-frontend` and `deploy-template-dev-frontend`, while API DEV workflow run `24229112121` completed `failure` at `Login to Harbor` because `HARBOR_USERNAME/HARBOR_PASSWORD` secrets were empty.
- current live recheck on `2026-04-10T06:10:46Z` and post-run frontend state on `2026-04-10T06:11:55Z`: `curl -I https://web.dev.example.com/` returned `HTTP/2 200` with `last-modified: Fri, 10 Apr 2026 03:46:59 GMT`, `curl -I https://admin.dev.example.com/` returned `HTTP/2 200` with `last-modified: Fri, 10 Apr 2026 03:46:19 GMT`, and same-origin `health` plus seller/admin login POSTs both returned JSON 200.
- residual risk: the running server76 Template origin still depends on the host-side recovery path; the durable GitOps/Terraform example is now aligned, but the next clean step is to reapply the canonical runtime bootstrap so the manual Caddy state can be retired.
- residual risk: frontend DEV rollout for the requested change is complete, but API DEV rollout is `gate failed` until the repository or environment provides non-empty `HARBOR_USERNAME` and `HARBOR_PASSWORD` secrets and run `24229112121` (or its retry) passes.
