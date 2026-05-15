from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_active_user
from database import get_db

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])


@router.post("/complaints/{complaint_id}/feedback", response_model=schemas.ApiResponse,
             status_code=status.HTTP_201_CREATED)
def submit_feedback(
    complaint_id: int,
    payload: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    # Only the complaint owner can submit feedback
    if complaint.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Feedback only allowed for resolved/closed complaints
    if complaint.status not in ("resolved", "closed"):
        raise HTTPException(
            status_code=400,
            detail="Feedback can only be submitted for resolved or closed complaints",
        )

    # Prevent duplicate feedback
    existing = db.query(models.Feedback).filter(models.Feedback.complaint_id == complaint_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this complaint")

    feedback = models.Feedback(
        complaint_id=complaint_id,
        customer_id=current_user.id,
        rating=payload.rating,
        comments=payload.comments,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return schemas.ApiResponse(
        data=schemas.FeedbackOut.model_validate(feedback).model_dump(),
        message="Feedback submitted successfully",
    )


@router.get("/complaints/{complaint_id}/feedback", response_model=schemas.ApiResponse)
def get_feedback(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    # Customers can only view feedback for their own complaints
    if current_user.role.name == "customer" and complaint.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    feedback = db.query(models.Feedback).filter(models.Feedback.complaint_id == complaint_id).first()
    if not feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No feedback found")

    return schemas.ApiResponse(
        data=schemas.FeedbackOut.model_validate(feedback).model_dump(), message="success"
    )
