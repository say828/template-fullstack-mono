# DL_033 UI Spec

- screen code: `DL_033`
- screen name: `보안비밀번호`
- primary route: `/dealer/settings/security`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `34`

## Screen Requirements

### 1. 비밀번호 변경 영역
  - 계정 로그인 비밀번호를 변경하는 보안 처리 영역
  - 기존 비밀번호 → 신규 비밀번호 → 신규 비밀번호 확인
  - 3단계 구조
  - 신규 비밀번호 규칙
  - 영문 대소문자, 숫자, 특수문자 중 2종 이상 조합
  - 10~16자
  - 신규 비밀번호와 확인값 불일치 시 변경 불가
  - 변경 완료 시 기존 로그인 세션 유지, 이후 로그인부터 신
  - 규 비밀번호 적용

### 2. 비밀번호 변경 버튼
  - 모든 입력값 검증 통과 시 변경 확정
  - 실패 시 오류 메시지 노출 및 변경 미처리

### 3. 로그인 보안 설정 영역
  - 새 기기 로그인 알림
  - 새로운 환경에서 로그인 발생 시 알림 발송 여부 설정
  - 장기 미접속 자동 로그아웃
  - 미접속 상태 지속 시 세션 자동 종료 시간 설정
- 새 비밀번호로 다시 로그인해 주세요.
  - 확인

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
