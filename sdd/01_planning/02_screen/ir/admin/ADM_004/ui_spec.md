# ADM_004 UI Spec

- screen code: `ADM_004`
- screen name: `비밀번호변경`
- primary route: `/admin/password`
- access: `role:ADMIN`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `5`

## Screen Requirements

### 1. 기존 비밀번호 입력
  - 현재 로그인된 관리자 계정의 기존 비밀번호 입력 필드.
  - 입력 값은 마스킹 처리되며, 변경 요청 시 계정 정보와 대
  - 조 검증 기준 데이터로 사용됨.
  - 기존 비밀번호 불일치 시 이후 단계 진행 불가 상태 유지
  - 됨

### 2. 새 비밀번호 입력
  - 신규 비밀번호 입력 필드
  - 영문 대소문자, 숫자, 특수문자 중 2가지 이상 조합,
  - 10~16자 규칙을 충족해야 하며, 규칙 불충족 시 오류 상
  - 태 유지됨.

### 3. 새 비밀번호 확인
  - 신규 비밀번호 재입력 필드
  - 2번 항목과 값 불일치 시 즉시 오류 메시지 노출되며 변
  - 경 확정 불가 상태 유지됨.

### 4. 취소 버튼
  - 변경 프로세스 중단 및 팝업 닫힘
  - 입력된 모든 데이터 폐기됨

### 5. 비밀번호 변경 버튼
  - 모든 검증 조건 충족 시 활성화되며, 클릭 시 비밀번호 변
  - 경 처리 요청 실행
  - 변경 완료 시 관리자 계정 인증 정보 즉시 갱신됨.
- 새 비밀번호로 다시 로그인해 주세요.
  - 확인

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
