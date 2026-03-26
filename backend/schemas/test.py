from pydantic import BaseModel
from typing import Optional, List
from models.test import QuestionType


class QuestionCreate(BaseModel):
    text: str
    question_type: QuestionType
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    points: int = 10


class QuestionOut(QuestionCreate):
    id: int
    order: int

    class Config:
        from_attributes = True


class TestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    time_limit_minutes: int = 60
    difficulty: str = "undergraduate"
    ai_proctored: bool = False


class TestOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    time_limit_minutes: int
    difficulty: str
    is_published: bool
    ai_proctored: bool
    teacher_id: int
    question_count: int = 0

    class Config:
        from_attributes = True


class TestDetailOut(TestOut):
    questions: List[QuestionOut] = []


class GenerateTestRequest(BaseModel):
    title: str
    topic: str
    num_questions: int = 10
    difficulty: str = "undergraduate"
    question_types: List[QuestionType] = [QuestionType.multiple_choice]


class AnswerSubmit(BaseModel):
    question_id: int
    selected_option: Optional[str] = None
    written_text: Optional[str] = None


class SubmissionCreate(BaseModel):
    test_id: int
    answers: List[AnswerSubmit]
    time_spent_seconds: Optional[int] = None


class SubmissionOut(BaseModel):
    id: int
    test_id: int
    student_id: int
    status: str
    test_title: Optional[str] = None

    class Config:
        from_attributes = True


class GradeApprovalRequest(BaseModel):
    grade_id: int
    approved: bool
    teacher_note: Optional[str] = None
    override_score: Optional[float] = None


class TestAssignmentCreate(BaseModel):
    test_id: int
    group_id: int
    deadline: Optional[str] = None   # ISO datetime string


class TestAssignmentOut(BaseModel):
    id: int
    test_id: int
    group_id: int
    deadline: Optional[str] = None
    test_title: Optional[str] = None
    group_name: Optional[str] = None

    class Config:
        from_attributes = True


class StudentTestOut(BaseModel):
    id: int
    title: str
    difficulty: str
    time_limit_minutes: int
    question_count: int
    deadline: Optional[str] = None
    already_submitted: bool = False

    class Config:
        from_attributes = True
