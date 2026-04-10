# ADM_040 UI Spec

- screen code: `ADM_040`
- screen name: `판매자상세(차량이력)`
- primary route: `/admin/sellers/:sellerId/history`
- access: `role:ADMIN`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `41`

## Screen Requirements

### 1. 차량 판매 이력 목록 영역
  - 선택된 판매자 ID 기준으로 생성된 모든 거래 이력 목록
  - 이 시간순으로 고정 노출되는 영역
  - 각 거래의 현재 서비스 단계 상태값 그대로 노출
  - 상태 변경 발생 시 본 목록에서도 실시간 반영 필요
  - 동일 판매자의 복수 거래 상태를 동시에 비교·판단 가능
  - 거래 등록일 기준 최신순 정렬 유지
  - 각 카드 클릭 시 해당하는 매물의 거래상세(ADM_009
  - 등) 화면으로 이동

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
