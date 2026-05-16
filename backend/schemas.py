from __future__ import annotations
from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Generic response wrapper
# ---------------------------------------------------------------------------

class ApiResponse(BaseModel):
    data: Any = None
    message: str = "success"


# ---------------------------------------------------------------------------
# Role
# ---------------------------------------------------------------------------

class RoleOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role_id: int
    role: Optional[RoleOut] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserShort(BaseModel):
    id: int
    name: str
    email: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Complaint History
# ---------------------------------------------------------------------------

class ComplaintHistoryOut(BaseModel):
    id: int
    complaint_id: int
    updated_by: Optional[UserShort] = None
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None


class FeedbackOut(BaseModel):
    id: int
    complaint_id: int
    customer_id: int
    rating: int
    comments: Optional[str] = None
    submitted_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Attachment
# ---------------------------------------------------------------------------

class AttachmentOut(BaseModel):
    id: int
    complaint_id: int
    filename: str
    file_path: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Complaint
# ---------------------------------------------------------------------------

VALID_PRIORITIES = {"low", "medium", "high", "critical"}
VALID_STATUSES = {
    "open", "assigned", "in_progress", "pending_customer_response",
    "escalated", "resolved", "closed"
}


class ComplaintCreate(BaseModel):
    category_id: Optional[int] = None
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10)
    priority: str = Field(default="medium")

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v not in VALID_PRIORITIES:
            raise ValueError(f"priority must be one of {VALID_PRIORITIES}")
        return v


class ComplaintUpdate(BaseModel):
    category_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None

    @field_validator("priority", mode="before")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_PRIORITIES:
            raise ValueError(f"priority must be one of {VALID_PRIORITIES}")
        return v


class AssignRequest(BaseModel):
    agent_id: int


class StatusUpdateRequest(BaseModel):
    status: str
    comment: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class EscalateRequest(BaseModel):
    comment: Optional[str] = None


class ComplaintOut(BaseModel):
    id: int
    complaint_number: str
    customer_id: int
    customer: Optional[UserShort] = None
    category_id: Optional[int] = None
    category: Optional[CategoryOut] = None
    title: str
    description: str
    priority: str
    status: str
    assigned_agent_id: Optional[int] = None
    assigned_agent: Optional[UserShort] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    sla_deadline: Optional[datetime] = None
    history: List[ComplaintHistoryOut] = []
    attachments: List[AttachmentOut] = []

    model_config = {"from_attributes": True}


class ComplaintListOut(BaseModel):
    id: int
    complaint_number: str
    customer_id: int
    customer: Optional[UserShort] = None
    category_id: Optional[int] = None
    category: Optional[CategoryOut] = None
    title: str
    priority: str
    status: str
    assigned_agent_id: Optional[int] = None
    assigned_agent: Optional[UserShort] = None
    created_at: datetime
    updated_at: datetime
    sla_deadline: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PaginatedComplaints(BaseModel):
    total: int
    page: int
    limit: int
    data: List[ComplaintListOut]


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

class CategoryCount(BaseModel):
    category: str
    count: int


class PriorityCount(BaseModel):
    priority: str
    count: int


class StatusCount(BaseModel):
    status: str
    count: int


class MonthlyTrend(BaseModel):
    month: str   # "YYYY-MM"
    count: int


class DashboardStats(BaseModel):
    total_complaints: int
    open_complaints: int
    resolved_complaints: int
    escalated_complaints: int
    closed_complaints: int
    sla_breached_count: int
    avg_resolution_hours: Optional[float]
    complaints_by_category: List[CategoryCount]
    complaints_by_priority: List[PriorityCount]
    complaints_by_status: List[StatusCount]
    monthly_trend: List[MonthlyTrend]


class AgentPerformance(BaseModel):
    agent_id: int
    agent_name: str
    total_assigned: int
    resolved: int
    in_progress: int
    open: int


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
