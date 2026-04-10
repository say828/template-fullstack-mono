# Verify Governance

## Purpose

- `sdd/03_verify/`는 현재 구현 상태에 대한 retained verification을 durable 문서로 유지하는 루트다.
- 날짜별 gate/test log를 쌓지 않고, 현재 기준의 pass/fail 상태와 residual risk만 남긴다.

## Canonical Rule

- `03_verify`는 `02_plan`, implementation stage와 같은 section 축을 따른다.
- feature, screen, architecture, IAC, test surface별 verification summary를 같은 파일에서 갱신한다.
- history성 gate/test 로그는 `03_verify`에 두지 않는다.

## Sections

- `01_feature/`: feature 범주별 retained verification summary
- `02_screen/`: screen별 retained verification summary
- `03_architecture/`: 거버넌스/구조 관련 verification summary
- `06_iac/`: delivery/runtime verification summary
- `07_integration/`: integration verification summary
- `08_nonfunctional/`: nonfunctional verification summary
- `10_test/`: 반복 사용하는 검증 harness summary
