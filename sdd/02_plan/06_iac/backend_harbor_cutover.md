# backend harbor cutover

- Owner: Codex
- Status: completed

## Scope

- Move Template backend CI/CD off ECR and onto Harbor while keeping frontend delivery on AWS edge.
- Keep the backend delivery flow anchored on `server/Dockerfile`, GitHub Actions, and the existing `example/gitops` handoff.
- Preserve the current frontend S3/CloudFront jobs unchanged.

## Assumptions

- Harbor credentials are available to GitHub Actions as `HARBOR_USERNAME` and `HARBOR_PASSWORD`.
- The Harbor image namespace remains `example/template-api`.
- The downstream GitOps repo continues to own the live cluster rollout and the current repository workflow only updates image tag and digest in the checked-out overlay.

## Acceptance Criteria

- [x] `api-dev-k3s.yml` logs in to Harbor, pushes `example/template-api`, resolves the Harbor digest, and refreshes the dev pull secret with Harbor credentials.
- [x] `deploy.yml` release-api job uses Harbor for build/push/digest lookup and leaves the frontend AWS edge jobs intact.
- [x] GitOps checkout updates inside the workflows only change the Template backend image reference.
- [x] Workflow YAML parsing succeeds after the change.

## Execution Checklist

- [x] Confirm the current Template backend jobs still use ECR and isolate the Harbor migration surface.
- [x] Update `api-dev-k3s.yml` for Harbor login, push, digest lookup, and dev pull-secret refresh.
- [x] Update `deploy.yml` release-api job for Harbor build/push and GitOps image handoff.
- [x] Add retained SDD documentation for the Harbor cutover.
- [x] Validate the edited workflow YAML and record the result in `sdd/03_verify`.

## Current Notes

- Frontend delivery remains AWS edge, so only the backend jobs were changed.
- The current repository now carries the Harbor image publish logic; live cluster pull-secret and Infisical contract remain source-of-truth in sibling `gitops`.
- The workflows now update only the Template overlay image tag/digest after checking out `example/gitops`.
- YAML parsing for the edited workflows passed locally on 2026-04-10.

## Validation

- `python3` YAML parse of `.github/workflows/api-dev-k3s.yml`, `.github/workflows/deploy.yml`, and `.github/workflows/frontend-dev-aws.yml`
- `kubectl kustomize ../gitops/k8s/apps/template/overlays/dev`
- `kubectl kustomize ../gitops/k8s/apps/template/overlays/prod`
- `rg -n "dkr\\.ecr|ecr-registry|harbor\\.do4i\\.com|harbor\\.example\\.com" .github/workflows ../gitops/k8s/apps/template -S`
- `git status --short`
