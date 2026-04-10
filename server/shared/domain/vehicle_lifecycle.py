from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from contexts.trades.domain.enums import TradeStage
from contexts.vehicles.domain.enums import VehicleStatus


class VehicleLifecycleState(str, Enum):
    BIDDING = "BIDDING"
    BIDDING_CLOSED = "BIDDING_CLOSED"
    FAILED = "FAILED"
    INSPECTION = "INSPECTION"
    DEPRECIATION = "DEPRECIATION"
    DELIVERY_SETTLEMENT = "DELIVERY_SETTLEMENT"
    COMPLETED = "COMPLETED"
    TRADE_CANCELLED = "TRADE_CANCELLED"
    STATUS_UNSET = "STATUS_UNSET"


class VehicleLifecycleEvent(str, Enum):
    BIDDING_WINDOW_CLOSED = "BIDDING_WINDOW_CLOSED"
    BIDDING_FAILED = "BIDDING_FAILED"
    WINNER_CONFIRMED = "WINNER_CONFIRMED"
    INSPECTION_COMPLETED = "INSPECTION_COMPLETED"
    DEPRECIATION_APPROVED = "DEPRECIATION_APPROVED"
    SETTLEMENT_COMPLETED = "SETTLEMENT_COMPLETED"
    TRADE_FORCE_CANCELLED = "TRADE_FORCE_CANCELLED"


_LIFECYCLE_TRANSITIONS: dict[VehicleLifecycleState, dict[VehicleLifecycleEvent, VehicleLifecycleState]] = {
    VehicleLifecycleState.BIDDING: {
        VehicleLifecycleEvent.BIDDING_WINDOW_CLOSED: VehicleLifecycleState.BIDDING_CLOSED,
        VehicleLifecycleEvent.BIDDING_FAILED: VehicleLifecycleState.FAILED,
        VehicleLifecycleEvent.WINNER_CONFIRMED: VehicleLifecycleState.INSPECTION,
    },
    VehicleLifecycleState.BIDDING_CLOSED: {
        VehicleLifecycleEvent.BIDDING_FAILED: VehicleLifecycleState.FAILED,
        VehicleLifecycleEvent.WINNER_CONFIRMED: VehicleLifecycleState.INSPECTION,
    },
    VehicleLifecycleState.INSPECTION: {
        VehicleLifecycleEvent.INSPECTION_COMPLETED: VehicleLifecycleState.DEPRECIATION,
        VehicleLifecycleEvent.TRADE_FORCE_CANCELLED: VehicleLifecycleState.TRADE_CANCELLED,
    },
    VehicleLifecycleState.DEPRECIATION: {
        VehicleLifecycleEvent.DEPRECIATION_APPROVED: VehicleLifecycleState.DELIVERY_SETTLEMENT,
        VehicleLifecycleEvent.TRADE_FORCE_CANCELLED: VehicleLifecycleState.TRADE_CANCELLED,
    },
    VehicleLifecycleState.DELIVERY_SETTLEMENT: {
        VehicleLifecycleEvent.SETTLEMENT_COMPLETED: VehicleLifecycleState.COMPLETED,
        VehicleLifecycleEvent.TRADE_FORCE_CANCELLED: VehicleLifecycleState.TRADE_CANCELLED,
    },
}

_TRADE_STAGE_TRANSITIONS: dict[TradeStage, set[TradeStage]] = {
    TradeStage.INSPECTION: {TradeStage.INSPECTION, TradeStage.DEPRECIATION, TradeStage.CANCELLED},
    TradeStage.DEPRECIATION: {TradeStage.DEPRECIATION, TradeStage.DELIVERY, TradeStage.CANCELLED},
    TradeStage.DELIVERY: {TradeStage.DELIVERY, TradeStage.REMITTANCE, TradeStage.CANCELLED},
    TradeStage.REMITTANCE: {TradeStage.REMITTANCE, TradeStage.SETTLEMENT, TradeStage.CANCELLED},
    TradeStage.SETTLEMENT: {TradeStage.SETTLEMENT, TradeStage.COMPLETED, TradeStage.CANCELLED},
    TradeStage.COMPLETED: {TradeStage.COMPLETED},
    TradeStage.CANCELLED: {TradeStage.CANCELLED},
}


def as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def is_bidding_closed(bidding_ends_at: datetime, *, now: datetime | None = None) -> bool:
    reference = now or datetime.now(timezone.utc)
    return as_utc(bidding_ends_at) <= reference


def lifecycle_from_snapshot(
    *,
    vehicle_status: VehicleStatus,
    bidding_ends_at: datetime,
    workflow_stage: TradeStage | None,
    has_winning_dealer: bool,
    now: datetime | None = None,
) -> VehicleLifecycleState:
    if workflow_stage == TradeStage.INSPECTION:
        return VehicleLifecycleState.INSPECTION
    if workflow_stage == TradeStage.DEPRECIATION:
        return VehicleLifecycleState.DEPRECIATION
    if workflow_stage in (TradeStage.DELIVERY, TradeStage.REMITTANCE, TradeStage.SETTLEMENT):
        return VehicleLifecycleState.DELIVERY_SETTLEMENT
    if workflow_stage == TradeStage.COMPLETED:
        return VehicleLifecycleState.COMPLETED
    if workflow_stage == TradeStage.CANCELLED:
        return VehicleLifecycleState.TRADE_CANCELLED

    if vehicle_status == VehicleStatus.CANCELLED:
        return VehicleLifecycleState.FAILED
    if vehicle_status == VehicleStatus.SOLD:
        return VehicleLifecycleState.INSPECTION if has_winning_dealer else VehicleLifecycleState.STATUS_UNSET
    if vehicle_status == VehicleStatus.ACTIVE:
        return VehicleLifecycleState.BIDDING_CLOSED if is_bidding_closed(bidding_ends_at, now=now) else VehicleLifecycleState.BIDDING
    return VehicleLifecycleState.STATUS_UNSET


def transition_vehicle_lifecycle(
    current_state: VehicleLifecycleState,
    event: VehicleLifecycleEvent,
) -> VehicleLifecycleState:
    next_state = _LIFECYCLE_TRANSITIONS.get(current_state, {}).get(event)
    if next_state is None:
        raise ValueError(f"invalid lifecycle transition: {current_state.value} -> {event.value}")
    return next_state


def assert_trade_stage_transition(current_stage: TradeStage, next_stage: TradeStage) -> None:
    allowed = _TRADE_STAGE_TRANSITIONS[current_stage]
    if next_stage not in allowed:
        raise ValueError(f"invalid trade stage transition: {current_stage.value} -> {next_stage.value}")
