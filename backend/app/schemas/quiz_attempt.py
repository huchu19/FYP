from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict


class AnswerDetail(BaseModel):
    selected_answer: str
    confidence_level: Optional[int] = None  # 1-5
    reasoning_text: Optional[str] = None  # explain-your-answer
    reasoning_steps: Optional[Dict[str, Any]] = None  # {time_spent_ms, answer_changes, ...}
    hints_used: int = 0


class QuizAttemptSubmit(BaseModel):
    answers: Dict[str, Union[str, AnswerDetail]]  # {question_index: answer_or_detail}
    time_taken_seconds: Optional[int] = None
    reflection: Optional[str] = None
    self_rated_understanding: Optional[int] = None  # 1-5


class QuizAttemptReflection(BaseModel):
    reflection: Optional[str] = None
    self_rated_understanding: Optional[int] = None  # 1-5


class QuizAttemptResponse(BaseModel):
    question_index: int
    selected_answer: str
    is_correct: bool
    awarded_xp: int
    hints_used: int = 0
    question_payload: Dict[str, Any]
    confidence_level: Optional[int] = None
    reasoning_text: Optional[str] = None
    reasoning_steps: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class QuizAttemptResult(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    score: float
    max_score: int
    time_taken_seconds: Optional[int]
    difficulty_snapshot: Optional[str]
    reflection: Optional[str] = None
    self_rated_understanding: Optional[int] = None
    calibration_score: Optional[float] = None  # computed: confidence vs actual accuracy
    started_at: datetime
    completed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ConceptDelta(BaseModel):
    concept_id: int
    concept_name: str
    mastery_before: float
    mastery_after: float
    delta: float


class QuizAttemptDetail(QuizAttemptResult):
    responses: List[QuizAttemptResponse] = []
    xp_earned: int = 0
    concept_deltas: Optional[List[ConceptDelta]] = None
