# Functional E2E Gate Policy

## Purpose

기능 미구현, 누락된 플로우, migration 미적용, schema drift로 인한 런타임 실패를 completion 이전에 막기 위한 full-layer E2E gate를 고정한다.

## Rules

- 검수 확인서, acceptance checklist, approved use case inventory 중 하나를 기능 E2E 케이스의 정본 source로 유지한다.
- 승인된 기능 요구사항/체크리스트 항목마다 최소 하나 이상의 retained test case id를 연결한다.
- auth, mutation, persistence, upload/download, workflow side effect, notification, background job이 걸린 기능은 UI/API/persistence/side effect를 함께 보는 full-layer E2E gate를 가진다.
- persistence나 migration이 영향을 줄 수 있는 기능은 migration apply check와 DEV/PROD 실제 schema verification이 통과하기 전까지 완료로 보지 않는다.
- 선택한 기능 E2E surface, test case mapping, 생략 사유, residual risk는 `sdd/02_plan`과 `sdd/03_verify`에 current-state로 유지한다.
