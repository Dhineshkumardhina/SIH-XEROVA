import bcrypt
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Any
from jose import jwt, JWTError
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a bcrypt hash (72-byte safe truncated UTF-8)."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))
    except Exception:
        return False

def hash_password(password: str) -> str:
    """Hashes a password with native bcrypt salt."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

# Alias for backward compatibility
get_password_hash = hash_password

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validates that a password satisfies minimum security requirements."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    return True, ""

def create_access_token(
    subject: str | Any,
    email: str = "",
    roles: Optional[list[str]] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Creates a signed JWT access token containing only safe claims:
    - sub (user id)
    - email
    - roles
    - type ("access")
    - iat, exp
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(subject),
        "email": email,
        "roles": roles or [],
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT token."""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None

def generate_refresh_token() -> tuple[str, str, datetime]:
    """
    Generates a secure random opaque refresh token and its SHA-256 hash.
    Returns (raw_token, token_hash, expires_at).
    Raw token is returned to client, token_hash is stored in database.
    """
    raw_token = secrets.token_urlsafe(48)
    token_hash = hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return raw_token, token_hash, expires_at

def hash_token(raw_token: str) -> str:
    """Computes SHA-256 hex digest of a token."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

def verify_refresh_token(raw_token: str, stored_hash: str) -> bool:
    """Verifies a raw refresh token matches its stored SHA-256 hash."""
    return secrets.compare_digest(hash_token(raw_token), stored_hash)
