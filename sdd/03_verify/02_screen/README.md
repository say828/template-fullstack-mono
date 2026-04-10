# Screen Verification

- 이 폴더는 screen별 현재 retained verification 상태를 유지한다.
- service split을 따라 `03_verify/02_screen/<service>/` 아래에 둔다.
- dated gate/test log를 쌓지 않고, current retained checks와 residual risk만 남긴다.
- 새 verify section을 추가할 때는 `_screen_verify_template.md`를 기준으로 runtime tree, Playwright suite id, canonical runner command, artifact path를 함께 남긴다.
