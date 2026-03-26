from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.group import Group
from models.user import User
from schemas.student import GroupOut
from dependencies import require_teacher
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/groups", tags=["groups"])


class GroupCreate(BaseModel):
    name: str
    specialization: str
    course_code: Optional[str] = None


@router.get("", response_model=List[GroupOut])
def list_groups(db: Session = Depends(get_db)):
    """Public — anyone can list groups for registration."""
    return db.query(Group).order_by(Group.specialization, Group.name).all()


@router.post("", response_model=GroupOut, status_code=201)
def create_group(
    payload: GroupCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    group = Group(
        name=payload.name,
        specialization=payload.specialization,
        course_code=payload.course_code,
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group
