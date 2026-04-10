# UI Parity Artifact Layout

권장 루트:

- `sdd/03_verify/10_test/ui_parity/`

필수 파일:

- latest proof json
  - 예: `templates_platform_agentic_dev_latest.json`

권장 하위 구조:

- `reference/`
- `<timestamp>/actual/`
- `<timestamp>/diff/`
- `loop_runs/`
- `staged_runs/`

정책:

- latest proof json은 항상 고정 경로를 사용한다.
- timestamp run directory는 회차별 evidence 보존용이다.
