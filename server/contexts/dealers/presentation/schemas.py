from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from contexts.dealers.domain.enums import DealerDocumentType
from contexts.identity.domain.enums import DealerApprovalStatus, UserRole


class DealerRegistrationResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    dealer_status: DealerApprovalStatus


class PendingDealerResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    phone: str | None = None
    country: str | None = None
    business_number: str | None = None
    dealer_status: DealerApprovalStatus


class DealerRejectRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


class DealerDocumentMetaResponse(BaseModel):
    id: str
    doc_type: DealerDocumentType
    original_name: str
    content_type: str | None = None
    size_bytes: int
    created_at: datetime


class DealerDetailResponse(PendingDealerResponse):
    account_status: str
    dealer_rejection_reason: str | None = None
    created_at: datetime
    documents: list[DealerDocumentMetaResponse]
