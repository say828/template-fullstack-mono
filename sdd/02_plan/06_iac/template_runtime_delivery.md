# template runtime delivery

- Owner: Codex
- Status: active

## Scope

- In scope:
  - root compose dev-focused runtime baseline
  - dedicated host compose overlay positioning
  - provider-first Terraform baseline
  - workflow와 runtime 환경의 현재 연결 규칙
- Out of scope:
  - dated deploy memo
  - service별 release timeline

## Acceptance Criteria

- [x] root `compose.yml`이 canonical dev-focused template runtime baseline으로 문서화된다.
- [x] `infra/compose/dev.yml`, `infra/compose/prod.yml`이 dedicated DEV(개발계)/PROD overlay로 문서화된다.
- [x] provider-first Terraform split(`aws/data`, `aws/domain`, `openstack/server`)이 current runtime baseline으로 문서화된다.

## Execution Checklist

- [x] root compose/service graph positioning을 README와 IaC 문서에 반영한다.
- [x] dedicated host overlay 역할을 current compose baseline과 구분해 정리한다.
- [x] toolchain policy reference와 IAC current-state 문서를 같은 runtime split으로 맞춘다.

## Current Notes

- current template runtime baseline은 root `compose.yml`을 dev-focused graph entrypoint로 둔다.
- root `compose.yml`은 3개 frontend surface, `server`, 기본 `postgres`, optional DB profile을 함께 기동한다.
- `infra/compose/dev.yml`, `infra/compose/prod.yml`은 dedicated host나 분리된 runtime delivery가 필요할 때 쓰는 overlay/example set이다.
- infrastructure baseline은 `infra/terraform/README.md`를 기준으로 유지한다.
- current canonical delivery split은 `AWS edge/domain -> OpenStack backend compute -> AWS data plane`이다.
- CI baseline은 `.github/workflows/ci.yml`, `.github/workflows/frontend-parity.yml`를 사용한다.

## Validation

- current references:
  - `README.md`
  - `infra/compose/README.md`
  - `sdd/99_toolchain/README.md`
  - `sdd/99_toolchain/02_policies/compose-runtime-baseline-policy.md`
  - `infra/terraform/README.md`
  - `infra/terraform/aws/data/README.md`
  - `infra/terraform/aws/domain/README.md`
  - `infra/terraform/openstack/server/README.md`
  - `.github/workflows/ci.yml`
  - `.github/workflows/frontend-parity.yml`
