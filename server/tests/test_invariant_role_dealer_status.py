import uuid
from io import BytesIO

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from contexts.dealers.application.services import DealerOnboardingService, DealerAdminService
from contexts.dealers.infrastructure.repository import SqlAlchemyDealerDocumentRepository
from contexts.dealers.infrastructure.storage import LocalDocumentStorage
from contexts.identity.application.services import IdentityService
from contexts.identity.domain.enums import (
    AccountStatus,
    DealerApprovalStatus,
    UserRole,
)
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository
from shared.infrastructure.database import get_db_session
from api.dependencies import AuthContext, get_current_user
from shared.infrastructure.errors import AppError

# Ensure admin tables are registered before the test engine creates schema
from contexts.admin.infrastructure import models as _admin_models  # noqa: F401


def _upload(name: str, content: bytes = b"x", content_type: str = "application/pdf"):
    # Starlette UploadFile compatible object
    from starlette.datastructures import UploadFile

    return UploadFile(filename=name, file=BytesIO(content), headers={"content-type": content_type})


def _seed_pending_dealer(db: Session, *, email: str = "dealer@example.com"):
    repo = SqlAlchemyUserRepository(db)
    service = DealerOnboardingService(
        user_repo=repo,
        doc_repo=SqlAlchemyDealerDocumentRepository(db),
        storage=LocalDocumentStorage(),
    )
    user = service.register_dealer(
        full_name="홍길동",
        email=email,
        password="Dealer123!@#",
        phone="010-1234-5678",
        country="KR",
        business_number=str(uuid.uuid4())[:13],
        business_license=_upload("biz.pdf"),
        dealer_license=_upload("dealer.pdf"),
        id_card=_upload("id.pdf"),
    )
    return user


def _build_app_for_dealers(db: Session) -> FastAPI:
    from config import get_settings
    from contexts.dealers.presentation.router import router as dealers_router

    app = FastAPI(title="template-test-invariant")

    def _override_get_db_session():  # type: ignore[override]
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db_session] = _override_get_db_session

    def _fake_current_user():
        return AuthContext(user_id=uuid.uuid4(), role=UserRole.ADMIN)

    app.dependency_overrides[get_current_user] = _fake_current_user

    settings = get_settings()
    app.include_router(dealers_router, prefix=settings.api_prefix)
    return app


def test_service_register_dealer_sets_pending_status(db_session: Session):
    user = _seed_pending_dealer(db_session, email="dealer1@example.com")

    assert user.role == UserRole.DEALER
    assert user.dealer_status == DealerApprovalStatus.PENDING


def test_service_admin_account_creation_sets_dealer_status_none(db_session: Session):
    from contexts.admin.application.services import AdminAccountsService
    from contexts.admin.infrastructure.repository import (
        SqlAlchemyAdminAccountsRepository,
    )

    repo = SqlAlchemyAdminAccountsRepository(db_session)
    service = AdminAccountsService(repo)

    payload = service.create_admin_account(
        actor_user_id=None,
        email="admin2@example.com",
        full_name="관리자",
        password="Admin12!",
        phone=None,
        country=None,
        account_status=AccountStatus.ACTIVE.value,
        permission_group_code="OPS_ADMIN",
    )

    assert payload["role"] == UserRole.ADMIN.value
    assert payload["dealer_status"] is None

    # Double-check persisted ORM row
    orm_repo = SqlAlchemyUserRepository(db_session)
    row = orm_repo.get_user_by_email("admin2@example.com")
    assert row is not None
    assert row.role == UserRole.ADMIN
    assert row.dealer_status is None


def test_service_seller_signup_sets_dealer_status_none(db_session: Session):
    identity = IdentityService(SqlAlchemyUserRepository(db_session))
    user = identity.register_seller(
        email="seller1@example.com",
        full_name="판매자",
        password="Seller123!@#",
        phone=None,
        country=None,
    )
    assert user.role == UserRole.SELLER
    assert user.dealer_status is None


def test_service_dealer_login_requires_approved_status(db_session: Session):
    _ = _seed_pending_dealer(db_session, email="dealer-login@example.com")
    identity = IdentityService(SqlAlchemyUserRepository(db_session))

    with pytest.raises(AppError) as exc:
        identity.login(email="dealer-login@example.com", password="Dealer123!@#", role=UserRole.DEALER)
    assert exc.value.status_code == 403
    assert exc.value.code == "DEALER_NOT_APPROVED"


def test_api_dealer_register_returns_non_null_status(test_app: FastAPI, api_prefix: str):
    # Uses admin-auth‑overridden app from conftest (dealers router only)
    app = test_app
    with TestClient(app) as client:
        files = {
            "full_name": (None, "홍길동"),
            "email": (None, "dealer2@example.com"),
            "password": (None, "Dealer123!@#"),
            "phone": (None, "010-0000-0000"),
            "country": (None, "KR"),
            "business_number": (None, str(uuid.uuid4())[:13]),
            "business_license": ("biz.pdf", b"x", "application/pdf"),
            "dealer_license": ("dealer.pdf", b"x", "application/pdf"),
            "id_card": ("id.pdf", b"x", "application/pdf"),
        }
        resp = client.post(f"{api_prefix}/dealers/register", files=files)
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["role"] == UserRole.DEALER
        assert body["dealer_status"] in [s.value for s in DealerApprovalStatus]
        assert body["dealer_status"] == DealerApprovalStatus.PENDING.value


def test_api_pending_dealers_list_has_non_null_status(db_session: Session, api_prefix: str):
    # Build a lightweight app including dealers endpoints + admin auth override
    app = _build_app_for_dealers(db_session)
    # Seed two pending dealers
    _ = _seed_pending_dealer(db_session, email="dealer3@example.com")
    _ = _seed_pending_dealer(db_session, email="dealer4@example.com")

    with TestClient(app) as client:
        resp = client.get(f"{api_prefix}/admin/dealers/pending")
        assert resp.status_code == 200, resp.text
        items = resp.json()
        assert len(items) >= 2
        for item in items:
            assert item["dealer_status"] in [s.value for s in DealerApprovalStatus]
