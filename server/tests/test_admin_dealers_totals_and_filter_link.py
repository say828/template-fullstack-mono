from __future__ import annotations

import re
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse, parse_qsl

from fastapi.testclient import TestClient

from contexts.identity.domain.enums import UserRole, DealerApprovalStatus, AccountStatus
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository


def _parse_link_header(header: str):
    parts = [p.strip() for p in header.split(',') if p.strip()]
    rel_to_url: dict[str, str] = {}
    rel_to_query: dict[str, dict[str, str]] = {}
    for part in parts:
        m = re.match(r'<([^>]+)>;\s*rel="([^"]+)"', part)
        assert m, f"Invalid link part format: {part}"
        url, rel = m.group(1), m.group(2)
        rel_to_url[rel] = url
        rel_to_query[rel] = dict(parse_qsl(urlparse(url).query))
    return rel_to_url, rel_to_query


def _seed_dealers(repo: SqlAlchemyUserRepository):
    """Create a mixed dataset of dealers for filtering semantics.

    Returns the expected filtered total for q='smith' within March 2026.
    """
    # Helpers
    def mk_dt(iso: str) -> datetime:
        dt = datetime.fromisoformat(iso)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt

    created_in_range = [
        mk_dt("2026-03-02T10:00:00+00:00"),
        mk_dt("2026-03-03T11:00:00+00:00"),
        mk_dt("2026-03-04T12:00:00+00:00"),
        mk_dt("2026-03-05T13:00:00+00:00"),
        mk_dt("2026-03-06T14:00:00+00:00"),
    ]
    created_out_of_range = mk_dt("2026-02-15T09:00:00+00:00")

    # 5 pending "smith" inside range → should be counted
    smith_pending_users = []
    for i, when in enumerate(created_in_range, start=1):
        u = repo.create_user(
            email=f"smith{i}@ex.com",
            full_name=f"John Smith {i}",
            password_hash="x" * 60,
            role=UserRole.DEALER,
            phone=f"010-0000-00{i:02d}",
            country="KR",
            business_number=f"BN-S{i:03d}",
            dealer_status=DealerApprovalStatus.PENDING,
            account_status=AccountStatus.PENDING_APPROVAL,
        )
        u.created_at = when
        repo.update_user(u)
        smith_pending_users.append(u)

    # 1 pending "smith" outside range → excluded by date filter
    u = repo.create_user(
        email="smith_out@ex.com",
        full_name="John Smith Out",
        password_hash="x" * 60,
        role=UserRole.DEALER,
        phone="010-9999-0000",
        country="KR",
        business_number="BN-OUT",
        dealer_status=DealerApprovalStatus.PENDING,
        account_status=AccountStatus.PENDING_APPROVAL,
    )
    u.created_at = created_out_of_range
    repo.update_user(u)

    # Non-matching names but pending in range → should not affect filtered total
    for i in range(3):
        u = repo.create_user(
            email=f"other{i}@ex.com",
            full_name=f"Alice Other {i}",
            password_hash="x" * 60,
            role=UserRole.DEALER,
            phone=f"010-1111-22{i:02d}",
            country="KR",
            business_number=f"BN-O{i:03d}",
            dealer_status=DealerApprovalStatus.PENDING,
            account_status=AccountStatus.PENDING_APPROVAL,
        )
        u.created_at = created_in_range[min(i, len(created_in_range)-1)] + timedelta(minutes=i)
        repo.update_user(u)

    # Approved smith in range → excluded by status filter
    for i in range(2):
        u = repo.create_user(
            email=f"smith_ok{i}@ex.com",
            full_name=f"John Smith OK {i}",
            password_hash="x" * 60,
            role=UserRole.DEALER,
            phone=f"010-2222-33{i:02d}",
            country="KR",
            business_number=f"BN-OK{i:03d}",
            dealer_status=DealerApprovalStatus.APPROVED,
            account_status=AccountStatus.ACTIVE,
        )
        u.created_at = created_in_range[min(i, len(created_in_range)-1)]
        repo.update_user(u)

    repo.commit()
    # Expected filtered count: 5 smith pending inside date range
    return 5


def test_totals_match_filtered_pending_and_link_preserves_filters(test_app, api_prefix, db_session):
    repo = SqlAlchemyUserRepository(db_session)
    expected_total = _seed_dealers(repo)

    client = TestClient(test_app)

    params = {
        "offset": 2,
        "limit": 2,
        "q": "smith",
        "created_from": "2026-03-01",
        "created_to": "2026-03-31",
    }

    resp = client.get(f"{api_prefix}/admin/dealers/pending", params=params)
    assert resp.status_code == 200, resp.text

    # X-Total-Count reflects the FILTERED set, not all pending
    assert resp.headers.get("X-Total-Count") == str(expected_total)

    # Next offset computed from filtered total
    assert resp.headers.get("X-Next-Offset") == "4"  # 2+2 < 5 → 4

    link = resp.headers.get("Link")
    assert link, "Link header missing"

    rel_to_url, rel_to_query = _parse_link_header(link)

    # All applicable rels present given offset=2, limit=2, total=5
    for rel in ("first", "prev", "next", "last"):
        assert rel in rel_to_url

    # Offsets/limits computed correctly for filtered total
    assert rel_to_query["first"]["offset"] == "0"
    assert rel_to_query["prev"]["offset"] == "0"      # max(0, 2-2)
    assert rel_to_query["next"]["offset"] == "4"      # 2+2
    assert rel_to_query["last"]["offset"] == "4"      # floor((5-1)/2)*2
    for rel in ("first", "prev", "next", "last"):
        assert rel_to_query[rel]["limit"] == "2"

    # Filter preservation across all Link relations
    for rel in ("first", "prev", "next", "last"):
        q = rel_to_query[rel]
        assert q["q"] == "smith"
        assert q["created_from"] == "2026-03-01"
        assert q["created_to"] == "2026-03-31"

