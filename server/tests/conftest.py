import uuid
import pytest
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Avoid importing the global api_router to reduce cross-context coupling
from api.dependencies import AuthContext, get_current_user
from contexts.identity.domain.enums import UserRole
from shared.infrastructure.database import Base, get_db_session
from shared.infrastructure.errors import AppError
from config import get_settings

# Import only models needed for tests to register mappings
from contexts.identity.infrastructure import models as _identity_models  # noqa: F401
from contexts.dealers.infrastructure import models as _dealers_models  # noqa: F401


@pytest.fixture()
def engine():
    """Single in‑memory SQLite engine shared for the whole test session.

    Combined with a function‑scoped transaction/session fixture below, this
    ensures test data is isolated via SAVEPOINT nested transactions while
    avoiding repeated DDL.
    """
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Enforce FK constraints on SQLite to better mirror production semantics.
    if engine.dialect.name == "sqlite":
        @event.listens_for(engine, "connect")  # type: ignore[misc]
        def _set_sqlite_pragma(dbapi_connection, _):  # noqa: ANN001
            cursor = dbapi_connection.cursor()
            try:
                cursor.execute("PRAGMA foreign_keys=ON")
            finally:
                cursor.close()

    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture()
def db_session(engine) -> Session:
    """Function‑scoped SQLAlchemy session isolated via nested SAVEPOINT.

    Pattern:
      - Open a dedicated connection and BEGIN an outer transaction.
      - Open a Session bound to that connection and start a nested transaction
        (SAVEPOINT). Any `session.commit()` inside app code only releases the
        savepoint; the outer transaction remains. We re‑establish a new nested
        savepoint after each commit so multiple commit cycles stay isolated.
      - On teardown, roll back the outer transaction and close the connection.
    """
    # Dedicated connection per test
    connection = engine.connect()
    outer_tx = connection.begin()

    TestingSessionLocal = sessionmaker(
        bind=connection, autocommit=False, autoflush=False, expire_on_commit=False
    )
    session = TestingSessionLocal()

    # Start nested transaction (SAVEPOINT) so in‑test commits don't leak
    session.begin_nested()

    # When the nested transaction ends (e.g., after a commit), start a new one
    # as long as the connection is still valid and the outer transaction is open.
    def _restart_savepoint(sess: Session, trans):  # noqa: ANN001
        # Recreate a SAVEPOINT after the nested transaction ends, as long as
        # the outer transaction is still active. This supports app code that
        # issues `session.commit()` without leaking data across tests.
        parent = getattr(trans, "_parent", None)
        if trans.nested and parent is not None and getattr(parent, "is_active", False):
            sess.begin_nested()

    event.listen(session, "after_transaction_end", _restart_savepoint)

    try:
        yield session
    finally:
        # Close session and roll back all changes from this test
        session.close()
        outer_tx.rollback()
        connection.close()


def _make_app(db_session: Session, *, override_auth: bool) -> FastAPI:
    app = FastAPI(title="template-test")

    @app.exception_handler(AppError)
    async def _app_error_handler(_, exc: AppError) -> JSONResponse:  # noqa: ANN001
        return JSONResponse(status_code=exc.status_code, content={"code": exc.code, "message": exc.message})

    @app.exception_handler(RequestValidationError)
    async def _validation_error_handler(_, exc: RequestValidationError) -> JSONResponse:  # noqa: ANN001
        return JSONResponse(status_code=422, content={"code": "VALIDATION_ERROR", "message": str(exc)})

    # Compose only the routers needed for admin dealer tests to avoid loading unrelated modules
    from contexts.dealers.presentation.router import router as dealers_router  # local import to keep lazy

    settings = get_settings()
    app.include_router(dealers_router, prefix=settings.api_prefix)

    def _override_get_db_session():  # type: ignore[override]
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db_session] = _override_get_db_session

    if override_auth:
        def _fake_current_user():
            return AuthContext(user_id=uuid.uuid4(), role=UserRole.ADMIN)
        app.dependency_overrides[get_current_user] = _fake_current_user

    return app


@pytest.fixture()
def test_app(db_session: Session) -> FastAPI:
    """App for admin-happy-path tests: DB override + admin auth override."""
    return _make_app(db_session, override_auth=True)


@pytest.fixture()
def test_client(db_session: Session) -> TestClient:
    """Client for RBAC/auth tests: DB override only, no auth override."""
    app = _make_app(db_session, override_auth=False)
    return TestClient(app)


@pytest.fixture(scope='session')
def api_prefix() -> str:
    return get_settings().api_prefix


@pytest.fixture()
def set_environment():
    """Helper fixture to set and restore application environment per test."""
    prev = get_settings().environment

    def _setter(env: str) -> None:
        get_settings().environment = env

    try:
        yield _setter
    finally:
        get_settings().environment = prev
