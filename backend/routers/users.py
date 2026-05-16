from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_active_user, require_admin
from database import get_db

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/agents", response_model=schemas.ApiResponse)
def get_agents(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_active_user),
):
    """Get all active support agents (for assignment dropdowns)."""
    agent_role = db.query(models.Role).filter(models.Role.name == "support_agent").first()
    if not agent_role:
        return schemas.ApiResponse(data=[], message="success")

    agents = (
        db.query(models.User)
        .filter(models.User.role_id == agent_role.id, models.User.is_active == True)
        .all()
    )
    data = [schemas.UserOut.model_validate(a).model_dump() for a in agents]
    return schemas.ApiResponse(data=data, message="success")


@router.get("/", response_model=schemas.ApiResponse)
def list_users(
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    query = db.query(models.User)
    if role:
        role_obj = db.query(models.Role).filter(models.Role.name == role).first()
        if role_obj:
            query = query.filter(models.User.role_id == role_obj.id)
    users = query.all()
    data = [schemas.UserOut.model_validate(u).model_dump() for u in users]
    return schemas.ApiResponse(data=data, message="success")


@router.get("/{user_id}", response_model=schemas.ApiResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    # Users can view their own profile; admins can view anyone
    if current_user.role.name != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return schemas.ApiResponse(data=schemas.UserOut.model_validate(user).model_dump(), message="success")


@router.put("/{user_id}", response_model=schemas.ApiResponse)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    if current_user.role.name != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Non-admins cannot change role or active status
    if current_user.role.name != "admin":
        payload.role_id = None
        payload.is_active = None

    update_data = payload.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return schemas.ApiResponse(
        data=schemas.UserOut.model_validate(user).model_dump(), message="User updated successfully"
    )


@router.delete("/{user_id}", response_model=schemas.ApiResponse)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = False
    db.commit()
    return schemas.ApiResponse(data=None, message="User deactivated successfully")
