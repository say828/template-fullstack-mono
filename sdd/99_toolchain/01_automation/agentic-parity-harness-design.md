# Agentic Parity Harness Design

## Purpose

이 템플릿은 단일 서비스 starter가 아니라, 복제 후 각 서비스가 자기 저장소 안에서 SDD 기반 하네스를 완결적으로 소유하는 출발점이다.

따라서 이 문서의 목표는 다음이다.

- 템플릿을 복제한 각 서비스 레포가 외부 하네스 저장소 없이도 `build -> proof -> deploy_dev -> verify_dev`를 실행하게 한다.
- `agentic-dev` 계약, parity proof, phase runner, 분석기 같은 하네스 도구를 모두 `99_toolchain` 아래 정본으로 둔다.
- UI parity strict proof를 프론트엔드 템플릿의 기본 하네스로 포함한다.
- `proof`와 DEV 검증을 선택이 아니라 기본 강제 phase로 설계한다.
- 스킬은 하네스 도구의 구현체가 아니라, `99_toolchain` 도구를 호출하는 인터페이스로만 동작한다.
- 외부 collector/연구 시스템은 integration 대상일 뿐, 서비스 레포 내부 구현으로 복사하지 않는다.

## Core Position

이 설계에서는 `agentic-dev`와 parity proof를 separate ad-hoc scripts로 흩어두지 않는다.

대신 다음처럼 해석한다.

- `agentic-dev`
  - 서비스별 phase 계약
- `99_toolchain`
  - 그 계약을 실행하는 공용 하네스 런타임의 repo-local 정본
- skill
  - `99_toolchain` 실행기를 호출하는 얇은 orchestration surface

그리고 템플릿에서는 하네스 런타임을 `99_toolchain`으로 흡수한다.

즉 복제 후 각 서비스 레포 안에는 둘 다 존재한다.

- 서비스별 계약 파일
- `99_toolchain` 하네스 실행기

이렇게 해야 각 서비스 레포가 self-contained 가 된다.

## Design Principles

- self-contained first:
  - 복제된 서비스 레포는 외부 skill 저장소가 없어도 하네스를 실행할 수 있어야 한다.
- toolchain-owned execution:
  - 하네스 실행 스크립트와 분석기는 `99_toolchain`의 소유물이어야 한다.
- repo-local contract:
  - 각 서비스는 자기 `build`, `proof`, `deploy_dev`, `verify_dev`, `proof_output`를 자기 레포 안에서 선언한다.
- deterministic proof:
  - `proof`는 strict parity 또는 동등한 결정적 UI 증거를 남겨야 한다.
- evidence-first:
  - 성공/실패는 콘솔 로그가 아니라 `sdd/03_verify/...` 산출물로 판단한다.
- deploy discipline:
  - DEV 반영이 필요한 작업은 `main push -> DEV deploy -> DEV verify`를 따른다.
- external integration boundary:
  - collector/backend/research 시스템은 외부에 두고, repo에는 adapter와 contract만 둔다.

## Required Template Surface

### 1. Toolchain-owned agentic runtime

템플릿 안에 다음 runtime을 `sdd/99_toolchain/01_automation/agentic-dev/`로 포함한다.

- `sdd/99_toolchain/01_automation/agentic-dev/run_repo_phase.sh`
- `sdd/99_toolchain/01_automation/agentic-dev/resolve_repo_contract.py`
- `sdd/99_toolchain/01_automation/agentic-dev/init_repo_contract.sh`
- `sdd/99_toolchain/01_automation/agentic-dev/analyze_proof_results.py`
- optional:
  - `sdd/99_toolchain/01_automation/agentic-dev/bootstrap_spec_workspace.sh`
  - `sdd/99_toolchain/01_automation/agentic-dev/assets/repo-contract.template.json`

설계 규칙:

- 이 파일들은 외부 저장소 참조가 아니라 템플릿 payload다.
- 템플릿 개선 시 상위 `templates`에서 갱신하고, 각 서비스는 필요시 역전파한다.
- 각 서비스 레포는 이 runtime을 자기 소유 코드처럼 취급한다.
- skill은 이 디렉터리의 실행기를 호출해야 하며, 별도 구현을 복제하면 안 된다.

### 2. Agentic contract layer

- `sdd/99_toolchain/01_automation/agentic-dev/repo-contract.json`
- `.codex/agentic-dev.json`
- `.claude/agentic-dev.json`

필수 contract shape:

```json
{
  "schema_version": 1,
  "name": "<service-name>",
  "spec": {
    "planning_paths": ["sdd/01_planning", "sdd/02_plan"],
    "canonical_targets_dir": "sdd/02_plan"
  },
  "commands": {
    "build": "<repo-local build command>",
    "proof": "<repo-local deterministic proof command>",
    "deploy_dev": "<repo-local DEV deploy command>",
    "verify_dev": "<repo-local DEV verify command>"
  },
  "artifacts": {
    "proof_output": "sdd/03_verify/10_test/<tool>/<latest>.json"
  }
}
```

설계 규칙:

- vendored runner는 `.codex -> .claude -> sdd/99_toolchain/01_automation/agentic-dev/repo-contract.json` 순서로 contract를 찾는다.
- `.codex/agentic-dev.json`, `.claude/agentic-dev.json`는 canonical contract만 가리킨다.
- 서비스별 차이는 오직 이 contract와 repo-local commands에서 표현한다.

### 3. UI parity engine layer

Frontend-capable template의 parity 실행 도구 정본은 `99_toolchain` 아래에 둔다.

상세 구조와 레이어 분리는 [parity-execution-tooling-design.md](parity-execution-tooling-design.md)를 따른다.

Frontend-capable template에는 다음 두 층이 있어야 한다.

- toolchain-owned engine:
  - `sdd/99_toolchain/01_automation/ui-parity/*`
- app-specific adapter:
  - `frontend/scripts/ui-parity-platform-adapter.mjs`

참조 구현 기준으로 초기 이관 대상 스크립트 묶음은 다음과 같다.

- `frontend/scripts/ui-parity-core.mjs`
- `frontend/scripts/ui-parity-runner.mjs`
- `frontend/scripts/ui-parity-runtimes.mjs`
- `frontend/scripts/ui-parity-auth.mjs`
- `frontend/scripts/ui-parity-scaffold.mjs`
- `frontend/scripts/ui-parity-route-gap-report.mjs`
- `frontend/scripts/ui-parity-extract-reference-pages.mjs`
- `frontend/scripts/ui-parity-materialize-reference-assets.mjs`
- `frontend/scripts/ui-parity-normalize-reference-assets.mjs`
- optional:
  - `frontend/scripts/ui-parity-playwright-runner.mjs`
  - `frontend/scripts/ui-parity-stagehand-runner.mjs`
  - `frontend/scripts/ui-parity-parity1-upload.mjs`

`frontend/package.json`에는 최소한 다음 entrypoint를 둔다.

- `ui:parity:scaffold`
- `ui:parity:proof`
- `ui:parity`
- `ui:parity:route-gap`

### 4. Repo-local orchestration layer

`scripts/dev/` 래퍼는 선택 레이어다.

- base template에는 포함하지 않는다.
- loop/sweep/edit-once가 필요할 때만 repo별로 추가한다.

설계 규칙:

- loop/sweep는 repo-local npm entrypoint를 호출한다.
- research export는 dependency가 있으면 수행하고, 없으면 warning 수준으로 남기되 proof를 실패시키지 않는다.

### 5. Contract and evidence layer

표준 SDD 경로:

- `sdd/02_plan/10_test/<service>/ui_parity_<target>_contract.yaml`
- `sdd/02_plan/99_generated/from_planning/ui_parity/`
- `sdd/03_verify/10_test/ui_parity/`

권장 evidence 구조:

- `reference/`
- `<timestamp>/actual/`
- `<timestamp>/diff/`
- `loop_runs/`
- `staged_runs/`
- `ui_parity_latest.json`
- `<service>_agentic_dev_latest.json`

## Harness Enforcement Model

### Required phases

모든 프론트엔드 포함 서비스 템플릿은 아래 phase를 기본 강제한다.

1. `build`
2. `proof`
3. `deploy_dev`
4. `verify_dev`

강제 규칙:

- 프론트엔드 변경이 있는 repo는 `proof` 생략을 허용하지 않는다.
- `proof_output`이 생성되지 않으면 `proof` 성공으로 보지 않는다.
- DEV 반영이 필요한 작업은 `deploy_dev`와 `verify_dev`를 반드시 통과해야 한다.
- DEV 반영 전에는 `main push`가 선행되어야 한다.
- phase 실행은 항상 repo 내부 `sdd/99_toolchain/01_automation/agentic-dev/run_repo_phase.sh`를 기준으로 한다.

### Gate semantics

- `build`
  - 빌드 또는 정적 검증 통과
- `proof`
  - strict parity 또는 deterministic UI proof 수행
  - latest artifact 생성
- `deploy_dev`
  - repo-local DEV deploy 명령 성공
- `verify_dev`
  - 실제 DEV endpoint 또는 runtime smoke check 성공

### Failure semantics

- `proof` 실패:
  - latest json, actual/diff artifacts, 관련 loop evidence를 남긴다.
- `deploy_dev` 실패:
  - 증거 문서에 실패 명령과 시점을 남긴다.
- `verify_dev` 실패:
  - `fix -> redeploy -> reverify` 루프로 되돌린다.

## Boundary Model

### Vendored into each service repo

템플릿 복제 후 각 서비스가 직접 소유해야 하는 것:

- `sdd/99_toolchain/01_automation/agentic-dev/*`
- `sdd/99_toolchain/01_automation/ui-parity/*`
- `sdd/99_toolchain/01_automation/agentic-dev/repo-contract.json`
- `.codex/agentic-dev.json`
- `.claude/agentic-dev.json`
- `frontend/scripts/ui-parity-platform-adapter.mjs`
- app-side collector upload adapter
- repo-local loop/sweep scripts
- evidence path declarations

### Kept external

서비스 레포 밖에 남겨야 하는 것:

- `parity-1` collector backend
- `parity-1` objective/research implementation
- 실제 collector URL, API key, 저장소 위치 같은 환경값

### Reference source only

다음은 참조 구현일 뿐, 런타임 dependency로 남길 필요는 없다.

- `say828-agent-market/codex/skills/universal-agentic-dev`

정책:

- 템플릿은 여기서 아이디어와 runner를 가져올 수 있다.
- 하지만 최종 서비스 레포는 외부 skill 저장소가 없어도 실행 가능해야 한다.

## Template Rollout Recommendation

### Base template

`templates`에는 최소한 다음을 넣는다.

- `sdd/99_toolchain/01_automation/agentic-dev/repo-contract.json` example
- `.codex/agentic-dev.json`
- `.claude/agentic-dev.json`
- `sdd/99_toolchain/01_automation/agentic-dev/` vendored runtime
- `sdd/99_toolchain/01_automation/ui-parity/` parity tooling
- optional `scripts/dev/` parity orchestration wrappers
- `sdd/02_plan/10_test/templates/ui_parity_platform_contract.template.yaml`
- `sdd/02_plan/99_generated/from_planning/ui_parity/.gitkeep`
- `sdd/03_verify/10_test/ui_parity/.gitkeep`

### Frontend template

`templates/client/platform` 또는 별도 frontend template에는 다음을 넣는다.

- parity npm scripts
- `client/platform/scripts/ui-parity-platform-adapter.mjs`
- minimal screen catalog / route catalog placeholder
- proof output path convention

그리고 repo root에는 다음 toolchain 실행기를 둔다.

- `sdd/99_toolchain/01_automation/ui-parity/*`
- `sdd/99_toolchain/01_automation/agentic-dev/*`

### Sanitization rules

- `dist/`, `node_modules/`, captured images, timestamped runs, 실제 reference asset은 템플릿에 넣지 않는다.
- contract 예시에는 실환경 URL 대신 placeholder를 둔다.

## Non-Goals

- `parity-1` collector/objective 코드를 서비스 레포 안으로 복사하지 않는다.
- 특정 서비스의 화면 수, screen code, reference asset을 템플릿 공통값으로 고정하지 않는다.
- 중앙 공용 하네스 서버나 외부 skill 저장소가 없으면 실행할 수 없는 구조를 강제하지 않는다.
- 하네스 구현을 skill 내부 로직으로 숨겨 두지 않는다.
