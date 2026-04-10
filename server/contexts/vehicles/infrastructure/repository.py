from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from contexts.vehicles.domain.enums import FuelType, TransactionType, TransmissionType, VehicleStatus
from contexts.vehicles.domain.ports import VehicleRepositoryPort
from contexts.vehicles.infrastructure.models import VehicleORM, VehicleOptionORM, VehiclePhotoORM


class SqlAlchemyVehicleRepository(VehicleRepositoryPort):
    def __init__(self, db: Session) -> None:
        self.db = db

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
    ) -> VehicleORM:
        now = datetime.now(timezone.utc)
        starts_at = bidding_start_at or now
        ends_at = bidding_end_at or (starts_at + timedelta(hours=bidding_hours))
        row = VehicleORM(
            seller_id=seller_id,
            title=title,
            make=make,
            model=model,
            year=year,
            mileage_km=mileage_km,
            license_plate=license_plate.strip().upper() if license_plate else None,
            fuel_type=fuel_type,
            transmission=transmission.value,
            transaction_type=transaction_type,
            reserve_price=reserve_price,
            min_bid_increment=min_bid_increment,
            currency=currency,
            status=VehicleStatus.ACTIVE,
            bidding_started_at=starts_at,
            bidding_ends_at=ends_at,
            options=[
                VehicleOptionORM(label=label, sort_order=index)
                for index, label in enumerate(options)
            ],
            photos=[
                VehiclePhotoORM(
                    original_name=label,
                    storage_key=None,
                    content_type=None,
                    size_bytes=None,
                    sort_order=index,
                )
                for index, label in enumerate(photo_names)
            ],
        )
        self.db.add(row)
        self.db.flush()
        return row

    def get_vehicle_by_id(self, vehicle_id: UUID) -> VehicleORM | None:
        return self.db.get(VehicleORM, vehicle_id)

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
    ) -> VehicleORM:
        vehicle.title = title
        vehicle.make = make
        vehicle.model = model
        vehicle.year = year
        vehicle.mileage_km = mileage_km
        vehicle.license_plate = license_plate.strip().upper() if license_plate else None
        vehicle.fuel_type = fuel_type
        vehicle.transmission = transmission.value
        vehicle.transaction_type = transaction_type
        vehicle.reserve_price = reserve_price
        vehicle.min_bid_increment = min_bid_increment
        vehicle.currency = currency
        vehicle.options = [VehicleOptionORM(label=label, sort_order=index) for index, label in enumerate(options)]
        self.db.flush()
        return vehicle

    def list_seller_vehicles(self, seller_id: UUID) -> list[VehicleORM]:
        stmt = select(VehicleORM).where(VehicleORM.seller_id == seller_id).order_by(VehicleORM.created_at.desc())
        return list(self.db.scalars(stmt).all())

    def list_market_active(self) -> list[VehicleORM]:
        now = datetime.now(timezone.utc)
        stmt = (
            select(VehicleORM)
            .where(
                VehicleORM.status == VehicleStatus.ACTIVE,
                VehicleORM.bidding_started_at <= now,
                VehicleORM.bidding_ends_at > now,
            )
            .order_by(VehicleORM.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def commit(self) -> None:
        self.db.commit()
