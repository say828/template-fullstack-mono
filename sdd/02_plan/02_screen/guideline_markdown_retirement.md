# guideline markdown retirement

- Owner: Codex
- Status: completed

## Execution Checklist

- [x] guide markdown 의존 경로를 전수 검색한다.
- [x] builder와 service manifest를 JSON-only 기준으로 바꾼다.
- [x] `guidelines/README.md`와 verify 문서를 JSON-only 기준으로 갱신한다.
- [x] generated guide markdown 파일을 삭제한다.
- [x] py_compile로 builder/manifest 문법을 검증한다.

## Scope

- `sdd/01_planning/02_screen/guidelines/*.md` generated guide markdown 산출물을 제거한다.
- design guide는 JSON rule output만 canonical output으로 남긴다.
- builder, manifest, README, verify 문서를 JSON-only 기준으로 갱신한다.

## Assumptions

- 사람용 설명은 `guidelines/README.md` 한 곳에 모은다.
- service별 guide markdown은 더 이상 별도 유지하지 않는다.
- screen image evidence는 `ir/<service>/<SCREEN_CODE>/ui_img.png`가 담당한다.

## Acceptance Criteria

- `seller_screen_design_guide.md`, `dealer_screen_design_guide.md`, `admin_screen_design_guide.md`가 제거된다.
- service guide manifest는 `output_markdown` 없이도 동작한다.
- `screen_design_guide_builder.py`는 markdown output이 없는 config를 허용한다.
- `guidelines/README.md`가 JSON-only policy를 설명한다.

## Validation

- `python3 -m py_compile sdd/99_toolchain/01_automation/screen_design_guide_builder.py sdd/99_toolchain/01_automation/seller_screen_design_guide_manifest.py sdd/99_toolchain/01_automation/dealer_screen_design_guide_manifest.py sdd/99_toolchain/01_automation/admin_screen_design_guide_manifest.py`
