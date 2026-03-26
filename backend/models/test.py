from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class QuestionType(str, enum.Enum):
    multiple_choice = "multiple_choice"
    written = "written"


class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    time_limit_minutes = Column(Integer, default=60)
    difficulty = Column(String, default="undergraduate")
    is_published = Column(Boolean, default=False)
    ai_proctored = Column(Boolean, default=False)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    teacher = relationship("TeacherProfile", back_populates="tests")
    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")
    assignments = relationship("TestAssignment", back_populates="test", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="test")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    options = Column(JSON)                 # list of strings for MCQ
    correct_answer = Column(String)        # index (MCQ) or None (written)
    points = Column(Integer, default=10)
    order = Column(Integer, default=0)

    test = relationship("Test", back_populates="questions")
    answers = relationship("Answer", back_populates="question")


class TestAssignment(Base):
    __tablename__ = "test_assignments"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    deadline = Column(DateTime(timezone=True))

    test = relationship("Test", back_populates="assignments")
    group = relationship("Group", back_populates="test_assignments")
