from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, Query, Response, Request
from fastapi.responses import FileResponse
from pydantic import EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.dependencies import AuthContext, get_current_user, require_roles
from contexts.dealers.application.services import DealerAdminService, DealerOnboardingService
from contexts.dealers.infrastructure.models import DealerDocumentORM
from contexts.dealers.infrastructure.repository import SqlAlchemyDealerDocumentRepository
from contexts.dealers.infrastructure.storage import LocalDocumentStorage
from contexts.dealers.presentation.schemas import (
    DealerDetailResponse,
    DealerDocumentMetaResponse,
    DealerRegistrationResponse,
    DealerRejectRequest,
    PendingDealerResponse,
)
from contexts.identity.domain.enums import UserRole
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository
from shared.infrastructure.database import get_db_session
from shared.domain.normalizers import normalize_dealer_status
from shared.http.pagination import build_pagination_links
from shared.infrastructure.errors import AppError

router = APIRouter(tags=["dealers"])



def to_pending_dealer_response(user) -> PendingDealerResponse:
    return PendingDealerResponse(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        country=user.country,
        business_number=user.business_number,
        dealer_status=normalize_dealer_status(user.dealer_status),
    )


@router.post("/dealers/register", response_model=DealerRegistrationResponse)
def register_dealer(
    full_name: str = Form(...),
    email: EmailStr = Form(...),
    password: str = Form(..., min_length=8, max_length=128),
    phone: str = Form(...),
    country: str = Form(...),
    business_number: str = Form(...),
    business_license: UploadFile = File(...),
    dealer_license: UploadFile = File(...),
    id_card: UploadFile = File(...),
    db: Session = Depends(get_db_session),
) -> DealerRegistrationResponse:
    service = DealerOnboardingService(
        user_repo=SqlAlchemyUserRepository(db),
        doc_repo=SqlAlchemyDealerDocumentRepository(db),
        storage=LocalDocumentStorage(),
    )
    try:
        user = service.register_dealer(
            full_name=full_name,
            email=str(email),
            password=password,
            phone=phone,
            country=country,
            business_number=business_number,
            business_license=business_license,
            dealer_license=dealer_license,
            id_card=id_card,
        )
    except ValueError as exc:
        raise AppError(str(exc), 400, "BAD_REQUEST") from exc

    return DealerRegistrationResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        dealer_status=normalize_dealer_status(user.dealer_status),
    )


@router.get(
    "/admin/dealers/pending",
    response_model=list[PendingDealerResponse],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def list_pending_dealers(
    request: Request,
    response: Response,
    offset: int = Query(0, ge=0, description="Zero-based offset"),
    limit: int = Query(20, ge=1, le=100, description="Page size (1-100)"),
    q: str | None = Query(None, description="검색어(이름/이메일/전화/사업자번호)"),
    created_from: str | None = Query(None, description="생성일 시작 (ISO8601)"),
    created_to: str | None = Query(None, description="생성일 종료 (ISO8601, 날짜만이면 당일 종료로 처리)"),
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[PendingDealerResponse]:
    _ = auth
    repo = SqlAlchemyUserRepository(db)
    service = DealerAdminService(user_repo=repo)
    users, total = service.list_pending_dealers_paginated(
        offset=offset,
        limit=limit,
        q=q,
        created_from=created_from,
        created_to=created_to,
    )

    # Set pagination headers (totals reflect filtered set)
    response.headers["X-Total-Count"] = str(total)
    next_offset = offset + limit if (offset + limit) < total else None
    response.headers["X-Next-Offset"] = str(next_offset) if next_offset is not None else ""

    # Build a single RFC 8288 Link header using shared helper
    link_value = build_pagination_links(
        request.url, offset=offset, limit=limit, total=total
    )
    if link_value:
        response.headers["Link"] = link_value

    return [to_pending_dealer_response(user) for user in users]


@router.get(
    "/admin/dealers/{dealer_id}",
    response_model=DealerDetailResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def get_dealer_detail(
    dealer_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DealerDetailResponse:
    _ = auth
    try:
        dealer_uuid = UUID(dealer_id)
    except ValueError as exc:
        raise AppError("유효하지 않은 딜러 ID입니다.", 400, "INVALID_DEALER_ID") from exc
    # ADM_043: pending-only detail view
    admin_service = DealerAdminService(user_repo=SqlAlchemyUserRepository(db))
    dealer = admin_service.get_pending_dealer_by_id(dealer_uuid)

    doc_stmt = (
        select(DealerDocumentORM)
        .where(DealerDocumentORM.dealer_id == dealer_uuid)
        .order_by(DealerDocumentORM.created_at.asc())
    )
    documents = list(db.scalars(doc_stmt).all())

    return DealerDetailResponse(
        **to_pending_dealer_response(dealer).model_dump(),
        account_status=dealer.account_status.value,
        dealer_rejection_reason=dealer.dealer_rejection_reason,
        created_at=dealer.created_at,
        documents=[
            DealerDocumentMetaResponse(
                id=str(doc.id),
                doc_type=doc.doc_type,
                original_name=doc.original_name,
                content_type=doc.content_type,
                size_bytes=doc.size_bytes,
                created_at=doc.created_at,
            )
            for doc in documents
        ],
    )


@router.post(
    "/admin/dealers/{dealer_id}/approve",
    response_model=PendingDealerResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def approve_dealer(
    dealer_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> PendingDealerResponse:
    _ = auth
    try:
        dealer_uuid = UUID(dealer_id)
    except ValueError as exc:
        raise AppError("유효하지 않은 딜러 ID입니다.", 400, "INVALID_DEALER_ID") from exc
    repo = SqlAlchemyUserRepository(db)
    dealer = repo.get_user_by_id(dealer_uuid)
    if not dealer:
        raise AppError("딜러 계정을 찾을 수 없습니다.", 404, "DEALER_NOT_FOUND")

    service = DealerAdminService(user_repo=repo)
    updated = service.approve_dealer(dealer)
    return to_pending_dealer_response(updated)


@router.post(
    "/admin/dealers/{dealer_id}/reject",
    response_model=PendingDealerResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def reject_dealer(
    dealer_id: str,
    payload: DealerRejectRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> PendingDealerResponse:
    _ = auth
    try:
        dealer_uuid = UUID(dealer_id)
    except ValueError as exc:
        raise AppError("유효하지 않은 딜러 ID입니다.", 400, "INVALID_DEALER_ID") from exc
    repo = SqlAlchemyUserRepository(db)
    dealer = repo.get_user_by_id(dealer_uuid)
    if not dealer:
        raise AppError("딜러 계정을 찾을 수 없습니다.", 404, "DEALER_NOT_FOUND")

    service = DealerAdminService(user_repo=repo)
    updated = service.reject_dealer(dealer, payload.reason)
    return to_pending_dealer_response(updated)



@router.get(
    "/admin/dealers/{dealer_id}/documents/{document_id}/download",
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def download_admin_dealer_document(
    dealer_id: str,
    document_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> FileResponse:
    _ = auth
    try:
        dealer_uuid = UUID(dealer_id)
        document_uuid = UUID(document_id)
    except ValueError as exc:
        raise AppError("유효하지 않은 식별자입니다.", 400, "INVALID_IDENTIFIER") from exc

    stmt = select(DealerDocumentORM).where(DealerDocumentORM.id == document_uuid)
    row = db.scalars(stmt).first()
    if not row or row.dealer_id != dealer_uuid:
        # Hide existence when dealer/doc mismatch
        raise AppError("딜러 문서를 찾을 수 없습니다.", 404, "DEALER_DOCUMENT_NOT_FOUND")

    storage = LocalDocumentStorage()
    try:
        path = storage.resolve_document(row.stored_path)
    except FileNotFoundError as exc:
        raise AppError("문서 파일을 찾을 수 없습니다.", 404, "DEALER_DOCUMENT_FILE_NOT_FOUND") from exc

    resp = FileResponse(path=path, media_type=row.content_type or "application/octet-stream")
    resp.headers["Content-Disposition"] = f'attachment; filename="{row.original_name}"'
    return resp


@router.get(
    "/admin/dealers/{dealer_id}/documents/{document_id}/preview",
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def preview_admin_dealer_document(
    dealer_id: str,
    document_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> FileResponse:
    _ = auth
    try:
        dealer_uuid = UUID(dealer_id)
        document_uuid = UUID(document_id)
    except ValueError as exc:
        raise AppError("유효하지 않은 식별자입니다.", 400, "INVALID_IDENTIFIER") from exc

    stmt = select(DealerDocumentORM).where(DealerDocumentORM.id == document_uuid)
    row = db.scalars(stmt).first()
    if not row or row.dealer_id != dealer_uuid:
        raise AppError("딜러 문서를 찾을 수 없습니다.", 404, "DEALER_DOCUMENT_NOT_FOUND")

    storage = LocalDocumentStorage()
    try:
        path = storage.resolve_document(row.stored_path)
    except FileNotFoundError as exc:
        raise AppError("문서 파일을 찾을 수 없습니다.", 404, "DEALER_DOCUMENT_FILE_NOT_FOUND") from exc

    resp = FileResponse(path=path, media_type=row.content_type or "application/octet-stream")
    resp.headers["Content-Disposition"] = f'inline; filename="{row.original_name}"'
    return resp
