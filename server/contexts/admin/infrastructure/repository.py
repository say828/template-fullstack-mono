from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Select, or_, select
from sqlalchemy.orm import Session, aliased, joinedload

from contexts.admin.infrastructure.models import AdminAccountProfileORM, AdminAuditEventORM, AdminBlacklistEntryORM
from contexts.identity.domain.enums import AccountStatus, UserRole
from contexts.identity.infrastructure.models import UserORM

if TYPE_CHECKING:
    from contexts.support.infrastructure.models import NotificationORM
    from contexts.trades.infrastructure.models import TradeEventORM, TradeWorkflowORM


@dataclass
class AdminAccountBundle:
    user: UserORM
    profile: AdminAccountProfileORM | None


@dataclass
class TradeEventAuditRow:
    event: TradeEventORM
    actor: UserORM | None
    workflow: TradeWorkflowORM | None


@dataclass
class NotificationAuditRow:
    notification: NotificationORM
    user: UserORM | None


@dataclass
class AdminAuditEventRow:
    event: AdminAuditEventORM
    actor: UserORM | None
    target: UserORM | None


class SqlAlchemyAdminAccountsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_admin_users(self) -> list[UserORM]:
        stmt = (
            select(UserORM)
            .where(UserORM.role == UserRole.ADMIN)
            .order_by(UserORM.created_at.asc(), UserORM.email.asc())
        )
        return list(self.db.scalars(stmt).all())

    def list_admin_bundles(self) -> list[AdminAccountBundle]:
        rows = self.db.execute(
            select(UserORM, AdminAccountProfileORM)
            .outerjoin(AdminAccountProfileORM, AdminAccountProfileORM.user_id == UserORM.id)
            .where(UserORM.role == UserRole.ADMIN)
            .order_by(UserORM.created_at.asc(), UserORM.email.asc())
        ).all()
        return [AdminAccountBundle(user=user, profile=profile) for user, profile in rows]

    def get_admin_user(self, admin_id: UUID) -> UserORM | None:
        stmt = select(UserORM).where(UserORM.id == admin_id, UserORM.role == UserRole.ADMIN)
        return self.db.scalar(stmt)

    def get_admin_bundle(self, admin_id: UUID) -> AdminAccountBundle | None:
        row = self.db.execute(
            select(UserORM, AdminAccountProfileORM)
            .outerjoin(AdminAccountProfileORM, AdminAccountProfileORM.user_id == UserORM.id)
            .where(UserORM.id == admin_id, UserORM.role == UserRole.ADMIN)
        ).first()
        if not row:
            return None
        user, profile = row
        return AdminAccountBundle(user=user, profile=profile)

    def create_admin_user(
        self,
        *,
        email: str,
        full_name: str,
        password_hash: str,
        phone: str | None,
        country: str | None,
        account_status: AccountStatus,
    ) -> UserORM:
        user = UserORM(
            email=email.lower().strip(),
            full_name=full_name,
            password_hash=password_hash,
            role=UserRole.ADMIN,
            account_status=account_status,
            dealer_status=None,
            dealer_rejection_reason=None,
            phone=phone,
            country=country,
            business_number=None,
        )
        self.db.add(user)
        self.db.flush()
        return user

    def save_admin_profile(self, *, user_id: UUID, permission_group_code: str) -> AdminAccountProfileORM:
        profile = self.db.scalar(select(AdminAccountProfileORM).where(AdminAccountProfileORM.user_id == user_id))
        if profile is None:
            profile = AdminAccountProfileORM(user_id=user_id, permission_group_code=permission_group_code)
            self.db.add(profile)
            self.db.flush()
            return profile

        profile.permission_group_code = permission_group_code
        self.db.add(profile)
        self.db.flush()
        return profile

    def update_user(self, user: UserORM) -> UserORM:
        self.db.add(user)
        self.db.flush()
        return user

    def get_user_by_email(self, email: str) -> UserORM | None:
        stmt = select(UserORM).where(UserORM.email == email.lower().strip())
        return self.db.scalar(stmt)

    def commit(self) -> None:
        self.db.commit()

    def create_audit_event(
        self,
        *,
        actor_user_id: UUID | None,
        target_user_id: UUID | None,
        source: str,
        event_type: str,
        title: str,
        message: str,
        payload_json: dict | None = None,
    ) -> AdminAuditEventORM:
        event = AdminAuditEventORM(
            actor_user_id=actor_user_id,
            target_user_id=target_user_id,
            source=source,
            event_type=event_type,
            title=title,
            message=message,
            payload_json=payload_json,
        )
        self.db.add(event)
        self.db.flush()
        return event


class SqlAlchemyAdminAuditRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _trade_event_stmt(self) -> Select[tuple[TradeEventORM, UserORM, TradeWorkflowORM]]:
        from contexts.trades.infrastructure.models import TradeEventORM, TradeWorkflowORM

        return (
            select(TradeEventORM, UserORM, TradeWorkflowORM)
            .outerjoin(UserORM, TradeEventORM.actor_id == UserORM.id)
            .outerjoin(TradeWorkflowORM, TradeEventORM.workflow_id == TradeWorkflowORM.id)
            .order_by(TradeEventORM.created_at.desc(), TradeEventORM.id.desc())
        )

    def list_trade_events(self, *, limit: int) -> list[TradeEventAuditRow]:
        rows = self.db.execute(self._trade_event_stmt().limit(limit)).all()
        return [TradeEventAuditRow(event=event, actor=actor, workflow=workflow) for event, actor, workflow in rows]

    def list_support_notifications(self, *, limit: int) -> list[NotificationAuditRow]:
        from contexts.support.infrastructure.models import NotificationORM

        stmt = (
            select(NotificationORM, UserORM)
            .join(UserORM, NotificationORM.user_id == UserORM.id)
            .order_by(NotificationORM.created_at.desc(), NotificationORM.id.desc())
            .limit(limit)
        )
        rows = self.db.execute(stmt).all()
        return [NotificationAuditRow(notification=notification, user=user) for notification, user in rows]

    def list_admin_events(self, *, limit: int) -> list[AdminAuditEventRow]:
        actor_user = aliased(UserORM)
        target_user = aliased(UserORM)
        stmt = (
            select(AdminAuditEventORM, actor_user, target_user)
            .outerjoin(actor_user, AdminAuditEventORM.actor_user_id == actor_user.id)
            .outerjoin(target_user, AdminAuditEventORM.target_user_id == target_user.id)
            .order_by(AdminAuditEventORM.occurred_at.desc(), AdminAuditEventORM.id.desc())
            .limit(limit)
        )
        rows = self.db.execute(stmt).all()
        result: list[AdminAuditEventRow] = []
        for event, actor, target in rows:
            result.append(AdminAuditEventRow(event=event, actor=actor, target=target))
        return result

    def list_users(self, *, limit: int) -> list[UserORM]:
        stmt = select(UserORM).order_by(UserORM.created_at.desc(), UserORM.id.desc()).limit(limit)
        return list(self.db.scalars(stmt))

    def get_user(self, user_id: UUID) -> UserORM | None:
        return self.db.get(UserORM, user_id)


class SqlAlchemyAdminBlacklistRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_user_by_id(self, user_id: UUID) -> UserORM | None:
        return self.db.get(UserORM, user_id)

    def get_active_entry_by_user_id(self, user_id: UUID) -> AdminBlacklistEntryORM | None:
        stmt = select(AdminBlacklistEntryORM).where(
            AdminBlacklistEntryORM.user_id == user_id,
            AdminBlacklistEntryORM.released_at.is_(None),
        )
        return self.db.scalar(stmt)

    def create_entry(
        self,
        *,
        user_id: UUID,
        reason: str,
        previous_account_status: AccountStatus,
        created_by_admin_id: UUID,
    ) -> AdminBlacklistEntryORM:
        entry = AdminBlacklistEntryORM(
            user_id=user_id,
            reason=reason,
            previous_account_status=previous_account_status,
            created_by_admin_id=created_by_admin_id,
        )
        self.db.add(entry)
        self.db.flush()
        self.db.refresh(entry)
        return entry

    def update_user(self, user: UserORM) -> None:
        self.db.add(user)

    def list_entries(
        self,
        *,
        active_only: bool,
        keyword: str | None,
        offset: int,
        limit: int,
    ) -> list[tuple[AdminBlacklistEntryORM, UserORM | None]]:
        stmt = (
            select(AdminBlacklistEntryORM, UserORM)
            .join(UserORM, UserORM.id == AdminBlacklistEntryORM.user_id)
            .options(joinedload(AdminBlacklistEntryORM.created_by_admin))
            .options(joinedload(AdminBlacklistEntryORM.released_by_admin))
            .order_by(AdminBlacklistEntryORM.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        if active_only:
            stmt = stmt.where(AdminBlacklistEntryORM.released_at.is_(None))

        if keyword:
            token = f"%{keyword.strip()}%"
            stmt = stmt.where(
                or_(
                    UserORM.email.ilike(token),
                    UserORM.full_name.ilike(token),
                    AdminBlacklistEntryORM.reason.ilike(token),
                )
            )

        rows = self.db.execute(stmt).all()
        return [(entry, user) for entry, user in rows]

    def commit(self) -> None:
        self.db.commit()
