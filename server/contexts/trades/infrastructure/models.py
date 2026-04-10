import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Numeric, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from contexts.identity.domain.enums import UserRole
from contexts.trades.domain.enums import (
    DeliveryStatus,
    DepreciationStatus,
    InspectionStatus,
    RemittanceStatus,
    SettlementStatus,
    TradeStage,
)
from shared.infrastructure.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TradeWorkflowORM(Base):
    __tablename__ = "trade_workflows"
    __table_args__ = (UniqueConstraint("vehicle_id", name="uq_trade_workflows_vehicle"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    dealer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    current_stage: Mapped[TradeStage] = mapped_column(
        Enum(TradeStage, name="trade_stage"),
        nullable=False,
        default=TradeStage.INSPECTION,
        index=True,
    )
    inspection_status: Mapped[InspectionStatus] = mapped_column(
        Enum(InspectionStatus, name="trade_inspection_status"),
        nullable=False,
        default=InspectionStatus.PROPOSED,
    )
    depreciation_status: Mapped[DepreciationStatus] = mapped_column(
        Enum(DepreciationStatus, name="trade_depreciation_status"),
        nullable=False,
        default=DepreciationStatus.PROPOSAL_REQUIRED,
    )
    delivery_status: Mapped[DeliveryStatus] = mapped_column(
        Enum(DeliveryStatus, name="trade_delivery_status"),
        nullable=False,
        default=DeliveryStatus.WAITING_SCHEDULE,
    )
    remittance_status: Mapped[RemittanceStatus] = mapped_column(
        Enum(RemittanceStatus, name="trade_remittance_status"),
        nullable=False,
        default=RemittanceStatus.WAITING,
    )
    settlement_status: Mapped[SettlementStatus] = mapped_column(
        Enum(SettlementStatus, name="trade_settlement_status"),
        nullable=False,
        default=SettlementStatus.WAITING,
    )

    base_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    agreed_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    depreciation_total: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    inspection_scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    inspection_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    inspection_assignee: Mapped[str | None] = mapped_column(String(80), nullable=True)
    inspection_contact: Mapped[str | None] = mapped_column(String(80), nullable=True)
    inspection_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    inspection_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    inspection_report_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    inspection_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    depreciation_submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    depreciation_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    renegotiation_requested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    renegotiation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    renegotiation_target_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    depreciation_agreed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    delivery_scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivery_method: Mapped[str | None] = mapped_column(String(80), nullable=True)
    delivery_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    delivery_confirmed_by_seller_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivery_confirmed_by_dealer_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivery_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    remittance_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    remittance_bank_account: Mapped[str | None] = mapped_column(String(120), nullable=True)
    remittance_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    remittance_submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    remittance_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    settlement_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    settlement_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    forced_cancel_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    forced_cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


class TradeDepreciationItemORM(Base):
    __tablename__ = "trade_depreciation_items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("trade_workflows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    label: Mapped[str] = mapped_column(String(140), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


class TradeEventORM(Base):
    __tablename__ = "trade_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("trade_workflows.id", ondelete="CASCADE"), nullable=False, index=True
    )
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    actor_role: Mapped[UserRole | None] = mapped_column(Enum(UserRole, name="user_role"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, index=True)
