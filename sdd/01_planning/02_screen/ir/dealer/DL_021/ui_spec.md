# DL_021 UI Spec

- screen code: `DL_021`
- screen name: `거래결제상세(검차일정확정)`
- primary route: `/dealer/transactions/:vehicleId/detail/inspection-confirmed`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `22`

## Screen Requirements

### 1. 검차 일정 확정 영역
  - 검차 일정이 최종 확정된 상태를 표시하는 정보 영역.
  - 검차 일시: 평가사가 실제 검차를 수행할 예약 일시
  - 검차 장소: 검차 진행 주소
  - 담당 평가사: 배정된 검차 담당자 이름
  - 상태 태그: 일정 확정
  - 해당 정보는 검차 완료 전까지 수정 불가 상태로 고정되
  - 며, 검차 결과 등록 시 자동으로 다음 단계로 전환됨.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
