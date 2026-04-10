# regression verification

- Owner: Codex
- Status: active

## Scope

- In scope:
  - direct target 외에 upstream, downstream, shared surface까지 포함한 회귀 검수 범위 선정
  - shared route, shell, auth/session, component, contract, generated asset, builder output 변경 시 adjacent consumer 포함 규칙
  - 자동화가 없는 회귀 surface의 manual verification / residual risk 기록 기준
- Out of scope:
  - 개별 날짜별 test run history 보관

## Acceptance Criteria

- [x] 회귀 검수는 direct target-only로 끝내지 않는다.
- [x] selected regression surface는 `sdd/02_plan`과 `sdd/03_verify`에 current-state로 이어진다.
- [x] automation gap은 scope 축소가 아니라 residual risk로 기록한다.
- [x] Playwright는 canonical retained browser gate로 유지하고, browser agent는 탐색/진단 보조로만 위치시킨다.

## Execution Checklist

- [x] regression surface 분류 기준을 direct, upstream, downstream, shared로 정리한다.
- [x] shared change에서 adjacent consumer 검수 rule을 명시한다.
- [x] manual verification과 residual risk 기록 rule을 current workflow에 반영한다.

## Current Notes

- 기본 최소 검수 범위는 direct target이지만, completion 판단은 selected regression surface 전체 기준으로 한다.
- shared route, shell, auth/session, component, contract, generated asset, builder output 변경은 인접 consumer와 공용 surface까지 회귀 범위를 넓힌다.
- 전용 automation이 아직 없으면 targeted test, manual walk-through, command verification을 조합하고 미구현 automation은 residual risk로 남긴다.
- 기능 E2E gate는 regression surface와 별도 축이지만, selected direct/upstream/downstream/shared surface와 requirement-to-test-case traceability가 서로 모순되지 않게 유지한다.
- browser agent observation은 `sdd/99_toolchain/03_templates/browser_agent_verification_template.md`를 canonical template로 사용하고, final completion evidence는 Playwright artifact 또는 command/manual proof로 다시 닫는다.

## Validation

- `AGENTS.md`
- `.codex/skills/sdd/SKILL.md`
- `.claude/skills/sdd/SKILL.md`
- `sdd/99_toolchain/01_automation/README.md`
- `sdd/03_verify/10_test/verification_harness.md`
