from pydantic import BaseModel
from typing import Optional, List, Any
from models.submission import GradeStatus, PredictionLabel


class GroupOut(BaseModel):
    id: int
    name: str
    specialization: str
    course_code: Optional[str] = None

    class Config:
        from_attributes = True


class StudentProfile(BaseModel):
    id: int
    user_id: int
    email: str
    full_name: str
    student_id: Optional[str]
    specialization: Optional[str]
    group_id: Optional[int]
    group_name: Optional[str] = None
    year: int
    attendance_percent: int

    class Config:
        from_attributes = True


class GradeOut(BaseModel):
    id: int
    submission_id: int
    total_score: float
    max_score: float
    ai_score: Optional[float]
    ai_feedback: Optional[str]
    status: GradeStatus
    test_title: Optional[str] = None

    class Config:
        from_attributes = True


class RankingEntry(BaseModel):
    rank: int
    student_id: int
    full_name: str
    avg_score: float
    is_me: bool
    specialization: Optional[str] = None


class TeacherRankingEntry(BaseModel):
    student_id: int
    full_name: str
    specialization: Optional[str]
    group_name: Optional[str]
    avg_score: float
    grade_letter: str          # A, B, C, D
    can_improve: bool          # 4→5 candidate (70-79%)
    trend: str                 # "up", "down", "stable"
    test_count: int


class RecommendationOut(BaseModel):
    id: int
    title: str
    body: str
    subject: Optional[str]

    class Config:
        from_attributes = True


class PredictionOut(BaseModel):
    label: PredictionLabel
    confidence: float
    avg_score: Optional[float]
    ai_summary: Optional[str] = None

    class Config:
        from_attributes = True


class TranscriptOut(BaseModel):
    id: int
    filename: Optional[str]
    subjects: Optional[List[Any]]
    gpa: Optional[float]

    class Config:
        from_attributes = True


class JournalOut(BaseModel):
    avg_score: float
    attendance_percent: int
    test_count: int
    prediction_label: str
    gpa: Optional[float]
    analysis: str
    strengths: List[str]
    weaknesses: List[str]
    advice: str
    transcript_subjects: Optional[List[Any]] = None
    transcript_filename: Optional[str] = None
