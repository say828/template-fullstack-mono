import re
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

import pytest

from shared.http.pagination import build_pagination_links


class FakeURL:
    """Minimal URL-like object exposing include_query_params used by the helper.

    This avoids requiring Starlette in the test environment while matching the
    semantics we rely on: preserve existing query params and override keys
    provided to include_query_params.
    """

    def __init__(self, value: str):
        self._value = value

    def include_query_params(self, **kwargs):
        parsed = urlparse(self._value)
        existing = dict(parse_qsl(parsed.query, keep_blank_values=True))
        existing.update({k: str(v) for k, v in kwargs.items()})
        new_query = urlencode(existing, doseq=False)
        new_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))
        return FakeURL(new_url)

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self._value


def _parse_link_header(header: str):
    """Parse a simple RFC 8288 Link header into rel->url and rel->query dicts."""
    parts = [p.strip() for p in header.split(',') if p.strip()]
    rel_to_url = {}
    rel_to_query = {}
    for part in parts:
        m = re.match(r'<([^>]+)>;\s*rel="([^"]+)"', part)
        assert m, f"Invalid link part format: {part}"
        url, rel = m.group(1), m.group(2)
        rel_to_url[rel] = url
        q = dict(parse_qsl(urlparse(url).query))
        rel_to_query[rel] = q
    return rel_to_url, rel_to_query


@pytest.mark.parametrize(
    "base_url,offset,limit,total,expected_rels,absent_rels,expected_offsets",
    [
        (
            FakeURL("https://api.test/admin/dealers/pending?q=foo"),
            0,
            10,
            35,
            {"first", "next", "last"},
            {"prev"},
            {"first": "0", "next": "10", "last": "30"},
        ),
        (
            FakeURL("https://api.test/admin/dealers/pending?q=foo"),
            30,
            10,
            35,
            {"first", "prev", "last"},
            {"next"},
            {"first": "0", "prev": "20", "last": "30"},
        ),
    ],
)
def test_link_relations_and_offsets(base_url, offset, limit, total, expected_rels, absent_rels, expected_offsets):
    header = build_pagination_links(base_url, offset=offset, limit=limit, total=total)
    assert header is not None
    rel_to_url, rel_to_query = _parse_link_header(header)

    # Expected relations present and absent
    assert expected_rels.issubset(set(rel_to_url.keys()))
    assert set(rel_to_url.keys()).isdisjoint(absent_rels)

    # Offsets as expected per rel
    for rel, off in expected_offsets.items():
        assert rel_to_query[rel]["offset"] == off
        assert rel_to_query[rel]["limit"] == str(limit)
        # filter param preserved
        assert rel_to_query[rel]["q"] == "foo"


def test_empty_results_first_and_last_only():
    header = build_pagination_links(
        FakeURL("https://api.test/admin/dealers/pending?q=foo"),
        offset=0,
        limit=10,
        total=0,
    )
    assert header is not None
    rel_to_url, rel_to_query = _parse_link_header(header)

    # Only first and last present
    assert set(rel_to_url.keys()) == {"first", "last"}
    # Both point to offset 0 and preserve filters
    assert rel_to_query["first"]["offset"] == "0"
    assert rel_to_query["last"]["offset"] == "0"
    assert rel_to_query["first"]["q"] == "foo"
    assert rel_to_query["last"]["q"] == "foo"


def test_filter_preservation_and_override_of_existing_pagination_params():
    # Base URL already has offset/limit; they must be overridden
    base = FakeURL("https://api.test/admin/dealers/pending?q=smith&created_gte=2026-03-01&offset=999&limit=999")
    header = build_pagination_links(base, offset=20, limit=15, total=100)
    assert header is not None
    rel_to_url, rel_to_query = _parse_link_header(header)

    for rel in ["first", "prev", "next", "last"]:
        assert rel in rel_to_url
        q = rel_to_query[rel]
        # pagination params overridden
        assert q["limit"] == "15"
        # static filters preserved
        assert q["q"] == "smith"
        assert q["created_gte"] == "2026-03-01"

    # Spot-check computed offsets
    assert rel_to_query["first"]["offset"] == "0"
    assert rel_to_query["prev"]["offset"] == "5"  # 20-15
    assert rel_to_query["next"]["offset"] == "35"  # 20+15
    assert rel_to_query["last"]["offset"] == "90"  # floor((100-1)/15)*15


@pytest.mark.parametrize("bad_limit", [0, -1])
def test_non_positive_limit_returns_none(bad_limit):
    header = build_pagination_links(FakeURL("https://api.test/x"), offset=0, limit=bad_limit, total=10)
    assert header is None
