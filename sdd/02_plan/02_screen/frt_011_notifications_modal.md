# FRT_011 Notifications Modal Plan

- Owner: Codex
- Status: active

## Scope

- 대상 화면: `FRT_011` seller header notifications trigger
- 대상 runtime: `client/web`
- 대상 산출물: `Layout` header trigger, inline notifications modal, SDD build/verify 기록

## Assumptions

- 알림 버튼은 현재 페이지를 유지한 채 모달만 열어야 한다.
- 알림 모달은 서버 라우트로 이동하는 대신 현재 shell 위에 오버레이로 표시한다.
- 기존 notifications/profiles route는 제거하고, 헤더 클릭은 route navigation을 유발하지 않아야 한다.

## Acceptance Criteria

- seller header의 알림 버튼 클릭이 페이지 이동을 유발하지 않는다.
- 알림 내용은 현재 페이지 위 모달로 표시된다.
- 모달 닫기 후 현재 route와 scroll position이 유지된다.
- 알림 데이터 로딩과 "모두 읽음" 동작은 기존 기능을 유지한다.
- `pnpm --dir client/web build`가 통과한다.

## Execution Checklist

- [x] `client/web/src/components/Layout.tsx`의 notifications trigger를 modal toggle로 전환한다.
- [x] 모달 overlay / close / mark-all-read 동작이 current page 기준으로 유지되는지 확인한다.
- [x] 구현 및 verification 기록을 `sdd/03_verify`에 남긴다.

## Current Notes

- seller header notifications는 route push 대신 header 우측 상단 아이콘 기준으로 `md:right-[272px] / top-[44px] / max-w-[378px]` modal anchor로 정리했다.
- 모달 오픈 시에는 본문은 그대로 보이되 상호작용만 막고, 반투명 full-screen backdrop 위에 모달이 떠 보이도록 처리했다.
- 알림 헤더와 하단 `모두 읽음` 영역은 각각 세로 패딩을 12px 줄여 더 컴팩트하게 정리했다.
- legacy notifications/profiles page surfaces는 제거했고, header trigger만 overlay contract를 따른다.

## Validation

- `pnpm --dir client/web build`
