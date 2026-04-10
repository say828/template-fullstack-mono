# codex agent role governance

- Owner: Codex
- Status: active

## Scope

- `.codex/agents/*.toml` generic role metadata validity
- Codex CLI가 generic sub-agent role을 경고 없이 로드할 수 있는 상태 유지
- agent role README와 실제 role 파일의 계약 정렬

## Assumptions

- 이번 변경은 Codex harness metadata 정합성 수정이며 앱 runtime behavior 변경은 없다.
- Codex role loader는 각 role 파일에 비어 있지 않은 `name`을 요구하고, 누락 시 role을 무시한다.

## Acceptance Criteria

- [x] `.codex/agents/*.toml` 모든 role 파일이 비어 있지 않은 `name`과 `description`을 가진다.
- [x] 각 `name` 값은 role filename stem과 일치한다.
- [x] `.codex/agents/README.md`가 role metadata requirement를 설명한다.
- [x] `codex exec -C /home/sh/Documents/Github/template 'reply with the single word ok'` 재검증에서 malformed agent role warning이 나오지 않는다.

## Execution Checklist

- [x] 현재 `.codex/agents/*.toml` 구성을 점검하고 warning을 재현한다.
- [x] 누락된 `name`과 `description` 필드를 role 파일 전체에 추가한다.
- [x] role directory README에 required metadata를 반영한다.
- [x] Codex CLI 재실행으로 warning 제거를 확인한다.
- [x] retained verification 문서를 갱신한다.

## Current Notes

- 최초 재현 시 사용자 메시지에 나온 10개 파일뿐 아니라 `api.toml`도 동일한 warning을 출력했다.
- loader 재검증 기준 필수 metadata는 `name`만이 아니라 `description`까지 포함됐다.
- 수정은 metadata-only change라서 별도의 mutation/workflow E2E gate 대상은 아니다.

## Validation

- `rg -n '^(name|description) = ' .codex/agents/*.toml`
- `codex exec -C /home/sh/Documents/Github/template 'reply with the single word ok'`
