# FRT_022 UI Spec

- screen code: `FRT_022`
- screen name: `상세보기(검차일정후)`
- primary route: `/seller/vehicles/:vehicleId/detail/inspection-completed`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `23`

## Screen Requirements

### 1. 검차 진행 현황 패널
  - 현재 최고 입찰가, 선택된 딜러, 확정된 검차 일정, 검차
  - 장소가 확정 데이터로 노출됨.
  - 검차 일정 확인 버튼은 검차 일정이 확정된 경우에만 활
  - 성화됨.
  - 버튼 클릭 시 검차 일정 상세 팝업(FRT_023) 호출됨.
  - 본 패널 정보는 검차 단계의 진행 상태를 판단하는 기준
  - 데이터로 사용됨

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
