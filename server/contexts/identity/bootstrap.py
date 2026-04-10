from dataclasses import dataclass

from sqlalchemy.orm import Session

from config import get_settings
from contexts.identity.domain.enums import AccountStatus, DealerApprovalStatus, UserRole
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository
from shared.infrastructure.environment import is_production
from shared.infrastructure.security import hash_password, verify_password


settings = get_settings()


@dataclass(frozen=True)
class BootstrapUser:
    email: str
    full_name: str
    role: UserRole
    business_number: str | None = None
    dealer_status: DealerApprovalStatus | None = None


def ensure_identity_bootstrap_data(db: Session) -> None:
    repo = SqlAlchemyUserRepository(db)
    changed = ensure_admin_account(repo)

    if settings.bootstrap_local_test_accounts and not is_production():
        changed = ensure_local_test_accounts(repo) or changed

    if changed:
        repo.commit()


def ensure_admin_account(repo: SqlAlchemyUserRepository) -> bool:
    existing = repo.get_user_by_email(settings.bootstrap_admin_email)
    if existing:
        changed = False
        if existing.full_name != settings.bootstrap_admin_name:
            existing.full_name = settings.bootstrap_admin_name
            changed = True
        if existing.role != UserRole.ADMIN:
            existing.role = UserRole.ADMIN
            changed = True
        if existing.account_status != AccountStatus.ACTIVE:
            existing.account_status = AccountStatus.ACTIVE
            changed = True
        if existing.business_number is not None:
            existing.business_number = None
            changed = True
        if existing.dealer_status is not None:
            existing.dealer_status = None
            changed = True
        if not verify_password(settings.bootstrap_admin_password, existing.password_hash):
            existing.password_hash = hash_password(settings.bootstrap_admin_password)
            changed = True
        if changed:
            repo.update_user(existing)
        return changed

    repo.create_user(
        email=settings.bootstrap_admin_email,
        full_name=settings.bootstrap_admin_name,
        password_hash=hash_password(settings.bootstrap_admin_password),
        role=UserRole.ADMIN,
        phone=None,
        country=None,
        business_number=None,
        dealer_status=None,
        account_status=AccountStatus.ACTIVE,
    )
    return True


def ensure_local_test_accounts(repo: SqlAlchemyUserRepository) -> bool:
    changed = False
    for account in _local_test_accounts():
        changed = _sync_bootstrap_user(repo, account) or changed
    return changed


def _local_test_accounts() -> tuple[BootstrapUser, ...]:
    return (
        BootstrapUser(
            email=settings.bootstrap_local_seller_email,
            full_name=settings.bootstrap_local_seller_name,
            role=UserRole.SELLER,
        ),
        BootstrapUser(
            email=settings.bootstrap_local_dealer1_email,
            full_name=settings.bootstrap_local_dealer1_name,
            role=UserRole.DEALER,
            business_number=settings.bootstrap_local_dealer1_business_number,
            dealer_status=DealerApprovalStatus.APPROVED,
        ),
        BootstrapUser(
            email=settings.bootstrap_local_dealer2_email,
            full_name=settings.bootstrap_local_dealer2_name,
            role=UserRole.DEALER,
            business_number=settings.bootstrap_local_dealer2_business_number,
            dealer_status=DealerApprovalStatus.APPROVED,
        ),
    )


def _sync_bootstrap_user(repo: SqlAlchemyUserRepository, account: BootstrapUser) -> bool:
    existing = repo.get_user_by_email(account.email)
    if existing is None:
        repo.create_user(
            email=account.email,
            full_name=account.full_name,
            password_hash=hash_password(settings.bootstrap_local_test_password),
            role=account.role,
            phone=None,
            country=None,
            business_number=account.business_number,
            dealer_status=account.dealer_status,
            account_status=AccountStatus.ACTIVE,
        )
        return True

    changed = False
    if existing.full_name != account.full_name:
        existing.full_name = account.full_name
        changed = True
    if existing.role != account.role:
        existing.role = account.role
        changed = True
    if existing.account_status != AccountStatus.ACTIVE:
        existing.account_status = AccountStatus.ACTIVE
        changed = True
    if existing.business_number != account.business_number:
        existing.business_number = account.business_number
        changed = True
    if existing.dealer_status != account.dealer_status:
        existing.dealer_status = account.dealer_status
        changed = True
    if not verify_password(settings.bootstrap_local_test_password, existing.password_hash):
        existing.password_hash = hash_password(settings.bootstrap_local_test_password)
        changed = True

    if changed:
        repo.update_user(existing)
    return changed
