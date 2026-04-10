from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.dependencies import AuthContext, get_current_user, require_roles
from contexts.identity.domain.enums import UserRole
from contexts.settlement.application.services import SettlementService
from contexts.settlement.infrastructure.repository import SqlAlchemySettlementRepository
from contexts.settlement.presentation.schemas import (
    AdminSettlementRecordResponse,
    SellerSettlementRecordResponse,
    SettlementAccountResponse,
    UpsertSettlementAccountRequest,
)
from shared.infrastructure.database import get_db_session
from shared.infrastructure.errors import AppError

router = APIRouter(tags=["settlement"])


def parse_uuid(raw: str, code: str) -> UUID:
    try:
        return UUID(raw)
    except ValueError as exc:
        raise AppError("유효하지 않은 ID입니다.", 400, code) from exc


def build_service(db: Session) -> SettlementService:
    return SettlementService(SqlAlchemySettlementRepository(db))


def to_account_response(row) -> SettlementAccountResponse:
    return SettlementAccountResponse(
        id=str(row.id),
        bank_name=row.bank_name,
        account_number=row.account_number,
        account_holder=row.account_holder,
        is_primary=row.is_primary,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.get(
    "/seller/settlement/accounts",
    response_model=list[SettlementAccountResponse],
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def list_settlement_accounts(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[SettlementAccountResponse]:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    rows = service.list_accounts(actor=actor)
    return [to_account_response(row) for row in rows]


@router.post(
    "/seller/settlement/accounts",
    response_model=SettlementAccountResponse,
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def create_settlement_account(
    payload: UpsertSettlementAccountRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> SettlementAccountResponse:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    row = service.create_account(
        actor=actor,
        bank_name=payload.bank_name,
        account_number=payload.account_number,
        account_holder=payload.account_holder,
        is_primary=payload.is_primary,
    )
    return to_account_response(row)


@router.patch(
    "/seller/settlement/accounts/{account_id}",
    response_model=SettlementAccountResponse,
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def update_settlement_account(
    account_id: str,
    payload: UpsertSettlementAccountRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> SettlementAccountResponse:
    account_uuid = parse_uuid(account_id, "INVALID_SETTLEMENT_ACCOUNT_ID")
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    row = service.update_account(
        actor=actor,
        account_id=account_uuid,
        bank_name=payload.bank_name,
        account_number=payload.account_number,
        account_holder=payload.account_holder,
        is_primary=payload.is_primary,
    )
    return to_account_response(row)


@router.get(
    "/seller/settlement/records",
    response_model=list[SellerSettlementRecordResponse],
    dependencies=[Depends(require_roles(UserRole.SELLER))],
)
def list_my_settlement_records(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[SellerSettlementRecordResponse]:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    rows = service.list_my_records(actor=actor)
    return [
        SellerSettlementRecordResponse(
            vehicle_id=str(row.vehicle.id),
            vehicle_title=row.vehicle.title,
            winning_price=float(row.vehicle.winning_price or 0),
            currency=row.vehicle.currency,
            sold_at=row.vehicle.sold_at,
            status=row.status,
            settlement_due_at=row.settlement_due_at,
        )
        for row in rows
    ]


@router.get(
    "/admin/settlement/records",
    response_model=list[AdminSettlementRecordResponse],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def list_admin_settlement_records(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[AdminSettlementRecordResponse]:
    service = build_service(db)
    actor = service.get_actor(auth.user_id)
    rows = service.list_admin_records(actor=actor)
    return [
        AdminSettlementRecordResponse(
            vehicle_id=str(row.vehicle.id),
            vehicle_title=row.vehicle.title,
            seller_id=str(row.seller.id) if row.seller else None,
            seller_name=row.seller.full_name if row.seller else None,
            seller_email=row.seller.email if row.seller else None,
            winning_price=float(row.vehicle.winning_price or 0),
            currency=row.vehicle.currency,
            sold_at=row.vehicle.sold_at,
            status=row.status,
            settlement_due_at=row.settlement_due_at,
        )
        for row in rows
    ]
