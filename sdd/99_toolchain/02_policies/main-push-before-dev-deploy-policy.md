# Main Push Before DEV Deploy Policy

## Purpose

템플릿 저장소에서도 branch-to-main-to-DEV 반영 순서를 고정해 재현 가능성과 추적 가능성을 확보한다.

## Required Order

1. 관련 작업에 맞는 work branch를 생성한다.
2. 관련 변경을 구현하고 work branch를 origin에 push한다.
3. root compose baseline 또는 해당 검증 surface build를 확인한다.
4. 관련 변경을 `main`에 반영한다.
5. Git 원격 `main` push를 완료한다.
6. 그 커밋 기준으로 `DEV(개발계)` 배포를 수행한다.
7. 배포된 DEV 환경에서 실제 동작을 검증한다.
8. 필요한 SDD 문서를 현재 상태 기준으로 갱신한다.

## Rules

- `DEV` 반영이 필요한 작업은 task-fit work branch를 먼저 만들고 branch push를 남긴다.
- `DEV` 반영이 필요한 작업은 `main` push 이전에 선배포하지 않는다.
- 수동 배포 단계여도 `branch push -> build -> main merge/push -> DEV 배포 -> DEV 검증 -> 문서 갱신` 순서를 유지한다.
- 검증 중 문제가 발견되면 다시 `수정(branch) -> branch push -> build -> main merge/push -> DEV 재배포 -> DEV 재검증`을 반복한다.
- 템플릿 샘플 앱/서버도 실제로 부팅되고 검증 가능한 상태를 유지한다.
