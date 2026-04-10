# 2026-03-27 ECR Registry Cutover

## 로컬 검증

- `.github/workflows/deploy.yml` YAML parse 성공

## 원격 검증

- `Template Prod Release` run `23653710683`
  - backend job runner: `ubuntu-latest`
  - 시작 전 차단: `Billing & plans` 결제/한도 문제로 job 미시작

## 결론

- workflow 문법과 dispatch path는 정리됐다.
- 실제 remote execution은 GitHub billing 상태가 먼저 풀려야 한다.
