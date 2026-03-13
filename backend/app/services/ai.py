"""
AI Service – EduNexus

Uses Google Gemini (free tier) for lesson and quiz generation.
Falls back to OpenAI if GEMINI_API_KEY is not set but OPENAI_API_KEY is.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

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
"""

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
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Guidelines:
- Generate exactly 5 questions unless told otherwise.
- Mix difficulty levels: 2 easy, 2 medium, 1 hard.
- Each MCQ must have exactly 4 options with one correct answer.
- Explanations should be concise (1-2 sentences).
- Questions should test understanding, not just recall.
"""


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
            temperature=0.7,
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


class AIService:
    def generate_lesson(self, prompt: str) -> dict[str, Any]:
        """Generate lesson content (title, outline, body) from a teacher prompt."""
        content = _call_model(LESSON_SYSTEM_PROMPT, prompt)
        result = json.loads(content)

        return {
            "title": result.get("title", "Untitled Lesson"),
            "outline": result.get("outline", []),
            "body": result.get("body", ""),
        }

    def generate_quiz(
        self,
        lesson_title: str,
        lesson_body: str,
        *,
        difficulty: str = "medium",
        num_questions: int = 5,
    ) -> list[dict[str, Any]]:
        """Generate quiz questions from lesson content."""
        user_prompt = (
            f"Lesson title: {lesson_title}\n\n"
            f"Lesson content:\n{lesson_body}\n\n"
            f"Generate {num_questions} {difficulty}-level quiz questions."
        )

        content = _call_model(QUIZ_SYSTEM_PROMPT, user_prompt)
        result = json.loads(content)

        return result.get("questions", [])
