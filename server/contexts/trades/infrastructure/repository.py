from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from contexts.identity.domain.enums import UserRole
from contexts.identity.infrastructure.models import UserORM
from contexts.trades.domain.enums import (
    DeliveryStatus,
    DepreciationStatus,
    InspectionStatus,
    RemittanceStatus,
    SettlementStatus,
    TradeStage,
)
from contexts.trades.domain.ports import TradeDepreciationDraftItem, TradeWorkflowRepositoryPort
from contexts.trades.infrastructure.models import TradeDepreciationItemORM, TradeEventORM, TradeWorkflowORM
from contexts.vehicles.infrastructure.models import VehicleORM


class SqlAlchemyTradeWorkflowRepository(TradeWorkflowRepositoryPort):
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_user(self, user_id: UUID) -> UserORM | None:
        stmt = select(UserORM).where(UserORM.id == user_id)
        return self.db.scalar(stmt)

    def get_vehicle(self, vehicle_id: UUID) -> VehicleORM | None:
        stmt = select(VehicleORM).where(VehicleORM.id == vehicle_id)
        return self.db.scalar(stmt)

    def get_workflow_by_vehicle(self, vehicle_id: UUID) -> TradeWorkflowORM | None:
        stmt = select(TradeWorkflowORM).where(TradeWorkflowORM.vehicle_id == vehicle_id)
        return self.db.scalar(stmt)

    def create_workflow(
        self,
        *,
        vehicle_id: UUID,
        seller_id: UUID,
        dealer_id: UUID,
        base_price: float,
    ) -> TradeWorkflowORM:
        default_schedule = datetime.now(timezone.utc) + timedelta(days=3)
        row = TradeWorkflowORM(
            vehicle_id=vehicle_id,
            seller_id=seller_id,
            dealer_id=dealer_id,
            current_stage=TradeStage.INSPECTION,
            inspection_status=InspectionStatus.PROPOSED,
            depreciation_status=DepreciationStatus.PROPOSAL_REQUIRED,
            delivery_status=DeliveryStatus.WAITING_SCHEDULE,
            remittance_status=RemittanceStatus.WAITING,
            settlement_status=SettlementStatus.WAITING,
            base_price=base_price,
            inspection_scheduled_at=default_schedule,
            inspection_location="Template 검차센터(서울 성수)",
            inspection_assignee="DEV 평가사",
            inspection_contact="02-0000-0000",
        )
        self.db.add(row)
        self.db.flush()
        return row

    def update_workflow(self, workflow: TradeWorkflowORM) -> TradeWorkflowORM:
        self.db.add(workflow)
        self.db.flush()
        return workflow

    def list_depreciation_items(self, workflow_id: UUID) -> list[TradeDepreciationItemORM]:
        stmt = (
            select(TradeDepreciationItemORM)
            .where(TradeDepreciationItemORM.workflow_id == workflow_id)
            .order_by(TradeDepreciationItemORM.created_at.asc(), TradeDepreciationItemORM.id.asc())
        )
        return list(self.db.scalars(stmt).all())

    def replace_depreciation_items(self, workflow_id: UUID, items: list[TradeDepreciationDraftItem]) -> list[TradeDepreciationItemORM]:
        self.db.execute(delete(TradeDepreciationItemORM).where(TradeDepreciationItemORM.workflow_id == workflow_id))
        created: list[TradeDepreciationItemORM] = []
        for item in items:
            row = TradeDepreciationItemORM(
                workflow_id=workflow_id,
                code=item.code.strip(),
                label=item.label.strip(),
                amount=item.amount,
                note=item.note.strip() if item.note else None,
            )
            self.db.add(row)
            created.append(row)
        self.db.flush()
        return created

    def append_event(
        self,
        *,
        workflow_id: UUID,
        actor_id: UUID | None,
        actor_role: str | None,
        event_type: str,
        message: str,
        payload_json: dict | None,
    ) -> TradeEventORM:
        role = UserRole(actor_role) if actor_role else None
        row = TradeEventORM(
            workflow_id=workflow_id,
            actor_id=actor_id,
            actor_role=role,
            event_type=event_type.strip()[:80],
            message=message.strip()[:255],
            payload_json=payload_json,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def list_events(self, workflow_id: UUID, *, limit: int = 200) -> list[TradeEventORM]:
        stmt = (
            select(TradeEventORM)
            .where(TradeEventORM.workflow_id == workflow_id)
            .order_by(TradeEventORM.created_at.asc(), TradeEventORM.id.asc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def list_workflows_by_seller(self, seller_id: UUID, *, offset: int, limit: int) -> list[TradeWorkflowORM]:
        stmt = (
            select(TradeWorkflowORM)
            .where(TradeWorkflowORM.seller_id == seller_id)
            .order_by(TradeWorkflowORM.updated_at.desc(), TradeWorkflowORM.id.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def list_workflows_by_dealer(self, dealer_id: UUID, *, offset: int, limit: int) -> list[TradeWorkflowORM]:
        stmt = (
            select(TradeWorkflowORM)
            .where(TradeWorkflowORM.dealer_id == dealer_id)
            .order_by(TradeWorkflowORM.updated_at.desc(), TradeWorkflowORM.id.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def list_workflows_for_admin(
        self,
        *,
        stage: TradeStage | None,
        offset: int,
        limit: int,
    ) -> list[TradeWorkflowORM]:
        stmt = select(TradeWorkflowORM)
        if stage:
            stmt = stmt.where(TradeWorkflowORM.current_stage == stage)
        stmt = stmt.order_by(TradeWorkflowORM.updated_at.desc(), TradeWorkflowORM.id.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).all())

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
