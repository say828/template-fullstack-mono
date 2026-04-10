from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import or_, select, update
from sqlalchemy.orm import Session

from contexts.identity.domain.enums import UserRole
from contexts.identity.infrastructure.models import UserORM
from contexts.support.domain.enums import FaqCategory, InquiryCategory, NoticeCategory, NotificationType
from contexts.support.domain.ports import SupportRepositoryPort
from contexts.support.infrastructure.models import (
    FaqORM,
    InquiryAttachmentORM,
    InquiryORM,
    NotificationORM,
    NoticeORM,
)


class SqlAlchemySupportRepository(SupportRepositoryPort):
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_notice(
        self,
        *,
        category: NoticeCategory,
        title: str,
        content: str,
        is_pinned: bool,
    ) -> NoticeORM:
        row = NoticeORM(category=category, title=title.strip(), content=content.strip(), is_pinned=is_pinned)
        self.db.add(row)
        self.db.flush()
        return row

    def list_notices(
        self,
        *,
        keyword: str | None,
        category: NoticeCategory | None,
        offset: int,
        limit: int,
    ) -> list[NoticeORM]:
        stmt = select(NoticeORM)
        if category is not None:
            stmt = stmt.where(NoticeORM.category == category)
        if keyword:
            term = f"%{keyword.strip()}%"
            stmt = stmt.where(or_(NoticeORM.title.ilike(term), NoticeORM.content.ilike(term)))
        stmt = stmt.order_by(NoticeORM.is_pinned.desc(), NoticeORM.published_at.desc())
        return list(self.db.scalars(stmt.offset(offset).limit(limit)).all())

    def get_notice(self, notice_id: UUID) -> NoticeORM | None:
        stmt = select(NoticeORM).where(NoticeORM.id == notice_id)
        return self.db.scalar(stmt)

    def save_notice(self, notice: NoticeORM) -> NoticeORM:
        self.db.add(notice)
        self.db.flush()
        return notice

    def delete_notice(self, notice: NoticeORM) -> None:
        self.db.delete(notice)
        self.db.flush()

    def list_faqs(
        self,
        *,
        keyword: str | None,
        category: FaqCategory | None,
        offset: int,
        limit: int,
    ) -> list[FaqORM]:
        stmt = select(FaqORM).where(FaqORM.is_active.is_(True))
        if category is not None:
            stmt = stmt.where(FaqORM.category == category)
        if keyword:
            term = f"%{keyword.strip()}%"
            stmt = stmt.where(or_(FaqORM.question.ilike(term), FaqORM.answer.ilike(term)))
        stmt = stmt.order_by(FaqORM.sort_order.asc(), FaqORM.created_at.desc())
        return list(self.db.scalars(stmt.offset(offset).limit(limit)).all())

    def list_all_faqs(
        self,
        *,
        keyword: str | None,
        category: FaqCategory | None,
        offset: int,
        limit: int,
    ) -> list[FaqORM]:
        stmt = select(FaqORM)
        if category is not None:
            stmt = stmt.where(FaqORM.category == category)
        if keyword:
            term = f"%{keyword.strip()}%"
            stmt = stmt.where(or_(FaqORM.question.ilike(term), FaqORM.answer.ilike(term)))
        stmt = stmt.order_by(FaqORM.sort_order.asc(), FaqORM.created_at.desc())
        return list(self.db.scalars(stmt.offset(offset).limit(limit)).all())

    def create_faq(
        self,
        *,
        category: FaqCategory,
        question: str,
        answer: str,
        sort_order: int,
        is_active: bool,
    ) -> FaqORM:
        row = FaqORM(
            category=category,
            question=question.strip(),
            answer=answer.strip(),
            sort_order=sort_order,
            is_active=is_active,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def get_faq(self, faq_id: UUID) -> FaqORM | None:
        stmt = select(FaqORM).where(FaqORM.id == faq_id)
        return self.db.scalar(stmt)

    def save_faq(self, faq: FaqORM) -> FaqORM:
        self.db.add(faq)
        self.db.flush()
        return faq

    def delete_faq(self, faq: FaqORM) -> None:
        self.db.delete(faq)
        self.db.flush()

    def list_user_inquiries(self, user_id: UUID, offset: int, limit: int) -> list[InquiryORM]:
        stmt = (
            select(InquiryORM)
            .where(InquiryORM.user_id == user_id)
            .order_by(InquiryORM.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def list_all_inquiries(self, *, offset: int, limit: int) -> list[InquiryORM]:
        stmt = select(InquiryORM).order_by(InquiryORM.created_at.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).all())

    def get_inquiry(self, inquiry_id: UUID) -> InquiryORM | None:
        stmt = select(InquiryORM).where(InquiryORM.id == inquiry_id)
        return self.db.scalar(stmt)

    def list_inquiry_attachments(self, inquiry_id: UUID) -> list[InquiryAttachmentORM]:
        stmt = (
            select(InquiryAttachmentORM)
            .where(InquiryAttachmentORM.inquiry_id == inquiry_id)
            .order_by(InquiryAttachmentORM.created_at.asc())
        )
        return list(self.db.scalars(stmt).all())

    def get_inquiry_attachment(self, attachment_id: UUID) -> InquiryAttachmentORM | None:
        stmt = select(InquiryAttachmentORM).where(InquiryAttachmentORM.id == attachment_id)
        return self.db.scalar(stmt)

    def create_inquiry(
        self,
        *,
        user_id: UUID,
        category: InquiryCategory,
        title: str,
        content: str,
        agreed_to_policy: bool,
    ) -> InquiryORM:
        row = InquiryORM(
            user_id=user_id,
            category=category,
            title=title.strip(),
            content=content.strip(),
            agreed_to_policy=agreed_to_policy,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def add_inquiry_attachment(
        self,
        *,
        inquiry_id: UUID,
        original_name: str,
        stored_path: str,
        content_type: str | None,
        size_bytes: int,
    ) -> InquiryAttachmentORM:
        row = InquiryAttachmentORM(
            inquiry_id=inquiry_id,
            original_name=original_name,
            stored_path=stored_path,
            content_type=content_type,
            size_bytes=size_bytes,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def list_user_notifications(
        self,
        *,
        user_id: UUID,
        unread_only: bool,
        offset: int,
        limit: int,
    ) -> list[NotificationORM]:
        stmt = select(NotificationORM).where(NotificationORM.user_id == user_id)
        if unread_only:
            stmt = stmt.where(NotificationORM.read_at.is_(None))
        stmt = stmt.order_by(NotificationORM.created_at.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).all())

    def get_user_notification(self, *, user_id: UUID, notification_id: UUID) -> NotificationORM | None:
        stmt = select(NotificationORM).where(NotificationORM.id == notification_id, NotificationORM.user_id == user_id)
        return self.db.scalar(stmt)

    def mark_notification_read(self, notification: NotificationORM) -> NotificationORM:
        if notification.read_at is None:
            notification.read_at = datetime.now(timezone.utc)
            self.db.add(notification)
            self.db.flush()
        return notification

    def mark_all_notifications_read(self, user_id: UUID) -> int:
        stmt = (
            update(NotificationORM)
            .where(NotificationORM.user_id == user_id, NotificationORM.read_at.is_(None))
            .values(read_at=datetime.now(timezone.utc))
        )
        res = self.db.execute(stmt)
        return int(res.rowcount or 0)

    def create_notification(
        self,
        *,
        user_id: UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        meta_json: dict | None,
    ) -> NotificationORM:
        row = NotificationORM(
            user_id=user_id,
            notification_type=notification_type,
            title=title.strip(),
            message=message.strip(),
            meta_json=meta_json,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def save_inquiry(self, inquiry: InquiryORM) -> InquiryORM:
        self.db.add(inquiry)
        self.db.flush()
        return inquiry

    def get_user(self, user_id: UUID) -> UserORM | None:
        stmt = select(UserORM).where(UserORM.id == user_id)
        return self.db.scalar(stmt)

    def list_admin_users(self) -> list[UserORM]:
        stmt = select(UserORM).where(UserORM.role == UserRole.ADMIN)
        return list(self.db.scalars(stmt).all())

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
