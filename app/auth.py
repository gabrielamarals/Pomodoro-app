from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from pwdlib import PasswordHash
from sqlalchemy import delete, insert, select, update
from sqlalchemy.exc import IntegrityError

from .database import ensure_user_settings
from .db import engine
from .schema import auth_sessions, users


password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_hasher.verify(password, password_hash)


def create_user(email: str, password: str):
    normalized_email = email.strip().lower()
    if not normalized_email:
        raise ValueError("Email cannot be empty.")
    if len(password) < 8:
        raise ValueError("Password must contain at least 8 characters.")

    created_at = datetime.now().isoformat(timespec="seconds")
    try:
        with engine.begin() as connection:
            result = connection.execute(insert(users).values(
                email=normalized_email,
                password_hash=hash_password(password),
                created_at=created_at,
            ))
            user_id = result.inserted_primary_key[0]
    except IntegrityError as error:
        raise ValueError("Email is already registered.") from error

    ensure_user_settings(user_id)
    return {"id": user_id, "email": normalized_email, "created_at": created_at}


def get_user_by_email(email: str):
    normalized_email = email.strip().lower()
    with engine.connect() as connection:
        row = connection.execute(
            select(users.c.id, users.c.email, users.c.password_hash, users.c.created_at)
            .where(users.c.email == normalized_email)
        ).mappings().first()
    return dict(row) if row else None


def authenticate_user(email: str, password: str):
    user = get_user_by_email(email)
    if user is None or user["password_hash"].startswith("!google-only!"):
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return {key: user[key] for key in ("id", "email", "created_at")}


def create_auth_session(user_id: int, duration_days: int = 30):
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)
    with engine.begin() as connection:
        connection.execute(insert(auth_sessions).values(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=(now + timedelta(days=duration_days)).isoformat(),
            created_at=now.isoformat(),
        ))
    return raw_token


def get_user_by_session_token(raw_token: str):
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc).isoformat()
    with engine.connect() as connection:
        row = connection.execute(select(
            users.c.id, users.c.email, users.c.created_at,
        ).select_from(
            auth_sessions.join(users, users.c.id == auth_sessions.c.user_id)
        ).where(
            auth_sessions.c.token_hash == token_hash,
            auth_sessions.c.expires_at > now,
        )).mappings().first()
    return dict(row) if row else None


def revoke_auth_session(raw_token: str | None) -> None:
    if not raw_token:
        return
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    with engine.begin() as connection:
        connection.execute(delete(auth_sessions).where(auth_sessions.c.token_hash == token_hash))


def create_or_link_google_user(email: str, google_sub: str):
    normalized_email = email.strip().lower()
    with engine.begin() as connection:
        existing = connection.execute(
            select(users.c.id, users.c.email, users.c.created_at)
            .where(users.c.email == normalized_email)
        ).mappings().first()
        if existing:
            connection.execute(
                update(users).where(users.c.id == existing["id"]).values(google_sub=google_sub)
            )
            user = dict(existing)
        else:
            created_at = datetime.now().isoformat(timespec="seconds")
            try:
                result = connection.execute(insert(users).values(
                    email=normalized_email,
                    password_hash="!google-only!",
                    google_sub=google_sub,
                    created_at=created_at,
                ))
            except IntegrityError as error:
                raise ValueError("This Google account is already linked to another user.") from error
            user = {"id": result.inserted_primary_key[0], "email": normalized_email, "created_at": created_at}
    ensure_user_settings(user["id"])
    return user
