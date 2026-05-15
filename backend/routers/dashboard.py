from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_active_user
from database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=schemas.ApiResponse)
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    now = datetime.now(timezone.utc)

    base_q = db.query(models.Complaint)

    # Customers see only their own stats
    if current_user.role.name == "customer":
        base_q = base_q.filter(models.Complaint.customer_id == current_user.id)

    total = base_q.count()
    open_count = base_q.filter(models.Complaint.status == "open").count()
    resolved_count = base_q.filter(models.Complaint.status == "resolved").count()
    escalated_count = base_q.filter(models.Complaint.status == "escalated").count()
    closed_count = base_q.filter(models.Complaint.status == "closed").count()

    # SLA breached: sla_deadline < now and status not in resolved/closed
    sla_breached = (
        base_q.filter(
            models.Complaint.sla_deadline < now,
            models.Complaint.status.notin_(["resolved", "closed"]),
        ).count()
    )

    # Average resolution time in hours
    resolved_complaints = base_q.filter(
        models.Complaint.resolved_at.isnot(None)
    ).all()
    if resolved_complaints:
        total_hours = sum(
            (c.resolved_at - c.created_at).total_seconds() / 3600
            for c in resolved_complaints
            if c.resolved_at and c.created_at
        )
        avg_hours = round(total_hours / len(resolved_complaints), 2)
    else:
        avg_hours = None

    # By category
    category_rows = (
        db.query(models.Category.name, func.count(models.Complaint.id).label("cnt"))
        .join(models.Complaint, models.Complaint.category_id == models.Category.id, isouter=True)
        .group_by(models.Category.name)
        .all()
    )
    by_category: List[schemas.CategoryCount] = [
        schemas.CategoryCount(category=r.name, count=r.cnt or 0) for r in category_rows
    ]

    # By priority
    priority_rows = (
        db.query(models.Complaint.priority, func.count(models.Complaint.id).label("cnt"))
        .group_by(models.Complaint.priority)
        .all()
    )
    by_priority: List[schemas.PriorityCount] = [
        schemas.PriorityCount(priority=r.priority, count=r.cnt) for r in priority_rows
    ]

    # By status
    status_rows = (
        db.query(models.Complaint.status, func.count(models.Complaint.id).label("cnt"))
        .group_by(models.Complaint.status)
        .all()
    )
    by_status: List[schemas.StatusCount] = [
        schemas.StatusCount(status=r.status, count=r.cnt) for r in status_rows
    ]

    # Monthly trend – last 6 months
    six_months_ago = now - timedelta(days=180)
    recent_complaints = (
        db.query(models.Complaint)
        .filter(models.Complaint.created_at >= six_months_ago)
        .all()
    )
    month_counts: dict = defaultdict(int)
    for c in recent_complaints:
        key = c.created_at.strftime("%Y-%m")
        month_counts[key] += 1

    monthly_trend: List[schemas.MonthlyTrend] = [
        schemas.MonthlyTrend(month=k, count=v)
        for k, v in sorted(month_counts.items())
    ]

    stats = schemas.DashboardStats(
        total_complaints=total,
        open_complaints=open_count,
        resolved_complaints=resolved_count,
        escalated_complaints=escalated_count,
        closed_complaints=closed_count,
        sla_breached_count=sla_breached,
        avg_resolution_hours=avg_hours,
        complaints_by_category=by_category,
        complaints_by_priority=by_priority,
        complaints_by_status=by_status,
        monthly_trend=monthly_trend,
    )
    return schemas.ApiResponse(data=stats.model_dump(), message="success")


@router.get("/agent-performance", response_model=schemas.ApiResponse)
def agent_performance(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_active_user),
):
    agent_role = db.query(models.Role).filter(models.Role.name == "support_agent").first()
    if not agent_role:
        return schemas.ApiResponse(data=[], message="success")

    agents = db.query(models.User).filter(
        models.User.role_id == agent_role.id, models.User.is_active == True
    ).all()

    results = []
    for agent in agents:
        assigned_complaints = (
            db.query(models.Complaint)
            .filter(models.Complaint.assigned_agent_id == agent.id)
            .all()
        )
        total = len(assigned_complaints)
        resolved = sum(1 for c in assigned_complaints if c.status == "resolved")
        in_progress = sum(1 for c in assigned_complaints if c.status == "in_progress")
        open_count = sum(1 for c in assigned_complaints if c.status in ("open", "assigned"))

        results.append(
            schemas.AgentPerformance(
                agent_id=agent.id,
                agent_name=agent.name,
                total_assigned=total,
                resolved=resolved,
                in_progress=in_progress,
                open=open_count,
            ).model_dump()
        )

    return schemas.ApiResponse(data=results, message="success")
