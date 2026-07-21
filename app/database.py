import sqlite3


def save_session(work_time, rest_time, session_date):
    connection = sqlite3.connect("pomodoro.db")
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            work_time INTEGER NOT NULL,
            rest_time INTEGER NOT NULL,
            session_date TEXT NOT NULL
        );
    """)

    cursor.execute("""
        INSERT INTO sessions (
            work_time,
            rest_time,
            session_date
        )
        VALUES (?, ?, ?);
    """, (work_time, rest_time, str(session_date)))

    connection.commit()
    connection.close()