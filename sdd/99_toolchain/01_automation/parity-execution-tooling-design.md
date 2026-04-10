# Parity Execution Tooling Design

## Position

UI parity 관련 `실행 도구`는 `sdd/99_toolchain/01_automation`의 소유물로 본다.

즉 템플릿을 복제한 서비스 레포 안에서는 다음처럼 역할을 나눈다.

- `sdd/99_toolchain/01_automation`
  - parity 실행 도구와 인터페이스의 정본
  - agentic-dev phase runner와 analyzer의 정본
- `sdd/99_toolchain/01_automation/agentic-dev/repo-contract.json`
  - 이 도구를 어떤 phase에서 어떤 명령으로 호출할지 선언하는 canonical 계약
- `frontend/scripts`
  - 실제 화면/라우트/인증/브라우저 런타임에 붙는 앱별 adapter
- optional `scripts/dev`
  - 반복 루프, staged sweep, 단일 수정 실행기 같은 운영 오케스트레이션

이 구조를 쓰는 이유는 다음과 같다.

- parity는 특정 앱 기능이 아니라 하네스/검증 도구다.
- 따라서 엔진과 인터페이스의 정본은 `99_toolchain`에 두는 편이 맞다.
- 같은 이유로 `agentic-dev` phase runner, contract resolver, proof analyzer도 `99_toolchain`에 둬야 한다.
- 반면 앱별 route/auth/seed/session/crop 규칙은 `frontend/scripts` 같은 adapter 층에 둬야 한다.

## Layered Ownership

### Layer 1. Toolchain-owned parity runtime

위치:

- `sdd/99_toolchain/01_automation/ui-parity/`

여기에 들어갈 것:

- `core/`
  - parity 비교 핵심 로직
  - diff 계산
  - artifact writing
  - result normalization
- `cli/`
  - `run-proof`
  - `scaffold-contract`
  - `route-gap-report`
  - `extract-reference-pages`
  - `materialize-reference-assets`
  - `normalize-reference-assets`
  - optional `upload-parity1`
- `runtime/`
  - playwright runner
  - stagehand runner
  - browser/session helpers
- `contracts/`
  - JSON/YAML schema 예시
  - proof result shape
  - collector metadata shape
- `interfaces/`
  - command interface 문서
  - artifact path 규약
  - environment variable 규약

소유 원칙:

- 앱과 무관한 범용 실행 로직은 전부 여기 둔다.
- 새 서비스를 시작해도 이 레이어는 거의 그대로 복제되어야 한다.

### Layer 1b. Toolchain-owned agentic runtime

위치:

- `sdd/99_toolchain/01_automation/agentic-dev/`

여기에 들어갈 것:

- contract resolver
- phase runner
- proof result analyzer
- repo contract template
- optional spec bootstrap helpers

소유 원칙:

- skill은 이 레이어를 호출해야 한다.
- skill이 phase runner를 따로 재구현하면 안 된다.
- 서비스별 차이는 contract에만 두고 실행기는 공용 하네스로 유지한다.

### Layer 2. Repo-local agentic phase contract

위치:

- `sdd/99_toolchain/01_automation/agentic-dev/repo-contract.json`
- `.codex/agentic-dev.json`
- `.claude/agentic-dev.json`

역할:

- `build`, `proof`, `deploy_dev`, `verify_dev` phase를 정의
- `proof`에서 Layer 1 parity tooling을 호출
- 하네스 phase 실행기의 입력 계약 역할 수행

소유 원칙:

- 이 레이어는 선언 레이어다.
- parity 엔진을 직접 구현하지 않는다.
- phase runner도 직접 구현하지 않는다.
- `proof_output` 위치를 artifact contract로 보장한다.

### Layer 3. App-specific parity adapter

위치:

- `frontend/scripts/ui-parity-platform-adapter.mjs`
- 또는 `frontend/src/lib/ui-parity/*`

역할:

- screen catalog
- route catalog
- auth/session seed
- app-specific masking
- app-specific capture preparation
- reference asset mapping

소유 원칙:

- 앱을 바꾸면 가장 많이 바뀌는 레이어다.
- 공통 엔진을 몰라도 이 레이어만 바꿔 새 앱에 붙일 수 있어야 한다.

### Layer 4. Dev operations wrapper

위치:

- optional `scripts/dev/*parity*.sh`

역할:

- screen-by-screen loop
- staged threshold sweep
- one-shot editor loop
- optional research export hook

소유 원칙:

- 운영 반복 실행과 실험 제어를 담당한다.
- proof core와 contract는 재사용하고, 반복 실행만 별도 책임으로 둔다.

## Recommended Directory Layout

```text
sdd/99_toolchain/01_automation/agentic-dev/
  repo-contract.json
.codex/
  agentic-dev.json
.claude/
  agentic-dev.json

sdd/
  02_plan/
    10_test/
      <service>/
        ui_parity_platform_contract.yaml
    99_generated/
      from_planning/
        ui_parity/
  03_verify/
    10_test/
      ui_parity/
  99_toolchain/
    03_automation/
      agentic-dev/
        run_repo_phase.sh
        resolve_repo_contract.py
        init_repo_contract.sh
        analyze_proof_results.py
      ui-parity/
        core/
        cli/
        runtime/
        contracts/
        interfaces/
        README.md
        ui-parity-proof-interface.md
        ui-parity-artifact-layout.md

frontend/
  scripts/
    ui-parity-platform-adapter.mjs
  src/
    lib/
      specScreens.json
      specRouteCatalog.json
```

## Phase Wiring

### build

- 앱 빌드
- 정적 타입/테스트

예시:

```json
"build": "npm --prefix frontend run build"
```

### proof

- `sdd/99_toolchain/01_automation/agentic-dev/run_repo_phase.sh`가 contract를 읽는다.
- contract의 `proof`는 `sdd/99_toolchain/01_automation/ui-parity/cli/run-proof`를 호출한다.
- `run-proof`는 app adapter를 읽고 strict parity를 실행한다.
- 결과는 `sdd/03_verify/10_test/ui_parity/...`에 저장한다.

예시 shape:

```json
"proof": "node sdd/99_toolchain/01_automation/ui-parity/cli/run-proof.mjs --adapter frontend/scripts/ui-parity-platform-adapter.mjs --contract sdd/02_plan/10_test/<service>/ui_parity_platform_contract.yaml --out sdd/03_verify/10_test/ui_parity/<service>_agentic_dev_latest.json"
```

### deploy_dev

- repo-local 배포 스크립트 호출

### verify_dev

- DEV endpoint smoke check
- proof artifact 존재 확인

## Artifact Contracts

### Required proof output

`artifacts.proof_output`는 다음 요구를 만족해야 한다.

- latest single JSON file
- screen별 `actual_image`, `diff_image`, `diff_ratio`
- route/target/reference dimensions
- fail/pass summary

### Required evidence tree

- `reference/`
- `<timestamp>/actual/`
- `<timestamp>/diff/`
- `loop_runs/`
- `staged_runs/`

정책:

- phase 성공 여부는 이 구조의 존재와 JSON 무결성으로 판단한다.

## Interface Boundaries

### Toolchain to app adapter

Toolchain은 app adapter에 다음만 기대한다.

- screen list
- route mapping
- auth preparer
- mask rect provider
- reference registry location
- target base URL

Toolchain은 앱 DOM 구조를 직접 하드코딩하지 않는다.

### Toolchain to agentic contract

Toolchain은 contract에 다음만 기대한다.

- `commands.proof`
- `artifacts.proof_output`

agentic contract는 parity 내부 로직을 몰라도 된다.

### Optional external integrations

- `parity-1 collector`
  - optional upload target
- `parity-1 objective export`
  - optional research export

정책:

- 외부 integration이 없어도 parity proof 자체는 완결되어야 한다.

## Enforcement Rules

- 프론트엔드가 있는 템플릿은 `proof` phase를 mandatory로 둔다.
- `proof_output`이 생성되지 않으면 실패다.
- DEV 반영이 요구되는 작업은 `deploy_dev -> verify_dev`를 mandatory로 둔다.
- `main push` 이전 DEV 배포는 허용하지 않는다.
- `sdd/99_toolchain/01_automation/agentic-dev/run_repo_phase.sh`는 phase 순서를 우회하지 못하게 해야 한다.

## Why `99_toolchain`

`99_toolchain`에 두는 것이 맞는 이유:

- parity는 앱 기능이 아니라 검증 자동화다.
- 정책, 인터페이스, 실행기, 산출물 계약이 모두 toolchain 성격이다.
- `agentic-dev` runner도 같은 이유로 toolchain 소유가 맞다.
- `frontend/scripts`에 전부 넣으면 서비스별 앱 코드와 하네스 코드가 다시 섞인다.
- `99_toolchain`에 engine을 두고 `frontend`에는 adapter만 두면 책임 분리가 선명해진다.

## Migration Recommendation

현재 reference implementation에서 템플릿 정본으로 승격할 때는 다음 순서를 권장한다.

1. `frontend/scripts/ui-parity-*.mjs` 중 app-agnostic 로직을 `sdd/99_toolchain/01_automation/ui-parity/`로 이동
2. app-specific 로직만 `frontend/scripts/ui-parity-platform-adapter.mjs`로 축소
3. `agentic-dev` runner를 `sdd/99_toolchain/01_automation/agentic-dev/`로 이동
4. `sdd/99_toolchain/01_automation/agentic-dev/repo-contract.json`은 새 toolchain CLI를 호출하도록 단순화
5. `scripts/dev/*parity*.sh`는 필요할 때만 repo별로 추가하고, base template에는 포함하지 않는다

## Non-Goals

- `parity-1` backend를 repo 안에 복사하지 않는다.
- 특정 서비스의 screen code 체계를 toolchain에 하드코딩하지 않는다.
- app adapter 없이 toolchain만으로 모든 앱을 자동 추론하게 만들지 않는다.
