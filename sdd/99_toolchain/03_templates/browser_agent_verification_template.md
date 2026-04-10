# Browser Agent Verification Template

## Context

- target surface:
- target route / URL:
- environment:
- operator goal:
- why browser agent was used:
- related Playwright suite id:
- related plan / build / verify artifact:

## Preconditions

- auth / session seed:
- data seed / fixture:
- feature flags / env:
- expected starting state:

## Browser Agent Run Log

| Step | Intent | Action | Observation | Impact |
| --- | --- | --- | --- | --- |
| `BA-001` |  |  |  |  |

## Findings

- passed observations:
- mismatches:
- flaky / timing notes:
- live-only notes:

## Retained Proof Handoff

- final retained proof source:
  - `Playwright`
  - `command/manual`
- Playwright command / suite:
- command / manual fallback:
- artifact paths:
- completion decision owner:

## Residual Risk

- automation gap:
- remaining uncertainty:

## Usage Rule

- browser agent evidence는 exploratory / diagnostic current-state 기록이다.
- Playwright suite가 있는 surface는 반드시 Playwright retained proof로 다시 닫는다.
- Playwright suite가 없는 surface도 completion 전에는 command/manual evidence와 automation gap을 함께 남긴다.
