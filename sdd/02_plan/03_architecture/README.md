# Architecture Planning

- 이 폴더는 `sdd/02_plan` 아래에서 에이전트의 현재 개발 계획을 관리한다.
- 이 폴더는 구조, 리포지토리 거버넌스, 런타임 정렬, 툴체인 규칙 같은 횡단 계획을 durable 문서로 유지한다.
- 날짜 기반 작업 메모는 남기지 않고, 현재 적용돼야 하는 규칙과 backlog만 덮어쓴다.

## Plan Rule

- 다른 `02_plan` 폴더와 동일하게 `README.md + durable 문서`만 유지하고, dated plan history는 두지 않는다.
- `sdd/02_plan`은 현재 실행해야 할 기준만 남기고, 과거 계획 히스토리는 보관하지 않는다.
- 개발계가 있는 대상은 `구현(branch) -> branch push -> build -> main merge/push -> DEV(개발계) 배포 -> DEV 검수 -> 문서 갱신`을 기본 루틴으로 본다.
- feature는 domain TODO 파일 안에서 기능코드 기준으로 관리한다.
- screen은 service TODO 파일 안에서 화면코드 기준으로 관리한다.
- architecture, IAC, test도 dated memo 대신 section README와 durable governance 문서에서 현재 규칙만 유지한다.
- `02_plan` section 구조와 README 규칙은 final-only 기준으로 유지한다.

## Current Documents

- [architecture_document_governance.md](architecture_document_governance.md)
- [repository_governance.md](repository_governance.md)
- [runtime_and_structure_governance.md](runtime_and_structure_governance.md)
- [toolchain_governance.md](toolchain_governance.md)
- [templates-hexagonal-template-architecture.md](templates-hexagonal-template-architecture.md)
