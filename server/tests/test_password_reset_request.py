from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from config import get_settings
from contexts.identity.application.services import IdentityService
from contexts.identity.domain.enums import UserRole
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository
from shared.infrastructure.database import get_db_session
from shared.infrastructure.errors import AppError


def _build_identity_app(db: Session) -> FastAPI:
    from contexts.identity.presentation.router import router as identity_router

    app = FastAPI(title="template-password-reset-test")

    @app.exception_handler(AppError)
    async def _app_error_handler(_, exc: AppError) -> JSONResponse:  # noqa: ANN001
        return JSONResponse(status_code=exc.status_code, content={"code": exc.code, "message": exc.message})

    @app.exception_handler(RequestValidationError)
    async def _validation_error_handler(_, exc: RequestValidationError) -> JSONResponse:  # noqa: ANN001
        return JSONResponse(status_code=422, content={"code": "VALIDATION_ERROR", "message": str(exc)})

    def _override_get_db_session():  # type: ignore[override]
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db_session] = _override_get_db_session
    app.include_router(identity_router, prefix=get_settings().api_prefix)
    return app


def _seed_seller(db_session: Session, *, email: str = "seller-reset@example.com") -> None:
    identity = IdentityService(SqlAlchemyUserRepository(db_session))
    identity.register_seller(
        email=email,
        full_name="비밀번호 찾기 판매자",
        password="Seller123!@#",
        phone=None,
        country=None,
    )


def test_password_reset_request_returns_token_for_matching_account(db_session: Session, api_prefix: str):
    _seed_seller(db_session)
    app = _build_identity_app(db_session)

    with TestClient(app) as client:
        resp = client.post(
            f"{api_prefix}/auth/password-reset/request",
            json={"email": "seller-reset@example.com", "role": UserRole.SELLER.value},
        )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["message"] == "비밀번호 재설정 요청이 접수되었습니다."
    assert isinstance(body.get("debug_reset_token"), str)
    assert body["debug_reset_token"]


def test_password_reset_request_returns_not_found_for_missing_account(db_session: Session, api_prefix: str):
    app = _build_identity_app(db_session)

    with TestClient(app) as client:
        resp = client.post(
            f"{api_prefix}/auth/password-reset/request",
            json={"email": "missing@example.com", "role": UserRole.SELLER.value},
        )

    assert resp.status_code == 404, resp.text
    assert resp.json() == {"code": "USER_NOT_FOUND", "message": "계정 정보를 찾을 수 없습니다."}


def test_password_reset_request_returns_not_found_for_role_mismatch(db_session: Session, api_prefix: str):
    _seed_seller(db_session, email="role-mismatch@example.com")
    app = _build_identity_app(db_session)

    with TestClient(app) as client:
        resp = client.post(
            f"{api_prefix}/auth/password-reset/request",
            json={"email": "role-mismatch@example.com", "role": UserRole.DEALER.value},
        )

    assert resp.status_code == 404, resp.text
    assert resp.json() == {"code": "USER_NOT_FOUND", "message": "계정 정보를 찾을 수 없습니다."}
