from __future__ import annotations

from contexts.trades.domain.ports import TradeWorkflowRepositoryPort
from contexts.trades.infrastructure.models import TradeWorkflowORM
from contexts.vehicles.domain.enums import VehicleStatus
from contexts.vehicles.infrastructure.models import VehicleORM
from shared.infrastructure.errors import AppError


def ensure_awarded_trade_workflow(
    repo: TradeWorkflowRepositoryPort,
    *,
    vehicle: VehicleORM,
) -> TradeWorkflowORM:
    workflow = repo.get_workflow_by_vehicle(vehicle.id)
    if workflow:
        return workflow

    if vehicle.status != VehicleStatus.SOLD:
        raise AppError("낙찰 완료 후에만 거래 워크플로우를 시작할 수 있습니다.", 409, "TRADE_NOT_READY")
    if vehicle.winning_dealer_id is None:
        raise AppError("낙찰 딜러 정보가 없어 거래를 시작할 수 없습니다.", 409, "MISSING_WINNING_DEALER")

    base_price = float(vehicle.winning_price if vehicle.winning_price is not None else vehicle.reserve_price)
    workflow = repo.create_workflow(
        vehicle_id=vehicle.id,
        seller_id=vehicle.seller_id,
        dealer_id=vehicle.winning_dealer_id,
        base_price=base_price,
    )
    repo.append_event(
        workflow_id=workflow.id,
        actor_id=None,
        actor_role=None,
        event_type="WORKFLOW_CREATED",
        message="낙찰 거래 워크플로우가 생성되었습니다.",
        payload_json={"vehicle_id": str(vehicle.id), "base_price": base_price},
    )
    return workflow
