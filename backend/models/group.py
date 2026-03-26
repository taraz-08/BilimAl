from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)          # e.g. "CS-101"
    specialization = Column(String, nullable=False) # e.g. "Computer Science"
    course_code = Column(String)
    teacher_id = Column(Integer, ForeignKey("teacher_profiles.id"), nullable=True)

    teacher = relationship("TeacherProfile", back_populates="groups")
    memberships = relationship("GroupMembership", back_populates="group")
    test_assignments = relationship("TestAssignment", back_populates="group")
    students = relationship("StudentProfile", back_populates="group")


class GroupMembership(Base):
    __tablename__ = "group_memberships"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    student_id = Column(Integer, ForeignKey("student_profiles.id"))

    group = relationship("Group", back_populates="memberships")
    student = relationship("StudentProfile", back_populates="group_memberships")
