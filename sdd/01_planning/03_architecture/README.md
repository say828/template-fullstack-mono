# Architecture Planning

- 범위: 서비스별 세부 화면보다 시스템 공통 구조와 구현 선택을 우선 기록한다.
- architecture 문서는 공통/일반화된 기준을 먼저 두고, 필요할 때만 특화 문서를 추가한다.
- 주요 축:
  - frontend architecture
  - backend architecture
  - infra architecture
  - auth/session
  - deployment topology
  - migration
- frontend architecture 문서는 모듈화, 컴포넌트, store/state, domain/use case, UI/UX, storage, API adapter 패턴을 다룬다.
- backend architecture 문서는 DDD context 구조, context 내부 계층, 3-layer, hexagonal, monolithic, EDA, MSA, CQRS와 실제 구현체 선택을 다룬다.
- infra architecture 문서는 container, orchestration, database, network, redundancy, multi-region 같은 서비스 기반 구조를 다룬다.
- 데이터 모델링은 architecture 범위에 포함하지 않고 `sdd/01_planning/04_data/`에서 다룬다.

## Canonical Docs

- [INDEX.md](./INDEX.md)
- [architecture_document_structure.md](./architecture_document_structure.md)
- [templates_system_architecture.md](./templates_system_architecture.md)
- [frontend/README.md](./frontend/README.md)
- [backend/README.md](./backend/README.md)
- [infra/README.md](./infra/README.md)
- [tech-research/README.md](./tech-research/README.md)
