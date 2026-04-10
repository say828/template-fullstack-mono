# prod tag release safety

- Owner: Codex
- Status: active

## Scope

- Standardize Template production release tags to `app-*`, `admin-*`, and `api-*`.
- Frontend releases must deploy to S3 + CloudFront.
- API release tags must hand off to the retained backend/GitOps boundary without introducing duplicate tag dispatches.

## Assumptions

- Production AWS account remains `741323757384`.
- Public app and admin frontends continue to serve from CloudFront-backed S3 buckets.
- API rollout remains owned by the existing backend delivery boundary; this repository only standardizes the release trigger and handoff.

## Acceptance Criteria

- [ ] `app-*` tags build and sync the public frontend to the production S3 bucket and invalidate CloudFront.
- [ ] `admin-*` tags build and sync the admin frontend to the production S3 bucket and invalidate CloudFront.
- [ ] `api-*` tags trigger the backend release handoff without duplicate tag dispatches.
- [ ] Release docs explain the required AWS account guardrail and secret contracts.
- [ ] The legacy tag-dispatch pipeline no longer handles production tags.

## Execution Checklist

- [ ] Add a Template production release workflow aligned with the do4i tag-release pattern.
- [ ] Narrow the existing tag-dispatch pipeline so prod tags are handled by the release workflow.
- [ ] Update operator docs and service status references.
- [ ] Validate workflow YAML syntax and document the result.

## Work Log

- 2026-03-27: confirmed Template already has S3/CloudFront frontend delivery and an out-of-band backend release boundary.
- 2026-03-27: started the release workflow standardization so app/admin/api tags are explicit and auditable.

## Validation

- `python3 -c 'import yaml; yaml.safe_load(open(".github/workflows/deploy.yml", encoding="utf-8"))'`
- `python3 -c 'import yaml; yaml.safe_load(open(".github/workflows/dispatch-space.yml", encoding="utf-8"))'`
- frontend build checks for `client/web` and `client/admin`
