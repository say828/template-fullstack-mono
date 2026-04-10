# templates data modeling

- 작성 버전: 1.0.0

## Purpose

현재 구현된 backend domain model과 저장 관점을 entity 수준으로 요약한다.

## 1. Auth Account

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `str` | 인증 계정 식별자 |
| `name` | `str` | 표시 이름 |
| `email` | `EmailStr` | 로그인 이메일 |
| `role` | `str` | `admin`, `operator` 등 인증 역할 |
| `status` | `str` | 인증 가능 상태 |
| `password_hash` | `str` | credential hash |

## 2. User Profile

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `str` | 사용자 식별자 |
| `name` | `str` | 사용자 이름 |
| `email` | `EmailStr` | 연락/표시 이메일 |
| `role` | `str` | 운영 역할 |
| `status` | `str` | 활성 상태 |
| `timezone` | `str` | 지역/표시용 timezone |
| `last_login_at` | `str` | 최근 로그인 시각 |

## 3. Catalog Product

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `str` | 상품 식별자 |
| `slug` | `str` | URL/업무용 유니크 slug |
| `name` | `str` | 상품명 |
| `brand` | `str` | 브랜드명 |
| `category` | `str` | 카테고리 |
| `status` | `draft|active|archived` | 카탈로그 노출 상태 |
| `short_description` | `str` | 카드용 요약 문구 |
| `description` | `str` | 상세 설명 |
| `hero_image` | `MediaAsset` | 대표 이미지 |
| `gallery` | `list[MediaAsset]` | 추가 이미지 |
| `price` | `Money` | 판매가 |
| `compare_at_price` | `Money?` | 비교가 |
| `tags` | `list[str]` | 태그 |
| `attributes` | `list[ProductAttribute]` | 속성 리스트 |
| `variants` | `list[ProductVariant]` | SKU variant 리스트 |
| `created_at` | `str` | 생성 시각 |
| `updated_at` | `str` | 수정 시각 |

## 4. Inventory Level

| Field | Type | Meaning |
| --- | --- | --- |
| `sku` | `str` | 재고 식별 단위 |
| `product_id` | `str` | catalog product 참조 |
| `product_name` | `str` | 표시용 상품명 |
| `variant_name` | `str` | variant 이름 |
| `location_id` | `str` | 물류 거점 식별자 |
| `location_name` | `str` | 거점 이름 |
| `on_hand` | `int` | 실재고 |
| `reserved` | `int` | 선점 재고 |
| `safety_stock` | `int` | 안전 재고 |
| `reorder_point` | `int` | 재주문 기준점 |
| `updated_at` | `str` | 수정 시각 |

## 5. Order

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `str` | 주문 식별자 |
| `product_id` | `str` | 상품 참조 |
| `product_name` | `str` | 표시용 상품명 |
| `customer_name` | `str` | 고객명 |
| `seller_name` | `str` | 판매자/셀러명 |
| `status` | `str` | 결제/주문 상태 |
| `fulfillment_status` | `str` | 이행 상태 |
| `created_at` | `str` | 생성 시각 |
| `amount_krw` | `int` | 주문 금액 |
| `risk` | `str` | 운영 위험도 |
| `stage` | `str` | 운영 단계 |
| `sla` | `str` | SLA 표시 |
| `is_new_today` | `bool` | 당일 신규 여부 |

## 6. Fulfillment Task

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `str` | task 식별자 |
| `order_id` | `str` | 주문 참조 |
| `title` | `str` | 작업 제목 |
| `assignee` | `str` | 담당자 |
| `stage` | `str` | 이행 단계 |
| `status` | `str` | task 상태 |
| `priority` | `str` | 우선순위 |
| `channel` | `str` | 유입 채널 |
| `sla_minutes` | `int` | SLA 분 단위 |
| `units` | `int` | 처리 수량 |

## 7. Support FAQ

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `str` | FAQ 식별자 |
| `question` | `str` | 질문 |
| `answer` | `str` | 답변 |
| `category` | `str` | FAQ 카테고리 |
| `visibility` | `str` | 노출 여부 |
| `updated_at` | `str` | 수정 시각 |

## 8. Key Policy

- 현재 템플릿은 string id를 사용한다.
- 실제 서비스 구현 시 time-ordered UUID v7을 기본 식별자로 채택한다.
- legacy numeric id는 새 이커머스 baseline에서 사용하지 않는다.
- `auth`와 `user`는 같은 사람을 표현하더라도 저장 목적이 다르므로 독립 레코드로 유지한다.
