# FRT_040 UI Spec

- screen code: `FRT_040`
- screen name: `정산계좌미등록`
- primary route: `/settings/settlement/empty`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `41`

## Screen Requirements

### 1. 정산 계좌 등록하러 가기
  - 판매자의 현재 계좌 등록 상태가 미등록임이 판단되어 본
  - 화면 노출 상태로 진입됨
  - 정산 계좌 미등록 상태에서는 거래가 완료되어도 정산 처
  - 리 불가 상태로 유지됨
  - [정산 계좌 등록하러 가기] 선택 시 정산 계좌 등록 화면
  - (FRT_041)으로 전환

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
