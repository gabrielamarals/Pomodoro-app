import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "pomodoro.db"

def initialize_database():
    
    connection = sqlite3.connect(DATABASE_PATH)
    cursor = connection.cursor()

    cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                work_time INTEGER NOT NULL,
                rest_time INTEGER NOT NULL,
                session_date TEXT NOT NULL,
                goal TEXT
            );
        """)
    cursor.execute("PRAGMA table_info(sessions);")
    columns = cursor.fetchall()
    column_names = [column[1] for column in columns]
    if "goal" not in column_names:
        cursor.execute("""
            ALTER TABLE sessions
            ADD COLUMN goal TEXT;
        """)

    connection.commit()
    cursor.close()
    connection.close()
    


def save_session(work_time, rest_time, session_date, goal=None):
    connection = sqlite3.connect(DATABASE_PATH)
    cursor = connection.cursor()
    
    cursor.execute("""
        INSERT INTO sessions (
            work_time,
            rest_time,
            session_date,
            goal
        )
        VALUES (?, ?, ?,?);
    """, (work_time, rest_time, str(session_date), goal))
    session_id = cursor.lastrowid
    connection.commit()
    connection.close()
    return{
        "id" : session_id,
        "work_time" : work_time,
        "rest_time" : rest_time,
        "session_date" : str(session_date),
        "goal" : goal
    }
   
    
def get_daily_summary(session_date):
    connection = sqlite3.connect(DATABASE_PATH)
    cursor = connection.cursor()
    cursor.execute("""
    SELECT 
    COUNT(*) AS session_count,
    COALESCE(SUM(work_time),0) AS total_work_time
    FROM sessions
    WHERE session_date = ?
""", (str(session_date),))
    session_count, total_work_time = cursor.fetchone()
    summary = {
        "date": str(session_date),
        "session_count" : session_count,
        "total_work_time" : total_work_time
                }
    cursor.close()
    connection.close()
    return summary
       
            
    
# Next step: search for records matching the month and year provided by the user.
def get_monthly_summary(month_year):
    connection = sqlite3.connect(DATABASE_PATH)
    cursor = connection.cursor()
    cursor.execute("""
    SELECT 
    session_date,
    COUNT(*) AS session_count,
    COALESCE(SUM(work_time),0) AS total_work_time
    FROM sessions
    WHERE session_date LIKE ?
    GROUP BY session_date
    ORDER BY session_date
        """,(str(month_year) + "%",))
    monthly_summary = []
    data = cursor.fetchall()
    for session_date, session_count, total_work_time in data:
        monthly_summary.append({
            "date" : session_date,
            "session_count" : session_count,
            "total_work_time" : total_work_time 
        })
    cursor.close()
    connection.close()
    return monthly_summary

def get_sessions_by_date(session_date):
    connection = sqlite3.connect(DATABASE_PATH)
    cursor = connection.cursor()
    cursor.execute("""
    SELECT 
        id,
        work_time,
        rest_time,
        session_date,
        goal
    FROM sessions
    WHERE session_date = ?
    ORDER BY id
""", (str(session_date),))
    data = cursor.fetchall()
    sessions_in_this_date = []
    for session_id, work_time, rest_time, session_date_value, session_goal in data:
        sessions_in_this_date.append({
            "id" : session_id,
            "work_time" : work_time,
            "rest_time" : rest_time,
            "session_date" : session_date_value,
            "goal" : session_goal   
        })
    cursor.close()
    connection.close()
    return sessions_in_this_date

def get_recent_sessions(limit=20):
    connection = sqlite3.connect(DATABASE_PATH)
    cursor = connection.cursor()
    cursor.execute("""
    SELECT
        id,
        work_time,
        rest_time,
        session_date,
        goal
    FROM sessions
    ORDER BY session_date DESC, id DESC
    LIMIT ?
""",(limit,))
    recent_sessions = []
    data = cursor.fetchall()
    for session_id, work_time, rest_time, session_date, session_goal in data:
        recent_sessions.append({
            "id" : session_id,
            "work_time" : work_time,
            "rest_time" : rest_time,
            "session_date" : session_date,
            "goal" : session_goal
        })
    cursor.close()
    connection.close()
    return recent_sessions

