# template screen ir rollout

- Owner: Codex
- Status: active
- Scope: `ir/seller/seller_screen_spec.pdf`, `ir/dealer/dealer_screen_spec.pdf`, `ir/admin/admin_screen_spec.pdf` 기반 per-screen IR와 masked surface 생성 체계 수립

## Summary

- 목표는 `template` 화면명세서를 `source spec + design guide + per-screen IR`로 분리해, 화면 구현 시 PDF 전체 페이지를 직접 해석하지 않게 만드는 것이다.
- 이번 phase는 `seller / dealer / admin` PDF를 대상으로 한다.
- landing은 markdown canonical source라서 PDF extraction 범위에서 제외한다.

## Shared Constraints

- source spec PDF는 canonical artifact로 유지한다.
- `guidelines/`는 공통 guideline root로 유지하고, service별 guide output은 folder 분리 없이 naming만 구분한다.
- `ir/<service>/`는 overwrite-only current-state planning output이다.
- 화면 번호 badge와 spec annotation은 `masked surface`에서 제거한다.

## Acceptance Criteria

- [ ] seller/dealer/admin guide manifest와 wrapper가 존재한다.
- [ ] seller/dealer/admin guide JSON/preview를 재생성할 수 있다.
- [ ] seller/dealer/admin IR builder가 `metadata/requirements/provenance/links/surfaces`를 생성한다.
- [ ] validator가 누락 필드, page mismatch, route mismatch, masked/raw size mismatch를 검출한다.
- [ ] build/verify 문서에 current rollout 상태가 기록된다.

## Execution Checklist

- [ ] seller/dealer/admin design guide manifest를 추가한다.
- [ ] `build_template_screen_design_guides.py` wrapper를 추가한다.
- [ ] `build_template_screen_ir.py`와 `validate_template_screen_ir.py`를 추가한다.
- [ ] service별 `ir/<service>/README.md`와 registry current-state를 생성한다.
- [ ] validation evidence를 `sdd/03_verify`에 남긴다.

## Current Notes

- seller/dealer/admin PDF는 첫 페이지에 ordered screen inventory를 포함한다.
- `ui_parity_contract.yaml`에는 screen code별 canonical route가 이미 존재한다.
- `spec_traceability.md`에는 screen code별 구현 상태가 이미 존재한다.
- 따라서 `inventory + guide surfaces + parity routes + traceability status` 조합으로 initial screen IR를 materialize할 수 있다.
