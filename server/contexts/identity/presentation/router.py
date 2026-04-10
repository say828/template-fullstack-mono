from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.dependencies import AuthContext, get_auth_context, get_current_user
from contexts.identity.application.services import IdentityService
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository
from contexts.identity.presentation.schemas import (
    AuthResponse,
    LoginRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    SellerSignupRequest,
    UserResponse,
)
from contexts.identity.domain.enums import UserRole
from shared.domain.normalizers import normalize_dealer_status

from shared.infrastructure.database import get_db_session

router = APIRouter(prefix="/auth", tags=["auth"])


def to_user_response(user) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        dealer_status=normalize_dealer_status(user.dealer_status) if user.role == UserRole.DEALER else None,
    )


@router.post("/register/seller", response_model=UserResponse)
def register_seller(payload: SellerSignupRequest, db: Session = Depends(get_db_session)) -> UserResponse:
    service = IdentityService(SqlAlchemyUserRepository(db))
    user = service.register_seller(
        email=payload.email,
        full_name=payload.full_name,
        password=payload.password,
        phone=payload.phone,
        country=payload.country,
    )
    return to_user_response(user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db_session)) -> AuthResponse:
    service = IdentityService(SqlAlchemyUserRepository(db))
    token, user = service.login(email=payload.email, password=payload.password, role=payload.role)
    return AuthResponse(access_token=token, user=to_user_response(user))


@router.post("/password-reset/request")
def request_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db_session)) -> dict:
    service = IdentityService(SqlAlchemyUserRepository(db))
    return service.request_password_reset(email=payload.email, role=payload.role)


@router.post("/password-reset/confirm")
def confirm_password_reset(payload: PasswordResetConfirmRequest, db: Session = Depends(get_db_session)) -> dict:
    service = IdentityService(SqlAlchemyUserRepository(db))
    service.confirm_password_reset(token=payload.token, new_password=payload.new_password)
    return {"message": "비밀번호가 변경되었습니다."}


@router.get("/me", response_model=UserResponse)
def me(ctx: AuthContext = Depends(get_current_user), db: Session = Depends(get_db_session)) -> UserResponse:
    _ = get_auth_context(ctx)
    service = IdentityService(SqlAlchemyUserRepository(db))
    user = service.get_me(ctx.user_id)
    return to_user_response(user)
