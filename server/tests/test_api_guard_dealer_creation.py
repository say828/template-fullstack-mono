import uuid
from io import BytesIO

from fastapi.testclient import TestClient

from contexts.dealers.application.services import DealerOnboardingService
from contexts.identity.domain.enums import AccountStatus, UserRole


def _upload(name: str, content: bytes = b"x", content_type: str = "application/pdf"):
    # Starlette UploadFile compatible object
    from starlette.datastructures import UploadFile

    return UploadFile(filename=name, file=BytesIO(content), headers={"content-type": content_type})


def _monkeypatch_register_dealer_to_null_status(monkeypatch):
    """Patch DealerOnboardingService.register_dealer to call the repository with dealer_status=None.

    This drives the repository-level guard from an HTTP call without modifying application code.
    """

    orig = DealerOnboardingService.register_dealer

    def _fake_register(self, *, full_name, email, password, phone, country, business_number, business_license, dealer_license, id_card):  # noqa: ANN001,E501
        # Intentionally bypass document handling and call create_user with dealer_status=None
        # to exercise the guard. Password hash format is irrelevant for this smoke path.
        return self.user_repo.create_user(
            email=email,
            full_name=full_name,
            password_hash="x",
            role=UserRole.DEALER,
            phone=phone,
            country=country,
            business_number=business_number,
            dealer_status=None,  # <- guard target
            account_status=AccountStatus.PENDING_APPROVAL,
        )

    monkeypatch.setattr(DealerOnboardingService, "register_dealer", _fake_register)
    return orig


def test_api_guard_non_prod_null_status_returns_400(test_app, api_prefix, set_environment, monkeypatch):
    # Force non-production behavior
    set_environment("development")

    _monkeypatch_register_dealer_to_null_status(monkeypatch)

    files = {
        "full_name": (None, "홍길동"),
        "email": (None, "guard-nonprod-http@example.com"),
        "password": (None, "Dealer123!@#"),
        "phone": (None, "010-0000-0000"),
        "country": (None, "KR"),
        "business_number": (None, str(uuid.uuid4())[:13]),
        "business_license": ("biz.pdf", b"x", "application/pdf"),
        "dealer_license": ("dealer.pdf", b"x", "application/pdf"),
        "id_card": ("id.pdf", b"x", "application/pdf"),
    }

    # Capture server error as a response instead of raising in test context
    app = test_app
    with TestClient(app, raise_server_exceptions=False) as client:
        resp = client.post(f"{api_prefix}/dealers/register", files=files)
        assert resp.status_code == 400, resp.text


def test_api_guard_prod_null_status_warns_and_allows(test_app, api_prefix, set_environment, monkeypatch, caplog):
    # Force production (warn-only) behavior
    set_environment("production")

    _monkeypatch_register_dealer_to_null_status(monkeypatch)

    files = {
        "full_name": (None, "홍길동"),
        "email": (None, "guard-prod-http@example.com"),
        "password": (None, "Dealer123!@#"),
        "phone": (None, "010-0000-0000"),
        "country": (None, "KR"),
        "business_number": (None, str(uuid.uuid4())[:13]),
        "business_license": ("biz.pdf", b"x", "application/pdf"),
        "dealer_license": ("dealer.pdf", b"x", "application/pdf"),
        "id_card": ("id.pdf", b"x", "application/pdf"),
    }

    app = test_app
    caplog.set_level("WARNING")
    with TestClient(app) as client:
        resp = client.post(f"{api_prefix}/dealers/register", files=files)
        assert resp.status_code == 200, resp.text
        body = resp.json()
        # Onboarding should proceed and status should be normalized in response
        assert body["role"] == UserRole.DEALER
        assert body["dealer_status"] in ("PENDING", "APPROVED", "REJECTED")
        # Guard should have logged a warning in production
        assert any("DEALER_STATUS_GUARD: creating DEALER with NULL dealer_status" in rec.getMessage() for rec in caplog.records)
