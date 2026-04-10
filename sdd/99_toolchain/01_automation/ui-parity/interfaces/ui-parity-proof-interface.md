# UI Parity Proof Interface

입력:

- `--adapter`
  - app adapter module path
- `--contract`
  - parity contract yaml path
- `--out`
  - latest proof json output path

adapter contract:

- `service`
- `targetBaseUrl`
- optional `viewport`
- optional `preparePage(page, context)`
- optional `beforeNavigate(page, context)`
- optional `waitForReady(page, context)`
- optional `afterPageReady(page, context)`
- optional `resolveMaskRects(context)`
- `screens[]`
  - `id`
  - optional `title`
  - `route`
  - optional `referenceImage`
  - optional `maxDiffRatio`
  - optional `viewport`
  - optional `allowResize`
  - optional `pixelmatchThreshold`
  - optional `includeAA`
  - optional `maskRects`
  - optional `readySelector`
  - optional `readyTimeoutMs`
  - optional `tags`

출력 JSON:

- `generated_at`
- `service`
- `adapter_path`
- `contract_path`
- `target_base_url`
- `default_viewport`
- `screens[]`
  - `id`
  - optional `title`
  - `route`
  - optional `tags`
  - `status`
  - `diff_ratio`
  - optional `max_diff_ratio`
  - optional `reference_image`
- `summary`
  - `total`
  - `passed`
  - `failed`
  - `missing_reference`
  - `capture_error`
  - `matched`
