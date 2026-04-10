# Common Guidelines

## Role

- `guidelines/common/`은 surface를 가로질러 반복 검증된 visual token의 canonical planning 위치다.
- 여기에는 공통 token만 두고, surface-specific layout/chrome rule은 두지 않는다.

## Allowed Content

- semantic color token
- typography token
- spacing scale
- radius/shadow token
- icon sizing token

## Consumption Rule

- local guideline은 여기의 token을 `reference`만 한다.
- screen IR package는 common guideline 내용을 복사 저장하지 않고 `guideline_refs`로 연결한다.
