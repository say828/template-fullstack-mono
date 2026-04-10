from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

from contexts.bidding.domain.enums import ListingSort
from contexts.bidding.infrastructure.models import BidORM
from contexts.vehicles.domain.enums import TransactionType
from contexts.vehicles.infrastructure.models import VehicleORM


@dataclass
class MarketListing:
    vehicle: VehicleORM
    highest_bid: float | None
    bid_count: int
    my_bid: float | None


@dataclass
class DealerBidEntry:
    bid: BidORM
    vehicle: VehicleORM


@dataclass
class SellerVehicleDetail:
    vehicle: VehicleORM
    highest_bid: float | None
    bid_count: int


@dataclass
class SellerVehicleBidEntry:
    bid: BidORM
    dealer_full_name: str
    dealer_email: str
    dealer_country: str | None
    dealer_business_number: str | None
    dealer_status: str | None
    dealer_completed_trade_count: int


@dataclass
class AdminVehicleBidEntry:
    bid: BidORM
    dealer_full_name: str
    dealer_email: str
    dealer_phone: str | None
    dealer_status: str | None


@dataclass
class AdminVehicleBidDetail:
    vehicle: VehicleORM
    highest_bid: float | None
    bid_count: int
    seller_name: str | None
    seller_email: str | None
    bids: list[AdminVehicleBidEntry]


class BiddingRepositoryPort(Protocol):
    def list_market_listings(
        self,
        *,
        dealer_id: UUID,
        transaction_type: TransactionType | None,
        keyword: str | None,
        sort: ListingSort,
        offset: int,
        limit: int,
    ) -> list[MarketListing]: ...

    def get_vehicle_by_id(self, vehicle_id: UUID) -> VehicleORM | None: ...

    def get_bid(self, vehicle_id: UUID, dealer_id: UUID) -> BidORM | None: ...

    def get_active_bid(self, vehicle_id: UUID, dealer_id: UUID) -> BidORM | None: ...

    def get_highest_active_bid(self, vehicle_id: UUID) -> BidORM | None: ...

    def get_highest_active_bid_amount(self, vehicle_id: UUID) -> float | None: ...

    def get_active_bid_count(self, vehicle_id: UUID) -> int: ...

    def upsert_bid(
        self,
        *,
        existing: BidORM | None,
        vehicle_id: UUID,
        dealer_id: UUID,
        amount: float,
    ) -> BidORM: ...

    def cancel_bid(self, bid: BidORM) -> BidORM: ...

    def list_dealer_bids(self, dealer_id: UUID) -> list[DealerBidEntry]: ...

    def list_vehicle_active_bids(self, vehicle_id: UUID) -> list[BidORM]: ...

    def list_vehicle_bids(self, vehicle_id: UUID) -> list[SellerVehicleBidEntry]: ...

    def get_admin_vehicle_bid_detail(self, vehicle_id: UUID) -> AdminVehicleBidDetail: ...

    def commit(self) -> None: ...

    def rollback(self) -> None: ...
