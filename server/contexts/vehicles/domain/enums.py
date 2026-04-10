from enum import Enum


class VehicleStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SOLD = "SOLD"
    CANCELLED = "CANCELLED"


class FuelType(str, Enum):
    GASOLINE = "GASOLINE"
    DIESEL = "DIESEL"
    HYBRID = "HYBRID"
    EV = "EV"


class TransmissionType(str, Enum):
    AUTO = "AUTO"
    MANUAL = "MANUAL"
    DCT = "DCT"


class TransactionType(str, Enum):
    DOMESTIC = "DOMESTIC"
    EXPORT = "EXPORT"
