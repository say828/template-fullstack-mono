from enum import Enum


class UserRole(str, Enum):
    SELLER = "SELLER"
    DEALER = "DEALER"
    ADMIN = "ADMIN"


class AccountStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class DealerApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
