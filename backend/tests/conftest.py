from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.core.dependencies import get_db
from app.db import Base
from app.main import app as fastapi_app

# Import all models so their tables are registered on Base.metadata
import app.models  # noqa: F401


@pytest.fixture()
def session_factory():
    engine = create_engine(settings.test_database_url, future=True)
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
    try:
        yield factory
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Rate limit state is process-global; clear it so tests stay independent."""
    from app.core.rate_limit import _limiter

    _limiter._hits.clear()
    yield
    _limiter._hits.clear()


@pytest.fixture()
def client(session_factory) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    fastapi_app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(fastapi_app) as test_client:
            yield test_client
    finally:
        fastapi_app.dependency_overrides.clear()
