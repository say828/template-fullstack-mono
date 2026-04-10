# AGENTS.md

## Toolchain Convention Policy

- 저장소 공통 컨벤션, 워크플로우, 실행 규약의 정본은 항상 `sdd/99_toolchain/02_policies`에 저장한다.
- `AGENTS.md`는 핵심 실행 규칙과 우선순위만 요약하며, 상세 배경/예외/절차는 toolchain 정책 문서를 따른다.

## Regression Verification Policy

- `sdd` 성격의 작업은 edited target만 확인하고 종료하지 않는다.
- 회귀 검수 범위는 `sdd/02_plan/10_test/regression_verification.md` 기준으로 direct, upstream, downstream, shared surface까지 선택한다.
- Playwright exactness suite가 있는 UI surface는 `sdd/99_toolchain/01_automation/run_playwright_exactness.py`를 canonical local gate로 사용한다.
- shared route, shell, auth/session, component, data contract, generated asset, builder output 변경은 adjacent consumer까지 검수 범위를 넓힌다.
- 선택한 회귀 범위, 생략 사유, residual risk는 `sdd/02_plan`, `sdd/03_build`, `sdd/03_verify`에 current-state로 남긴다.

## Branch And Deploy Policy

- 코드베이스 기본 개발 브랜치는 `main`이다.
- 구현 작업은 기본적으로 task 성격에 맞는 work branch에서 시작한다.
- work branch는 `feat/...`, `fix/...`, `refactor/...`, `docs/...`, `test/...`처럼 작업 surface가 드러나는 이름을 사용한다.
- work branch의 변경은 원격 branch까지 먼저 push해 working integration baseline을 남긴다.
- `main`이 아닌 branch에서 agent turn이 끝날 때 durable 변경이 남아 있으면 기본적으로 그 branch에 coherent commit을 만들고 origin branch까지 push한다. 예외는 worktree가 이미 clean이거나 사용자가 그 turn에 commit/push를 금지한 경우뿐이다.
- `DEV(개발계)` 반영이 필요한 작업은 그 branch를 `main`에 반영하고 `origin/main`까지 push한 뒤 배포한다.
- 수동 배포 단계여도 `branch push -> main merge/push -> DEV 배포 -> DEV 검증` 순서를 생략하지 않는다.
- 완료된 work branch는 관련 정합성 체크가 끝나고 변경이 `main`과 `origin/main`에 안전하게 반영된 뒤 local/remote branch를 모두 삭제한다. 사용자가 branch 유지를 명시한 경우만 예외다.
- branch retire 전 최소 정합성 체크는 `관련 canonical 검증 명령 재실행`, `worktree clean 확인`, `최종 변경의 main 포함 여부 확인`이다.

## Completion And Release Policy

- 사용자가 명시적으로 금지하지 않는 한, durable 변경이 남은 agent 작업은 `commit -> push -> publish 가능한 패키지/CLI는 publish`까지 끝나야 완료로 간주한다.
- "설명만 하고 종료", "로컬 수정만 남기고 종료", "커밋 없이 종료", "원격 미반영 상태로 종료"는 기본 완료 상태가 아니다.
- npm package, 설치형 CLI, 배포 artifact처럼 사용자가 즉시 받는 deliverable을 가진 저장소는 변경 후 새 버전을 발행하고 registry 배포까지 확인한다.
- publish 가능한 저장소에서 publish를 생략할 수 있는 예외는 사용자가 그 turn에서 명시적으로 금지한 경우뿐이다.
- 완료 보고 전 최소 확인 항목은 `coherent commit 존재`, `원격 push 완료`, `publish 대상이면 registry 최신 반영 확인`이다.

## Runtime Naming Policy

- 문서/대화/로그에서 실행 환경은 항상 `DEV(개발계)`로 표기한다.
- `local`, `localhost 환경` 같은 표현은 운영 용어로 사용하지 않는다.

## SDD Placement Rule

- 이 저장소는 top-level `docs/` 트리를 사용하지 않는다.
- design, planning, execution, verification, operate 문서는 모두 `sdd/` 아래에 둔다.
- 모든 `sdd/` section은 overwrite-only current-state artifact다.
- 날짜별 history, archive, release-log, gate-log 성 문서는 `sdd/` 안에 유지하지 않는다.
- durable plan artifact는 항상 `sdd/02_plan/<section>/` 아래에 둔다.

## SDD Plan Governance

- `sdd/02_plan`은 dated or archived planning history를 두지 않는다.
- `sdd/02_plan`은 에이전트의 현재 개발 계획을 기록하는 루트다.
- feature, screen, architecture, data, API, IAC, integration, nonfunctional, security, test planning은 durable target-specific 문서를 직접 갱신한다.
- feature plan 기본 경로는 `sdd/02_plan/01_feature/<domain>_todos.md`다.
- screen plan 기본 경로는 `sdd/02_plan/02_screen/<service>_todos.md`다.
- 개발계 반영이 필요한 작업은 `구현(branch) -> branch push -> build -> main merge/push -> DEV(개발계) 배포 -> DEV 검수 -> 문서 갱신 -> branch 삭제` 순서를 기본 루틴으로 사용한다.
- 횡단 작업도 날짜 파일을 추가하지 않고 같은 section의 governance/backlog/current-plan 문서를 덮어쓴다.

## SDD Build Governance

- `sdd/03_build`는 `sdd/02_plan`의 top-level split을 따라 durable implementation summary를 유지한다.
- feature summary는 service 또는 domain-sized category로 묶고, screen summary는 service split을 따른다.
- screen build summary는 `sdd/03_build/02_screen/<service>/` 아래 screen-specific 파일로 유지한다.
- dated execution log는 두지 않고 같은 summary 파일을 갱신한다.

## SDD Verify Governance

- `sdd/03_verify`는 feature/screen/architecture/IAC/test별 current verification summary만 유지한다.
- screen verification summary는 `sdd/03_verify/02_screen/<service>/` 아래 screen-specific 파일로 유지한다.
- dated gate result나 test evidence log는 남기지 않는다.

## SDD Operate Governance

- `sdd/05_operate`는 current delivery state, runbook, monitoring baseline만 유지한다.
- raw runtime log나 release timeline은 SDD가 아니라 runtime logging system의 역할이다.

## Harness Location Policy

- Claude/Codex/Ralph 하네스와 에이전트 설정은 저장소 루트의 `.claude`, `.codex`, `.agent`와 `sdd/99_toolchain/01_automation` 설명 문서에 함께 유지한다.

## Build AST Governance

- `sdd/03_build`는 실행 이력 요약이 아니라 runtime assembly current-state 문서다.
- service/screen build summary는 `entry -> provider/router -> auth/session gate -> shell -> route leaf -> backend contract leaf` 순서를 우선 유지한다.
- `sdd/03_build`에는 dated history, Ralph iteration narrative, run id memo를 남기지 않는다.
- AST 기반 current-state 적합성은 `scripts/dev/audit_sdd_build_ast.py`와 `sdd/03_verify/03_architecture/build_ast_runtime_tree_governance.md`를 기준으로 관리한다.
