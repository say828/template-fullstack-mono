from pathlib import Path
from uuid import UUID, uuid4


class LocalSupportStorage:
    def __init__(self, base_dir: str | None = None) -> None:
        self.base_dir = Path(base_dir or "data/storage/support").resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def store_inquiry_attachment(self, *, inquiry_id: UUID, filename: str, content: bytes) -> str:
        safe_name = filename.replace("/", "_").replace("\\", "_")
        ext = Path(safe_name).suffix or ".bin"
        target_dir = self.base_dir / str(inquiry_id)
        target_dir.mkdir(parents=True, exist_ok=True)
        target = target_dir / f"{uuid4().hex}{ext}"
        target.write_bytes(content)
        return str(target.relative_to(Path.cwd()))

    def resolve_inquiry_attachment(self, stored_path: str) -> Path:
        path = (Path.cwd() / stored_path).resolve()
        try:
            path.relative_to(self.base_dir)
        except ValueError as exc:
            raise FileNotFoundError(stored_path) from exc
        if not path.is_file():
            raise FileNotFoundError(stored_path)
        return path
