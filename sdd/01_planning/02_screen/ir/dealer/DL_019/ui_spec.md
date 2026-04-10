# DL_019 UI Spec

- screen code: `DL_019`
- screen name: `영수증증빙`
- primary route: `/dealer/transactions/:vehicleId/receipt`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `20`

## Screen Requirements

### 1. 거래 명세서 발급 정보 영역
  - 선택된 거래에 대해 발급 가능한 증빙 문서 묶음의 요약
  - 정보 표시 영역.
  - 낙찰 확정 시 생성된 거래 고유 식별값을 기준으로 모든
  - 증빙 문서가 서버에 매핑되어 저장됨
  - 해당 영역은 선택된 거래가 ‘거래 완료’ 상태일 때만 호출
  - 가능하며, 거래가 종료되지 않은 경우 본 팝업은 호출되
  - 지 않음

### 2. 증빙서류 일괄 다운로드 버튼
  - 선택된 거래의 모든 증빙 문서를 ZIP 파일 형태로 일괄
  - 다운로드하는 실행 버튼.
  - 클릭 시 서버에서 해당 주문번호 기준 증빙 문서 패키지
  - 생성
  - 파일 생성 완료 후 즉시 다운로드 시작
  - 다운로드 완료 여부는 거래 상태에 영향 없음
  - 동일 거래에 대해 다운로드 횟수 제한 없음
  - 문서 내용 수정·삭제·재발급 기능 제공하지 않음

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
