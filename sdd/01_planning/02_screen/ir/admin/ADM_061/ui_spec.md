# ADM_061 UI Spec

- screen code: `ADM_061`
- screen name: `권한그룹수정등록`
- primary route: `/admin/permissions/:groupCode`
- access: `role:ADMIN`
- source spec: `sdd/01_planning/02_screen/ir/admin/admin_screen_spec.pdf`
- page number: `62`

## Screen Requirements

### 1. 권한 그룹 기본 정보 입력 영역
  - 권한 그룹 이름
  - 관리자 계정에 할당되는 권한 묶음의 식별 키
  - 시스템 내 중복 불가
  - 목록·권한 매트릭스·관리자 배정 기준값으로 사용
  - 설명
  - 해당 권한 그룹의 역할·책임 범위에 대한 운영 설명
  - 관리자 배정 판단 참고용 정보
  - 외부 노출 없음, 내부 운영 관리 목적 데이터
  - 사용 여부
  - 사용: 관리자 계정에 배정 가능 상태
  - 미사용: 신규 배정 불가 상태
  - 권한 관리 메인 목록의 사용/미사용 배지 표시 기준

### 2. 취소
  - 입력 내용 저장 없이 팝업 종료
  - 신규 생성 상태에서 취소 시: 그룹 생성 없음
  - 수정 상태에서 취소 시: 기존 그룹 정보 유지

### 3. 저장
  - 현재 입력된 그룹 정보를 권한 그룹 기준 데이터로 확정
  - 저장 성공 시 처리 결과
  - 신규: 좌측 권한 그룹 목록에 즉시 추가
  - 수정: 기존 그룹 카드 정보 즉시 갱신
  - 이후 권한 매트릭스 편집 가능 상태로 전환

## Notes

- 이 문서는 seller/dealer/admin 화면명세서 PDF의 우측 요구사항 텍스트를 그대로 옮긴다.
- 평면 배치와 점유 관계는 같은 폴더의 `ui_grid.csv`를 기준으로 본다.
- grid/spec/img 연결 정보와 block-requirement 매핑은 같은 폴더의 `ui_context.json`을 기준으로 본다.
