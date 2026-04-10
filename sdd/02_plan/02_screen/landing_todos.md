# landing screen TODO

- Owner: Codex
- Status: active

## Service Summary

- service: `landing`
- canonical source: `sdd/01_planning/02_screen/landing_screen_spec.md`
- update rule: 이 파일 안에서 화면코드 기준 또는 코드 범위 기준으로 계속 갱신한다.

## Shared Constraints

- route baseline: 공개 홈, 인증 진입, 회원가입, support 정보성 route만 담당한다.
- shared API/modeling note: 공개 진입과 실제 업무 화면 모두 `client/web`이 소유하고, landing은 그 안의 public screen group으로 유지한다.

## Screen Items

### `FRT_001 ~ FRT_009` 공개 홈과 인증 진입

- route: `/`, `/login`, `/forgot-password`, `/signup*`
- status: `implemented`

#### 한 일

- [x] 공개 entry를 유지하고 `FRT_002/FRT_003` 로그인과 `FRT_004` 비밀번호 찾기 shell을 public auth card 구조로 맞췄다.
- [x] `FRT_001` 랜딩은 hero 하단 위로 role card를 일부 겹치게 올리고, 카테고리 카드를 반투명 glass panel로 조정했다.

#### 최신 검증

- `sdd/02_plan/02_screen/frt_002_login_alignment.md`
- `sdd/02_plan/03_architecture/spec_traceability.md`
- `sdd/03_verify/02_screen/landing/README.md`

### `LND-S001 ~ LND-S003` public support 정보 surface

- route: `/support/notices`, `/support/notices/:noticeId`, `/support/faqs`
- status: `implemented`

#### 한 일

- [x] 공지/FAQ를 public access로 노출하고 data contract를 `support` context와 공유한다.

#### 최신 검증

- `sdd/02_plan/03_architecture/spec_traceability.md`
- `sdd/03_verify/02_screen/landing/README.md`
## Current Notes

- landing은 marketing shell보다 product onboarding과 support entry 역할을 우선한다.
