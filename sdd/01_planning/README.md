# Planning Governance

## Purpose

- `sdd/01_planning/`은 현재 구현과 검수의 기준이 되는 canonical spec을 유지한다.
- feature, screen, architecture, data, API, IAC, integration, nonfunctional, security, test planning 모두 현재 기준만 남긴다.

## Final-Only Rule

- planning도 날짜별 작업 메모나 히스토리성 보조 문서를 쌓지 않는다.
- 계속 참고할 가치가 있는 리서치만 현재형 문서로 유지한다.
- source reference가 필요하면 현재 canonical source만 남기고, raw capture log나 일회성 추출 로그는 두지 않는다.

## Structure Rule

- `01_feature`, `02_screen`는 실제 서비스 표면 기준으로 유지한다.
- `03_architecture` 이후 planning 폴더는 서비스별 실산출물이 없으면 common-first 구조로 유지한다.
