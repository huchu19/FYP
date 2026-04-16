from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.services.analytics import AnalyticsService
from app.services.adaptive import AdaptiveService

router = APIRouter(prefix="/analytics", tags=["analytics"])
analytics = AnalyticsService()
adaptive = AdaptiveService()


@router.get("/student/quiz-history")
def student_quiz_history(
    classroom_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> list[dict[str, Any]]:
    return analytics.student_quiz_history(
        db, current_user.id, classroom_id=classroom_id
    )


@router.get("/student/calibration")
def student_calibration(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> dict[str, Any]:
    return analytics.student_calibration_score(db, current_user.id)


@router.get("/student/topic-mastery")
def student_topic_mastery(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> list[dict[str, Any]]:
    return analytics.student_topic_mastery(db, current_user.id)


@router.get("/student/recommended-difficulty")
def recommended_difficulty(
    classroom_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> dict[str, str]:
    difficulty = adaptive.get_recommended_difficulty(
        db, student_id=current_user.id, classroom_id=classroom_id
    )
    return {"recommended_difficulty": difficulty}


@router.get("/teacher/class-summary")
def class_summary(
    classroom_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> dict[str, Any]:
    return analytics.class_summary(db, classroom_id)


@router.get("/teacher/classroom-students")
def classroom_students(
    classroom_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> list[dict[str, Any]]:
    return analytics.classroom_students_summary(db, classroom_id)


@router.get("/teacher/student-detail")
def student_detail(
    student_id: int = Query(...),
    classroom_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> dict[str, Any]:
    """Full analytics detail for a single student in a classroom."""
    return {
        "quiz_history": analytics.student_quiz_history(
            db, student_id, classroom_id=classroom_id
        ),
        "calibration": analytics.student_calibration_score(db, student_id),
        "topic_mastery": analytics.student_topic_mastery(db, student_id),
    }


@router.get("/teacher/student-process")
def student_process(
    student_id: int = Query(...),
    quiz_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> list[dict[str, Any]]:
    return analytics.student_process_data(db, student_id, quiz_id)
