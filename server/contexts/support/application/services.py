from dataclasses import dataclass
from uuid import UUID

from contexts.support.domain.enums import FaqCategory, InquiryCategory, InquiryStatus, NotificationType, NoticeCategory
from contexts.support.domain.ports import SupportRepositoryPort
from contexts.support.infrastructure.models import FaqORM, InquiryAttachmentORM, InquiryORM, NotificationORM, NoticeORM
from contexts.support.infrastructure.storage import LocalSupportStorage
from shared.infrastructure.errors import AppError

MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024


@dataclass
class InquiryWithAttachments:
    inquiry: InquiryORM
    attachments: list[InquiryAttachmentORM]


class SupportService:
    def __init__(self, *, repo: SupportRepositoryPort, storage: LocalSupportStorage) -> None:
        self.repo = repo
        self.storage = storage

    def list_notices(
        self,
        *,
        keyword: str | None,
        category: NoticeCategory | None,
        offset: int,
        limit: int,
    ) -> list[NoticeORM]:
        return self.repo.list_notices(keyword=keyword, category=category, offset=offset, limit=limit)

    def get_notice(self, notice_id: UUID) -> NoticeORM:
        row = self.repo.get_notice(notice_id)
        if not row:
            raise AppError("공지사항을 찾을 수 없습니다.", 404, "NOTICE_NOT_FOUND")
        return row

    def update_notice(
        self,
        *,
        notice_id: UUID,
        category: NoticeCategory,
        title: str,
        content: str,
        is_pinned: bool,
    ) -> NoticeORM:
        row = self.get_notice(notice_id)
        if len(title.strip()) < 2:
            raise AppError("공지 제목은 2자 이상 입력해야 합니다.", 400, "NOTICE_TITLE_TOO_SHORT")
        if len(content.strip()) < 5:
            raise AppError("공지 내용은 5자 이상 입력해야 합니다.", 400, "NOTICE_CONTENT_TOO_SHORT")
        row.category = category
        row.title = title.strip()
        row.content = content.strip()
        row.is_pinned = is_pinned
        self.repo.save_notice(row)
        self.repo.commit()
        return row

    def delete_notice(self, *, notice_id: UUID) -> NoticeORM:
        row = self.get_notice(notice_id)
        self.repo.delete_notice(row)
        self.repo.commit()
        return row

    def list_faqs(
        self,
        *,
        keyword: str | None,
        category: FaqCategory | None,
        offset: int,
        limit: int,
    ) -> list[FaqORM]:
        return self.repo.list_faqs(keyword=keyword, category=category, offset=offset, limit=limit)

    def list_all_faqs(
        self,
        *,
        keyword: str | None,
        category: FaqCategory | None,
        offset: int,
        limit: int,
    ) -> list[FaqORM]:
        return self.repo.list_all_faqs(keyword=keyword, category=category, offset=offset, limit=limit)

    def get_faq(self, faq_id: UUID) -> FaqORM:
        row = self.repo.get_faq(faq_id)
        if not row:
            raise AppError("FAQ를 찾을 수 없습니다.", 404, "FAQ_NOT_FOUND")
        return row

    def update_faq(
        self,
        *,
        faq_id: UUID,
        category: FaqCategory,
        question: str,
        answer: str,
        sort_order: int,
        is_active: bool,
    ) -> FaqORM:
        row = self.get_faq(faq_id)
        if len(question.strip()) < 2:
            raise AppError("FAQ 질문은 2자 이상 입력해야 합니다.", 400, "FAQ_QUESTION_TOO_SHORT")
        if len(answer.strip()) < 2:
            raise AppError("FAQ 답변은 2자 이상 입력해야 합니다.", 400, "FAQ_ANSWER_TOO_SHORT")
        if sort_order < 1 or sort_order > 9999:
            raise AppError("정렬 순서는 1 이상 9999 이하이어야 합니다.", 400, "FAQ_SORT_ORDER_OUT_OF_RANGE")
        row.category = category
        row.question = question.strip()
        row.answer = answer.strip()
        row.sort_order = sort_order
        row.is_active = is_active
        self.repo.save_faq(row)
        self.repo.commit()
        return row

    def delete_faq(self, *, faq_id: UUID) -> FaqORM:
        row = self.get_faq(faq_id)
        self.repo.delete_faq(row)
        self.repo.commit()
        return row

    def submit_inquiry(
        self,
        *,
        user_id: UUID,
        category: InquiryCategory,
        title: str,
        content: str,
        agreed_to_policy: bool,
        attachments: list[tuple[str, str | None, bytes]],
    ) -> InquiryWithAttachments:
        user = self.repo.get_user(user_id)
        if not user:
            raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

        if not agreed_to_policy:
            raise AppError("필수 동의가 필요합니다.", 400, "INQUIRY_POLICY_NOT_AGREED")

        if len(title.strip()) < 2:
            raise AppError("문의 제목은 2자 이상 입력해야 합니다.", 400, "INQUIRY_TITLE_TOO_SHORT")

        if len(content.strip()) < 5:
            raise AppError("문의 내용은 5자 이상 입력해야 합니다.", 400, "INQUIRY_CONTENT_TOO_SHORT")

        inquiry = self.repo.create_inquiry(
            user_id=user_id,
            category=category,
            title=title,
            content=content,
            agreed_to_policy=agreed_to_policy,
        )

        saved_attachments: list[InquiryAttachmentORM] = []
        for original_name, content_type, raw in attachments:
            if len(raw) == 0:
                self.repo.rollback()
                raise AppError("빈 첨부 파일은 업로드할 수 없습니다.", 400, "EMPTY_ATTACHMENT")
            if len(raw) > MAX_ATTACHMENT_BYTES:
                self.repo.rollback()
                raise AppError("첨부 파일은 10MB 이하만 허용됩니다.", 400, "ATTACHMENT_TOO_LARGE")

            stored_path = self.storage.store_inquiry_attachment(
                inquiry_id=inquiry.id,
                filename=original_name or "attachment.bin",
                content=raw,
            )
            saved = self.repo.add_inquiry_attachment(
                inquiry_id=inquiry.id,
                original_name=original_name or "attachment.bin",
                stored_path=stored_path,
                content_type=content_type,
                size_bytes=len(raw),
            )
            saved_attachments.append(saved)

        admin_users = self.repo.list_admin_users()
        for admin in admin_users:
            self.repo.create_notification(
                user_id=admin.id,
                notification_type=NotificationType.SUPPORT,
                title="새 문의 접수",
                message=f"{user.full_name} 사용자의 문의가 접수되었습니다.",
                meta_json={"inquiry_id": str(inquiry.id), "category": category.value},
            )

        self.repo.create_notification(
            user_id=user.id,
            notification_type=NotificationType.SUPPORT,
            title="문의 접수 완료",
            message="문의가 접수되었습니다. 순차적으로 답변 드리겠습니다.",
            meta_json={"inquiry_id": str(inquiry.id)},
        )

        self.repo.commit()
        return InquiryWithAttachments(inquiry=inquiry, attachments=saved_attachments)

    def list_my_inquiries(self, *, user_id: UUID, offset: int, limit: int) -> list[InquiryWithAttachments]:
        user = self.repo.get_user(user_id)
        if not user:
            raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

        rows = self.repo.list_user_inquiries(user_id, offset, limit)
        result: list[InquiryWithAttachments] = []
        for row in rows:
            result.append(InquiryWithAttachments(inquiry=row, attachments=self.repo.list_inquiry_attachments(row.id)))
        return result

    def list_all_inquiries(self, *, offset: int, limit: int) -> list[InquiryWithAttachments]:
        rows = self.repo.list_all_inquiries(offset=offset, limit=limit)
        result: list[InquiryWithAttachments] = []
        for row in rows:
            result.append(InquiryWithAttachments(inquiry=row, attachments=self.repo.list_inquiry_attachments(row.id)))
        return result

    def get_inquiry(self, *, inquiry_id: UUID) -> InquiryWithAttachments:
        row = self.repo.get_inquiry(inquiry_id)
        if not row:
            raise AppError("문의를 찾을 수 없습니다.", 404, "INQUIRY_NOT_FOUND")
        return InquiryWithAttachments(inquiry=row, attachments=self.repo.list_inquiry_attachments(row.id))

    def get_inquiry_attachment(self, *, inquiry_id: UUID, attachment_id: UUID) -> InquiryAttachmentORM:
        bundle = self.get_inquiry(inquiry_id=inquiry_id)
        row = self.repo.get_inquiry_attachment(attachment_id)
        if not row or row.inquiry_id != bundle.inquiry.id:
            raise AppError("첨부 파일을 찾을 수 없습니다.", 404, "INQUIRY_ATTACHMENT_NOT_FOUND")
        return row

    def reply_to_inquiry(self, *, inquiry_id: UUID, admin_reply: str) -> InquiryWithAttachments:
        bundle = self.get_inquiry(inquiry_id=inquiry_id)
        if len(admin_reply.strip()) < 2:
            raise AppError("답변은 2자 이상 입력해야 합니다.", 400, "INQUIRY_REPLY_TOO_SHORT")

        bundle.inquiry.admin_reply = admin_reply.strip()
        bundle.inquiry.status = InquiryStatus.ANSWERED
        self.repo.save_inquiry(bundle.inquiry)
        self.repo.create_notification(
            user_id=bundle.inquiry.user_id,
            notification_type=NotificationType.SUPPORT,
            title="문의 답변 등록",
            message="운영팀이 문의에 답변을 등록했습니다.",
            meta_json={"inquiry_id": str(bundle.inquiry.id)},
        )
        self.repo.commit()
        return InquiryWithAttachments(
            inquiry=bundle.inquiry,
            attachments=self.repo.list_inquiry_attachments(bundle.inquiry.id),
        )

    def list_my_notifications(
        self,
        *,
        user_id: UUID,
        unread_only: bool,
        offset: int,
        limit: int,
    ) -> list[NotificationORM]:
        user = self.repo.get_user(user_id)
        if not user:
            raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")
        return self.repo.list_user_notifications(user_id=user_id, unread_only=unread_only, offset=offset, limit=limit)

    def mark_notification_read(self, *, user_id: UUID, notification_id: UUID) -> NotificationORM:
        row = self.repo.get_user_notification(user_id=user_id, notification_id=notification_id)
        if not row:
            raise AppError("알림을 찾을 수 없습니다.", 404, "NOTIFICATION_NOT_FOUND")
        updated = self.repo.mark_notification_read(row)
        self.repo.commit()
        return updated

    def mark_all_notifications_read(self, *, user_id: UUID) -> int:
        count = self.repo.mark_all_notifications_read(user_id)
        self.repo.commit()
        return count

    def ensure_seed_data(self) -> None:
        existing_notices = self.repo.list_notices(keyword=None, category=None, offset=0, limit=1)
        if not existing_notices:
            self.repo.create_notice(
                category=NoticeCategory.SERVICE,
                title="Template DEV 운영 안내",
                content="DEV 서비스 점검 및 기능 공지사항을 확인해 주세요.",
                is_pinned=True,
            )
            self.repo.create_notice(
                category=NoticeCategory.POLICY,
                title="개인정보 처리방침 개정 안내",
                content="정책 변경 사항이 반영되었습니다.",
                is_pinned=False,
            )

        existing_faqs = self.repo.list_faqs(keyword=None, category=None, offset=0, limit=1)
        if not existing_faqs:
            self.repo.create_faq(
                category=FaqCategory.ACCOUNT,
                question="비밀번호를 잊어버렸어요.",
                answer="로그인 화면의 비밀번호 찾기 기능을 이용해 주세요.",
                sort_order=10,
                is_active=True,
            )
            self.repo.create_faq(
                category=FaqCategory.BIDDING,
                question="입찰 취소는 언제까지 가능한가요?",
                answer="입찰 종료 전까지 취소할 수 있습니다.",
                sort_order=20,
                is_active=True,
            )

        self.repo.commit()
