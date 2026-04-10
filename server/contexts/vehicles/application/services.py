from datetime import datetime, timezone
from uuid import UUID

from contexts.identity.domain.enums import UserRole
from contexts.identity.infrastructure.models import UserORM
from contexts.vehicles.domain.enums import FuelType, TransactionType, TransmissionType
from contexts.vehicles.domain.ports import VehicleRepositoryPort
from shared.infrastructure.errors import AppError


def normalize_vehicle_options(options: list[str] | None) -> list[str]:
    normalized: list[str] = []
    for raw in options or []:
        label = raw.strip()
        if not label or label in normalized:
            continue
        normalized.append(label)
    return normalized


def normalize_vehicle_photo_names(photo_names: list[str] | None) -> list[str]:
    normalized: list[str] = []
    for raw in photo_names or []:
        label = raw.strip()
        if not label or label in normalized:
            continue
        normalized.append(label)
    return normalized


class VehicleService:
    MAX_MILEAGE_KM = 2_147_483_647
    MAX_PRICE = 9_999_999_999

    def __init__(self, repo: VehicleRepositoryPort) -> None:
        self.repo = repo

    @staticmethod
    def _normalize_datetime(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    def create_vehicle(
        self,
        *,
        actor: UserORM,
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
        bidding_hours: int,
        bidding_start_at: datetime | None,
        bidding_end_at: datetime | None,
        options: list[str] | None = None,
        photo_names: list[str] | None = None,
    ):
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 차량을 등록할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        if year < 1980 or year > 2100:
            raise AppError("유효한 연식을 입력해 주세요.", 400, "INVALID_YEAR")

        if mileage_km < 0:
            raise AppError("주행거리는 0 이상이어야 합니다.", 400, "INVALID_MILEAGE")
        if mileage_km > self.MAX_MILEAGE_KM:
            raise AppError("주행거리가 허용 범위를 초과했습니다.", 400, "INVALID_MILEAGE")

        if reserve_price <= 0:
            raise AppError("희망가는 0보다 커야 합니다.", 400, "INVALID_PRICE")
        if reserve_price > self.MAX_PRICE:
            raise AppError("입찰 시작가는 99억 9999만 9999원 이하로 입력해 주세요.", 400, "INVALID_PRICE")

        if min_bid_increment <= 0:
            raise AppError("최소 입찰 단위는 0보다 커야 합니다.", 400, "INVALID_MIN_BID_INCREMENT")
        if min_bid_increment > self.MAX_PRICE:
            raise AppError("최소 입찰 단위가 허용 범위를 초과했습니다.", 400, "INVALID_MIN_BID_INCREMENT")

        if bidding_hours < 1 or bidding_hours > 720:
            raise AppError("입찰 기간은 1시간 이상 720시간 이하로 입력해 주세요.", 400, "INVALID_BIDDING_HOURS")

        normalized_start: datetime | None = None
        normalized_end: datetime | None = None
        if bidding_start_at or bidding_end_at:
            if not bidding_start_at or not bidding_end_at:
                raise AppError(
                    "입찰 시작/종료 시각은 함께 전달되어야 합니다.",
                    400,
                    "INVALID_BIDDING_WINDOW",
                )

            normalized_start = self._normalize_datetime(bidding_start_at)
            normalized_end = self._normalize_datetime(bidding_end_at)
            now = datetime.now(timezone.utc)
            if normalized_start < now:
                raise AppError("입찰 시작 일시는 현재 이후여야 합니다.", 400, "INVALID_BIDDING_START_AT")
            if normalized_end <= normalized_start:
                raise AppError("입찰 종료는 시작보다 늦어야 합니다.", 400, "INVALID_BIDDING_END_AT")
            duration_hours = (normalized_end - normalized_start).total_seconds() / 3600.0
            if duration_hours < 1 or duration_hours > 720:
                raise AppError("입찰 기간은 1시간 이상 720시간 이하로 설정해 주세요.", 400, "INVALID_BIDDING_WINDOW")

        vehicle = self.repo.create_vehicle(
            seller_id=actor.id,
            title=title,
            make=make,
            model=model,
            year=year,
            mileage_km=mileage_km,
            license_plate=license_plate,
            fuel_type=fuel_type,
            transmission=transmission,
            transaction_type=transaction_type,
            reserve_price=reserve_price,
            min_bid_increment=min_bid_increment,
            currency=currency,
            options=normalize_vehicle_options(options),
            bidding_hours=bidding_hours,
            bidding_start_at=normalized_start,
            bidding_end_at=normalized_end,
            photo_names=normalize_vehicle_photo_names(photo_names),
        )
        self.repo.commit()
        return vehicle

    def list_my_vehicles(self, actor: UserORM):
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 내 차량 목록을 조회할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        return self.repo.list_seller_vehicles(actor.id)

    def update_vehicle(
        self,
        *,
        actor: UserORM,
        vehicle_id: UUID,
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
        options: list[str] | None = None,
    ):
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 차량을 수정할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        vehicle = self.repo.get_vehicle_by_id(vehicle_id)
        if not vehicle or vehicle.seller_id != actor.id:
            raise AppError("차량을 찾을 수 없습니다.", 404, "VEHICLE_NOT_FOUND")

        if year < 1980 or year > 2100:
            raise AppError("유효한 연식을 입력해 주세요.", 400, "INVALID_YEAR")

        if mileage_km < 0:
            raise AppError("주행거리는 0 이상이어야 합니다.", 400, "INVALID_MILEAGE")
        if mileage_km > self.MAX_MILEAGE_KM:
            raise AppError("주행거리가 허용 범위를 초과했습니다.", 400, "INVALID_MILEAGE")

        if reserve_price <= 0:
            raise AppError("희망가는 0보다 커야 합니다.", 400, "INVALID_PRICE")
        if reserve_price > self.MAX_PRICE:
            raise AppError("입찰 시작가는 99억 9999만 9999원 이하로 입력해 주세요.", 400, "INVALID_PRICE")

        if min_bid_increment <= 0:
            raise AppError("최소 입찰 단위는 0보다 커야 합니다.", 400, "INVALID_MIN_BID_INCREMENT")
        if min_bid_increment > self.MAX_PRICE:
            raise AppError("최소 입찰 단위가 허용 범위를 초과했습니다.", 400, "INVALID_MIN_BID_INCREMENT")

        return self.repo.update_vehicle(
            vehicle=vehicle,
            title=title,
            make=make,
            model=model,
            year=year,
            mileage_km=mileage_km,
            license_plate=license_plate,
            fuel_type=fuel_type,
            transmission=transmission,
            transaction_type=transaction_type,
            reserve_price=reserve_price,
            min_bid_increment=min_bid_increment,
            currency=currency,
            options=normalize_vehicle_options(options),
        )

    def list_market(self, actor: UserORM):
        if actor.role != UserRole.DEALER:
            raise AppError("딜러만 매물 목록을 조회할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        return self.repo.list_market_active()
