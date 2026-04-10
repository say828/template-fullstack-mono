# Screen IR Planning Root

`screen_ir/`는 screen spec을 per-screen package로 분리한 current-state planning root다.

## Package Baseline

- `registry.json`
- `screens/<SCREEN_CODE>/metadata.json`
- `screens/<SCREEN_CODE>/requirements.json`
- `screens/<SCREEN_CODE>/requirements.md`
- `screens/<SCREEN_CODE>/provenance.json`
- `screens/<SCREEN_CODE>/links.json`
- `screens/<SCREEN_CODE>/surfaces/*`

## Rule

- 각 screen folder는 구현 전에 필요한 최소 companion만 둔다.
- requirements와 provenance는 사람이 읽을 수 있어야 하고, surfaces는 재현 가능한 source를 가리켜야 한다.
