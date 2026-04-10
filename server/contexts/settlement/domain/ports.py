from typing import Protocol
from uuid import UUID

from contexts.identity.infrastructure.models import UserORM
from contexts.settlement.infrastructure.models import SettlementAccountORM
from contexts.trades.infrastructure.models import TradeWorkflowORM
from contexts.vehicles.infrastructure.models import VehicleORM


class SettlementRepositoryPort(Protocol):
    def get_user(self, user_id: UUID) -> UserORM | None: ...

    def list_accounts(self, user_id: UUID) -> list[SettlementAccountORM]: ...

    def get_account(self, account_id: UUID) -> SettlementAccountORM | None: ...

    def create_account(
        self,
        *,
        user_id: UUID,
        bank_name: str,
        account_number: str,
        account_holder: str,
        is_primary: bool,
    ) -> SettlementAccountORM: ...

    def update_account(self, account: SettlementAccountORM) -> SettlementAccountORM: ...

    def unset_primary_accounts(self, user_id: UUID) -> None: ...

    def list_seller_sold_vehicles(self, user_id: UUID) -> list[VehicleORM]: ...

    def list_all_sold_vehicles(self) -> list[VehicleORM]: ...

    def get_user_map(self, user_ids: list[UUID]) -> dict[UUID, UserORM]: ...

    def get_trade_workflow_map(self, vehicle_ids: list[UUID]) -> dict[UUID, TradeWorkflowORM]: ...

    def commit(self) -> None: ...

    def rollback(self) -> None: ...
