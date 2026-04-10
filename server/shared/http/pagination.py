from __future__ import annotations

from typing import Any, Protocol, cast


class URLLike(Protocol):
    def include_query_params(self, **kwargs: Any) -> Any: ...


def _coerce_url(url: Any) -> URLLike:
    """
    Coerce incoming `url` to a Starlette `URL`-like object with
    `include_query_params(**kwargs)` available. Accepts either an existing
    URL instance or a string.
    """
    # Fast path: already a URL-like object (FastAPI/Starlette Request.url)
    if hasattr(url, "include_query_params"):
        return cast(URLLike, url)
    # Fallback to constructing from string
    from starlette.datastructures import URL

    return cast(URLLike, URL(str(url)))


def build_pagination_links(
    base_url: Any,
    *,
    offset: int,
    limit: int,
    total: int | None,
) -> str | None:
    """Compose an RFC 8288 Link header value for offset/limit pagination.

    Emits a single comma-separated Link header with up to these relations:
    "first", "prev", "next", and "last". Only `offset` and `limit` are
    overridden; all other query parameters (e.g., filters like `q`, `status`,
    date ranges) are preserved verbatim on every generated URL.

    Relations and decision rules:
    - "first": always present; `offset=0`.
    - "prev": present when `offset > 0`; `offset=max(0, offset - limit)`.
    - "next": present when `total` is known and `offset + limit < total`.
    - "last": present when `total` is known; `offset=floor((total-1)/limit)*limit`.

    Empty-results semantics (total = 0):
    - Both "first" and "last" are emitted and are identical (`offset=0`).
      This makes the header structurally complete for clients that expect
      `first`/`last` when a total is known, while still signaling an empty
      collection (no `prev`/`next`).

    Unknown-total semantics (`total is None`):
    - "first" is emitted (offset 0) and "prev" is emitted when `offset > 0`.
    - "next" and "last" are omitted because the terminal page cannot be
      determined safely without a total. Callers that prefer optimistic
      "next" generation should do so at the router level; this helper
      intentionally chooses safety and predictability.

    Validation notes:
    - A non-positive `limit` results in `None` (no header). Callers should
      validate `limit >= 1` and `offset >= 0` at the framework boundary
      (e.g., FastAPI `Query(ge=0)` / `Query(ge=1)`).

    Returns the header string or `None` when no relations are applicable.
    """
    if limit <= 0:
        # Defensive guard; callers should validate via framework (e.g., Query ge=1)
        return None

    url = _coerce_url(base_url)

    links: list[str] = []

    # first
    first_url = str(url.include_query_params(offset=0, limit=limit))
    links.append(f"<{first_url}>; rel=\"first\"")

    # prev
    if offset > 0:
        prev_offset = offset - limit
        if prev_offset < 0:
            prev_offset = 0
        prev_url = str(url.include_query_params(offset=prev_offset, limit=limit))
        links.append(f"<{prev_url}>; rel=\"prev\"")

    # next
    next_offset: int | None = None
    if total is None:
        # When total isn't known, emit next optimistically if offset advanced
        # would not underflow; routers may choose to omit in that case. Keep
        # behavior conservative here: require total to decide.
        next_offset = None
    else:
        if (offset + limit) < total:
            next_offset = offset + limit
    if next_offset is not None:
        next_url = str(url.include_query_params(offset=next_offset, limit=limit))
        links.append(f"<{next_url}>; rel=\"next\"")

    # last
    if total is not None:
        last_offset = 0
        if total > 0:
            last_offset = ((total - 1) // limit) * limit
        last_url = str(url.include_query_params(offset=last_offset, limit=limit))
        links.append(f"<{last_url}>; rel=\"last\"")

    return ", ".join(links) if links else None
