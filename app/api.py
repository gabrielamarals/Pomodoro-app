import os
import secrets
from contextlib import asynccontextmanager
from urllib.parse import urlencode
from datetime import date
from uuid import UUID
import httpx
from fastapi import FastAPI, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
import uvicorn
from dotenv import load_dotenv
from fastapi.responses import RedirectResponse
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

load_dotenv()
from app.auth import (
    authenticate_user,
    create_auth_session,
    create_or_link_google_user,
    create_user,
    get_user_by_session_token,
    revoke_auth_session,
)
from app.database import (
    get_daily_summary,
    get_current_streak,
    get_monthly_summary,
    get_recent_sessions,
    get_sessions_by_date,
    save_session,
    create_category,
    get_categories,
    get_sessions_by_category,
    get_weekly_summary,
    update_session_reflection,
    create_goal,
    get_current_goal,
    initialize_database,
    get_profile,
    update_profile,
    get_preferences,
    update_preferences,
    ensure_user_settings,
)
from app.db import database_is_available
from app.errors import CategoryAccessError, DuplicateCategoryError

class UserCreate(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=8, max_length=128)

class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)

class GoalCreate(BaseModel):
    daily_goal_minutes: int = Field(ge=1, le=720)

class SessionCreate(BaseModel):
    work_time: int = Field(ge=1, le=120)
    rest_time: int = Field(ge=1, le=60)
    session_date: date
    goal: str | None = Field(default=None, max_length=160)
    category_id: int | None = Field(default=None, ge=1)
    client_session_id: UUID | None = None

class SessionReflectionUpdate(BaseModel):
    focus_quality: int = Field(ge=0, le=5)
    distraction: Literal[
        "noise",
        "tiredness",
        "phone",
        "anxiety",
        "difficulty",
        "interruption",
        "none",
        "other"
    ] | None = None
    distraction_note: str | None = Field(default=None, max_length=160)

class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=40)
    age_range: Literal["under_18", "18_24", "25_34", "35_44", "45_plus", "prefer_not_to_say"] | None = None
    primary_goal: Literal["school", "exam", "programming", "work", "reading", "languages", "other"] | None = None
    main_difficulty: Literal["starting", "concentration", "phone", "procrastination", "organization", "tiredness", "consistency", "other"] | None = None
    focus_range: Literal["under_15", "15_25", "25_45", "45_60", "over_60"] | None = None
    days_per_week: int | None = Field(default=None, ge=1, le=7)

class OnboardingComplete(ProfileUpdate):
    focus_minutes: int = Field(ge=1, le=120)
    rest_minutes: int = Field(ge=1, le=60)

class PreferencesUpdate(BaseModel):
    focus_minutes: int | None = Field(default=None, ge=1, le=120)
    rest_minutes: int | None = Field(default=None, ge=1, le=60)
    long_rest_minutes: int | None = Field(default=None, ge=1, le=120)
    sessions_before_long_rest: int | None = Field(default=None, ge=1, le=12)
    auto_start_rest: bool | None = None
    auto_start_focus: bool | None = None
    sound_enabled: bool | None = None
    notifications_enabled: bool | None = None
    theme: Literal["natural", "ember", "ocean", "system"] | None = None
    locale: Literal["pt-BR", "en"] | None = None

@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="Foco API", version="0.2.0", lifespan=lifespan)

default_frontend_origins = "http://localhost:3000,http://127.0.0.1:3000"
frontend_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", default_frontend_origins).split(",")
    if origin.strip()
]

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "http://localhost:8000/auth/google/callback",
)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax").lower()
if COOKIE_SAMESITE not in {"lax", "strict", "none"}:
    raise RuntimeError("COOKIE_SAMESITE must be lax, strict, or none.")


def set_session_cookie(response: Response, session_token: str) -> None:
    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=30 * 24 * 60 * 60,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/",
    )


def frontend_login_error(reason: str) -> RedirectResponse:
    return RedirectResponse(
        f"{FRONTEND_URL.rstrip('/')}/login?oauth_error={reason}",
        status_code=status.HTTP_303_SEE_OTHER,
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/health")
def health_check():
    if not database_is_available():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable.")
    return {"status": "ok", "database": "connected"}

@app.get("/goals/current")
def read_current_goal(request: Request):
    user = require_authenticated_user(request)
    return get_current_goal(user["id"])

@app.post("/goals", status_code=status.HTTP_201_CREATED)
def create_study_goal(goal: GoalCreate, request: Request):
    user = require_authenticated_user(request)
    return create_goal(daily_goal_minutes=goal.daily_goal_minutes, user_id=user["id"])

@app.get("/sessions/daily")
def read_daily_summary(date: date, request: Request):
    user = require_authenticated_user(request)
    return get_daily_summary(date, user["id"])

@app.get("/sessions/streak")
def read_current_streak(request: Request):
    user = require_authenticated_user(request)
    return {"current_streak": get_current_streak(user["id"])}

@app.get("/sessions/monthly")
def read_monthly_summary(request: Request, month: str = Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")):
    user = require_authenticated_user(request)
    return get_monthly_summary(month_year=month, user_id=user["id"])

@app.get("/sessions/recent")
def read_recent_sessions(request: Request, limit: int = Query(default=20, ge=1, le=100)):
    user = require_authenticated_user(request)
    return get_recent_sessions(limit=limit, user_id=user["id"])

@app.get("/sessions/by-date")
def read_session_by_date(date: date, request: Request):
    user = require_authenticated_user(request)
    return get_sessions_by_date(session_date=date, user_id=user["id"])

@app.post("/sessions", status_code=status.HTTP_201_CREATED)
def create_session(session: SessionCreate, request: Request):
    user = require_authenticated_user(request)
    try:
        return save_session(
            work_time=session.work_time,
            rest_time=session.rest_time,
            session_date=session.session_date,
            goal=session.goal,
            category_id=session.category_id,
            client_session_id=(
                str(session.client_session_id) if session.client_session_id else None
            ),
            user_id=user["id"]
        )
    except CategoryAccessError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Category does not exist."
        )

@app.patch("/sessions/{session_id}/reflection")
def update_reflection(session_id: int, reflection: SessionReflectionUpdate, request: Request):
    user = require_authenticated_user(request)
    updated_session = update_session_reflection(
        session_id=session_id,
        focus_quality=reflection.focus_quality,
        distraction=reflection.distraction,
        distraction_note=reflection.distraction_note,
        user_id=user["id"]
    )

    if updated_session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found."
        )
    return updated_session

#category part
@app.get("/categories")
def read_categories(request: Request):
    user = require_authenticated_user(request)
    return get_categories(user["id"])

@app.post("/categories", status_code=status.HTTP_201_CREATED)
def add_category(category: CategoryCreate, request: Request):
    user = require_authenticated_user(request)
    try:
        return create_category(category_name=category.name, user_id=user["id"])
    except DuplicateCategoryError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category already exists."
        )

@app.get("/categories/{category_id}/sessions")
def read_sessions_by_category(category_id: int, request: Request):
    user = require_authenticated_user(request)
    return get_sessions_by_category(category_id=category_id, user_id=user["id"])

@app.get("/sessions/weekly")
def read_weekly_summary(start_date: date, request: Request):
    user = require_authenticated_user(request)
    return get_weekly_summary(start_date=start_date, user_id=user["id"])

#User part

@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate):
    try:
        return create_user(
            email=user.email,
            password=user.password,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )

@app.post("/auth/login")
def login_user(credentials: UserLogin, response: Response):
    user = authenticate_user(
        email=credentials.email,
        password=credentials.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    session_token = create_auth_session(user["id"])
    set_session_cookie(response, session_token)
    return user

@app.get("/auth/me")
def read_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    user = get_user_by_session_token(session_token) if session_token else None

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    return user

def require_authenticated_user(request: Request):
    session_token = request.cookies.get("session_token")
    user = get_user_by_session_token(session_token) if session_token else None
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    ensure_user_settings(user["id"])
    return user

@app.get("/me")
def read_account(request: Request):
    user = require_authenticated_user(request)
    return {
        "user": {"id": user["id"], "email": user["email"], "created_at": user["created_at"]},
        "profile": get_profile(user["id"]),
        "preferences": get_preferences(user["id"]),
    }

@app.get("/me/profile")
def read_profile(request: Request):
    user = require_authenticated_user(request)
    return get_profile(user["id"])

@app.patch("/me/profile")
def edit_profile(profile: ProfileUpdate, request: Request):
    user = require_authenticated_user(request)
    return update_profile(user["id"], profile.model_dump(exclude_none=True))

@app.post("/me/onboarding/complete")
def complete_onboarding(profile: OnboardingComplete, request: Request):
    user = require_authenticated_user(request)
    profile_data = profile.model_dump(exclude={"focus_minutes", "rest_minutes"}, exclude_none=True)
    update_profile(user["id"], profile_data, complete=True)
    preferences = update_preferences(user["id"], {
        "focus_minutes": profile.focus_minutes,
        "rest_minutes": profile.rest_minutes,
    })
    return {"profile": get_profile(user["id"]), "preferences": preferences}

@app.get("/me/preferences")
def read_preferences(request: Request):
    user = require_authenticated_user(request)
    return get_preferences(user["id"])

@app.patch("/me/preferences")
def edit_preferences(preferences: PreferencesUpdate, request: Request):
    user = require_authenticated_user(request)
    return update_preferences(user["id"], preferences.model_dump(exclude_none=True))

@app.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_user(request: Request, response: Response):
    revoke_auth_session(request.cookies.get("session_token"))
    response.delete_cookie(
        "session_token", path="/", secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE,
    )

@app.get("/auth/google/login")
def google_login():
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google login is not configured yet.",
        )

    state = secrets.token_urlsafe(32)
    authorization_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    })
    response = RedirectResponse(authorization_url, status_code=status.HTTP_303_SEE_OTHER)
    response.set_cookie(
        "google_oauth_state", state, httponly=True, secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE, max_age=600, path="/",
    )
    return response

@app.get("/auth/google/callback")
def google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google login is not configured yet.")

    if error:
        return frontend_login_error("cancelled")

    saved_state = request.cookies.get("google_oauth_state")
    if not state or not saved_state or not secrets.compare_digest(state, saved_state):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state.")
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google authorization code is missing.")

    with httpx.Client(timeout=10) as client:
        token_response = client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
    if not token_response.is_success:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Google token exchange failed.")

    google_tokens = token_response.json()
    try:
        claims = id_token.verify_oauth2_token(
            google_tokens["id_token"],
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Google identity verification failed.") from error

    email = claims.get("email")
    google_sub = claims.get("sub")
    if not email or not google_sub:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Google did not return a usable identity.")

    try:
        user = create_or_link_google_user(email=email, google_sub=google_sub)
    except ValueError:
        return frontend_login_error("account_conflict")
    session_token = create_auth_session(user["id"])
    response = RedirectResponse(FRONTEND_URL, status_code=status.HTTP_303_SEE_OTHER)
    set_session_cookie(response, session_token)
    response.delete_cookie(
        "google_oauth_state", path="/", secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE,
    )
    return response


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
