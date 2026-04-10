# template Spec Traceability

이 문서는 `sdd/01_planning/01_feature/*_feature_spec.md`, `sdd/01_planning/02_screen/seller_screen_spec.pdf`, `sdd/01_planning/02_screen/dealer_screen_spec.pdf`, `sdd/01_planning/02_screen/admin_screen_spec.pdf`, `sdd/01_planning/02_screen/landing_screen_spec.md`, `sdd/02_plan/02_screen/app_todos.md`, `sdd/02_plan/02_screen/admin_todos.md`, `sdd/02_plan/02_screen/landing_todos.md`를 기반으로 한 전체 기능 코드 매핑이다.

기존 상태별 화면이 현재 shared route / tab / redirect surface로 압축된 경우, 상태는 `partial`로 기록한다.

## Admin (ADM)

| Code | Screen | Status |
|------|--------|--------|
| ADM_1 | 로그인 | implemented |
| ADM_2 | 비밀번호 찾기 | implemented |
| ADM_3 | 인덱스 | partial |
| ADM_4 | 비밀번호변경 | implemented |
| ADM_5 | 알림 | partial |
| ADM_6 | 대시보드 | implemented |
| ADM_7 | 거래관리 | partial [^ADM_7] |
| ADM_8 | 거래관리요약 | implemented [^ADM_8] |
| ADM_9 | 거래상세(입찰대기) | partial |
| ADM_10 | 거래상세(입찰완료) | partial |
| ADM_11 | 거래상세(검차) | partial |
| ADM_12 | 거래상세(감가대기) | partial |
| ADM_13 | 거래상세(감가) | partial |
| ADM_14 | 거래상세(인도) | partial |
| ADM_15 | 거래상세(송금정산) | partial |
| ADM_16 | 거래상세(상태이력) | partial |
| ADM_17 | 관리자강제종료 | partial |
| ADM_18 | 거래상세(취소) | partial [^ADM_18] |
| ADM_19 | 검차운영 | partial [^ADM_19] |
| ADM_20 | 검차운영상세(제안필요) | partial |
| ADM_21 | 검차운영상세(조율요청) | partial |
| ADM_22 | 검차운영상세(응답대기) | partial |
| ADM_23 | 검차운영상세(리포트미제출) | partial |
| ADM_24 | 검차운영상세(리포트제출) | partial |
| ADM_25 | 감가협의 | partial [^ADM_25] |
| ADM_26 | 감가협의상세(제안필요) | partial |
| ADM_27 | 감가협의상세(승인대기) | partial |
| ADM_28 | 감가협의상세(재협의) | partial |
| ADM_29 | 인도관리 | partial [^ADM_29] |
| ADM_30 | 인도관리상세(일정대기) | partial |
| ADM_31 | 인도관리상세(승인대기) | partial |
| ADM_32 | 인도관리상세(인도완료) | partial |
| ADM_33 | 딜러송금관리 | implemented [^ADM_33] |
| ADM_34 | 송금관리상세 | partial |
| ADM_35 | 판매자 정산관리 | implemented |
| ADM_36 | 판매자정산관리상세(대기) | implemented [^ADM_36] |
| ADM_37 | 판매자정산관리상세(완료) | implemented [^ADM_37] |
| ADM_38 | 판매자관리 | partial |
| ADM_39 | 판매자상세(기본탭) | partial |
| ADM_40 | 판매자상세(차량이력) | partial |
| ADM_41 | 블랙리스트 | implemented [^ADM_41] |
| ADM_42 | 딜러관리 | partial |
| ADM_43 | 딜러상세(승인대기) | implemented [^ADM_43] [^ADM_43_API] [^ADM_43_RBAC] |
| ADM_44 | 반려처리 | implemented [^ADM_44] |
| ADM_45 | 딜러상세 | partial |
| ADM_46 | 딜러상세(이력) | partial |
| ADM_47 | 리포트 | implemented [^ADM_47] |
| ADM_48 | FAQ관리 | implemented [^ADM_48] |
| ADM_49 | FAQ등록/상세 | partial |
| ADM_50 | 공지사항관리 | implemented [^ADM_50] |
| ADM_51 | 공지사항상세 | partial |
| ADM_52 | 공지사항등록 | partial |
| ADM_53 | 정책문서관리 | partial [^ADM_53] |
| ADM_54 | 정책등록/상세 | implemented [^ADM_54] |
| ADM_55 | 버전보기 | implemented [^ADM_55] |
| ADM_56 | 문의 관리 | implemented [^ADM_56] |
| ADM_57 | 문의상세 | implemented [^ADM_57] |
| ADM_58 | 관리자계정관리 | implemented [^ADM_58] |
| ADM_59 | 계정등록/상세 | implemented [^ADM_59] |
| ADM_60 | 미정의(원본 확인 필요) | implemented [^ADM_60] |
| ADM_61 | 권한그룹수정/등록 | implemented [^ADM_61] |
| ADM_62 | 로그/감사 | implemented [^ADM_62] |

[^ADM_7]: UI evidence: client/admin/src/pages/AdminTradeQueuePage.tsx:27 API evidence: GET /admin/trade-workflows; handler list_admin_trade_workflows; authz ADMIN; repo SqlAlchemyTradeWorkflowRepository; router server/contexts/trades/presentation/router.py:210
[^ADM_8]: UI evidence: client/admin/src/pages/AdminTradeSummaryPage.tsx:80 API evidence: GET /admin/trade-workflows; handler list_admin_trade_workflows; authz ADMIN; repo SqlAlchemyTradeWorkflowRepository; router server/contexts/trades/presentation/router.py:210
[^ADM_18]: UI evidence: client/admin/src/pages/AdminTradeOperationPage.tsx:33,446 API evidence: GET /admin/vehicles/{vehicle_id}/trade-workflow; handler get_admin_trade_workflow; authz ADMIN; repo SqlAlchemyTradeWorkflowRepository; router server/contexts/trades/presentation/router.py:165 | POST /admin/vehicles/{vehicle_id}/force-cancel; handler admin_force_cancel; authz ADMIN; repo SqlAlchemyTradeWorkflowRepository; router server/contexts/trades/presentation/router.py:502
[^ADM_19]: UI evidence: client/admin/src/pages/AdminTradeQueuePage.tsx:28 API evidence: POST /admin/vehicles/{vehicle_id}/inspection/propose; handler admin_propose_inspection; authz ADMIN; repo SqlAlchemyTradeWorkflowRepository; router server/contexts/trades/presentation/router.py:228 | POST /admin/vehicles/{vehicle_id}/inspection/complete; handler admin_complete_inspection; authz ADMIN; repo SqlAlchemyTradeWorkflowRepository; router server/contexts/trades/presentation/router.py:290
[^ADM_25]: UI evidence: client/admin/src/pages/AdminTradeQueuePage.tsx:29 API evidence: none (non-aligned per T305).
[^ADM_29]: UI evidence: client/admin/src/pages/AdminTradeQueuePage.tsx:30 API evidence: GET /admin/vehicles/{vehicle_id}/trade-workflow; handler get_admin_trade_workflow; authz ADMIN; repo SqlAlchemyTradeWorkflowRepository; router server/contexts/trades/presentation/router.py:160
[^ADM_33]: UI evidence: client/admin/src/pages/AdminRemittancePage.tsx:58 API evidence: POST /admin/vehicles/{vehicle_id}/remittance/confirm; handler admin_confirm_remittance; authz ADMIN; repo SqlAlchemyTradeWorkflowRepository; router server/contexts/trades/presentation/router.py:464
[^ADM_36]: UI evidence: client/admin/src/pages/AdminSettlementDetailPage.tsx:42 API evidence: GET /admin/settlement/records; handler list_admin_settlement_records; authz ADMIN; repo SqlAlchemySettlementRepository; router server/contexts/settlement/presentation/router.py:134
[^ADM_37]: UI evidence: client/admin/src/pages/AdminSettlementDetailPage.tsx:42 API evidence: GET /admin/settlement/records; handler list_admin_settlement_records; authz ADMIN; repo SqlAlchemySettlementRepository; router server/contexts/settlement/presentation/router.py:134
[^ADM_41]: UI evidence: client/admin/src/pages/AdminBlacklistPage.tsx:65 API evidence: POST /admin/blacklist/users; handler create_blacklist_entry; authz ADMIN; repo SqlAlchemyAdminBlacklistRepository; router server/contexts/admin/presentation/router.py:246 | GET /admin/blacklist/users; handler list_blacklist_entries; authz ADMIN; repo SqlAlchemyAdminBlacklistRepository; router server/contexts/admin/presentation/router.py:266 | DELETE /admin/blacklist/users/{user_id}; handler release_blacklist_entry; authz ADMIN; repo SqlAlchemyAdminBlacklistRepository; router server/contexts/admin/presentation/router.py:289
[^ADM_47]: UI evidence: client/admin/src/pages/AdminReportsPage.tsx:35 API evidence: GET /admin/trade-workflows; GET /admin/settlement/records; GET /admin/blacklist/users; GET /support/notices via client/admin/src/lib/api.ts
[^ADM_48]: UI evidence: client/admin/src/pages/AdminSupportFaqsPage.tsx:33 API evidence: GET /admin/support/faqs; POST /admin/support/faqs; PATCH /admin/support/faqs/{faq_id}; DELETE /admin/support/faqs/{faq_id}; router server/contexts/support/presentation/router.py:153,306,329,353
[^ADM_50]: UI evidence: client/admin/src/pages/AdminSupportNoticesPage.tsx:159 API evidence: GET /support/notices; handler list_notices; repo SqlAlchemySupportRepository; router server/contexts/support/presentation/router.py:121 | POST /admin/support/notices; handler create_notice; authz ADMIN; repo SqlAlchemySupportRepository; router server/contexts/support/presentation/router.py:245 | PATCH /admin/support/notices/{notice_id}; handler update_notice; authz ADMIN; repo SqlAlchemySupportRepository; router server/contexts/support/presentation/router.py:267 | DELETE /admin/support/notices/{notice_id}; handler delete_notice; authz ADMIN; repo SqlAlchemySupportRepository; router server/contexts/support/presentation/router.py:290
[^ADM_53]: UI evidence: client/admin/src/pages/AdminPolicyDocumentsPage.tsx:35 API evidence: none (non-aligned per T305).
[^ADM_54]: UI evidence: client/admin/src/pages/AdminPolicyDetailPage.tsx:30 API evidence: none (non-aligned per T305).
[^ADM_55]: UI evidence: client/admin/src/pages/AdminVersionPage.tsx:31 API evidence: GET /admin/version; handler get_admin_runtime_version; authz ADMIN; repo SqlAlchemySettingsRepository; router server/contexts/settings/presentation/router.py:141
[^ADM_56]: UI evidence: client/admin/src/pages/AdminSupportInquiriesPage.tsx:99 API evidence: GET /admin/support/inquiries; handler list_admin_inquiries; authz ADMIN; repo SqlAlchemySupportRepository; router server/contexts/support/presentation/router.py:369 | GET /admin/support/inquiries/{inquiry_id}; handler get_admin_inquiry; authz ADMIN; repo SqlAlchemySupportRepository; router server/contexts/support/presentation/router.py:387 | GET /admin/support/inquiries/{inquiry_id}/attachments/{attachment_id}/download; handler download_admin_inquiry_attachment; authz ADMIN; repo SqlAlchemySupportRepository; router server/contexts/support/presentation/router.py:405
[^ADM_57]: UI evidence: client/admin/src/pages/AdminSupportInquiryDetailPage.tsx:120 API evidence: GET /admin/support/inquiries/{inquiry_id}; handler get_admin_inquiry; authz ADMIN; repo SqlAlchemySupportRepository; router server/contexts/support/presentation/router.py:387 | POST /admin/support/inquiries/{inquiry_id}/reply; handler reply_admin_inquiry; authz ADMIN; repo SqlAlchemySupportRepository; router server/contexts/support/presentation/router.py:431
[^ADM_58]: UI evidence: client/admin/src/pages/AdminAccountsPage.tsx:96 API evidence: GET /admin/accounts; handler list_admin_accounts; authz ADMIN; repo SqlAlchemyAdminAccountsRepository; router server/contexts/admin/presentation/router.py:139 | POST /admin/accounts; handler create_admin_account; authz ADMIN; repo SqlAlchemyAdminAccountsRepository; router server/contexts/admin/presentation/router.py:153
[^ADM_59]: UI evidence: client/admin/src/pages/AdminAccountDetailPage.tsx:85 API evidence: GET /admin/accounts/{admin_id}; handler get_admin_account_detail; authz ADMIN; repo SqlAlchemyAdminAccountsRepository; router server/contexts/admin/presentation/router.py:179 | PATCH /admin/accounts/{admin_id}; handler update_admin_account; authz ADMIN; repo SqlAlchemyAdminAccountsRepository; router server/contexts/admin/presentation/router.py:199 | POST /admin/accounts; handler create_admin_account; authz ADMIN; repo SqlAlchemyAdminAccountsRepository; router server/contexts/admin/presentation/router.py:153
[^ADM_60]: UI evidence: client/admin/src/pages/AdminPermissionsPage.tsx:31 API evidence: none (non-aligned per T305).
[^ADM_61]: UI evidence: client/admin/src/pages/AdminPermissionGroupPage.tsx:32 API evidence: GET /admin/accounts/permission-groups; handler list_permission_groups; authz ADMIN; repo SqlAlchemyAdminAccountsRepository; router server/contexts/admin/presentation/router.py:100 | GET /admin/accounts/permission-groups/{group_code}; handler get_permission_group_detail; authz ADMIN; repo SqlAlchemyAdminAccountsRepository; router server/contexts/admin/presentation/router.py:114
[^ADM_62]: UI evidence: client/admin/src/pages/AdminAuditLogsPage.tsx:27 API evidence: GET /admin/audit/logs; handler list_admin_audit_logs; authz ADMIN; router server/contexts/admin/presentation/router.py:230


[^ADM_43]: UI evidence: client/admin/src/pages/AdminDealerDetailPage.tsx:113 API evidence: GET /admin/dealers/pending; handler list_pending_dealers; authz ADMIN; repo SqlAlchemyUserRepository; models DealerDocumentORM; router server/contexts/dealers/presentation/router.py:80 | POST /admin/dealers/{dealer_id}/approve; handler approve_dealer; authz ADMIN; repo SqlAlchemyUserRepository; models DealerDocumentORM; router server/contexts/dealers/presentation/router.py:141
[^ADM_43_API]: API mapping (loop-6): GET /admin/dealers/{dealer_id} → server/contexts/dealers/presentation/router.py:94; POST /admin/dealers/{dealer_id}/approve → router.py:141; POST /admin/dealers/{dealer_id}/reject → router.py:166. See .codex/skills/otro/runs/template-admin-functional-alignment/artifacts/backend-inventory/ADM_43-api-mapping.md
[^ADM_43_RBAC]: Authz: require_roles(UserRole.ADMIN) on pending/dealer/detail/approve/reject routes (router.py:82,96,143,168); UI routes protected via <ProtectedRoute allow={["ADMIN"]}> in client/admin/src/app/App.tsx:832–851. Verified in .codex/skills/otro/runs/template-admin-functional-alignment/artifacts/auth/ADM_043-guard-verification.md
[^ADM_44]: UI evidence: client/admin/src/pages/AdminDealerDetailPage.tsx:213 API evidence: POST /admin/dealers/{dealer_id}/reject; handler reject_dealer; authz ADMIN; repo SqlAlchemyUserRepository; models DealerDocumentORM; router server/contexts/dealers/presentation/router.py:166
## Dealer (DL)

| Code | Screen | Status |
|------|--------|--------|
| DL_1 | 알림 | implemented |
| DL_2 | 프로필 | implemented |
| DL_3 | 매물보기 | implemented |
| DL_4 | 매물상세(정보) | implemented |
| DL_5 | 매물상세(사진영상) | implemented |
| DL_6 | 이미지보기 | implemented |
| DL_7 | 매물상세(검차감가안내) | implemented |
| DL_8 | 매물상세(거래조건) | implemented |
| DL_9 | 입찰참여 | implemented |
| DL_10 | 나의입찰 | implemented |
| DL_11 | 입찰가수정 | implemented |
| DL_12 | 입찰상세(입찰중) | partial |
| DL_13 | 입찰상세(마감) | partial |
| DL_14 | 입찰상세(미낙찰) | partial |
| DL_15 | 입찰상세(낙찰) | partial |
| DL_16 | 입찰상세(취소됨) | partial |
| DL_17 | 거래결제(진행중) | implemented |
| DL_18 | 거래결제(완료) | implemented |
| DL_19 | 영수증증빙 | implemented |
| DL_20 | 거래결제상세(검차일정) | partial |
| DL_21 | 거래결제상세(검차일정확정) | partial |
| DL_22 | 거래결제상세(감가입력전) | partial |
| DL_23 | 감가금액입력 | partial |
| DL_24 | 거래결제상세(감가입력후) | partial |
| DL_25 | 거래결제상세(감가재협의) | partial |
| DL_26 | 거래결제상세(인도진행) | partial |
| DL_27 | 감가합의내역 | partial |
| DL_28 | 거래결제상세(송금정산) | partial |
| DL_29 | 거래결제상세(거래완료) | partial |
| DL_30 | 계정정보 | implemented |
| DL_31 | 사업자/서류 | implemented |
| DL_32 | 알림 설정 | implemented |
| DL_33 | 보안/비밀번호 | implemented |
| DL_34 | 약관 및 회원탈퇴 | implemented |
| DL_35 | 자주묻는질문 | implemented |
| DL_36 | 공지사항 | implemented |
| DL_37 | 공지사항상세 | implemented |
| DL_38 | 1:1 문의 | implemented |

## Seller (FRT)

| Code | Screen | Status |
|------|--------|--------|
| FRT_1 | 랜딩페이지 | implemented |
| FRT_2 | 로그인(판매자) | implemented |
| FRT_3 | 로그인(딜러) | implemented |
| FRT_4 | 비밀번호찾기 | implemented |
| FRT_5 | 회원가입 유형선택 | implemented |
| FRT_6 | 판매자 회원가입 | implemented |
| FRT_7 | 판매자 회원가입완료 | implemented |
| FRT_8 | 딜러 회원가입 | implemented |
| FRT_9 | 딜러 회원가입완료 | implemented |
| FRT_10 | 내차량(초기) | implemented |
| FRT_11 | 알림 | implemented |
| FRT_12 | 프로필 | partial |
| FRT_13 | 내차량 | implemented |
| FRT_14 | 상세보기(입찰중) | implemented |
| FRT_15 | 이미지보기 | implemented |
| FRT_16 | 입찰현황 | implemented |
| FRT_17 | 상세보기(입찰마감) | implemented |
| FRT_18 | 입찰자선택 | implemented |
| FRT_19 | 상세보기(검차일정전) | implemented |
| FRT_20 | 검차일정확인 | implemented |
| FRT_21 | 다른일정요청 | implemented |
| FRT_22 | 상세보기(검차일정후) | implemented |
| FRT_23 | 검차일정상세 | implemented |
| FRT_24 | 상세보기(감가협의전) | implemented |
| FRT_25 | 감가협의 | implemented |
| FRT_26 | 감가재협의요청 | implemented |
| FRT_27 | 상세보기(감가협의후) | implemented |
| FRT_28 | 감가내용확인 | implemented |
| FRT_29 | 상세보기(인도정산) | implemented |
| FRT_30 | 인도 정산 진행 | implemented |
| FRT_31 | 상세보기(거래완료) | implemented |
| FRT_32 | 인도/정산 상세 | implemented |
| FRT_33 | 차량등록 | implemented |
| FRT_34 | 등록내용확인 | implemented |
| FRT_35 | 거래 정산 내역 | implemented |
| FRT_36 | 정산완료상세 | implemented |
| FRT_37 | 정산대기상세 | implemented |
| FRT_38 | 계정정보 | partial |
| FRT_39 | 정산계좌 | partial |
| FRT_40 | 정산계좌미등록 | partial |
| FRT_41 | 정산계좌등록수정 | partial |
| FRT_42 | 알림설정 | partial |
| FRT_43 | 보안 비밀번호 | partial |
| FRT_44 | 언어 및 지역 | partial |
| FRT_45 | 약관 및 회원탈퇴 | partial |
| FRT_46 | 자주묻는질문 | implemented |
| FRT_47 | 공지사항 | implemented |
| FRT_48 | 공지사항상세 | implemented |
| FRT_49 | 1:1 문의 | implemented |

## Cross-domain Feature Codes (Phase 1-2)

구현은 mock/stub 없이 MySQL 영속 저장소 기반으로 동작한다.
도메인은 `identity`, `dealers`, `vehicles`, `bidding`, `trades` Context로 분리했고, Context별로 `domain/application/infrastructure/presentation` 계층을 적용했다.

### Implemented

1. 인증/가입 (AT): AT-01~AT-09 랜딩→로그인/회원가입, AT-24~AT-31 판매자 가입, AT-39~AT-47 딜러 가입
2. 승인/권한 (AZ): AZ-02~AZ-09 딜러 승인대기/승인/반려
3. 차량/매물 (FS, DL): FS-01~FS-09 차량 등록/조회, DL_003 딜러 매물 목록
4. 입찰 (BD): BD-01~BD-06 입찰 금액/검증/처리, BD-61 수정, BD-65 취소
5. 관리자 (ADM): ADM_035 판매자 정산관리, ADM_041 블랙리스트, ADM_043 승인대기 딜러 조회, ADM_044 승인/반려, ADM_047 리포트, ADM_048 FAQ관리, ADM_055 버전, ADM_058~ADM_062 계정/권한/감사
6. 거래 상태머신 (IS/DL/TS/TM): 검차 제안/승인/재요청/완료, 감가 제안/재협의/승인, 인도 양측 확인, 딜러 송금/관리자 송금확인/정산완료/강제종료, 상태 이력 로그
7. 딜러 업무 (DL): market / bids / transactions / account / support surface가 통합 앱 route로 구현됨
8. 판매자 상세 플로우와 설정/고객지원 (FRT): 입찰자 선택, 검차 일정 확인/재요청, 감가 협의/재협의, 인도·정산 진행/상세, 등록내용확인, 정산 내역/상세, settings / support surface

### Deferred (next slices)

1. 콘텐츠/리포트/고객센터: CM, RP, CS 영역
2. 알림/메일 고도화: 실시간 이벤트 버스 기반 알림, 메일 템플릿·전송 추적
