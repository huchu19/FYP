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

    r2_account_id: str = Field(default="", validation_alias=AliasChoices("R2_ACCOUNT_ID"))
    r2_access_key_id: str = Field(default="", validation_alias=AliasChoices("R2_ACCESS_KEY_ID"))
    r2_secret_access_key: str = Field(
        default="", validation_alias=AliasChoices("R2_SECRET_ACCESS_KEY")
    )
    r2_bucket: str = Field(default="", validation_alias=AliasChoices("R2_BUCKET"))

    @property
    def cors_allow_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_allow_origins_str.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.strip().lower() in {"production", "prod"}

    @property
    def r2_enabled(self) -> bool:
        return bool(
            self.r2_account_id
            and self.r2_access_key_id
            and self.r2_secret_access_key
            and self.r2_bucket
        )

    def validate_for_production(self) -> None:
        """Refuse to serve production traffic with development defaults.

        Called at application startup. Without this a deploy that forgets
        APP_SECRET_KEY boots with a publicly known JWT signing key.
        """
        if not self.is_production:
            return

        problems = []
        if self.secret_key in {"change-me", ""} or len(self.secret_key) < 32:
            problems.append(
                "APP_SECRET_KEY must be set to a random value of at least 32 characters"
            )
        if "localhost" in self.database_url:
            problems.append("DATABASE_URL still points at localhost")
        if any("localhost" in o for o in self.cors_allow_origins):
            problems.append("CORS_ALLOW_ORIGINS still contains localhost")

        if problems:
            raise RuntimeError(
                "Refusing to start in production with unsafe configuration: "
                + "; ".join(problems)
            )

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
