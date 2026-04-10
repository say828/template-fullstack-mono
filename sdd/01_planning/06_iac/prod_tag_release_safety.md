# prod tag release safety

## Goal

Standardize Template production releases around `app-*`, `admin-*`, and `api-*` tags while keeping frontend deployment in this repository and backend rollout on the retained downstream boundary.

## Boundary

- `app-*` and `admin-*` tags must deploy to S3 + CloudFront.
- `api-*` tags must hand off to the retained backend/GitOps boundary.
- The legacy tag-dispatch path must not continue handling production tags.

