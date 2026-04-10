from typing import Iterable
from datetime import datetime, timezone
from uuid import UUID

from fastapi import UploadFile

from contexts.dealers.domain.enums import DealerDocumentType
from contexts.dealers.domain.ports import DealerDocumentRepositoryPort, DocumentStoragePort
from contexts.identity.domain.enums import AccountStatus, DealerApprovalStatus, UserRole
from contexts.identity.domain.ports import UserRepositoryPort
from contexts.identity.infrastructure.models import UserORM
from shared.infrastructure.errors import AppError
from shared.infrastructure.security import hash_password


class DealerOnboardingService:
    def __init__(
        self,
        *,
        user_repo: UserRepositoryPort,
        doc_repo: DealerDocumentRepositoryPort,
        storage: DocumentStoragePort,
    ) -> None:
        self.user_repo = user_repo
        self.doc_repo = doc_repo
        self.storage = storage

    def register_dealer(
        self,
        *,
        full_name: str,
        email: str,
        password: str,
        phone: str,
        country: str,
        business_number: str,
        business_license: UploadFile,
        dealer_license: UploadFile,
        id_card: UploadFile,
    ) -> UserORM:
        if self.user_repo.get_user_by_email(email):
            raise AppError("이미 가입된 이메일입니다.", 409, "EMAIL_ALREADY_EXISTS")

        if self.user_repo.get_user_by_business_number(business_number):
            raise AppError("이미 등록된 사업자번호입니다.", 409, "BUSINESS_NUMBER_EXISTS")

        user = self.user_repo.create_user(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            role=UserRole.DEALER,
            phone=phone,
            country=country,
            business_number=business_number,
            dealer_status=DealerApprovalStatus.PENDING,
            account_status=AccountStatus.PENDING_APPROVAL,
        )

        docs = [
            (DealerDocumentType.BUSINESS_LICENSE, business_license),
            (DealerDocumentType.DEALER_LICENSE, dealer_license),
            (DealerDocumentType.ID_CARD, id_card),
        ]

        for doc_type, file in docs:
            content = file.file.read()
            if not content:
                self.user_repo.rollback()
                raise AppError(f"{doc_type.value} 파일이 비어 있습니다.", 400, "EMPTY_DOCUMENT")

            stored_path = self.storage.store(
                dealer_id=user.id,
                doc_type=doc_type,
                filename=file.filename or doc_type.value,
                content=content,
            )
            self.doc_repo.create_document(
                dealer_id=user.id,
                doc_type=doc_type,
                original_name=file.filename or doc_type.value,
                stored_path=stored_path,
                content_type=file.content_type,
                size_bytes=len(content),
            )

        self.user_repo.commit()
        return user


class DealerAdminService:
    def __init__(self, *, user_repo: UserRepositoryPort) -> None:
        self.user_repo = user_repo

    def list_pending_dealers_paginated(
        self,
        offset: int,
        limit: int,
        *,
        q: str | None = None,
        created_from: str | None = None,
        created_to: str | None = None,
    ) -> tuple[list[UserORM], int]:
        """Return (items, total_count) for pending dealers ordered by created_at asc.

        - Applies optional case-insensitive `q` filter across name/email/phone/business_number.
        - Applies optional created_at range [created_from, created_to].
        - Accepts ISO 8601 strings; if date-only is provided for `created_to`, treat as end-of-day UTC.
        - Raises 400 on invalid formats or when from > to.
        """

        def _parse_iso_dt(name: str, value: str | None, *, eod: bool = False) -> datetime | None:
            if not value:
                return None
            try:
                dt = datetime.fromisoformat(value)
            except ValueError as exc:
                raise AppError("유효하지 않은 날짜/시간 형식입니다.", 400, "INVALID_DATETIME_FORMAT") from exc
            # If the input looked like a date-only string, fromisoformat returns 00:00 time.
            if eod and (len(value) == 10):  # YYYY-MM-DD
                dt = dt.replace(hour=23, minute=59, second=59, microsecond=999999)
            # Normalize to UTC (created_at columns are timezone-aware)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            return dt

        q_norm = q.strip() if q and q.strip() else None
        from_dt = _parse_iso_dt("created_from", created_from, eod=False)
        to_dt = _parse_iso_dt("created_to", created_to, eod=True)

        if from_dt and to_dt and from_dt > to_dt:
            raise AppError("유효하지 않은 날짜 범위입니다.", 400, "INVALID_DATE_RANGE")

        return self.user_repo.list_pending_dealers_paginated(
            offset,
            limit,
            q=q_norm,
            created_from=from_dt,
            created_to=to_dt,
        )

    def list_pending_dealers(self) -> Iterable[UserORM]:
        """Backward-compatible helper returning all pending dealers.
    
        Delegates to list_pending_dealers_paginated to keep a single source
        of truth for filtering/sorting."""
        _, total = self.list_pending_dealers_paginated(0, 1)
        if total == 0:
            return []
        items, _ = self.list_pending_dealers_paginated(0, total)
        return items

    def get_pending_dealer_by_id(self, dealer_id: UUID) -> UserORM:
        """Return dealer only if in PENDING status.

        Used by ADM_043 (딜러상세/승인대기) to ensure the admin detail
        view is restricted to pending-approval dealers.
        """
        dealer = self.user_repo.get_user_by_id(dealer_id)
        if not dealer or dealer.role != UserRole.DEALER:
            raise AppError("딜러 계정을 찾을 수 없습니다.", 404, "DEALER_NOT_FOUND")

        if dealer.dealer_status != DealerApprovalStatus.PENDING:
            # Policy: invalid workflow state → 409 Conflict
            raise AppError(
                "승인 대기중인 딜러만 조회할 수 있습니다.", 409, "DEALER_DETAIL_NOT_ALLOWED"
            )

        return dealer

    def approve_dealer(self, dealer: UserORM) -> UserORM:
        if dealer.role != UserRole.DEALER:
            raise AppError("딜러 계정이 아닙니다.", 400, "NOT_DEALER")
        if dealer.dealer_status != DealerApprovalStatus.PENDING:
            raise AppError("승인 대기 상태가 아닙니다.", 409, "DEALER_NOT_PENDING")


        dealer.dealer_status = DealerApprovalStatus.APPROVED
        dealer.account_status = AccountStatus.ACTIVE
        dealer.dealer_rejection_reason = None
        self.user_repo.update_user(dealer)
        self.user_repo.commit()
        return dealer

    def reject_dealer(self, dealer: UserORM, reason: str) -> UserORM:
        if dealer.role != UserRole.DEALER:
            raise AppError("딜러 계정이 아닙니다.", 400, "NOT_DEALER")
        if dealer.dealer_status != DealerApprovalStatus.PENDING:
            raise AppError("승인 대기 상태가 아닙니다.", 409, "DEALER_NOT_PENDING")


        dealer.dealer_status = DealerApprovalStatus.REJECTED
        dealer.account_status = AccountStatus.REJECTED
        dealer.dealer_rejection_reason = reason.strip()
        self.user_repo.update_user(dealer)
        self.user_repo.commit()
        return dealer
