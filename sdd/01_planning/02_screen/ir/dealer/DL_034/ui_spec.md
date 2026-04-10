# DL_034 UI Spec

- screen code: `DL_034`
- screen name: `약관및회원탈퇴`
- primary route: `/dealer/settings/terms`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `35`

## Screen Requirements

### 1. 약관 보기 영역
  - 서비스 이용에 적용되는 모든 약관 문서의 열람 영역
  - 각 항목은 외부 문서 뷰어로 연결됨
  - PALKA 딜러 서비스 이용약관
  - 개인정보 처리방침
  - 딜러 정산 및 수수료 정책
  - 해외(수출) 거래 이용약관
  - 약관 내용은 수정 불가, 열람 전용

### 2. 딜러 회원 탈퇴 영역
  - 딜러 계정 삭제를 요청하는 최종 절차 영역
  - 회원 탈퇴 전 계정 상태 종합 검증 수행
  - 진행 중 거래 존재 여부
  - 미정산 거래 존재 여부
  - 법적 보관 대상 데이터 존재 여부
  - 탈퇴 성공 시, 해당 계정 로그인은 차단되며 랜딩페이지
  - (FRT_001) 화면으로 이동

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
