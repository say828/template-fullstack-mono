from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from contexts.bidding.domain.enums import BidStatus, ListingSort
from contexts.bidding.domain.ports import (
    AdminVehicleBidDetail,
    BiddingRepositoryPort,
    DealerBidEntry,
    MarketListing,
    SellerVehicleBidEntry,
    SellerVehicleDetail,
)
from contexts.bidding.infrastructure.models import BidORM
from contexts.identity.domain.enums import UserRole
from contexts.identity.infrastructure.models import UserORM
from contexts.trades.application.workflow_start import ensure_awarded_trade_workflow
from contexts.trades.domain.ports import TradeWorkflowRepositoryPort
from contexts.vehicles.domain.enums import TransactionType, VehicleStatus
from contexts.vehicles.infrastructure.models import VehicleORM
from shared.domain.vehicle_lifecycle import (
    VehicleLifecycleEvent,
    VehicleLifecycleState,
    lifecycle_from_snapshot,
    transition_vehicle_lifecycle,
)
from shared.infrastructure.errors import AppError


@dataclass
class CloseBiddingResult:
    vehicle: VehicleORM
    winning_bid: BidORM | None
    message: str


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


class BiddingService:
    def __init__(self, repo: BiddingRepositoryPort, trade_repo: TradeWorkflowRepositoryPort | None = None) -> None:
        self.repo = repo
        self.trade_repo = trade_repo

    @staticmethod
    def _vehicle_lifecycle(vehicle: VehicleORM, *, now: datetime | None = None) -> VehicleLifecycleState:
        return lifecycle_from_snapshot(
            vehicle_status=vehicle.status,
            bidding_ends_at=vehicle.bidding_ends_at,
            workflow_stage=None,
            has_winning_dealer=vehicle.winning_dealer_id is not None,
            now=now,
        )

    def list_market(
        self,
        *,
        actor: UserORM,
        transaction_type: TransactionType | None,
        keyword: str | None,
        sort: ListingSort,
        offset: int,
        limit: int,
    ) -> list[MarketListing]:
        if actor.role != UserRole.DEALER:
            raise AppError("딜러만 매물 목록을 조회할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        return self.repo.list_market_listings(
            dealer_id=actor.id,
            transaction_type=transaction_type,
            keyword=keyword,
            sort=sort,
            offset=offset,
            limit=limit,
        )

    def place_bid(self, *, actor: UserORM, vehicle_id: UUID, amount: float) -> BidORM:
        if actor.role != UserRole.DEALER:
            raise AppError("딜러만 입찰할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        vehicle = self.repo.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            raise AppError("매물을 찾을 수 없습니다.", 404, "VEHICLE_NOT_FOUND")

        lifecycle = self._vehicle_lifecycle(vehicle, now=datetime.now(timezone.utc))
        if lifecycle != VehicleLifecycleState.BIDDING:
            raise AppError("입찰 가능한 매물이 아닙니다.", 409, "BIDDING_NOT_AVAILABLE")

        now = datetime.now(timezone.utc)
        bidding_started_at = as_utc(vehicle.bidding_started_at)
        bidding_ends_at = as_utc(vehicle.bidding_ends_at)
        if bidding_started_at > now:
            raise AppError("입찰 시작 전입니다.", 409, "BIDDING_NOT_STARTED")
        if bidding_ends_at <= now:
            raise AppError("입찰이 마감되었습니다.", 409, "BIDDING_CLOSED")

        bid_amount = Decimal(str(amount))
        if bid_amount <= 0:
            raise AppError("입찰 금액은 0보다 커야 합니다.", 400, "INVALID_BID_AMOUNT")

        min_increment = Decimal(str(vehicle.min_bid_increment))
        if min_increment <= 0:
            raise AppError("최소 입찰 단위가 잘못 설정되어 있습니다.", 500, "INVALID_INCREMENT_CONFIG")

        if bid_amount % min_increment != 0:
            raise AppError("최소 입찰 단위 기준을 충족하지 않았습니다.", 400, "BID_INCREMENT_INVALID")

        current_highest = self.repo.get_highest_active_bid_amount(vehicle_id)
        if current_highest is not None and bid_amount <= Decimal(str(current_highest)):
            raise AppError("현재 최고 입찰가보다 높은 금액만 가능합니다.", 400, "BID_MUST_EXCEED_HIGHEST")

        existing = self.repo.get_bid(vehicle_id, actor.id)
        bid = self.repo.upsert_bid(
            existing=existing,
            vehicle_id=vehicle_id,
            dealer_id=actor.id,
            amount=float(bid_amount),
        )
        self.repo.commit()
        return bid

    def cancel_my_bid(self, *, actor: UserORM, vehicle_id: UUID) -> BidORM:
        if actor.role != UserRole.DEALER:
            raise AppError("딜러만 입찰을 취소할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        vehicle = self.repo.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            raise AppError("매물을 찾을 수 없습니다.", 404, "VEHICLE_NOT_FOUND")

        lifecycle = self._vehicle_lifecycle(vehicle, now=datetime.now(timezone.utc))
        if lifecycle != VehicleLifecycleState.BIDDING:
            raise AppError("취소 가능한 입찰 상태가 아닙니다.", 409, "BID_CANCEL_NOT_ALLOWED")

        now = datetime.now(timezone.utc)
        bidding_started_at = as_utc(vehicle.bidding_started_at)
        bidding_ends_at = as_utc(vehicle.bidding_ends_at)
        if bidding_started_at > now:
            raise AppError("입찰 시작 전에는 취소할 수 없습니다.", 409, "BIDDING_NOT_STARTED")
        if bidding_ends_at <= now:
            raise AppError("입찰 마감 후에는 취소할 수 없습니다.", 409, "BIDDING_CLOSED")

        bid = self.repo.get_active_bid(vehicle_id, actor.id)
        if not bid:
            raise AppError("활성 입찰이 없습니다.", 404, "BID_NOT_FOUND")

        updated = self.repo.cancel_bid(bid)
        self.repo.commit()
        return updated

    def list_my_bids(self, *, actor: UserORM) -> list[DealerBidEntry]:
        if actor.role != UserRole.DEALER:
            raise AppError("딜러만 내 입찰 목록을 조회할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        return self.repo.list_dealer_bids(actor.id)

    def get_seller_vehicle_detail(self, *, actor: UserORM, vehicle_id: UUID) -> SellerVehicleDetail:
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 차량 상세를 조회할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        vehicle = self.repo.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            raise AppError("매물을 찾을 수 없습니다.", 404, "VEHICLE_NOT_FOUND")

        if vehicle.seller_id != actor.id:
            raise AppError("본인 매물만 조회할 수 있습니다.", 403, "NOT_VEHICLE_OWNER")

        highest = self.repo.get_highest_active_bid_amount(vehicle_id)
        bid_count = self.repo.get_active_bid_count(vehicle_id)
        return SellerVehicleDetail(vehicle=vehicle, highest_bid=highest, bid_count=bid_count)

    def list_seller_vehicle_bids(self, *, actor: UserORM, vehicle_id: UUID) -> list[SellerVehicleBidEntry]:
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 차량 입찰현황을 조회할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        vehicle = self.repo.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            raise AppError("매물을 찾을 수 없습니다.", 404, "VEHICLE_NOT_FOUND")

        if vehicle.seller_id != actor.id:
            raise AppError("본인 매물만 조회할 수 있습니다.", 403, "NOT_VEHICLE_OWNER")

        return self.repo.list_vehicle_bids(vehicle_id)

    def get_admin_vehicle_bid_detail(self, *, actor: UserORM, vehicle_id: UUID) -> AdminVehicleBidDetail:
        if actor.role != UserRole.ADMIN:
            raise AppError("관리자만 차량 입찰현황을 조회할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        try:
            return self.repo.get_admin_vehicle_bid_detail(vehicle_id)
        except ValueError as exc:
            if str(exc) == "vehicle_not_found":
                raise AppError("매물을 찾을 수 없습니다.", 404, "VEHICLE_NOT_FOUND") from exc
            raise

    def close_bidding(
        self,
        *,
        actor: UserORM,
        vehicle_id: UUID,
        force_close: bool,
        winning_bid_id: UUID | None = None,
    ) -> CloseBiddingResult:
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 입찰을 마감할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        vehicle = self.repo.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            raise AppError("매물을 찾을 수 없습니다.", 404, "VEHICLE_NOT_FOUND")

        if vehicle.seller_id != actor.id:
            raise AppError("본인 매물만 마감할 수 있습니다.", 403, "NOT_VEHICLE_OWNER")

        lifecycle = self._vehicle_lifecycle(vehicle, now=datetime.now(timezone.utc))
        if lifecycle not in (VehicleLifecycleState.BIDDING, VehicleLifecycleState.BIDDING_CLOSED):
            raise AppError("이미 마감 처리된 매물입니다.", 409, "VEHICLE_ALREADY_CLOSED")

        now = datetime.now(timezone.utc)
        bidding_ends_at = as_utc(vehicle.bidding_ends_at)
        if not force_close and bidding_ends_at > now:
            raise AppError("입찰 종료 시간이 지나야 마감할 수 있습니다.", 409, "BIDDING_NOT_ENDED")

        if lifecycle == VehicleLifecycleState.BIDDING:
            transition_vehicle_lifecycle(lifecycle, VehicleLifecycleEvent.BIDDING_WINDOW_CLOSED)

        vehicle.bidding_ends_at = now
        active_bids = self.repo.list_vehicle_active_bids(vehicle_id)
        highest = self.repo.get_highest_active_bid(vehicle_id)

        if not highest:
            transition_vehicle_lifecycle(VehicleLifecycleState.BIDDING_CLOSED, VehicleLifecycleEvent.BIDDING_FAILED)
            vehicle.status = VehicleStatus.CANCELLED
            vehicle.sold_at = now
            self.repo.commit()
            return CloseBiddingResult(vehicle=vehicle, winning_bid=None, message="유찰 처리되었습니다. (입찰 없음)")

        reserve = Decimal(str(vehicle.reserve_price))
        chosen = highest
        if winning_bid_id is not None:
            selected = next((row for row in active_bids if row.id == winning_bid_id), None)
            if not selected:
                raise AppError("선택한 입찰을 찾을 수 없습니다.", 404, "WINNING_BID_NOT_FOUND")
            chosen = selected

        chosen_amount = Decimal(str(chosen.amount))

        selected_explicitly = winning_bid_id is not None

        if not selected_explicitly and chosen_amount < reserve:
            transition_vehicle_lifecycle(VehicleLifecycleState.BIDDING_CLOSED, VehicleLifecycleEvent.BIDDING_FAILED)
            for row in active_bids:
                row.status = BidStatus.LOST
            vehicle.status = VehicleStatus.CANCELLED
            vehicle.sold_at = now
            self.repo.commit()
            return CloseBiddingResult(vehicle=vehicle, winning_bid=None, message="유찰 처리되었습니다. (희망가 미달)")

        transition_vehicle_lifecycle(VehicleLifecycleState.BIDDING_CLOSED, VehicleLifecycleEvent.WINNER_CONFIRMED)
        for row in active_bids:
            row.status = BidStatus.WON if row.id == chosen.id else BidStatus.LOST

        vehicle.status = VehicleStatus.SOLD
        vehicle.winning_bid_id = chosen.id
        vehicle.winning_dealer_id = chosen.dealer_id
        vehicle.winning_price = chosen.amount
        vehicle.sold_at = now
        if self.trade_repo is not None:
            ensure_awarded_trade_workflow(self.trade_repo, vehicle=vehicle)
        self.repo.commit()

        return CloseBiddingResult(vehicle=vehicle, winning_bid=chosen, message="낙찰 처리되었습니다.")
