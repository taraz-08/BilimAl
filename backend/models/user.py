from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class UserRole(str, enum.Enum):
    student = "student"
    teacher = "teacher"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    teacher_profile = relationship("TeacherProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    student_id = Column(String, unique=True)
    specialization = Column(String)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    year = Column(Integer, default=1)
    attendance_percent = Column(Integer, default=100)

    user = relationship("User", back_populates="student_profile")
    group = relationship("Group", back_populates="students", foreign_keys=[group_id])
    group_memberships = relationship("GroupMembership", back_populates="student")
    submissions = relationship("Submission", back_populates="student")
    grades = relationship("Grade", back_populates="student")
    transcripts = relationship("Transcript", back_populates="student")
    prediction = relationship("PredictionResult", back_populates="student", uselist=False)
    recommendations = relationship("Recommendation", back_populates="student")


class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department = Column(String)
    title = Column(String)

    user = relationship("User", back_populates="teacher_profile")
    tests = relationship("Test", back_populates="teacher")
    groups = relationship("Group", back_populates="teacher")
