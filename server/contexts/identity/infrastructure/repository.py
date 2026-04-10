from datetime import datetime
from uuid import UUID

from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

import logging

from contexts.identity.domain.enums import AccountStatus, DealerApprovalStatus, UserRole
from contexts.identity.domain.ports import UserRepositoryPort
from contexts.identity.infrastructure.models import PasswordResetTokenORM, UserORM
from config import get_settings
from shared.infrastructure.environment import is_production

logger = logging.getLogger(__name__)
settings = get_settings()
DEALER_STATUS_GUARD = "DEALER_STATUS_GUARD"




class SqlAlchemyUserRepository(UserRepositoryPort):
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_user_by_email(self, email: str) -> UserORM | None:
        stmt = select(UserORM).where(UserORM.email == email.lower().strip())
        return self.db.scalar(stmt)

    def get_user_by_id(self, user_id: UUID) -> UserORM | None:
        stmt = select(UserORM).where(UserORM.id == user_id)
        return self.db.scalar(stmt)

    def get_user_by_business_number(self, business_number: str) -> UserORM | None:
        stmt = select(UserORM).where(UserORM.business_number == business_number.strip())
        return self.db.scalar(stmt)

    def list_pending_dealers(self) -> list[UserORM]:
        stmt = (
            select(UserORM)
            .where(UserORM.role == UserRole.DEALER, UserORM.dealer_status == DealerApprovalStatus.PENDING)
            .order_by(UserORM.created_at.asc())
        )
        return list(self.db.scalars(stmt).all())

    def list_pending_dealers_paginated(
        self,
        offset: int,
        limit: int,
        *,
        q: str | None = None,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
    ) -> tuple[list[UserORM], int]:
        """Return (items, total_count) for pending dealers ordered by created_at asc.

        Args:
            offset: zero-based row offset (>= 0)
            limit: page size (>= 1)
            q: optional case-insensitive substring to match against name/email/phone/business_number
            created_from: optional inclusive lower bound on created_at (UTC)
            created_to: optional inclusive upper bound on created_at (UTC)
        """
        where_clauses: list = [
            UserORM.role == UserRole.DEALER,
            UserORM.dealer_status == DealerApprovalStatus.PENDING,
        ]

        if q:
            pattern = f"%{q.lower()}%"
            where_clauses.append(
                or_(
                    func.lower(UserORM.full_name).like(pattern),
                    func.lower(UserORM.email).like(pattern),
                    func.lower(UserORM.phone).like(pattern),
                    func.lower(UserORM.business_number).like(pattern),
                )
            )

        if created_from:
            where_clauses.append(UserORM.created_at >= created_from)
        if created_to:
            where_clauses.append(UserORM.created_at <= created_to)

        count_stmt = select(func.count()).select_from(select(UserORM.id).where(*where_clauses).subquery())
        total = self.db.scalar(count_stmt) or 0

        items_stmt = (
            select(UserORM)
            .where(*where_clauses)
            .order_by(UserORM.created_at.asc())
            .offset(offset)
            .limit(limit)
        )
        items = list(self.db.scalars(items_stmt).all())
        return items, int(total)

    def create_user(
        self,
        *,
        email: str,
        full_name: str,
        password_hash: str,
        role: UserRole,
        phone: str | None,
        country: str | None,
        business_number: str | None,
        dealer_status: DealerApprovalStatus | None,
        account_status: AccountStatus,
    ) -> UserORM:
        # DEALER_STATUS_GUARD: non-prod strict, prod warn-only
        if role == UserRole.DEALER and dealer_status is None:
            if is_production():
                logger.warning(
                    "DEALER_STATUS_GUARD: creating DEALER with NULL dealer_status; allowing (env=%s).",
                    settings.environment,
                )
            else:
                raise ValueError(
                    "DEALER_STATUS_GUARD: Dealer users must have non-null dealer_status in non-production (env=%s)." % settings.environment
                )

        user = UserORM(
            email=email.lower().strip(),
            full_name=full_name.strip(),
            password_hash=password_hash,
            role=role,
            phone=phone.strip() if phone else None,
            country=country.strip() if country else None,
            business_number=business_number.strip() if business_number else None,
            dealer_status=dealer_status,
            account_status=account_status,
        )
        self.db.add(user)
        self.db.flush()
        return user

    def update_user(self, user: UserORM) -> UserORM:
        self.db.add(user)
        self.db.flush()
        return user

    def save_reset_token(self, token: PasswordResetTokenORM) -> PasswordResetTokenORM:
        self.db.add(token)
        self.db.flush()
        return token

    def get_reset_token(self, token_hash: str, now: datetime) -> PasswordResetTokenORM | None:
        stmt = select(PasswordResetTokenORM).where(
            PasswordResetTokenORM.token_hash == token_hash,
            PasswordResetTokenORM.used_at.is_(None),
            PasswordResetTokenORM.expires_at >= now,
        )
        return self.db.scalar(stmt)

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
