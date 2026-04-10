from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from api.dependencies import AuthContext, get_current_user, require_roles
from contexts.bidding.application.services import BiddingService
from contexts.bidding.domain.enums import BidStatus, ListingBidState, ListingSort
from contexts.bidding.domain.ports import DealerBidEntry, MarketListing
from contexts.bidding.infrastructure.repository import SqlAlchemyBiddingRepository
from contexts.bidding.presentation.schemas import (
    AdminVehicleBidDetailResponse,
    AdminVehicleBidEntryResponse,
    AdminDealerBidHistoryResponse,
    BidResponse,
    CloseBiddingRequest,
    CloseBiddingResponse,
    DealerBidResponse,
    MarketListingResponse,
    PlaceBidRequest,
    SellerVehicleBidResponse,
    SellerVehicleDetailResponse,
)
from contexts.identity.domain.enums import DealerApprovalStatus, UserRole
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository
from contexts.trades.infrastructure.repository import SqlAlchemyTradeWorkflowRepository
from contexts.vehicles.domain.enums import TransactionType
from contexts.vehicles.infrastructure.photo_storage import build_vehicle_photo_urls
from shared.infrastructure.database import get_db_session
from shared.domain.normalizers import normalize_dealer_status
from shared.domain.vehicle_lifecycle import lifecycle_from_snapshot
from shared.infrastructure.errors import AppError

router = APIRouter(tags=["bidding"]) 


def parse_uuid(raw: str, code: str = "INVALID_ID") -> UUID:
    try:
        return UUID(raw)
    except ValueError as exc:
        raise AppError("유효하지 않은 ID입니다.", 400, code) from exc


def bidding_state(ends_at: datetime) -> tuple[ListingBidState, int]:
    if ends_at.tzinfo is None:
        ends_at = ends_at.replace(tzinfo=timezone.utc)
    else:
        ends_at = ends_at.astimezone(timezone.utc)
    now = datetime.now(timezone.utc)
    if ends_at <= now:
        return ListingBidState.CLOSED, 0

    left = int((ends_at - now).total_seconds())
    if left <= 86400:
        return ListingBidState.CLOSING_SOON, left
    return ListingBidState.OPEN, left


def _safe_dealer_status_value(raw: str | None) -> str | None:
    """Return a normalized dealer status string.

    - If ``raw`` is ``None``, default via ``normalize_dealer_status``.
    - If ``raw`` matches ``DealerApprovalStatus``'s values, normalize and emit ``.value``.
    - Otherwise, return the original string unchanged (guarded behavior).
    """
    if raw is None:
        return normalize_dealer_status(None).value
    try:
        return normalize_dealer_status(DealerApprovalStatus(raw)).value
    except ValueError:
        # Unexpected persisted or malformed value: keep original to avoid drift
        return raw


def to_bid_response(row) -> BidResponse:
    return BidResponse(
        id=str(row.id),
        vehicle_id=str(row.vehicle_id),
        dealer_id=str(row.dealer_id),
        amount=float(row.amount),
        status=row.status,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def to_market_response(row: MarketListing) -> MarketListingResponse:
    state, left = bidding_state(row.vehicle.bidding_ends_at)
    return MarketListingResponse(
        id=str(row.vehicle.id),
        seller_id=str(row.vehicle.seller_id),
        title=row.vehicle.title,
        make=row.vehicle.make,
        model=row.vehicle.model,
        year=row.vehicle.year,
        mileage_km=row.vehicle.mileage_km,
        license_plate=row.vehicle.license_plate,
        fuel_type=row.vehicle.fuel_type,
        transmission=row.vehicle.transmission,
        transaction_type=row.vehicle.transaction_type,
        reserve_price=float(row.vehicle.reserve_price),
        min_bid_increment=float(row.vehicle.min_bid_increment),
        options=[option.label for option in row.vehicle.options],
        photo_urls=build_vehicle_photo_urls([photo.storage_key for photo in row.vehicle.photos]),
        currency=row.vehicle.currency,
        status=row.vehicle.status,
        bidding_ends_at=row.vehicle.bidding_ends_at,
        bidding_state=state,
        time_left_seconds=left,
        highest_bid=row.highest_bid,
        bid_count=row.bid_count,
        my_bid=row.my_bid,
    )


def to_dealer_bid_response(entry: DealerBidEntry, highest_bid: float | None) -> DealerBidResponse:
    state, left = bidding_state(entry.vehicle.bidding_ends_at)
    return DealerBidResponse(
        bid_id=str(entry.bid.id),
        vehicle_id=str(entry.vehicle.id),
        title=entry.vehicle.title,
        make=entry.vehicle.make,
        model=entry.vehicle.model,
        amount=float(entry.bid.amount),
        status=entry.bid.status,
        reserve_price=float(entry.vehicle.reserve_price),
        min_bid_increment=float(entry.vehicle.min_bid_increment),
        options=[option.label for option in entry.vehicle.options],
        photo_urls=build_vehicle_photo_urls([photo.storage_key for photo in entry.vehicle.photos]),
        transmission=entry.vehicle.transmission,
        currency=entry.vehicle.currency,
        highest_bid=highest_bid,
        bidding_ends_at=entry.vehicle.bidding_ends_at,
        bidding_state=state,
        time_left_seconds=left,
        is_winning=(highest_bid is not None and float(entry.bid.amount) == highest_bid),
        created_at=entry.bid.created_at,
        updated_at=entry.bid.updated_at,
    )


def to_admin_dealer_bid_history_response(
    entry: DealerBidEntry,
    highest_bid: float | None,
) -> AdminDealerBidHistoryResponse:
    state, left = bidding_state(entry.vehicle.bidding_ends_at)
    return AdminDealerBidHistoryResponse(
        bid_id=str(entry.bid.id),
        vehicle_id=str(entry.vehicle.id),
        vehicle_title=entry.vehicle.title,
        amount=float(entry.bid.amount),
        status=entry.bid.status,
        highest_bid=highest_bid,
        bidding_ends_at=entry.vehicle.bidding_ends_at,
        bidding_state=state,
        time_left_seconds=left,
        updated_at=entry.bid.updated_at,
    )


def to_admin_vehicle_bid_detail_response(detail, *, workflow_stage=None) -> AdminVehicleBidDetailResponse:
    highest_bid = detail.highest_bid
    return AdminVehicleBidDetailResponse(
        vehicle_id=str(detail.vehicle.id),
        vehicle_title=detail.vehicle.title,
        seller_id=str(detail.vehicle.seller_id),
        seller_name=detail.seller_name,
        seller_email=detail.seller_email,
        status=detail.vehicle.status,
        lifecycle_state=lifecycle_from_snapshot(
            vehicle_status=detail.vehicle.status,
            bidding_ends_at=detail.vehicle.bidding_ends_at,
            workflow_stage=workflow_stage,
            has_winning_dealer=detail.vehicle.winning_dealer_id is not None,
        ),
        transaction_type=detail.vehicle.transaction_type,
        reserve_price=float(detail.vehicle.reserve_price),
        min_bid_increment=float(detail.vehicle.min_bid_increment),
        options=[option.label for option in detail.vehicle.options],
        photo_names=[photo.original_name for photo in detail.vehicle.photos],
        transmission=detail.vehicle.transmission,
        currency=detail.vehicle.currency,
        bidding_ends_at=detail.vehicle.bidding_ends_at,
        sold_at=detail.vehicle.sold_at,
        winning_dealer_id=str(detail.vehicle.winning_dealer_id) if detail.vehicle.winning_dealer_id else None,
        winning_price=float(detail.vehicle.winning_price) if detail.vehicle.winning_price is not None else None,
        highest_bid=highest_bid,
        bid_count=detail.bid_count,
        bids=[
            AdminVehicleBidEntryResponse(
                bid_id=str(entry.bid.id),
                dealer_id=str(entry.bid.dealer_id),
                dealer_name=entry.dealer_full_name,
                dealer_email=entry.dealer_email,
                dealer_phone=entry.dealer_phone,
                dealer_status=_safe_dealer_status_value(entry.dealer_status),
                amount=float(entry.bid.amount),
                status=entry.bid.status,
                is_highest_active=(
                    highest_bid is not None
                    and entry.bid.status == BidStatus.ACTIVE
                    and float(entry.bid.amount) == highest_bid
                ),
                is_winning_bid=detail.vehicle.winning_bid_id == entry.bid.id,
                created_at=entry.bid.created_at,
                updated_at=entry.bid.updated_at,
            )
            for entry in detail.bids
        ],
    )


def to_seller_vehicle_detail_response(detail, *, workflow_stage=None) -> SellerVehicleDetailResponse:
    state, left = bidding_state(detail.vehicle.bidding_ends_at)
    highest_bid = detail.highest_bid
    if highest_bid is None and detail.vehicle.winning_price is not None:
        highest_bid = float(detail.vehicle.winning_price)

    return SellerVehicleDetailResponse(
        id=str(detail.vehicle.id),
        seller_id=str(detail.vehicle.seller_id),
        title=detail.vehicle.title,
        make=detail.vehicle.make,
        model=detail.vehicle.model,
        year=detail.vehicle.year,
        mileage_km=detail.vehicle.mileage_km,
        license_plate=detail.vehicle.license_plate,
        fuel_type=detail.vehicle.fuel_type,
        transmission=detail.vehicle.transmission,
        transaction_type=detail.vehicle.transaction_type,
        reserve_price=float(detail.vehicle.reserve_price),
        min_bid_increment=float(detail.vehicle.min_bid_increment),
        options=[option.label for option in detail.vehicle.options],
        photo_names=[photo.original_name for photo in detail.vehicle.photos],
        photo_urls=build_vehicle_photo_urls([photo.storage_key for photo in detail.vehicle.photos]),
        currency=detail.vehicle.currency,
        status=detail.vehicle.status,
        lifecycle_state=lifecycle_from_snapshot(
            vehicle_status=detail.vehicle.status,
            bidding_ends_at=detail.vehicle.bidding_ends_at,
            workflow_stage=workflow_stage,
            has_winning_dealer=detail.vehicle.winning_dealer_id is not None,
        ),
        bidding_started_at=detail.vehicle.bidding_started_at,
        bidding_ends_at=detail.vehicle.bidding_ends_at,
        bidding_state=state,
        time_left_seconds=left,
        highest_bid=highest_bid,
        bid_count=detail.bid_count,
        winning_dealer_id=str(detail.vehicle.winning_dealer_id) if detail.vehicle.winning_dealer_id else None,
        winning_price=float(detail.vehicle.winning_price) if detail.vehicle.winning_price is not None else None,
        created_at=detail.vehicle.created_at,
    )


def to_seller_vehicle_bid_response(entry) -> SellerVehicleBidResponse:
    return SellerVehicleBidResponse(
        id=str(entry.bid.id),
        vehicle_id=str(entry.bid.vehicle_id),
        dealer_id=str(entry.bid.dealer_id),
        dealer_name=entry.dealer_full_name,
        dealer_email=entry.dealer_email,
        dealer_country=entry.dealer_country,
        dealer_business_number=entry.dealer_business_number,
        dealer_status=entry.dealer_status,
        dealer_completed_trade_count=entry.dealer_completed_trade_count,
        amount=float(entry.bid.amount),
        status=entry.bid.status,
        created_at=entry.bid.created_at,
        updated_at=entry.bid.updated_at,
    )


@router.get(
    "/market/listings",
    response_model=list[MarketListingResponse],
    dependencies=[Depends(require_roles(UserRole.DEALER))],
)
def list_market_listings(
    auth: AuthContext = Depends(get_current_user),
    transaction_type: TransactionType | None = Query(default=None),
    keyword: str | None = Query(default=None, min_length=1, max_length=120),
    sort: ListingSort = Query(default=ListingSort.NEWEST),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db_session),
) -> list[MarketListingResponse]:
    user_repo = SqlAlchemyUserRepository(db)
    actor = user_repo.get_user_by_id(auth.user_id)
    if not actor:
        raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

    service = BiddingService(SqlAlchemyBiddingRepository(db))
    rows = service.list_market(
        actor=actor,
        transaction_type=transaction_type,
        keyword=keyword,
        sort=sort,
        offset=offset,
        limit=limit,
    )
    return [to_market_response(row) for row in rows]


@router.post(
    "/market/listings/{vehicle_id}/bids",
    response_model=BidResponse,
    dependencies=[Depends(require_roles(UserRole.DEALER))],
)
def place_bid(
    vehicle_id: str,
    payload: PlaceBidRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> BidResponse:
    vehicle_uuid = parse_uuid(vehicle_id, "INVALID_VEHICLE_ID")

    user_repo = SqlAlchemyUserRepository(db)
    actor = user_repo.get_user_by_id(auth.user_id)
    if not actor:
        raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

    service = BiddingService(SqlAlchemyBiddingRepository(db))
    bid = service.place_bid(actor=actor, vehicle_id=vehicle_uuid, amount=payload.amount)
    return to_bid_response(bid)


@router.patch(
    "/market/listings/{vehicle_id}/bids/me",
    response_model=BidResponse,
    dependencies=[Depends(require_roles(UserRole.DEALER))],
)
def update_my_bid(
    vehicle_id: str,
    payload: PlaceBidRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> BidResponse:
    vehicle_uuid = parse_uuid(vehicle_id, "INVALID_VEHICLE_ID")

    user_repo = SqlAlchemyUserRepository(db)
    actor = user_repo.get_user_by_id(auth.user_id)
    if not actor:
        raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

    service = BiddingService(SqlAlchemyBiddingRepository(db))
    bid = service.place_bid(actor=actor, vehicle_id=vehicle_uuid, amount=payload.amount)
    return to_bid_response(bid)


@router.delete(
    "/market/listings/{vehicle_id}/bids/me",
    response_model=BidResponse,
    dependencies=[Depends(require_roles(UserRole.DEALER))],
)
def cancel_my_bid(
    vehicle_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> BidResponse:
    vehicle_uuid = parse_uuid(vehicle_id, "INVALID_VEHICLE_ID")

    user_repo = SqlAlchemyUserRepository(db)
    actor = user_repo.get_user_by_id(auth.user_id)
    if not actor:
        raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

    service = BiddingService(SqlAlchemyBiddingRepository(db))
    bid = service.cancel_my_bid(actor=actor, vehicle_id=vehicle_uuid)
    return to_bid_response(bid)


@router.get(
    "/dealer/bids/my",
    response_model=list[DealerBidResponse],
    dependencies=[Depends(require_roles(UserRole.DEALER))],
)
def list_my_bids(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[DealerBidResponse]:
    user_repo = SqlAlchemyUserRepository(db)
    actor = user_repo.get_user_by_id(auth.user_id)
    if not actor:
        raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

    repo = SqlAlchemyBiddingRepository(db)
    service = BiddingService(repo)
    entries = service.list_my_bids(actor=actor)

    result: list[DealerBidResponse] = []
    for entry in entries:
        highest = repo.get_highest_active_bid_amount(entry.vehicle.id)
        result.append(to_dealer_bid_response(entry, highest))
    return result


@router.get(
    "/admin/dealers/{dealer_id}/bids",
    response_model=list[AdminDealerBidHistoryResponse],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def list_admin_dealer_bid_history(
    dealer_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[AdminDealerBidHistoryResponse]:
    _ = auth
    dealer_uuid = parse_uuid(dealer_id, "INVALID_DEALER_ID")

    user_repo = SqlAlchemyUserRepository(db)
    dealer = user_repo.get_user_by_id(dealer_uuid)
    if not dealer or dealer.role != UserRole.DEALER:
        raise AppError("딜러 계정을 찾을 수 없습니다.", 404, "DEALER_NOT_FOUND")

    repo = SqlAlchemyBiddingRepository(db)
    service = BiddingService(repo)
    entries = service.list_my_bids(actor=dealer)
    return [to_admin_dealer_bid_history_response(entry, repo.get_highest_active_bid_amount(entry.vehicle.id)) for entry in entries]


@router.get(
    "/admin/vehicles/{vehicle_id}/bids",
    response_model=AdminVehicleBidDetailResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def get_admin_vehicle_bids(
    vehicle_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> AdminVehicleBidDetailResponse:
    vehicle_uuid = parse_uuid(vehicle_id, "INVALID_VEHICLE_ID")

    user_repo = SqlAlchemyUserRepository(db)
    actor = user_repo.get_user_by_id(auth.user_id)
    if not actor:
        raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

    service = BiddingService(SqlAlchemyBiddingRepository(db))
    detail = service.get_admin_vehicle_bid_detail(actor=actor, vehicle_id=vehicle_uuid)
    workflow = SqlAlchemyTradeWorkflowRepository(db).get_workflow_by_vehicle(vehicle_uuid)
    return to_admin_vehicle_bid_detail_response(detail, workflow_stage=workflow.current_stage if workflow else None)


@router.get(
    "/seller/vehicles/{vehicle_id}",
    response_model=SellerVehicleDetailResponse,
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def get_seller_vehicle_detail(
    vehicle_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> SellerVehicleDetailResponse:
    vehicle_uuid = parse_uuid(vehicle_id, "INVALID_VEHICLE_ID")

    user_repo = SqlAlchemyUserRepository(db)
    actor = user_repo.get_user_by_id(auth.user_id)
    if not actor:
        raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

    service = BiddingService(SqlAlchemyBiddingRepository(db))
    detail = service.get_seller_vehicle_detail(actor=actor, vehicle_id=vehicle_uuid)
    workflow = SqlAlchemyTradeWorkflowRepository(db).get_workflow_by_vehicle(vehicle_uuid)
    return to_seller_vehicle_detail_response(detail, workflow_stage=workflow.current_stage if workflow else None)


@router.get(
    "/seller/vehicles/{vehicle_id}/bids",
    response_model=list[SellerVehicleBidResponse],
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def list_seller_vehicle_bids(
    vehicle_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[SellerVehicleBidResponse]:
    vehicle_uuid = parse_uuid(vehicle_id, "INVALID_VEHICLE_ID")

    user_repo = SqlAlchemyUserRepository(db)
    actor = user_repo.get_user_by_id(auth.user_id)
    if not actor:
        raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

    service = BiddingService(SqlAlchemyBiddingRepository(db))
    entries = service.list_seller_vehicle_bids(actor=actor, vehicle_id=vehicle_uuid)
    return [to_seller_vehicle_bid_response(entry) for entry in entries]


@router.post(
    "/seller/vehicles/{vehicle_id}/bidding/close",
    response_model=CloseBiddingResponse,
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def close_bidding(
    vehicle_id: str,
    payload: CloseBiddingRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> CloseBiddingResponse:
    vehicle_uuid = parse_uuid(vehicle_id, "INVALID_VEHICLE_ID")

    user_repo = SqlAlchemyUserRepository(db)
    actor = user_repo.get_user_by_id(auth.user_id)
    if not actor:
        raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

    service = BiddingService(SqlAlchemyBiddingRepository(db), SqlAlchemyTradeWorkflowRepository(db))
    winning_bid_uuid = None
    if payload.winning_bid_id:
        winning_bid_uuid = parse_uuid(payload.winning_bid_id, "INVALID_WINNING_BID_ID")

    result = service.close_bidding(
        actor=actor,
        vehicle_id=vehicle_uuid,
        force_close=payload.force_close,
        winning_bid_id=winning_bid_uuid,
    )

    workflow = SqlAlchemyTradeWorkflowRepository(db).get_workflow_by_vehicle(result.vehicle.id)

    return CloseBiddingResponse(
        vehicle_id=str(result.vehicle.id),
        status=result.vehicle.status,
        lifecycle_state=lifecycle_from_snapshot(
            vehicle_status=result.vehicle.status,
            bidding_ends_at=result.vehicle.bidding_ends_at,
            workflow_stage=workflow.current_stage if workflow else None,
            has_winning_dealer=result.vehicle.winning_dealer_id is not None,
        ),
        message=result.message,
        winning_bid_id=str(result.vehicle.winning_bid_id) if result.vehicle.winning_bid_id else None,
        winning_dealer_id=str(result.vehicle.winning_dealer_id) if result.vehicle.winning_dealer_id else None,
        winning_price=float(result.vehicle.winning_price) if result.vehicle.winning_price is not None else None,
        sold_at=result.vehicle.sold_at,
    )
