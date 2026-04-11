from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./dev.db"
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_EXPIRE_DAYS: int = 30
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 5_242_880  # 5MB
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # ── SMTP (Gmail) ──────────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "print.sensedge@gmail.com"
    SMTP_PASSWORD: str = "jhcw gtxq hoit rjoz"
    SMTP_FROM_NAME: str = "ID Card Designer"
    SMTP_FROM_EMAIL: str = "print.sensedge@gmail.com"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
