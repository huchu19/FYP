import base64
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
import secrets
import time
from typing import Any, NamedTuple, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.core.dependencies import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

_BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2y$")
_LEGACY_PASSWORD_SCHEME = "pbkdf2_sha256"
_PASSWORD_ITERATIONS = 390000
_PASSWORD_SALT_BYTES = 16
_TOKEN_TYPE = "access"
_bearer_scheme = HTTPBearer(auto_error=False)

try:
    import bcrypt
except ImportError:  # pragma: no cover - exercised only in constrained environments
    bcrypt = None

try:
    import jwt
except ImportError:  # pragma: no cover - exercised only in constrained environments
    jwt = None


class PasswordVerificationResult(NamedTuple):
    verified: bool
    needs_rehash: bool


def _is_bcrypt_hash(stored_hash: str) -> bool:
    return stored_hash.startswith(_BCRYPT_PREFIXES)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _verify_legacy_password(password: str, stored_hash: str) -> bool:
    # Transitional fallback for very old local records that stored plaintext.
    if not stored_hash.startswith(f"{_LEGACY_PASSWORD_SCHEME}$"):
        return hmac.compare_digest(stored_hash, password)

    try:
        scheme, iterations_s, salt_b64, digest_b64 = stored_hash.split("$", 3)
        if scheme != _LEGACY_PASSWORD_SCHEME:
            return False
        iterations = int(iterations_s)
        salt = _b64url_decode(salt_b64)
        expected = _b64url_decode(digest_b64)
    except Exception:  # noqa: BLE001 - malformed hash should just fail verification
        return False

    candidate = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(candidate, expected)


def hash_password(password: str) -> str:
    if bcrypt is None:
        salt = secrets.token_bytes(_PASSWORD_SALT_BYTES)
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            _PASSWORD_ITERATIONS,
        )
        return (
            f"{_LEGACY_PASSWORD_SCHEME}${_PASSWORD_ITERATIONS}$"
            f"{_b64url_encode(salt)}${_b64url_encode(digest)}"
        )

    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, stored_hash: str) -> PasswordVerificationResult:
    if bcrypt is not None and _is_bcrypt_hash(stored_hash):
        verified = bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
        return PasswordVerificationResult(verified=verified, needs_rehash=False)

    verified = _verify_legacy_password(password, stored_hash)
    return PasswordVerificationResult(verified=verified, needs_rehash=verified and bcrypt is not None)


def create_access_token(*, subject: str, role: str, expires_minutes: Optional[int] = None) -> str:
    ttl_minutes = expires_minutes if expires_minutes is not None else settings.token_expire_minutes
    if jwt is not None:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": subject,
            "role": role,
            "iat": now,
            "exp": now + timedelta(minutes=ttl_minutes),
            "typ": _TOKEN_TYPE,
        }
        return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)

    now = int(time.time())
    payload = {
        "sub": subject,
        "role": role,
        "iat": now,
        "exp": now + (ttl_minutes * 60),
        "typ": _TOKEN_TYPE,
    }
    header = {"alg": settings.jwt_algorithm, "typ": "JWT"}

    header_segment = _b64url_encode(json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    payload_segment = _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    signing_input = f"{header_segment}.{payload_segment}".encode("utf-8")
    signature = hmac.new(settings.secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_segment = _b64url_encode(signature)
    return f"{header_segment}.{payload_segment}.{signature_segment}"


def decode_access_token(token: str) -> dict[str, Any]:
    if jwt is not None:
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=[settings.jwt_algorithm],
                options={"require": ["exp", "iat", "sub", "typ"]},
            )
        except jwt.PyJWTError as exc:
            raise ValueError("Invalid authentication token") from exc

        if payload.get("typ") != _TOKEN_TYPE:
            raise ValueError("Unexpected token type")
        return payload

    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Malformed token")

    header_segment, payload_segment, signature_segment = parts
    signing_input = f"{header_segment}.{payload_segment}".encode("utf-8")
    expected_signature = hmac.new(
        settings.secret_key.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    if not hmac.compare_digest(signature_segment, _b64url_encode(expected_signature)):
        raise ValueError("Invalid token signature")

    header = json.loads(_b64url_decode(header_segment).decode("utf-8"))
    if header.get("alg") != settings.jwt_algorithm:
        raise ValueError("Unexpected JWT algorithm")

    payload = json.loads(_b64url_decode(payload_segment).decode("utf-8"))
    if payload.get("typ") != _TOKEN_TYPE:
        raise ValueError("Unexpected token type")

    exp = payload.get("exp")
    if not isinstance(exp, int) or exp < int(time.time()):
        raise ValueError("Token expired")
    return payload


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
        subject = payload.get("sub")
        user_id = int(subject)
    except Exception:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    user = UserRepository().get_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found for token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
    return user


def require_roles(*allowed_roles: str):
    normalized = {role.lower() for role in allowed_roles}

    def _dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.lower() not in normalized:
            allowed = ", ".join(sorted(normalized))
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: requires role in [{allowed}]",
            )
        return current_user

    return _dependency
