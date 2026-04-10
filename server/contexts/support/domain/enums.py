from enum import Enum


class NoticeCategory(str, Enum):
    GENERAL = "GENERAL"
    SERVICE = "SERVICE"
    POLICY = "POLICY"
    EVENT = "EVENT"


class FaqCategory(str, Enum):
    GENERAL = "GENERAL"
    ACCOUNT = "ACCOUNT"
    BIDDING = "BIDDING"
    SETTLEMENT = "SETTLEMENT"
    DEALER = "DEALER"


class InquiryCategory(str, Enum):
    GENERAL = "GENERAL"
    ACCOUNT = "ACCOUNT"
    BIDDING = "BIDDING"
    SETTLEMENT = "SETTLEMENT"
    INSPECTION = "INSPECTION"
    DELIVER = "DELIVER"


class InquiryStatus(str, Enum):
    OPEN = "OPEN"
    ANSWERED = "ANSWERED"
    CLOSED = "CLOSED"


class NotificationType(str, Enum):
    SYSTEM = "SYSTEM"
    BID = "BID"
    SETTLEMENT = "SETTLEMENT"
    INSPECTION = "INSPECTION"
    SUPPORT = "SUPPORT"
