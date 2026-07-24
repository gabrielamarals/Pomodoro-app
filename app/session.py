from database import save_session, get_daily_summary

from timer import session_time # type: ignore

from datetime import datetime

def run_sessions():
        session = True
        type_of_session = []
        now = datetime.now().date()
        while session:
            wt = int(input("Enter the focus duration in minutes: "))
            rt = int(input("Enter the rest duration in minutes: "))
            session_time(wt,rt)
            type_of_session.append(wt)
            save_session(wt,rt, now)
            choice = input("Would you like to start another session? y/n: ")
            if choice == 'n':
                session = not session 
            
def search_date(session_date):
    get_daily_summary(session_date)
     

def begin():
     keep = True
     while keep:
        gout = False
        while not gout:
            answer = int(input(
                "Choose an option\n"
                "1 - Start a new session\n"
                "2 - Search by date\n"
                "3 - Search by month\n"
                "4 - Exit\n"
                "Choice: "
            ))
            if answer >= 1 and answer <=4:
                gout = True
            else:
                print("Invalid option.")
        if answer == 1:
             run_sessions()
        elif answer == 2:
            session_date = input("Enter the date to search (YYYY-MM-DD): ")
            search_date(session_date)
        elif answer == 3:
            month_year = input("Enter the month and year to search (YYYY-MM): ")
            

                         
        
    
