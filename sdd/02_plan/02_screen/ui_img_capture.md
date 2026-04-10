# screen ui_img capture

- Owner: Codex
- Status: active

## Scope

- `sdd/01_planning/02_screen/ir/seller`, `dealer`, `admin`의 모든 screen code에 대해 screen spec PDF surface crop image를 생성한다.
- 생성물은 per-screen folder 안의 `<SCREEN_CODE>/ui_img.png`다.
- 생성물은 design guide JSON의 `surface bbox`를 사용해 canonical spec PDF에서 직접 crop한 결과다.

## Assumptions

- seller/dealer/admin screen spec PDF는 service별 guide JSON의 `surface_id + bbox` 기준으로 crop 가능하다.
- `surface_id`와 preview crop 파일명은 1:1로 매칭된다.
- `ui_img`는 runtime screenshot이 아니라 PDF-derived planning evidence다.
- `ui_img`는 per-screen IR package 안에서 관리되는 canonical image다.

## Acceptance Criteria

- seller/dealer/admin registry에 있는 모든 screen code에 대해 `<SCREEN_CODE>/ui_img.png`가 생성된다.
- 각 `ui_img.png`는 대응하는 `surface_id` crop과 동일해야 한다.
- 캡처 결과는 planning IR root와 verify trail에서 참조 가능해야 한다.

## Execution Checklist

- [x] 캡처 러너를 추가한다.
- [x] seller/dealer/admin 전체 screen code 캡처를 실행한다.
- [x] 생성 경로와 누락 여부를 검증한다.

## Current Notes

- `FRT_016/ui_img.png`만 존재하던 상태를 전체 service screen code로 확장한다.
- 각 ui_img는 guide JSON의 surface bbox 기준으로 spec PDF에서 직접 재생성된다.
- screen code별 목적지는 `<SCREEN_CODE>/ui_img.png`이고 source는 `surface_id + bbox + spec pdf` 조합이다.

## Validation

- `python3 sdd/99_toolchain/01_automation/build_template_screen_ui_imgs.py`
- `find sdd/01_planning/02_screen/ir -path '*/ui_img.png'`
