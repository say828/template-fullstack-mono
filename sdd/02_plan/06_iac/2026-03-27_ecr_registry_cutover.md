# 2026-03-27 ECR Registry Cutover

## 목표

- `api-*` 태그가 downstream dispatch가 아니라 ECR build/push + GitOps update를 수행하게 만든다.

## 범위

- `.github/workflows/deploy.yml`
- GitOps target image repository: `741323757384.dkr.ecr.ap-northeast-2.amazonaws.com/example/template-api`

## 확인할 점

- repo-level self-hosted runner 부재 여부
- AWS secret의 ECR auth/create 권한 여부
