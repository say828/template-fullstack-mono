# UI Parity Route Gap Interface

입력:

- `--service`
  - 화면 카탈로그를 소유하는 프론트 디렉터리 또는 서비스 이름
- `--screens`
  - spec screen catalog json path
- `--routes`
  - route catalog json path
- `--out`
  - route gap json output path
- `--markdown-out`
  - optional markdown summary output path

분류 규칙:

- `direct`
  - route가 1:1로 연결된 화면
- `shared`
  - 여러 screen id가 같은 route를 공유하거나 route entry가 `binding=shared`
- `stateful`
  - direct route 대신 상태 전이에 의존하거나 `binding=stateful`
- `missing`
  - route entry가 없거나 `binding=missing`

planning evidence 필드:

- `binding_source`
  - `explicit` 또는 `inferred`
- `coverage_state`
  - `route_bound`, `shared_route`, `state_transition`, `unmapped`
- `evidence_level`
  - `strong`, `medium`, `weak`, `missing`
- `duplicate_route_groups`
  - 같은 route를 여러 screen id가 공유하는 그룹

출력 JSON:

- `generated_at`
- `service`
- `screens_path`
- `routes_path`
- `summary`
  - `total`
  - `direct`
  - `shared`
  - `stateful`
  - `missing`
  - `coverage_ratio`
  - `explicit_bindings`
  - `strong_evidence`
  - `medium_evidence`
  - `weak_evidence`
  - `with_notes`
  - `with_tags`
  - `duplicate_route_groups`
- `duplicate_route_groups[]`
  - `route`
  - `screen_ids[]`
- `screens[]`
  - `id`
  - `title`
  - `route`
  - `binding`
  - `binding_source`
  - `coverage_state`
  - `evidence_level`
  - `route_defined`
  - `has_notes`
  - `has_tags`
  - `duplicate_route_ids[]`
  - `tags[]`
  - `status`
  - `notes[]`

주요 생성 경로 예시:

- `sdd/02_plan/99_generated/from_planning/ui_parity/platform.route_gap_report.json`
- `sdd/02_plan/99_generated/from_planning/ui_parity/platform.route_gap_report.md`
- `sdd/02_plan/99_generated/from_planning/ui_parity/mobile.route_gap_report.json`
- `sdd/02_plan/99_generated/from_planning/ui_parity/mobile.route_gap_report.md`
