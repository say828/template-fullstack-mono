# repository hygiene

- Owner: Codex
- Status: active

## Scope

- In scope:
  - cache artifact, generated garbage, repository hygiene baseline
  - lint/build/test를 방해하지 않는 저장소 청결 기준

## Acceptance Criteria

- [x] `*.pyc`, `__pycache__`, build garbage는 committed artifact로 남지 않는다.
- [x] SDD는 current-state 문서만 유지한다.

## Current Notes

- Python cache artifact와 empty cache directory는 저장소에 남기지 않는다.
- SDD는 generated history log를 남기지 않고 current-state 문서만 유지한다.

## Validation

- current references:
  - `.gitignore`
  - `sdd/README.md`
