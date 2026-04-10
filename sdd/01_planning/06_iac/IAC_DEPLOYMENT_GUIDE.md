# IAC Deployment Guide

## Scope

- frontend public entry는 AWS 기준을 유지한다.
- backend runtime과 database는 GitOps-managed k3s/MySQL delivery를 기준으로 설명한다.
- 고객사 공급 경로는 `compose`, 운영 인프라 선언은 `example/gitops`를 기준으로 한다.

## Current Baseline

- frontend edge:
  - Route53 / CloudFront / S3
- backend runtime:
  - k3s `api`
  - in-cluster MySQL
- app repo paths:
  - `compose.yml`
  - `client/Dockerfile`
- infra repo path:
  - `example/gitops`

## Delivery Rule

- AWS와 GitOps/k3s 경계를 모두 문서에 반영하되, 실제 서비스 상태는 `sdd/03_verify/06_iac/`에서 확인한다.
- IaC change는 dated memo가 아니라 현재 topology, bootstrap, validation 기준으로만 갱신한다.
- local compose frontend는 repo root 전체가 아니라 각 app source와 service-local `node_modules` volume만 mount한다.
