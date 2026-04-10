# Feature Planning

## Naming

- Folder name: `01_feature`
- Document naming: `{domain}_feature_spec.md`
- canonical current-state 문서는 `v2`, `v3`, `draft`, `legacy` 같은 버전/상태 suffix를 파일명에 두지 않는다.
- Source-of-truth feature spec files are backend domain based.

## Scope

- feature spec은 DDD 관점의 도메인 유스케이스 문서다.
- route, navigation, sidebar, modal, tab, client local state, 화면 전이는 feature spec에 쓰지 않는다.
- 위 항목은 `02_screen`에서 관리한다.
- 하나의 feature code는 하나의 핵심 query 또는 command 유스케이스를 대표한다.

## Implementation Basis

- `Bounded Context`는 실제 backend owner module에 맞춰 작성한다.
- feature spec은 현재 구현을 기준으로 먼저 정리하고, 미구현 요구는 `02_plan` backlog로 관리한다.
- frontend-only mock, redirect, client local state machine은 feature spec에 쓰지 않는다.
- 제품 컨셉, narrative, requirement memo는 repo의 제품 문서 위치로 분리하고 `01_feature`에는 두지 않는다.
- 개별 domain feature spec은 `Purpose -> Scope -> Actor Summary -> Domain Summary -> Aggregate / Model -> Use Case Matrix` 흐름을 기본 뼈대로 사용한다.

## Code Rule

- Feature code format: `{DOMAIN}-F{NNN}`
- 각 segment는 고정 길이로 유지한다.

| Segment | Rule | Example |
| --- | --- | --- |
| `DOMAIN` | 3-letter uppercase domain code | `AUT`, `USR`, `CAT` |
| `TYPE` | feature 식별자 고정값 | `F` |
| `NNN` | 3-digit sequence | `001`, `002` |

현재 canonical backend domain code는 `AUT`, `USR`, `CAT`, `INV`, `ORD`, `FUL`, `SHP`, `ALR`, `SUP`, `HLT`다.

## Required Fields

모든 feature row는 아래 정보를 포함한다.

| Field | Purpose |
| --- | --- |
| `Feature Code` | 유스케이스의 고유 식별자 |
| `Use Case` | 비즈니스 의도 |
| `Actor` | 유스케이스를 시작하거나 소비하는 주체 |
| `Bounded Context` | 해당 유스케이스가 속한 DDD 경계 |
| `Aggregate / Model` | 핵심 aggregate, entity, policy, read model |
| `Type` | `Query` 또는 `Command` |
| `Preconditions` | 유스케이스가 성립하기 위한 선행 조건 |
| `Domain Outcome` | 도메인 상태 변화 또는 조회 결과 |
| `Invariant / Business Rule` | 반드시 지켜야 하는 규칙 |

개별 domain feature spec은 use case matrix 외에 아래 섹션을 포함한다.

| Section | Purpose |
| --- | --- |
| `Scope` | 포함/제외 범위를 분리해 screen, transport, backlog와의 경계를 명시한다 |
| `Actor Summary` | use case matrix에 등장하는 각 actor의 책임과 사용 맥락을 설명한다 |

## Document Boundary

| Folder | Role |
| --- | --- |
| `01_feature` | actor, use case, aggregate, invariant 중심의 도메인 유스케이스 |
| `02_screen` | route, UI surface, CTA, local interaction, transition |
| `03_architecture` | bounded context 관계, 시스템 경계, 런타임 구조 |
| `04_data` | 저장 모델, 관계, 키 정책 |
| `05_api` | request/response, endpoint contract, transport 규약 |

## Writing Rule

- feature spec은 도메인 유스케이스 문서다.
- `Type`은 `Query` 또는 `Command`만 사용한다.
- use case matrix에 등장하는 모든 actor는 같은 문서의 `Actor Summary`에서 최소 1회 설명한다.
- actor 이름은 화면 이름이 아니라 도메인 상호작용을 시작하거나 소비하는 주체 기준으로 유지한다.
- `Current Direction`도 도메인 용어를 유지하며 route, tab, CTA, landing, viewport, repo path 같은 surface 용어를 섞지 않는다.
- 식별자는 UUID v7을 기준으로 해석하고, legacy numeric id는 기준 식별자로 간주하지 않는다.
- 기본 정렬은 `created_at` 또는 time-ordered UUID v7을 사용하고, 명시 순서가 필요해질 때만 `order` 계열 필드를 추가한다.
