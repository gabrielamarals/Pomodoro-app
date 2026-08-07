from pwdlib import PasswordHash
import sqlite3
from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from .database import get_database_connection, ensure_user_settings

password_hasher = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hasher.hash(password)

def verify_password(password:str, password_hash:str ) -> bool:
    return password_hasher.verify(password, password_hash)

def create_user(email: str, password: str):
    normalized_email = email.strip().lower()

    if not normalized_email:
        raise ValueError("Email cannot be empty.")

    if len(password) < 8:
        raise ValueError("Password must contain at least 8 characters.")

    password_hash = hash_password(password)
    created_at = datetime.now().isoformat(timespec="seconds")

    connection = get_database_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO users (email, password_hash, created_at)
            VALUES (?, ?, ?);
            """,
            (normalized_email, password_hash, created_at),
        )

        user_id = cursor.lastrowid
        connection.commit()

    except sqlite3.IntegrityError:
        raise ValueError("Email is already registered.")

    finally:
        cursor.close()
        connection.close()

    ensure_user_settings(user_id)
    return {
        "id": user_id,
        "email": normalized_email,
        "created_at": created_at,
    }

def get_user_by_email(email: str):
    normalized_email = email.strip().lower()

    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT id, email, password_hash, created_at
        FROM users
        WHERE email = ?;
        """,
        (normalized_email,),
    )

    row = cursor.fetchone()

    cursor.close()
    connection.close()

    if row is None:
        return None

    return {
        "id": row[0],
        "email": row[1],
        "password_hash": row[2],
        "created_at": row[3],
    }

def authenticate_user(email: str, password: str):
    user = get_user_by_email(email)

    if user is None:
        return None

    if user["password_hash"].startswith("!google-only!"):
        return None

    password_is_valid = verify_password(
        password,
        user["password_hash"],
    )

    if not password_is_valid:
        return None

    return {
        "id": user["id"],
        "email": user["email"],
        "created_at": user["created_at"],
    }

def create_auth_session(user_id: int, duration_days: int = 30):
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=duration_days)

    connection = get_database_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO auth_sessions (user_id, token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?);
            """,
            (user_id, token_hash, expires_at.isoformat(), now.isoformat()),
        )
        connection.commit()
        return raw_token
    finally:
        cursor.close()
        connection.close()

def get_user_by_session_token(raw_token: str):
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc).isoformat()

    connection = get_database_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        SELECT u.id, u.email, u.created_at
        FROM auth_sessions AS auth_session
        JOIN users AS u ON u.id = auth_session.user_id
        WHERE auth_session.token_hash = ?
          AND auth_session.expires_at > ?;
        """,
        (token_hash, now),
    )
    row = cursor.fetchone()
    cursor.close()
    connection.close()

    if row is None:
        return None

    return {"id": row[0], "email": row[1], "created_at": row[2]}

def create_or_link_google_user(email: str, google_sub: str):
    normalized_email = email.strip().lower()
    connection = get_database_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT id, email, created_at FROM users WHERE email = ?;", (normalized_email,))
        existing_user = cursor.fetchone()
        if existing_user:
            cursor.execute(
                "UPDATE users SET google_sub = ? WHERE id = ?;",
                (google_sub, existing_user[0]),
            )
            connection.commit()
            ensure_user_settings(existing_user[0])
            return {"id": existing_user[0], "email": existing_user[1], "created_at": existing_user[2]}

        created_at = datetime.now().isoformat(timespec="seconds")
        cursor.execute(
            """
            INSERT INTO users (email, password_hash, google_sub, created_at)
            VALUES (?, ?, ?, ?);
            """,
            (normalized_email, "!google-only!", google_sub, created_at),
        )
        user_id = cursor.lastrowid
        connection.commit()
        ensure_user_settings(user_id)
        return {"id": user_id, "email": normalized_email, "created_at": created_at}
    finally:
        cursor.close()
        connection.close()
