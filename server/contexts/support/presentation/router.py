from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from api.dependencies import AuthContext, get_current_user, require_roles
from contexts.identity.domain.enums import UserRole
from contexts.support.application.services import SupportService
from contexts.support.domain.enums import FaqCategory, InquiryCategory, NoticeCategory
from contexts.support.infrastructure.repository import SqlAlchemySupportRepository
from contexts.support.infrastructure.storage import LocalSupportStorage
from contexts.support.presentation.schemas import (
    AdminInquiryResponse,
    DeleteResponse,
    FaqCreateRequest,
    FaqResponse,
    FaqUpdateRequest,
    InquiryAttachmentResponse,
    InquiryReplyRequest,
    InquiryResponse,
    MarkAllReadResponse,
    NoticeCreateRequest,
    NoticeResponse,
    NoticeUpdateRequest,
    NotificationResponse,
)
from shared.infrastructure.database import get_db_session
from shared.infrastructure.errors import AppError

router = APIRouter(tags=["support"])


def parse_uuid(raw: str, code: str) -> UUID:
    try:
        return UUID(raw)
    except ValueError as exc:
        raise AppError("유효하지 않은 ID입니다.", 400, code) from exc


def build_service(db: Session) -> SupportService:
    return SupportService(repo=SqlAlchemySupportRepository(db), storage=LocalSupportStorage())


def to_notice_response(row) -> NoticeResponse:
    return NoticeResponse(
        id=str(row.id),
        category=row.category,
        title=row.title,
        content=row.content,
        is_pinned=row.is_pinned,
        published_at=row.published_at,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def to_faq_response(row) -> FaqResponse:
    return FaqResponse(
        id=str(row.id),
        category=row.category,
        question=row.question,
        answer=row.answer,
        sort_order=row.sort_order,
        is_active=row.is_active,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def to_inquiry_response(bundle, *, admin_download_prefix: str | None = None) -> InquiryResponse:
    return InquiryResponse(
        id=str(bundle.inquiry.id),
        category=bundle.inquiry.category,
        status=bundle.inquiry.status,
        title=bundle.inquiry.title,
        content=bundle.inquiry.content,
        admin_reply=bundle.inquiry.admin_reply,
        agreed_to_policy=bundle.inquiry.agreed_to_policy,
        created_at=bundle.inquiry.created_at,
        updated_at=bundle.inquiry.updated_at,
        attachments=[
            InquiryAttachmentResponse(
                id=str(row.id),
                original_name=row.original_name,
                content_type=row.content_type,
                size_bytes=row.size_bytes,
                created_at=row.created_at,
                download_url=f"{admin_download_prefix}/{row.id}/download" if admin_download_prefix else None,
            )
            for row in bundle.attachments
        ],
    )


def to_admin_inquiry_response(bundle, user) -> AdminInquiryResponse:
    return AdminInquiryResponse(
        **to_inquiry_response(
            bundle,
            admin_download_prefix=f"/admin/support/inquiries/{bundle.inquiry.id}/attachments",
        ).model_dump(),
        user_id=str(bundle.inquiry.user_id),
        user_email=user.email if user else None,
        user_full_name=user.full_name if user else None,
        user_role=user.role.value if user and user.role else None,
    )


def to_notification_response(row) -> NotificationResponse:
    return NotificationResponse(
        id=str(row.id),
        notification_type=row.notification_type,
        title=row.title,
        message=row.message,
        meta_json=row.meta_json,
        read_at=row.read_at,
        created_at=row.created_at,
    )


@router.get("/support/notices", response_model=list[NoticeResponse])
def list_notices(
    keyword: str | None = Query(default=None, min_length=1, max_length=120),
    category: NoticeCategory | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db_session),
) -> list[NoticeResponse]:
    rows = build_service(db).list_notices(keyword=keyword, category=category, offset=offset, limit=limit)
    return [to_notice_response(row) for row in rows]


@router.get("/support/notices/{notice_id}", response_model=NoticeResponse)
def get_notice(notice_id: str, db: Session = Depends(get_db_session)) -> NoticeResponse:
    notice_uuid = parse_uuid(notice_id, "INVALID_NOTICE_ID")
    row = build_service(db).get_notice(notice_uuid)
    return to_notice_response(row)


@router.get("/support/faqs", response_model=list[FaqResponse])
def list_faqs(
    keyword: str | None = Query(default=None, min_length=1, max_length=120),
    category: FaqCategory | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db_session),
) -> list[FaqResponse]:
    rows = build_service(db).list_faqs(keyword=keyword, category=category, offset=offset, limit=limit)
    return [to_faq_response(row) for row in rows]


@router.get(
    "/admin/support/faqs",
    response_model=list[FaqResponse],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def list_admin_faqs(
    keyword: str | None = Query(default=None, min_length=1, max_length=120),
    category: FaqCategory | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[FaqResponse]:
    _ = auth
    rows = build_service(db).list_all_faqs(keyword=keyword, category=category, offset=offset, limit=limit)
    return [to_faq_response(row) for row in rows]


@router.post("/support/inquiries", response_model=InquiryResponse)
def submit_inquiry(
    category: InquiryCategory = Form(...),
    title: str = Form(..., min_length=2, max_length=200),
    content: str = Form(..., min_length=5, max_length=5000),
    agreed_to_policy: bool = Form(...),
    attachments: list[UploadFile] = File(default=[]),
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> InquiryResponse:
    file_payloads: list[tuple[str, str | None, bytes]] = []
    for row in attachments:
        raw = row.file.read()
        file_payloads.append((row.filename or "attachment.bin", row.content_type, raw))

    bundle = build_service(db).submit_inquiry(
        user_id=auth.user_id,
        category=category,
        title=title,
        content=content,
        agreed_to_policy=agreed_to_policy,
        attachments=file_payloads,
    )
    return to_inquiry_response(bundle)


@router.get("/support/inquiries/me", response_model=list[InquiryResponse])
def list_my_inquiries(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[InquiryResponse]:
    rows = build_service(db).list_my_inquiries(user_id=auth.user_id, offset=offset, limit=limit)
    return [to_inquiry_response(row) for row in rows]


@router.get("/support/notifications/me", response_model=list[NotificationResponse])
def list_my_notifications(
    unread_only: bool = Query(default=False),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=30, ge=1, le=100),
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[NotificationResponse]:
    rows = build_service(db).list_my_notifications(
        user_id=auth.user_id,
        unread_only=unread_only,
        offset=offset,
        limit=limit,
    )
    return [to_notification_response(row) for row in rows]


@router.post("/support/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> NotificationResponse:
    notification_uuid = parse_uuid(notification_id, "INVALID_NOTIFICATION_ID")
    row = build_service(db).mark_notification_read(user_id=auth.user_id, notification_id=notification_uuid)
    return to_notification_response(row)


@router.post("/support/notifications/read-all", response_model=MarkAllReadResponse)
def mark_all_notifications_read(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> MarkAllReadResponse:
    count = build_service(db).mark_all_notifications_read(user_id=auth.user_id)
    return MarkAllReadResponse(updated_count=count)


@router.post(
    "/admin/support/notices",
    response_model=NoticeResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def create_notice(
    payload: NoticeCreateRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> NoticeResponse:
    _ = auth
    repo = SqlAlchemySupportRepository(db)
    row = repo.create_notice(
        category=payload.category,
        title=payload.title,
        content=payload.content,
        is_pinned=payload.is_pinned,
    )
    repo.commit()
    return to_notice_response(row)


@router.patch(
    "/admin/support/notices/{notice_id}",
    response_model=NoticeResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def update_notice(
    notice_id: str,
    payload: NoticeUpdateRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> NoticeResponse:
    _ = auth
    notice_uuid = parse_uuid(notice_id, "INVALID_NOTICE_ID")
    row = build_service(db).update_notice(
        notice_id=notice_uuid,
        category=payload.category,
        title=payload.title,
        content=payload.content,
        is_pinned=payload.is_pinned,
    )
    return to_notice_response(row)


@router.delete(
    "/admin/support/notices/{notice_id}",
    response_model=DeleteResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def delete_notice(
    notice_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DeleteResponse:
    _ = auth
    notice_uuid = parse_uuid(notice_id, "INVALID_NOTICE_ID")
    row = build_service(db).delete_notice(notice_id=notice_uuid)
    return DeleteResponse(deleted_id=str(row.id))


@router.post(
    "/admin/support/faqs",
    response_model=FaqResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def create_faq(
    payload: FaqCreateRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> FaqResponse:
    _ = auth
    repo = SqlAlchemySupportRepository(db)
    row = repo.create_faq(
        category=payload.category,
        question=payload.question,
        answer=payload.answer,
        sort_order=payload.sort_order,
        is_active=payload.is_active,
    )
    repo.commit()
    return to_faq_response(row)


@router.patch(
    "/admin/support/faqs/{faq_id}",
    response_model=FaqResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def update_faq(
    faq_id: str,
    payload: FaqUpdateRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> FaqResponse:
    _ = auth
    faq_uuid = parse_uuid(faq_id, "INVALID_FAQ_ID")
    row = build_service(db).update_faq(
        faq_id=faq_uuid,
        category=payload.category,
        question=payload.question,
        answer=payload.answer,
        sort_order=payload.sort_order,
        is_active=payload.is_active,
    )
    return to_faq_response(row)


@router.delete(
    "/admin/support/faqs/{faq_id}",
    response_model=DeleteResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def delete_faq(
    faq_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DeleteResponse:
    _ = auth
    faq_uuid = parse_uuid(faq_id, "INVALID_FAQ_ID")
    row = build_service(db).delete_faq(faq_id=faq_uuid)
    return DeleteResponse(deleted_id=str(row.id))


@router.get(
    "/admin/support/inquiries",
    response_model=list[AdminInquiryResponse],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def list_admin_inquiries(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[AdminInquiryResponse]:
    _ = auth
    service = build_service(db)
    rows = service.list_all_inquiries(offset=offset, limit=limit)
    repo = SqlAlchemySupportRepository(db)
    return [to_admin_inquiry_response(bundle, repo.get_user(bundle.inquiry.user_id)) for bundle in rows]


@router.get(
    "/admin/support/inquiries/{inquiry_id}",
    response_model=AdminInquiryResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def get_admin_inquiry(
    inquiry_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> AdminInquiryResponse:
    _ = auth
    inquiry_uuid = parse_uuid(inquiry_id, "INVALID_INQUIRY_ID")
    service = build_service(db)
    bundle = service.get_inquiry(inquiry_id=inquiry_uuid)
    repo = SqlAlchemySupportRepository(db)
    return to_admin_inquiry_response(bundle, repo.get_user(bundle.inquiry.user_id))


@router.get(
    "/admin/support/inquiries/{inquiry_id}/attachments/{attachment_id}/download",
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def download_admin_inquiry_attachment(
    inquiry_id: str,
    attachment_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> FileResponse:
    _ = auth
    inquiry_uuid = parse_uuid(inquiry_id, "INVALID_INQUIRY_ID")
    attachment_uuid = parse_uuid(attachment_id, "INVALID_INQUIRY_ATTACHMENT_ID")
    service = build_service(db)
    attachment = service.get_inquiry_attachment(inquiry_id=inquiry_uuid, attachment_id=attachment_uuid)
    try:
        path = service.storage.resolve_inquiry_attachment(attachment.stored_path)
    except FileNotFoundError as exc:
        raise AppError("첨부 파일을 찾을 수 없습니다.", 404, "INQUIRY_ATTACHMENT_FILE_NOT_FOUND") from exc
    return FileResponse(
        path=path,
        media_type=attachment.content_type or "application/octet-stream",
        filename=attachment.original_name,
    )


@router.post(
    "/admin/support/inquiries/{inquiry_id}/reply",
    response_model=AdminInquiryResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def reply_admin_inquiry(
    inquiry_id: str,
    payload: InquiryReplyRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> AdminInquiryResponse:
    _ = auth
    inquiry_uuid = parse_uuid(inquiry_id, "INVALID_INQUIRY_ID")
    service = build_service(db)
    bundle = service.reply_to_inquiry(inquiry_id=inquiry_uuid, admin_reply=payload.admin_reply)
    repo = SqlAlchemySupportRepository(db)
    return to_admin_inquiry_response(bundle, repo.get_user(bundle.inquiry.user_id))
