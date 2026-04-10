from sqlalchemy.orm import Session

from config import get_settings
from contexts.identity.application.services import IdentityService
from contexts.identity.bootstrap import ensure_identity_bootstrap_data
from contexts.identity.domain.enums import AccountStatus, DealerApprovalStatus, UserRole
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository
from shared.infrastructure.security import hash_password


def test_local_bootstrap_accounts_are_created_and_login(db_session: Session, monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "environment", "development")
    monkeypatch.setattr(settings, "bootstrap_local_test_accounts", True)
    monkeypatch.setattr(settings, "bootstrap_local_test_password", "test1234")
    monkeypatch.setattr(settings, "bootstrap_admin_password", "Admin12!")

    ensure_identity_bootstrap_data(db_session)

    repo = SqlAlchemyUserRepository(db_session)
    identity = IdentityService(repo)

    seller = repo.get_user_by_email("sl@template.com")
    dealer1 = repo.get_user_by_email("dl1@template.com")
    dealer2 = repo.get_user_by_email("dl2@template.com")
    admin = repo.get_user_by_email(settings.bootstrap_admin_email)

    assert seller is not None
    assert seller.role == UserRole.SELLER
    assert seller.account_status == AccountStatus.ACTIVE

    assert dealer1 is not None
    assert dealer1.role == UserRole.DEALER
    assert dealer1.dealer_status == DealerApprovalStatus.APPROVED
    assert dealer1.account_status == AccountStatus.ACTIVE

    assert dealer2 is not None
    assert dealer2.role == UserRole.DEALER
    assert dealer2.dealer_status == DealerApprovalStatus.APPROVED
    assert dealer2.account_status == AccountStatus.ACTIVE

    assert admin is not None
    assert admin.role == UserRole.ADMIN
    assert admin.account_status == AccountStatus.ACTIVE

    seller_token, seller_user = identity.login(email="sl@template.com", password="test1234", role=UserRole.SELLER)
    dealer_token, dealer_user = identity.login(email="dl1@template.com", password="test1234", role=UserRole.DEALER)
    admin_token, admin_user = identity.login(
        email=settings.bootstrap_admin_email,
        password="Admin12!",
        role=UserRole.ADMIN,
    )

    assert seller_token
    assert seller_user.email == "sl@template.com"
    assert dealer_token
    assert dealer_user.email == "dl1@template.com"
    assert admin_token
    assert admin_user.email == settings.bootstrap_admin_email


def test_local_bootstrap_accounts_are_resynced(db_session: Session, monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "environment", "development")
    monkeypatch.setattr(settings, "bootstrap_local_test_accounts", True)
    monkeypatch.setattr(settings, "bootstrap_local_test_password", "test1234")

    repo = SqlAlchemyUserRepository(db_session)
    repo.create_user(
        email="dl1@template.com",
        full_name="Wrong Dealer",
        password_hash=hash_password("wrongpass"),
        role=UserRole.DEALER,
        phone=None,
        country=None,
        business_number="999-99-99999",
        dealer_status=DealerApprovalStatus.PENDING,
        account_status=AccountStatus.SUSPENDED,
    )
    repo.commit()

    ensure_identity_bootstrap_data(db_session)

    dealer = repo.get_user_by_email("dl1@template.com")
    assert dealer is not None
    assert dealer.full_name == settings.bootstrap_local_dealer1_name
    assert dealer.business_number == settings.bootstrap_local_dealer1_business_number
    assert dealer.dealer_status == DealerApprovalStatus.APPROVED
    assert dealer.account_status == AccountStatus.ACTIVE

    identity = IdentityService(repo)
    token, user = identity.login(email="dl1@template.com", password="test1234", role=UserRole.DEALER)
    assert token
    assert user.email == "dl1@template.com"


def test_production_skips_local_bootstrap_accounts(db_session: Session, monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "bootstrap_local_test_accounts", True)

    ensure_identity_bootstrap_data(db_session)

    repo = SqlAlchemyUserRepository(db_session)
    assert repo.get_user_by_email("sl@template.com") is None
    assert repo.get_user_by_email("dl1@template.com") is None
    assert repo.get_user_by_email("dl2@template.com") is None
    assert repo.get_user_by_email(settings.bootstrap_admin_email) is not None


def test_admin_bootstrap_account_is_resynced(db_session: Session, monkeypatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "environment", "development")
    monkeypatch.setattr(settings, "bootstrap_admin_password", "Admin12!")

    repo = SqlAlchemyUserRepository(db_session)
    repo.create_user(
        email=settings.bootstrap_admin_email,
        full_name="Wrong Admin",
        password_hash=hash_password("wrongpass"),
        role=UserRole.SELLER,
        phone=None,
        country=None,
        business_number="999-99-99999",
        dealer_status=DealerApprovalStatus.PENDING,
        account_status=AccountStatus.SUSPENDED,
    )
    repo.commit()

    ensure_identity_bootstrap_data(db_session)

    admin = repo.get_user_by_email(settings.bootstrap_admin_email)
    assert admin is not None
    assert admin.full_name == settings.bootstrap_admin_name
    assert admin.role == UserRole.ADMIN
    assert admin.account_status == AccountStatus.ACTIVE
    assert admin.business_number is None
    assert admin.dealer_status is None

    identity = IdentityService(repo)
    token, user = identity.login(email=settings.bootstrap_admin_email, password="Admin12!", role=UserRole.ADMIN)
    assert token
    assert user.email == settings.bootstrap_admin_email
