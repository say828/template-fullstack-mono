# Regression Verification Policy

## Purpose

edited target만 확인하고 끝내는 축소 검수를 막고, selected regression surface를 current-state verification 규칙으로 고정한다.

## Rules

- 회귀 검수는 direct target-only로 끝내지 않는다.
- direct, upstream, downstream, shared surface를 기준으로 selected regression surface를 정한다.
- shared route, shell, auth/session, component, contract, generated asset, builder output을 변경한 경우 adjacent consumer와 shared surface를 함께 검수한다.
- Playwright exactness suite가 있는 screen/local UI surface는 `sdd/99_toolchain/01_automation/run_playwright_exactness.py`를 canonical local gate로 사용한다.
- direct `npx playwright test ...` 호출은 디버깅 예외로만 쓰고, retained verification command는 toolchain wrapper 기준으로 남긴다.
- browser agent 기반 브라우저 자동화는 탐색, 초동 진단, preflight smoke, flaky reproduction에 허용하지만 canonical retained proof를 대체하지 않는다.
- browser agent 기록은 `sdd/99_toolchain/03_templates/browser_agent_verification_template.md`를 canonical template로 사용한다.
- 자동화가 없는 회귀 surface는 가능한 command/manual verification으로 대체하고, automation gap은 residual risk로 남긴다.
- 선택한 회귀 검수 범위, 실행한 check, 생략 사유, residual risk는 `sdd/02_plan`과 `sdd/03_verify`에 current-state로 유지한다.

## Canonical References

- `AGENTS.md`
- `.codex/skills/sdd/SKILL.md`
- `.claude/skills/sdd/SKILL.md`
- `sdd/02_plan/10_test/regression_verification.md`
- `sdd/03_verify/10_test/regression_verification.md`
