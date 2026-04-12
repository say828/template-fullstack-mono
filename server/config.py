from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local", ".env.example"),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "Template Fullstack API"
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://127.0.0.1:5173",
            "http://localhost:5173",
            "http://127.0.0.1:4173",
            "http://localhost:4173",
        ],
    )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.cors_origins = [origin.rstrip("/") for origin in settings.cors_origins]
    return settings
