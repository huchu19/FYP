"""Document storage backends.

Uploaded files must outlive the container they were uploaded to. Platform
filesystems are ephemeral, so anything written to local disk disappears on
the next deploy or restart. When R2 credentials are configured, objects go
to Cloudflare R2; otherwise they fall back to the local uploads directory
so development needs no cloud account.

Stored references are backend-tagged (``r2:<key>`` or ``local:<path>``) so
a document written by one backend can still be located after the other is
enabled. Bare paths are treated as local for rows written before this.
"""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"

_R2_PREFIX = "r2:"
_LOCAL_PREFIX = "local:"


def _r2_client():
    try:
        import boto3
    except ImportError as exc:  # pragma: no cover - dependency is pinned
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Object storage is unavailable on this server.",
        ) from exc

    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )


def store_document(*, lesson_id: int, filename: str, data: bytes, content_type: str) -> str:
    """Persist file bytes and return a reference to store on the record."""
    if settings.r2_enabled:
        key = f"lessons/{lesson_id}/{filename}"
        _r2_client().put_object(
            Bucket=settings.r2_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        logger.info("Stored document in R2: %s", key)
        return f"{_R2_PREFIX}{key}"

    lesson_dir = UPLOADS_DIR / "lessons" / str(lesson_id)
    lesson_dir.mkdir(parents=True, exist_ok=True)
    path = lesson_dir / filename
    path.write_bytes(data)
    logger.info("Stored document on local disk: %s", path)
    return f"{_LOCAL_PREFIX}{path}"


def load_document(reference: str) -> bytes:
    """Read back a stored document, raising 404 if it is no longer present."""
    if reference.startswith(_R2_PREFIX):
        key = reference[len(_R2_PREFIX):]
        try:
            obj = _r2_client().get_object(Bucket=settings.r2_bucket, Key=key)
            return obj["Body"].read()
        except Exception as exc:  # noqa: BLE001 - missing object or transport error
            logger.warning("R2 object unavailable (%s): %s", key, exc)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File is no longer available.",
            ) from exc

    path = Path(reference[len(_LOCAL_PREFIX):] if reference.startswith(_LOCAL_PREFIX) else reference)
    if not path.exists():
        # Expected for files uploaded before a redeploy wiped local disk.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File is no longer available on this server.",
        )
    return path.read_bytes()
