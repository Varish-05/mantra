import os
from typing import List
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "MANTRA"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres_secure_password_1337@localhost:5432/mantra"
    DATABASE_SYNC_URL: str = "postgresql+psycopg2://postgres:postgres_secure_password_1337@localhost:5432/mantra"
    
    # Redis Cache configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Cryptographic keys
    SECRET_KEY: str = "super_secret_session_key_for_jwt_tokens_2026_change_in_prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # External APIs
    GEMINI_API_KEY: str = ""
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env", 
        case_sensitive=True, 
        extra="ignore"
    )


settings = Settings()
