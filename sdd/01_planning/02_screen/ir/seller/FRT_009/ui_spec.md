# FRT_009 UI Spec

- screen code: `FRT_009`
- screen name: `딜러회원가입완료`
- primary route: `/signup/dealer/complete`
- access: `public`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `10`

## Screen Requirements

### 1. 메인 페이지로 버튼
  - 클릭 시 비로그인 상태의 랜딩 페이지(FRT_001) 로 이동
  - 됨.
  - 계정 상태는 승인 대기 로 유지되며, 해당 사용자는 로그
  - 인 전까지 어떠한 딜러 서비스 화면에도 접근할 수 없음.
  - 승인 완료 전까지는 로그인 불가능

### 2. 로그인 화면으로 이동
  - 클릭 시 로그인 화면(FRT_003)으로 이동하나, 계정 상태
  - 가 “승인 대기” 상태일 경우, 로그인 불가능

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
