# DL_032 UI Spec

- screen code: `DL_032`
- screen name: `알림설정`
- primary route: `/dealer/settings/notifications`
- access: `role:DEALER`
- source spec: `sdd/01_planning/02_screen/ir/dealer/dealer_screen_spec.pdf`
- page number: `33`

## Screen Requirements

### 1. 알림 채널 설정 영역
  - 딜러가 수신을 허용할 알림 채널을 선택하는 영역
  - 이메일, 문자(SMS), 웹 알림(브라우저) 3종 제공
  - 다중 선택 가능 구조
  - 하나 이상의 채널은 항상 활성 상태 유지 필요
  - 전체 비활성 시 저장 불가

### 2. 알림 유형 설정 영역
  - 각 알림 유형별 수신 여부를 개별 제어하는 영역
  - 입찰 관련 알림
  - 내 입찰 주최, 입찰 마감 임박, 입찰 성공/실패 결과 안
  - 내
  - 검차 및 감가 협의 알림
  - 차량 검차 일정, 검차 결과, 감가 요청, 감가 승인·거절
  - 안내
  - 인도/정산 진행 및 완료 알림
  - 차량 인도, 송금, 정산 처리 관련 핵심 진행 알림
  - 프로모션 및 서비스 공지
  - 이벤트, 정책 변경, 서비스 업데이트 안내
  - 각 항목은 개별 On/Off 설정 가능하며, 비활성화된 항목
  - 의 알림은 모든 채널에서 발송되지 않음

### 3. 저장 버튼
  - 현재 설정값을 최종 반영하는 확정 트리거
  - 저장 완료 시 이후 발생하는 모든 알림부터 즉시 적용

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
