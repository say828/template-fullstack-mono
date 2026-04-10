from dataclasses import dataclass
from datetime import datetime, timedelta
from uuid import UUID

from contexts.identity.domain.enums import UserRole
from contexts.identity.infrastructure.models import UserORM
from contexts.settlement.domain.enums import SettlementRecordStatus
from contexts.settlement.domain.ports import SettlementRepositoryPort
from contexts.settlement.infrastructure.models import SettlementAccountORM
from contexts.trades.domain.enums import SettlementStatus, TradeStage
from contexts.trades.infrastructure.models import TradeWorkflowORM
from contexts.vehicles.infrastructure.models import VehicleORM
from shared.infrastructure.errors import AppError

SETTLEMENT_LEAD_DAYS = 3


@dataclass
class SettlementRecordItem:
    vehicle: VehicleORM
    status: SettlementRecordStatus
    settlement_due_at: datetime


@dataclass
class AdminSettlementRecordItem:
    vehicle: VehicleORM
    seller: UserORM | None
    status: SettlementRecordStatus
    settlement_due_at: datetime


class SettlementService:
    def __init__(self, repo: SettlementRepositoryPort) -> None:
        self.repo = repo

    def _get_user(self, user_id: UUID) -> UserORM:
        user = self.repo.get_user(user_id)
        if not user:
            raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")
        return user

    def _record_from_vehicle(self, vehicle: VehicleORM, workflow: TradeWorkflowORM | None = None) -> SettlementRecordItem:
        sold_at = vehicle.sold_at or vehicle.created_at
        due_at = sold_at + timedelta(days=SETTLEMENT_LEAD_DAYS)

        if workflow and workflow.current_stage == TradeStage.COMPLETED and workflow.settlement_status == SettlementStatus.COMPLETED:
            status = SettlementRecordStatus.COMPLETED
            if workflow.settlement_completed_at:
                due_at = workflow.settlement_completed_at
        else:
            status = SettlementRecordStatus.PENDING
        return SettlementRecordItem(vehicle=vehicle, status=status, settlement_due_at=due_at)

    def list_accounts(self, *, actor: UserORM) -> list[SettlementAccountORM]:
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 정산계좌를 조회할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        return self.repo.list_accounts(actor.id)

    def create_account(
        self,
        *,
        actor: UserORM,
        bank_name: str,
        account_number: str,
        account_holder: str,
        is_primary: bool,
    ) -> SettlementAccountORM:
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 정산계좌를 등록할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        if len(bank_name.strip()) < 2:
            raise AppError("은행명을 2자 이상 입력해 주세요.", 400, "INVALID_BANK_NAME")
        if len(account_number.strip()) < 6:
            raise AppError("계좌번호를 확인해 주세요.", 400, "INVALID_ACCOUNT_NUMBER")
        if len(account_holder.strip()) < 2:
            raise AppError("예금주명을 2자 이상 입력해 주세요.", 400, "INVALID_ACCOUNT_HOLDER")

        existing = self.repo.list_accounts(actor.id)
        if not existing:
            is_primary = True
        if is_primary:
            self.repo.unset_primary_accounts(actor.id)

        row = self.repo.create_account(
            user_id=actor.id,
            bank_name=bank_name,
            account_number=account_number,
            account_holder=account_holder,
            is_primary=is_primary,
        )
        self.repo.commit()
        return row

    def update_account(
        self,
        *,
        actor: UserORM,
        account_id: UUID,
        bank_name: str,
        account_number: str,
        account_holder: str,
        is_primary: bool,
    ) -> SettlementAccountORM:
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 정산계좌를 수정할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        account = self.repo.get_account(account_id)
        if not account or account.user_id != actor.id:
            raise AppError("정산계좌를 찾을 수 없습니다.", 404, "SETTLEMENT_ACCOUNT_NOT_FOUND")

        account.bank_name = bank_name.strip()
        account.account_number = account_number.strip()
        account.account_holder = account_holder.strip()

        if is_primary:
            self.repo.unset_primary_accounts(actor.id)
            account.is_primary = True
        else:
            account.is_primary = account.is_primary and True

        updated = self.repo.update_account(account)
        self.repo.commit()
        return updated

    def list_my_records(self, *, actor: UserORM) -> list[SettlementRecordItem]:
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 정산 내역을 조회할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        vehicles = self.repo.list_seller_sold_vehicles(actor.id)
        workflow_map = self.repo.get_trade_workflow_map([row.id for row in vehicles])
        return [self._record_from_vehicle(vehicle, workflow_map.get(vehicle.id)) for vehicle in vehicles]

    def list_admin_records(self, *, actor: UserORM) -> list[AdminSettlementRecordItem]:
        if actor.role != UserRole.ADMIN:
            raise AppError("관리자만 정산 관리 목록을 조회할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        vehicles = self.repo.list_all_sold_vehicles()
        user_ids = list({row.seller_id for row in vehicles})
        user_map = self.repo.get_user_map(user_ids)
        workflow_map = self.repo.get_trade_workflow_map([row.id for row in vehicles])

        result: list[AdminSettlementRecordItem] = []
        for vehicle in vehicles:
            record = self._record_from_vehicle(vehicle, workflow_map.get(vehicle.id))
            result.append(
                AdminSettlementRecordItem(
                    vehicle=vehicle,
                    seller=user_map.get(vehicle.seller_id),
                    status=record.status,
                    settlement_due_at=record.settlement_due_at,
                )
            )
        return result

    def get_actor(self, user_id: UUID) -> UserORM:
        return self._get_user(user_id)
