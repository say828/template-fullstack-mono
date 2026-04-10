# Template Shared Absorption

- Owner: Codex
- Status: completed

## Scope

- `client/shared`가 가진 customer-facing 공통 모듈을 `client/web` 내부로 흡수한다.
- `client/web` symlink를 실파일로 치환한다.
- `client/admin`이 `client/shared`에 의존하지 않는지 확인한다.
- planning/build/verify 문서에서 `client/shared` runtime ownership 표현을 제거한다.

## Assumptions

- 현재 `client/shared` 파일은 `client/web`가 symlink로만 사용한다.
- `client/admin`은 자체 파일을 사용하며 `client/shared`를 import하지 않는다.
- symlink를 실파일로 바꿔도 import 경로는 그대로 유지할 수 있다.

## Acceptance Criteria

- `client/web/src` 하위 symlink가 모두 제거된다.
- `client/shared` 디렉터리가 제거된다.
- `README`, planning/build/verify 문서가 더 이상 `client/shared`를 active frontend surface로 설명하지 않는다.
- `pnpm --dir client/web build`와 `pnpm --dir client/admin build`가 성공한다.

## Execution Checklist

- [x] `client/shared` 실제 사용처와 `client/web` symlink inventory를 확인한다.
- [x] planning/runtime 문서를 `client/shared` 제거 기준으로 갱신한다.
- [x] `client/web` symlink를 실파일로 치환한다.
- [x] `client/shared` 디렉터리를 제거하고 잔존 참조를 정리한다.
- [x] customer/admin build를 검증한다.

## Current Notes

- 현재 `client/web/src`에는 `app`, `components/auth`, `components/ui`, `lib`, `pages` 일부가 `client/shared`로 연결된 symlink다.
- `client/admin/src`에는 symlink가 없고 `client/shared` import도 확인되지 않았다.
- 따라서 `client/shared`는 더 이상 별도 workspace일 필요가 없고 `client/web` 내부 흡수가 가능하다.
- `client/shared` 제거 후 dangling symlink가 생겨 HEAD 기준 원본으로 `client/web` 실파일을 복원했고, 이후 symlink 제거 상태를 재검증했다.

## Validation

- `find client/web/src -type l`
- `rg -n "client/shared|@template/client-shared" README.md .github client sdd --glob '!**/node_modules/**' --glob '!**/dist/**'`
- `pnpm --dir client/web build`
- `pnpm --dir client/admin build`
