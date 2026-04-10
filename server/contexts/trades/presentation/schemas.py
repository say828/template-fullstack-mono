from datetime import datetime

from pydantic import BaseModel, Field

from contexts.identity.domain.enums import UserRole
from contexts.trades.domain.enums import (
    DeliveryStatus,
    DepreciationStatus,
    InspectionStatus,
    RemittanceStatus,
    SettlementStatus,
    TradeStage,
)
from shared.domain.vehicle_lifecycle import VehicleLifecycleState


class TradeDepreciationItemInput(BaseModel):
    code: str = Field(min_length=2, max_length=64)
    label: str = Field(min_length=2, max_length=140)
    amount: float = Field(gt=0)
    note: str | None = Field(default=None, max_length=2000)


class TradeDepreciationItemResponse(BaseModel):
    id: str
    code: str
    label: str
    amount: float
    note: str | None
    created_at: datetime
    updated_at: datetime


class TradeEventResponse(BaseModel):
    id: str
    actor_id: str | None
    actor_role: UserRole | None
    event_type: str
    message: str
    payload_json: dict | None
    created_at: datetime


class TradeWorkflowResponse(BaseModel):
    id: str
    vehicle_id: str
    vehicle_title: str
    currency: str
    seller_id: str
    seller_name: str | None
    seller_email: str | None
    seller_phone: str | None
    dealer_id: str
    dealer_name: str | None
    dealer_email: str | None
    dealer_phone: str | None

    current_stage: TradeStage
    lifecycle_state: VehicleLifecycleState
    inspection_status: InspectionStatus
    depreciation_status: DepreciationStatus
    delivery_status: DeliveryStatus
    remittance_status: RemittanceStatus
    settlement_status: SettlementStatus

    base_price: float
    agreed_price: float | None
    depreciation_total: float | None

    inspection_scheduled_at: datetime | None
    inspection_location: str | None
    inspection_assignee: str | None
    inspection_contact: str | None
    inspection_confirmed_at: datetime | None
    inspection_completed_at: datetime | None
    inspection_report_url: str | None
    inspection_summary: str | None

    depreciation_submitted_at: datetime | None
    depreciation_comment: str | None
    renegotiation_requested_at: datetime | None
    renegotiation_reason: str | None
    renegotiation_target_price: float | None
    depreciation_agreed_at: datetime | None

    delivery_scheduled_at: datetime | None
    delivery_method: str | None
    delivery_location: str | None
    delivery_confirmed_by_seller_at: datetime | None
    delivery_confirmed_by_dealer_at: datetime | None
    delivery_completed_at: datetime | None

    remittance_amount: float | None
    remittance_bank_account: str | None
    remittance_reference: str | None
    remittance_submitted_at: datetime | None
    remittance_confirmed_at: datetime | None

    settlement_amount: float | None
    settlement_completed_at: datetime | None

    forced_cancel_reason: str | None
    forced_cancelled_at: datetime | None

    created_at: datetime
    updated_at: datetime

    depreciation_items: list[TradeDepreciationItemResponse]
    events: list[TradeEventResponse]


class AdminProposeInspectionRequest(BaseModel):
    scheduled_at: datetime
    location: str = Field(min_length=2, max_length=255)
    assignee: str = Field(min_length=2, max_length=80)
    contact: str = Field(min_length=2, max_length=80)


class SellerRequestInspectionRescheduleRequest(BaseModel):
    preferred_at: datetime
    reason: str = Field(min_length=2, max_length=2000)


class AdminCompleteInspectionRequest(BaseModel):
    report_url: str = Field(min_length=4, max_length=512)
    summary: str | None = Field(default=None, max_length=5000)


class DealerSubmitDepreciationRequest(BaseModel):
    items: list[TradeDepreciationItemInput] = Field(min_length=1, max_length=50)
    comment: str | None = Field(default=None, max_length=2000)


class SellerRequestRenegotiationRequest(BaseModel):
    reason: str = Field(min_length=2, max_length=2000)
    target_price: float = Field(gt=0)


class DealerScheduleDeliveryRequest(BaseModel):
    scheduled_at: datetime
    method: str = Field(min_length=2, max_length=80)
    location: str = Field(min_length=2, max_length=255)


class EvidenceFileInput(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    size_bytes: int = Field(ge=0)
    content_type: str | None = Field(default=None, max_length=120)


class DealerConfirmDeliveryRequest(BaseModel):
    checklist_items: list[str] = Field(default_factory=list, max_length=30)
    vehicle_evidence_files: list[EvidenceFileInput] = Field(default_factory=list, max_length=10)
    document_evidence_files: list[EvidenceFileInput] = Field(default_factory=list, max_length=10)


class DealerSubmitRemittanceRequest(BaseModel):
    amount: float = Field(gt=0)
    bank_account: str = Field(min_length=4, max_length=120)
    reference: str = Field(min_length=2, max_length=255)
    remitted_at: datetime | None = None
    method: str | None = Field(default=None, min_length=2, max_length=40)
    note: str | None = Field(default=None, max_length=2000)
    evidence_files: list[EvidenceFileInput] = Field(default_factory=list, max_length=10)


class AdminCompleteSettlementRequest(BaseModel):
    settlement_amount: float | None = Field(default=None, gt=0)


class AdminForceCancelRequest(BaseModel):
    reason: str = Field(min_length=2, max_length=2000)
