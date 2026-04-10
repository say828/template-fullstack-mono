# FRT_023 UI Spec

- screen code: `FRT_023`
- screen name: `검차일정상세`
- primary route: `/seller/vehicles/:vehicleId/inspection/detail`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `24`

## Screen Requirements

### 1. 확정 검차 일정 정보 영역
  - 제안된 일정, 담당 평가사, 검차 장소, 담당자 연락처, 검
  - 차 유형, 준비 서류 목록이 확정 데이터로 노출됨.
  - 본 정보는 검차 일정 확정 시점의 데이터 스냅샷으로 유
  - 지되며 수정·변경 불가 상태로 고정됨.
  - 본 영역의 정보는 검차 단계 진행 상태를 재확인하는 기
  - 준 데이터로 사용됨.

### 2. 확인 버튼
  - 클릭 시 본 팝업 종료됨.
  - 검차 단계 차량 상세 화면(FRT_022)으로 복귀됨.
  - 거래 상태에는 어떠한 변경도 발생하지 않음.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
