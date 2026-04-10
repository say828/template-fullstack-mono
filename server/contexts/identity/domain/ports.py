from datetime import datetime
from typing import Protocol
from uuid import UUID

from contexts.identity.domain.enums import AccountStatus, DealerApprovalStatus, UserRole
from contexts.identity.infrastructure.models import PasswordResetTokenORM, UserORM


class UserRepositoryPort(Protocol):
    def get_user_by_email(self, email: str) -> UserORM | None: ...

    def get_user_by_id(self, user_id: UUID) -> UserORM | None: ...

    def get_user_by_business_number(self, business_number: str) -> UserORM | None: ...

    def list_pending_dealers(self) -> list[UserORM]: ...

    def list_pending_dealers_paginated(
        self,
        offset: int,
        limit: int,
        *,
        q: str | None = None,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
    ) -> tuple[list[UserORM], int]: ...

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
    ) -> UserORM: ...

    def update_user(self, user: UserORM) -> UserORM: ...

    def save_reset_token(self, token: PasswordResetTokenORM) -> PasswordResetTokenORM: ...

    def get_reset_token(self, token_hash: str, now: datetime) -> PasswordResetTokenORM | None: ...

    def commit(self) -> None: ...

    def rollback(self) -> None: ...
