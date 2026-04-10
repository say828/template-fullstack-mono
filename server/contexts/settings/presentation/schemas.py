from datetime import datetime

from pydantic import BaseModel, Field

from contexts.identity.domain.enums import AccountStatus, UserRole
from contexts.settings.domain.enums import WithdrawalStatus


class UserSettingsResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    account_status: AccountStatus
    phone: str | None
    country: str | None
    language: str
    region: str
    notify_bidding: bool
    notify_settlement: bool
    notify_marketing: bool
    notify_support: bool
    created_at: datetime
    updated_at: datetime


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    country: str | None = Field(default=None, max_length=64)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class UpdatePreferencesRequest(BaseModel):
    language: str = Field(default="ko", min_length=2, max_length=8)
    region: str = Field(default="KR", min_length=2, max_length=8)
    notify_bidding: bool = True
    notify_settlement: bool = True
    notify_marketing: bool = False
    notify_support: bool = True


class RequestWithdrawalPayload(BaseModel):
    reason: str = Field(min_length=2, max_length=2000)


class WithdrawalRequestResponse(BaseModel):
    id: str
    status: WithdrawalStatus
    reason: str
    created_at: datetime
    updated_at: datetime


class AdminRuntimeVersionResponse(BaseModel):
    app_name: str
    environment: str
    api_version: str
    git_commit: str | None = None
    git_branch: str | None = None
    release_notes: list[str]
    modules: list[str]
