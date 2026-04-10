from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

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
from contexts.trades.application.workflow_start import ensure_awarded_trade_workflow
from contexts.trades.infrastructure.models import TradeDepreciationItemORM, TradeEventORM, TradeWorkflowORM
from contexts.vehicles.domain.enums import VehicleStatus
from contexts.vehicles.infrastructure.models import VehicleORM
from shared.domain.vehicle_lifecycle import assert_trade_stage_transition
from shared.infrastructure.errors import AppError


@dataclass
class TradeWorkflowBundle:
    workflow: TradeWorkflowORM
    vehicle: VehicleORM
    seller: UserORM | None
    dealer: UserORM | None
    depreciation_items: list[TradeDepreciationItemORM]
    events: list[TradeEventORM]


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class TradeWorkflowService:
    def __init__(self, repo: TradeWorkflowRepositoryPort) -> None:
        self.repo = repo

    def get_actor(self, user_id: UUID) -> UserORM:
        user = self.repo.get_user(user_id)
        if not user:
            raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")
        return user

    def _get_vehicle(self, vehicle_id: UUID) -> VehicleORM:
        vehicle = self.repo.get_vehicle(vehicle_id)
        if not vehicle:
            raise AppError("차량을 찾을 수 없습니다.", 404, "VEHICLE_NOT_FOUND")
        return vehicle

    def _assert_vehicle_access(self, actor: UserORM, vehicle: VehicleORM) -> None:
        if actor.role == UserRole.ADMIN:
            return

        if actor.role == UserRole.SELLER:
            if vehicle.seller_id != actor.id:
                raise AppError("본인 차량만 접근할 수 있습니다.", 403, "FORBIDDEN_VEHICLE_ACCESS")
            return

        if actor.role == UserRole.DEALER:
            if vehicle.winning_dealer_id != actor.id:
                raise AppError("본인 낙찰 거래만 접근할 수 있습니다.", 403, "FORBIDDEN_VEHICLE_ACCESS")
            return

        raise AppError("지원하지 않는 역할입니다.", 403, "FORBIDDEN_ROLE")

    def _assert_workflow_access(self, actor: UserORM, workflow: TradeWorkflowORM) -> None:
        if actor.role == UserRole.ADMIN:
            return
        if actor.role == UserRole.SELLER and workflow.seller_id == actor.id:
            return
        if actor.role == UserRole.DEALER and workflow.dealer_id == actor.id:
            return
        raise AppError("거래 워크플로우 접근 권한이 없습니다.", 403, "FORBIDDEN_WORKFLOW_ACCESS")

    def _assert_not_locked(self, workflow: TradeWorkflowORM) -> None:
        if workflow.current_stage == TradeStage.CANCELLED:
            raise AppError("강제 종료된 거래입니다.", 409, "TRADE_ALREADY_CANCELLED")
        if workflow.current_stage == TradeStage.COMPLETED:
            raise AppError("이미 완료된 거래입니다.", 409, "TRADE_ALREADY_COMPLETED")

    def _move_to_stage(self, workflow: TradeWorkflowORM, next_stage: TradeStage) -> None:
        try:
            assert_trade_stage_transition(workflow.current_stage, next_stage)
        except ValueError as exc:
            raise AppError("허용되지 않은 거래 단계 전이입니다.", 409, "TRADE_STAGE_TRANSITION_INVALID") from exc
        workflow.current_stage = next_stage

    def _seed_default_depreciation_items(self, workflow: TradeWorkflowORM) -> list[TradeDepreciationDraftItem]:
        base = max(Decimal("1"), Decimal(str(float(workflow.base_price))))
        tire = int(max(50000, round(float(base * Decimal("0.01")))))
        exterior = int(max(120000, round(float(base * Decimal("0.015")))))
        interior = int(max(80000, round(float(base * Decimal("0.008")))))
        return [
            TradeDepreciationDraftItem(code="DEPR_TIRE", label="타이어 마모", amount=float(tire), note="잔여 트레드 낮음"),
            TradeDepreciationDraftItem(code="DEPR_EXTERIOR", label="외판 손상", amount=float(exterior), note="도어/범퍼 스크래치"),
            TradeDepreciationDraftItem(code="DEPR_INTERIOR", label="실내 오염", amount=float(interior), note="시트 클리닝 필요"),
        ]

    def _ensure_workflow(self, actor: UserORM, vehicle: VehicleORM) -> TradeWorkflowORM:
        workflow = self.repo.get_workflow_by_vehicle(vehicle.id)
        if workflow:
            self._assert_workflow_access(actor, workflow)
            return workflow

        self._assert_vehicle_access(actor, vehicle)
        workflow = ensure_awarded_trade_workflow(self.repo, vehicle=vehicle)
        self.repo.commit()
        return workflow

    def _to_bundle(self, workflow: TradeWorkflowORM, vehicle: VehicleORM) -> TradeWorkflowBundle:
        seller = self.repo.get_user(workflow.seller_id)
        dealer = self.repo.get_user(workflow.dealer_id)
        items = self.repo.list_depreciation_items(workflow.id)
        events = self.repo.list_events(workflow.id, limit=300)
        return TradeWorkflowBundle(
            workflow=workflow,
            vehicle=vehicle,
            seller=seller,
            dealer=dealer,
            depreciation_items=items,
            events=events,
        )

    def get_workflow(self, *, actor: UserORM, vehicle_id: UUID) -> TradeWorkflowBundle:
        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)

        # 낙찰 직후에도 감가 협의 API 실검증이 가능하도록 기본 제안 셋을 자동 생성한다.
        if (
            workflow.depreciation_status == DepreciationStatus.PROPOSAL_REQUIRED
            and workflow.inspection_status == InspectionStatus.COMPLETED
            and not self.repo.list_depreciation_items(workflow.id)
        ):
            defaults = self._seed_default_depreciation_items(workflow)
            created = self.repo.replace_depreciation_items(workflow.id, defaults)
            total = sum(Decimal(str(float(row.amount))) for row in created)
            workflow.depreciation_total = float(total)
            workflow.depreciation_status = DepreciationStatus.SELLER_REVIEW
            workflow.depreciation_submitted_at = datetime.now(timezone.utc)
            workflow.depreciation_comment = "초기 자동 제안"
            self.repo.update_workflow(workflow)
            self.repo.append_event(
                workflow_id=workflow.id,
                actor_id=None,
                actor_role=None,
                event_type="DEPRECIATION_AUTO_PROPOSED",
                message="기본 감가 제안이 자동 생성되었습니다.",
                payload_json={"count": len(created), "total": float(total)},
            )
            self.repo.commit()

        return self._to_bundle(workflow, vehicle)

    def ensure_awarded_workflow(self, *, actor: UserORM, vehicle_id: UUID) -> TradeWorkflowBundle:
        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        return self._to_bundle(workflow, vehicle)

    def _total_items(self, items: list[TradeDepreciationDraftItem]) -> Decimal:
        if not items:
            raise AppError("감가 항목을 1개 이상 입력해 주세요.", 400, "DEPRECIATION_ITEMS_REQUIRED")

        total = Decimal("0")
        for idx, item in enumerate(items, start=1):
            if len(item.code.strip()) < 2:
                raise AppError(f"{idx}번째 감가 코드가 올바르지 않습니다.", 400, "INVALID_DEPRECIATION_CODE")
            if len(item.label.strip()) < 2:
                raise AppError(f"{idx}번째 감가 항목명이 올바르지 않습니다.", 400, "INVALID_DEPRECIATION_LABEL")

            amount = Decimal(str(item.amount))
            if amount <= 0:
                raise AppError(f"{idx}번째 감가 금액은 0보다 커야 합니다.", 400, "INVALID_DEPRECIATION_AMOUNT")
            total += amount
        return total

    def admin_propose_inspection(
        self,
        *,
        actor: UserORM,
        vehicle_id: UUID,
        scheduled_at: datetime,
        location: str,
        assignee: str,
        contact: str,
    ) -> TradeWorkflowBundle:
        if actor.role != UserRole.ADMIN:
            raise AppError("관리자만 검차 일정을 제안할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        if len(location.strip()) < 2:
            raise AppError("검차 장소를 2자 이상 입력해 주세요.", 400, "INVALID_INSPECTION_LOCATION")
        if len(assignee.strip()) < 2:
            raise AppError("담당 평가사를 2자 이상 입력해 주세요.", 400, "INVALID_INSPECTION_ASSIGNEE")
        if len(contact.strip()) < 2:
            raise AppError("연락처를 2자 이상 입력해 주세요.", 400, "INVALID_INSPECTION_CONTACT")

        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        self._assert_not_locked(workflow)
        if workflow.current_stage not in (TradeStage.INSPECTION, TradeStage.DEPRECIATION):
            raise AppError("검차 일정을 변경할 수 없는 단계입니다.", 409, "INSPECTION_STAGE_INVALID")

        when = _as_utc(scheduled_at)
        if when <= datetime.now(timezone.utc):
            raise AppError("검차 일정은 현재 시각 이후여야 합니다.", 400, "INVALID_INSPECTION_DATETIME")

        self._move_to_stage(workflow, TradeStage.INSPECTION)
        workflow.inspection_status = InspectionStatus.PROPOSED
        workflow.inspection_scheduled_at = when
        workflow.inspection_location = location.strip()
        workflow.inspection_assignee = assignee.strip()
        workflow.inspection_contact = contact.strip()
        workflow.inspection_confirmed_at = None
        self.repo.update_workflow(workflow)
        self.repo.append_event(
            workflow_id=workflow.id,
            actor_id=actor.id,
            actor_role=actor.role.value,
            event_type="INSPECTION_PROPOSED",
            message="검차 일정이 제안되었습니다.",
            payload_json={"scheduled_at": when.isoformat(), "location": workflow.inspection_location},
        )
        self.repo.commit()
        return self._to_bundle(workflow, vehicle)

    def seller_approve_inspection(self, *, actor: UserORM, vehicle_id: UUID) -> TradeWorkflowBundle:
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 검차 일정을 승인할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        self._assert_not_locked(workflow)
        if workflow.seller_id != actor.id:
            raise AppError("본인 거래만 처리할 수 있습니다.", 403, "FORBIDDEN_WORKFLOW_ACCESS")
        if workflow.inspection_status not in (InspectionStatus.PROPOSED, InspectionStatus.RESCHEDULE_REQUESTED):
            raise AppError("승인 가능한 검차 일정 상태가 아닙니다.", 409, "INSPECTION_APPROVAL_NOT_ALLOWED")

        self._move_to_stage(workflow, TradeStage.INSPECTION)
        workflow.inspection_status = InspectionStatus.CONFIRMED
        workflow.inspection_confirmed_at = datetime.now(timezone.utc)
        self.repo.update_workflow(workflow)
        self.repo.append_event(
            workflow_id=workflow.id,
            actor_id=actor.id,
            actor_role=actor.role.value,
            event_type="INSPECTION_APPROVED",
            message="판매자가 검차 일정을 승인했습니다.",
            payload_json={"scheduled_at": workflow.inspection_scheduled_at.isoformat() if workflow.inspection_scheduled_at else None},
        )
        self.repo.commit()
        return self._to_bundle(workflow, vehicle)

    def seller_request_inspection_reschedule(
        self,
        *,
        actor: UserORM,
        vehicle_id: UUID,
        requested_at: datetime,
        reason: str,
    ) -> TradeWorkflowBundle:
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 검차 일정 재요청을 할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        if len(reason.strip()) < 2:
            raise AppError("재요청 사유를 2자 이상 입력해 주세요.", 400, "INVALID_RESCHEDULE_REASON")

        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        self._assert_not_locked(workflow)
        if workflow.seller_id != actor.id:
            raise AppError("본인 거래만 처리할 수 있습니다.", 403, "FORBIDDEN_WORKFLOW_ACCESS")
        if workflow.inspection_status not in (InspectionStatus.PROPOSED, InspectionStatus.CONFIRMED):
            raise AppError("재요청 가능한 검차 상태가 아닙니다.", 409, "INSPECTION_RESCHEDULE_NOT_ALLOWED")

        preferred = _as_utc(requested_at)
        self._move_to_stage(workflow, TradeStage.INSPECTION)
        workflow.inspection_status = InspectionStatus.RESCHEDULE_REQUESTED
        workflow.inspection_confirmed_at = None
        self.repo.update_workflow(workflow)
        self.repo.append_event(
            workflow_id=workflow.id,
            actor_id=actor.id,
            actor_role=actor.role.value,
            event_type="INSPECTION_RESCHEDULE_REQUESTED",
            message="판매자가 검차 일정 재요청을 등록했습니다.",
            payload_json={"preferred_at": preferred.isoformat(), "reason": reason.strip()},
        )
        self.repo.commit()
        return self._to_bundle(workflow, vehicle)

    def admin_complete_inspection(
        self,
        *,
        actor: UserORM,
        vehicle_id: UUID,
        report_url: str,
        summary: str,
    ) -> TradeWorkflowBundle:
        if actor.role != UserRole.ADMIN:
            raise AppError("관리자만 검차 완료 처리할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        if len(report_url.strip()) < 4:
            raise AppError("검차 리포트 경로를 입력해 주세요.", 400, "INVALID_REPORT_URL")

        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        self._assert_not_locked(workflow)
        if workflow.inspection_status != InspectionStatus.CONFIRMED:
            raise AppError("검차 일정 확정 후에만 완료 처리할 수 있습니다.", 409, "INSPECTION_NOT_CONFIRMED")

        now = datetime.now(timezone.utc)
        self._move_to_stage(workflow, TradeStage.DEPRECIATION)
        workflow.inspection_status = InspectionStatus.COMPLETED
        workflow.inspection_completed_at = now
        workflow.inspection_report_url = report_url.strip()
        workflow.inspection_summary = summary.strip() if summary else None
        self.repo.update_workflow(workflow)
        self.repo.append_event(
            workflow_id=workflow.id,
            actor_id=actor.id,
            actor_role=actor.role.value,
            event_type="INSPECTION_COMPLETED",
            message="검차 결과가 확정되었습니다.",
            payload_json={"report_url": workflow.inspection_report_url},
        )
        self.repo.commit()
        return self._to_bundle(workflow, vehicle)

    def dealer_submit_depreciation(
        self,
        *,
        actor: UserORM,
        vehicle_id: UUID,
        items: list[TradeDepreciationDraftItem],
        comment: str | None,
    ) -> TradeWorkflowBundle:
        if actor.role != UserRole.DEALER:
            raise AppError("딜러만 감가 제안을 등록할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        self._assert_not_locked(workflow)
        if workflow.dealer_id != actor.id:
            raise AppError("본인 낙찰 거래만 처리할 수 있습니다.", 403, "FORBIDDEN_WORKFLOW_ACCESS")
        if workflow.inspection_status != InspectionStatus.COMPLETED:
            raise AppError("검차 완료 후에만 감가 제안을 등록할 수 있습니다.", 409, "INSPECTION_NOT_COMPLETED")

        total = self._total_items(items)
        if total >= Decimal(str(float(workflow.base_price))):
            raise AppError("감가 총액이 기준 금액 이상일 수 없습니다.", 400, "DEPRECIATION_TOTAL_TOO_HIGH")

        created = self.repo.replace_depreciation_items(workflow.id, items)
        self._move_to_stage(workflow, TradeStage.DEPRECIATION)
        workflow.depreciation_status = DepreciationStatus.SELLER_REVIEW
        workflow.depreciation_submitted_at = datetime.now(timezone.utc)
        workflow.depreciation_comment = comment.strip() if comment else None
        workflow.depreciation_total = float(total)
        workflow.renegotiation_requested_at = None
        workflow.renegotiation_reason = None
        workflow.renegotiation_target_price = None
        self.repo.update_workflow(workflow)
        self.repo.append_event(
            workflow_id=workflow.id,
            actor_id=actor.id,
            actor_role=actor.role.value,
            event_type="DEPRECIATION_PROPOSED",
            message="딜러가 감가 제안을 제출했습니다.",
            payload_json={"count": len(created), "total": float(total)},
        )
        self.repo.commit()
        return self._to_bundle(workflow, vehicle)

    def seller_request_renegotiation(
        self,
        *,
        actor: UserORM,
        vehicle_id: UUID,
        reason: str,
        target_price: float,
    ) -> TradeWorkflowBundle:
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 감가 재협의 요청을 할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        if len(reason.strip()) < 2:
            raise AppError("재협의 사유를 2자 이상 입력해 주세요.", 400, "INVALID_RENEGOTIATION_REASON")
        target = Decimal(str(target_price))
        if target <= 0:
            raise AppError("희망 금액은 0보다 커야 합니다.", 400, "INVALID_RENEGOTIATION_PRICE")

        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        self._assert_not_locked(workflow)
        if workflow.seller_id != actor.id:
            raise AppError("본인 거래만 처리할 수 있습니다.", 403, "FORBIDDEN_WORKFLOW_ACCESS")
        if workflow.depreciation_status != DepreciationStatus.SELLER_REVIEW:
            raise AppError("현재 재협의 요청 가능한 감가 상태가 아닙니다.", 409, "RENEGOTIATION_NOT_ALLOWED")

        self._move_to_stage(workflow, TradeStage.DEPRECIATION)
        workflow.depreciation_status = DepreciationStatus.RENEGOTIATION_REQUESTED
        workflow.renegotiation_requested_at = datetime.now(timezone.utc)
        workflow.renegotiation_reason = reason.strip()
        workflow.renegotiation_target_price = float(target)
        self.repo.update_workflow(workflow)
        self.repo.append_event(
            workflow_id=workflow.id,
            actor_id=actor.id,
            actor_role=actor.role.value,
            event_type="DEPRECIATION_RENEGOTIATION_REQUESTED",
            message="판매자가 감가 재협의를 요청했습니다.",
            payload_json={"target_price": float(target)},
        )
        self.repo.commit()
        return self._to_bundle(workflow, vehicle)

    def seller_approve_depreciation(self, *, actor: UserORM, vehicle_id: UUID) -> TradeWorkflowBundle:
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 감가를 승인할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        self._assert_not_locked(workflow)
        if workflow.seller_id != actor.id:
            raise AppError("본인 거래만 처리할 수 있습니다.", 403, "FORBIDDEN_WORKFLOW_ACCESS")
        if workflow.depreciation_status != DepreciationStatus.SELLER_REVIEW:
            raise AppError("현재 감가 승인 가능한 상태가 아닙니다.", 409, "DEPRECIATION_APPROVAL_NOT_ALLOWED")

        existing_items = self.repo.list_depreciation_items(workflow.id)
        if not existing_items:
            raise AppError("감가 항목이 없어 승인할 수 없습니다.", 409, "DEPRECIATION_ITEMS_REQUIRED")

        total = sum(Decimal(str(float(row.amount))) for row in existing_items)
        base = Decimal(str(float(workflow.base_price)))
        agreed = base - total
        if agreed < 0:
            agreed = Decimal("0")

        now = datetime.now(timezone.utc)
        self._move_to_stage(workflow, TradeStage.DELIVERY)
        workflow.depreciation_status = DepreciationStatus.AGREED
        workflow.depreciation_total = float(total)
        workflow.agreed_price = float(agreed)
        workflow.depreciation_agreed_at = now
        workflow.delivery_status = DeliveryStatus.WAITING_SCHEDULE
        self.repo.update_workflow(workflow)
        self.repo.append_event(
            workflow_id=workflow.id,
            actor_id=actor.id,
            actor_role=actor.role.value,
            event_type="DEPRECIATION_APPROVED",
            message="판매자가 감가안을 승인했습니다.",
            payload_json={"agreed_price": float(agreed), "depreciation_total": float(total)},
        )
        self.repo.commit()
        return self._to_bundle(workflow, vehicle)

    def dealer_schedule_delivery(
        self,
        *,
        actor: UserORM,
        vehicle_id: UUID,
        scheduled_at: datetime,
        method: str,
        location: str,
    ) -> TradeWorkflowBundle:
        if actor.role != UserRole.DEALER:
            raise AppError("딜러만 인도 일정을 등록할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        if len(method.strip()) < 2:
            raise AppError("인도 방식을 2자 이상 입력해 주세요.", 400, "INVALID_DELIVERY_METHOD")
        if len(location.strip()) < 2:
            raise AppError("인도 장소를 2자 이상 입력해 주세요.", 400, "INVALID_DELIVERY_LOCATION")

        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        self._assert_not_locked(workflow)
        if workflow.dealer_id != actor.id:
            raise AppError("본인 거래만 처리할 수 있습니다.", 403, "FORBIDDEN_WORKFLOW_ACCESS")
        if workflow.depreciation_status != DepreciationStatus.AGREED:
            raise AppError("감가 승인 후에만 인도 일정을 등록할 수 있습니다.", 409, "DELIVERY_NOT_READY")

        when = _as_utc(scheduled_at)
        if when <= datetime.now(timezone.utc):
            raise AppError("인도 일정은 현재 시각 이후여야 합니다.", 400, "INVALID_DELIVERY_DATETIME")

        self._move_to_stage(workflow, TradeStage.DELIVERY)
        workflow.delivery_status = DeliveryStatus.SCHEDULED
        workflow.delivery_scheduled_at = when
        workflow.delivery_method = method.strip()
        workflow.delivery_location = location.strip()
        self.repo.update_workflow(workflow)
        self.repo.append_event(
            workflow_id=workflow.id,
            actor_id=actor.id,
            actor_role=actor.role.value,
            event_type="DELIVERY_SCHEDULED",
            message="딜러가 인도 일정을 등록했습니다.",
            payload_json={"scheduled_at": when.isoformat(), "method": workflow.delivery_method},
        )
        self.repo.commit()
        return self._to_bundle(workflow, vehicle)

    def _confirm_delivery(
        self,
        *,
        actor: UserORM,
        vehicle_id: UUID,
        by_seller: bool,
        checklist_items: list[str] | None = None,
        vehicle_evidence_files: list[dict[str, object]] | None = None,
        document_evidence_files: list[dict[str, object]] | None = None,
    ) -> TradeWorkflowBundle:
        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        self._assert_not_locked(workflow)

        if by_seller:
            if actor.role != UserRole.SELLER or workflow.seller_id != actor.id:
                raise AppError("판매자 본인만 인도 확인을 할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        else:
            if actor.role != UserRole.DEALER or workflow.dealer_id != actor.id:
                raise AppError("딜러 본인만 인도 확인을 할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        if workflow.delivery_status not in (DeliveryStatus.SCHEDULED, DeliveryStatus.IN_PROGRESS):
            raise AppError("인도 확인 가능한 상태가 아닙니다.", 409, "DELIVERY_CONFIRM_NOT_ALLOWED")

        now = datetime.now(timezone.utc)
        if by_seller:
            workflow.delivery_confirmed_by_seller_at = now
        else:
            workflow.delivery_confirmed_by_dealer_at = now

        self._move_to_stage(workflow, TradeStage.DELIVERY)
        if workflow.delivery_confirmed_by_seller_at and workflow.delivery_confirmed_by_dealer_at:
            workflow.delivery_status = DeliveryStatus.COMPLETED
            workflow.delivery_completed_at = now
            self._move_to_stage(workflow, TradeStage.REMITTANCE)
        else:
            workflow.delivery_status = DeliveryStatus.IN_PROGRESS

        self.repo.update_workflow(workflow)
        self.repo.append_event(
            workflow_id=workflow.id,
            actor_id=actor.id,
            actor_role=actor.role.value,
            event_type="DELIVERY_CONFIRMED_BY_SELLER" if by_seller else "DELIVERY_CONFIRMED_BY_DEALER",
            message="인도 확인이 등록되었습니다.",
            payload_json={
                "seller_confirmed": workflow.delivery_confirmed_by_seller_at is not None,
                "dealer_confirmed": workflow.delivery_confirmed_by_dealer_at is not None,
                "checklist_items": checklist_items or [],
                "vehicle_evidence_files": vehicle_evidence_files or [],
                "document_evidence_files": document_evidence_files or [],
            },
        )
        self.repo.commit()
        return self._to_bundle(workflow, vehicle)

    def seller_confirm_delivery(self, *, actor: UserORM, vehicle_id: UUID) -> TradeWorkflowBundle:
        return self._confirm_delivery(actor=actor, vehicle_id=vehicle_id, by_seller=True)

    def dealer_confirm_delivery(
        self,
        *,
        actor: UserORM,
        vehicle_id: UUID,
        checklist_items: list[str] | None = None,
        vehicle_evidence_files: list[dict[str, object]] | None = None,
        document_evidence_files: list[dict[str, object]] | None = None,
    ) -> TradeWorkflowBundle:
        return self._confirm_delivery(
            actor=actor,
            vehicle_id=vehicle_id,
            by_seller=False,
            checklist_items=checklist_items,
            vehicle_evidence_files=vehicle_evidence_files,
            document_evidence_files=document_evidence_files,
        )

    def dealer_submit_remittance(
        self,
        *,
        actor: UserORM,
        vehicle_id: UUID,
        amount: float,
        bank_account: str,
        reference: str,
        remitted_at: datetime | None = None,
        method: str | None = None,
        note: str | None = None,
        evidence_files: list[dict[str, object]] | None = None,
    ) -> TradeWorkflowBundle:
        if actor.role != UserRole.DEALER:
            raise AppError("딜러만 송금 정보를 등록할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        if len(bank_account.strip()) < 4:
            raise AppError("송금 계좌 정보를 확인해 주세요.", 400, "INVALID_REMITTANCE_ACCOUNT")
        if len(reference.strip()) < 2:
            raise AppError("송금 식별자를 2자 이상 입력해 주세요.", 400, "INVALID_REMITTANCE_REFERENCE")

        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        self._assert_not_locked(workflow)
        if workflow.dealer_id != actor.id:
            raise AppError("본인 거래만 처리할 수 있습니다.", 403, "FORBIDDEN_WORKFLOW_ACCESS")
        if workflow.delivery_status != DeliveryStatus.COMPLETED:
            raise AppError("인도 완료 후에만 송금 정보를 등록할 수 있습니다.", 409, "REMITTANCE_NOT_READY")

        remittance_amount = Decimal(str(amount))
        if remittance_amount <= 0:
            raise AppError("송금 금액은 0보다 커야 합니다.", 400, "INVALID_REMITTANCE_AMOUNT")

        agreed = Decimal(str(float(workflow.agreed_price if workflow.agreed_price is not None else workflow.base_price)))
        if remittance_amount < agreed:
            raise AppError("송금 금액이 합의 금액보다 작을 수 없습니다.", 400, "REMITTANCE_AMOUNT_TOO_LOW")

        now = datetime.now(timezone.utc)
        self._move_to_stage(workflow, TradeStage.REMITTANCE)
        workflow.remittance_status = RemittanceStatus.SUBMITTED
        workflow.remittance_amount = float(remittance_amount)
        workflow.remittance_bank_account = bank_account.strip()
        workflow.remittance_reference = reference.strip()
        workflow.remittance_submitted_at = now
        self.repo.update_workflow(workflow)
        self.repo.append_event(
            workflow_id=workflow.id,
            actor_id=actor.id,
            actor_role=actor.role.value,
            event_type="REMITTANCE_SUBMITTED",
            message="딜러가 송금 정보를 등록했습니다.",
            payload_json={
                "amount": float(remittance_amount),
                "reference": workflow.remittance_reference,
                "method": (method or "").strip() or "ACCOUNT_TRANSFER",
                "remitted_at": _as_utc(remitted_at).isoformat() if remitted_at else now.isoformat(),
                "note": (note or "").strip() or None,
                "evidence_files": evidence_files or [],
            },
        )
        self.repo.commit()
        return self._to_bundle(workflow, vehicle)

    def admin_confirm_remittance(self, *, actor: UserORM, vehicle_id: UUID) -> TradeWorkflowBundle:
        if actor.role != UserRole.ADMIN:
            raise AppError("관리자만 송금 확인을 할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        self._assert_not_locked(workflow)
        if workflow.remittance_status != RemittanceStatus.SUBMITTED:
            raise AppError("송금 등록 후에만 확인할 수 있습니다.", 409, "REMITTANCE_CONFIRM_NOT_ALLOWED")

        now = datetime.now(timezone.utc)
        self._move_to_stage(workflow, TradeStage.SETTLEMENT)
        workflow.remittance_status = RemittanceStatus.CONFIRMED
        workflow.remittance_confirmed_at = now
        self.repo.update_workflow(workflow)
        self.repo.append_event(
            workflow_id=workflow.id,
            actor_id=actor.id,
            actor_role=actor.role.value,
            event_type="REMITTANCE_CONFIRMED",
            message="관리자가 딜러 송금을 확인했습니다.",
            payload_json={"confirmed_at": now.isoformat()},
        )
        self.repo.commit()
        return self._to_bundle(workflow, vehicle)

    def admin_complete_settlement(
        self,
        *,
        actor: UserORM,
        vehicle_id: UUID,
        settlement_amount: float | None,
    ) -> TradeWorkflowBundle:
        if actor.role != UserRole.ADMIN:
            raise AppError("관리자만 정산 완료 처리할 수 있습니다.", 403, "FORBIDDEN_ROLE")

        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        self._assert_not_locked(workflow)
        if workflow.remittance_status != RemittanceStatus.CONFIRMED:
            raise AppError("송금 확인 후에만 정산 완료 처리할 수 있습니다.", 409, "SETTLEMENT_NOT_READY")

        raw_amount = settlement_amount
        if raw_amount is None:
            raw_amount = float(workflow.remittance_amount if workflow.remittance_amount is not None else 0)
        amount = Decimal(str(raw_amount))
        if amount <= 0:
            raise AppError("정산 금액은 0보다 커야 합니다.", 400, "INVALID_SETTLEMENT_AMOUNT")

        now = datetime.now(timezone.utc)
        self._move_to_stage(workflow, TradeStage.COMPLETED)
        workflow.settlement_status = SettlementStatus.COMPLETED
        workflow.settlement_amount = float(amount)
        workflow.settlement_completed_at = now
        self.repo.update_workflow(workflow)
        self.repo.append_event(
            workflow_id=workflow.id,
            actor_id=actor.id,
            actor_role=actor.role.value,
            event_type="SETTLEMENT_COMPLETED",
            message="판매자 정산이 완료되었습니다.",
            payload_json={"settlement_amount": float(amount)},
        )
        self.repo.commit()
        return self._to_bundle(workflow, vehicle)

    def admin_force_cancel(self, *, actor: UserORM, vehicle_id: UUID, reason: str) -> TradeWorkflowBundle:
        if actor.role != UserRole.ADMIN:
            raise AppError("관리자만 강제 종료할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        if len(reason.strip()) < 2:
            raise AppError("강제 종료 사유를 2자 이상 입력해 주세요.", 400, "INVALID_FORCE_CANCEL_REASON")

        vehicle = self._get_vehicle(vehicle_id)
        workflow = self._ensure_workflow(actor, vehicle)
        if workflow.current_stage in (TradeStage.CANCELLED, TradeStage.COMPLETED):
            raise AppError("이미 종료된 거래입니다.", 409, "TRADE_ALREADY_TERMINATED")

        now = datetime.now(timezone.utc)
        self._move_to_stage(workflow, TradeStage.CANCELLED)
        workflow.forced_cancel_reason = reason.strip()
        workflow.forced_cancelled_at = now
        self.repo.update_workflow(workflow)
        self.repo.append_event(
            workflow_id=workflow.id,
            actor_id=actor.id,
            actor_role=actor.role.value,
            event_type="TRADE_FORCE_CANCELLED",
            message="관리자가 거래를 강제 종료했습니다.",
            payload_json={"reason": workflow.forced_cancel_reason},
        )
        self.repo.commit()
        return self._to_bundle(workflow, vehicle)

    def list_seller_workflows(self, *, actor: UserORM, offset: int, limit: int) -> list[TradeWorkflowBundle]:
        if actor.role != UserRole.SELLER:
            raise AppError("판매자만 조회할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        rows = self.repo.list_workflows_by_seller(actor.id, offset=offset, limit=limit)
        result: list[TradeWorkflowBundle] = []
        for row in rows:
            vehicle = self._get_vehicle(row.vehicle_id)
            result.append(self._to_bundle(row, vehicle))
        return result

    def list_dealer_workflows(self, *, actor: UserORM, offset: int, limit: int) -> list[TradeWorkflowBundle]:
        if actor.role != UserRole.DEALER:
            raise AppError("딜러만 조회할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        rows = self.repo.list_workflows_by_dealer(actor.id, offset=offset, limit=limit)
        result: list[TradeWorkflowBundle] = []
        for row in rows:
            vehicle = self._get_vehicle(row.vehicle_id)
            result.append(self._to_bundle(row, vehicle))
        return result

    def list_admin_workflows(self, *, actor: UserORM, stage: TradeStage | None, offset: int, limit: int) -> list[TradeWorkflowBundle]:
        if actor.role != UserRole.ADMIN:
            raise AppError("관리자만 조회할 수 있습니다.", 403, "FORBIDDEN_ROLE")
        rows = self.repo.list_workflows_for_admin(stage=stage, offset=offset, limit=limit)
        result: list[TradeWorkflowBundle] = []
        for row in rows:
            vehicle = self._get_vehicle(row.vehicle_id)
            result.append(self._to_bundle(row, vehicle))
        return result
