from enum import Enum

class RequestStatusEnum(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    canceled = "canceled"
