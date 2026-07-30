from datetime import date
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from database import (
    get_daily_summary,
    get_monthly_summary,
    get_recent_sessions,
    get_sessions_by_date,
    save_session
)

class SessionCreate(BaseModel):
    work_time: int = Field(ge=1, le=120)
    rest_time: int = Field(ge=1, le=60)
    session_date: date
    goal: str | None = Field(default=None, max_length=160)
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
    created_session = save_session(
        work_time=session.work_time,
        rest_time=session.rest_time,
        session_date=session.session_date,
        goal=session.goal
    )

    return created_session

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000
    )


