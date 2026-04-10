from sqlalchemy import select
from sqlalchemy.orm import Session

from contexts.bidding.application.services import BiddingService
from contexts.bidding.infrastructure.repository import SqlAlchemyBiddingRepository
from contexts.bidding.presentation.router import to_seller_vehicle_detail_response
from contexts.identity.domain.enums import AccountStatus, UserRole
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository
from contexts.identity.bootstrap import ensure_identity_bootstrap_data
from contexts.vehicles.bootstrap import ensure_local_demo_vehicle_data
from contexts.vehicles.domain.enums import FuelType, TransactionType, TransmissionType
from contexts.vehicles.application.services import VehicleService
from contexts.vehicles.infrastructure.models import VehicleORM
from contexts.vehicles.infrastructure.repository import SqlAlchemyVehicleRepository
from contexts.vehicles.presentation.router import to_vehicle_response
from shared.infrastructure.security import hash_password
from config import get_settings


def _create_seller(db: Session):
    repo = SqlAlchemyUserRepository(db)
    seller = repo.create_user(
        email="seller-options@example.com",
        full_name="Option Seller",
        password_hash=hash_password("test1234"),
        role=UserRole.SELLER,
        phone="010-1111-2222",
        country="KR",
        business_number=None,
        dealer_status=None,
        account_status=AccountStatus.ACTIVE,
    )
    repo.commit()
    return seller


def test_vehicle_options_flow_from_create_to_detail_response(db_session: Session) -> None:
    seller = _create_seller(db_session)

    vehicle_service = VehicleService(SqlAlchemyVehicleRepository(db_session))
    vehicle = vehicle_service.create_vehicle(
        actor=seller,
        title="현대 그랜저 IG",
        make="현대",
        model="그랜저 IG",
        year=2021,
        mileage_km=41200,
        license_plate="11가1301",
        fuel_type=FuelType.GASOLINE,
        transmission=TransmissionType.AUTO,
        transaction_type=TransactionType.DOMESTIC,
        reserve_price=28500000,
        min_bid_increment=100000,
        currency="KRW",
        bidding_hours=72,
        bidding_start_at=None,
        bidding_end_at=None,
        options=["  선루프  ", "내비게이션", "선루프", "", "후방카메라"],
        photo_names=["front.jpg", "rear.jpg", "side.jpg", "interior.jpg"],
    )

    assert [option.label for option in vehicle.options] == ["선루프", "내비게이션", "후방카메라"]
    assert vehicle.transmission == "AUTO"
    assert [photo.original_name for photo in vehicle.photos] == ["front.jpg", "rear.jpg", "side.jpg", "interior.jpg"]

    vehicle_response = to_vehicle_response(vehicle)
    assert vehicle_response.options == ["선루프", "내비게이션", "후방카메라"]
    assert vehicle_response.transmission == TransmissionType.AUTO
    assert vehicle_response.photo_names == ["front.jpg", "rear.jpg", "side.jpg", "interior.jpg"]
    assert vehicle_response.photo_urls == []

    detail = BiddingService(SqlAlchemyBiddingRepository(db_session)).get_seller_vehicle_detail(
        actor=seller,
        vehicle_id=vehicle.id,
    )
    detail_response = to_seller_vehicle_detail_response(detail)
    assert detail_response.options == ["선루프", "내비게이션", "후방카메라"]
    assert detail_response.transmission == TransmissionType.AUTO
    assert detail_response.photo_names == ["front.jpg", "rear.jpg", "side.jpg", "interior.jpg"]
    assert detail_response.photo_urls == []

    updated = vehicle_service.update_vehicle(
        actor=seller,
        vehicle_id=vehicle.id,
        title="현대 그랜저 IG 프리미엄",
        make="현대",
        model="그랜저 IG",
        year=2022,
        mileage_km=40200,
        license_plate="12가3456",
        fuel_type=FuelType.GASOLINE,
        transmission=TransmissionType.AUTO,
        transaction_type=TransactionType.DOMESTIC,
        reserve_price=29500000,
        min_bid_increment=200000,
        currency="KRW",
        options=["선루프", "후방카메라"],
    )
    assert updated.title == "현대 그랜저 IG 프리미엄"
    assert [option.label for option in updated.options] == ["선루프", "후방카메라"]


def test_local_bootstrap_seeds_vehicle_options(db_session: Session, monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "environment", "test")
    monkeypatch.setattr(settings, "bootstrap_local_test_accounts", True)

    ensure_identity_bootstrap_data(db_session)
    ensure_local_demo_vehicle_data(db_session)

    vehicle = db_session.scalar(select(VehicleORM).where(VehicleORM.license_plate == "11가 1303"))
    assert vehicle is not None
    assert [option.label for option in vehicle.options] == ["블루투스", "스마트크루즈", "후방카메라", "열선시트(앞좌석)"]
    assert vehicle.transmission == "AUTO"
    assert [photo.original_name for photo in vehicle.photos] == ["전면", "후면", "실내", "계기판", "타이어", "측면"]
    assert all(photo.storage_key for photo in vehicle.photos)
