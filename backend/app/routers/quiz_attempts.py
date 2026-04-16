from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.schemas.quiz_attempt import QuizAttemptDetail, QuizAttemptReflection, QuizAttemptResult, QuizAttemptSubmit
from app.services.quiz_attempt_service import QuizAttemptService

router = APIRouter(prefix="/quizzes", tags=["quiz-attempts"])
service = QuizAttemptService()
attempt_router = APIRouter(prefix="/attempts", tags=["quiz-attempts"])


@router.post("/{quiz_id}/attempts", response_model=QuizAttemptDetail, status_code=201)
def submit_quiz_attempt(
    quiz_id: int,
    payload: QuizAttemptSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> QuizAttemptDetail:
    attempt = service.submit_attempt(
        db,
        quiz_id=quiz_id,
        answers=payload.answers,
        actor_user=current_user,
        time_taken_seconds=payload.time_taken_seconds,
        reflection=payload.reflection,
        self_rated_understanding=payload.self_rated_understanding,
    )
    responses = service.attempt_repo.get_responses(db, attempt.id)
    xp_earned = sum(r.awarded_xp for r in responses)
    calibration_score = getattr(attempt, "_calibration_score", None)
    return QuizAttemptDetail(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        student_id=attempt.student_id,
        score=attempt.score,
        max_score=attempt.max_score,
        time_taken_seconds=attempt.time_taken_seconds,
        difficulty_snapshot=attempt.difficulty_snapshot,
        reflection=attempt.reflection,
        self_rated_understanding=attempt.self_rated_understanding,
        calibration_score=calibration_score,
        started_at=attempt.started_at,
        completed_at=attempt.completed_at,
        responses=responses,
        xp_earned=xp_earned,
    )


@router.get("/{quiz_id}/attempts", response_model=list[QuizAttemptResult])
def list_my_attempts(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[QuizAttemptResult]:
    return service.list_student_attempts(db, current_user.id, quiz_id=quiz_id)


@attempt_router.post("/{attempt_id}/reflection", response_model=QuizAttemptResult)
def update_reflection(
    attempt_id: int,
    payload: QuizAttemptReflection,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> QuizAttemptResult:
    return service.update_reflection(
        db, attempt_id, actor_user=current_user,
        reflection=payload.reflection,
        self_rated_understanding=payload.self_rated_understanding,
    )
