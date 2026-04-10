from datetime import datetime, timedelta, timezone

import pytest

from contexts.trades.domain.enums import TradeStage
from contexts.vehicles.domain.enums import VehicleStatus
from shared.domain.vehicle_lifecycle import (
    VehicleLifecycleEvent,
    VehicleLifecycleState,
    assert_trade_stage_transition,
    lifecycle_from_snapshot,
    transition_vehicle_lifecycle,
)


def test_lifecycle_snapshot_maps_vehicle_and_trade_states_consistently() -> None:
    now = datetime.now(timezone.utc)

    assert lifecycle_from_snapshot(
        vehicle_status=VehicleStatus.ACTIVE,
        bidding_ends_at=now + timedelta(hours=2),
        workflow_stage=None,
        has_winning_dealer=False,
        now=now,
    ) == VehicleLifecycleState.BIDDING
    assert lifecycle_from_snapshot(
        vehicle_status=VehicleStatus.ACTIVE,
        bidding_ends_at=now - timedelta(minutes=1),
        workflow_stage=None,
        has_winning_dealer=False,
        now=now,
    ) == VehicleLifecycleState.BIDDING_CLOSED
    assert lifecycle_from_snapshot(
        vehicle_status=VehicleStatus.CANCELLED,
        bidding_ends_at=now - timedelta(minutes=1),
        workflow_stage=None,
        has_winning_dealer=False,
        now=now,
    ) == VehicleLifecycleState.FAILED
    assert lifecycle_from_snapshot(
        vehicle_status=VehicleStatus.SOLD,
        bidding_ends_at=now - timedelta(minutes=1),
        workflow_stage=TradeStage.DEPRECIATION,
        has_winning_dealer=True,
        now=now,
    ) == VehicleLifecycleState.DEPRECIATION


def test_vehicle_lifecycle_transition_table_matches_expected_flow() -> None:
    assert transition_vehicle_lifecycle(VehicleLifecycleState.BIDDING, VehicleLifecycleEvent.BIDDING_WINDOW_CLOSED) == VehicleLifecycleState.BIDDING_CLOSED
    assert transition_vehicle_lifecycle(VehicleLifecycleState.BIDDING_CLOSED, VehicleLifecycleEvent.WINNER_CONFIRMED) == VehicleLifecycleState.INSPECTION
    assert transition_vehicle_lifecycle(VehicleLifecycleState.INSPECTION, VehicleLifecycleEvent.INSPECTION_COMPLETED) == VehicleLifecycleState.DEPRECIATION
    assert transition_vehicle_lifecycle(VehicleLifecycleState.DEPRECIATION, VehicleLifecycleEvent.DEPRECIATION_APPROVED) == VehicleLifecycleState.DELIVERY_SETTLEMENT
    assert transition_vehicle_lifecycle(VehicleLifecycleState.DELIVERY_SETTLEMENT, VehicleLifecycleEvent.SETTLEMENT_COMPLETED) == VehicleLifecycleState.COMPLETED


def test_trade_stage_transition_table_rejects_invalid_jump() -> None:
    assert_trade_stage_transition(TradeStage.INSPECTION, TradeStage.DEPRECIATION)

    with pytest.raises(ValueError):
        assert_trade_stage_transition(TradeStage.INSPECTION, TradeStage.SETTLEMENT)
