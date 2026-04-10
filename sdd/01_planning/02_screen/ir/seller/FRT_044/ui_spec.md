# FRT_044 UI Spec

- screen code: `FRT_044`
- screen name: `언어및지역`
- primary route: `/settings/locale`
- access: `role:SELLER`
- source spec: `sdd/01_planning/02_screen/ir/seller/seller_screen_spec.pdf`
- page number: `45`

## Screen Requirements

### 1. 언어 · 지역 설정 영역
  - 계정의 글로벌 사용 환경을 정의하는 핵심 설정 블록.
  - 표시 언어
  - 플랫폼 전체 UI, 시스템 메시지, 알림 콘텐츠의 표시
  - 언어 기준값.
  - 변경 시 메뉴명, 안내 문구, 시스템 알림이 선택 언어
  - 기준으로 동기화 전환
  - 기본 거래 국가
  - 계정의 주요 거래 국가 판단 기준값.
  - 거래 규정, 수수료 정책, 문서 양식, 통화·세금 기준 참
  - 조 국가로 사용됨.
  - 거래 프로세스 전반의 국가별 정책 분기 판단에 적용.
  - 표시 시간대
  - 플랫폼 내 모든 시간 정보(입찰 시간, 정산 시각, 로그
  - 시각 등)의 기준 타임존.
  - 거래 일정 계산, 정산 완료 시각, 알림 발송 시각 산정
  - 의 기준값으로 사용됨.
  - 해당 영역의 모든 변경 내용은 계정 환경 설정 데이터로
  - 저장되며 이후 UI 렌더링, 거래 정책 판단, 시스템 로그 기
  - 록 기준으로 적용된다.

### 2. 저장 실행
  - ① 영역의 변경 내용을 계정 환경 설정 데이터로 확정 저
  - 장하는 트리거.
  - 저장 완료 시 즉시 전 계정 환경에 반영.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
