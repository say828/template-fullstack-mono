from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from contexts.identity.infrastructure.models import UserORM
from contexts.settings.domain.enums import WithdrawalStatus
from contexts.settings.domain.ports import SettingsRepositoryPort
from contexts.settings.infrastructure.models import UserPreferenceORM, WithdrawalRequestORM


class SqlAlchemySettingsRepository(SettingsRepositoryPort):
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_user(self, user_id: UUID) -> UserORM | None:
        stmt = select(UserORM).where(UserORM.id == user_id)
        return self.db.scalar(stmt)

    def update_user(self, user: UserORM) -> UserORM:
        self.db.add(user)
        self.db.flush()
        return user

    def get_user_preference(self, user_id: UUID) -> UserPreferenceORM | None:
        stmt = select(UserPreferenceORM).where(UserPreferenceORM.user_id == user_id)
        return self.db.scalar(stmt)

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
    ) -> UserPreferenceORM:
        row = UserPreferenceORM(
            user_id=user_id,
            language=language,
            region=region,
            notify_bidding=notify_bidding,
            notify_settlement=notify_settlement,
            notify_marketing=notify_marketing,
            notify_support=notify_support,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def update_user_preference(self, pref: UserPreferenceORM) -> UserPreferenceORM:
        self.db.add(pref)
        self.db.flush()
        return pref

    def has_pending_withdrawal(self, user_id: UUID) -> bool:
        stmt = select(WithdrawalRequestORM.id).where(
            WithdrawalRequestORM.user_id == user_id,
            WithdrawalRequestORM.status == WithdrawalStatus.REQUESTED,
        )
        return self.db.scalar(stmt) is not None

    def create_withdrawal_request(self, *, user_id: UUID, reason: str) -> WithdrawalRequestORM:
        row = WithdrawalRequestORM(user_id=user_id, reason=reason.strip(), status=WithdrawalStatus.REQUESTED)
        self.db.add(row)
        self.db.flush()
        return row

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
