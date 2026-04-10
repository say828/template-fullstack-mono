from __future__ import annotations

from uuid import uuid4

import pytest
from http import HTTPStatus

from shared.infrastructure.security import create_access_token
from contexts.identity.domain.enums import UserRole


# Representative admin dealer routes to probe RBAC semantics.
ROUTES: list[tuple[str, str]] = [
    ("GET", "/admin/dealers/pending"),
    ("GET", "/admin/dealers/00000000-0000-0000-0000-000000000000"),
    ("POST", "/admin/dealers/00000000-0000-0000-0000-000000000000/approve"),
    ("POST", "/admin/dealers/00000000-0000-0000-0000-000000000000/reject"),
    (
        "GET",
        "/admin/dealers/00000000-0000-0000-0000-000000000000/documents/00000000-0000-0000-0000-000000000000/download",
    ),
    (
        "GET",
        "/admin/dealers/00000000-0000-0000-0000-000000000000/documents/00000000-0000-0000-0000-000000000000/preview",
    ),
]


@pytest.mark.parametrize("method, path", ROUTES)
def test_unauthenticated_requests_receive_401(test_client, api_prefix, method: str, path: str) -> None:
    url = f"{api_prefix}{path}"
    if method == "GET":
        resp = test_client.get(url)
    elif method == "POST":
        # Provide minimal JSON to avoid 422 if body parsing occurs
        resp = test_client.post(url, json={"reason": "dummy"})
    else:
        pytest.skip(f"Unsupported method in test table: {method}")
    assert resp.status_code == HTTPStatus.UNAUTHORIZED, (
        f"Expected 401 for unauthenticated {method} {path}, got {resp.status_code}: {resp.text}"
    )


@pytest.mark.parametrize("method, path", ROUTES)
def test_non_admin_requests_receive_403(test_client, api_prefix, method: str, path: str) -> None:
    url = f"{api_prefix}{path}"
    # Create a token for a DEALER (non-admin) role
    token = create_access_token(uuid4(), UserRole.DEALER.value)
    headers = {"Authorization": f"Bearer {token}"}

    if method == "GET":
        resp = test_client.get(url, headers=headers)
    elif method == "POST":
        resp = test_client.post(url, headers=headers, json={"reason": "dummy"})
    else:
        pytest.skip(f"Unsupported method in test table: {method}")

    assert resp.status_code == HTTPStatus.FORBIDDEN, (
        f"Expected 403 for non-admin {method} {path}, got {resp.status_code}: {resp.text}"
    )
