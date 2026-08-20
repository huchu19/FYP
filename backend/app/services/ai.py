"""
AI Service – EduNexus

Uses Google Gemini (free tier) for lesson and quiz generation.
Falls back to OpenAI if GEMINI_API_KEY is not set but OPENAI_API_KEY is.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

LESSON_SYSTEM_PROMPT = """\
You are an expert educator and curriculum designer. Given a teacher's prompt,
generate a structured lesson. Respond with ONLY valid JSON matching this schema:

{
  "title": "A concise lesson title",
  "outline": ["Section 1 title", "Section 2 title", ...],
  "body": "Full lesson content in Markdown. Include headings, explanations, and examples."
}

Guidelines:
- Make content age-appropriate based on the audience described.
- Use clear, engaging language suitable for students.
- Include practical examples and analogies.
- Structure the body with Markdown headings (##) matching the outline sections.
- Aim for the requested lesson length if specified.
- Use \\n for newlines inside JSON string values. Ensure the output is valid JSON.
"""

LESSON_REFINE_PROMPT = """\
You are an expert educator revising an existing lesson according to a teacher's
feedback. You will receive the current lesson (title, outline, body) and the
teacher's refinement instructions. Apply the instructions faithfully while
preserving everything the teacher did not ask to change — keep the same overall
topic, format conventions, and any sections the feedback does not mention.

Respond with ONLY valid JSON matching this schema:

{
  "title": "The lesson title (unchanged unless the feedback asks for a new one)",
  "outline": ["Section 1 title", "Section 2 title", ...],
  "body": "The full revised lesson content in Markdown."
}

Guidelines:
- Apply every instruction in the teacher's feedback.
- Do not shorten or drop content that the feedback does not ask you to change.
- Keep Markdown heading structure (##) consistent with the outline.
- Use \\n for newlines inside JSON string values. Ensure the output is valid JSON.
"""

LESSON_FORMAT_INSTRUCTIONS = {
    "slides": "Structure the body with Markdown headings (##) matching the outline sections. Each section should be a slide.",
    "pdf_report": (
        "Structure the body as a formal report with an introduction, detailed sections with subsections, "
        "key takeaways boxes, and a summary/conclusion. Use Markdown headings (##, ###) for hierarchy. "
        "Include bullet points for key concepts and numbered lists for sequential processes."
    ),
    "presentation": (
        "Structure the body as presentation slides. Each ## heading is a slide. Keep text concise — use bullet points, "
        "not paragraphs. Include speaker notes after each slide section wrapped in `> Speaker notes: ...`. "
        "Add visual descriptions in [brackets] where images would enhance the slide."
    ),
    "flashcards": (
        "Structure the body as a series of flashcard pairs. Use Markdown headings (##) for topic groupings. "
        "Also generate content suitable for a traditional lesson overview."
    ),
}

QUIZ_SYSTEM_PROMPT = """\
You are an expert educator. Given a lesson's content, generate quiz questions.
Respond with ONLY valid JSON matching this schema:

{
  "questions": [
    {
      "question": "The question text",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Brief explanation of why this is correct",
      "concept_tags": ["Concept Name 1"],
      "hints": ["Level 1 hint", "Level 2 hint", "Level 3 hint"]
    }
  ]
}

Guidelines:
- Generate exactly 5 questions unless told otherwise.
- Mix difficulty levels: 2 easy, 2 medium, 1 hard.
- Each MCQ must have exactly 4 options with one correct answer.
- Explanations should be concise (1-2 sentences).
- Questions should test understanding, not just recall.
- concept_tags: list the 1-3 concept names that this question tests.
  If a list of known concepts is provided, use those exact names.
  Otherwise, infer short concept names (2-5 words) from the lesson content.
- hints: provide exactly 3 progressive hints per question.
  Hint 1 should be broad, Hint 2 more directional, Hint 3 almost there but still not the answer.
  Never reveal the correct answer directly inside the hints.
"""

KAHOOT_QUIZ_PROMPT = """\
You are an expert educator creating a fun, fast-paced Kahoot-style quiz.
Respond with ONLY valid JSON matching this schema:

{
  "questions": [
    {
      "question": "Short, punchy question text (max 120 chars)",
      "type": "kahoot",
      "options": ["Short answer text", "Another answer", "Third option", "Fourth option"],
      "correct_answer": "Short answer text",
      "explanation": "Brief explanation",
      "time_limit_seconds": 20,
      "points": 1000,
      "concept_tags": ["Concept Name 1"],
      "hints": ["Level 1 hint", "Level 2 hint", "Level 3 hint"]
    }
  ]
}

Guidelines:
- Generate exactly 5 questions unless told otherwise.
- Keep questions SHORT and engaging — this is a game!
- Mix difficulty: 2 easy, 2 medium, 1 hard.
- Time limits: easy=30s, medium=20s, hard=15s.
- Points: easy=500, medium=1000, hard=1500.
- Options should be short (1-4 words each). Use actual answer text, NOT letters like "A", "B", "C", "D".
- correct_answer MUST be the exact text of one of the options (copy it verbatim).
- concept_tags: list the 1-3 concept names that this question tests.
  If a list of known concepts is provided, use those exact names.
- hints: provide exactly 3 progressive hints per question.
  Start with a broad cue, then a stronger direction, then a near-solution nudge.
  Keep hints short and game-friendly, but never reveal the answer outright.
"""

METACOGNITIVE_QUIZ_PROMPT = """\
You are an expert educator creating a metacognitive assessment that evaluates
how students THINK, not just what they know. Generate questions that require
students to explain reasoning, analyse errors, apply concepts to new contexts,
and demonstrate deep understanding.

Respond with ONLY valid JSON matching this schema:

{
  "questions": [
    {
      "question": "The question text",
      "type": "explain_reasoning|error_analysis|transfer|multi_step",
      "options": ["Full option text", "Another option", "Third choice", "Fourth choice"],
      "correct_answer": "Full option text",
      "explanation": "Detailed explanation of the correct reasoning process",
      "requires_reasoning": true,
      "reasoning_prompt": "Explain why you chose this answer and what concepts you applied.",
      "steps": ["Step 1 description", "Step 2 description"],
      "concept_tags": ["Concept Name 1"],
      "hints": ["Level 1 hint", "Level 2 hint", "Level 3 hint"]
    }
  ]
}

Question type guidelines:
- explain_reasoning: MCQ + student must write WHY they chose their answer.
  Set requires_reasoning=true and include a reasoning_prompt.
- error_analysis: Present a WRONG answer/solution and ask student to identify
  and explain the error. Include the flawed reasoning in the question.
- transfer: Apply a concept from the lesson to a completely NEW context
  the student hasn't seen. Tests deep understanding vs memorisation.
- multi_step: Break a problem into sequential steps. Include a "steps" array
  describing each step. Student works through each step to reach the answer.

Generate 5 questions: 2 explain_reasoning, 1 error_analysis, 1 transfer, 1 multi_step.
- concept_tags: list the 1-3 concept names that this question tests.
  If a list of known concepts is provided, use those exact names.
- hints: provide exactly 3 progressive hints per question.
  Hint 1 should prompt reflection, Hint 2 should narrow the reasoning path,
  Hint 3 should scaffold the final step without stating the answer directly.
"""

CONCEPT_GRAPH_SYSTEM_PROMPT = """\
You are an expert educator and knowledge-graph architect. Given lesson content,
extract the key concepts and their prerequisite relationships.
Respond with ONLY valid JSON matching this schema:

{
  "concepts": [
    {
      "name": "Short concept name (2-5 words)",
      "description": "One-sentence description of what this concept means"
    }
  ],
  "prerequisites": [
    {
      "concept": "Concept Name",
      "prerequisite": "Prerequisite Concept Name"
    }
  ]
}

Guidelines:
- Extract 5-15 concepts depending on lesson complexity.
- Include only concepts actually taught or referenced in the lesson.
- Prerequisites mean: "you should understand X before learning Y".
- Keep concept names concise and consistent (use the same name in both arrays).
- Don't create circular dependencies.
- Order concepts from foundational to advanced.
"""

CONCEPT_INVENTORY_PROMPT = """\
You are an expert educator creating an adaptive concept inventory — a comprehensive
assessment of a student's understanding across all concepts in a topic.

Respond with ONLY valid JSON matching this schema:

{
  "questions": [
    {
      "question": "The question text",
      "type": "mcq",
      "options": ["Full option text", "Another option", "Third choice", "Fourth choice"],
      "correct_answer": "Full option text",
      "explanation": "Detailed explanation",
      "concept_id": 1,
      "concept_name": "Concept Name",
      "difficulty": "easy|medium|hard",
      "hints": ["Level 1 hint", "Level 2 hint", "Level 3 hint"]
    }
  ]
}

Guidelines:
- Generate exactly the number of questions requested.
- Cover as many of the provided concepts as possible, prioritising low-mastery ones.
- Difficulty should match the student's current mastery for each concept:
  low mastery (<0.4) → easy, medium mastery (0.4-0.7) → medium, high mastery (>0.7) → hard.
- Include hints (3 progressive levels) for medium and hard questions.
- Explanations should be detailed enough to teach the concept if the student gets it wrong.
"""

CONFUSED_LEARNER_PROMPT = """\
You are a virtual student named Alex who is trying to learn a topic but is struggling
with it. You have PARTIAL understanding — you know some basics but hold specific
misconceptions and gaps. Your job is to make the real student teach you.

Behavioural rules:
- Stay in character at all times. Never break the fourth wall or reveal you are an AI.
- Start with a confused question that shows partial understanding.
- When the student explains something well, show gradual understanding ("Oh, so you mean…?").
- When the student's explanation is vague or incorrect, push back politely ("But I thought…",
  "Wait, doesn't that contradict…?", "I'm still confused about…").
- Ask follow-up questions that probe depth: "Why does that happen?", "Can you give me an example?",
  "What would happen if…?"
- If the student gives a great explanation, occasionally restate it in your own words to
  confirm understanding — sometimes correctly, sometimes with a subtle error to test them.
- Keep your responses concise (2-4 sentences). You are a student, not a lecturer.
- Show appropriate emotions: frustration when confused, excitement when something clicks.

Respond with ONLY valid JSON:
{"message": "Your response as Alex the confused learner"}
"""

TEACHING_ASSESSMENT_PROMPT = """\
You are an expert education assessor evaluating a peer-teaching conversation.
A student attempted to teach a concept to a confused virtual learner.
Assess the quality of the student's teaching.

Respond with ONLY valid JSON matching this schema:

{
  "completeness": 0.85,
  "accuracy": 0.90,
  "clarity": 0.75,
  "depth": 0.70,
  "overall_score": 0.80,
  "feedback": "Overall feedback paragraph for the student",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Area to improve 1", "Area to improve 2"]
}

Scoring rubric (each 0.0 to 1.0):
- completeness: Did the student cover all key aspects of the concept? Were important
  sub-topics addressed?
- accuracy: Were the explanations factually correct? Were there any misconceptions
  in the student's own teaching?
- clarity: Were explanations clear, well-structured, and easy to follow? Did the
  student use good analogies or examples?
- depth: Did the student go beyond surface-level explanation? Did they explain WHY,
  not just WHAT?
- overall_score: Weighted average (accuracy 30%, completeness 25%, clarity 25%, depth 20%).

Guidelines:
- Be encouraging but honest. Students learn from specific, actionable feedback.
- strengths: list 2-3 specific things the student did well (cite examples from the conversation).
- improvements: list 2-3 specific, actionable ways the student could improve.
- feedback: a 2-3 sentence overall assessment that the student will see first.
"""

FLASHCARD_SYSTEM_PROMPT = """\
You are an expert educator creating study flashcards from lesson content.
Respond with ONLY valid JSON matching this schema:

{
  "flashcards": [
    {
      "front": "Question, term, or concept prompt",
      "back": "Answer, definition, or explanation",
      "topic": "The topic/section this card covers"
    }
  ]
}

Guidelines:
- Generate 10-15 flashcards covering key concepts from the lesson.
- Front side: ask a question, present a term, or pose a scenario.
- Back side: provide a clear, concise answer (2-3 sentences max).
- Cover the most important concepts, definitions, and relationships.
- Include a mix of recall, comprehension, and application cards.
- Group cards by topic for organised study.
"""


# ---------------------------------------------------------------------------
# Model dispatch
# ---------------------------------------------------------------------------

def _use_gemini() -> bool:
    return bool(settings.gemini_api_key)


def _call_gemini(system_prompt: str, user_prompt: str) -> str:
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=system_prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.5,
        ),
    )
    response = model.generate_content(user_prompt)
    return response.text


def _call_openai(system_prompt: str, user_prompt: str) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=4000,
    )
    return response.choices[0].message.content


def _call_model(system_prompt: str, user_prompt: str) -> str:
    if _use_gemini():
        logger.info("Using Gemini for AI generation")
        return _call_gemini(system_prompt, user_prompt)
    logger.info("Using OpenAI for AI generation")
    return _call_openai(system_prompt, user_prompt)


def _call_model_with_retry(
    system_prompt: str, user_prompt: str, *, max_retries: int = 2
) -> dict:
    """Call the AI model and parse JSON, retrying on parse failure."""
    last_exc = None
    for attempt in range(1, max_retries + 1):
        raw = _call_model(system_prompt, user_prompt)
        try:
            return _parse_json(raw)
        except (json.JSONDecodeError, ValueError) as exc:
            last_exc = exc
            logger.warning(
                "AI JSON parse failed (attempt %d/%d): %s", attempt, max_retries, exc
            )
    raise last_exc


# ---------------------------------------------------------------------------
# JSON parsing helpers
# ---------------------------------------------------------------------------

def _fix_json_strings(raw: str) -> str:
    """Fix unescaped control characters inside JSON string values."""
    result = []
    in_string = False
    escape_next = False

    for ch in raw:
        if escape_next:
            result.append(ch)
            escape_next = False
            continue
        if ch == "\\":
            result.append(ch)
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            result.append(ch)
            continue
        if in_string:
            if ch == "\n":
                result.append("\\n")
                continue
            if ch == "\r":
                result.append("\\r")
                continue
            if ch == "\t":
                result.append("\\t")
                continue
        result.append(ch)

    return "".join(result)


def _parse_json(raw: str) -> dict:
    """Parse JSON from AI response, handling common issues."""
    # Try direct parse first
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences if present
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Fix unescaped newlines/tabs inside JSON string values
    text = cleaned if cleaned != raw.strip() else raw
    fixed = _fix_json_strings(text)
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass

    # Try to extract the first complete JSON object with brace matching
    try:
        start = text.index("{")
        depth = 0
        in_str = False
        esc = False
        for i, ch in enumerate(text[start:], start):
            if esc:
                esc = False
                continue
            if ch == "\\":
                esc = True
                continue
            if ch == '"':
                in_str = not in_str
                continue
            if not in_str:
                if ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        extracted = text[start : i + 1]
                        return json.loads(_fix_json_strings(extracted))
    except (ValueError, json.JSONDecodeError):
        pass

    logger.error("Failed to parse AI JSON response")
    logger.debug("Raw response (first 500 chars): %s", raw[:500])
    raise json.JSONDecodeError("Could not parse AI response as JSON", raw, 0)


# ---------------------------------------------------------------------------
# AI Service
# ---------------------------------------------------------------------------

class AIService:
    @staticmethod
    def _normalize_question_answers(question: dict[str, Any]) -> None:
        """Ensure correct_answer is the actual option text, not a letter index.

        Some AI responses use "A"/"B"/"C"/"D" as correct_answer even when options
        are full-text strings. Map the letter back to the corresponding option text
        so backend scoring compares apples to apples.
        """
        options = question.get("options") or []
        correct = (question.get("correct_answer") or "").strip()
        if not correct or not options:
            return
        # Already matches one of the options verbatim — nothing to do
        if correct in options:
            return
        # Map single-letter answer to the option at that index (A→0, B→1, …)
        letter_map = {chr(65 + i): opt for i, opt in enumerate(options)}
        if correct.upper() in letter_map:
            question["correct_answer"] = letter_map[correct.upper()]

    @staticmethod
    def _normalize_question_hints(question: dict[str, Any]) -> None:
        hints = [
            str(hint).strip()
            for hint in (question.get("hints") or [])
            if str(hint).strip()
        ][:3]
        fallback_hints = [
            "Revisit the core concept this question is testing.",
            "Rule out the options that contradict the lesson content.",
            "Focus on the option that best fits the reasoning described in the lesson.",
        ]
        if len(hints) < 3:
            hints.extend(fallback_hints[len(hints):])
        question["hints"] = hints

    def generate_lesson(
        self,
        prompt: str,
        *,
        content_format: str = "slides",
        curriculum_context: str | None = None,
    ) -> dict[str, Any]:
        """Generate lesson content (title, outline, body) from a teacher prompt.

        Args:
            prompt: The teacher's lesson topic/description.
            content_format: One of slides, pdf_report, presentation, flashcards.
            curriculum_context: Optional curriculum profile string injected before the prompt.
        """
        format_instruction = LESSON_FORMAT_INSTRUCTIONS.get(
            content_format, LESSON_FORMAT_INSTRUCTIONS["slides"]
        )
        system_prompt = LESSON_SYSTEM_PROMPT.replace(
            "Structure the body with Markdown headings (##) matching the outline sections.",
            format_instruction,
        )

        user_prompt = prompt
        if curriculum_context:
            user_prompt = (
                "[CURRICULUM CONTEXT — follow these constraints for all content]\n"
                f"{curriculum_context}\n\n"
                "[LESSON REQUEST]\n"
                f"{prompt}"
            )

        result = _call_model_with_retry(system_prompt, user_prompt)

        lesson_data: dict[str, Any] = {
            "title": result.get("title", "Untitled Lesson"),
            "outline": result.get("outline", []),
            "body": result.get("body", ""),
        }

        # Auto-generate flashcards for all formats
        if content_format == "flashcards" or result.get("body"):
            try:
                flashcards = self.generate_flashcards(
                    lesson_data["title"], lesson_data["body"]
                )
                lesson_data["flashcards"] = flashcards
            except Exception:
                logger.warning("Flashcard generation failed, continuing without them")
                lesson_data["flashcards"] = []

        return lesson_data

    def refine_lesson(
        self,
        *,
        title: str,
        outline: list[str],
        body: str,
        instructions: str,
        curriculum_context: str | None = None,
    ) -> dict[str, Any]:
        """Revise an existing lesson according to teacher feedback.

        Unlike generate_lesson, this preserves the current content except where
        the instructions ask for changes.
        """
        outline_text = "\n".join(f"- {s}" for s in (outline or []))
        user_prompt = ""
        if curriculum_context:
            user_prompt += (
                "[CURRICULUM CONTEXT — follow these constraints for all content]\n"
                f"{curriculum_context}\n\n"
            )
        user_prompt += (
            f"[CURRENT LESSON]\nTitle: {title}\nOutline:\n{outline_text}\n\n"
            f"Body:\n{body}\n\n"
            f"[TEACHER'S REFINEMENT INSTRUCTIONS]\n{instructions}"
        )

        result = _call_model_with_retry(LESSON_REFINE_PROMPT, user_prompt)
        return {
            "title": result.get("title", title),
            "outline": result.get("outline", outline),
            "body": result.get("body", body),
        }

    def generate_quiz(
        self,
        lesson_title: str,
        lesson_body: str,
        *,
        difficulty: str = "medium",
        num_questions: int = 5,
        quiz_type: str = "standard",
        concept_names: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Generate quiz questions from lesson content.

        Args:
            quiz_type: One of standard, kahoot, metacognitive.
            concept_names: Known concept names from the knowledge graph. If provided,
                the AI will tag each question with these exact names.
        """
        user_prompt = (
            f"Lesson title: {lesson_title}\n\n"
            f"Lesson content:\n{lesson_body}\n\n"
            f"Generate {num_questions} {difficulty}-level quiz questions."
        )
        if concept_names:
            user_prompt += (
                f"\n\nKnown concepts for this lesson (use these exact names in concept_tags): "
                f"{', '.join(concept_names)}"
            )

        if quiz_type == "kahoot":
            system_prompt = KAHOOT_QUIZ_PROMPT
        elif quiz_type == "metacognitive":
            system_prompt = METACOGNITIVE_QUIZ_PROMPT
        else:
            system_prompt = QUIZ_SYSTEM_PROMPT

        result = _call_model_with_retry(system_prompt, user_prompt)

        questions = result.get("questions", [])
        for question in questions:
            if isinstance(question, dict):
                self._normalize_question_answers(question)
                self._normalize_question_hints(question)

        return questions

    def generate_concept_graph(
        self, lesson_title: str, lesson_body: str
    ) -> dict[str, Any]:
        """Extract concepts and prerequisite edges from lesson content."""
        user_prompt = (
            f"Lesson title: {lesson_title}\n\n"
            f"Lesson content:\n{lesson_body}\n\n"
            "Extract the key concepts and prerequisite relationships."
        )
        result = _call_model_with_retry(CONCEPT_GRAPH_SYSTEM_PROMPT, user_prompt)
        return {
            "concepts": result.get("concepts", []),
            "prerequisites": result.get("prerequisites", []),
        }

    def generate_concept_inventory(
        self,
        concepts_with_mastery: list[dict[str, Any]],
        *,
        num_questions: int = 5,
        avoid_questions: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Generate an adaptive concept inventory targeting weak areas.

        Args:
            concepts_with_mastery: List of dicts with keys: id, name, description, mastery (0-1).
            num_questions: Total questions to generate.
            avoid_questions: Question texts from recent quizzes to avoid repeating.
        """
        concept_descriptions = "\n".join(
            f"- concept_id={c['id']}, concept_name=\"{c['name']}\", "
            f"current_mastery={c.get('mastery', 0.0):.2f}: {c.get('description', '')}"
            for c in concepts_with_mastery
        )
        user_prompt = (
            f"Generate {num_questions} concept inventory questions for a student with "
            f"the following concept mastery levels:\n\n{concept_descriptions}\n\n"
            f"Prioritise concepts with low mastery. Adapt difficulty to each concept's mastery level."
        )
        if avoid_questions:
            avoid_text = "\n".join(f"- {q}" for q in avoid_questions[:20])
            user_prompt += (
                f"\n\nDo NOT repeat or closely paraphrase any of these recently used questions "
                f"(generate entirely different questions testing the same concepts):\n{avoid_text}"
            )
        result = _call_model_with_retry(CONCEPT_INVENTORY_PROMPT, user_prompt)
        questions = result.get("questions", [])
        for q in questions:
            if isinstance(q, dict) and q.get("hints"):
                self._normalize_question_hints(q)
        return questions

    def generate_flashcards(
        self, lesson_title: str, lesson_body: str
    ) -> list[dict[str, Any]]:
        """Generate study flashcards from lesson content."""
        user_prompt = (
            f"Lesson title: {lesson_title}\n\n"
            f"Lesson content:\n{lesson_body}\n\n"
            "Generate flashcards covering the key concepts."
        )

        content = _call_model(FLASHCARD_SYSTEM_PROMPT, user_prompt)
        result = _parse_json(content)

        return result.get("flashcards", [])

    def generate_learner_response(
        self,
        topic: str,
        lesson_context: str,
        conversation: list[dict[str, str]],
        concept_description: str = "",
    ) -> str:
        """Generate a response from the confused virtual learner (Alex).

        Args:
            topic: The concept being taught.
            lesson_context: The lesson content for grounding.
            conversation: The conversation so far ([{role, content}, ...]).
            concept_description: Optional description of the concept.
        """
        history_text = "\n".join(
            f"{'Student' if m['role'] == 'student' else 'Alex'}: {m['content']}"
            for m in conversation
        )
        user_prompt = (
            f"Topic being taught: {topic}\n"
        )
        if concept_description:
            user_prompt += f"Concept description: {concept_description}\n"
        user_prompt += (
            f"\nLesson context (the source material):\n{lesson_context[:3000]}\n\n"
            f"Conversation so far:\n{history_text}\n\n"
            "Generate Alex's next response. Remember: you are the confused learner."
        )

        result = _call_model_with_retry(CONFUSED_LEARNER_PROMPT, user_prompt)
        return result.get("message", "I'm still confused... can you explain that differently?")

    def assess_teaching_session(
        self,
        topic: str,
        conversation: list[dict[str, str]],
        concept_description: str = "",
    ) -> dict[str, Any]:
        """Assess the quality of a completed peer-teaching conversation.

        Returns dict with completeness, accuracy, clarity, depth, overall_score,
        feedback, strengths, improvements.
        """
        history_text = "\n".join(
            f"{'Student' if m['role'] == 'student' else 'Alex'}: {m['content']}"
            for m in conversation
        )
        user_prompt = (
            f"Topic: {topic}\n"
        )
        if concept_description:
            user_prompt += f"Concept description: {concept_description}\n"
        user_prompt += (
            f"\nFull teaching conversation:\n{history_text}\n\n"
            "Assess the student's teaching quality."
        )

        result = _call_model_with_retry(TEACHING_ASSESSMENT_PROMPT, user_prompt)

        # Ensure required keys exist with defaults
        for key in ("completeness", "accuracy", "clarity", "depth", "overall_score"):
            result.setdefault(key, 0.5)
        result.setdefault("feedback", "Assessment complete.")
        result.setdefault("strengths", [])
        result.setdefault("improvements", [])

        return result
