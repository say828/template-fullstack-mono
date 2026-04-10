# FRT_011 UI Spec

- screen code: `FRT_011`
- screen name: `알림`
- primary route: `/support/notifications`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `12`

## Screen Requirements

### 1. 알림 목록 영역
  - 최신 알림이 상단에 노출되는 최신순 정렬
  - 각 알림 항목 구성
  - · 알림 아이콘
  - · 알림 제목
  - · 알림 설명 문구
  - · 발생 일시
  - · 미확인 상태 표시용 우측 빨간 점(dot)
  - 알림 유형 예시
  - · 새 입찰 도착
  - · 입찰가 갱신
  - · 입찰 마감 임박
  - · 감가 요청 도착
  - · 검차 일정 확정
  - · 송금 완료
  - · 정산 완료 등
  - 미확인 알림은 dot 표시 유지
  - 알림 항목 클릭 시 해당 알림 유형에 연결된 관련 기능 화
  - 면으로 이동 (예: 입찰 알림 → 차량 상세 화면)

### 2. 전체 읽음 처리 버튼
  - 패널 하단에 ‘모두 읽음’ 버튼 고정 노출
  - 클릭 시:
  - · 모든 알림 상태 → 읽음 처리
  - · 모든 dot 표시 제거
  - · GNB 알림 아이콘의 신규 알림 뱃지 제거
  - 읽을 알림이 없는 경우 비활성화 상태로 표시

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
