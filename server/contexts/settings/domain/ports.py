from typing import Protocol
from uuid import UUID

from contexts.identity.infrastructure.models import UserORM
from contexts.settings.infrastructure.models import UserPreferenceORM, WithdrawalRequestORM


class SettingsRepositoryPort(Protocol):
    def get_user(self, user_id: UUID) -> UserORM | None: ...

    def update_user(self, user: UserORM) -> UserORM: ...

    def get_user_preference(self, user_id: UUID) -> UserPreferenceORM | None: ...

    def create_user_preference(
        self,
        *,
        user_id: UUID,
        language: str,
        region: str,
        notify_bidding: bool,
        notify_settlement: bool,
        notify_marketing: bool,
        notify_support: bool,
    ) -> UserPreferenceORM: ...

    def update_user_preference(self, pref: UserPreferenceORM) -> UserPreferenceORM: ...

    def has_pending_withdrawal(self, user_id: UUID) -> bool: ...

    def create_withdrawal_request(self, *, user_id: UUID, reason: str) -> WithdrawalRequestORM: ...

    def commit(self) -> None: ...

    def rollback(self) -> None: ...
