from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from contexts.bidding.domain.enums import BidStatus, ListingSort
from contexts.bidding.domain.ports import (
    AdminVehicleBidDetail,
    AdminVehicleBidEntry,
    BiddingRepositoryPort,
    DealerBidEntry,
    MarketListing,
    SellerVehicleBidEntry,
)
from contexts.bidding.infrastructure.models import BidORM
from contexts.identity.infrastructure.models import UserORM
from contexts.trades.domain.enums import TradeStage
from contexts.trades.infrastructure.models import TradeWorkflowORM
from contexts.vehicles.domain.enums import TransactionType, VehicleStatus
from contexts.vehicles.infrastructure.models import VehicleORM


class SqlAlchemyBiddingRepository(BiddingRepositoryPort):
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_market_listings(
        self,
        *,
        dealer_id: UUID,
        transaction_type: TransactionType | None,
        keyword: str | None,
        sort: ListingSort,
        offset: int,
        limit: int,
    ) -> list[MarketListing]:
        now = datetime.now(timezone.utc)

        stats_subq = (
            select(
                BidORM.vehicle_id.label("vehicle_id"),
                func.max(BidORM.amount).label("highest_bid"),
                func.count(BidORM.id).label("bid_count"),
            )
            .where(BidORM.status == BidStatus.ACTIVE)
            .group_by(BidORM.vehicle_id)
            .subquery()
        )

        my_bid_subq = (
            select(BidORM.vehicle_id.label("vehicle_id"), BidORM.amount.label("my_bid"))
            .where(BidORM.dealer_id == dealer_id, BidORM.status == BidStatus.ACTIVE)
            .subquery()
        )

        stmt = (
            select(VehicleORM, stats_subq.c.highest_bid, stats_subq.c.bid_count, my_bid_subq.c.my_bid)
            .outerjoin(stats_subq, stats_subq.c.vehicle_id == VehicleORM.id)
            .outerjoin(my_bid_subq, my_bid_subq.c.vehicle_id == VehicleORM.id)
            .where(
                VehicleORM.status == VehicleStatus.ACTIVE,
                VehicleORM.bidding_started_at <= now,
                VehicleORM.bidding_ends_at > now,
            )
        )

        if transaction_type is not None:
            stmt = stmt.where(VehicleORM.transaction_type == transaction_type)

        if keyword:
            term = f"%{keyword.strip()}%"
            stmt = stmt.where(
                or_(
                    VehicleORM.title.ilike(term),
                    VehicleORM.make.ilike(term),
                    VehicleORM.model.ilike(term),
                    VehicleORM.license_plate.ilike(term),
                )
            )

        if sort == ListingSort.HIGHEST_BID:
            stmt = stmt.order_by(func.coalesce(stats_subq.c.highest_bid, 0).desc(), VehicleORM.created_at.desc())
        elif sort == ListingSort.LOWEST_BID:
            stmt = stmt.order_by(func.coalesce(stats_subq.c.highest_bid, 999999999999).asc(), VehicleORM.created_at.desc())
        elif sort == ListingSort.MOST_BIDS:
            stmt = stmt.order_by(func.coalesce(stats_subq.c.bid_count, 0).desc(), VehicleORM.created_at.desc())
        else:
            stmt = stmt.order_by(VehicleORM.created_at.desc())

        rows = self.db.execute(stmt.offset(offset).limit(limit)).all()

        result: list[MarketListing] = []
        for vehicle, highest_bid, bid_count, my_bid in rows:
            result.append(
                MarketListing(
                    vehicle=vehicle,
                    highest_bid=float(highest_bid) if highest_bid is not None else None,
                    bid_count=int(bid_count or 0),
                    my_bid=float(my_bid) if my_bid is not None else None,
                )
            )
        return result

    def get_vehicle_by_id(self, vehicle_id: UUID) -> VehicleORM | None:
        stmt = select(VehicleORM).where(VehicleORM.id == vehicle_id)
        return self.db.scalar(stmt)

    def get_bid(self, vehicle_id: UUID, dealer_id: UUID) -> BidORM | None:
        stmt = select(BidORM).where(BidORM.vehicle_id == vehicle_id, BidORM.dealer_id == dealer_id)
        return self.db.scalar(stmt)

    def get_active_bid(self, vehicle_id: UUID, dealer_id: UUID) -> BidORM | None:
        stmt = select(BidORM).where(
            BidORM.vehicle_id == vehicle_id,
            BidORM.dealer_id == dealer_id,
            BidORM.status == BidStatus.ACTIVE,
        )
        return self.db.scalar(stmt)

    def get_highest_active_bid(self, vehicle_id: UUID) -> BidORM | None:
        stmt = (
            select(BidORM)
            .where(BidORM.vehicle_id == vehicle_id, BidORM.status == BidStatus.ACTIVE)
            .order_by(BidORM.amount.desc(), BidORM.created_at.asc())
            .limit(1)
        )
        return self.db.scalar(stmt)

    def get_highest_active_bid_amount(self, vehicle_id: UUID) -> float | None:
        stmt = select(func.max(BidORM.amount)).where(BidORM.vehicle_id == vehicle_id, BidORM.status == BidStatus.ACTIVE)
        value = self.db.scalar(stmt)
        if value is None:
            return None
        return float(value)

    def get_active_bid_count(self, vehicle_id: UUID) -> int:
        stmt = select(func.count(BidORM.id)).where(BidORM.vehicle_id == vehicle_id, BidORM.status == BidStatus.ACTIVE)
        return int(self.db.scalar(stmt) or 0)

    def upsert_bid(
        self,
        *,
        existing: BidORM | None,
        vehicle_id: UUID,
        dealer_id: UUID,
        amount: float,
    ) -> BidORM:
        if existing:
            existing.amount = amount
            existing.status = BidStatus.ACTIVE
            self.db.add(existing)
            self.db.flush()
            return existing

        row = BidORM(vehicle_id=vehicle_id, dealer_id=dealer_id, amount=amount, status=BidStatus.ACTIVE)
        self.db.add(row)
        self.db.flush()
        return row

    def cancel_bid(self, bid: BidORM) -> BidORM:
        bid.status = BidStatus.CANCELLED
        self.db.add(bid)
        self.db.flush()
        return bid

    def list_dealer_bids(self, dealer_id: UUID) -> list[DealerBidEntry]:
        stmt = (
            select(BidORM, VehicleORM)
            .join(VehicleORM, VehicleORM.id == BidORM.vehicle_id)
            .where(BidORM.dealer_id == dealer_id)
            .order_by(BidORM.updated_at.desc())
        )
        rows = self.db.execute(stmt).all()
        return [DealerBidEntry(bid=bid, vehicle=vehicle) for bid, vehicle in rows]

    def list_vehicle_active_bids(self, vehicle_id: UUID) -> list[BidORM]:
        stmt = select(BidORM).where(BidORM.vehicle_id == vehicle_id, BidORM.status == BidStatus.ACTIVE)
        return list(self.db.scalars(stmt).all())

    def list_vehicle_bids(self, vehicle_id: UUID) -> list[SellerVehicleBidEntry]:
        completed_trade_counts = (
            select(
                TradeWorkflowORM.dealer_id.label("dealer_id"),
                func.count(TradeWorkflowORM.id).label("dealer_completed_trade_count"),
            )
            .where(TradeWorkflowORM.current_stage == TradeStage.COMPLETED)
            .group_by(TradeWorkflowORM.dealer_id)
            .subquery()
        )
        stmt = (
            select(BidORM, UserORM, completed_trade_counts.c.dealer_completed_trade_count)
            .join(UserORM, UserORM.id == BidORM.dealer_id)
            .outerjoin(completed_trade_counts, completed_trade_counts.c.dealer_id == UserORM.id)
            .where(BidORM.vehicle_id == vehicle_id)
            .order_by(BidORM.amount.desc(), BidORM.updated_at.desc())
        )
        rows = self.db.execute(stmt).all()
        return [
            SellerVehicleBidEntry(
                bid=bid,
                dealer_full_name=dealer.full_name,
                dealer_email=dealer.email,
                dealer_country=dealer.country,
                dealer_business_number=dealer.business_number,
                dealer_status=dealer.dealer_status.value if dealer.dealer_status else None,
                dealer_completed_trade_count=int(dealer_completed_trade_count or 0),
            )
            for bid, dealer, dealer_completed_trade_count in rows
        ]

    def get_admin_vehicle_bid_detail(self, vehicle_id: UUID) -> AdminVehicleBidDetail:
        vehicle = self.get_vehicle_by_id(vehicle_id)
        if vehicle is None:
            raise ValueError("vehicle_not_found")

        seller = self.db.scalar(select(UserORM).where(UserORM.id == vehicle.seller_id))
        highest_bid = self.get_highest_active_bid_amount(vehicle_id)
        bid_count = self.get_active_bid_count(vehicle_id)

        stmt = (
            select(BidORM, UserORM)
            .join(UserORM, UserORM.id == BidORM.dealer_id)
            .where(BidORM.vehicle_id == vehicle_id)
            .order_by(BidORM.amount.desc(), BidORM.updated_at.desc())
        )
        rows = self.db.execute(stmt).all()

        return AdminVehicleBidDetail(
            vehicle=vehicle,
            highest_bid=highest_bid,
            bid_count=bid_count,
            seller_name=seller.full_name if seller else None,
            seller_email=seller.email if seller else None,
            bids=[
                AdminVehicleBidEntry(
                    bid=bid,
                    dealer_full_name=dealer.full_name,
                    dealer_email=dealer.email,
                    dealer_phone=dealer.phone,
                    dealer_status=dealer.dealer_status.value if dealer.dealer_status else None,
                )
                for bid, dealer in rows
            ],
        )

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
