# runtime and structure governance

- Owner: Codex
- Status: active

## Scope

- In scope:
  - template repo의 `server/*`, `client/*`, `infra/*` current 구조 기준 유지
  - screen PDF, toolchain, runtime entrypoint 같은 현재 구조 설명
- Out of scope:
  - 서비스별 구현 상세

## Acceptance Criteria

- [x] repo structure 설명은 현재 폴더 구조를 기준으로 유지한다.
- [x] runtime path와 screen planning path는 현재 canonical 위치만 가리킨다.
- [x] dated refactor memo 없이 current structure만 남긴다.

## Execution Checklist

- [x] repo structure 기준 경로를 다시 점검한다.
- [x] stale path reference를 current path로 교체한다.
- [x] runtime/structure 설명을 durable 문서로 유지한다.

## Current Notes

- backend는 `server/contexts/*`, frontend는 `client/*`, 인프라는 `infra/*` current structure를 기준으로 설명한다.
- screen planning은 `sdd/01_planning/02_screen/*.pdf`를 canonical source로 유지한다.
- architecture planning은 root common docs + `frontend/`, `backend/`, `infra/`, `tech-research/` split을 기준으로 유지한다.
- 저장소 구조 정렬 결과는 현재 디렉터리 기준만 남긴다.

## Validation

- current references:
  - `sdd/01_planning/README.md`
  - `sdd/03_verify/03_architecture/repository_governance.md`
  - `sdd/03_verify/03_architecture/repository_governance.md`
