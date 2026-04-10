from uuid import UUID

from sqlalchemy.orm import Session

from contexts.dealers.domain.enums import DealerDocumentType
from contexts.dealers.domain.ports import DealerDocumentRepositoryPort
from contexts.dealers.infrastructure.models import DealerDocumentORM


class SqlAlchemyDealerDocumentRepository(DealerDocumentRepositoryPort):
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_document(
        self,
        *,
        dealer_id: UUID,
        doc_type: DealerDocumentType,
        original_name: str,
        stored_path: str,
        content_type: str | None,
        size_bytes: int,
    ) -> DealerDocumentORM:
        row = DealerDocumentORM(
            dealer_id=dealer_id,
            doc_type=doc_type,
            original_name=original_name,
            stored_path=stored_path,
            content_type=content_type,
            size_bytes=size_bytes,
        )
        self.db.add(row)
        self.db.flush()
        return row
