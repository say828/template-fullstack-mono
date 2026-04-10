# legacy ci cleanup

- Owner: Codex
- Status: active

## Scope

- Keep the current delivery baseline only:
  - frontend DEV/PROD deploys to AWS edge
  - API DEV/PROD deploys through image build + GitOps-managed K3s rollout
- Remove dead or legacy CI/CD paths that no longer belong to that baseline.

## Assumptions

- `.github/workflows/frontend-dev-aws.yml` remains the retained DEV frontend delivery entrypoint.
- `.github/workflows/deploy.yml` remains the retained production release entrypoint.
- `.github/workflows/api-dev-k3s.yml` remains the retained DEV API K3s delivery entrypoint.
- Route53/domain Terraform is not owned in this repository anymore and stays outside this app repository.

## Acceptance Criteria

- [x] DEV frontend workflow no longer syncs or invalidates legacy buckets/distributions.
- [x] Dead `terraform-domain` workflow is removed.
- [x] Orphaned `infra/terraform/aws/domain` tracked files are removed.
- [x] SDD/runbook docs describe the current delivery baseline without legacy dual-deploy wording.

## Execution Checklist

- [x] Confirm current delivery ownership split and identify safe removal targets.
- [x] Remove legacy dual-deploy logic from `.github/workflows/frontend-dev-aws.yml`.
- [x] Remove the dead Terraform domain workflow and tracked leftovers under `infra/terraform/aws/domain`.
- [x] Update retained plan/verify/runbook docs to match the cleaned baseline.
- [x] Validate workflow syntax/reference cleanup and record the result.

## Work Log

- 2026-04-10: confirmed current intended split is frontend AWS edge delivery plus API GitOps-managed K3s delivery.
- 2026-04-10: confirmed `.github/workflows/terraform-domain.yml` points at `infra/terraform/aws/domain`, but that path has no retained `.tf` source and only stale helper leftovers.
- 2026-04-10: selected legacy DEV frontend dual-deploy and dead Terraform-domain automation as the safe cleanup set.
- 2026-04-10: removed legacy dual-deploy logic from `.github/workflows/frontend-dev-aws.yml`, removed the dead Terraform-domain workflow, and updated retained IaC/runbook docs.
- 2026-04-10: validated YAML parsing for retained workflows and confirmed no live workflow references remain for the removed Terraform-domain path.

## Validation

- `python3 - <<'PY'` to parse `.github/workflows/frontend-dev-aws.yml` and `.github/workflows/deploy.yml`
- `rg -n "LEGACY_FRONTEND|AD_FRONTEND|terraform-domain|infra/terraform/aws/domain" .github/workflows infra sdd`
- `git status --short`
