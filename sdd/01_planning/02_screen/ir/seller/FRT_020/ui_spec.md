# FRT_020 UI Spec

- screen code: `FRT_020`
- screen name: `검차일정확인`
- primary route: `/seller/vehicles/:vehicleId/inspection`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `21`

## Screen Requirements

### 1. 검차 일정 제안 정보 영역
  - 어드민이 등록한 검차 일정, 담당 평가사, 검차 장소, 담당
  - 연락처, 검차 유형, 준비 서류 목록이 노출됨.
  - 해당 정보는 서버 기준 확정 제안 데이터로 표시되며 수
  - 정 불가 상태로 유지됨.
  - 본 영역의 데이터는 검차 일정 승인 여부 판단의 기준 정
  - 보로 사용됨.

### 2. 다른 일정 요청 버튼
  - 클릭 시 다른 일정 요청 팝업 화면(FRT_021)으로 전환
  - 됨.
  - 현재 제안된 검차 일정은 미확정 상태로 유지됨.
  - 검차 단계는 유지되며 감가 협의 단계로는 진행되지 않음

### 3. 일정 승인하기 버튼
  - 클릭 시 해당 검차 일정이 확정 상태로 전환됨.
  - 검차 일정은 이후 판매자·딜러·어드민 모두에게 변경 불
  - 가 상태로 저장됨.
  - 검차 단계가 진행 가능 상태로 확정됨.
  - 검차 일정이 확정되었습니다.
  - 확인

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
