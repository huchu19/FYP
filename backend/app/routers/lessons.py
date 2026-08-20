from fastapi import APIRouter, Depends, Response, UploadFile, File
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.rate_limit import rate_limit_user
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.services.lesson_service import LessonService
from app.services.document_service import DocumentService
from app.services.quiz_service import QuizService
from app.services.storage import load_document
from app.schemas.lesson import Lesson, LessonCreate, LessonRefine, LessonReformat, LessonUpdate, LessonDocument
from app.schemas.quiz import Quiz as QuizSchema

router = APIRouter(prefix="/lessons", tags=["lessons"])
service = LessonService()
doc_service = DocumentService()
quiz_service = QuizService()


@router.get("/", response_model=list[Lesson])
def list_lessons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Lesson]:
    return service.list_lessons(db)


@router.post(
    "/",
    response_model=Lesson,
    status_code=201,
    dependencies=[Depends(rate_limit_user(limit=20, window_seconds=3600, scope="ai_generate"))],
)
def create_lesson(
    payload: LessonCreate,
    generate: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Lesson:
    return service.create_lesson(db, payload, actor_user=current_user, use_ai=generate)


@router.post("/extract-text")
def extract_document_text(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles("teacher")),
) -> dict:
    """Extract text from an uploaded file without persisting it."""
    file_bytes = file.file.read()
    mime_type = file.content_type or "application/octet-stream"
    text = DocumentService.extract_text(file_bytes, mime_type)
    return {"extracted_text": text, "filename": file.filename}


@router.get("/{lesson_id}", response_model=Lesson)
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Lesson:
    return service.get_lesson(db, lesson_id)


@router.patch("/{lesson_id}", response_model=Lesson)
def update_lesson(
    lesson_id: int,
    payload: LessonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Lesson:
    return service.update_lesson(db, lesson_id, payload, actor_user=current_user)


@router.patch("/{lesson_id}/publish", response_model=Lesson)
def publish_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Lesson:
    return service.publish_lesson(db, lesson_id, actor_user=current_user)


@router.patch("/{lesson_id}/unpublish", response_model=Lesson)
def unpublish_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Lesson:
    return service.unpublish_lesson(db, lesson_id, actor_user=current_user)


@router.post(
    "/{lesson_id}/reformat",
    response_model=Lesson,
    dependencies=[Depends(rate_limit_user(limit=20, window_seconds=3600, scope="ai_generate"))],
)
def reformat_lesson(
    lesson_id: int,
    payload: LessonReformat,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Lesson:
    return service.reformat_lesson(
        db, lesson_id, content_format=payload.content_format, actor_user=current_user
    )


@router.post(
    "/{lesson_id}/refine",
    response_model=Lesson,
    dependencies=[Depends(rate_limit_user(limit=20, window_seconds=3600, scope="ai_generate"))],
)
def refine_lesson(
    lesson_id: int,
    payload: LessonRefine,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Lesson:
    """Revise the lesson content according to the teacher's feedback."""
    return service.refine_lesson(
        db, lesson_id, instructions=payload.instructions, actor_user=current_user
    )


@router.post("/{lesson_id}/documents", response_model=LessonDocument, status_code=201)
def upload_document(
    lesson_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> LessonDocument:
    return doc_service.upload_document(db, lesson_id, file, actor_user=current_user)


@router.get("/{lesson_id}/documents", response_model=list[LessonDocument])
def list_documents(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[LessonDocument]:
    # Verify the caller is allowed to read this lesson
    doc_service.assert_can_read_lesson(db, lesson_id, actor_user=current_user)
    return doc_service.list_documents(db, lesson_id)


@router.get("/{lesson_id}/documents/{doc_id}/download")
def download_document(
    lesson_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.lesson_document import LessonDocument as LessonDocModel

    doc_service.assert_can_read_lesson(db, lesson_id, actor_user=current_user)
    doc = db.query(LessonDocModel).filter(
        LessonDocModel.id == doc_id,
        LessonDocModel.lesson_id == lesson_id,
    ).first()
    if doc is None:
        return Response(content="Document not found", status_code=404)

    content = load_document(doc.file_path)

    return Response(
        content=content,
        media_type=doc.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{doc.filename}"'},
    )


@router.get("/{lesson_id}/export")
def export_lesson(
    lesson_id: int,
    format: str = "markdown",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    lesson = service.get_lesson(db, lesson_id)

    # Build a safe filename (strip unsafe chars)
    safe_title = "".join(
        c for c in (lesson.title or "lesson") if c.isalnum() or c in (" ", "-", "_")
    ).strip() or "lesson"

    if format == "markdown":
        md_content = f"# {lesson.title}\n\n{lesson.body or ''}"
        return Response(
            content=md_content,
            media_type="text/markdown; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_title}.md"'
            },
        )

    elif format == "html":
        body_html = _markdown_to_html(lesson.body or "")
        title_escaped = (lesson.title or "Lesson").replace("<", "&lt;").replace(">", "&gt;")
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title_escaped}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.65; color: #222; max-width: 820px; margin: 0 auto; padding: 48px 32px; background: #fff; }}
        h1 {{ border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-top: 0; }}
        h2 {{ margin-top: 1.8em; color: #1f2937; }}
        h3 {{ margin-top: 1.4em; color: #374151; }}
        p {{ margin: 0.7em 0; }}
        ul, ol {{ margin: 0.7em 0; padding-left: 1.6em; }}
        li {{ margin: 0.25em 0; }}
        code {{ background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'SF Mono', Menlo, Monaco, 'Courier New', monospace; font-size: 0.92em; }}
        pre {{ background: #f4f4f4; padding: 15px; border-radius: 6px; overflow-x: auto; }}
        pre code {{ background: none; padding: 0; }}
        blockquote {{ border-left: 4px solid #c7d2fe; margin: 1em 0; padding: 0.4em 1em; color: #555; background: #f9fafb; }}
        hr {{ border: none; border-top: 1px solid #e5e7eb; margin: 2em 0; }}
        @media print {{ body {{ padding: 0; }} }}
    </style>
</head>
<body>
    <h1>{title_escaped}</h1>
    {body_html}
</body>
</html>
"""
        return Response(
            content=html_content,
            media_type="text/html; charset=utf-8",
            headers={
                "Content-Disposition": f'inline; filename="{safe_title}.html"'
            },
        )

    else:
        return Response(
            content=f"Unsupported format: {format}. Use 'markdown' or 'html'.",
            status_code=400,
        )


def _markdown_to_html(md: str) -> str:
    """Minimal markdown-to-HTML converter for lesson export.

    Supports headings (# / ## / ###), paragraphs, bullet/numbered lists, bold,
    italic, inline code, fenced code blocks, and blockquotes. Escapes raw HTML.
    """
    import re
    from html import escape

    if not md:
        return "<p>No content available.</p>"

    lines = md.split("\n")
    out: list[str] = []
    in_code = False
    in_ul = False
    in_ol = False
    para: list[str] = []

    def flush_para():
        nonlocal para
        if para:
            text = " ".join(para).strip()
            if text:
                out.append(f"<p>{_inline_md(text)}</p>")
            para = []

    def close_lists():
        nonlocal in_ul, in_ol
        if in_ul:
            out.append("</ul>")
            in_ul = False
        if in_ol:
            out.append("</ol>")
            in_ol = False

    for raw_line in lines:
        line = raw_line.rstrip()

        # Fenced code block toggle
        if line.startswith("```"):
            flush_para()
            close_lists()
            if in_code:
                out.append("</code></pre>")
                in_code = False
            else:
                out.append("<pre><code>")
                in_code = True
            continue

        if in_code:
            out.append(escape(line))
            continue

        if not line.strip():
            flush_para()
            close_lists()
            continue

        # Headings
        heading_match = re.match(r"^(#{1,6})\s+(.*)$", line)
        if heading_match:
            flush_para()
            close_lists()
            level = len(heading_match.group(1))
            text = heading_match.group(2)
            out.append(f"<h{level}>{_inline_md(text)}</h{level}>")
            continue

        # Blockquote
        if line.lstrip().startswith(">"):
            flush_para()
            close_lists()
            content = line.lstrip()[1:].strip()
            out.append(f"<blockquote>{_inline_md(content)}</blockquote>")
            continue

        # Unordered list item
        ul_match = re.match(r"^[\s]*[-*+]\s+(.*)$", line)
        if ul_match:
            flush_para()
            if in_ol:
                out.append("</ol>")
                in_ol = False
            if not in_ul:
                out.append("<ul>")
                in_ul = True
            out.append(f"<li>{_inline_md(ul_match.group(1))}</li>")
            continue

        # Ordered list item
        ol_match = re.match(r"^[\s]*\d+\.\s+(.*)$", line)
        if ol_match:
            flush_para()
            if in_ul:
                out.append("</ul>")
                in_ul = False
            if not in_ol:
                out.append("<ol>")
                in_ol = True
            out.append(f"<li>{_inline_md(ol_match.group(1))}</li>")
            continue

        # Horizontal rule
        if re.match(r"^\s*[-*_]{3,}\s*$", line):
            flush_para()
            close_lists()
            out.append("<hr>")
            continue

        # Default: paragraph text
        close_lists()
        para.append(line)

    flush_para()
    close_lists()
    if in_code:
        out.append("</code></pre>")

    return "\n".join(out)


def _inline_md(text: str) -> str:
    """Apply inline markdown (bold, italic, code) with HTML escaping."""
    import re
    from html import escape

    # Escape first
    escaped = escape(text)
    # Inline code `code`
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    # Bold **text**
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", escaped)
    # Italic *text*
    escaped = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", escaped)
    return escaped


@router.post("/{lesson_id}/self-quiz", response_model=QuizSchema, status_code=201)
def create_self_quiz(
    lesson_id: int,
    difficulty: str = "medium",
    quiz_type: str = "standard",
    num_questions: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> QuizSchema:
    return quiz_service.create_self_quiz(
        db,
        lesson_id,
        actor_user=current_user,
        difficulty=difficulty,
        quiz_type=quiz_type,
        num_questions=num_questions,
    )


@router.delete("/{lesson_id}", status_code=204)
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
):
    service.delete_lesson(db, lesson_id, actor_user=current_user)
    return Response(status_code=204)
