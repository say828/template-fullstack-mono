from enum import Enum


class BidStatus(str, Enum):
    ACTIVE = "ACTIVE"
    CANCELLED = "CANCELLED"
    WON = "WON"
    LOST = "LOST"


class ListingBidState(str, Enum):
    OPEN = "OPEN"
    CLOSING_SOON = "CLOSING_SOON"
    CLOSED = "CLOSED"


class ListingSort(str, Enum):
    NEWEST = "NEWEST"
    HIGHEST_BID = "HIGHEST_BID"
    LOWEST_BID = "LOWEST_BID"
    MOST_BIDS = "MOST_BIDS"
