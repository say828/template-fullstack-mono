# ADM_024 UI Spec

- screen code: `ADM_024`
- screen name: `검차운영상세(리포트제출)`
- primary route: `/admin/inspections/:vehicleId`
- access: `role:ADMIN`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `25`

## Screen Requirements

### 1. 검차 결과 확정 영역
  - 검차 일정 확정 이후 평가사가 제출한 최종 검차 결과 스
  - 냅샷을 고정 노출하는 영역.
  - 본 영역 데이터는 검차 완료 시점에 서버에 확정 저장된
  - 원본 데이터
  - • 저장 이후 모든 필드는 수정·삭제·재입력 불가
  - • 거래 상태가 검차완료로 전환되는 결정 기준 데이터
  - 외관 / 엔진·미션 / 사고 이력 / 침수 이력 / 주행 성능
  - - 평가사 단일 판정값 저장 (정상 / 이상)
  - - 감가 협의 단계의 1차 판정 기준 데이터
  - 정비 권장 항목
  - - 평가사가 체크한 정비 필요 항목 집합
  - - 감가 사유 산정 시 근거 데이터로 자동 참조
  - 최종 판정 코멘트
  - - 평가사의 정성 판단 텍스트
  - - 분쟁 및 감가 협의 시 근거 로그로 사용
  - 사진 첨부
  - - 검차 당시 촬영한 원본 이미지 파일
  - - 서버 원본 저장, 수정·삭제·재업로드 불가
  - 검차 리포트
  - - PDF 형식 공식 검차 보고서
  - - 서버 고정 저장, 다운로드만 허용
  - 본 영역 확정 시점에 거래 상태는 검차완료로 전환되며,
  - 이후 감가 협의 탭이 활성화된다.

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
