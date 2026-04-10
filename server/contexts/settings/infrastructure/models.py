import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from contexts.settings.domain.enums import WithdrawalStatus
from shared.infrastructure.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserPreferenceORM(Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    language: Mapped[str] = mapped_column(String(8), nullable=False, default="ko")
    region: Mapped[str] = mapped_column(String(8), nullable=False, default="KR")
    notify_bidding: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_settlement: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_marketing: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notify_support: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


class WithdrawalRequestORM(Base):
    __tablename__ = "withdrawal_requests"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[WithdrawalStatus] = mapped_column(
        Enum(WithdrawalStatus, name="withdrawal_status"),
        nullable=False,
        default=WithdrawalStatus.REQUESTED,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)
