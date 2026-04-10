# architecture document governance

- Owner: Codex
- Status: active

## Scope

- In scope:
  - `sdd/01_planning/03_architecture` 문서 구조와 경계를 공통 규칙으로 정의한다.
  - 아키텍처 planning 문서는 공통/일반화된 구조를 우선 기록하되, 필요 시 `frontend`, `backend`, `infra`, `tech-research`로 특화 문서를 둔다.
  - 프런트엔드, 백엔드, 인프라의 구조/패턴/구현 선택을 architecture 범위로 유지한다.
  - 데이터 모델링 경계는 `sdd/01_planning/04_data`로 분리한다.
- Out of scope:
  - feature별 business rule 상세
  - screen별 route/CTA/전이 상세
  - entity/schema/ERD 수준의 데이터 모델링 상세

## Acceptance Criteria

- [ ] `03_architecture`는 공통 아키텍처 문서와 특화 아키텍처 문서를 함께 수용하는 구조로 설명된다.
- [ ] frontend/backend/infra가 architecture 범위에 포함된다는 점이 planning 문서에 명시된다.
- [ ] data modeling은 `04_data` 경계로 분리된다는 점이 planning 문서에 명시된다.

## Current Notes

- architecture 문서는 우선 공통 구조를 설명하고, 세부 구현 논점이 필요할 때만 영역별 문서로 내려간다.
- frontend architecture는 모듈화, 컴포넌트, store/state, domain/use case, UI/UX, storage, API adapter 패턴을 다룬다.
- backend architecture는 DDD context 구조, context 내부 계층, 3-layer, hexagonal, monolith/MSA/EDA/CQRS 같은 패턴과 실제 구현체 선택을 다룬다.
- infra architecture는 컨테이너, 오케스트레이션, 데이터베이스, 네트워크, 이중화, 멀티리전 같은 서비스 기반 구조를 다룬다.

## Validation

- current references:
  - `sdd/01_planning/03_architecture/README.md`
  - `sdd/01_planning/03_architecture/INDEX.md`
  - `sdd/01_planning/03_architecture/architecture_document_structure.md`
  - `sdd/01_planning/03_architecture/frontend/README.md`
  - `sdd/01_planning/03_architecture/backend/README.md`
  - `sdd/01_planning/03_architecture/infra/README.md`
  - `sdd/01_planning/04_data/README.md`
