# backend harbor cutover

## Verified

- `api-dev-k3s.yml` now targets Harbor for login, push, and image digest resolution.
- `deploy.yml` backend release job now uses Harbor and no longer carries the ECR registry flow.
- The frontend S3/CloudFront jobs in `deploy.yml` were left untouched.
- The release workflow now updates only the checked-out GitOps Template backend image reference.
- Local YAML parsing for `.github/workflows/api-dev-k3s.yml`, `.github/workflows/deploy.yml`, and `.github/workflows/frontend-dev-aws.yml` passed on 2026-04-10.
- `../gitops/k8s/apps/template` dev/prod overlays render Harbor image refs and `imagePullSecrets: harbor-registry`.

## Commands

- `python3` YAML parse of `.github/workflows/api-dev-k3s.yml`, `.github/workflows/deploy.yml`, and `.github/workflows/frontend-dev-aws.yml`
- `kubectl kustomize ../gitops/k8s/apps/template/overlays/dev`
- `kubectl kustomize ../gitops/k8s/apps/template/overlays/prod`
- `rg -n "dkr\\.ecr|ecr-registry|harbor\\.do4i\\.com|harbor\\.example\\.com" .github/workflows ../gitops/k8s/apps/template -S`
- `git status --short`

## Residual Risk

- The Harbor login secrets must exist in GitHub Actions as `HARBOR_USERNAME` and `HARBOR_PASSWORD`.
- The actual runtime rollout still depends on the sibling `example/gitops` repository accepting the updated manifest commit from these workflows.
- The broader platform source-of-truth names the shared registry host `harbor.example.com`.
- I did not execute the workflows end-to-end in the cluster; validation here is syntax and render/reference-level only.
