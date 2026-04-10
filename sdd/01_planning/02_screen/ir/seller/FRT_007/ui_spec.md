# FRT_007 UI Spec

- screen code: `FRT_007`
- screen name: `판매자회원가입완료`
- primary route: `/signup/seller/complete`
- access: `public`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `8`

## Screen Requirements

### 1. 로그인 하기 버튼
  - 클릭 시 로그인 화면(FRT_002)으로 이동됨.
  - 로그인 완료 후 판매자 전용 메인 화면(FRT_010)으로 즉
  - 시 전환됨.
  - 로그인 완료 시점에 판매자 계정 권한이 활성화되며, 이
  - 후 모든 화면은 판매자 GNB 및 거래 권한 기준으로 노출
  - 됨

### 2. 메인 페이지로 이동 버튼
  - 클릭 시 비로그인 상태의 랜딩 페이지(FRT_001) 로 이동
  - 됨.
  - 이동 후에도 계정은 생성 완료 상태로 유지되며, 사용자
  - 는 언제든지 로그인 화면을 통해 재인증 가능.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
