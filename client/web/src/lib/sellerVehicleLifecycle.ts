import type { SellerVehicleDetail, TradeWorkflow, Vehicle } from "./types";

export type SellerVehicleLifecycleState =
  | "BIDDING"
  | "BIDDING_CLOSED"
  | "FAILED"
  | "INSPECTION"
  | "DEPRECIATION"
  | "DELIVERY_SETTLEMENT"
  | "COMPLETED"
  | "TRADE_CANCELLED"
  | "STATUS_UNSET";

type VehicleLike = {
  status: Vehicle["status"];
  bidding_ends_at: string;
  winning_dealer_id?: string | null;
  lifecycle_state?: SellerVehicleLifecycleState;
};

export function isSellerVehicleBiddingClosed(vehicle: { bidding_ends_at: string }) {
  return new Date(vehicle.bidding_ends_at).getTime() <= Date.now();
}

export function deriveSellerVehicleLifecycleState(vehicle: VehicleLike, workflow?: TradeWorkflow | null): SellerVehicleLifecycleState {
  if (vehicle.lifecycle_state) return vehicle.lifecycle_state;
  if (workflow?.lifecycle_state) return workflow.lifecycle_state;
  if (workflow?.current_stage === "INSPECTION") return "INSPECTION";
  if (workflow?.current_stage === "DEPRECIATION") return "DEPRECIATION";
  if (workflow?.current_stage === "DELIVERY" || workflow?.current_stage === "REMITTANCE" || workflow?.current_stage === "SETTLEMENT") {
    return "DELIVERY_SETTLEMENT";
  }
  if (workflow?.current_stage === "COMPLETED") return "COMPLETED";
  if (workflow?.current_stage === "CANCELLED") return "TRADE_CANCELLED";
  if (vehicle.status === "CANCELLED") return "FAILED";
  if (vehicle.status === "SOLD") return vehicle.winning_dealer_id ? "INSPECTION" : "STATUS_UNSET";
  if (vehicle.status === "ACTIVE" && isSellerVehicleBiddingClosed(vehicle)) return "BIDDING_CLOSED";
  if (vehicle.status === "ACTIVE") return "BIDDING";
  return "STATUS_UNSET";
}

export function sellerVehicleLifecycleLabel(state: SellerVehicleLifecycleState) {
  if (state === "BIDDING") return "입찰중";
  if (state === "BIDDING_CLOSED") return "입찰 마감";
  if (state === "FAILED") return "유찰";
  if (state === "INSPECTION") return "검차";
  if (state === "DEPRECIATION") return "감가 협의";
  if (state === "DELIVERY_SETTLEMENT") return "인도/정산";
  if (state === "COMPLETED") return "거래 완료";
  if (state === "TRADE_CANCELLED") return "거래 취소";
  return "상태 없음";
}

export function isSellerWinnerSelectionState(state: SellerVehicleLifecycleState) {
  return state === "BIDDING_CLOSED";
}
