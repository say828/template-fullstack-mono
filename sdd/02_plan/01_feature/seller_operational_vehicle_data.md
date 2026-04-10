# seller operational vehicle data

- Owner: Codex
- Status: done

## Scope

- 로컬 development runtime에서 `sl@template.com` 판매자 운영 계정에 상태별 차량 운영 데이터를 생성한다.
- 입찰 현황, 입찰 마감, 검차, 감가 협의, 인도/정산, 거래 완료를 대표하는 차량을 만들어 seller screen smoke에 재사용한다.
- local bootstrap은 idempotent해야 하며, production runtime에는 실행되지 않아야 한다.

## Assumptions

- `sl@template.com`, `dl1@template.com`, `dl2@template.com` local bootstrap 계정은 이미 존재하거나 함께 동기화된다.
- 운영 데이터는 개발용 고정 제목과 번호판을 사용해 재실행 시 중복 생성을 피한다.
- 각 상태는 seller 화면에서 대표적으로 확인할 수 있는 최소 1개 이상의 차량으로 표현한다.

## Acceptance Criteria

- local startup 또는 1회 bootstrap 실행으로 `sl@template.com`에 차량 운영 데이터가 생성된다.
- seller 목록에는 입찰 진행, 입찰 마감, 검차, 감가 협의, 인도/정산, 거래 완료를 대표하는 차량이 존재한다.
- 입찰 현황 화면은 활성 입찰과 최고 입찰가를 보여줄 수 있다.
- 감가 내용 확인 화면은 검차 완료 이후 기본 감가 항목을 보여줄 수 있다.
- 반복 실행해도 같은 운영 데이터가 중복 생성되지 않고 원하는 상태로 복구된다.
- `pnpm --dir client/web build`와 server bootstrap/verification tests가 통과한다.

## Execution Checklist

- [x] 현재 seller/vehicles, bidding, trades bootstrap 경로를 확인한다.
- [x] 운영 차량과 workflow 상태 매핑을 정의한다.
- [x] 로컬 bootstrap 코드와 1회 실행 스크립트를 추가한다.
- [x] 반복 실행 검증을 통해 중복 row가 생기지 않음을 확인한다.
- [x] 실제 dev DB에 운영 데이터를 생성하고 smoke check를 수행한다.

## Current Notes

- identity bootstrap은 계정만 보장하므로 차량/워크플로우는 별도 운영 데이터 생성이 필요하다.
- `FRT_013` 화면군은 한 계정에 여러 상태의 차량이 있어야 route smoke와 상세 화면 확인이 편하다.
- active vehicle 1개, closed/cancelled 1개, inspection/depreciation/delivery/completed 대표 차량을 각각 두는 구성이 적절하다.
- live DB에는 `sl@template.com` 운영 계정 기준 차량 6대만 남아 있고, `11가 1307`은 `SETTLEMENT` workflow를 가진 정산 확인 row이므로 `FRT_013` 목록에서는 `인도/정산` 태그로 보여야 하며 반복 bootstrap 실행 시 중복 row는 생기지 않고 운영 차량 상태를 갱신한다.
- 카드 노출 순서는 `입찰 현황 -> 감가 내용 확인 -> 검차 -> 입찰자 선택하기 -> 정산 확인 -> 상세 보기`가 되도록 `created_at` 내림차순을 맞춘다.
- `감가 내용 확인`, `검차 일정 확인`, `정산 확인` 카드는 좌측 `상세 보기` 버튼과 함께 primary action을 노출한다.

## Validation

- `docker compose exec -T server sh -lc '. .venv/bin/activate && python -m py_compile contexts/vehicles/bootstrap.py'`
- `docker compose exec -T server sh -lc '. .venv/bin/activate && python - <<\"PY\" ... ensure_local_demo_vehicle_data(db) twice ... PY'` -> `{'first_run_changed': True, 'second_run_changed': True, 'count_after_first': 6, 'count_after_second': 6}`
- `curl -sS -X POST http://127.0.0.1:8000/api/v1/auth/login ...` -> login token for `sl@template.com`
- `curl -sS http://127.0.0.1:8000/api/v1/vehicles/my -H \"Authorization: Bearer ...\"` -> 6 vehicles
- `docker compose exec -T server sh -lc '. .venv/bin/activate && python - <<\"PY\" ... workflow_count for 11가 1307 ... PY'` -> `workflow_count: 1`, `current_stage: SETTLEMENT`
