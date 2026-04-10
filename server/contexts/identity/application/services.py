from datetime import datetime, timedelta, timezone
from uuid import UUID

from config import get_settings
from contexts.identity.domain.enums import AccountStatus, DealerApprovalStatus, UserRole
from contexts.identity.domain.ports import UserRepositoryPort
from contexts.identity.infrastructure.models import PasswordResetTokenORM, UserORM
from shared.infrastructure.errors import AppError
from shared.infrastructure.security import (
    create_access_token,
    generate_plain_token,
    hash_password,
    hash_token,
    verify_password,
)

from shared.infrastructure.environment import is_production
settings = get_settings()


class IdentityService:
    def __init__(self, repo: UserRepositoryPort) -> None:
        self.repo = repo

    def register_seller(
        self,
        *,
        email: str,
        full_name: str,
        password: str,
        phone: str | None,
        country: str | None,
    ) -> UserORM:
        if self.repo.get_user_by_email(email):
            raise AppError("이미 가입된 이메일입니다.", 409, "EMAIL_ALREADY_EXISTS")

        user = self.repo.create_user(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            role=UserRole.SELLER,
            phone=phone,
            country=country,
            business_number=None,
            dealer_status=None,
            account_status=AccountStatus.ACTIVE,
        )
        self.repo.commit()
        return user

    def login(self, *, email: str, password: str, role: UserRole) -> tuple[str, UserORM]:
        user = self.repo.get_user_by_email(email)
        if not user:
            raise AppError("이메일 또는 비밀번호가 올바르지 않습니다.", 401, "INVALID_CREDENTIALS")

        if user.role != role:
            raise AppError("선택한 역할과 계정 역할이 일치하지 않습니다.", 403, "ROLE_MISMATCH")

        if not verify_password(password, user.password_hash):
            raise AppError("이메일 또는 비밀번호가 올바르지 않습니다.", 401, "INVALID_CREDENTIALS")

        if user.role == UserRole.DEALER and user.dealer_status != DealerApprovalStatus.APPROVED:
            raise AppError("딜러 계정은 관리자 승인 후 로그인할 수 있습니다.", 403, "DEALER_NOT_APPROVED")

        if user.account_status != AccountStatus.ACTIVE:
            raise AppError("현재 계정 상태로는 로그인할 수 없습니다.", 403, "ACCOUNT_NOT_ACTIVE")

        token = create_access_token(user.id, user.role.value)
        return token, user

    def request_password_reset(self, *, email: str, role: UserRole) -> dict:
        user = self.repo.get_user_by_email(email)
        if not user or user.role != role:
            raise AppError("계정 정보를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

        plain = generate_plain_token()
        token = PasswordResetTokenORM(
            user_id=user.id,
            token_hash=hash_token(plain),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.reset_token_ttl_minutes),
        )
        self.repo.save_reset_token(token)
        self.repo.commit()

        response = {"message": "비밀번호 재설정 요청이 접수되었습니다."}
        if not is_production():
            response["debug_reset_token"] = plain
        return response

    def confirm_password_reset(self, *, token: str, new_password: str) -> None:
        now = datetime.now(timezone.utc)
        token_row = self.repo.get_reset_token(hash_token(token), now)
        if not token_row:
            raise AppError("유효하지 않거나 만료된 토큰입니다.", 400, "INVALID_RESET_TOKEN")

        user = self.repo.get_user_by_id(token_row.user_id)
        if not user:
            raise AppError("계정을 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

        user.password_hash = hash_password(new_password)
        token_row.used_at = now
        self.repo.update_user(user)
        self.repo.commit()

    def get_me(self, user_id: UUID) -> UserORM:
        user = self.repo.get_user_by_id(user_id)
        if not user:
            raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")
        return user
