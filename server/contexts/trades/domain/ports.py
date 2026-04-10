from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

from contexts.identity.infrastructure.models import UserORM
from contexts.trades.domain.enums import TradeStage
from contexts.trades.infrastructure.models import TradeDepreciationItemORM, TradeEventORM, TradeWorkflowORM
from contexts.vehicles.infrastructure.models import VehicleORM


@dataclass
class TradeDepreciationDraftItem:
    code: str
    label: str
    amount: float
    note: str | None = None


class TradeWorkflowRepositoryPort(Protocol):
    def get_user(self, user_id: UUID) -> UserORM | None: ...

    def get_vehicle(self, vehicle_id: UUID) -> VehicleORM | None: ...

    def get_workflow_by_vehicle(self, vehicle_id: UUID) -> TradeWorkflowORM | None: ...

    def create_workflow(
        self,
        *,
        vehicle_id: UUID,
        seller_id: UUID,
        dealer_id: UUID,
        base_price: float,
    ) -> TradeWorkflowORM: ...

    def update_workflow(self, workflow: TradeWorkflowORM) -> TradeWorkflowORM: ...

    def list_depreciation_items(self, workflow_id: UUID) -> list[TradeDepreciationItemORM]: ...

    def replace_depreciation_items(self, workflow_id: UUID, items: list[TradeDepreciationDraftItem]) -> list[TradeDepreciationItemORM]: ...

    def append_event(
        self,
        *,
        workflow_id: UUID,
        actor_id: UUID | None,
        actor_role: str | None,
        event_type: str,
        message: str,
        payload_json: dict | None,
    ) -> TradeEventORM: ...

    def list_events(self, workflow_id: UUID, *, limit: int = 200) -> list[TradeEventORM]: ...

    def list_workflows_by_seller(self, seller_id: UUID, *, offset: int, limit: int) -> list[TradeWorkflowORM]: ...

    def list_workflows_by_dealer(self, dealer_id: UUID, *, offset: int, limit: int) -> list[TradeWorkflowORM]: ...

    def list_workflows_for_admin(
        self,
        *,
        stage: TradeStage | None,
        offset: int,
        limit: int,
    ) -> list[TradeWorkflowORM]: ...

    def commit(self) -> None: ...

    def rollback(self) -> None: ...
