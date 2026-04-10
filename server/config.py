from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Template Server"
    environment: str = "development"
    api_prefix: str = "/api/v1"

    database_url: str = "mysql+pymysql://template:template@localhost:3306/template?charset=utf8mb4"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 120
    reset_token_ttl_minutes: int = 30

    document_storage_dir: str = "data/storage/dealer-documents"
    vehicle_photo_bucket: str = "template-vehicle-images-741323757384"
    vehicle_photo_region: str = "ap-northeast-2"
    vehicle_photo_prefix: str = "vehicle-photos"
    vehicle_photo_endpoint_url: str | None = None
    vehicle_photo_url_expires_seconds: int = 60 * 60 * 24 * 7

    bootstrap_admin_email: str = "admin@template.com"
    bootstrap_admin_password: str = "Admin12!"
    bootstrap_admin_name: str = "Template Admin"
    bootstrap_local_test_accounts: bool = False
    bootstrap_local_test_password: str = "test1234"
    bootstrap_local_seller_email: str = "sl@template.com"
    bootstrap_local_seller_name: str = "홍길동"
    bootstrap_local_dealer1_email: str = "dl1@template.com"
    bootstrap_local_dealer1_name: str = "김딜러"
    bootstrap_local_dealer1_business_number: str = "110-81-00001"
    bootstrap_local_dealer2_email: str = "dl2@template.com"
    bootstrap_local_dealer2_name: str = "이딜러"
    bootstrap_local_dealer2_business_number: str = "110-81-00002"

    cors_origins: list[str] = Field(default_factory=lambda: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:4174",
        "http://127.0.0.1:4174",
        "https://web.dev.example.com",
        "https://admin.dev.example.com",
        "https://web.example.com",
        "https://admin.example.com",
    ])


@lru_cache
def get_settings() -> Settings:
    return Settings()
