import sqlite3


def save_session(work_time, rest_time,count_session, session_date):
    connection = sqlite3.connect("pomodoro.db")
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            work_time INTEGER NOT NULL,
            rest_time INTEGER NOT NULL,
            count_session INTEGER NOT NULL,
            session_date TEXT NOT NULL
        );
    """)

    cursor.execute("""
        INSERT INTO sessions (
            work_time,
            rest_time,
            count_session,
            session_date
        )
        VALUES (?, ?, ?, ?);
    """, (work_time, rest_time, count_session, str(session_date)))

    connection.commit()
    connection.close()
    
def show_session_on_day(session_date):
    connection = sqlite3.connect("pomodoro.db")
    cursor = connection.cursor()
    cursor.execute("""
    SELECT work_time, rest_time
    FROM sessions
    WHERE session_date = ?
""", (str(session_date),))
    dados = cursor.fetchall()
    total_worktime = 0
    if not dados:
        print("Você não estudou nessa data")
    
    else:
        for work_time, rest_time in dados:
            total_worktime += work_time
        print(f"Tempo estudado: {total_worktime}")
           
            
    cursor.close()
    connection.close()
#proximo passo é buscar por ano e mes que combinem com os dados pelo usuario
def search_for_month(month_year):
    connection = sqlite3.connect("pomodoro.db")
    cursor = connection.cursor()
    cursor.execute("""
        SELECT  


                   """)