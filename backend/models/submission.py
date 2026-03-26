from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class SubmissionStatus(str, enum.Enum):
    in_progress = "in_progress"
    submitted = "submitted"
    graded = "graded"


class GradeStatus(str, enum.Enum):
    pending = "pending"
    ai_graded = "ai_graded"
    approved = "approved"
    rejected = "rejected"


class PredictionLabel(str, enum.Enum):
    good = "good"
    average = "average"
    risk = "risk"


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.in_progress)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at = Column(DateTime(timezone=True))
    time_spent_seconds = Column(Integer)

    test = relationship("Test", back_populates="submissions")
    student = relationship("StudentProfile", back_populates="submissions")
    answers = relationship("Answer", back_populates="submission", cascade="all, delete-orphan")
    grade = relationship("Grade", back_populates="submission", uselist=False)


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_option = Column(String)
    written_text = Column(Text)

    submission = relationship("Submission", back_populates="answers")
    question = relationship("Question", back_populates="answers")


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), unique=True, nullable=False)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    total_score = Column(Float, default=0)
    max_score = Column(Float, default=100)
    ai_score = Column(Float)
    ai_feedback = Column(Text)
    status = Column(Enum(GradeStatus), default=GradeStatus.pending)
    teacher_note = Column(Text)
    graded_at = Column(DateTime(timezone=True))

    submission = relationship("Submission", back_populates="grade")
    student = relationship("StudentProfile", back_populates="grades")


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    filename = Column(String)
    subjects = Column(JSON)        # [{"subject": "Math", "grade": 85, "credits": 3}]
    gpa = Column(Float)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("StudentProfile", back_populates="transcripts")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    subject = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("StudentProfile", back_populates="recommendations")


class PredictionResult(Base):
    __tablename__ = "prediction_results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), unique=True, nullable=False)
    label = Column(Enum(PredictionLabel), nullable=False)
    confidence = Column(Float, default=0.0)
    avg_score = Column(Float)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    student = relationship("StudentProfile", back_populates="prediction")


class ProctorViolation(Base):
    __tablename__ = "proctor_violations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    test_id = Column(Integer, nullable=True)
    violation_type = Column(String, nullable=False)
    screenshot = Column(Text, nullable=True)  # base64 JPEG
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("StudentProfile")
