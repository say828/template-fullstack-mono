from dataclasses import dataclass
from uuid import UUID

from contexts.identity.domain.enums import AccountStatus
from contexts.identity.infrastructure.models import UserORM
from contexts.settings.domain.ports import SettingsRepositoryPort
from contexts.settings.infrastructure.models import UserPreferenceORM, WithdrawalRequestORM
from shared.infrastructure.errors import AppError
from shared.infrastructure.security import hash_password, verify_password


@dataclass
class SettingsSnapshot:
    user: UserORM
    preference: UserPreferenceORM


class SettingsService:
    def __init__(self, repo: SettingsRepositoryPort) -> None:
        self.repo = repo

    def _get_user(self, user_id: UUID) -> UserORM:
        user = self.repo.get_user(user_id)
        if not user:
            raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")
        return user

    def _get_or_create_pref(self, user_id: UUID) -> UserPreferenceORM:
        pref = self.repo.get_user_preference(user_id)
        if pref:
            return pref
        pref = self.repo.create_user_preference(
            user_id=user_id,
            language="ko",
            region="KR",
            notify_bidding=True,
            notify_settlement=True,
            notify_marketing=False,
            notify_support=True,
        )
        return pref

    def get_snapshot(self, *, user_id: UUID) -> SettingsSnapshot:
        user = self._get_user(user_id)
        pref = self._get_or_create_pref(user_id)
        self.repo.commit()
        return SettingsSnapshot(user=user, preference=pref)

    def update_profile(
        self,
        *,
        user_id: UUID,
        full_name: str,
        phone: str | None,
        country: str | None,
    ) -> SettingsSnapshot:
        user = self._get_user(user_id)
        if len(full_name.strip()) < 2:
            raise AppError("이름은 2자 이상이어야 합니다.", 400, "INVALID_FULL_NAME")
        user.full_name = full_name.strip()
        user.phone = phone.strip() if phone else None
        user.country = country.strip() if country else None
        self.repo.update_user(user)
        pref = self._get_or_create_pref(user_id)
        self.repo.commit()
        return SettingsSnapshot(user=user, preference=pref)

    def change_password(
        self,
        *,
        user_id: UUID,
        current_password: str,
        new_password: str,
    ) -> None:
        user = self._get_user(user_id)
        if not verify_password(current_password, user.password_hash):
            raise AppError("현재 비밀번호가 일치하지 않습니다.", 400, "CURRENT_PASSWORD_MISMATCH")
        if len(new_password) < 8:
            raise AppError("새 비밀번호는 8자 이상이어야 합니다.", 400, "INVALID_NEW_PASSWORD")
        user.password_hash = hash_password(new_password)
        self.repo.update_user(user)
        self.repo.commit()

    def update_preferences(
        self,
        *,
        user_id: UUID,
        language: str,
        region: str,
        notify_bidding: bool,
        notify_settlement: bool,
        notify_marketing: bool,
        notify_support: bool,
    ) -> SettingsSnapshot:
        user = self._get_user(user_id)
        pref = self._get_or_create_pref(user_id)

        pref.language = language.lower().strip()[:8] or "ko"
        pref.region = region.upper().strip()[:8] or "KR"
        pref.notify_bidding = notify_bidding
        pref.notify_settlement = notify_settlement
        pref.notify_marketing = notify_marketing
        pref.notify_support = notify_support
        self.repo.update_user_preference(pref)
        self.repo.commit()
        return SettingsSnapshot(user=user, preference=pref)

    def request_withdrawal(self, *, user_id: UUID, reason: str) -> WithdrawalRequestORM:
        user = self._get_user(user_id)
        if user.account_status == AccountStatus.SUSPENDED:
            raise AppError("이미 탈퇴 처리 중인 계정입니다.", 409, "ALREADY_SUSPENDED")
        if self.repo.has_pending_withdrawal(user_id):
            raise AppError("이미 탈퇴 요청이 접수되었습니다.", 409, "WITHDRAWAL_ALREADY_REQUESTED")
        if len(reason.strip()) < 2:
            raise AppError("탈퇴 사유를 2자 이상 입력해 주세요.", 400, "WITHDRAWAL_REASON_TOO_SHORT")

        request = self.repo.create_withdrawal_request(user_id=user_id, reason=reason)
        user.account_status = AccountStatus.SUSPENDED
        self.repo.update_user(user)
        self.repo.commit()
        return request
