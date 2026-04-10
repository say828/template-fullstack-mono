# Architecture Document Structure

## 1. Purpose

- `sdd/01_planning/03_architecture`는 프론트엔드, 백엔드, 인프라를 아우르는 공통 구조와 구현 선택을 기록한다.
- architecture 문서는 주로 일반화/공통화된 기준을 설명한다.
- 특정 기술, 인증, 배포, 런타임처럼 개별 주제가 독립 가치가 있으면 특화 문서를 함께 둔다.

## 2. Boundary

### Included In Architecture

- frontend architecture
  - module composition
  - component structure
  - store/state management
  - domain / use case / adapter structure
  - UI/UX patterns
  - local storage / session storage / cache
  - API client / facade / contract adapter
- backend architecture
  - DDD bounded context structure
  - domain / application / infrastructure / contracts layers
  - structural choices such as 3-layer, hexagonal, monolithic
  - pattern adoption such as EDA, MSA, CQRS and the selected implementation
  - runtime composition and service boundaries
- infra architecture
  - container runtime
  - orchestration
  - database runtime
  - network / domain / routing
  - redundancy / HA
  - multi-region / deployment topology

### Excluded From Architecture

- entity, schema, relationship, key policy 같은 데이터 모델링 상세
- table/column 수준 ERD 정의
- above items belong to [`sdd/01_planning/04_data/README.md`](../04_data/README.md)

## 3. Document Structure

### Root

- 공통/횡단 아키텍처 문서를 둔다.
- 예:
  - structure principle
  - document boundary
  - migration guide
  - runtime alignment rule

### frontend/

- 프런트엔드 특화 아키텍처 문서를 둔다.
- 특정 surface에 종속되더라도 재사용 가능한 구조 원칙이면 여기에 둔다.

### backend/

- 백엔드 특화 아키텍처 문서를 둔다.
- context structure, layering, pattern, runtime composition을 기록한다.

### infra/

- 인프라 특화 아키텍처 문서를 둔다.
- deployment topology, networking, orchestration, runtime platform을 기록한다.

### tech-research/

- 인증, 외부 provider, 실험 기술 같은 특정 주제 리서치를 둔다.
- research는 architecture 하위에 두되 공통 구조 문서와 분리한다.

## 4. Writing Rule

- 공통 문서를 먼저 작성하고, 특화 문서는 필요할 때만 추가한다.
- 이론 자체보다 현재 repo가 어떤 구조와 구현체를 채택했는지를 우선 기록한다.
- 여러 대안이 있을 때는 후보 나열로 끝내지 않고 현재 권장안과 이유를 적는다.
- feature, screen, data 문서가 맡아야 할 내용을 architecture에 중복 기록하지 않는다.
