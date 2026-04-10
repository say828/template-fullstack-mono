from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from contexts.identity.infrastructure.models import UserORM
from contexts.settlement.domain.ports import SettlementRepositoryPort
from contexts.settlement.infrastructure.models import SettlementAccountORM
from contexts.trades.infrastructure.models import TradeWorkflowORM
from contexts.vehicles.domain.enums import VehicleStatus
from contexts.vehicles.infrastructure.models import VehicleORM


class SqlAlchemySettlementRepository(SettlementRepositoryPort):
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_user(self, user_id: UUID) -> UserORM | None:
        stmt = select(UserORM).where(UserORM.id == user_id)
        return self.db.scalar(stmt)

    def list_accounts(self, user_id: UUID) -> list[SettlementAccountORM]:
        stmt = (
            select(SettlementAccountORM)
            .where(SettlementAccountORM.user_id == user_id)
            .order_by(SettlementAccountORM.is_primary.desc(), SettlementAccountORM.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def get_account(self, account_id: UUID) -> SettlementAccountORM | None:
        stmt = select(SettlementAccountORM).where(SettlementAccountORM.id == account_id)
        return self.db.scalar(stmt)

    def create_account(
        self,
        *,
        user_id: UUID,
        bank_name: str,
        account_number: str,
        account_holder: str,
        is_primary: bool,
    ) -> SettlementAccountORM:
        row = SettlementAccountORM(
            user_id=user_id,
            bank_name=bank_name.strip(),
            account_number=account_number.strip(),
            account_holder=account_holder.strip(),
            is_primary=is_primary,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def update_account(self, account: SettlementAccountORM) -> SettlementAccountORM:
        self.db.add(account)
        self.db.flush()
        return account

    def unset_primary_accounts(self, user_id: UUID) -> None:
        stmt = update(SettlementAccountORM).where(SettlementAccountORM.user_id == user_id).values(is_primary=False)
        self.db.execute(stmt)

    def list_seller_sold_vehicles(self, user_id: UUID) -> list[VehicleORM]:
        stmt = (
            select(VehicleORM)
            .where(VehicleORM.seller_id == user_id, VehicleORM.status == VehicleStatus.SOLD)
            .order_by(VehicleORM.sold_at.desc(), VehicleORM.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def list_all_sold_vehicles(self) -> list[VehicleORM]:
        stmt = (
            select(VehicleORM)
            .where(VehicleORM.status == VehicleStatus.SOLD)
            .order_by(VehicleORM.sold_at.desc(), VehicleORM.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def get_user_map(self, user_ids: list[UUID]) -> dict[UUID, UserORM]:
        if not user_ids:
            return {}
        stmt = select(UserORM).where(UserORM.id.in_(user_ids))
        rows = list(self.db.scalars(stmt).all())
        return {row.id: row for row in rows}

    def get_trade_workflow_map(self, vehicle_ids: list[UUID]) -> dict[UUID, TradeWorkflowORM]:
        if not vehicle_ids:
            return {}
        stmt = select(TradeWorkflowORM).where(TradeWorkflowORM.vehicle_id.in_(vehicle_ids))
        rows = list(self.db.scalars(stmt).all())
        return {row.vehicle_id: row for row in rows}

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
