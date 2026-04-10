# FRT_019 UI Spec

- screen code: `FRT_019`
- screen name: `상세보기(검차일정전)`
- primary route: `/seller/vehicles/:vehicleId/detail/inspection-pending`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `20`

## Screen Requirements

### 1. 검차 진행 요약 패널
  - 현재 최고 입찰가, 낙찰 딜러, 검차 일정, 검차 장소가 확
  - 정 데이터로 노출됨.
  - 검차 일정이 서버에 등록되지 않은 경우, 일정 및 장소는 -
  - 상태로 노출됨
  - 검차 일정 확인 버튼은 어드민이 검차 일정 요청을 등록
  - 한 경우에만 활성화됨.
  - 어드민 등록 데이터가 존재하지 않을 경우 버튼은 비활성
  - 화 상태로 노출됨.
  - 버튼 클릭 시 검차 일정 요청 팝업(FRT_020) 호출됨.
  - 본 패널의 정보는 검차 단계의 진행 가능 여부를 판단하
  - 는 기준 데이터로 사용됨

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
