from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from contexts.identity.domain.enums import UserRole
from shared.infrastructure.security import parse_jwt

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class AuthContext:
    user_id: UUID
    role: UserRole


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthContext:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="인증 토큰이 필요합니다.")

    try:
        payload = parse_jwt(credentials.credentials)
        user_id = UUID(payload["sub"])
        role = UserRole(payload["role"])
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 토큰입니다.") from exc

    return AuthContext(user_id=user_id, role=role)


def require_roles(*allowed: UserRole):
    def _dep(auth: AuthContext = Depends(get_current_user)) -> AuthContext:
        if auth.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="권한이 없습니다.")
        return auth

    return _dep


def get_auth_context(auth: AuthContext) -> AuthContext:
    return auth
