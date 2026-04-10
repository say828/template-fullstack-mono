# DL_007 UI Spec

- screen code: `DL_007`
- screen name: `매물상세(검차감가안내)`
- primary route: `/dealer/market/:vehicleId/inspection`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `8`

## Screen Requirements

### 1. 검차 프로세스 안내 영역
  - 해당 매물 거래 이후 진행되는 검차·감가 절차의 단계별
  - 흐름을 고정 정보로 제공하는 안내 영역
  - 모든 매물에 동일하게 노출되는 공통 정책 정보로, 거래
  - 조건·입찰 여부·입찰 금액에 따라 변경되지 않음
  - 딜러의 입찰 판단 이전에 거래 리스크 및 비용 구조를 명
  - 확히 인지시키는 목적의 고정 가이드 영역
  - 입찰 종료 후 낙찰 확정 시, PALKA가 매물 위치 및 일정
  - 정보를 기준으로 전문 평가사 자동 배정 흐름을 안내
  - 딜러의 추가 요청·선택 없이 내부 기준에 따라 배정 진행
  - 됨
  - 배정된 평가사가 차량 상태를 현장에서 직접 진단하고 검
  - 차 리포트를 시스템에 등록하는 단계임을 명시
  - 해당 리포트가 이후 감가 협의 및 최종 거래 가격 판단의
  - 근거 데이터로 사용됨
  - 검차 결과에 이상이 존재할 경우, 딜러 또는 판매자에게
  - 감가 제안이 발생할 수 있음을 명시
  - 판매자 승인 완료 시 최종 거래 가격이 확정되는 구조임
  - 을 고지

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
