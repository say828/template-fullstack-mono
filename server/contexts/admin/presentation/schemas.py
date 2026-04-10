from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from contexts.identity.domain.enums import AccountStatus, UserRole


class AdminAccountSummaryResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    account_status: str
    dealer_status: str | None = None
    permission_group_code: str
    permission_group_name: str
    created_at: datetime
    updated_at: datetime


class AdminAccountDetailResponse(AdminAccountSummaryResponse):
    phone: str | None = None
    country: str | None = None
    business_number: str | None = None
    permission_group_description: str
    permission_codes: list[str]
    screen_codes: list[str]


class AdminAccountCreateRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8, max_length=64)
    phone: str | None = Field(default=None, max_length=30)
    country: str | None = Field(default=None, max_length=64)
    account_status: str = "ACTIVE"
    permission_group_code: str


class AdminAccountUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    country: str | None = Field(default=None, max_length=64)
    account_status: str | None = None
    permission_group_code: str | None = None


class PermissionGroupSummaryResponse(BaseModel):
    code: str
    name: str
    description: str
    is_system: bool
    permission_codes: list[str]
    screen_codes: list[str]
    member_count: int


class PermissionGroupDetailResponse(PermissionGroupSummaryResponse):
    members: list[AdminAccountSummaryResponse]


class AuditTimelineEntryResponse(BaseModel):
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


class AdminBlacklistCreateRequest(BaseModel):
    user_id: str = Field(min_length=36, max_length=36)
    reason: str = Field(min_length=2, max_length=2000)


class AdminBlacklistUserResponse(BaseModel):
    entry_id: str
    user_id: str
    email: str | None
    full_name: str | None
    role: UserRole | None
    account_status: AccountStatus | None
    previous_account_status: AccountStatus
    reason: str
    created_by_admin_id: str
    released_by_admin_id: str | None
    released_at: datetime | None
    created_at: datetime
    updated_at: datetime
