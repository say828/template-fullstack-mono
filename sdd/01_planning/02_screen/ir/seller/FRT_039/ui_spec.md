# FRT_039 UI Spec

- screen code: `FRT_039`
- screen name: `정산계좌`
- primary route: `/settings/settlement`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `40`

## Screen Requirements

### 1. 등록된 정산 계좌 영역
  - 로그인 판매자 기준으로 현재 적용 중인 정산 계좌 정보
  - 조회
  - 본 정보는 신규 거래 생성 시 해당 거래의 정산 계좌로 복
  - 사 저장됨
  - 거래별 정산 계좌는 거래 생성 시점 기준으로 고정 저장
  - 되므로 이후 본 화면에서 계좌 변경이 발생해도 기존 거
  - 래에는 영향 없음
  - 정산 대기 / 정산 완료 거래는 각 거래에 저장된 계좌 정
  - 보 기준으로 정산 처리
  - 계좌 정보 미등록 상태일 경우 이후 거래 생성 및 정산 흐
  - 름에서 계좌 등록 요구 상태로 분기 (FRT_040 참고)

### 2. 계좌 변경하기 버튼
  - 클릭 시 정산 계좌 수정 화면(FRT_041) 진입
  - 변경 완료 시 판매자 기준 기본 정산 계좌 정보 갱신
  - 변경 이후 생성되는 거래부터 신규 계좌 적용
  - 이미 생성된 거래의 정산 계좌에는 영향 없음

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
