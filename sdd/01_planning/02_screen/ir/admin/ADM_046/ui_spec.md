# ADM_046 UI Spec

- screen code: `ADM_046`
- screen name: `딜러상세(이력)`
- primary route: `/admin/dealers/:dealerId/history`
- access: `role:ADMIN`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `47`

## Screen Requirements

### 1. 입찰 참여 이력 리스트 영역
  - 선택된 딜러의 입찰 활동 내역을 최신순으로 고정 노출하
  - 는 핵심 판단 영역.
  - 각 이력은 거래 단위로 관리되며, 딜러가 참여한 모든 입
  - 찰 이벤트가 누적 기록됨.
  - 단일 이력 카드에 다음 정보가 결합되어 표시됨.
  - 입찰 상태
  - 낙찰 성공 : 해당 거래에서 최종 낙찰 확정
  - 입찰 참여 : 입찰에는 참여했으나 낙찰 미확정 상
  - 태
  - 차량 식별 정보 : 차종명 기준 표기
  - 입찰 시각 : 해당 입찰 이벤트가 기록된 기준 시점
  - 입찰 금액 : 해당 입찰 시점의 제출 금액
  - 이력 순서는 최신 활동 → 과거 활동 순으로 고정.
  - 본 탭의 데이터는 딜러 신뢰도·활동성·리스크 판단에 직
  - 접 반영되는 기준 이력으로 사용됨.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
