from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
from models.user import User, TeacherProfile, StudentProfile
from models.test import Test, Question, QuestionType, TestAssignment
from models.submission import Submission, Grade
from models.group import Group
from schemas.test import (
    TestCreate, TestOut, TestDetailOut, GenerateTestRequest,
    QuestionCreate, QuestionOut, TestAssignmentCreate, TestAssignmentOut, StudentTestOut
)
from dependencies import require_teacher, require_student
from services.test_generator import generate_questions
from services.file_parser import extract_text

router = APIRouter(prefix="/tests", tags=["tests"])


def _get_teacher_profile(user: User, db: Session) -> TeacherProfile:
    profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    return profile


# ─── Teacher: list own tests ─────────────────────────────────────────────────

@router.get("", response_model=List[TestOut])
def list_tests(current_user: User = Depends(require_teacher), db: Session = Depends(get_db)):
    profile = _get_teacher_profile(current_user, db)
    tests = db.query(Test).filter(Test.teacher_id == profile.id).all()
    return [TestOut(
        id=t.id, title=t.title, description=t.description,
        time_limit_minutes=t.time_limit_minutes, difficulty=t.difficulty,
        is_published=t.is_published, ai_proctored=t.ai_proctored,
        teacher_id=t.teacher_id, question_count=len(t.questions),
    ) for t in tests]


# ─── Student: list available tests ───────────────────────────────────────────

@router.get("/student/available", response_model=List[StudentTestOut])
def list_student_tests(current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Get tests assigned to student's group + all published tests
    assigned_test_ids = set()
    deadline_map = {}

    if profile.group_id:
        assignments = db.query(TestAssignment).filter(
            TestAssignment.group_id == profile.group_id
        ).all()
        for a in assignments:
            assigned_test_ids.add(a.test_id)
            if a.deadline:
                deadline_map[a.test_id] = a.deadline.isoformat()

    # Submitted test ids
    submitted_ids = {
        s.test_id for s in db.query(Submission).filter(
            Submission.student_id == profile.id
        ).all()
    }

    # All published tests (assigned to group OR globally published)
    tests = db.query(Test).filter(Test.is_published == True).all()

    result = []
    for t in tests:
        result.append(StudentTestOut(
            id=t.id,
            title=t.title,
            difficulty=t.difficulty,
            time_limit_minutes=t.time_limit_minutes,
            question_count=len(t.questions),
            deadline=deadline_map.get(t.id),
            already_submitted=(t.id in submitted_ids),
        ))
    return result


# ─── Test CRUD ────────────────────────────────────────────────────────────────

@router.post("", response_model=TestOut, status_code=201)
def create_test(payload: TestCreate, current_user: User = Depends(require_teacher), db: Session = Depends(get_db)):
    profile = _get_teacher_profile(current_user, db)
    test = Test(**payload.model_dump(), teacher_id=profile.id)
    db.add(test)
    db.commit()
    db.refresh(test)
    return TestOut(question_count=0, **{c: getattr(test, c) for c in TestOut.model_fields if c != "question_count"})


@router.get("/{test_id}", response_model=TestDetailOut)
def get_test(test_id: int, current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test


@router.delete("/{test_id}", status_code=204)
def delete_test(test_id: int, current_user: User = Depends(require_teacher), db: Session = Depends(get_db)):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    db.delete(test)
    db.commit()


@router.post("/{test_id}/questions", response_model=QuestionOut, status_code=201)
def add_question(test_id: int, q: QuestionCreate, current_user: User = Depends(require_teacher), db: Session = Depends(get_db)):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    order = len(test.questions)
    question = Question(**q.model_dump(), test_id=test_id, order=order)
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.post("/{test_id}/publish", response_model=TestOut)
def publish_test(test_id: int, current_user: User = Depends(require_teacher), db: Session = Depends(get_db)):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    test.is_published = True
    db.commit()
    db.refresh(test)
    return test


# ─── Assign test to group ─────────────────────────────────────────────────────

@router.post("/assign", response_model=TestAssignmentOut, status_code=201)
def assign_test(
    payload: TestAssignmentCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    test = db.query(Test).filter(Test.id == payload.test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    group = db.query(Group).filter(Group.id == payload.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    deadline = None
    if payload.deadline:
        try:
            deadline = datetime.fromisoformat(payload.deadline)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid deadline format")

    # Avoid duplicate
    existing = db.query(TestAssignment).filter(
        TestAssignment.test_id == payload.test_id,
        TestAssignment.group_id == payload.group_id,
    ).first()
    if existing:
        existing.deadline = deadline
        db.commit()
        db.refresh(existing)
        assignment = existing
    else:
        assignment = TestAssignment(
            test_id=payload.test_id,
            group_id=payload.group_id,
            deadline=deadline,
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)

    return TestAssignmentOut(
        id=assignment.id,
        test_id=assignment.test_id,
        group_id=assignment.group_id,
        deadline=assignment.deadline.isoformat() if assignment.deadline else None,
        test_title=test.title,
        group_name=group.name,
    )


@router.get("/{test_id}/assignments", response_model=List[TestAssignmentOut])
def list_assignments(test_id: int, current_user: User = Depends(require_teacher), db: Session = Depends(get_db)):
    assignments = db.query(TestAssignment).filter(TestAssignment.test_id == test_id).all()
    result = []
    for a in assignments:
        result.append(TestAssignmentOut(
            id=a.id,
            test_id=a.test_id,
            group_id=a.group_id,
            deadline=a.deadline.isoformat() if a.deadline else None,
            test_title=a.test.title if a.test else None,
            group_name=a.group.name if a.group else None,
        ))
    return result


# ─── AI generation ────────────────────────────────────────────────────────────

@router.post("/generate", response_model=TestDetailOut, status_code=201)
def generate_test(payload: GenerateTestRequest, current_user: User = Depends(require_teacher), db: Session = Depends(get_db)):
    profile = _get_teacher_profile(current_user, db)
    test = Test(
        title=payload.title, difficulty=payload.difficulty,
        time_limit_minutes=60, teacher_id=profile.id,
    )
    db.add(test)
    db.flush()

    try:
        raw_questions = generate_questions(payload.topic, payload.num_questions, payload.difficulty)
    except RuntimeError as e:
        db.rollback()
        raise HTTPException(status_code=503, detail=str(e))

    for i, q in enumerate(raw_questions):
        question = Question(
            test_id=test.id,
            text=q.get("text", ""),
            question_type=q.get("question_type", QuestionType.multiple_choice),
            options=q.get("options"),
            correct_answer=q.get("correct_answer"),
            points=q.get("points", 10),
            order=i,
        )
        db.add(question)

    db.commit()
    db.refresh(test)
    return test


@router.post("/upload", response_model=TestDetailOut, status_code=201)
async def generate_from_file(
    title: str,
    num_questions: int = 10,
    difficulty: str = "undergraduate",
    file: UploadFile = File(...),
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    profile = _get_teacher_profile(current_user, db)
    text = await extract_text(file)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    test = Test(title=title, difficulty=difficulty, time_limit_minutes=60, teacher_id=profile.id)
    db.add(test)
    db.flush()

    try:
        raw_questions = generate_questions(text[:4000], num_questions, difficulty)
    except RuntimeError as e:
        db.rollback()
        raise HTTPException(status_code=503, detail=str(e))

    for i, q in enumerate(raw_questions):
        question = Question(
            test_id=test.id,
            text=q.get("text", ""),
            question_type=q.get("question_type", QuestionType.multiple_choice),
            options=q.get("options"),
            correct_answer=q.get("correct_answer"),
            points=q.get("points", 10),
            order=i,
        )
        db.add(question)

    db.commit()
    db.refresh(test)
    return test
