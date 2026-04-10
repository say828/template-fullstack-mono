import uuid
import logging

import pytest
from sqlalchemy.orm import Session

from contexts.identity.domain.enums import AccountStatus, DealerApprovalStatus, UserRole
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository


@pytest.mark.usefixtures("db_session")
class TestDealerStatusGuard:
    def test_non_prod_raises_when_dealer_status_null(self, db_session: Session, set_environment):
        # Force non-production behavior
        set_environment("development")
        repo = SqlAlchemyUserRepository(db_session)

        with pytest.raises(ValueError) as exc:
            repo.create_user(
                email="guard-nonprod-null@example.com",
                full_name="테스트 사용자",
                password_hash="x",
                role=UserRole.DEALER,
                phone=None,
                country=None,
                business_number=str(uuid.uuid4())[:13],
                dealer_status=None,
                account_status=AccountStatus.ACTIVE,
            )
        assert "DEALER_STATUS_GUARD" in str(exc.value)

    def test_prod_allows_with_warning_when_dealer_status_null(self, db_session: Session, caplog: pytest.LogCaptureFixture, set_environment):
        # Force production warn-only behavior
        set_environment("production")
        repo = SqlAlchemyUserRepository(db_session)

        caplog.set_level(logging.WARNING)
        user = repo.create_user(
            email="guard-prod-null@example.com",
            full_name="테스트 사용자",
            password_hash="x",
            role=UserRole.DEALER,
            phone=None,
            country=None,
            business_number=str(uuid.uuid4())[:13],
            dealer_status=None,
            account_status=AccountStatus.ACTIVE,
        )
        assert user is not None
        # Warning should be emitted in production
        assert any(
            "DEALER_STATUS_GUARD: creating DEALER with NULL dealer_status" in rec.getMessage()
            for rec in caplog.records
        )

    def test_non_prod_allows_dealer_with_non_null_status(self, db_session: Session, set_environment):
        # Onboarding path: creating a dealer with PENDING status must succeed
        set_environment("development")
        repo = SqlAlchemyUserRepository(db_session)
        user = repo.create_user(
            email="guard-nonprod-pending@example.com",
            full_name="테스트 사용자",
            password_hash="x",
            role=UserRole.DEALER,
            phone=None,
            country=None,
            business_number=str(uuid.uuid4())[:13],
            dealer_status=DealerApprovalStatus.PENDING,
            account_status=AccountStatus.ACTIVE,
        )
        assert user.dealer_status == DealerApprovalStatus.PENDING

    def test_non_prod_allows_non_dealer_null_status(self, db_session: Session, set_environment):
        # Non-dealer roles should not be affected by the guard
        set_environment("development")
        repo = SqlAlchemyUserRepository(db_session)
        user = repo.create_user(
            email="guard-nonprod-seller-null@example.com",
            full_name="테스트 사용자",
            password_hash="x",
            role=UserRole.SELLER,
            phone=None,
            country=None,
            business_number=None,
            dealer_status=None,
            account_status=AccountStatus.ACTIVE,
        )
        assert user.role == UserRole.SELLER
        assert user.dealer_status is None
