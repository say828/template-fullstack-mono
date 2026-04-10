from datetime import datetime

from pydantic import BaseModel, Field

from contexts.settlement.domain.enums import SettlementRecordStatus


class SettlementAccountResponse(BaseModel):
    id: str
    bank_name: str
    account_number: str
    account_holder: str
    is_primary: bool
    created_at: datetime
    updated_at: datetime


class UpsertSettlementAccountRequest(BaseModel):
    bank_name: str = Field(min_length=2, max_length=60)
    account_number: str = Field(min_length=6, max_length=64)
    account_holder: str = Field(min_length=2, max_length=100)
    is_primary: bool = True


class SellerSettlementRecordResponse(BaseModel):
    vehicle_id: str
    vehicle_title: str
    winning_price: float
    currency: str
    sold_at: datetime | None
    status: SettlementRecordStatus
    settlement_due_at: datetime


class AdminSettlementRecordResponse(BaseModel):
    vehicle_id: str
    vehicle_title: str
    seller_id: str | None
    seller_name: str | None
    seller_email: str | None
    winning_price: float
    currency: str
    sold_at: datetime | None
    status: SettlementRecordStatus
    settlement_due_at: datetime
