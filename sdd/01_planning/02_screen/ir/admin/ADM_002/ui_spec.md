# ADM_002 UI Spec

- screen code: `ADM_002`
- screen name: `비밀번호찾기`
- primary route: `/forgot-password`
- access: `public`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `3`

## Screen Requirements

### 1. 아이디(이메일) 입력 필드
  - 어드민 계정 생성 시 등록한 이메일 주소를 입력하는 필
  - 드
  - 입력된 이메일은 어드민 DB와 매칭하여 계정 존재 여부
  - 를 확인하며, 유효한 이메일 형식이 아닐 경우 즉시 오류
  - 메시지를 노출함

### 2. 비밀번호 찾기 버튼
  - 입력한 이메일이 어드민 DB에 존재할 경우, 해당 이메일
  - 로 임시 비밀번호 설정 링크를 발송함
  - 발송 성공 시 "임시 비밀번호가 이메일로 발송되었습니
  - 다" 메시지 표시
  - 발송 실패(등록되지 않은 이메일) 시 "등록되지 않은 이메
  - 일 주소입니다" 메시지 표시
  - 발송된 비밀번호는 로그인 후 반드시 변경하도록 유도
  - 임시 비밀번호로 최초 로그인 시 로그인 완료 직후 비밀
  - 번호 변경 팝업이 자동 호출됨
  - 임시 비밀번호 생성: 8자 이상의 랜덤 문자열 생성 후 암
  - 호화 저장
  - 확인

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
