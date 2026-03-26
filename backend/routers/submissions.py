from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from database import get_db
from models.user import User, StudentProfile
from models.test import Test, Question, QuestionType
from models.submission import Submission, Answer, Grade, SubmissionStatus, GradeStatus
from schemas.test import SubmissionCreate, SubmissionOut, GradeApprovalRequest
from dependencies import require_student, require_teacher
from services.ai_grading import grade_written_answer

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("", response_model=SubmissionOut, status_code=201)
def submit_test(
    payload: SubmissionCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not student:
        raise HTTPException(404, "Student profile not found")

    test = db.query(Test).filter(Test.id == payload.test_id, Test.is_published == True).first()
    if not test:
        raise HTTPException(404, "Test not found or not published")

    # Create submission
    submission = Submission(
        test_id=test.id,
        student_id=student.id,
        status=SubmissionStatus.submitted,
        submitted_at=datetime.utcnow(),
        time_spent_seconds=payload.time_spent_seconds,
    )
    db.add(submission)
    db.flush()

    total_score = 0.0
    max_score = 0.0
    has_written = False

    for ans_data in payload.answers:
        question = db.query(Question).filter(Question.id == ans_data.question_id).first()
        if not question:
            continue

        answer = Answer(
            submission_id=submission.id,
            question_id=question.id,
            selected_option=ans_data.selected_option,
            written_text=ans_data.written_text,
        )
        db.add(answer)
        max_score += question.points

        # Auto-grade MCQ
        if question.question_type == QuestionType.multiple_choice:
            if ans_data.selected_option and ans_data.selected_option == question.correct_answer:
                total_score += question.points

        if question.question_type == QuestionType.written:
            has_written = True

    # Create grade record
    grade = Grade(
        submission_id=submission.id,
        student_id=student.id,
        total_score=total_score,
        max_score=max_score or 100,
        status=GradeStatus.pending,
    )
    db.add(grade)
    db.commit()
    db.refresh(submission)

    # Background AI grading for written questions
    if has_written:
        _ai_grade_written(submission.id, db)

    return SubmissionOut(
        id=submission.id,
        test_id=submission.test_id,
        student_id=submission.student_id,
        status=submission.status,
        test_title=test.title,
    )


def _ai_grade_written(submission_id: int, db: Session):
    """Grade all written answers with AI and update the grade record."""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        return

    ai_total = 0.0
    feedback_parts = []

    for answer in submission.answers:
        q = answer.question
        if q and q.question_type == QuestionType.written and answer.written_text:
            score, feedback = grade_written_answer(q.text, answer.written_text, q.points)
            ai_total += score
            feedback_parts.append(f"Q{q.order+1}: {feedback}")

    if feedback_parts and submission.grade:
        grade = submission.grade
        grade.ai_score = ai_total
        grade.ai_feedback = "\n\n".join(feedback_parts)
        grade.status = GradeStatus.ai_graded
        db.commit()


@router.get("", response_model=List[SubmissionOut])
def list_submissions(current_user: User = Depends(require_teacher), db: Session = Depends(get_db)):
    """Teacher: all submissions for their tests."""
    from models.user import TeacherProfile
    teacher = db.query(TeacherProfile).filter(TeacherProfile.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(404, "Teacher profile not found")

    subs = []
    for test in teacher.tests:
        for sub in test.submissions:
            subs.append(SubmissionOut(
                id=sub.id,
                test_id=sub.test_id,
                student_id=sub.student_id,
                status=sub.status,
                test_title=test.title,
            ))
    return subs


@router.get("/{submission_id}")
def get_submission_detail(submission_id: int, current_user: User = Depends(require_teacher), db: Session = Depends(get_db)):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(404, "Submission not found")
    return {
        "id": sub.id,
        "test_title": sub.test.title if sub.test else None,
        "student_name": sub.student.user.full_name if sub.student and sub.student.user else None,
        "status": sub.status,
        "submitted_at": sub.submitted_at,
        "grade": {
            "total_score": sub.grade.total_score if sub.grade else 0,
            "max_score": sub.grade.max_score if sub.grade else 100,
            "ai_score": sub.grade.ai_score if sub.grade else None,
            "ai_feedback": sub.grade.ai_feedback if sub.grade else None,
            "status": sub.grade.status if sub.grade else None,
        } if sub.grade else None,
        "answers": [
            {
                "question": a.question.text if a.question else None,
                "question_type": a.question.question_type if a.question else None,
                "selected_option": a.selected_option,
                "written_text": a.written_text,
                "correct_answer": a.question.correct_answer if a.question else None,
            }
            for a in sub.answers
        ]
    }
