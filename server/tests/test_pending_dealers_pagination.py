from sqlalchemy.orm import Session

from contexts.dealers.application.services import DealerAdminService
from contexts.identity.domain.enums import AccountStatus, DealerApprovalStatus, UserRole
from contexts.identity.infrastructure.models import UserORM
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository


def _mk_user(
    db: Session,
    *,
    email: str,
    role: UserRole = UserRole.DEALER,
    dealer_status: DealerApprovalStatus = DealerApprovalStatus.PENDING,
    account_status: AccountStatus = AccountStatus.PENDING_APPROVAL,
) -> UserORM:
    repo = SqlAlchemyUserRepository(db)
    user = repo.create_user(
        email=email,
        full_name=email.split("@")[0],
        password_hash="x",
        role=role,
        phone=None,
        country=None,
        business_number=None,
        dealer_status=dealer_status,
        account_status=account_status,
    )
    repo.commit()
    return user


def test_service_list_pending_dealers_paginated_filters_and_counts(db_session: Session):
    # Arrange: 3 pending dealers and 1 approved dealer
    for i in range(3):
        _mk_user(db_session, email=f"p{i}@ex.com", dealer_status=DealerApprovalStatus.PENDING)
    _mk_user(db_session, email="a@ex.com", dealer_status=DealerApprovalStatus.APPROVED,
             account_status=AccountStatus.ACTIVE)

    service = DealerAdminService(user_repo=SqlAlchemyUserRepository(db_session))

    # Act: request page size 2
    items, total = service.list_pending_dealers_paginated(offset=0, limit=2)

    # Assert: only pending counted; tuple structure maintained
    assert total == 3
    assert len(items) == 2

