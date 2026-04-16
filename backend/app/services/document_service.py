import logging
import os
from pathlib import Path

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.models.lesson_document import LessonDocument
from app.models.user import User
from app.repositories.lesson_repository import LessonRepository

logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


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

        # Read file contents
        file_bytes = file.file.read()
        file.file.seek(0)

        # Determine MIME type
        mime_type = file.content_type or "application/octet-stream"

        # Extract text
        extracted_text = self.extract_text(file_bytes, mime_type)

        # Save file to disk
        file_path = lesson_dir / file.filename
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        # Create database record
        doc = LessonDocument(
            lesson_id=lesson_id,
            filename=file.filename,
            file_path=str(file_path),
            mime_type=mime_type,
            extracted_text=extracted_text,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        logger.info(f"Uploaded document {file.filename} to lesson {lesson_id}")
        return doc

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
