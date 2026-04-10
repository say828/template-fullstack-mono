# identity local bootstrap accounts

- Owner: Codex
- Status: active

## Scope

- 로컬 API startup에서 판매자 1개, 승인된 딜러 2개 테스트 계정을 항상 보장한다.
- bootstrap은 `server/.env`와 compose/local runtime에서 같은 정책을 사용한다.
- production runtime에는 테스트 계정이 생성되지 않도록 차단한다.

## Assumptions

- 로컬 서버 실행은 `server/.env` 또는 compose `env_file`을 사용한다.
- 지정 계정은 개발용 고정 자격 증명으로 매 startup마다 원하는 상태로 동기화해도 된다.
- production은 `BOOTSTRAP_LOCAL_TEST_ACCOUNTS`를 켜지 않는다.

## Acceptance Criteria

- 로컬 startup에서 `sl@template.com`, `dl1@template.com`, `dl2@template.com`이 항상 존재한다.
- 세 계정의 비밀번호는 `test1234`로 로그인 가능하다.
- 딜러 2개는 `APPROVED` + `ACTIVE` 상태로 유지된다.
- 같은 startup을 반복해도 계정 중복이 생기지 않고 drift가 있으면 원하는 상태로 복구된다.
- production 환경에서는 local test account bootstrap이 실행되지 않는다.

## Execution Checklist

- [x] 현재 identity startup bootstrap과 로컬 env 경로를 확인한다.
- [x] local test account bootstrap 정책과 설정 필드를 정의한다.
- [x] startup bootstrap 코드에 idempotent sync를 추가한다.
- [x] 테스트와 로컬 runtime 검증을 수행한다.
- [x] README와 build/verify 문서를 동기화한다.

## Current Notes

- 기존 startup은 admin/support 데이터만 bootstrap했다.
- 계정 생성만으로는 비밀번호 drift를 복구하지 못하므로 로컬 계정은 upsert가 아니라 sync로 처리한다.
- startup 후 실제 API login으로 `sl@template.com`, `dl1@template.com`, `dl2@template.com`이 모두 `test1234`로 인증되는 것을 확인했다.
- bootstrap admin 기본 비밀번호는 `Admin12!`로 유지한다.

## Validation

- `cd server && .venv/bin/python -m pytest tests/test_identity_bootstrap.py`
- `curl -fsS http://127.0.0.1:8000/health`
- `curl -fsS -X POST http://127.0.0.1:8000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"sl@template.com","password":"test1234","role":"SELLER"}'`
- `curl -fsS -X POST http://127.0.0.1:8000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"dl1@template.com","password":"test1234","role":"DEALER"}'`
- `curl -fsS -X POST http://127.0.0.1:8000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"dl2@template.com","password":"test1234","role":"DEALER"}'`
