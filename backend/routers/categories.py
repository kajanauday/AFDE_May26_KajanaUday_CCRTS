from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_active_user, require_admin
from database import get_db

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("/", response_model=schemas.ApiResponse)
def list_categories(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_active_user),
):
    categories = db.query(models.Category).all()
    data = [schemas.CategoryOut.model_validate(c).model_dump() for c in categories]
    return schemas.ApiResponse(data=data, message="success")


@router.post("/", response_model=schemas.ApiResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    existing = db.query(models.Category).filter(models.Category.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    category = models.Category(name=payload.name, description=payload.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return schemas.ApiResponse(
        data=schemas.CategoryOut.model_validate(category).model_dump(),
        message="Category created successfully",
    )


@router.delete("/{category_id}", response_model=schemas.ApiResponse)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    db.delete(category)
    db.commit()
    return schemas.ApiResponse(data=None, message="Category deleted successfully")
