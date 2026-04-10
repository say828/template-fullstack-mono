# surface 12 column token alignment

- Owner: Codex
- Status: completed

## Scope

- `client/web`와 `client/admin`의 공통 화면 shell이 같은 `surface` 레이아웃 토큰을 사용하도록 맞춘다.
- `surface`는 좌우 배치를 표현할 수 있는 `12-column grid` 계약으로 정의한다.
- 공통 계약은 header/main/auth/seller workspace wrapper에서 바로 사용할 수 있어야 한다.

## Note

- 이 문서는 runtime CSS shell token에 대한 historical plan이다.
- screen IR `ui_grid.csv` canonical matrix는 별도 규약을 따르며 현재 기준은 `24-column semantic matrix`다.

## Assumptions

- 이번 작업의 목적은 UX/기능이 아니라 순수 UI 레이아웃 토큰 정렬이다.
- `surface` 계약은 모바일에서 1열로 내려가고, `lg` 이상에서 12열 logical grid로 동작하면 충분하다.
- 기존 page component 전체를 일괄 치환하지 않고, 공통 shell과 바로 재사용 가능한 span utility를 먼저 정리한다.

## Acceptance Criteria

- 양쪽 app의 `main.css`에 공통 `surface` 레이아웃 토큰이 추가된다.
- `surface-grid`는 `lg` 이상에서 `repeat(12, minmax(0, 1fr))`로 동작한다.
- `surface-main`, `surface-aside`, `surface-span-12`, `surface-span-8`, `surface-span-7`, `surface-span-6`, `surface-span-5`, `surface-span-4`를 제공한다.
- `Layout`, `AuthScaffold`, `SellerWorkspaceShell` 같은 공통 wrapper가 새 토큰을 사용한다.
- frontend build가 통과한다.

## Notes

- shell wrapper는 `surface-shell`로 통일하고 내부 배치만 필요한 곳에서 `surface-grid`를 쓴다.
- header는 `12-col` grid를 유지하되 nav/profile 정렬을 깨지 않도록 `surface-main` 안에 flex row를 유지한다.
- 개별 page의 세부 배치는 후속으로 `surface-span-*`을 사용해 옮긴다.

## Validation

- `pnpm --dir client/web build`
- `pnpm --dir client/admin build`
