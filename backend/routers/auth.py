from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, StudentProfile, TeacherProfile
from models.group import Group
from schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from services.auth import hash_password, authenticate_user, create_access_token
import random

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    db.flush()

    if payload.role == "student":
        # Validate group if provided
        if payload.group_id:
            group = db.query(Group).filter(Group.id == payload.group_id).first()
            if not group:
                raise HTTPException(status_code=400, detail="Group not found")

        profile = StudentProfile(
            user_id=user.id,
            student_id=f"STU-{random.randint(10000, 99999)}",
            specialization=payload.specialization,
            group_id=payload.group_id,
            attendance_percent=100,
        )
        db.add(profile)
    else:
        profile = TeacherProfile(user_id=user.id)
        db.add(profile)

    db.commit()
    db.refresh(user)

    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token({"sub": str(user.id), "role": role_str})
    return TokenResponse(
        access_token=token,
        role=role_str,
        full_name=user.full_name,
        user_id=user.id,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token({"sub": str(user.id), "role": role_str})
    return TokenResponse(
        access_token=token,
        role=role_str,
        full_name=user.full_name,
        user_id=user.id,
    )
