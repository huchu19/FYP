from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "EduNexus"
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/edunexus"
    secret_key: str = Field(
        default="change-me",
        validation_alias=AliasChoices("APP_SECRET_KEY", "SECRET_KEY"),
    )
    token_expire_minutes: int = Field(
        default=60,
        validation_alias=AliasChoices("ACCESS_TOKEN_EXPIRE_MINUTES", "TOKEN_EXPIRE_MINUTES"),
    )
    jwt_algorithm: str = Field(default="HS256", validation_alias=AliasChoices("JWT_ALGORITHM"))
    cors_allow_origins_str: str = Field(
        default="http://localhost:3000",
        validation_alias=AliasChoices("CORS_ALLOW_ORIGINS"),
    )
    openai_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("OPENAI_API_KEY"),
    )
    gemini_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("GEMINI_API_KEY"),
    )
    app_env: str = Field(default="dev", validation_alias=AliasChoices("APP_ENV"))
    app_debug: bool = Field(default=True, validation_alias=AliasChoices("APP_DEBUG"))
    test_database_url: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/edunexus_test",
        validation_alias=AliasChoices("TEST_DATABASE_URL"),
    )

    @property
    def cors_allow_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_allow_origins_str.split(",") if o.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
