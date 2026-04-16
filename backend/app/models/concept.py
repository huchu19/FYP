"""Knowledge Graph models: Concept, ConceptPrerequisite, StudentConceptMastery."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db import Base


class Concept(Base):
    __tablename__ = "concepts"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("classroom_id", "name", name="uq_classroom_concept"),
    )

    # Relationships
    prerequisites = relationship(
        "ConceptPrerequisite",
        foreign_keys="ConceptPrerequisite.concept_id",
        back_populates="concept",
        cascade="all, delete-orphan",
    )
    dependents = relationship(
        "ConceptPrerequisite",
        foreign_keys="ConceptPrerequisite.prerequisite_id",
        back_populates="prerequisite",
    )
    mastery_records = relationship(
        "StudentConceptMastery",
        back_populates="concept",
        cascade="all, delete-orphan",
    )


class ConceptPrerequisite(Base):
    __tablename__ = "concept_prerequisites"

    id = Column(Integer, primary_key=True, index=True)
    concept_id = Column(Integer, ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False)
    prerequisite_id = Column(Integer, ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("concept_id", "prerequisite_id", name="uq_concept_prereq"),
    )

    concept = relationship("Concept", foreign_keys=[concept_id], back_populates="prerequisites")
    prerequisite = relationship("Concept", foreign_keys=[prerequisite_id], back_populates="dependents")


class StudentConceptMastery(Base):
    __tablename__ = "student_concept_mastery"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    concept_id = Column(Integer, ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False)
    mastery_score = Column(Float, default=0.0)  # 0.0 to 1.0
    attempts = Column(Integer, default=0)
    metacognitive_score = Column(Float, nullable=True)  # 0.0 to 1.0, calibration accuracy over time
    unaided_mastery = Column(Float, nullable=True)  # performance without hints
    aided_mastery = Column(Float, nullable=True)  # performance with scaffolded hints
    evidence = Column(JSONB, default=list)  # Last N evidence data points for traceable judgements
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("student_id", "concept_id", name="uq_student_concept"),
    )

    concept = relationship("Concept", back_populates="mastery_records")
