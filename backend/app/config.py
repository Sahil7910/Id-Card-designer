from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./dev.db"
    JWT_SECRET_KEY: str  # required — no default; app will not start without this
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_EXPIRE_DAYS: int = 30
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 5_242_880  # 5MB
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # ── SMTP (Gmail) ──────────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str  # required — set via env
    SMTP_PASSWORD: str  # required — set via env
    SMTP_FROM_NAME: str = "ID Card Designer"
    SMTP_FROM_EMAIL: str  # required — set via env
    FRONTEND_URL: str = "http://localhost:5173"
    GOOGLE_CLIENT_ID: str = ""

    @field_validator("CORS_ORIGINS")
    @classmethod
    def no_wildcard_cors(cls, v: list[str]) -> list[str]:
        if "*" in v:
            raise ValueError("Wildcard '*' is not allowed in CORS_ORIGINS")
        return v

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
