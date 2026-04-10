# Test Strategy Template

## Scope

- unit
- integration
- build smoke
- visual parity
- functional e2e

## Rules

- mutation, persistence, workflow side effect가 있는 기능은 functional E2E gate를 기본으로 둔다.
- visual exactness는 필요할 때만 추가하고, 기본 completion gate는 기능 검증으로 닫는다.

## Layer Matrix

| Layer | Goal | Tooling |
| --- | --- | --- |
| Unit | domain/service rule 검증 |  |
| Integration | adapter/API/use-case 조합 검증 |  |
| Build smoke | runtime boot / import / compile smoke |  |
| Visual parity | 특정 화면 exactness 비교 |  |
| Functional E2E | UI + API + persistence + side effect 검증 |  |

## Release Gate

- DEV 검증과 PROD 검증은 같은 retained validation surface를 사용한다.
