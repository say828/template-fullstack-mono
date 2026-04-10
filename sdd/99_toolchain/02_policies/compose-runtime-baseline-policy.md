# Compose Runtime Baseline Policy

## Purpose

템플릿 저장소의 compose/runtime 기준선을 root compose 중심 current-state로 고정하고, dedicated host overlay와 provider-first delivery split의 역할을 분리한다.

## Rules

- 루트 `compose.yml`은 템플릿 저장소의 canonical dev-focused runtime baseline이다.
- root compose는 4개 frontend surface, `server`, 기본 `postgres`, optional DB profile(`mysql`, `mariadb`, `mongo`)을 한 graph로 유지한다.
- `infra/compose/dev.yml`, `infra/compose/prod.yml`은 dedicated DEV(개발계)/PROD host나 분리된 runtime stack이 필요할 때 사용하는 overlay/example set이다.
- compose 문서는 root compose baseline과 dedicated overlay를 혼동하지 않고 current-state 역할로만 설명한다.
- browser-facing 환경 변수(`VITE_API_BASE_URL` 등)는 컨테이너 내부 DNS가 아니라 실제 브라우저가 도달 가능한 URL을 사용한다.
- remote delivery topology는 `AWS edge/domain -> OpenStack backend compute -> AWS data plane` current split을 기준으로 설명한다.
- compose baseline이나 topology가 바뀌면 `README.md`, `infra/compose/README.md`, `sdd/02_plan/06_iac`, `sdd/03_verify/06_iac`, `sdd/03_verify/06_iac`를 같은 변경 단위로 동기화한다.

## Canonical References

- `README.md`
- `infra/compose/README.md`
- `infra/terraform/README.md`
- `sdd/02_plan/06_iac/template_runtime_delivery.md`
- `sdd/03_verify/06_iac/template_runtime_delivery.md`
- `sdd/03_verify/06_iac/template_runtime_delivery.md`
