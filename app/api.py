import sqlite3
from datetime import date
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
import uvicorn

from database import (
    get_daily_summary,
    get_monthly_summary,
    get_recent_sessions,
    get_sessions_by_date,
    save_session,
    create_category,
    get_categories,
    get_sessions_by_category,
    get_weekly_summary,
    update_session_reflection,
    initialize_database
)

class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)

class SessionCreate(BaseModel):
    work_time: int = Field(ge=1, le=120)
    rest_time: int = Field(ge=1, le=60)
    session_date: date
    goal: str | None = Field(default=None, max_length=160)
    category_id: int | None = Field(default=None, ge=1)

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

initialize_database()

app = FastAPI()

frontend_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }
@app.get("/sessions/daily")
def read_daily_summary(date: str):
    return get_daily_summary(date)

@app.get("/sessions/monthly")
def read_monthly_summary(month:str):
    return get_monthly_summary(month_year=month)

@app.get("/sessions/recent")
def read_recent_sessions(limit: int = 20):
    return get_recent_sessions(limit=limit)

@app.get("/sessions/by-date")
def read_session_by_date(date:str):
    return get_sessions_by_date(session_date=date)

@app.post("/sessions", status_code=status.HTTP_201_CREATED)
def create_session(session: SessionCreate):
    try:
        return save_session(
            work_time=session.work_time,
            rest_time=session.rest_time,
            session_date=session.session_date,
            goal=session.goal,
            category_id=session.category_id
        )
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Category does not exist."
        )

@app.patch("/sessions/{session_id}/reflection")
def update_reflection(session_id: int, reflection: SessionReflectionUpdate):
    updated_session = update_session_reflection(
        session_id=session_id,
        focus_quality=reflection.focus_quality,
        distraction=reflection.distraction,
        distraction_note=reflection.distraction_note
    )

    if updated_session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found."
        )
    return updated_session

#category part
@app.get("/categories")
def read_categories():
    return get_categories()

@app.post("/categories", status_code=status.HTTP_201_CREATED)
def add_category(category: CategoryCreate):
    try:
        return create_category(category_name=category.name)
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category already exists."
        )

@app.get("/categories/{category_id}/sessions")
def read_sessions_by_category(category_id: int):
    return get_sessions_by_category(category_id=category_id)

@app.get("/sessions/weekly")
def read_weekly_summary(start_date: date):
    return get_weekly_summary(start_date=start_date)

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000
    )


