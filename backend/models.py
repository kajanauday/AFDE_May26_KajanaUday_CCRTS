from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
)
from sqlalchemy.orm import relationship
from database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    role = relationship("Role", back_populates="users")
    complaints_raised = relationship(
        "Complaint", foreign_keys="Complaint.customer_id", back_populates="customer"
    )
    complaints_assigned = relationship(
        "Complaint", foreign_keys="Complaint.assigned_agent_id", back_populates="assigned_agent"
    )
    complaint_history = relationship("ComplaintHistory", back_populates="updated_by")
    notifications = relationship("Notification", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="customer")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    complaints = relationship("Complaint", back_populates="category")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_number = Column(String(30), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="medium")   # low/medium/high/critical
    status = Column(String(40), default="open")       # open/assigned/in_progress/...
    assigned_agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)
    sla_deadline = Column(DateTime, nullable=True)

    customer = relationship("User", foreign_keys=[customer_id], back_populates="complaints_raised")
    assigned_agent = relationship(
        "User", foreign_keys=[assigned_agent_id], back_populates="complaints_assigned"
    )
    category = relationship("Category", back_populates="complaints")
    history = relationship("ComplaintHistory", back_populates="complaint", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="complaint", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="complaint", uselist=False)


class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    old_status = Column(String(40), nullable=True)
    new_status = Column(String(40), nullable=True)
    comment = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    complaint = relationship("Complaint", back_populates="history")
    updated_by = relationship("User", back_populates="complaint_history")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    complaint = relationship("Complaint", back_populates="attachments")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)   # 1-5
    comments = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    complaint = relationship("Complaint", back_populates="feedback")
    customer = relationship("User", back_populates="feedbacks")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="notifications")
