# FRT_027 UI Spec

- screen code: `FRT_027`
- screen name: `상세보기(감가협의후)`
- primary route: `/seller/vehicles/:vehicleId/detail/depreciation-completed`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `28`

## Screen Requirements

### 1. 감가 협의 결과 패널
  - 감가 협의가 서버 기준으로 완료 상태로 확정된 거래의
  - 요약 결과 데이터가 로드됨.
  - 기존 낙찰가, 최종 감가 금액, 최종 거래 금액, 선정 딜러
  - 정보가 정산 기준 원본 데이터로 고정 노출됨.
  - 본 패널 노출 시점부터 감가 협의 관련 기능은 전면 종료
  - 되며, 감가 협의 이전 단계로의 복귀는 불가 상태로 유지
  - 됨.
  - 감가 내용 확인 버튼 클릭 시 감가 협의 상세 화면으로 전
  - 환(FRT_028)되며, 확정된 감가 항목·사유·금액·증빙 이
  - 력 데이터가 읽기 전용으로 노출됨.
  - 본 패널은 이후 딜러의 인도 일정 등록 트리거 발생 전까
  - 지 유지되며, 딜러가 인도 일정 데이터를 등록하는 순간
  - 해당 거래는 서버 기준으로 인도/정산 단계로 자동 전환
  - 됨

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
