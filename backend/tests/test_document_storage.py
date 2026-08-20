"""Tests for upload sanitization and the storage backend."""

import pytest

pytest.importorskip("httpx")

from fastapi import HTTPException

from app.services.document_service import sanitize_filename
from app.services.storage import load_document, store_document


@pytest.mark.parametrize(
    ("supplied", "expected"),
    [
        ("../../../etc/passwd", "passwd"),
        ("../../app/main.py", "main.py"),
        ("/absolute/path.txt", "path.txt"),
        ("....//evil.sh", "evil.sh"),
        ("report.pdf", "report.pdf"),
        ("", "upload"),
        (None, "upload"),
    ],
)
def test_sanitize_filename_strips_traversal(supplied, expected):
    """An uploaded name must never resolve outside the target directory."""
    assert sanitize_filename(supplied) == expected


def test_store_and_load_document_roundtrip(tmp_path, monkeypatch):
    monkeypatch.setattr("app.services.storage.UPLOADS_DIR", tmp_path)

    reference = store_document(
        lesson_id=42,
        filename="notes.txt",
        data=b"lesson notes",
        content_type="text/plain",
    )

    assert reference.startswith("local:")
    assert load_document(reference) == b"lesson notes"


def test_load_missing_document_returns_404():
    """Local files vanish when the platform recycles the container."""
    with pytest.raises(HTTPException) as excinfo:
        load_document("local:/nonexistent/missing.txt")

    assert excinfo.value.status_code == 404
