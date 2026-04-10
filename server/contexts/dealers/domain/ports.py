from typing import Protocol
from uuid import UUID

from contexts.dealers.infrastructure.models import DealerDocumentORM
from contexts.dealers.domain.enums import DealerDocumentType


class DealerDocumentRepositoryPort(Protocol):
    def create_document(
        self,
        *,
        dealer_id: UUID,
        doc_type: DealerDocumentType,
        original_name: str,
        stored_path: str,
        content_type: str | None,
        size_bytes: int,
    ) -> DealerDocumentORM: ...


class DocumentStoragePort(Protocol):
    def store(self, *, dealer_id: UUID, doc_type: DealerDocumentType, filename: str, content: bytes) -> str: ...
