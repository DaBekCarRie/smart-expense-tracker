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
    GEMINI_API_KEY: str = ""
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    COOKIE_SECURE: bool = False      # set True in production (HTTPS)
    COOKIE_SAMESITE: str = "lax"    # set "none" in production (cross-origin Vercel ↔ Render)

    # Cloudflare R2 / S3 Storage Settings
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_PUBLIC_URL: str = ""  # e.g., https://pub-xxxxxx.r2.dev

    # SMTP Email Settings
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    _INSECURE_JWT_DEFAULT = "changeme-use-a-real-secret-in-production"

    def model_post_init(self, __context) -> None:  # type: ignore[override]
        import logging
        _log = logging.getLogger("app.config")

        if self.JWT_SECRET == self._INSECURE_JWT_DEFAULT:
            _log.critical(
                "JWT_SECRET is still the insecure default. "
                "Set a strong random value in your .env before deploying to production."
            )
        if not self.COOKIE_SECURE:
            _log.warning(
                "COOKIE_SECURE is False. Set COOKIE_SECURE=True in production (HTTPS)."
            )

        # Fill aliases from primary fields if not explicitly set
        if not self.SECRET_KEY:
            object.__setattr__(self, "SECRET_KEY", self.JWT_SECRET)
        if not self.ALGORITHM:
            object.__setattr__(self, "ALGORITHM", self.JWT_ALGORITHM)

        # Convert standard Postgres connection URLs to asyncpg format
        db_url = self.DATABASE_URL
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        # Append prepared_statement_cache_size=0 to postgresql+asyncpg URLs if not present
        if "postgresql+asyncpg://" in db_url and "prepared_statement_cache_size" not in db_url:
            separator = "&" if "?" in db_url else "?"
            db_url = f"{db_url}{separator}prepared_statement_cache_size=0"
            
        object.__setattr__(self, "DATABASE_URL", db_url)


settings = Settings()
