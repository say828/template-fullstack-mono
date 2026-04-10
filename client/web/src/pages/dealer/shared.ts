import type { DealerBid, MarketListing, TradeWorkflow } from "../../lib/types";

const now = Date.now();

function plusDays(days: number) {
  return new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
}

function plusHours(hours: number) {
  return new Date(now + hours * 60 * 60 * 1000).toISOString();
}

export const fallbackMarketListings: MarketListing[] = [
  {
    id: "veh-dl-001",
    seller_id: "seller-001",
    title: "쏘나타 DN8 2.0 모던",
    make: "현대",
    model: "쏘나타 DN8",
    year: 2021,
    mileage_km: 43000,
    license_plate: "123가 4567",
    fuel_type: "GASOLINE",
    transaction_type: "DOMESTIC",
    reserve_price: 17000000,
    min_bid_increment: 100000,
    currency: "KRW",
    status: "ACTIVE",
    bidding_ends_at: plusDays(6),
    winning_dealer_id: null,
    winning_price: null,
    created_at: plusDays(-1),
    bidding_state: "OPEN",
    time_left_seconds: 6 * 24 * 60 * 60,
    highest_bid: 18500000,
    bid_count: 7,
    my_bid: 18000000,
  },
  {
    id: "veh-dl-002",
    seller_id: "seller-002",
    title: "BMW 520d M Sport",
    make: "BMW",
    model: "520d",
    year: 2019,
    mileage_km: 82000,
    license_plate: "98나 2211",
    fuel_type: "DIESEL",
    transaction_type: "EXPORT",
    reserve_price: 30000000,
    min_bid_increment: 100000,
    currency: "KRW",
    status: "ACTIVE",
    bidding_ends_at: plusHours(10),
    winning_dealer_id: null,
    winning_price: null,
    created_at: plusDays(-2),
    bidding_state: "CLOSING_SOON",
    time_left_seconds: 10 * 60 * 60,
    highest_bid: 32000000,
    bid_count: 12,
    my_bid: 31500000,
  },
  {
    id: "veh-dl-003",
    seller_id: "seller-003",
    title: "카니발 4세대 9인승 시그니처",
    make: "기아",
    model: "카니발",
    year: 2022,
    mileage_km: 15000,
    license_plate: "12더 9087",
    fuel_type: "DIESEL",
    transaction_type: "DOMESTIC",
    reserve_price: 25000000,
    min_bid_increment: 100000,
    currency: "KRW",
    status: "ACTIVE",
    bidding_ends_at: plusDays(5),
    winning_dealer_id: null,
    winning_price: null,
    created_at: plusDays(-3),
    bidding_state: "OPEN",
    time_left_seconds: 5 * 24 * 60 * 60,
    highest_bid: 27800000,
    bid_count: 2,
    my_bid: null,
  },
];

export const fallbackDealerBids: DealerBid[] = [
  {
    bid_id: "bid-001",
    vehicle_id: "veh-dl-001",
    title: "쏘나타 DN8 2.0 모던",
    make: "현대",
    model: "쏘나타 DN8",
    amount: 18000000,
    status: "ACTIVE",
    reserve_price: 17000000,
    min_bid_increment: 100000,
    currency: "KRW",
    highest_bid: 18500000,
    bidding_ends_at: plusDays(6),
    bidding_state: "OPEN",
    time_left_seconds: 6 * 24 * 60 * 60,
    is_winning: false,
    created_at: plusDays(-1),
    updated_at: plusDays(-1),
  },
  {
    bid_id: "bid-002",
    vehicle_id: "veh-dl-002",
    title: "BMW 520d M Sport",
    make: "BMW",
    model: "520d",
    amount: 32600000,
    status: "WON",
    reserve_price: 30000000,
    min_bid_increment: 100000,
    currency: "KRW",
    highest_bid: 32600000,
    bidding_ends_at: plusDays(-3),
    bidding_state: "CLOSED",
    time_left_seconds: 0,
    is_winning: true,
    created_at: plusDays(-7),
    updated_at: plusDays(-3),
  },
  {
    bid_id: "bid-003",
    vehicle_id: "veh-dl-003",
    title: "카니발 4세대 9인승 시그니처",
    make: "기아",
    model: "카니발",
    amount: 26700000,
    status: "LOST",
    reserve_price: 25000000,
    min_bid_increment: 100000,
    currency: "KRW",
    highest_bid: 27800000,
    bidding_ends_at: plusDays(-1),
    bidding_state: "CLOSED",
    time_left_seconds: 0,
    is_winning: false,
    created_at: plusDays(-5),
    updated_at: plusDays(-1),
  },
  {
    bid_id: "bid-004",
    vehicle_id: "veh-dl-004",
    title: "제네시스 G80 2.5T AWD",
    make: "제네시스",
    model: "G80",
    amount: 54200000,
    status: "CANCELLED",
    reserve_price: 50000000,
    min_bid_increment: 100000,
    currency: "KRW",
    highest_bid: 54800000,
    bidding_ends_at: plusDays(2),
    bidding_state: "OPEN",
    time_left_seconds: 2 * 24 * 60 * 60,
    is_winning: false,
    created_at: plusDays(-2),
    updated_at: plusDays(-1),
  },
  {
    bid_id: "bid-005",
    vehicle_id: "veh-dl-005",
    title: "K5 DL3 1.6 터보",
    make: "기아",
    model: "K5",
    amount: 22900000,
    status: "ACTIVE",
    reserve_price: 21000000,
    min_bid_increment: 100000,
    currency: "KRW",
    highest_bid: 22900000,
    bidding_ends_at: plusHours(1),
    bidding_state: "CLOSED",
    time_left_seconds: 0,
    is_winning: true,
    created_at: plusDays(-4),
    updated_at: plusHours(-2),
  },
];

export type DealerBidDetailState = "open" | "closed" | "lost" | "won" | "cancelled";

export type DealerTransactionStage =
  | "inspection"
  | "inspection-confirmed"
  | "depreciation-waiting"
  | "depreciation-submitted"
  | "depreciation-renegotiation"
  | "delivery"
  | "remittance"
  | "completed";

export function toDealerBidDetailState(row: DealerBid): DealerBidDetailState {
  if (row.status === "WON") return "won";
  if (row.status === "LOST") return "lost";
  if (row.status === "CANCELLED") return "cancelled";
  if (row.bidding_state === "CLOSED") return "closed";
  return "open";
}

export function workflowToDealerTransactionStage(workflow: TradeWorkflow): DealerTransactionStage {
  if (workflow.current_stage === "COMPLETED") return "completed";
  if (workflow.current_stage === "SETTLEMENT" || workflow.current_stage === "REMITTANCE") return "remittance";
  if (workflow.current_stage === "DELIVERY") return "delivery";

  if (workflow.current_stage === "DEPRECIATION") {
    if (workflow.depreciation_status === "RENEGOTIATION_REQUESTED") return "depreciation-renegotiation";
    if (workflow.depreciation_status === "SELLER_REVIEW") return "depreciation-submitted";
    return "depreciation-waiting";
  }

  if (workflow.current_stage === "INSPECTION") {
    if (workflow.inspection_status === "CONFIRMED" || workflow.inspection_status === "COMPLETED") {
      return "inspection-confirmed";
    }
    return "inspection";
  }

  if (workflow.depreciation_status === "AGREED") return "delivery";
  return "inspection";
}

export function currencyText(value: number, currency = "KRW") {
  if (currency === "KRW") return `${value.toLocaleString()}원`;
  return `${value.toLocaleString()} ${currency}`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function finalTradeAmount(workflow: TradeWorkflow) {
  if (workflow.agreed_price != null) return workflow.agreed_price;
  const depreciationTotal = workflow.depreciation_total ?? workflow.depreciation_items.reduce((sum, item) => sum + item.amount, 0);
  return Math.max(0, workflow.base_price - depreciationTotal);
}

export function transactionTypeText(type: "DOMESTIC" | "EXPORT") {
  return type === "DOMESTIC" ? "국내 거래" : "수출 가능";
}

export function fuelTypeText(type: MarketListing["fuel_type"]) {
  if (type === "GASOLINE") return "가솔린";
  if (type === "DIESEL") return "디젤";
  if (type === "HYBRID") return "하이브리드";
  return "전기";
}

export function biddingStateText(state: MarketListing["bidding_state"]) {
  if (state === "OPEN") return "입찰 중";
  if (state === "CLOSING_SOON") return "입찰 마감 임박";
  return "입찰 마감";
}

export function daysLeftLabel(seconds: number) {
  if (seconds <= 0) return "마감";
  const days = Math.floor(seconds / (24 * 60 * 60));
  if (days <= 0) return "오늘 마감";
  return `${days}일 남음`;
}

export function findFallbackVehicle(vehicleId: string | undefined): MarketListing {
  if (vehicleId) {
    const fromMarket = fallbackMarketListings.find((row) => row.id === vehicleId);
    if (fromMarket) return fromMarket;

    const fromBid = fallbackDealerBids.find((row) => row.vehicle_id === vehicleId);
    if (fromBid) {
      return {
        id: fromBid.vehicle_id,
        seller_id: "seller-fallback",
        title: fromBid.title,
        make: fromBid.make,
        model: fromBid.model,
        year: 2021,
        mileage_km: 45000,
        license_plate: "00가 0000",
        fuel_type: "GASOLINE",
        transaction_type: "DOMESTIC",
        reserve_price: fromBid.reserve_price,
        min_bid_increment: 100000,
        currency: fromBid.currency,
        status: "ACTIVE",
        bidding_ends_at: fromBid.bidding_ends_at,
        winning_dealer_id: null,
        winning_price: null,
        created_at: plusDays(-7),
        bidding_state: fromBid.bidding_state,
        time_left_seconds: fromBid.time_left_seconds,
        highest_bid: fromBid.highest_bid,
        bid_count: 4,
        my_bid: fromBid.amount,
      };
    }
  }

  return fallbackMarketListings[0];
}

export const dealerStatusTabs: Array<{ key: "ALL" | "ACTIVE" | "CLOSED" | "WON" | "LOST" | "CANCELLED"; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "ACTIVE", label: "입찰중" },
  { key: "CLOSED", label: "마감" },
  { key: "WON", label: "낙찰" },
  { key: "LOST", label: "미낙찰" },
  { key: "CANCELLED", label: "취소됨" },
];
