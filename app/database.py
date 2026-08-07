import sqlite3
from pathlib import Path
from datetime import date, datetime, timedelta

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
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            google_sub TEXT,
            created_at TEXT NOT NULL
    );
""")

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
    cursor.execute("PRAGMA table_info(users);")
    user_columns = [column[1] for column in cursor.fetchall()]
    if "google_sub" not in user_columns:
        cursor.execute("ALTER TABLE users ADD COLUMN google_sub TEXT;")
    cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub
        ON users(google_sub)
        WHERE google_sub IS NOT NULL;
    """)
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
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            daily_goal_minutes INTEGER NOT NULL CHECK (daily_goal_minutes BETWEEN 1 AND 720),
            created_at TEXT NOT NULL
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS auth_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
    """)
    # User ownership was added after the local prototype. These columns are
    # nullable so existing historical rows remain intact as legacy data.
    for table in ("categories", "sessions", "goals"):
        cursor.execute(f"PRAGMA table_info({table});")
        table_columns = [column[1] for column in cursor.fetchall()]
        if "user_id" not in table_columns:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;")
        cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_{table}_user_id ON {table}(user_id);")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            display_name TEXT,
            age_range TEXT,
            primary_goal TEXT,
            main_difficulty TEXT,
            focus_range TEXT,
            days_per_week INTEGER,
            onboarding_completed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_preferences (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            focus_minutes INTEGER NOT NULL DEFAULT 25,
            rest_minutes INTEGER NOT NULL DEFAULT 5,
            long_rest_minutes INTEGER NOT NULL DEFAULT 15,
            sessions_before_long_rest INTEGER NOT NULL DEFAULT 4,
            auto_start_rest INTEGER NOT NULL DEFAULT 1,
            auto_start_focus INTEGER NOT NULL DEFAULT 1,
            sound_enabled INTEGER NOT NULL DEFAULT 1,
            notifications_enabled INTEGER NOT NULL DEFAULT 1,
            theme TEXT NOT NULL DEFAULT 'natural',
            locale TEXT NOT NULL DEFAULT 'pt-BR',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
    """)
    cursor.execute("PRAGMA table_info(profiles);")
    profile_columns = [column[1] for column in cursor.fetchall()]
    if "days_per_week" not in profile_columns:
        cursor.execute("ALTER TABLE profiles ADD COLUMN days_per_week INTEGER;")
    if "focus_quality" not in column_names:
        cursor.execute("""
            ALTER TABLE sessions
            ADD COLUMN focus_quality INTEGER;
        """)
    if "distraction" not in column_names:
        cursor.execute("""
            ALTER TABLE sessions
            ADD COLUMN distraction TEXT;
        """)
    if "distraction_note" not in column_names:
        cursor.execute("""
            ALTER TABLE sessions
            ADD COLUMN distraction_note TEXT;
        """)

    connection.commit()
    cursor.close()
    connection.close()

def ensure_user_settings(user_id):
    """Create default profile/preferences rows without overwriting existing data."""
    now = datetime.now().isoformat(timespec="seconds")
    connection = get_database_connection()
    cursor = connection.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO profiles (user_id, created_at, updated_at) VALUES (?, ?, ?);",
        (user_id, now, now),
    )
    cursor.execute(
        "INSERT OR IGNORE INTO user_preferences (user_id, created_at, updated_at) VALUES (?, ?, ?);",
        (user_id, now, now),
    )
    connection.commit()
    cursor.close()
    connection.close()

    # Backfill defaults for users created before profile preferences existed.
    connection = get_database_connection()
    cursor = connection.cursor()
    now = datetime.now().isoformat(timespec="seconds")
    for (existing_user_id,) in cursor.execute("SELECT id FROM users;").fetchall():
        cursor.execute("INSERT OR IGNORE INTO profiles (user_id, created_at, updated_at) VALUES (?, ?, ?);", (existing_user_id, now, now))
        cursor.execute("INSERT OR IGNORE INTO user_preferences (user_id, created_at, updated_at) VALUES (?, ?, ?);", (existing_user_id, now, now))
    connection.commit()
    cursor.close()
    connection.close()

def get_profile(user_id):
    ensure_user_settings(user_id)
    connection = get_database_connection()
    row = connection.execute(
        """SELECT user_id, display_name, age_range, primary_goal, main_difficulty,
                  focus_range, days_per_week, onboarding_completed, created_at, updated_at
           FROM profiles WHERE user_id = ?;""", (user_id,)
    ).fetchone()
    connection.close()
    if row is None:
        return None
    return {
        "user_id": row[0], "display_name": row[1], "age_range": row[2],
        "primary_goal": row[3], "main_difficulty": row[4], "focus_range": row[5],
        "days_per_week": row[6], "onboarding_completed": bool(row[7]),
        "created_at": row[8], "updated_at": row[9],
    }

def update_profile(user_id, values, complete=False):
    ensure_user_settings(user_id)
    allowed = {"display_name", "age_range", "primary_goal", "main_difficulty", "focus_range", "days_per_week"}
    values = {key: value for key, value in values.items() if key in allowed and value is not None}
    now = datetime.now().isoformat(timespec="seconds")
    connection = get_database_connection()
    cursor = connection.cursor()
    if values:
        assignments = ", ".join(f"{key} = ?" for key in values)
        cursor.execute(
            f"UPDATE profiles SET {assignments}, updated_at = ? WHERE user_id = ?;",
            (*values.values(), now, user_id),
        )
    if complete:
        cursor.execute(
            "UPDATE profiles SET onboarding_completed = 1, updated_at = ? WHERE user_id = ?;",
            (now, user_id),
        )
    connection.commit()
    cursor.close()
    connection.close()
    return get_profile(user_id)

def get_preferences(user_id):
    ensure_user_settings(user_id)
    connection = get_database_connection()
    row = connection.execute(
        """SELECT user_id, focus_minutes, rest_minutes, long_rest_minutes,
                  sessions_before_long_rest, auto_start_rest, auto_start_focus,
                  sound_enabled, notifications_enabled, theme, locale, created_at, updated_at
           FROM user_preferences WHERE user_id = ?;""", (user_id,)
    ).fetchone()
    connection.close()
    if row is None:
        return None
    keys = ["user_id", "focus_minutes", "rest_minutes", "long_rest_minutes",
            "sessions_before_long_rest", "auto_start_rest", "auto_start_focus",
            "sound_enabled", "notifications_enabled", "theme", "locale", "created_at", "updated_at"]
    result = dict(zip(keys, row))
    for key in ("auto_start_rest", "auto_start_focus", "sound_enabled", "notifications_enabled"):
        result[key] = bool(result[key])
    return result

def update_preferences(user_id, values):
    ensure_user_settings(user_id)
    allowed = {"focus_minutes", "rest_minutes", "long_rest_minutes", "sessions_before_long_rest",
               "auto_start_rest", "auto_start_focus", "sound_enabled", "notifications_enabled", "theme", "locale"}
    values = {key: value for key, value in values.items() if key in allowed and value is not None}
    if not values:
        return get_preferences(user_id)
    now = datetime.now().isoformat(timespec="seconds")
    assignments = ", ".join(f"{key} = ?" for key in values)
    connection = get_database_connection()
    connection.execute(
        f"UPDATE user_preferences SET {assignments}, updated_at = ? WHERE user_id = ?;",
        (*values.values(), now, user_id),
    )
    connection.commit()
    connection.close()
    return get_preferences(user_id)

def create_category(category_name, user_id):
    connection = get_database_connection()
    cursor = connection.cursor() 

    category_name = category_name.strip()
    try:
        cursor.execute("""
            INSERT INTO categories (name, user_id)
            VALUES (?, ?);
        """, (category_name, user_id))
        category_id = cursor.lastrowid
        connection.commit()
        return {
            "id" : category_id,
            "name" : category_name
        }
    finally:
        cursor.close()
        connection.close()

def get_categories(user_id):
    connection = get_database_connection()
    cursor = connection.cursor() 
    cursor.execute("""
    SELECT 
        id,
        name
    FROM categories
    WHERE user_id = ?
    ORDER BY name
""", (user_id,))
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

def get_sessions_by_category(category_id, user_id):
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
            c.name AS category_name,
            s.focus_quality,
            s.distraction,
            s.distraction_note
        FROM sessions AS s
        LEFT JOIN categories AS c
            ON s.category_id = c.id
        WHERE s.category_id = ? AND s.user_id = ?
        ORDER BY s.session_date DESC, s.id DESC
    """, (category_id, user_id))
    data = cursor.fetchall()
    sessions_in_category = []
    for session_id, work_time, rest_time, session_date, session_goal, session_category_id, category_name, focus_quality, distraction, distraction_note in data:
        sessions_in_category.append({
            "id": session_id,
            "work_time": work_time,
            "rest_time": rest_time,
            "session_date": session_date,
            "goal": session_goal,
            "category_id": session_category_id,
            "category_name": category_name,
            "focus_quality": focus_quality,
            "distraction": distraction,
            "distraction_note": distraction_note
        })
    cursor.close()
    connection.close()
    return sessions_in_category

def create_goal(daily_goal_minutes, user_id):
    connection = get_database_connection()
    cursor = connection.cursor()
    try:
        created_at = datetime.now().isoformat(timespec="seconds")
        cursor.execute(
            "INSERT INTO goals (daily_goal_minutes, created_at, user_id) VALUES (?, ?, ?);",
            (daily_goal_minutes, created_at, user_id),
        )
        goal_id = cursor.lastrowid
        connection.commit()
        return {
            "id": goal_id,
            "daily_goal_minutes": daily_goal_minutes,
            "created_at": created_at,
        }
    finally:
        cursor.close()
        connection.close()

def get_current_goal(user_id):
    connection = get_database_connection()
    cursor = connection.cursor()
    cursor.execute("""
        SELECT id, daily_goal_minutes, created_at
        FROM goals
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 1;
    """, (user_id,))
    row = cursor.fetchone()
    cursor.close()
    connection.close()
    if row is None:
        return None
    return {
        "id": row[0],
        "daily_goal_minutes": row[1],
        "created_at": row[2],
    }
def save_session(work_time, rest_time, session_date, goal=None, category_id=None, user_id=None):
    connection = get_database_connection()
    cursor = connection.cursor()
    try:
        if category_id is not None:
            cursor.execute("SELECT user_id FROM categories WHERE id = ?;", (category_id,))
            category_owner = cursor.fetchone()
            if category_owner is None or category_owner[0] not in (None, user_id):
                raise sqlite3.IntegrityError("Category does not belong to this user.")
        cursor.execute("""
            INSERT INTO sessions (
                work_time,
                rest_time,
                session_date,
                goal,
                category_id,
                user_id
            )
            VALUES (?, ?, ?, ?, ?, ?);
        """, (work_time, rest_time, str(session_date), goal, category_id, user_id))
        session_id = cursor.lastrowid
        connection.commit()
        return {
            "id" : session_id,
            "work_time" : work_time,
            "rest_time" : rest_time,
            "session_date" : str(session_date),
            "goal" : goal,
            "category_id" : category_id,
            "focus_quality": None,
            "distraction": None,
            "distraction_note": None
        }
    finally:
        cursor.close()
        connection.close()
   
    
def get_daily_summary(session_date, user_id):
    connection = get_database_connection()
    cursor = connection.cursor()
    cursor.execute("""
    SELECT 
    COUNT(*) AS session_count,
    COALESCE(SUM(work_time),0) AS total_work_time
    FROM sessions
    WHERE session_date = ? AND user_id = ?
""", (str(session_date), user_id))
    session_count, total_work_time = cursor.fetchone()
    summary = {
        "date": str(session_date),
        "session_count" : session_count,
        "total_work_time" : total_work_time
                }
    cursor.close()
    connection.close()
    return summary

def get_current_streak(user_id):
    connection = get_database_connection()
    cursor = connection.cursor()
    cursor.execute("""
        SELECT DISTINCT session_date
        FROM sessions
        WHERE user_id = ?
        ORDER BY session_date DESC;
    """, (user_id,))
    studied_dates = {date.fromisoformat(row[0]) for row in cursor.fetchall()}
    cursor.close()
    connection.close()

    if not studied_dates:
        return 0

    latest_date = min(max(studied_dates), date.today())
    if latest_date < date.today() - timedelta(days=1):
        return 0

    streak = 0
    current_date = latest_date
    while current_date in studied_dates:
        streak += 1
        current_date -= timedelta(days=1)
    return streak
       
            
    
# Next step: search for records matching the month and year provided by the user.
def get_monthly_summary(month_year, user_id):
    connection = get_database_connection()
    cursor = connection.cursor()
    cursor.execute("""
    SELECT 
    session_date,
    COUNT(*) AS session_count,
    COALESCE(SUM(work_time),0) AS total_work_time
    FROM sessions
    WHERE session_date LIKE ? AND user_id = ?
    GROUP BY session_date
    ORDER BY session_date
        """,(str(month_year) + "%", user_id))
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

def get_sessions_by_date(session_date, user_id):
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
        c.name AS category_name,
        s.focus_quality,
        s.distraction,
        s.distraction_note
    FROM sessions AS s
    LEFT JOIN categories AS c
        ON s.category_id = c.id
    WHERE s.session_date = ? AND s.user_id = ?
    ORDER BY s.id
""", (str(session_date), user_id))
    data = cursor.fetchall()
    sessions_in_this_date = []
    for session_id, work_time, rest_time, session_date_value, session_goal, category_id, category_name, focus_quality, distraction, distraction_note in data:
        sessions_in_this_date.append({
            "id" : session_id,
            "work_time" : work_time,
            "rest_time" : rest_time,
            "session_date" : session_date_value,
            "goal" : session_goal,
            "category_id" : category_id,
            "category_name" : category_name,
            "focus_quality": focus_quality,
            "distraction": distraction,
            "distraction_note": distraction_note
        })
    cursor.close()
    connection.close()
    return sessions_in_this_date

def get_recent_sessions(limit=20, user_id=None):
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
        c.name AS category_name,
        s.focus_quality,
        s.distraction,
        s.distraction_note
    FROM sessions AS s
    LEFT JOIN categories AS c
        ON s.category_id = c.id
    WHERE s.user_id = ?
    ORDER BY s.session_date DESC, s.id DESC
    LIMIT ?;
""", (user_id, limit))
    recent_sessions = []
    data = cursor.fetchall()
    for session_id, work_time, rest_time, session_date, session_goal, category_id, category_name, focus_quality, distraction, distraction_note in data:
        recent_sessions.append({
            "id" : session_id,
            "work_time" : work_time,
            "rest_time" : rest_time,
            "session_date" : session_date,
            "goal" : session_goal,
            "category_id" : category_id,
            "category_name" : category_name,
            "focus_quality": focus_quality,
            "distraction": distraction,
            "distraction_note": distraction_note
        })
    cursor.close()
    connection.close()
    return recent_sessions

def update_session_reflection(
    session_id,
    focus_quality,
    distraction=None,
    distraction_note=None,
    user_id=None,
):
    connection = get_database_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("""
            UPDATE sessions
            SET focus_quality = ?,
                distraction = ?,
                distraction_note = ?
            WHERE id = ? AND user_id = ?
        """, (focus_quality, distraction, distraction_note, session_id, user_id))

        if cursor.rowcount == 0:
            return None

        connection.commit()
        cursor.execute("""
            SELECT
                s.id,
                s.work_time,
                s.rest_time,
                s.session_date,
                s.goal,
                s.category_id,
                c.name AS category_name,
                s.focus_quality,
                s.distraction,
                s.distraction_note
            FROM sessions AS s
            LEFT JOIN categories AS c
                ON s.category_id = c.id
            WHERE s.id = ? AND s.user_id = ?
        """, (session_id, user_id))
        row = cursor.fetchone()
        return {
            "id": row[0],
            "work_time": row[1],
            "rest_time": row[2],
            "session_date": row[3],
            "goal": row[4],
            "category_id": row[5],
            "category_name": row[6],
            "focus_quality": row[7],
            "distraction": row[8],
            "distraction_note": row[9]
        }
    finally:
        cursor.close()
        connection.close()

def get_weekly_summary(start_date:date, user_id):
    end_date = start_date + timedelta(days=6)
    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            session_date,
            COUNT(*) AS session_count,
            COALESCE(SUM(work_time), 0) AS total_work_time
        FROM sessions
        WHERE session_date BETWEEN ? AND ? AND user_id = ?
        GROUP BY session_date
        ORDER BY session_date
    """, (str(start_date), str(end_date), user_id))
    data = cursor.fetchall()
    weekly_data = []

    for session_date, session_count, total_work_time in data:
        weekly_data.append({
            "date": session_date,
            "session_count": session_count,
            "total_work_time": total_work_time
        })
    cursor.close()
    connection.close()

    return weekly_data
