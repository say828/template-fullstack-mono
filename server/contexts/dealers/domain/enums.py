from enum import Enum


class DealerDocumentType(str, Enum):
    BUSINESS_LICENSE = "BUSINESS_LICENSE"
    DEALER_LICENSE = "DEALER_LICENSE"
    ID_CARD = "ID_CARD"
