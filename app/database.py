import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "pomodoro.db"

def get_database_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.execute("PRAGMA foreign_keys = ON;")
    return connection

def initialize_database():
    
    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE
    );
""")


    cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                work_time INTEGER NOT NULL,
                rest_time INTEGER NOT NULL,
                session_date TEXT NOT NULL,
                goal TEXT,
                category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
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
    if "category_id" not in column_names:
            cursor.execute("""
            ALTER TABLE sessions
            ADD COLUMN category_id INTEGER
            REFERENCES categories(id)
            ON DELETE SET NULL;
        """)

    connection.commit()
    cursor.close()
    connection.close()

def create_category(category_name):
    connection = get_database_connection()
    cursor = connection.cursor() 

    category_name = category_name.strip()
    try:
        cursor.execute("""
            INSERT INTO categories (
                name
            )
            VALUES (?);
        """, (category_name,))
        category_id = cursor.lastrowid
        connection.commit()
        return {
            "id" : category_id,
            "name" : category_name
        }
    finally:
        cursor.close()
        connection.close()

def get_categories():
    connection = get_database_connection()
    cursor = connection.cursor() 
    cursor.execute("""
    SELECT 
        id,
        name
    FROM categories
    ORDER BY name
""")
    data = cursor.fetchall()
    categories = []
    for category_id, category_name in data:
        categories.append({
            "id" : category_id,
            "name" : category_name
        })
    cursor.close()
    connection.close()
    return categories 




def save_session(work_time, rest_time, session_date, goal=None, category_id=None):
    connection = get_database_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("""
            INSERT INTO sessions (
                work_time,
                rest_time,
                session_date,
                goal,
                category_id
            )
            VALUES (?, ?, ?, ?, ?);
        """, (work_time, rest_time, str(session_date), goal, category_id))
        session_id = cursor.lastrowid
        connection.commit()
        return {
            "id" : session_id,
            "work_time" : work_time,
            "rest_time" : rest_time,
            "session_date" : str(session_date),
            "goal" : goal,
            "category_id" : category_id
        }
    finally:
        cursor.close()
        connection.close()
   
    
def get_daily_summary(session_date):
    connection = get_database_connection()
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
    connection = get_database_connection()
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
    connection = get_database_connection()
    cursor = connection.cursor()
    cursor.execute("""
    SELECT 
        s.id,
        s.work_time,
        s.rest_time,
        s.session_date,
        s.goal,
        s.category_id,
        c.name AS category_name
    FROM sessions AS s
    LEFT JOIN categories AS c
        ON s.category_id = c.id
    WHERE session_date = ?
    ORDER BY s.id
""", (str(session_date),))
    data = cursor.fetchall()
    sessions_in_this_date = []
    for session_id, work_time, rest_time, session_date_value, session_goal, category_id, category_name in data:
        sessions_in_this_date.append({
            "id" : session_id,
            "work_time" : work_time,
            "rest_time" : rest_time,
            "session_date" : session_date_value,
            "goal" : session_goal,
            "category_id" : category_id,
            "category_name" : category_name
        })
    cursor.close()
    connection.close()
    return sessions_in_this_date

def get_recent_sessions(limit=20):
    connection = get_database_connection()
    cursor = connection.cursor()
    cursor.execute("""
    SELECT
        s.id,
        s.work_time,
        s.rest_time,
        s.session_date,
        s.goal,
        s.category_id,
        c.name AS category_name
    FROM sessions AS s
    LEFT JOIN categories AS c
        ON s.category_id = c.id
    ORDER BY s.session_date DESC, s.id DESC
    LIMIT ?;
""", (limit,))
    recent_sessions = []
    data = cursor.fetchall()
    for session_id, work_time, rest_time, session_date, session_goal, category_id, category_name  in data:
        recent_sessions.append({
            "id" : session_id,
            "work_time" : work_time,
            "rest_time" : rest_time,
            "session_date" : session_date,
            "goal" : session_goal,
            "category_id" : category_id,
            "category_name" : category_name
        })
    cursor.close()
    connection.close()
    return recent_sessions

