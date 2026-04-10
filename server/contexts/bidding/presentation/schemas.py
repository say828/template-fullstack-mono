from datetime import datetime

from pydantic import BaseModel, Field

from contexts.bidding.domain.enums import BidStatus, ListingBidState
from contexts.vehicles.domain.enums import FuelType, TransactionType, TransmissionType, VehicleStatus
from shared.domain.vehicle_lifecycle import VehicleLifecycleState


class PlaceBidRequest(BaseModel):
    amount: float = Field(gt=0)


class BidResponse(BaseModel):
    id: str
    vehicle_id: str
    dealer_id: str
    amount: float
    status: BidStatus
    created_at: datetime
    updated_at: datetime


class MarketListingResponse(BaseModel):
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
    bidding_ends_at: datetime
    bidding_state: ListingBidState
    time_left_seconds: int
    highest_bid: float | None
    bid_count: int
    my_bid: float | None


class DealerBidResponse(BaseModel):
    bid_id: str
    vehicle_id: str
    title: str
    make: str
    model: str
    amount: float
    status: BidStatus
    reserve_price: float
    min_bid_increment: float
    options: list[str] = Field(default_factory=list)
    photo_names: list[str] = Field(default_factory=list)
    photo_urls: list[str] = Field(default_factory=list)
    transmission: TransmissionType | None = None
    currency: str
    highest_bid: float | None
    bidding_ends_at: datetime
    bidding_state: ListingBidState
    time_left_seconds: int
    is_winning: bool
    created_at: datetime
    updated_at: datetime


class SellerVehicleDetailResponse(BaseModel):
    id: str
    seller_id: str
    title: str
    make: str
    model: str
    year: int
    mileage_km: int
    license_plate: str | None
    fuel_type: FuelType
    transaction_type: TransactionType
    reserve_price: float
    min_bid_increment: float
    options: list[str] = Field(default_factory=list)
    photo_names: list[str] = Field(default_factory=list)
    photo_urls: list[str] = Field(default_factory=list)
    transmission: TransmissionType | None = None
    currency: str
    status: VehicleStatus
    lifecycle_state: VehicleLifecycleState
    bidding_started_at: datetime
    bidding_ends_at: datetime
    bidding_state: ListingBidState
    time_left_seconds: int
    highest_bid: float | None
    bid_count: int
    winning_dealer_id: str | None
    winning_price: float | None
    created_at: datetime


class SellerVehicleBidResponse(BaseModel):
    id: str
    vehicle_id: str
    dealer_id: str
    dealer_name: str
    dealer_email: str
    dealer_country: str | None = None
    dealer_business_number: str | None = None
    dealer_status: str | None = None
    dealer_completed_trade_count: int = 0
    amount: float
    status: BidStatus
    created_at: datetime
    updated_at: datetime


class AdminDealerBidHistoryResponse(BaseModel):
    bid_id: str
    vehicle_id: str
    vehicle_title: str
    amount: float
    status: BidStatus
    highest_bid: float | None
    bidding_ends_at: datetime
    bidding_state: ListingBidState
    time_left_seconds: int
    updated_at: datetime


class AdminVehicleBidEntryResponse(BaseModel):
    bid_id: str
    dealer_id: str
    dealer_name: str
    dealer_email: str
    dealer_phone: str | None
    dealer_status: str | None
    amount: float
    status: BidStatus
    is_highest_active: bool
    is_winning_bid: bool
    created_at: datetime
    updated_at: datetime


class AdminVehicleBidDetailResponse(BaseModel):
    vehicle_id: str
    vehicle_title: str
    seller_id: str
    seller_name: str | None
    seller_email: str | None
    status: VehicleStatus
    lifecycle_state: VehicleLifecycleState
    transaction_type: TransactionType
    reserve_price: float
    min_bid_increment: float
    options: list[str] = Field(default_factory=list)
    currency: str
    bidding_ends_at: datetime
    sold_at: datetime | None
    winning_dealer_id: str | None
    winning_price: float | None
    highest_bid: float | None
    bid_count: int
    bids: list[AdminVehicleBidEntryResponse]


class CloseBiddingRequest(BaseModel):
    force_close: bool = False
    winning_bid_id: str | None = None


class CloseBiddingResponse(BaseModel):
    vehicle_id: str
    status: VehicleStatus
    lifecycle_state: VehicleLifecycleState
    message: str
    winning_bid_id: str | None
    winning_dealer_id: str | None
    winning_price: float | None
    sold_at: datetime | None
