import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from contexts.identity.domain.enums import AccountStatus
from contexts.identity.infrastructure.models import UserORM
from shared.infrastructure.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AdminAccountProfileORM(Base):
    __tablename__ = "admin_account_profiles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    permission_group_code: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )

    user: Mapped[UserORM] = relationship(UserORM)


class AdminAuditEventORM(Base):
    __tablename__ = "admin_audit_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    target_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="admin")
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    actor: Mapped[UserORM | None] = relationship(UserORM, foreign_keys=[actor_user_id])
    target: Mapped[UserORM | None] = relationship(UserORM, foreign_keys=[target_user_id])


class AdminBlacklistEntryORM(Base):
    __tablename__ = "admin_blacklist_entries"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    previous_account_status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus, name="account_status"), nullable=False
    )
    created_by_admin_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    released_by_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )

    user: Mapped[UserORM] = relationship(UserORM, foreign_keys=[user_id])
    created_by_admin: Mapped[UserORM] = relationship(UserORM, foreign_keys=[created_by_admin_id])
    released_by_admin: Mapped[UserORM | None] = relationship(UserORM, foreign_keys=[released_by_admin_id])

    def release(self, *, admin_user_id: uuid.UUID) -> None:
        now = utcnow()
        self.released_by_admin_id = admin_user_id
        self.released_at = now
        self.updated_at = now
