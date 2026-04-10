from decimal import Decimal

from sqlalchemy.orm import Session

from contexts.bidding.application.services import BiddingService
from contexts.bidding.infrastructure.repository import SqlAlchemyBiddingRepository
from contexts.bidding.infrastructure import models as _bidding_models  # noqa: F401
from contexts.identity.domain.enums import AccountStatus, DealerApprovalStatus, UserRole
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository
from contexts.trades.infrastructure.repository import SqlAlchemyTradeWorkflowRepository
from contexts.trades.infrastructure import models as _trades_models  # noqa: F401
from contexts.trades.application.services import TradeWorkflowService
from contexts.vehicles.application.services import VehicleService
from contexts.vehicles.infrastructure import models as _vehicles_models  # noqa: F401
from contexts.vehicles.domain.enums import FuelType, TransactionType, TransmissionType
from contexts.vehicles.infrastructure.repository import SqlAlchemyVehicleRepository
from shared.infrastructure.security import hash_password


def _create_user(
    db: Session,
    *,
    email: str,
    full_name: str,
    role: UserRole,
    phone: str,
    country: str,
    business_number: str | None,
    dealer_status: DealerApprovalStatus | None,
    account_status: AccountStatus,
):
    repo = SqlAlchemyUserRepository(db)
    user = repo.create_user(
        email=email,
        full_name=full_name,
        password_hash=hash_password("test1234!"),
        role=role,
        phone=phone,
        country=country,
        business_number=business_number,
        dealer_status=dealer_status,
        account_status=account_status,
    )
    repo.commit()
    return user


def _create_vehicle(db: Session, seller_id):
    seller = SqlAlchemyUserRepository(db).get_user_by_id(seller_id)
    assert seller is not None
    vehicle_service = VehicleService(SqlAlchemyVehicleRepository(db))
    return vehicle_service.create_vehicle(
        actor=seller,
        title="현대 소나타 DN8 2.0 모던",
        make="현대",
        model="소나타 DN8 2.0 모던",
        year=2021,
        mileage_km=43000,
        license_plate="11가 1301",
        fuel_type=FuelType.GASOLINE,
        transmission=TransmissionType.AUTO,
        transaction_type=TransactionType.DOMESTIC,
        reserve_price=17000000,
        min_bid_increment=100000,
        currency="KRW",
        bidding_hours=24,
        bidding_start_at=None,
        bidding_end_at=None,
        options=[],
        photo_names=["front.jpg"],
    )


def test_close_bidding_can_select_a_specific_winning_bid(db_session: Session) -> None:
    seller = _create_user(
        db_session,
        email="seller-winner@example.com",
        full_name="Seller",
        role=UserRole.SELLER,
        phone="010-0000-0000",
        country="KR",
        business_number=None,
        dealer_status=None,
        account_status=AccountStatus.ACTIVE,
    )
    dealer_high = _create_user(
        db_session,
        email="dealer-high@example.com",
        full_name="상단딜러",
        role=UserRole.DEALER,
        phone="010-1111-1111",
        country="KR",
        business_number="111-11-11111",
        dealer_status=DealerApprovalStatus.APPROVED,
        account_status=AccountStatus.ACTIVE,
    )
    dealer_selected = _create_user(
        db_session,
        email="dealer-selected@example.com",
        full_name="선택딜러",
        role=UserRole.DEALER,
        phone="010-2222-2222",
        country="HK",
        business_number="222-22-22222",
        dealer_status=DealerApprovalStatus.APPROVED,
        account_status=AccountStatus.ACTIVE,
    )

    vehicle = _create_vehicle(db_session, seller.id)
    service = BiddingService(SqlAlchemyBiddingRepository(db_session), SqlAlchemyTradeWorkflowRepository(db_session))

    selected_bid = service.place_bid(actor=dealer_selected, vehicle_id=vehicle.id, amount=17900000)
    top_bid = service.place_bid(actor=dealer_high, vehicle_id=vehicle.id, amount=18500000)

    result = service.close_bidding(
        actor=seller,
        vehicle_id=vehicle.id,
        force_close=True,
        winning_bid_id=selected_bid.id,
    )

    assert result.vehicle.status.value == "SOLD"
    assert result.vehicle.winning_bid_id == selected_bid.id
    assert result.vehicle.winning_dealer_id == dealer_selected.id
    assert Decimal(str(result.vehicle.winning_price or 0)) == Decimal("17900000")

    rows = service.list_seller_vehicle_bids(actor=seller, vehicle_id=vehicle.id)
    assert rows[0].dealer_status == DealerApprovalStatus.APPROVED.value
    assert rows[0].dealer_business_number == "111-11-11111"
    assert rows[0].dealer_country == "KR"
    assert rows[0].dealer_completed_trade_count == 0
    assert rows[1].dealer_country == "HK"
    assert selected_bid.status.value == "WON"
    assert top_bid.status.value == "LOST"

    workflow_service = TradeWorkflowService(SqlAlchemyTradeWorkflowRepository(db_session))
    workflow = workflow_service.get_workflow(actor=seller, vehicle_id=vehicle.id).workflow
    assert workflow.current_stage.value == "INSPECTION"
    assert workflow.dealer_id == dealer_selected.id


def test_close_bidding_with_explicit_winner_below_reserve_still_awards_selected_dealer(db_session: Session) -> None:
    seller = _create_user(
        db_session,
        email="seller-reserve@example.com",
        full_name="Seller",
        role=UserRole.SELLER,
        phone="010-0000-0000",
        country="KR",
        business_number=None,
        dealer_status=None,
        account_status=AccountStatus.ACTIVE,
    )
    dealer_high = _create_user(
        db_session,
        email="dealer-reserve-high@example.com",
        full_name="상단딜러",
        role=UserRole.DEALER,
        phone="010-1111-1111",
        country="KR",
        business_number="111-11-11111",
        dealer_status=DealerApprovalStatus.APPROVED,
        account_status=AccountStatus.ACTIVE,
    )
    dealer_selected = _create_user(
        db_session,
        email="dealer-reserve-selected@example.com",
        full_name="선택딜러",
        role=UserRole.DEALER,
        phone="010-2222-2222",
        country="HK",
        business_number="222-22-22222",
        dealer_status=DealerApprovalStatus.APPROVED,
        account_status=AccountStatus.ACTIVE,
    )

    vehicle = _create_vehicle(db_session, seller.id)
    vehicle.reserve_price = 19000000
    db_session.flush()
    service = BiddingService(SqlAlchemyBiddingRepository(db_session), SqlAlchemyTradeWorkflowRepository(db_session))

    selected_bid = service.place_bid(actor=dealer_selected, vehicle_id=vehicle.id, amount=17900000)
    service.place_bid(actor=dealer_high, vehicle_id=vehicle.id, amount=18500000)

    result = service.close_bidding(
        actor=seller,
        vehicle_id=vehicle.id,
        force_close=True,
        winning_bid_id=selected_bid.id,
    )

    assert result.vehicle.status.value == "SOLD"
    assert result.vehicle.winning_bid_id == selected_bid.id
    assert result.vehicle.winning_dealer_id == dealer_selected.id

    workflow = TradeWorkflowService(SqlAlchemyTradeWorkflowRepository(db_session)).get_workflow(actor=seller, vehicle_id=vehicle.id).workflow
    assert workflow.current_stage.value == "INSPECTION"
