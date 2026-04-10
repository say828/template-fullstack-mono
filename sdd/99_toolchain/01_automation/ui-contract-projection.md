# UI Contract Projection

`UI Contract Projection`은 화면설계서, 계약 문서, reference asset을 제품 UI 구조 위로 투영하고 검증하는 템플릿/스킬 계층의 공통 명칭이다.

## Canonical Naming

- capability: `UI Contract Projection`
- modes:
  - `strict projection`
  - `soft projection`
- common actions:
  - `project`
  - `verify`
  - `report`

## Ownership Boundary

- 이 문서는 Claude/Codex 스킬과 CLI 래퍼가 공유할 일반 템플릿 계약만 정의한다.
- 제품별 screen registry, contract rows, evidence 경로는 각 제품 저장소의 `sdd`에서 확장한다.
- 제품 런타임 route, auth, layout은 이 템플릿을 이유로 분기하지 않는다.

## Skill Prompt Skeleton

```md
Goal: run UI Contract Projection for {product} {screen_or_flow}
Mode: {strict projection | soft projection}
Inputs:
- contract: {path}
- source artifact: {pdf|figma export|reference image|yaml}
- product target: {repo path or route}

Rules:
- Preserve product runtime behavior.
- Use React + shadcn/ui primitives and CSS token surface first.
- Keep projection assets in sdd/toolchain only.
- Do not add spec/proof/parity-only branches to runtime.

Outputs:
- updated product UI
- updated sdd contract/evidence
- projection report
```

## CLI Contract Template

```bash
ui-contract-projection project \
  --mode strict \
  --contract <path> \
  --source <path-or-id> \
  --target <repo-or-route>

ui-contract-projection verify \
  --mode strict \
  --contract <path> \
  --target <url-or-route> \
  --evidence-root <path>

ui-contract-projection report \
  --contract <path> \
  --evidence-root <path> \
  --format markdown
```

## Required Gates

1. `Structure`
2. `Behavior`
3. `Data`
4. `UI Contract Projection`

`strict projection`은 앞선 세 gate를 통과한 뒤에만 사용한다.

## Frontend Defaults

- `React + shadcn/ui`
- CSS token surface
- style expansion via `scss`, `styled-components`, or equivalent modern layer
- shared primitives before screen-specific markup
