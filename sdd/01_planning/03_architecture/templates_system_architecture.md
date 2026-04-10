# System Architecture Template

## System Summary

- product:
- goal:
- entry surfaces:
- bounded contexts:

## Runtime Topology

| Runtime | Responsibility | Notes |
| --- | --- | --- |
| `frontend` | 사용자 진입 surface | web / mobile / console 등 실제 surface 기입 |
| `backend` | API / workflow / domain service | protocol과 런타임 기입 |
| `persistence` | state 저장 | database / queue / object storage 등 |
| `delivery` | build / deploy / runtime control | DEV/PROD baseline 기입 |

## Bounded Contexts

| Context | Location | Responsibility |
| --- | --- | --- |
| `example-context` | `app/<context>` | 소유 aggregate와 use case 기입 |

## Technology Baseline

| Layer | Baseline | Notes |
| --- | --- | --- |
| Frontend runtime |  |  |
| Backend runtime |  |  |
| Persistence |  |  |
| Delivery |  |  |
| Verification |  |  |

## Open Questions

- cross-context dependency:
- scaling / isolation point:
- external system dependency:
