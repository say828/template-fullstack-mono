# admin screen TODO

- Owner: Codex
- Status: active

## Service Summary

- service: `admin`
- canonical source: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- update rule: 이 파일 안에서 화면코드 기준 또는 코드 범위 기준으로 계속 갱신한다.

## Shared Constraints

- route baseline: `/admin/*`와 공용 auth route(`/login`, `/forgot-password`, `/reset-password`)
- shared API/modeling note: 모든 `/admin/*` route는 `ADMIN` role을 요구하고, 상세 상태는 각 context router command/query로 분리한다.

## Screen Items

### `ADM_001 ~ ADM_006` 인증과 대시보드

- route: `/login`, `/forgot-password`, `/reset-password`, `/admin/password`, `/admin/dashboard`, `/admin/notifications`, `/admin/reports`
- status: `implemented`

#### 한 일

- [x] 관리자 인증과 운영 대시보드를 current admin host baseline으로 정렬했다.
- [x] 알림 drawer를 투명 backdrop 위 compact floating panel로 유지했다.

#### 최신 검증

- `sdd/02_plan/03_architecture/spec_traceability.md`
- `sdd/03_verify/02_screen/admin/README.md`
### `ADM_007 ~ ADM_040` 거래·검차·감가·인도·정산 운영

- route: `/admin/trades*`, `/admin/remittances*`, `/admin/settlements*`
- status: `partial`

#### 해야 할 일

- [ ] 상태별 상세 variation을 더 세분화한다.

#### 한 일

- [x] 핵심 운영 route는 연결해 두었다.
- [x] 일부 variation은 route 압축 상태로 유지한다.

#### 최신 검증

- `sdd/02_plan/03_architecture/spec_traceability.md`
- `sdd/03_verify/02_screen/admin/README.md`

### `ADM_041 ~ ADM_058` 판매자·딜러·고객지원·정책

- route: `/admin/sellers*`, `/admin/dealers*`, `/admin/blacklist`, `/admin/support/*`, `/admin/policies*`
- status: `partial`

#### 해야 할 일

- [ ] 정책 문서와 support 큐 variation을 더 세분화한다.

#### 한 일

- [x] 딜러 심사, 블랙리스트, FAQ/공지, 문의 큐는 연결했다.
- [x] 정책 문서 계열은 일부 `partial`로 남겼다.

#### 최신 검증

- `sdd/02_plan/03_architecture/spec_traceability.md`
- `sdd/03_verify/02_screen/admin/README.md`

### `ADM_059 ~ ADM_062` 관리자 계정·권한·감사·버전

- route: `/admin/accounts*`, `/admin/permissions*`, `/admin/audit/logs`, `/admin/version`
- status: `implemented`

#### 한 일

- [x] 관리자 계정, 권한 그룹, 감사 로그, 버전 조회를 current owner surface 기준으로 정렬했다.

#### 최신 검증

- `sdd/02_plan/03_architecture/spec_traceability.md`
- `sdd/03_verify/02_screen/admin/README.md`
