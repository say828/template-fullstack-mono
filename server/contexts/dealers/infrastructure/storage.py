from pathlib import Path
from uuid import UUID

from config import get_settings
from contexts.dealers.domain.enums import DealerDocumentType
from contexts.dealers.domain.ports import DocumentStoragePort

settings = get_settings()


class LocalDocumentStorage(DocumentStoragePort):
    def __init__(self) -> None:
        self.root = Path(settings.document_storage_dir)
        self.root.mkdir(parents=True, exist_ok=True)

    def store(self, *, dealer_id: UUID, doc_type: DealerDocumentType, filename: str, content: bytes) -> str:
        suffix = Path(filename).suffix.lower() if filename else ""
        dealer_dir = self.root / str(dealer_id)
        dealer_dir.mkdir(parents=True, exist_ok=True)
        safe_name = f"{doc_type.value}{suffix}"
        target = dealer_dir / safe_name
        target.write_bytes(content)
        return str(target)


    def resolve_document(self, stored_path: str) -> Path:
        """Resolve a stored dealer document path safely under the storage root.
        Accepts absolute or workspace-relative paths produced by `store`.
        Raises FileNotFoundError if outside root or missing.
        """
        target = Path(stored_path)
        if not target.is_absolute():
            target = (Path.cwd() / target).resolve()
        else:
            target = target.resolve()

        root = self.root.resolve()
        try:
            target.relative_to(root)
        except ValueError as exc:
            raise FileNotFoundError("Document path is outside dealer storage") from exc

        if not target.exists() or not target.is_file():
            raise FileNotFoundError("Document file does not exist")
        return target
