from enum import Enum


class SettlementRecordStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
