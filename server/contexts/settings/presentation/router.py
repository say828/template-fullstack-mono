from pathlib import Path
import subprocess

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.dependencies import AuthContext, get_current_user
from config import get_settings
from contexts.identity.domain.enums import UserRole
from contexts.settings.application.services import SettingsService
from contexts.settings.infrastructure.repository import SqlAlchemySettingsRepository
from contexts.settings.presentation.schemas import (
    AdminRuntimeVersionResponse,
    ChangePasswordRequest,
    RequestWithdrawalPayload,
    UpdatePreferencesRequest,
    UpdateProfileRequest,
    UserSettingsResponse,
    WithdrawalRequestResponse,
)
from api.dependencies import require_roles
from shared.infrastructure.database import get_db_session

router = APIRouter(tags=["settings"])
settings = get_settings()


def build_service(db: Session) -> SettingsService:
    return SettingsService(SqlAlchemySettingsRepository(db))


def _git_value(*args: str) -> str | None:
    repo_root = Path(__file__).resolve().parents[5]
    try:
      result = subprocess.run(
          ["git", *args],
          cwd=repo_root,
          check=True,
          capture_output=True,
          text=True,
      )
    except Exception:  # noqa: BLE001
      return None
    value = result.stdout.strip()
    return value or None


def to_settings_response(snapshot) -> UserSettingsResponse:
    return UserSettingsResponse(
        id=str(snapshot.user.id),
        email=snapshot.user.email,
        full_name=snapshot.user.full_name,
        role=snapshot.user.role,
        account_status=snapshot.user.account_status,
        phone=snapshot.user.phone,
        country=snapshot.user.country,
        language=snapshot.preference.language,
        region=snapshot.preference.region,
        notify_bidding=snapshot.preference.notify_bidding,
        notify_settlement=snapshot.preference.notify_settlement,
        notify_marketing=snapshot.preference.notify_marketing,
        notify_support=snapshot.preference.notify_support,
        created_at=snapshot.user.created_at,
        updated_at=snapshot.preference.updated_at,
    )


@router.get("/settings/me", response_model=UserSettingsResponse)
def get_my_settings(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> UserSettingsResponse:
    snapshot = build_service(db).get_snapshot(user_id=auth.user_id)
    return to_settings_response(snapshot)


@router.put("/settings/me/profile", response_model=UserSettingsResponse)
def update_my_profile(
    payload: UpdateProfileRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> UserSettingsResponse:
    snapshot = build_service(db).update_profile(
        user_id=auth.user_id,
        full_name=payload.full_name,
        phone=payload.phone,
        country=payload.country,
    )
    return to_settings_response(snapshot)


@router.put("/settings/me/password")
def change_my_password(
    payload: ChangePasswordRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> dict:
    build_service(db).change_password(
        user_id=auth.user_id,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    return {"message": "비밀번호가 변경되었습니다."}


@router.put("/settings/me/preferences", response_model=UserSettingsResponse)
def update_my_preferences(
    payload: UpdatePreferencesRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> UserSettingsResponse:
    snapshot = build_service(db).update_preferences(
        user_id=auth.user_id,
        language=payload.language,
        region=payload.region,
        notify_bidding=payload.notify_bidding,
        notify_settlement=payload.notify_settlement,
        notify_marketing=payload.notify_marketing,
        notify_support=payload.notify_support,
    )
    return to_settings_response(snapshot)


@router.post("/settings/me/withdrawal", response_model=WithdrawalRequestResponse)
def request_withdrawal(
    payload: RequestWithdrawalPayload,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> WithdrawalRequestResponse:
    row = build_service(db).request_withdrawal(user_id=auth.user_id, reason=payload.reason)
    return WithdrawalRequestResponse(
        id=str(row.id),
        status=row.status,
        reason=row.reason,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.get(
    "/admin/version",
    response_model=AdminRuntimeVersionResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def get_admin_runtime_version(
    auth: AuthContext = Depends(get_current_user),
) -> AdminRuntimeVersionResponse:
    _ = auth
    return AdminRuntimeVersionResponse(
        app_name=settings.app_name,
        environment=settings.environment,
        api_version="0.1.0",
        git_commit=_git_value("rev-parse", "--short", "HEAD"),
        git_branch=_git_value("rev-parse", "--abbrev-ref", "HEAD"),
        release_notes=[
            "Admin web uses live backend APIs for accounts, support, dealers, audit, and settlements.",
            "Spec-only hardcoded admin renders were removed from runtime routes.",
            "Admin runtime version metadata is now exposed from backend.",
        ],
        modules=["trade-ops", "support-ops", "account-control", "audit-log", "blacklist-control"],
    )
