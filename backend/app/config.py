from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/expense_tracker"
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT — two naming conventions supported (JWT_SECRET / SECRET_KEY both work in .env)
    JWT_SECRET: str = "changeme-use-a-real-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    SECRET_KEY: str = ""          # alias; if blank, falls back to JWT_SECRET at runtime
    ALGORITHM: str = ""           # alias; if blank, falls back to JWT_ALGORITHM at runtime

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    OCR_PROVIDER: str = "tesseract"
    OPENAI_API_KEY: str = ""
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    COOKIE_SECURE: bool = False  # set True in production (HTTPS)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    def model_post_init(self, __context) -> None:  # type: ignore[override]
        # Fill aliases from primary fields if not explicitly set
        if not self.SECRET_KEY:
            object.__setattr__(self, "SECRET_KEY", self.JWT_SECRET)
        if not self.ALGORITHM:
            object.__setattr__(self, "ALGORITHM", self.JWT_ALGORITHM)


settings = Settings()
