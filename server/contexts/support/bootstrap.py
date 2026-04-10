from sqlalchemy.orm import Session

from contexts.support.application.services import SupportService
from contexts.support.infrastructure.repository import SqlAlchemySupportRepository
from contexts.support.infrastructure.storage import LocalSupportStorage


def ensure_support_seed_data(db: Session) -> None:
    service = SupportService(repo=SqlAlchemySupportRepository(db), storage=LocalSupportStorage())
    service.ensure_seed_data()
