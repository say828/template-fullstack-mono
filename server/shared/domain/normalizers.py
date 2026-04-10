from contexts.identity.domain.enums import DealerApprovalStatus


def normalize_dealer_status(status: DealerApprovalStatus | None) -> DealerApprovalStatus:
    """Normalize a possibly-null dealer approval status to a concrete enum.

    Semantics
    - If ``status`` is ``None`` (older rows or in-flight onboarding), return
      ``DealerApprovalStatus.PENDING``.
    - Otherwise, return the given value unchanged.

    Intended use
    - Admin/backoffice read surfaces and serializers that require a non-Optional
      value (e.g., admin dealers list/detail, registration response).
    - Service-layer computations that need a stable enum for logging/metrics or
      display and do not depend on distinguishing ``None`` from ``PENDING``.

    Cautions
    - Do not use this result to grant capabilities or make authorization/entitlement
      decisions. Prefer explicit checks such as
      ``status == DealerApprovalStatus.APPROVED`` rather than truthiness or
      ``is not None``.
    - Normalization does not persist any value. Callers must update storage if
      they intend to materialize ``PENDING`` for previously-null rows.
    - When exposing normalized values outside admin contexts, ensure the route or
      caller is role-guarded (e.g., ADMIN/SUPPORT) and that client behavior expects
      ``None → PENDING`` semantics.

    Rationale
    - Some persisted users carry ``NULL`` ``dealer_status`` from older data. Admin
      workflows operate on a concrete status aligned with onboarding defaults, so
      treating ``None`` as ``PENDING`` keeps responses consistent and avoids
      Optional handling in clients.
    """
    return status if status is not None else DealerApprovalStatus.PENDING
