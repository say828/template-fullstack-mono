import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from contexts.bidding.domain.enums import BidStatus
from shared.infrastructure.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class BidORM(Base):
    __tablename__ = "bids"
    __table_args__ = (UniqueConstraint("vehicle_id", "dealer_id", name="uq_bids_vehicle_dealer"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    dealer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[BidStatus] = mapped_column(Enum(BidStatus, name="bid_status"), nullable=False, default=BidStatus.ACTIVE)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)
