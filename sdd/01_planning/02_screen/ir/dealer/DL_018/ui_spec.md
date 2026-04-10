# DL_018 UI Spec

- screen code: `DL_018`
- screen name: `거래결제(완료)`
- primary route: `/dealer/transactions/completed`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `19`

## Screen Requirements

### 1. 거래 완료 목록 영역
  - 거래/결제 > 완료된 거래 탭 선택 시 노출되는 완료 거래
  - 리스트
  - 각 행은 하나의 완전 종결된 거래 단위
  - 모든 하위 프로세스(검차, 감가, 인도, 송금, 정산)가 완료
  - 상태로 확정된 데이터만 포함
  - 행 클릭 시 해당 거래의 거래 완료 상세(DL_029) 화면으
  - 로 전환됨
  - 거래번호: 낙찰 확정 시 생성되는 거래 고유 식별값
  - 매물 요약 정보: 거래 대상 차량 요약 정보 (차량명, 연식,
  - 주행거리, 연료)
  - 거래 유형(국내 / 해외(수출)): 거래가 국내 거래인지 해
  - 외 수출 거래인지 구분하는 유형 값
  - 낙찰가 : 입찰 종료 시 최종 낙찰된 금액
  - 감가 확정가 : 검차 이후 감가 협의가 반영되어 최종 확정
  - 된 거래 금액
  - 최종 단계: 송금·정산
  - 상태: 거래 완료

### 2. 거래 완료 증빙 열람 영역
  - 각 행 우측 영수증/증빙 아이콘 클릭 시 정산 완료 증빙
  - (DL_019) 다운로드 화면 호출
  - 송금 내역, 정산 내역, 세금계산서 등 거래 종료를 입증하
  - 는 자료 묶음

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
