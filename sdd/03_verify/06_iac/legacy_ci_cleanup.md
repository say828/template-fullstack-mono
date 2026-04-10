# legacy ci cleanup

## Verified

- `.github/workflows/frontend-dev-aws.yml` retains only the primary DEV Template/admin AWS edge targets.
- `.github/workflows/terraform-domain.yml` is removed.
- `infra/terraform/aws/domain` no longer carries tracked Terraform workflow leftovers.
- The DEV frontend runbook now describes the single-target AWS edge baseline instead of the legacy dual-deploy contract.

## Commands

- `python3 - <<'PY'` to parse `.github/workflows/frontend-dev-aws.yml` and `.github/workflows/deploy.yml`
- `rg -n "LEGACY_FRONTEND|AD_FRONTEND|terraform-domain|infra/terraform/aws/domain" .github/workflows infra sdd`
- `git status --short`

## Residual Risk

- `client/admin` runtime code may still contain compatibility handling for old hosts even though CI/CD no longer deploys legacy DEV edge targets.
- An unrelated pre-existing worktree deletion outside this cleanup may still appear in `git status` and should be handled separately.
