"""Minimal in-process rate limiting.

The deployment runs a single worker, so a process-local fixed-window
counter is sufficient and avoids taking on Redis or an extra dependency.
It is deliberately simple: if the app is ever scaled to multiple workers
each one enforces its own window, which is acceptable for the abuse this
guards against (login brute force and AI quota drain), but would need a
shared store to be exact.
"""

from collections import defaultdict
import threading
import time

from fastapi import Depends, HTTPException, Request, status

from app.core.security import get_current_user
from app.models.user import User


class FixedWindowRateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def check(self, key: str, *, limit: int, window_seconds: int) -> int:
        """Record a hit for `key`. Returns seconds to wait if over limit, else 0."""
        now = time.monotonic()
        cutoff = now - window_seconds

        with self._lock:
            hits = [t for t in self._hits[key] if t > cutoff]

            if len(hits) >= limit:
                self._hits[key] = hits
                return max(1, int(window_seconds - (now - hits[0])))

            hits.append(now)
            self._hits[key] = hits

            # Opportunistic cleanup so idle keys do not accumulate forever.
            if len(self._hits) > 2048:
                for k in [k for k, v in self._hits.items() if not any(t > cutoff for t in v)]:
                    del self._hits[k]

            return 0


_limiter = FixedWindowRateLimiter()


def _client_ip(request: Request) -> str:
    # Render terminates TLS upstream, so the real client is in X-Forwarded-For.
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(*, limit: int, window_seconds: int, scope: str):
    """Limit by client IP. Use for unauthenticated routes such as login."""

    def dependency(request: Request) -> None:
        retry_after = _limiter.check(
            f"{scope}:ip:{_client_ip(request)}", limit=limit, window_seconds=window_seconds
        )
        if retry_after:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait and try again.",
                headers={"Retry-After": str(retry_after)},
            )

    return dependency


def rate_limit_user(*, limit: int, window_seconds: int, scope: str):
    """Limit by authenticated user and return that user.

    Use on expensive AI routes so one visitor cannot exhaust the shared
    model quota. Returns the user so routes can keep using it directly.
    """

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        retry_after = _limiter.check(
            f"{scope}:user:{current_user.id}", limit=limit, window_seconds=window_seconds
        )
        if retry_after:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="You are generating content too quickly. Please wait a moment.",
                headers={"Retry-After": str(retry_after)},
            )
        return current_user

    return dependency
