from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from auth import (
    hash_password, verify_password, create_access_token, get_current_active_user
)
from database import get_db

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=schemas.ApiResponse, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check duplicate
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    customer_role = db.query(models.Role).filter(models.Role.name == "customer").first()
    if not customer_role:
        raise HTTPException(status_code=500, detail="Default role not found. Run seed first.")

    user = models.User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        role_id=customer_role.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    user_out = schemas.UserOut.model_validate(user)
    return schemas.ApiResponse(data=user_out.model_dump(), message="User registered successfully")


@router.post("/login", response_model=schemas.ApiResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    token = create_access_token({"sub": str(user.id)})
    user_out = schemas.UserOut.model_validate(user)
    token_data = schemas.Token(access_token=token, user=user_out)
    return schemas.ApiResponse(data=token_data.model_dump(), message="Login successful")


@router.get("/me", response_model=schemas.ApiResponse)
def get_me(current_user: models.User = Depends(get_current_active_user)):
    user_out = schemas.UserOut.model_validate(current_user)
    return schemas.ApiResponse(data=user_out.model_dump(), message="success")
