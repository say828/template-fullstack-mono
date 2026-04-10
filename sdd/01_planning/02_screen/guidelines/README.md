# Guidelines

## Role

- `guidelines/`는 screen planning에서 재사용하는 설계 기준의 canonical planning 산출물을 둔다.
- 공통 token과 surface-local layout/chrome rule을 같은 파일에 섞지 않는다.

## Layering Rule

- truly shared token은 `guidelines/common/`에 둔다.
- 필요하면 surface-local rule은 별도 하위 폴더에 둔다.
- local guideline은 common token을 복붙하지 않고 참조한다.
