# FRT_045 UI Spec

- screen code: `FRT_045`
- screen name: `약관및회원탈퇴`
- primary route: `/settings/terms`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `46`

## Screen Requirements

### 1. 약관 열람 영역
- 서비스 이용 및 계정 처리 기준에 대한 공식 문서 열람 영역.
  - 이용약관 / 개인정보 처리방침 / 정산 및 수수료 정책 /
  - 위치기반 서비스 이용약관 문서 제공
  - 각 항목 [열기] 클릭 시 해당 문서 전문 별도 화면 호출

### 2. 회원 탈퇴 실행 영역
  - 계정 탈퇴 최종 실행 영역.
  - 거래중 및 정산대기 상태인 거래가 없을 경우, 회원탈퇴
  - 버튼 클릭 시 탈퇴 확인 팝업을 호출하며 즉시 탈퇴 처리
  - 됨.
  - 탈퇴 완료 시 계정 및 개인정보영구삭제 처리후 랜딩페이
  - 지(FRT_001) 화면으로 이동함

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
