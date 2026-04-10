from datetime import datetime

from pydantic import BaseModel, Field

from contexts.support.domain.enums import FaqCategory, InquiryCategory, InquiryStatus, NoticeCategory, NotificationType


class NoticeResponse(BaseModel):
    id: str
    category: NoticeCategory
    title: str
    content: str
    is_pinned: bool
    published_at: datetime
    created_at: datetime
    updated_at: datetime


class NoticeCreateRequest(BaseModel):
    category: NoticeCategory
    title: str = Field(min_length=2, max_length=200)
    content: str = Field(min_length=5, max_length=5000)
    is_pinned: bool = False


class NoticeUpdateRequest(NoticeCreateRequest):
    pass


class FaqResponse(BaseModel):
    id: str
    category: FaqCategory
    question: str
    answer: str
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class FaqCreateRequest(BaseModel):
    category: FaqCategory
    question: str = Field(min_length=2, max_length=240)
    answer: str = Field(min_length=2, max_length=5000)
    sort_order: int = Field(default=100, ge=1, le=9999)
    is_active: bool = True


class FaqUpdateRequest(FaqCreateRequest):
    pass


class InquiryAttachmentResponse(BaseModel):
    id: str
    original_name: str
    content_type: str | None
    size_bytes: int
    created_at: datetime
    download_url: str | None = None


class InquiryResponse(BaseModel):
    id: str
    category: InquiryCategory
    status: InquiryStatus
    title: str
    content: str
    admin_reply: str | None
    agreed_to_policy: bool
    created_at: datetime
    updated_at: datetime
    attachments: list[InquiryAttachmentResponse]


class AdminInquiryResponse(InquiryResponse):
    user_id: str
    user_email: str | None = None
    user_full_name: str | None = None
    user_role: str | None = None


class InquiryReplyRequest(BaseModel):
    admin_reply: str = Field(min_length=2, max_length=5000)


class NotificationResponse(BaseModel):
    id: str
    notification_type: NotificationType
    title: str
    message: str
    meta_json: dict | None
    read_at: datetime | None
    created_at: datetime


class MarkAllReadResponse(BaseModel):
    updated_count: int = Field(ge=0)


class DeleteResponse(BaseModel):
    deleted_id: str
