from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID

from contexts.admin.infrastructure.models import AdminBlacklistEntryORM
from contexts.admin.infrastructure.repository import (
    AdminAccountBundle,
    AdminAuditEventRow,
    NotificationAuditRow,
    SqlAlchemyAdminAccountsRepository,
    SqlAlchemyAdminAuditRepository,
    SqlAlchemyAdminBlacklistRepository,
    TradeEventAuditRow,
)
from contexts.identity.domain.enums import AccountStatus, UserRole
from contexts.identity.infrastructure.models import UserORM
from shared.infrastructure.errors import AppError
from shared.infrastructure.security import hash_password


@dataclass(frozen=True)
class PermissionGroupDefinition:
    code: str
    name: str
    description: str
    permissions: tuple[str, ...]
    screen_codes: tuple[str, ...]
    is_system: bool = True


GROUP_DEFINITIONS: tuple[PermissionGroupDefinition, ...] = (
    PermissionGroupDefinition(
        code="SUPER_ADMIN",
        name="슈퍼 관리자",
        description="운영/정산/권한그룹을 포함한 전체 관리자 기능 접근",
        permissions=(
            "admin.read",
            "admin.write",
            "admin.permission_groups.read",
            "admin.permission_groups.write",
            "trades.read",
            "trades.write",
            "settlements.read",
            "settlements.write",
            "support.read",
            "support.write",
        ),
        screen_codes=("ADM_058", "ADM_059", "ADM_060", "ADM_061"),
    ),
    PermissionGroupDefinition(
        code="OPS_ADMIN",
        name="운영 관리자",
        description="거래/정산/고객 운영 중심의 관리자 기능 접근",
        permissions=(
            "admin.read",
            "admin.permission_groups.read",
            "trades.read",
            "trades.write",
            "settlements.read",
            "settlements.write",
            "support.read",
            "support.write",
        ),
        screen_codes=("ADM_058", "ADM_059", "ADM_060"),
    ),
)

GROUP_INDEX = {group.code: group for group in GROUP_DEFINITIONS}


class AdminAccountsService:
    def __init__(self, repo: SqlAlchemyAdminAccountsRepository) -> None:
        self.repo = repo

    def _normalize_group_code(self, group_code: str | None, *, fallback_email: str | None = None) -> str:
        normalized = str(group_code or "").strip().upper()
        if normalized in GROUP_INDEX:
            return normalized
        if fallback_email and fallback_email.lower().startswith("admin@"):
            return "SUPER_ADMIN"
        return "OPS_ADMIN"

    def _group_for_bundle(self, bundle: AdminAccountBundle) -> PermissionGroupDefinition:
        code = self._normalize_group_code(
            bundle.profile.permission_group_code if bundle.profile else None,
            fallback_email=bundle.user.email,
        )
        return GROUP_INDEX[code]

    def _serialize_bundle(self, bundle: AdminAccountBundle) -> dict[str, Any]:
        user = bundle.user
        group = self._group_for_bundle(bundle)
        return {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "account_status": user.account_status.value,
            "dealer_status": user.dealer_status.value if user.dealer_status else None,
            "phone": user.phone,
            "country": user.country,
            "business_number": user.business_number,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "permission_group_code": group.code,
            "permission_group_name": group.name,
            "permission_group_description": group.description,
            "permission_codes": list(group.permissions),
            "screen_codes": list(group.screen_codes),
        }

    def _serialize_admin_users(self) -> list[dict[str, Any]]:
        return [self._serialize_bundle(bundle) for bundle in self.repo.list_admin_bundles()]

    def list_admin_accounts(self) -> list[dict[str, Any]]:
        rows = self._serialize_admin_users()
        return sorted(rows, key=lambda item: (item["permission_group_code"] != "SUPER_ADMIN", item["email"]))

    def get_admin_account(self, admin_id: UUID) -> dict[str, Any]:
        bundle = self.repo.get_admin_bundle(admin_id)
        if bundle is None:
            raise AppError("관리자 계정을 찾을 수 없습니다.", 404, "ADMIN_ACCOUNT_NOT_FOUND")
        return self._serialize_bundle(bundle)

    def create_admin_account(
        self,
        *,
        actor_user_id: UUID | None,
        email: str,
        full_name: str,
        password: str,
        phone: str | None,
        country: str | None,
        account_status: str,
        permission_group_code: str,
    ) -> dict[str, Any]:
        if self.repo.get_user_by_email(email):
            raise AppError("이미 사용 중인 이메일입니다.", 409, "EMAIL_ALREADY_EXISTS")
        status = self._parse_account_status(account_status)
        group_code = self._normalize_group_code(permission_group_code, fallback_email=email)
        user = self.repo.create_admin_user(
            email=email,
            full_name=full_name.strip(),
            password_hash=hash_password(password),
            phone=phone.strip() if phone else None,
            country=country.strip() if country else None,
            account_status=status,
        )
        self.repo.save_admin_profile(user_id=user.id, permission_group_code=group_code)
        self.repo.create_audit_event(
            actor_user_id=actor_user_id,
            target_user_id=user.id,
            source="admin_account",
            event_type="ADMIN_ACCOUNT_CREATED",
            title="관리자 계정 생성",
            message=f"{full_name.strip()} 관리자 계정이 생성되었습니다.",
            payload_json={
                "email": email.lower().strip(),
                "account_status": status.value,
                "permission_group_code": group_code,
            },
        )
        self.repo.commit()
        bundle = self.repo.get_admin_bundle(user.id)
        if bundle is None:
            raise AppError("관리자 계정 생성 후 데이터를 찾을 수 없습니다.", 500, "ADMIN_ACCOUNT_CREATE_FAILED")
        return self._serialize_bundle(bundle)

    def update_admin_account(
        self,
        *,
        actor_user_id: UUID,
        admin_id: UUID,
        full_name: str | None = None,
        phone: str | None = None,
        country: str | None = None,
        account_status: str | None = None,
        permission_group_code: str | None = None,
    ) -> dict[str, Any]:
        bundle = self.repo.get_admin_bundle(admin_id)
        if bundle is None:
            raise AppError("관리자 계정을 찾을 수 없습니다.", 404, "ADMIN_ACCOUNT_NOT_FOUND")

        user = bundle.user
        changes: dict[str, Any] = {}

        if full_name is not None and full_name.strip() and full_name.strip() != user.full_name:
            user.full_name = full_name.strip()
            changes["full_name"] = user.full_name
        if phone is not None:
            next_phone = phone.strip() or None
            if next_phone != user.phone:
                user.phone = next_phone
                changes["phone"] = next_phone
        if country is not None:
            next_country = country.strip() or None
            if next_country != user.country:
                user.country = next_country
                changes["country"] = next_country
        if account_status is not None:
            next_status = self._parse_account_status(account_status)
            if next_status != user.account_status:
                user.account_status = next_status
                changes["account_status"] = next_status.value
        self.repo.update_user(user)

        if permission_group_code is not None:
            normalized_group_code = self._normalize_group_code(permission_group_code, fallback_email=user.email)
            if normalized_group_code != self._group_for_bundle(bundle).code:
                changes["permission_group_code"] = normalized_group_code
            self.repo.save_admin_profile(
                user_id=user.id,
                permission_group_code=normalized_group_code,
            )

        if changes:
            self.repo.create_audit_event(
                actor_user_id=actor_user_id,
                target_user_id=user.id,
                source="admin_account",
                event_type="ADMIN_ACCOUNT_UPDATED",
                title="관리자 계정 수정",
                message=f"{user.full_name} 관리자 계정 정보가 수정되었습니다.",
                payload_json=changes,
            )

        self.repo.commit()
        refreshed = self.repo.get_admin_bundle(admin_id)
        if refreshed is None:
            raise AppError("관리자 계정 수정 후 데이터를 찾을 수 없습니다.", 500, "ADMIN_ACCOUNT_UPDATE_FAILED")
        return self._serialize_bundle(refreshed)

    def _parse_account_status(self, value: str) -> AccountStatus:
        normalized = str(value or "").strip().upper()
        try:
            return AccountStatus(normalized)
        except ValueError as exc:
            raise AppError("유효하지 않은 계정 상태입니다.", 400, "INVALID_ACCOUNT_STATUS") from exc

    def list_permission_groups(self) -> list[dict[str, Any]]:
        members = self._serialize_admin_users()
        payload: list[dict[str, Any]] = []
        for group in GROUP_DEFINITIONS:
            matched = [member for member in members if member["permission_group_code"] == group.code]
            payload.append(
                {
                    "code": group.code,
                    "name": group.name,
                    "description": group.description,
                    "is_system": group.is_system,
                    "permission_codes": list(group.permissions),
                    "screen_codes": list(group.screen_codes),
                    "member_count": len(matched),
                }
            )
        return payload

    def get_permission_group(self, group_code: str) -> dict[str, Any]:
        normalized = str(group_code or "").strip().upper()
        group = GROUP_INDEX.get(normalized)
        if group is None:
            raise AppError("권한그룹을 찾을 수 없습니다.", 404, "PERMISSION_GROUP_NOT_FOUND")

        members = [member for member in self._serialize_admin_users() if member["permission_group_code"] == group.code]
        return {
            "code": group.code,
            "name": group.name,
            "description": group.description,
            "is_system": group.is_system,
            "permission_codes": list(group.permissions),
            "screen_codes": list(group.screen_codes),
            "member_count": len(members),
            "members": members,
        }


@dataclass(frozen=True)
class AuditTimelineEntry:
    id: str
    source: str
    event_type: str
    occurred_at: datetime
    title: str
    message: str
    actor_user_id: str | None = None
    actor_name: str | None = None
    actor_role: str | None = None
    target_user_id: str | None = None
    target_name: str | None = None
    target_role: str | None = None
    workflow_id: str | None = None
    vehicle_id: str | None = None
    payload_json: dict | None = None


class AdminAuditService:
    def __init__(self, repo: SqlAlchemyAdminAuditRepository) -> None:
        self.repo = repo

    def get_actor(self, user_id: UUID) -> UserORM:
        user = self.repo.get_user(user_id)
        if not user:
            raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")
        if user.role != UserRole.ADMIN:
            raise AppError("관리자만 접근할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        return user

    def list_timeline(self, *, offset: int, limit: int) -> list[AuditTimelineEntry]:
        fetch_size = max(1, offset + limit)
        admin_rows = self.repo.list_admin_events(limit=fetch_size)
        trade_rows = self.repo.list_trade_events(limit=fetch_size)
        notification_rows = self.repo.list_support_notifications(limit=fetch_size)
        user_rows = self.repo.list_users(limit=fetch_size)

        entries = [
            *[self._from_admin_event(row) for row in admin_rows],
            *[self._from_trade_event(row) for row in trade_rows],
            *[self._from_notification(row) for row in notification_rows],
            *[self._from_user(row) for row in user_rows],
        ]
        entries.sort(key=lambda row: (row.occurred_at, row.id), reverse=True)
        return entries[offset : offset + limit]

    def _from_admin_event(self, row: AdminAuditEventRow) -> AuditTimelineEntry:
        payload = row.event.payload_json if isinstance(row.event.payload_json, dict) else None
        return AuditTimelineEntry(
            id=str(row.event.id),
            source=row.event.source,
            event_type=row.event.event_type,
            occurred_at=row.event.occurred_at,
            title=row.event.title,
            message=row.event.message,
            actor_user_id=str(row.actor.id) if row.actor else str(row.event.actor_user_id) if row.event.actor_user_id else None,
            actor_name=row.actor.full_name if row.actor else None,
            actor_role=row.actor.role.value if row.actor and row.actor.role else None,
            target_user_id=str(row.target.id) if row.target else str(row.event.target_user_id) if row.event.target_user_id else None,
            target_name=row.target.full_name if row.target else None,
            target_role=row.target.role.value if row.target and row.target.role else None,
            payload_json=payload,
        )

    def _from_trade_event(self, row: TradeEventAuditRow) -> AuditTimelineEntry:
        actor_role = row.event.actor_role.value if row.event.actor_role is not None else None
        payload = row.event.payload_json if isinstance(row.event.payload_json, dict) else None
        return AuditTimelineEntry(
            id=str(row.event.id),
            source="trade_event",
            event_type=row.event.event_type,
            occurred_at=row.event.created_at,
            title=row.event.message,
            message=row.event.message,
            actor_user_id=str(row.actor.id) if row.actor else str(row.event.actor_id) if row.event.actor_id else None,
            actor_name=row.actor.full_name if row.actor else None,
            actor_role=actor_role,
            workflow_id=str(row.workflow.id) if row.workflow else str(row.event.workflow_id),
            vehicle_id=str(row.workflow.vehicle_id) if row.workflow else None,
            payload_json=payload,
        )

    def _from_notification(self, row: NotificationAuditRow) -> AuditTimelineEntry:
        notification_type = (
            row.notification.notification_type.value
            if getattr(row.notification.notification_type, "value", None)
            else str(row.notification.notification_type)
        )
        payload = row.notification.meta_json if isinstance(row.notification.meta_json, dict) else None
        return AuditTimelineEntry(
            id=str(row.notification.id),
            source="support_notification",
            event_type=notification_type,
            occurred_at=row.notification.created_at,
            title=row.notification.title,
            message=row.notification.message,
            target_user_id=str(row.user.id) if row.user else str(row.notification.user_id),
            target_name=row.user.full_name if row.user else None,
            target_role=row.user.role.value if row.user and row.user.role else None,
            payload_json=payload,
        )

    def _from_user(self, row: UserORM) -> AuditTimelineEntry:
        return AuditTimelineEntry(
            id=str(row.id),
            source="user",
            event_type="USER_CREATED",
            occurred_at=row.created_at,
            title="사용자 계정 생성",
            message=f"{row.full_name} 계정이 생성되었습니다.",
            target_user_id=str(row.id),
            target_name=row.full_name,
            target_role=row.role.value if row.role else None,
            payload_json={
                "email": row.email,
                "account_status": row.account_status.value if row.account_status else None,
                "dealer_status": row.dealer_status.value if row.dealer_status else None,
            },
        )


class AdminBlacklistService:
    def __init__(self, repo: SqlAlchemyAdminBlacklistRepository) -> None:
        self.repo = repo

    def register_user_blacklist(
        self,
        *,
        user_id: UUID,
        reason: str,
        admin_user_id: UUID,
    ) -> AdminBlacklistEntryORM:
        user = self.repo.get_user_by_id(user_id)
        if not user:
            raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

        active_entry = self.repo.get_active_entry_by_user_id(user_id)
        if active_entry:
            raise AppError("이미 블랙리스트에 등록된 사용자입니다.", 409, "BLACKLIST_ALREADY_ACTIVE")

        entry = self.repo.create_entry(
            user_id=user.id,
            reason=reason,
            previous_account_status=user.account_status,
            created_by_admin_id=admin_user_id,
        )
        user.account_status = AccountStatus.SUSPENDED
        self.repo.update_user(user)
        self.repo.commit()
        return entry

    def list_blacklisted_users(
        self,
        *,
        active_only: bool,
        keyword: str | None,
        offset: int,
        limit: int,
    ) -> list[tuple[AdminBlacklistEntryORM, UserORM | None]]:
        return self.repo.list_entries(
            active_only=active_only,
            keyword=keyword,
            offset=offset,
            limit=limit,
        )

    def release_user_blacklist(
        self,
        *,
        user_id: UUID,
        admin_user_id: UUID,
    ) -> AdminBlacklistEntryORM:
        entry = self.repo.get_active_entry_by_user_id(user_id)
        if not entry:
            raise AppError("활성 블랙리스트 엔트리를 찾을 수 없습니다.", 404, "BLACKLIST_NOT_FOUND")

        user = self.repo.get_user_by_id(user_id)
        if not user:
            raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

        entry.release(admin_user_id=admin_user_id)
        user.account_status = entry.previous_account_status
        self.repo.update_user(user)
        self.repo.commit()
        return entry
