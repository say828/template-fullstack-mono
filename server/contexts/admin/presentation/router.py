from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from api.dependencies import AuthContext, get_current_user, require_roles
from contexts.admin.application.services import AdminAccountsService, AdminAuditService, AdminBlacklistService
from contexts.admin.infrastructure.repository import (
    SqlAlchemyAdminAccountsRepository,
    SqlAlchemyAdminAuditRepository,
    SqlAlchemyAdminBlacklistRepository,
)
from contexts.admin.presentation.schemas import (
    AdminAccountCreateRequest,
    AdminAccountDetailResponse,
    AdminAccountSummaryResponse,
    AdminAccountUpdateRequest,
    AdminBlacklistCreateRequest,
    AdminBlacklistUserResponse,
    AuditTimelineEntryResponse,
    PermissionGroupDetailResponse,
    PermissionGroupSummaryResponse,
)
from contexts.identity.domain.enums import UserRole
from shared.infrastructure.database import get_db_session
from shared.infrastructure.errors import AppError

router = APIRouter(tags=["admin"])


def build_accounts_service(db: Session) -> AdminAccountsService:
    return AdminAccountsService(SqlAlchemyAdminAccountsRepository(db))


def build_audit_service(db: Session) -> AdminAuditService:
    return AdminAuditService(SqlAlchemyAdminAuditRepository(db))


def build_blacklist_service(db: Session) -> AdminBlacklistService:
    return AdminBlacklistService(SqlAlchemyAdminBlacklistRepository(db))


def _to_admin_account_summary(payload: dict) -> AdminAccountSummaryResponse:
    return AdminAccountSummaryResponse(
        id=payload["id"],
        email=payload["email"],
        full_name=payload["full_name"],
        role=payload["role"],
        account_status=payload["account_status"],
        dealer_status=payload.get("dealer_status"),
        permission_group_code=payload["permission_group_code"],
        permission_group_name=payload["permission_group_name"],
        created_at=payload["created_at"],
        updated_at=payload["updated_at"],
    )


def _to_admin_account_detail(payload: dict) -> AdminAccountDetailResponse:
    return AdminAccountDetailResponse(
        **_to_admin_account_summary(payload).model_dump(),
        phone=payload.get("phone"),
        country=payload.get("country"),
        business_number=payload.get("business_number"),
        permission_group_description=payload["permission_group_description"],
        permission_codes=list(payload["permission_codes"]),
        screen_codes=list(payload["screen_codes"]),
    )


def parse_uuid(raw: str, code: str) -> UUID:
    try:
        return UUID(raw)
    except ValueError as exc:
        raise AppError("유효하지 않은 ID입니다.", 400, code) from exc


def to_blacklist_response(entry, user) -> AdminBlacklistUserResponse:
    return AdminBlacklistUserResponse(
        entry_id=str(entry.id),
        user_id=str(entry.user_id),
        email=user.email if user else None,
        full_name=user.full_name if user else None,
        role=user.role if user else None,
        account_status=user.account_status if user else None,
        previous_account_status=entry.previous_account_status,
        reason=entry.reason,
        created_by_admin_id=str(entry.created_by_admin_id),
        released_by_admin_id=str(entry.released_by_admin_id) if entry.released_by_admin_id else None,
        released_at=entry.released_at,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )


@router.get(
    "/admin/accounts/permission-groups",
    response_model=list[PermissionGroupSummaryResponse],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def list_permission_groups(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[PermissionGroupSummaryResponse]:
    _ = auth
    service = build_accounts_service(db)
    return [PermissionGroupSummaryResponse(**row) for row in service.list_permission_groups()]


@router.get(
    "/admin/accounts/permission-groups/{group_code}",
    response_model=PermissionGroupDetailResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def get_permission_group_detail(
    group_code: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> PermissionGroupDetailResponse:
    _ = auth
    service = build_accounts_service(db)
    payload = service.get_permission_group(group_code)
    return PermissionGroupDetailResponse(
        code=payload["code"],
        name=payload["name"],
        description=payload["description"],
        is_system=payload["is_system"],
        permission_codes=list(payload["permission_codes"]),
        screen_codes=list(payload["screen_codes"]),
        member_count=payload["member_count"],
        members=[_to_admin_account_summary(row) for row in payload["members"]],
    )


@router.get(
    "/admin/accounts",
    response_model=list[AdminAccountSummaryResponse],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def list_admin_accounts(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[AdminAccountSummaryResponse]:
    _ = auth
    service = build_accounts_service(db)
    return [_to_admin_account_summary(row) for row in service.list_admin_accounts()]


@router.post(
    "/admin/accounts",
    response_model=AdminAccountDetailResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def create_admin_account(
    payload: AdminAccountCreateRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> AdminAccountDetailResponse:
    _ = auth
    service = build_accounts_service(db)
    return _to_admin_account_detail(
        service.create_admin_account(
            actor_user_id=auth.user_id,
            email=str(payload.email),
            full_name=payload.full_name,
            password=payload.password,
            phone=payload.phone,
            country=payload.country,
            account_status=payload.account_status,
            permission_group_code=payload.permission_group_code,
        )
    )


@router.get(
    "/admin/accounts/{admin_id}",
    response_model=AdminAccountDetailResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def get_admin_account_detail(
    admin_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> AdminAccountDetailResponse:
    _ = auth
    try:
        admin_uuid = UUID(admin_id)
    except ValueError as exc:
        raise AppError("유효하지 않은 관리자 계정 ID입니다.", 400, "INVALID_ADMIN_ACCOUNT_ID") from exc

    service = build_accounts_service(db)
    return _to_admin_account_detail(service.get_admin_account(admin_uuid))


@router.patch(
    "/admin/accounts/{admin_id}",
    response_model=AdminAccountDetailResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def update_admin_account(
    admin_id: str,
    payload: AdminAccountUpdateRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> AdminAccountDetailResponse:
    _ = auth
    try:
        admin_uuid = UUID(admin_id)
    except ValueError as exc:
        raise AppError("유효하지 않은 관리자 계정 ID입니다.", 400, "INVALID_ADMIN_ACCOUNT_ID") from exc

    service = build_accounts_service(db)
    return _to_admin_account_detail(
        service.update_admin_account(
            actor_user_id=auth.user_id,
            admin_id=admin_uuid,
            full_name=payload.full_name,
            phone=payload.phone,
            country=payload.country,
            account_status=payload.account_status,
            permission_group_code=payload.permission_group_code,
        )
    )


@router.get(
    "/admin/audit/logs",
    response_model=list[AuditTimelineEntryResponse],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def list_admin_audit_logs(
    auth: AuthContext = Depends(get_current_user),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db_session),
) -> list[AuditTimelineEntryResponse]:
    service = build_audit_service(db)
    service.get_actor(auth.user_id)
    return [AuditTimelineEntryResponse(**row.__dict__) for row in service.list_timeline(offset=offset, limit=limit)]


@router.post(
    "/admin/blacklist/users",
    response_model=AdminBlacklistUserResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def create_blacklist_entry(
    payload: AdminBlacklistCreateRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> AdminBlacklistUserResponse:
    user_id = parse_uuid(payload.user_id, "INVALID_USER_ID")
    entry = build_blacklist_service(db).register_user_blacklist(
        user_id=user_id,
        reason=payload.reason,
        admin_user_id=auth.user_id,
    )
    user = SqlAlchemyAdminBlacklistRepository(db).get_user_by_id(user_id)
    return to_blacklist_response(entry, user)


@router.get(
    "/admin/blacklist/users",
    response_model=list[AdminBlacklistUserResponse],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def list_blacklist_entries(
    active_only: bool = Query(default=True),
    keyword: str | None = Query(default=None, min_length=1, max_length=120),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[AdminBlacklistUserResponse]:
    _ = auth
    rows = build_blacklist_service(db).list_blacklisted_users(
        active_only=active_only,
        keyword=keyword,
        offset=offset,
        limit=limit,
    )
    return [to_blacklist_response(entry, user) for entry, user in rows]


@router.delete(
    "/admin/blacklist/users/{user_id}",
    response_model=AdminBlacklistUserResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def release_blacklist_entry(
    user_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> AdminBlacklistUserResponse:
    parsed_user_id = parse_uuid(user_id, "INVALID_USER_ID")
    service = build_blacklist_service(db)
    entry = service.release_user_blacklist(
        user_id=parsed_user_id,
        admin_user_id=auth.user_id,
    )
    user = SqlAlchemyAdminBlacklistRepository(db).get_user_by_id(parsed_user_id)
    return to_blacklist_response(entry, user)
