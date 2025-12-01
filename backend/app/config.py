from pydantic import BaseSettings


class Settings(BaseSettings):
    app_name: str = "EduNexus"
    database_url: str = "postgresql://user:password@localhost:5432/edunexus"
    secret_key: str = "change-me"

    class Config:
        env_file = ".env"


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
