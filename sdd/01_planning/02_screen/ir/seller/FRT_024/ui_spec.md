# FRT_024 UI Spec

- screen code: `FRT_024`
- screen name: `상세보기(감가협의전)`
- primary route: `/seller/vehicles/:vehicleId/detail/depreciation-pending`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `25`

## Screen Requirements

### 1. 감가 협의 진행 현황 패널
  - 현재 기준 입찰가, 선택된 딜러, 검차 일정, 검차 장소가
  - 확정 데이터로 노출됨.
  - 감가 내용 확인 버튼은 딜러의 감가 제안 데이터가 등록
  - 된 경우에만 활성화됨.
  - 감가 제안이 아직 등록되지 않은 경우 버튼은 비활성화
  - 상태로 노출됨.
  - 감가 제안이 등록된 경우, 버튼 클릭 시 감가협의
  - (FRT_025) 화면으로 이동함
  - 본 패널 정보는 감가 협의 판단의 기준 데이터로 사용됨.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
