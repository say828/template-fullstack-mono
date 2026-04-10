# Templates Hexagonal Template Architecture

현재 템플릿 레포의 기본 아키텍처 원칙:

- 프론트는 `React + Tailwind + CSS token surface`
- 백엔드는 `hexagonal + DDD`
- 컨텍스트 외부 진입점은 `contracts`
- adapter는 교환 가능해야 하며 application/domain은 저장소 세부사항을 직접 알지 않는다
- 데이터 모델링 상세는 architecture가 아니라 `04_data`에서 다룬다
