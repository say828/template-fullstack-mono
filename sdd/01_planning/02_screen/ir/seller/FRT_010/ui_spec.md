# FRT_010 UI Spec

- screen code: `FRT_010`
- screen name: `내차량(초기)`
- primary route: `/seller/vehicles/initial`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `11`

## Screen Requirements

### 1. GNB 영역
  - 판매자 권한 기준 메뉴 노출
  - 내 차량
  - 거래·정산 : 클릭 시 거래정산내역(FRT_035) 화면으
  - 로 탭 전환
  - 설정 : 클릭 시 계정정보(FRT_038) 화면으로 탭 전환
  - 고객센터 : 클릭 시 자주묻는질문(FRT_046) 화면으
  - 로 탭 전환
  - 현재 화면은 ‘내 차량’ 탭 선택 상태로 표시됨.

### 2. 알림 아이콘
  - 판매자 계정에 발생한 시스템 알림 노출.
  - 신규 알림이 존재할 경우 아이콘 우측 상단에 뱃지(dot)
  - 가 표시됨
  - 클릭 시 알림 패널 화면(FRT_011) 이 오버레이 형태로
  - 노출되며, 알림 항목 클릭 시 관련 화면으로 이동함

### 3. 프로필 아이콘
  - 사용자 아바타(기본 아바타) 원형 버튼 + 사용자명으로
  - 노출됨
  - 클릭 시 사용자 메뉴 패널(FRT_012)이 드롭다운 형태로
  - 노출되며, 계정 정보 및 로그아웃 버튼을 제공함

### 4. 신규 차량 등록 버튼
  - 클릭 시 차량 등록 화면(FRT_033)으로 이동.
  - 차량 등록 완료 후 본 화면은 차량 목록 화면 상태로 전환
  - 됨.(FRT_013 참고)

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
