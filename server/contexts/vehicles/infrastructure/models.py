import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from contexts.vehicles.domain.enums import FuelType, TransactionType, VehicleStatus
from shared.infrastructure.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def default_bidding_end_at() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=72)


class VehicleORM(Base):
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(120), nullable=False)
    make: Mapped[str] = mapped_column(String(60), nullable=False)
    model: Mapped[str] = mapped_column(String(60), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    mileage_km: Mapped[int] = mapped_column(Integer, nullable=False)
    license_plate: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fuel_type: Mapped[FuelType] = mapped_column(Enum(FuelType, name="fuel_type"), nullable=False)
    transmission: Mapped[str | None] = mapped_column(String(12), nullable=True)
    transaction_type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, name="transaction_type"), nullable=False, default=TransactionType.DOMESTIC
    )
    reserve_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    min_bid_increment: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=100000)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="KRW")

    status: Mapped[VehicleStatus] = mapped_column(
        Enum(VehicleStatus, name="vehicle_status"), nullable=False, default=VehicleStatus.ACTIVE
    )
    bidding_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    bidding_ends_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True, default=default_bidding_end_at
    )
    winning_bid_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    winning_dealer_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    winning_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    sold_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    options: Mapped[list["VehicleOptionORM"]] = relationship(
        "VehicleOptionORM",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        order_by="VehicleOptionORM.sort_order",
    )
    photos: Mapped[list["VehiclePhotoORM"]] = relationship(
        "VehiclePhotoORM",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        order_by="VehiclePhotoORM.sort_order",
    )


class VehicleOptionORM(Base):
    __tablename__ = "vehicle_options"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    label: Mapped[str] = mapped_column(String(120), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    vehicle: Mapped[VehicleORM] = relationship("VehicleORM", back_populates="options")


class VehiclePhotoORM(Base):
    __tablename__ = "vehicle_photos"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str | None] = mapped_column(String(512), nullable=True, index=True)
    content_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    vehicle: Mapped[VehicleORM] = relationship("VehicleORM", back_populates="photos")
