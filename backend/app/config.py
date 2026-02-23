from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "EduNexus"
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/edunexus"
    secret_key: str = "change-me"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
