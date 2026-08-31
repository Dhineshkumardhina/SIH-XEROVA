import os
import json
from pydantic_settings import BaseSettings, SettingsConfigDict

def _get_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS")
    if not raw:
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ]
    if raw.startswith("["):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
    return [i.strip() for i in raw.split(",") if i.strip()]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True)

    PROJECT_NAME: str = os.getenv("APP_NAME", "RAILOPT AI")
    TAGLINE: str = "Intelligent Blocks. Maximum Availability. Reliable Operations."
    VERSION: str = "1.0.0"
    API_V1_STR: str = os.getenv("API_V1_PREFIX", "/api/v1")
    
    # Environment & Demo Flag
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"
    
    # Security / Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "railopt_ai_super_secret_jwt_key_2026_change_in_production")
    SECRET_KEY: str = JWT_SECRET
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ALGORITHM: str = JWT_ALGORITHM
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    ACCOUNT_LOCKOUT_MAX_ATTEMPTS: int = int(os.getenv("ACCOUNT_LOCKOUT_MAX_ATTEMPTS", "5"))
    ACCOUNT_LOCKOUT_DURATION_MINUTES: int = int(os.getenv("ACCOUNT_LOCKOUT_DURATION_MINUTES", "15"))
    
    # Database & Cache
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./railopt_ai.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # CORS
    CORS_ORIGINS: list[str] = _get_cors_origins()

settings = Settings()
