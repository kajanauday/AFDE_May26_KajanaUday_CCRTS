from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_active_user
from database import get_db

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/", response_model=schemas.ApiResponse)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    notifications = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )
    data = [schemas.NotificationOut.model_validate(n).model_dump() for n in notifications]
    return schemas.ApiResponse(data=data, message="success")


@router.put("/{notification_id}/read", response_model=schemas.ApiResponse)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notif.is_read = True
    db.commit()
    return schemas.ApiResponse(
        data=schemas.NotificationOut.model_validate(notif).model_dump(),
        message="Notification marked as read",
    )


@router.put("/read-all", response_model=schemas.ApiResponse)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return schemas.ApiResponse(data=None, message="All notifications marked as read")
