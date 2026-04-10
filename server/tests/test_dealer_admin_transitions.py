import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from contexts.identity.domain.enums import AccountStatus, DealerApprovalStatus, UserRole
from contexts.identity.infrastructure.models import UserORM
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository
from contexts.dealers.application.services import DealerAdminService
from shared.infrastructure.errors import AppError
from config import get_settings


# ---------- Helpers ----------

def create_dealer(
    db: Session,
    *,
    email: str,
    full_name: str = "Test Dealer",
    role: UserRole = UserRole.DEALER,
    account_status: AccountStatus = AccountStatus.PENDING_APPROVAL,
    dealer_status: DealerApprovalStatus = DealerApprovalStatus.PENDING,
) -> UserORM:
    repo = SqlAlchemyUserRepository(db)
    user = repo.create_user(
        email=email,
        full_name=full_name,
        password_hash="hashed",
        role=role,
        phone="010-0000-0000",
        country="KR",
        business_number=str(uuid.uuid4())[:12],
        dealer_status=dealer_status,
        account_status=account_status,
    )
    repo.commit()
    return user


# ---------- Service-level tests ----------

def test_service_get_pending_dealer_detail_allows_pending(db_session: Session):
    repo = SqlAlchemyUserRepository(db_session)
    service = DealerAdminService(user_repo=repo)
    pending = create_dealer(db_session, email="pending@example.com", dealer_status=DealerApprovalStatus.PENDING)

    got = service.get_pending_dealer_by_id(pending.id)
    assert got.id == pending.id


def test_service_get_pending_dealer_detail_blocks_non_pending(db_session: Session):
    repo = SqlAlchemyUserRepository(db_session)
    service = DealerAdminService(user_repo=repo)
    approved = create_dealer(db_session, email="approved@example.com", dealer_status=DealerApprovalStatus.APPROVED)

    with pytest.raises(AppError) as exc:
        _ = service.get_pending_dealer_by_id(approved.id)
    assert exc.value.status_code == 409


def test_service_approve_conflict_when_not_pending(db_session: Session):
    repo = SqlAlchemyUserRepository(db_session)
    service = DealerAdminService(user_repo=repo)
    approved = create_dealer(db_session, email="approved2@example.com", dealer_status=DealerApprovalStatus.APPROVED)

    with pytest.raises(AppError) as exc:
        _ = service.approve_dealer(approved)
    assert exc.value.status_code == 409


def test_service_reject_conflict_when_not_pending(db_session: Session):
    repo = SqlAlchemyUserRepository(db_session)
    service = DealerAdminService(user_repo=repo)
    rejected = create_dealer(db_session, email="rejected@example.com", dealer_status=DealerApprovalStatus.REJECTED,
                             account_status=AccountStatus.REJECTED)

    with pytest.raises(AppError) as exc:
        _ = service.reject_dealer(rejected, "not allowed")
    assert exc.value.status_code == 409


def test_service_approve_and_reject_happy_paths(db_session: Session):
    repo = SqlAlchemyUserRepository(db_session)
    service = DealerAdminService(user_repo=repo)
    pending1 = create_dealer(db_session, email="pending-approve@example.com", dealer_status=DealerApprovalStatus.PENDING)
    pending2 = create_dealer(db_session, email="pending-reject@example.com", dealer_status=DealerApprovalStatus.PENDING)

    updated1 = service.approve_dealer(pending1)
    assert updated1.dealer_status == DealerApprovalStatus.APPROVED
    assert updated1.account_status == AccountStatus.ACTIVE

    updated2 = service.reject_dealer(pending2, "insufficient docs")
    assert updated2.dealer_status == DealerApprovalStatus.REJECTED
    assert updated2.account_status == AccountStatus.REJECTED
    assert (updated2.dealer_rejection_reason or "").startswith("insufficient")


# ---------- Endpoint tests ----------

def test_endpoint_detail_pending_only_returns_409_for_non_pending(test_app, db_session: Session):
    # Arrange: one approved dealer and one pending dealer
    approved = create_dealer(db_session, email="e1@example.com", dealer_status=DealerApprovalStatus.APPROVED,
                             account_status=AccountStatus.ACTIVE)
    pending = create_dealer(db_session, email="e2@example.com", dealer_status=DealerApprovalStatus.PENDING,
                            account_status=AccountStatus.PENDING_APPROVAL)

    base = get_settings().api_prefix
    with TestClient(test_app) as client:
        # Non-pending → 409
        r1 = client.get(f"{base}/admin/dealers/{approved.id}")
        assert r1.status_code == 409

        # Pending → 200
        r2 = client.get(f"{base}/admin/dealers/{pending.id}")
        assert r2.status_code == 200
        body = r2.json()
        assert body["id"] == str(pending.id)
        assert body["dealer_status"] == DealerApprovalStatus.PENDING.value


def test_endpoint_transitions_enforce_pending_status(test_app, db_session: Session):
    base = get_settings().api_prefix
    non_pending = create_dealer(db_session, email="np@example.com", dealer_status=DealerApprovalStatus.APPROVED,
                                account_status=AccountStatus.ACTIVE)
    pending_a = create_dealer(db_session, email="pa@example.com", dealer_status=DealerApprovalStatus.PENDING)
    pending_r = create_dealer(db_session, email="pr@example.com", dealer_status=DealerApprovalStatus.PENDING)

    with TestClient(test_app) as client:
        # Approve: conflict on non-pending
        r_conflict = client.post(f"{base}/admin/dealers/{non_pending.id}/approve")
        assert r_conflict.status_code == 409

        # Approve: happy path
        r_ok = client.post(f"{base}/admin/dealers/{pending_a.id}/approve")
        assert r_ok.status_code == 200
        assert r_ok.json()["dealer_status"] == DealerApprovalStatus.APPROVED.value

        # Reject: conflict on non-pending
        r_conflict_r = client.post(f"{base}/admin/dealers/{non_pending.id}/reject", json={"reason": "bad"})
        assert r_conflict_r.status_code == 409

        # Reject: happy path
        r_ok_r = client.post(f"{base}/admin/dealers/{pending_r.id}/reject", json={"reason": "docs missing"})
        assert r_ok_r.status_code == 200
        assert r_ok_r.json()["dealer_status"] == DealerApprovalStatus.REJECTED.value
