# Automation Toolchain

## Scope

- `01_automation`은 builder, verifier, exactness runner, parity helper 같은 자동화 자산을 둔다.
- planning 정본은 `01_planning`, 실행 계획 정본은 `02_plan`, retained 검증 정본은 `03_verify`에 둔다.

## Canonical Rule

- 기본 completion gate는 기능/계약 검증이다.
- runtime pixel parity는 필요한 화면에만 추가한다.
- automation gap은 `sdd/02_plan`과 `sdd/03_verify`에 residual risk로 남긴다.
