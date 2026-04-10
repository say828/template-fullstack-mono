from __future__ import annotations

import mimetypes
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol
from uuid import UUID

import boto3
from botocore.client import Config

from config import get_settings

settings = get_settings()


@dataclass(frozen=True)
class StoredVehiclePhoto:
    storage_key: str
    original_name: str
    content_type: str | None
    size_bytes: int


class VehiclePhotoStoragePort(Protocol):
    def put_object(
        self,
        *,
        vehicle_id: UUID,
        original_name: str,
        filename: str,
        content: bytes,
        sort_order: int,
        content_type: str | None = None,
    ) -> StoredVehiclePhoto: ...

    def presign_get_url(self, storage_key: str) -> str: ...


def _safe_stem(filename: str) -> str:
    stem = Path(filename).stem.strip().lower().replace(" ", "-")
    cleaned = "".join(ch if ch.isalnum() or ch == "-" else "-" for ch in stem)
    collapsed = "-".join(part for part in cleaned.split("-") if part)
    return collapsed or "photo"


def build_vehicle_photo_key(*, vehicle_id: UUID, filename: str, sort_order: int) -> str:
    suffix = Path(filename).suffix.lower() or ".bin"
    return f"{settings.vehicle_photo_prefix}/{vehicle_id}/{sort_order + 1:02d}-{_safe_stem(filename)}{suffix}"


def _normalize_content_type(filename: str, content_type: str | None) -> str:
    if content_type:
        return content_type
    guessed, _ = mimetypes.guess_type(filename)
    return guessed or "application/octet-stream"


class S3VehiclePhotoStorage:
    def __init__(self) -> None:
        self.bucket = settings.vehicle_photo_bucket
        self.region = settings.vehicle_photo_region
        self.endpoint_url = settings.vehicle_photo_endpoint_url or f"https://s3.{self.region}.amazonaws.com"
        self.expires_in_seconds = settings.vehicle_photo_url_expires_seconds
        self.client = boto3.client(
            "s3",
            region_name=self.region,
            endpoint_url=self.endpoint_url,
            config=Config(signature_version="s3v4"),
        )

    def put_object(
        self,
        *,
        vehicle_id: UUID,
        original_name: str,
        filename: str,
        content: bytes,
        sort_order: int,
        content_type: str | None = None,
    ) -> StoredVehiclePhoto:
        storage_key = build_vehicle_photo_key(vehicle_id=vehicle_id, filename=filename, sort_order=sort_order)
        normalized_content_type = _normalize_content_type(filename, content_type)
        self.client.put_object(
            Bucket=self.bucket,
            Key=storage_key,
            Body=content,
            ContentType=normalized_content_type,
        )
        return StoredVehiclePhoto(
            storage_key=storage_key,
            original_name=original_name,
            content_type=normalized_content_type,
            size_bytes=len(content),
        )

    def presign_get_url(self, storage_key: str) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": storage_key},
            ExpiresIn=self.expires_in_seconds,
        )


class LocalVehiclePhotoStorage:
    def __init__(self) -> None:
        preferred_root = Path("data/storage/vehicle-photos").resolve()
        self.root = self._resolve_root(preferred_root)
        self.root.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _resolve_root(preferred_root: Path) -> Path:
        if _can_write_dir(preferred_root):
            return preferred_root
        fallback_root = Path(tempfile.gettempdir()) / "template-vehicle-photos"
        fallback_root.mkdir(parents=True, exist_ok=True)
        return fallback_root

    def put_object(
        self,
        *,
        vehicle_id: UUID,
        original_name: str,
        filename: str,
        content: bytes,
        sort_order: int,
        content_type: str | None = None,
    ) -> StoredVehiclePhoto:
        storage_key = build_vehicle_photo_key(vehicle_id=vehicle_id, filename=filename, sort_order=sort_order)
        target = (self.root / storage_key).resolve()
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        return StoredVehiclePhoto(
            storage_key=storage_key,
            original_name=original_name,
            content_type=_normalize_content_type(filename, content_type),
            size_bytes=len(content),
        )

    def presign_get_url(self, storage_key: str) -> str:
        return (self.root / storage_key).resolve().as_uri()


def _can_write_dir(path: Path) -> bool:
    try:
        path.mkdir(parents=True, exist_ok=True)
        probe = tempfile.NamedTemporaryFile(dir=path, prefix=".template-photo-write-probe-", delete=True)
        probe.close()
    except (PermissionError, OSError):
        return False
    return True


def get_vehicle_photo_storage() -> VehiclePhotoStoragePort:
    if settings.environment == "test":
        return LocalVehiclePhotoStorage()
    if not os.environ.get("AWS_ACCESS_KEY_ID") or not os.environ.get("AWS_SECRET_ACCESS_KEY"):
        return LocalVehiclePhotoStorage()
    return S3VehiclePhotoStorage()


def build_vehicle_photo_urls(storage_keys: list[str | None]) -> list[str]:
    storage = get_vehicle_photo_storage()
    return [storage.presign_get_url(storage_key) for storage_key in storage_keys if storage_key]
