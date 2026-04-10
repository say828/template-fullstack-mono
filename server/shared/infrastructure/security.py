import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import bcrypt
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError

from config import get_settings

# bcrypt backend incompatibility on Python 3.13 can break startup,
# so use pbkdf2_sha256 as primary hash and keep bcrypt verify fallback.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
settings = get_settings()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except UnknownHashError:
        # Legacy bcrypt hashes($2a/$2b/$2y) fallback.
        if hashed_password.startswith("$2"):
            try:
                return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
            except Exception:
                return False
        return False


def create_access_token(user_id: UUID, role: str) -> str:
    now = datetime.now(timezone.utc)
    expire_at = now + timedelta(minutes=settings.access_token_ttl_minutes)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire_at.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def generate_plain_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def parse_jwt(token: str) -> dict:
    try:
        return decode_access_token(token)
    except JWTError as exc:
        raise ValueError("invalid token") from exc
