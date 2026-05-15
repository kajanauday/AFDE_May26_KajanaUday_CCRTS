from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_active_user, require_admin, require_admin_or_supervisor
from database import get_db

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

# ---------------------------------------------------------------------------
# SLA hours by priority
# ---------------------------------------------------------------------------

SLA_HOURS = {"critical": 4, "high": 24, "medium": 48, "low": 72}


def _calc_sla(priority: str) -> datetime:
    hours = SLA_HOURS.get(priority, 48)
    return datetime.now(timezone.utc) + timedelta(hours=hours)


def _gen_complaint_number(db: Session) -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"CCRTS-{today}-"
    count = (
        db.query(models.Complaint)
        .filter(models.Complaint.complaint_number.like(f"{prefix}%"))
        .count()
    )
    return f"{prefix}{str(count + 1).zfill(4)}"


def _create_notification(db: Session, user_id: int, title: str, message: str):
    notif = models.Notification(user_id=user_id, title=title, message=message)
    db.add(notif)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=schemas.ApiResponse)
def list_complaints(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    assigned_agent_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    my_complaints: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    query = db.query(models.Complaint)

    # Customers only see their own complaints
    if current_user.role.name == "customer":
        query = query.filter(models.Complaint.customer_id == current_user.id)
    elif my_complaints:
        query = query.filter(models.Complaint.customer_id == current_user.id)

    if status_filter:
        query = query.filter(models.Complaint.status == status_filter)
    if priority:
        query = query.filter(models.Complaint.priority == priority)
    if category_id:
        query = query.filter(models.Complaint.category_id == category_id)
    if assigned_agent_id:
        query = query.filter(models.Complaint.assigned_agent_id == assigned_agent_id)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                models.Complaint.title.ilike(term),
                models.Complaint.description.ilike(term),
                models.Complaint.complaint_number.ilike(term),
            )
        )

    total = query.count()
    complaints = (
        query.order_by(models.Complaint.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = [schemas.ComplaintListOut.model_validate(c).model_dump() for c in complaints]
    paginated = schemas.PaginatedComplaints(total=total, page=page, limit=limit, data=items)  # type: ignore[arg-type]
    return schemas.ApiResponse(data=paginated.model_dump(), message="success")


@router.post("/", response_model=schemas.ApiResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    payload: schemas.ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    complaint_number = _gen_complaint_number(db)
    sla_deadline = _calc_sla(payload.priority)

    complaint = models.Complaint(
        complaint_number=complaint_number,
        customer_id=current_user.id,
        category_id=payload.category_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status="open",
        sla_deadline=sla_deadline,
    )
    db.add(complaint)
    db.flush()  # get ID

    # History entry
    history = models.ComplaintHistory(
        complaint_id=complaint.id,
        updated_by_id=current_user.id,
        old_status=None,
        new_status="open",
        comment="Complaint created",
    )
    db.add(history)

    # Notify all admins
    admin_role = db.query(models.Role).filter(models.Role.name == "admin").first()
    if admin_role:
        admins = db.query(models.User).filter(
            models.User.role_id == admin_role.id, models.User.is_active == True
        ).all()
        for admin in admins:
            _create_notification(
                db, admin.id,
                "New Complaint Submitted",
                f"Complaint {complaint_number} has been submitted by {current_user.name}.",
            )

    db.commit()
    db.refresh(complaint)
    return schemas.ApiResponse(
        data=schemas.ComplaintOut.model_validate(complaint).model_dump(),
        message="Complaint created successfully",
    )


@router.get("/{complaint_id}", response_model=schemas.ApiResponse)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    # Customers can only see their own
    if current_user.role.name == "customer" and complaint.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return schemas.ApiResponse(
        data=schemas.ComplaintOut.model_validate(complaint).model_dump(), message="success"
    )


@router.put("/{complaint_id}", response_model=schemas.ApiResponse)
def update_complaint(
    complaint_id: int,
    payload: schemas.ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    # Customers can only edit their own open complaints
    if current_user.role.name == "customer":
        if complaint.customer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        if complaint.status not in ("open",):
            raise HTTPException(
                status_code=400, detail="Cannot edit a complaint that is no longer open"
            )

    update_data = payload.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(complaint, field, value)

    if "priority" in update_data:
        complaint.sla_deadline = _calc_sla(update_data["priority"])

    complaint.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(complaint)
    return schemas.ApiResponse(
        data=schemas.ComplaintOut.model_validate(complaint).model_dump(),
        message="Complaint updated successfully",
    )


@router.delete("/{complaint_id}", response_model=schemas.ApiResponse)
def delete_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    db.delete(complaint)
    db.commit()
    return schemas.ApiResponse(data=None, message="Complaint deleted successfully")


@router.put("/{complaint_id}/assign", response_model=schemas.ApiResponse)
def assign_complaint(
    complaint_id: int,
    payload: schemas.AssignRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_supervisor),
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    agent = db.query(models.User).filter(
        models.User.id == payload.agent_id, models.User.is_active == True
    ).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    old_status = complaint.status
    complaint.assigned_agent_id = payload.agent_id
    if complaint.status == "open":
        complaint.status = "assigned"

    complaint.updated_at = datetime.now(timezone.utc)

    # History
    history = models.ComplaintHistory(
        complaint_id=complaint.id,
        updated_by_id=current_user.id,
        old_status=old_status,
        new_status=complaint.status,
        comment=f"Assigned to {agent.name}",
    )
    db.add(history)

    # Notify agent
    _create_notification(
        db, agent.id,
        "Complaint Assigned to You",
        f"Complaint {complaint.complaint_number} - '{complaint.title}' has been assigned to you.",
    )

    db.commit()
    db.refresh(complaint)
    return schemas.ApiResponse(
        data=schemas.ComplaintOut.model_validate(complaint).model_dump(),
        message="Complaint assigned successfully",
    )


@router.put("/{complaint_id}/status", response_model=schemas.ApiResponse)
def update_status(
    complaint_id: int,
    payload: schemas.StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    # Customers cannot change status
    if current_user.role.name == "customer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customers cannot change complaint status")

    old_status = complaint.status
    complaint.status = payload.status
    complaint.updated_at = datetime.now(timezone.utc)

    if payload.status == "resolved":
        complaint.resolved_at = datetime.now(timezone.utc)

    # History
    history = models.ComplaintHistory(
        complaint_id=complaint.id,
        updated_by_id=current_user.id,
        old_status=old_status,
        new_status=payload.status,
        comment=payload.comment,
    )
    db.add(history)

    # Notify customer
    _create_notification(
        db, complaint.customer_id,
        "Complaint Status Updated",
        f"Your complaint {complaint.complaint_number} status changed from '{old_status}' to '{payload.status}'.",
    )

    db.commit()
    db.refresh(complaint)
    return schemas.ApiResponse(
        data=schemas.ComplaintOut.model_validate(complaint).model_dump(),
        message="Status updated successfully",
    )


@router.put("/{complaint_id}/escalate", response_model=schemas.ApiResponse)
def escalate_complaint(
    complaint_id: int,
    payload: schemas.EscalateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    if current_user.role.name == "customer" and complaint.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    old_status = complaint.status
    complaint.status = "escalated"
    complaint.updated_at = datetime.now(timezone.utc)

    history = models.ComplaintHistory(
        complaint_id=complaint.id,
        updated_by_id=current_user.id,
        old_status=old_status,
        new_status="escalated",
        comment=payload.comment or "Complaint escalated",
    )
    db.add(history)

    # Notify admins and supervisors
    for role_name in ("admin", "supervisor"):
        role_obj = db.query(models.Role).filter(models.Role.name == role_name).first()
        if role_obj:
            staff = db.query(models.User).filter(
                models.User.role_id == role_obj.id, models.User.is_active == True
            ).all()
            for member in staff:
                _create_notification(
                    db, member.id,
                    "Complaint Escalated",
                    f"Complaint {complaint.complaint_number} has been escalated and requires immediate attention.",
                )

    # Notify customer
    _create_notification(
        db, complaint.customer_id,
        "Complaint Escalated",
        f"Your complaint {complaint.complaint_number} has been escalated for priority resolution.",
    )

    db.commit()
    db.refresh(complaint)
    return schemas.ApiResponse(
        data=schemas.ComplaintOut.model_validate(complaint).model_dump(),
        message="Complaint escalated successfully",
    )


@router.get("/{complaint_id}/history", response_model=schemas.ApiResponse)
def get_history(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    if current_user.role.name == "customer" and complaint.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    history = (
        db.query(models.ComplaintHistory)
        .filter(models.ComplaintHistory.complaint_id == complaint_id)
        .order_by(models.ComplaintHistory.updated_at.asc())
        .all()
    )
    data = [schemas.ComplaintHistoryOut.model_validate(h).model_dump() for h in history]
    return schemas.ApiResponse(data=data, message="success")
