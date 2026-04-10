# Functional E2E Case Template

## Checklist Source

- source artifact:
- source section:
- approval baseline:
- target surface:

## Traceability Matrix

| Case ID | Requirement / Checklist Item | Surface | Preconditions | Steps | Expected UI State | Expected API / Contract | Expected Persistence / Schema | Expected Side Effect | Automation / Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `E2E-001` |  |  |  |  |  |  |  |  |  |

## Migration Gate

- affected tables / collections:
- migration apply command:
- schema verification command / query:
- DEV parity result:
- PROD parity result:

## Completion Rule

- 모든 approved requirement / checklist item은 최소 1개 이상의 case id와 연결돼야 한다.
- 미개발 기능, 미연결 checklist item, migration 미검증 항목은 residual risk가 아니라 incomplete gate다.
- retained automation/evidence path를 `sdd/02_plan`과 `sdd/03_verify`에 current-state로 남긴다.
