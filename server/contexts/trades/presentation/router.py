from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from api.dependencies import AuthContext, get_current_user, require_roles
from contexts.identity.domain.enums import UserRole
from contexts.trades.application.services import TradeWorkflowBundle, TradeWorkflowService
from contexts.trades.domain.enums import TradeStage
from contexts.trades.domain.ports import TradeDepreciationDraftItem
from contexts.trades.infrastructure.repository import SqlAlchemyTradeWorkflowRepository
from contexts.trades.presentation.schemas import (
    AdminCompleteInspectionRequest,
    AdminCompleteSettlementRequest,
    AdminForceCancelRequest,
    AdminProposeInspectionRequest,
    DealerScheduleDeliveryRequest,
    DealerConfirmDeliveryRequest,
    DealerSubmitDepreciationRequest,
    DealerSubmitRemittanceRequest,
    SellerRequestInspectionRescheduleRequest,
    SellerRequestRenegotiationRequest,
    TradeDepreciationItemResponse,
    TradeEventResponse,
    TradeWorkflowResponse,
)
from shared.domain.vehicle_lifecycle import lifecycle_from_snapshot
from shared.infrastructure.database import get_db_session
from shared.infrastructure.errors import AppError

router = APIRouter(tags=["trades"])


def parse_uuid(raw: str, code: str) -> UUID:
    try:
        return UUID(raw)
    except ValueError as exc:
        raise AppError("유효하지 않은 ID입니다.", 400, code) from exc


def build_service(db: Session) -> TradeWorkflowService:
    return TradeWorkflowService(SqlAlchemyTradeWorkflowRepository(db))


def to_response(bundle: TradeWorkflowBundle) -> TradeWorkflowResponse:
    workflow = bundle.workflow
    return TradeWorkflowResponse(
        id=str(workflow.id),
        vehicle_id=str(workflow.vehicle_id),
        vehicle_title=bundle.vehicle.title,
        currency=bundle.vehicle.currency,
        seller_id=str(workflow.seller_id),
        seller_name=bundle.seller.full_name if bundle.seller else None,
        seller_email=bundle.seller.email if bundle.seller else None,
        seller_phone=bundle.seller.phone if bundle.seller else None,
        dealer_id=str(workflow.dealer_id),
        dealer_name=bundle.dealer.full_name if bundle.dealer else None,
        dealer_email=bundle.dealer.email if bundle.dealer else None,
        dealer_phone=bundle.dealer.phone if bundle.dealer else None,
        current_stage=workflow.current_stage,
        lifecycle_state=lifecycle_from_snapshot(
            vehicle_status=bundle.vehicle.status,
            bidding_ends_at=bundle.vehicle.bidding_ends_at,
            workflow_stage=workflow.current_stage,
            has_winning_dealer=bundle.vehicle.winning_dealer_id is not None,
        ),
        inspection_status=workflow.inspection_status,
        depreciation_status=workflow.depreciation_status,
        delivery_status=workflow.delivery_status,
        remittance_status=workflow.remittance_status,
        settlement_status=workflow.settlement_status,
        base_price=float(workflow.base_price),
        agreed_price=float(workflow.agreed_price) if workflow.agreed_price is not None else None,
        depreciation_total=float(workflow.depreciation_total) if workflow.depreciation_total is not None else None,
        inspection_scheduled_at=workflow.inspection_scheduled_at,
        inspection_location=workflow.inspection_location,
        inspection_assignee=workflow.inspection_assignee,
        inspection_contact=workflow.inspection_contact,
        inspection_confirmed_at=workflow.inspection_confirmed_at,
        inspection_completed_at=workflow.inspection_completed_at,
        inspection_report_url=workflow.inspection_report_url,
        inspection_summary=workflow.inspection_summary,
        depreciation_submitted_at=workflow.depreciation_submitted_at,
        depreciation_comment=workflow.depreciation_comment,
        renegotiation_requested_at=workflow.renegotiation_requested_at,
        renegotiation_reason=workflow.renegotiation_reason,
        renegotiation_target_price=float(workflow.renegotiation_target_price)
        if workflow.renegotiation_target_price is not None
        else None,
        depreciation_agreed_at=workflow.depreciation_agreed_at,
        delivery_scheduled_at=workflow.delivery_scheduled_at,
        delivery_method=workflow.delivery_method,
        delivery_location=workflow.delivery_location,
        delivery_confirmed_by_seller_at=workflow.delivery_confirmed_by_seller_at,
        delivery_confirmed_by_dealer_at=workflow.delivery_confirmed_by_dealer_at,
        delivery_completed_at=workflow.delivery_completed_at,
        remittance_amount=float(workflow.remittance_amount) if workflow.remittance_amount is not None else None,
        remittance_bank_account=workflow.remittance_bank_account,
        remittance_reference=workflow.remittance_reference,
        remittance_submitted_at=workflow.remittance_submitted_at,
        remittance_confirmed_at=workflow.remittance_confirmed_at,
        settlement_amount=float(workflow.settlement_amount) if workflow.settlement_amount is not None else None,
        settlement_completed_at=workflow.settlement_completed_at,
        forced_cancel_reason=workflow.forced_cancel_reason,
        forced_cancelled_at=workflow.forced_cancelled_at,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        depreciation_items=[
            TradeDepreciationItemResponse(
                id=str(item.id),
                code=item.code,
                label=item.label,
                amount=float(item.amount),
                note=item.note,
                created_at=item.created_at,
                updated_at=item.updated_at,
            )
            for item in bundle.depreciation_items
        ],
        events=[
            TradeEventResponse(
                id=str(event.id),
                actor_id=str(event.actor_id) if event.actor_id else None,
                actor_role=event.actor_role,
                event_type=event.event_type,
                message=event.message,
                payload_json=event.payload_json,
                created_at=event.created_at,
            )
            for event in bundle.events
        ],
    )


@router.get(
    "/seller/vehicles/{vehicle_id}/trade-workflow",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def get_seller_trade_workflow(
    vehicle_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.get_workflow(actor=actor, vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"))
    return to_response(bundle)


@router.get(
    "/dealer/vehicles/{vehicle_id}/trade-workflow",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.DEALER))],
)
def get_dealer_trade_workflow(
    vehicle_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.get_workflow(actor=actor, vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"))
    return to_response(bundle)


@router.get(
    "/admin/vehicles/{vehicle_id}/trade-workflow",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def get_admin_trade_workflow(
    vehicle_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.get_workflow(actor=actor, vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"))
    return to_response(bundle)


@router.get(
    "/seller/trade-workflows",
    response_model=list[TradeWorkflowResponse],
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def list_seller_trade_workflows(
    auth: AuthContext = Depends(get_current_user),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db_session),
) -> list[TradeWorkflowResponse]:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    rows = service.list_seller_workflows(actor=actor, offset=offset, limit=limit)
    return [to_response(row) for row in rows]


@router.get(
    "/dealer/trade-workflows",
    response_model=list[TradeWorkflowResponse],
    dependencies=[Depends(require_roles(UserRole.DEALER))],
)
def list_dealer_trade_workflows(
    auth: AuthContext = Depends(get_current_user),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db_session),
) -> list[TradeWorkflowResponse]:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    rows = service.list_dealer_workflows(actor=actor, offset=offset, limit=limit)
    return [to_response(row) for row in rows]


@router.get(
    "/admin/trade-workflows",
    response_model=list[TradeWorkflowResponse],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def list_admin_trade_workflows(
    auth: AuthContext = Depends(get_current_user),
    stage: TradeStage | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db_session),
) -> list[TradeWorkflowResponse]:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    rows = service.list_admin_workflows(actor=actor, stage=stage, offset=offset, limit=limit)
    return [to_response(row) for row in rows]


@router.post(
    "/admin/vehicles/{vehicle_id}/inspection/propose",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def admin_propose_inspection(
    vehicle_id: str,
    payload: AdminProposeInspectionRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.admin_propose_inspection(
        actor=actor,
        vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"),
        scheduled_at=payload.scheduled_at,
        location=payload.location,
        assignee=payload.assignee,
        contact=payload.contact,
    )
    return to_response(bundle)


@router.post(
    "/seller/vehicles/{vehicle_id}/inspection/approve",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def seller_approve_inspection(
    vehicle_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.seller_approve_inspection(actor=actor, vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"))
    return to_response(bundle)


@router.post(
    "/seller/vehicles/{vehicle_id}/inspection/reschedule",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def seller_request_inspection_reschedule(
    vehicle_id: str,
    payload: SellerRequestInspectionRescheduleRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.seller_request_inspection_reschedule(
        actor=actor,
        vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"),
        requested_at=payload.preferred_at,
        reason=payload.reason,
    )
    return to_response(bundle)


@router.post(
    "/admin/vehicles/{vehicle_id}/inspection/complete",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def admin_complete_inspection(
    vehicle_id: str,
    payload: AdminCompleteInspectionRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.admin_complete_inspection(
        actor=actor,
        vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"),
        report_url=payload.report_url,
        summary=payload.summary or "",
    )
    return to_response(bundle)


@router.post(
    "/dealer/vehicles/{vehicle_id}/depreciation/propose",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.DEALER))],
)
def dealer_submit_depreciation(
    vehicle_id: str,
    payload: DealerSubmitDepreciationRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.dealer_submit_depreciation(
        actor=actor,
        vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"),
        items=[
            TradeDepreciationDraftItem(code=item.code, label=item.label, amount=item.amount, note=item.note)
            for item in payload.items
        ],
        comment=payload.comment,
    )
    return to_response(bundle)


@router.post(
    "/seller/vehicles/{vehicle_id}/depreciation/renegotiate",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def seller_request_renegotiation(
    vehicle_id: str,
    payload: SellerRequestRenegotiationRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.seller_request_renegotiation(
        actor=actor,
        vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"),
        reason=payload.reason,
        target_price=payload.target_price,
    )
    return to_response(bundle)


@router.post(
    "/seller/vehicles/{vehicle_id}/depreciation/approve",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def seller_approve_depreciation(
    vehicle_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.seller_approve_depreciation(actor=actor, vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"))
    return to_response(bundle)


@router.post(
    "/dealer/vehicles/{vehicle_id}/delivery/schedule",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.DEALER))],
)
def dealer_schedule_delivery(
    vehicle_id: str,
    payload: DealerScheduleDeliveryRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.dealer_schedule_delivery(
        actor=actor,
        vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"),
        scheduled_at=payload.scheduled_at,
        method=payload.method,
        location=payload.location,
    )
    return to_response(bundle)


@router.post(
    "/seller/vehicles/{vehicle_id}/delivery/confirm",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def seller_confirm_delivery(
    vehicle_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.seller_confirm_delivery(actor=actor, vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"))
    return to_response(bundle)


@router.post(
    "/dealer/vehicles/{vehicle_id}/delivery/confirm",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.DEALER))],
)
def dealer_confirm_delivery(
    vehicle_id: str,
    payload: DealerConfirmDeliveryRequest | None = None,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.dealer_confirm_delivery(
        actor=actor,
        vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"),
        checklist_items=payload.checklist_items if payload else [],
        vehicle_evidence_files=[item.model_dump() for item in payload.vehicle_evidence_files] if payload else [],
        document_evidence_files=[item.model_dump() for item in payload.document_evidence_files] if payload else [],
    )
    return to_response(bundle)


@router.post(
    "/dealer/vehicles/{vehicle_id}/remittance/submit",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.DEALER))],
)
def dealer_submit_remittance(
    vehicle_id: str,
    payload: DealerSubmitRemittanceRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.dealer_submit_remittance(
        actor=actor,
        vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"),
        amount=payload.amount,
        bank_account=payload.bank_account,
        reference=payload.reference,
        remitted_at=payload.remitted_at,
        method=payload.method,
        note=payload.note,
        evidence_files=[item.model_dump() for item in payload.evidence_files],
    )
    return to_response(bundle)


@router.post(
    "/admin/vehicles/{vehicle_id}/remittance/confirm",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def admin_confirm_remittance(
    vehicle_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.admin_confirm_remittance(actor=actor, vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"))
    return to_response(bundle)


@router.post(
    "/admin/vehicles/{vehicle_id}/settlement/complete",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def admin_complete_settlement(
    vehicle_id: str,
    payload: AdminCompleteSettlementRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.admin_complete_settlement(
        actor=actor,
        vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"),
        settlement_amount=payload.settlement_amount,
    )
    return to_response(bundle)


@router.post(
    "/admin/vehicles/{vehicle_id}/force-cancel",
    response_model=TradeWorkflowResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def admin_force_cancel(
    vehicle_id: str,
    payload: AdminForceCancelRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> TradeWorkflowResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    bundle = service.admin_force_cancel(
        actor=actor,
        vehicle_id=parse_uuid(vehicle_id, "INVALID_VEHICLE_ID"),
        reason=payload.reason,
    )
    return to_response(bundle)
