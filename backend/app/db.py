from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

SQLALCHEMY_DATABASE_URL = settings.database_url

# pool_pre_ping is essential against serverless Postgres (Neon), which
# suspends compute after a few minutes idle and drops open connections.
# Without it the first request after a quiet period fails with a stale
# connection error. pool_recycle keeps connections well under any
# server-side idle timeout.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=5,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

Base = declarative_base()
