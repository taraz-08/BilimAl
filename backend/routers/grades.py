from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models.user import User
from models.submission import Grade, GradeStatus
from schemas.test import GradeApprovalRequest
from dependencies import require_teacher

router = APIRouter(prefix="/grades", tags=["grades"])


@router.post("/approve")
def approve_or_reject_grade(
    payload: GradeApprovalRequest,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    grade = db.query(Grade).filter(Grade.id == payload.grade_id).first()
    if not grade:
        raise HTTPException(404, "Grade not found")

    if payload.approved:
        grade.status = GradeStatus.approved
        if payload.override_score is not None:
            grade.total_score = payload.override_score
        elif grade.ai_score is not None:
            grade.total_score = (grade.total_score or 0) + grade.ai_score
    else:
        grade.status = GradeStatus.rejected

    if payload.teacher_note:
        grade.teacher_note = payload.teacher_note

    grade.graded_at = datetime.utcnow()
    db.commit()
    return {"message": "Grade updated", "status": grade.status}
