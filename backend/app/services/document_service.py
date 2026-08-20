import logging
import os
from pathlib import Path

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.models.lesson_document import LessonDocument
from app.models.user import User
from app.repositories.classroom_repository import ClassroomRepository
from app.repositories.lesson_repository import LessonRepository

logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"

MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def sanitize_filename(filename: str | None) -> str:
    """Reduce an uploaded filename to a safe basename.

    Uploaded names are attacker-controlled, so strip any directory
    component and keep only characters that cannot escape the target
    directory.
    """
    base = os.path.basename(filename or "").strip()
    cleaned = "".join(c for c in base if c.isalnum() or c in (" ", "-", "_", ".")).strip()
    cleaned = cleaned.lstrip(".")
    return cleaned or "upload"


class DocumentService:
    def __init__(self, lesson_repository: LessonRepository | None = None):
        self.lesson_repository = lesson_repository or LessonRepository()

    @staticmethod
    def extract_text(file_bytes: bytes, mime_type: str) -> str:
        """Extract text from uploaded file based on MIME type."""
        if mime_type == "text/plain":
            return file_bytes.decode("utf-8", errors="replace")

        elif mime_type == "application/pdf":
            try:
                from pdfminer.high_level import extract_text as pdfminer_extract
                from io import BytesIO

                text = pdfminer_extract(BytesIO(file_bytes))
                return text or ""
            except ImportError:
                logger.error("pdfminer.six not installed, unable to extract PDF text")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="PDF extraction not available",
                )
            except Exception as e:
                logger.exception("Failed to extract PDF text")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to extract PDF: {str(e)}",
                )

        elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            try:
                from docx import Document
                from io import BytesIO

                doc = Document(BytesIO(file_bytes))
                text = "\n".join(paragraph.text for paragraph in doc.paragraphs)
                return text or ""
            except ImportError:
                logger.error("python-docx not installed, unable to extract DOCX text")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="DOCX extraction not available",
                )
            except Exception as e:
                logger.exception("Failed to extract DOCX text")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to extract DOCX: {str(e)}",
                )

        else:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file type: {mime_type}. Supported: text/plain, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )

    def upload_document(
        self,
        db: Session,
        lesson_id: int,
        file: UploadFile,
        *,
        actor_user: User,
    ) -> LessonDocument:
        """Upload a document to a lesson, extract text, and store it."""
        lesson = self.lesson_repository.get_by_id(db, lesson_id)
        if lesson is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

        if lesson.created_by_user_id != actor_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the lesson creator can upload documents",
            )

        # Create lesson uploads directory
        lesson_dir = UPLOADS_DIR / "lessons" / str(lesson_id)
        lesson_dir.mkdir(parents=True, exist_ok=True)

        # Read file contents, refusing anything oversized
        file_bytes = file.file.read(MAX_UPLOAD_BYTES + 1)
        if len(file_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)}MB upload limit",
            )
        file.file.seek(0)

        # Determine MIME type
        mime_type = file.content_type or "application/octet-stream"

        # Extract text
        extracted_text = self.extract_text(file_bytes, mime_type)

        # Save file to disk under a sanitized name
        safe_name = sanitize_filename(file.filename)
        file_path = lesson_dir / safe_name
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        # Create database record
        doc = LessonDocument(
            lesson_id=lesson_id,
            filename=safe_name,
            file_path=str(file_path),
            mime_type=mime_type,
            extracted_text=extracted_text,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        logger.info(f"Uploaded document {file.filename} to lesson {lesson_id}")
        return doc

    def assert_can_read_lesson(self, db: Session, lesson_id: int, *, actor_user: User) -> None:
        """Allow the owning teacher or a student enrolled in the classroom.

        Existence alone is not authorization: without this check any
        authenticated user can read any lesson's documents.
        """
        lesson = self.lesson_repository.get_by_id(db, lesson_id)
        if lesson is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

        if lesson.created_by_user_id == actor_user.id:
            return

        enrollment = ClassroomRepository().get_enrollment(
            db, classroom_id=lesson.classroom_id, student_id=actor_user.id
        )
        if enrollment is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this lesson",
            )

    def list_documents(self, db: Session, lesson_id: int) -> list[LessonDocument]:
        """List all documents for a lesson."""
        return db.query(LessonDocument).filter(LessonDocument.lesson_id == lesson_id).all()

    def get_document(self, db: Session, doc_id: int, *, actor_user: User) -> LessonDocument:
        """Get a single document (verify lesson ownership)."""
        doc = db.query(LessonDocument).filter(LessonDocument.id == doc_id).first()
        if doc is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

        lesson = self.lesson_repository.get_by_id(db, doc.lesson_id)
        if lesson.created_by_user_id != actor_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this document"
            )

        return doc
