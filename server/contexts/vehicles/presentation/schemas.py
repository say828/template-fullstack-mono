from datetime import datetime

from pydantic import BaseModel, Field

from contexts.vehicles.domain.enums import FuelType, TransactionType, TransmissionType, VehicleStatus
from shared.domain.vehicle_lifecycle import VehicleLifecycleState


class CreateVehicleRequest(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    make: str = Field(min_length=1, max_length=60)
    model: str = Field(min_length=1, max_length=60)
    year: int
    mileage_km: int
    license_plate: str | None = Field(default=None, max_length=20)
    fuel_type: FuelType
    transmission: TransmissionType
    transaction_type: TransactionType = TransactionType.DOMESTIC
    reserve_price: float
    min_bid_increment: float = 100000
    options: list[str] = Field(default_factory=list)
    photo_names: list[str] = Field(default_factory=list)
    bidding_hours: int = 72
    bidding_start_at: datetime | None = None
    bidding_end_at: datetime | None = None
    currency: str = Field(min_length=3, max_length=3, default="KRW")


class UpdateVehicleRequest(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    make: str = Field(min_length=1, max_length=60)
    model: str = Field(min_length=1, max_length=60)
    year: int
    mileage_km: int
    license_plate: str | None = Field(default=None, max_length=20)
    fuel_type: FuelType
    transmission: TransmissionType
    transaction_type: TransactionType = TransactionType.DOMESTIC
    reserve_price: float
    min_bid_increment: float = 100000
    options: list[str] = Field(default_factory=list)
    currency: str = Field(min_length=3, max_length=3, default="KRW")


class VehicleResponse(BaseModel):
    id: str
    seller_id: str
    title: str
    make: str
    model: str
    year: int
    mileage_km: int
    license_plate: str | None
    fuel_type: FuelType
    transmission: TransmissionType | None = None
    transaction_type: TransactionType
    reserve_price: float
    min_bid_increment: float
    options: list[str] = Field(default_factory=list)
    photo_names: list[str] = Field(default_factory=list)
    photo_urls: list[str] = Field(default_factory=list)
    currency: str
    status: VehicleStatus
    lifecycle_state: VehicleLifecycleState
    bidding_ends_at: datetime
    winning_dealer_id: str | None
    winning_price: float | None
    created_at: datetime
