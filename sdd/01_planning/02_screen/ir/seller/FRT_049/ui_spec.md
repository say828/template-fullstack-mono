# FRT_049 UI Spec

- screen code: `FRT_049`
- screen name: `1:1문의`
- primary route: `/support/inquiries`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `50`

## Screen Requirements

### 1. 문의 입력 폼 영역
  - 사용자가 문의를 접수하기 위해 입력해야 하는 필드 영역
  - 으로, 이메일, 문의 유형, 문의 제목, 문의 내용, 파일 첨부
  - 항목으로 구성됨
  - 각 항목은 필수/선택 여부에 따라 검증 로직이 적용됨

### 2. 개인정보 및 약관 동의 체크박스
  - 문의 접수 전 필수 동의 확인 영역
  - 이용약관 / 개인정보 처리방침 링크 제공
  - 동의 체크 필수
  - 미동의 상태에서는 문의 접수 불가

### 3. 문의하기 버튼
  - 입력된 문의 내용을 최종 제출하는 버튼으로, 필수 입력
  - 값 및 약관 동의 조건이 충족된 경우에만 활성화됨
  - 클릭 시 문의 접수 완료 팝업이 노출되며, 팝업 내 확인 버
  - 튼 클릭 시 현재 화면을 유지한 채 입력된 문의 내용이 초
  - 기화됨
- 운영팀이 확인 후 등록하신 이메일로
  - 답변을 드릴 예정입니다.
  - 확인

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
