from typing import Protocol
from uuid import UUID

from contexts.identity.infrastructure.models import UserORM
from contexts.support.domain.enums import FaqCategory, InquiryCategory, InquiryStatus, NoticeCategory, NotificationType
from contexts.support.infrastructure.models import (
    FaqORM,
    InquiryAttachmentORM,
    InquiryORM,
    NotificationORM,
    NoticeORM,
)


class SupportRepositoryPort(Protocol):
    def list_notices(
        self,
        *,
        keyword: str | None,
        category: NoticeCategory | None,
        offset: int,
        limit: int,
    ) -> list[NoticeORM]: ...

    def create_notice(
        self,
        *,
        category: NoticeCategory,
        title: str,
        content: str,
        is_pinned: bool,
    ) -> NoticeORM: ...

    def get_notice(self, notice_id: UUID) -> NoticeORM | None: ...

    def save_notice(self, notice: NoticeORM) -> NoticeORM: ...

    def delete_notice(self, notice: NoticeORM) -> None: ...

    def list_faqs(
        self,
        *,
        keyword: str | None,
        category: FaqCategory | None,
        offset: int,
        limit: int,
    ) -> list[FaqORM]: ...

    def create_faq(
        self,
        *,
        category: FaqCategory,
        question: str,
        answer: str,
        sort_order: int,
        is_active: bool,
    ) -> FaqORM: ...

    def get_faq(self, faq_id: UUID) -> FaqORM | None: ...

    def list_all_faqs(
        self,
        *,
        keyword: str | None,
        category: FaqCategory | None,
        offset: int,
        limit: int,
    ) -> list[FaqORM]: ...

    def save_faq(self, faq: FaqORM) -> FaqORM: ...

    def delete_faq(self, faq: FaqORM) -> None: ...

    def list_user_inquiries(self, user_id: UUID, offset: int, limit: int) -> list[InquiryORM]: ...

    def list_all_inquiries(self, *, offset: int, limit: int) -> list[InquiryORM]: ...

    def get_inquiry(self, inquiry_id: UUID) -> InquiryORM | None: ...

    def list_inquiry_attachments(self, inquiry_id: UUID) -> list[InquiryAttachmentORM]: ...

    def get_inquiry_attachment(self, attachment_id: UUID) -> InquiryAttachmentORM | None: ...

    def create_inquiry(
        self,
        *,
        user_id: UUID,
        category: InquiryCategory,
        title: str,
        content: str,
        agreed_to_policy: bool,
    ) -> InquiryORM: ...

    def add_inquiry_attachment(
        self,
        *,
        inquiry_id: UUID,
        original_name: str,
        stored_path: str,
        content_type: str | None,
        size_bytes: int,
    ) -> InquiryAttachmentORM: ...

    def list_user_notifications(
        self,
        *,
        user_id: UUID,
        unread_only: bool,
        offset: int,
        limit: int,
    ) -> list[NotificationORM]: ...

    def get_user_notification(self, *, user_id: UUID, notification_id: UUID) -> NotificationORM | None: ...

    def mark_notification_read(self, notification: NotificationORM) -> NotificationORM: ...

    def mark_all_notifications_read(self, user_id: UUID) -> int: ...

    def create_notification(
        self,
        *,
        user_id: UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        meta_json: dict | None,
    ) -> NotificationORM: ...

    def save_inquiry(self, inquiry: InquiryORM) -> InquiryORM: ...

    def get_user(self, user_id: UUID) -> UserORM | None: ...

    def list_admin_users(self) -> list[UserORM]: ...

    def commit(self) -> None: ...

    def rollback(self) -> None: ...
