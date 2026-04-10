# guideline common consolidation

- Owner: Codex
- Status: completed

## Scope

- `sdd/01_planning/02_screen/guidelines` 아래의 service별 folder를 제거한다.
- canonical guideline root를 `sdd/01_planning/02_screen/guidelines/` 하나로 통합한다.
- service별 derived guide 산출물은 root 바로 아래 JSON 파일명으로만 구분한다.
- guide manifest, IR manifest, exactness, build/verify 문서를 공통 guideline 기준으로 갱신한다.

## Assumptions

- 공통 guideline policy는 `guidelines/README.md`가 canonical이다.
- service별 screen design guide json/md는 공통 guideline root 아래의 derived reference다.
- 화면 이미지 근거는 guideline이 아니라 `ir/<service>/<SCREEN_CODE>/ui_img.png`가 담당한다.

## Acceptance Criteria

- `guidelines/admin`, `guidelines/dealer`, `guidelines/seller` folder가 제거된다.
- `guidelines/` 아래에 `admin_screen_design_guide.*`, `dealer_screen_design_guide.*`, `seller_screen_design_guide.*`가 존재한다.
- `template_screen_ir_manifest.py`와 각 service guide manifest가 새 guideline root 경로를 사용한다.
- `validate_template_screen_ir.py --service seller --service dealer --service admin`가 통과한다.

## Execution Checklist

- [x] 현재 guideline 구조와 관련 tooling/reference를 점검하고 공통 통합 구조를 확정한다.
- [x] guideline 통합 계획과 planning/readme 기준을 공통 루트 구조로 갱신한다.
- [x] service guideline 산출물을 guideline root 아래 JSON 기준으로 재배치한다.
- [x] manifest, IR builder reference, exactness/doc path를 새 guideline root 구조로 수정한다.
- [x] IR rebuild 및 validator 실행 후 build/verify trail을 갱신한다.

## Current Notes

- service별 guideline folder는 정책 분리가 아니라 pdf별 guide extraction output이 누적된 결과다.
- 통합 이후에도 builder는 service 인자를 유지하지만 output root는 `guidelines/` 하나만 사용한다.
- final canonical shape는 `guidelines/README.md`, `guidelines/<service>_screen_design_guide.json`이다.

## Validation

- directory inspection of `sdd/01_planning/02_screen/guidelines`
- `python3 sdd/99_toolchain/01_automation/validate_template_screen_ir.py --service seller --service dealer --service admin`
