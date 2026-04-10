from datetime import datetime
from typing import Protocol
from uuid import UUID

from contexts.vehicles.domain.enums import FuelType, TransactionType, TransmissionType
from contexts.vehicles.infrastructure.models import VehicleORM


class VehicleRepositoryPort(Protocol):
    def create_vehicle(
        self,
        *,
        seller_id: UUID,
        title: str,
        make: str,
        model: str,
        year: int,
        mileage_km: int,
        license_plate: str | None,
        fuel_type: FuelType,
        transmission: TransmissionType,
        transaction_type: TransactionType,
        reserve_price: float,
        min_bid_increment: float,
        currency: str,
        options: list[str],
        photo_names: list[str],
        bidding_hours: int,
        bidding_start_at: datetime | None,
        bidding_end_at: datetime | None,
    ) -> VehicleORM: ...

    def get_vehicle_by_id(self, vehicle_id: UUID) -> VehicleORM | None: ...

    def update_vehicle(
        self,
        *,
        vehicle: VehicleORM,
        title: str,
        make: str,
        model: str,
        year: int,
        mileage_km: int,
        license_plate: str | None,
        fuel_type: FuelType,
        transmission: TransmissionType,
        transaction_type: TransactionType,
        reserve_price: float,
        min_bid_increment: float,
        currency: str,
        options: list[str],
    ) -> VehicleORM: ...

    def list_seller_vehicles(self, seller_id: UUID) -> list[VehicleORM]: ...

    def list_market_active(self) -> list[VehicleORM]: ...

    def commit(self) -> None: ...
