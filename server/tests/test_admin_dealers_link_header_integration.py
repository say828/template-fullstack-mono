from __future__ import annotations

import re
from urllib.parse import urlparse, parse_qsl

from fastapi.testclient import TestClient


def _parse_link_header(header: str):
    """Parse a simple RFC 8288 Link header into rel->(url, query_dict).

    Mirrors the helper used in unit tests but kept local to avoid cross-test imports.
    """
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


def test_router_sets_combined_link_and_preserves_headers(test_app, api_prefix, monkeypatch):
    """
    Verify /admin/dealers/pending sets a single combined Link header (first/prev/next/last),
    preserves non-pagination query params, and exposes X-Total-Count and X-Next-Offset.
    """
    # Patch the service method to avoid DB dependency and control total count
    from contexts.dealers.application.services import DealerAdminService

    def fake_list_paginated(self, *, offset, limit, q=None, created_from=None, created_to=None):  # noqa: ANN001
        # Body can be empty for header assertions; total determines Link/Next-Offset behavior
        return [], 35

    monkeypatch.setattr(DealerAdminService, "list_pending_dealers_paginated", fake_list_paginated, raising=True)

    client = TestClient(test_app)

    params = {"offset": 20, "limit": 10, "q": "smith"}
    resp = client.get(f"{api_prefix}/admin/dealers/pending", params=params)
    assert resp.status_code == 200, resp.text

    # Pagination count headers
    assert resp.headers.get("X-Total-Count") == "35"
    assert resp.headers.get("X-Next-Offset") == "30"  # 20+10 < 35 -> 30

    # Combined Link header assertions
    link = resp.headers.get("Link")
    assert link, "Link header missing"

    rel_to_url, rel_to_query = _parse_link_header(link)

    # All expected rels present in a single header value
    for rel in ("first", "prev", "next", "last"):
        assert rel in rel_to_url, f"Missing rel={rel} in Link header: {link}"

    # Offsets/limits computed correctly
    assert rel_to_query["first"]["offset"] == "0"
    assert rel_to_query["prev"]["offset"] == "10"
    assert rel_to_query["next"]["offset"] == "30"
    assert rel_to_query["last"]["offset"] == "30"
    for rel in ("first", "prev", "next", "last"):
        assert rel_to_query[rel]["limit"] == "10"

    # Query preservation: arbitrary filter param remains on all relations
    for rel in ("first", "prev", "next", "last"):
        assert rel_to_query[rel]["q"] == "smith"

    # Path remains consistent (no double-prefixing etc.)
    for rel, url in rel_to_url.items():
        assert urlparse(url).path == f"{api_prefix}/admin/dealers/pending", f"Path drift for rel={rel}: {url}"

