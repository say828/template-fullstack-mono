# FRT_002 Login Alignment Plan

- Owner: Codex
- Status: active

## Scope

- 대상 화면: `FRT_002 로그인(판매자)`, `FRT_003 로그인(딜러)`, `FRT_004 비밀번호 찾기`
- 대상 runtime: `client/web`
- 대상 산출물: `screen_ir`, public login shell, SDD build/verify 기록

## Assumptions

- seller/dealer 공개 로그인은 동일한 component shell을 공유한다.
- `FRT_002`와 `FRT_003`의 차이는 선택된 role state와 route query로 표현한다.
- admin 로그인은 이 public login surface의 범위에 포함되지 않는다.

## Acceptance Criteria

- `screen_ir`에서 `FRT_002`가 `page_number: 3`, `/login?role=seller`로 연결된다.
- 공개 로그인 화면은 seller/dealer 2탭 구조만 노출한다.
- 로그인 shell은 화면명세서 기준으로 상단 public header, 중앙 card, 입력 필드, 자동 로그인, CTA, 보조 링크, social buttons 구조를 유지한다.
- `FRT_004`는 `/forgot-password?role=seller|dealer` query 기준으로 역할 선택 상태를 유지한다.
- `FRT_004`는 이메일 입력, 계정 유형 선택, 실행 버튼, 로그인/회원가입 링크를 spec 구조에 맞춰 제공한다.
- `client/web` 빌드가 성공한다.
- 검증 기록에 direct surface와 shared regression scope가 남는다.

## Execution Checklist

- [x] seller screen IR inventory/page ordering을 확인하고 `FRT_002` source mapping을 복구한다.
- [x] public login shell을 `FRT_002/FRT_003` spec 구조에 맞춰 정렬한다.
- [x] `FRT_004` 비밀번호 찾기 shell을 spec 구조에 맞춰 재구성한다.
- [x] SDD build/verify 기록과 screen todo 상태를 갱신한다.
- [x] `screen_ir` validator 결과를 남기고 다음 화면으로 이동한다.

## Current Notes

- inventory parser가 PDF 첫 페이지 4열 inventory를 column order로 읽어 `FRT_002`가 잘못된 page에 매핑되는 문제가 있었다.
- `build_template_screen_ir.py`에서 `screen_code` numeric sort를 적용해 seller/dealer/admin registry ordering을 복구했다.
- public login shell에서 admin tab과 spec에 없는 dealer 안내 블록을 제거했고, seller/dealer 2탭 card 중심 구조로 다시 맞췄다.
- `FRT_003`는 `FRT_002`와 달리 dealer 승인 안내 문구를 노출하고 social login 영역을 숨기는 variant로 정리했다.
- `FRT_004`는 기존 `AuthScaffold` 기반 구성을 제거하고, spec 기준 public auth shell/card와 역할 선택 상태를 유지하는 비밀번호 찾기 화면으로 재구성했다.
- `FRT_004`는 password reset API가 실제 이메일/역할 조합을 검사하도록 바꿨고, 프론트는 성공/가입 정보 없음 결과를 각각 분기해 표시한다.

## Validation

- `pnpm --dir client/web build`
- `python3 sdd/99_toolchain/01_automation/validate_template_screen_ir.py --service seller`
- `POST http://localhost:3003/api/v1/auth/password-reset/request`

## Result

- `FRT_002` source mapping: `page_number 3`
- `FRT_003` route variant: `/login?role=dealer`에서 dealer 승인 안내 노출, social login 숨김 확인
- `FRT_004` route variant: `/forgot-password?role=seller|dealer`에서 역할 선택 상태 유지와 성공 후 확인 modal 확인
- `FRT_004` API branch: `USER_NOT_FOUND` 404와 성공 200을 각각 UI modal로 확인
- seller registry ordering: `FRT_001 -> FRT_008` numeric sequence 확인
- validator: `pass`
