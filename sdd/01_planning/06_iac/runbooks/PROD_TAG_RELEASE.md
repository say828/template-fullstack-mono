# PROD TAG RELEASE

- Production release entrypoint is `.github/workflows/deploy.yml`.
- `app-*` tags deploy the public frontend to S3 + CloudFront.
- `admin-*` tags deploy the admin frontend to S3 + CloudFront.
- `api-*` tags dispatch the backend release handoff to the downstream `space`/GitOps boundary.
- All production AWS mutations must verify the expected account id before writing state.
- Do not rely on the legacy dispatch-only pipeline for production tags.
