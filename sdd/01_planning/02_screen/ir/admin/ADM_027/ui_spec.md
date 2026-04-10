# ADM_027 UI Spec

- screen code: `ADM_027`
- screen name: `감가협의상세(승인대기)`
- primary route: `/admin/depreciations/:vehicleId`
- access: `role:ADMIN`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `28`

## Screen Requirements

### 1. 감가 제안 이력 (제안 완료 상태 노출)
  - 본 영역은 딜러가 등록한 감가 제안 결과의 최종 스냅
  - 감가 제안 완료 상태에서만 노출됨
  - • 필드 구성 : 원 낙찰가 / 제안 감가 금액 / 제안 후 최종
  - 거래가(예상)
  - 감가 사유 요약 : 외관 흠집, 타이어 마모, 하부 누유 등 딜
  - 러 입력 사유 고정 노출
  - 감가 항목 테이블
  - – 항목명 / 내용 / 감가액
  - – 항목별 감가액 합계 = 제안 감가 금액과 정합성 검
  - 증 필수
  - 본 영역의 모든 값은 딜러 제안 등록 시점 기준 고정되며,
  - 수정 / 삭제 / 재계산 불가함

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
