# 2026-03-14 Domain Feature / Screen Consistency Audit

## Scope

- Reviewed canonical domain feature specs under `sdd/01_planning/01_feature/`.
- Reviewed active screen IA docs under `sdd/02_plan/02_screen/`.
- Reviewed active screen/code traceability under `sdd/02_plan/03_architecture/spec_traceability.md`.
- Cross-checked current runtime ownership in `client/*` routes and `server/contexts/*` service/router modules where the documents looked inconsistent.

## Executive Summary

- Owner/module alignment is mostly stable for `identity`, `bidding`, `trades`, `settlement`, and `vehicles`.
- The main gaps are concentrated around `dealers`, `settings`, `support`, and the newly merged `admin` surface.
- Most issues are documentation drift rather than backend/runtime breakage, but several active admin screens currently have no clean canonical domain owner in feature specs.

## Findings

### High 1. `dealers` canonical owner service names a class that does not exist

- The feature spec still declares `DealerService` as the canonical owner in both the summary and bounded-context map: `sdd/01_planning/01_feature/dealers_feature_spec.md:19`, `sdd/01_planning/01_feature/dealers_feature_spec.md:27`.
- The actual runtime services are split into `DealerOnboardingService` and `DealerAdminService`: `server/contexts/dealers/application/services.py:16`, `server/contexts/dealers/application/services.py:90`.
- Impact:
  - The canonical domain document points reviewers to a non-existent service boundary.
  - Any later traceability or ownership work built on this spec will drift immediately.
- Recommendation:
  - Either rename the spec to the real split services, or introduce a single façade service if the team wants `DealerService` to remain canonical.

### High 2. Admin password change is an active screen, but no feature spec owns it

- Admin IA explicitly includes `/admin/password` under the admin authentication/settings group: `sdd/02_plan/02_screen/admin_todos.md:21`.
- The route is live in the admin app and backed by a dedicated page: `client/admin/src/app/App.tsx:205`, `client/admin/src/pages/AdminPasswordChangePage.tsx:11`.
- The canonical `settings` feature spec only gives the `admin` actor one use case, `SET-F006 운영 버전 조회`; the password-change use case is documented only for `seller, dealer`: `sdd/01_planning/01_feature/settings_feature_spec.md:32`, `sdd/01_planning/01_feature/settings_feature_spec.md:42`, `sdd/01_planning/01_feature/settings_feature_spec.md:45`.
- Traceability still marks `ADM_4 비밀번호변경` as `deferred`: `sdd/02_plan/03_architecture/spec_traceability.md:12`.
- Impact:
  - The screen exists and is wired, but the domain feature model does not acknowledge the admin command.
  - This leaves the screen/function pair without a canonical feature owner.
- Recommendation:
  - Extend `settings_feature_spec.md` so `admin` also owns password change, or explicitly move admin password management into another canonical domain if that is the intended boundary.

### High 3. `/admin/reports` is an orphan cross-domain screen with no owning feature spec

- Admin IA treats `/admin/reports` as a canonical admin screen: `sdd/02_plan/02_screen/admin_todos.md:22`.
- The route and page are live in `client/admin`: `client/admin/src/app/App.tsx:208`, `client/admin/src/pages/AdminReportsPage.tsx:35`.
- The page aggregates data from multiple domains at once: trades, settlement, admin blacklist, and support notices: `client/admin/src/pages/AdminReportsPage.tsx:10`, `client/admin/src/pages/AdminReportsPage.tsx:49`.
- No current feature spec in `sdd/01_planning/01_feature/*.md` defines a reporting/read-model domain or an admin reporting use case.
- Traceability still marks `ADM_47 리포트` as `deferred`: `sdd/02_plan/03_architecture/spec_traceability.md:55`.
- Impact:
  - The screen exists, but its ownership boundary is undocumented.
  - It is unclear whether this surface belongs to `admin`, `support`, `trades`, or a separate reporting read model.
- Recommendation:
  - Define a canonical owner for admin reporting, even if it remains a cross-domain read model under `admin`.

### High 4. Policy document screens are active, but the feature specs do not model policy management

- Admin IA includes `/admin/policies*` under the support/policy group: `sdd/02_plan/02_screen/admin_todos.md:27`.
- The routes and pages are active in `client/admin`: `client/admin/src/app/App.tsx:209`, `client/admin/src/app/App.tsx:210`, `client/admin/src/pages/AdminPolicyDocumentsPage.tsx:12`, `client/admin/src/pages/AdminPolicyDetailPage.tsx:11`.
- Runtime behavior currently piggybacks on support notices rather than a dedicated policy aggregate:
  - list policies through `listSupportNotices({ category: "POLICY" })`: `client/admin/src/pages/AdminPolicyDocumentsPage.tsx:20`
  - load policy detail through `getSupportNotice(policyId)`: `client/admin/src/pages/AdminPolicyDetailPage.tsx:20`
- The canonical `support` feature spec covers notices, FAQ, inquiries, and notifications only; it does not define policy document management: `sdd/01_planning/01_feature/support_feature_spec.md:27`, `sdd/01_planning/01_feature/support_feature_spec.md:42`, `sdd/01_planning/01_feature/support_feature_spec.md:50`.
- Traceability itself says the API is missing for policy screens: `sdd/02_plan/03_architecture/spec_traceability.md:82`, `sdd/02_plan/03_architecture/spec_traceability.md:83`.
- Impact:
  - Screen ownership is implied by IA, but not modeled in the feature spec layer.
  - The current implementation behaves like a notice-category workaround rather than a documented policy domain capability.
- Recommendation:
  - Either formalize policies inside `support_feature_spec.md` as a `Notice` sub-capability, or define a separate policy-oriented feature spec and API surface.

### Medium 5. Admin traceability is stale for already-implemented screens

- The following screens are implemented in the admin app and backed by runtime routes/APIs, but traceability still underreports them:
  - `ADM_48` / `ADM_49` FAQ management are `deferred`: `sdd/02_plan/03_architecture/spec_traceability.md:56`, `sdd/02_plan/03_architecture/spec_traceability.md:57`
    - route/page/API evidence: `client/admin/src/app/App.tsx:261`, `client/admin/src/pages/AdminSupportFaqsPage.tsx:35`, `server/contexts/support/presentation/router.py:153`, `server/contexts/support/presentation/router.py:305`
  - `ADM_62` audit logs are `deferred`: `sdd/02_plan/03_architecture/spec_traceability.md:70`
    - route/page/API evidence: `client/admin/src/app/App.tsx:297`, `client/admin/src/pages/AdminAuditLogsPage.tsx:27`, `server/contexts/admin/presentation/router.py:225`
- `ADM_55 버전보기` is still `partial` even though route, page, and API are all live: `sdd/02_plan/03_architecture/spec_traceability.md:63`, `client/admin/src/app/App.tsx:211`, `client/admin/src/pages/AdminVersionPage.tsx:11`, `server/contexts/settings/presentation/router.py:140`.
- Impact:
  - Reviewers reading the traceability table will underestimate current implementation coverage.
  - This also obscures which remaining admin screens are genuinely missing versus just undocumented.
- Recommendation:
  - Refresh the admin section of `spec-traceability.md` against the current `client/admin` route map and the merged `server/contexts/admin` router.

## Domain Snapshot

| Domain | Status | Notes |
| --- | --- | --- |
| `identity` | aligned | backend owner, surfaces, and IA coverage look coherent. |
| `bidding` | aligned | app/admin surfaces and backend owner are directionally consistent. |
| `trades` | aligned | screen IA ownership and workflow service naming are coherent. |
| `settlement` | aligned | seller/admin settlement surfaces match the feature spec shape. |
| `vehicles` | aligned | seller-only surface and owner mapping are consistent. |
| `dealers` | drift | canonical owner service name is stale. |
| `settings` | partial | admin version is modeled, but admin password change is not. |
| `support` | partial | FAQ/inquiry/notices align, but policy screens are not modeled. |
| `admin` | partial | accounts/audit/blacklist align after merge, but reports and some traceability rows are still inconsistent. |

## Recommended Next Actions

1. Fix the `dealers` feature spec service naming so the canonical owner matches the runtime code.
2. Decide and document canonical ownership for admin password change, reports, and policy screens.
3. Refresh `sdd/02_plan/03_architecture/spec_traceability.md` for the implemented admin routes.
4. After ownership is clarified, remove stale `deferred` labels so feature/domain docs and screen evidence tell the same story.
