from database import save_session, show_session_on_day

from timer import session_time # type: ignore

from datetime import datetime

def run_sessions():
        count_session = 1
        session = True
        type_of_session = []
        now = datetime.now().date()
        while session:
            wt = int(input("Digite o tempo que deseja trabalhar:"))
            rt = int(input("Digite o tempo que deseja descansar:"))
            session_time(wt,rt)
            type_of_session.append(wt)
            save_session(wt,rt,count_session, now)
            choice = input("Deseja fazer outra sessão? s/n: ")
            if choice =='n':
                session = not session 
            
def search_date(session_date):
    show_session_on_day(session_date)
     

def begin():
     keep = True
     while keep:
        gout = False
        while not gout:
            answer = int(input("Digite o que deseja fazer\n1-Iniciar nova sessão\n2-Buscar data\n3-BUscar mês/\n4-Sair\nR:"))
            if answer >= 1 and answer <=4:
                gout = True
            else:
                print("Opção inválida:")
        if answer == 1:
             run_sessions()
        elif answer == 2:
            session_date = input("Digite a data que deseja buscar YYYY-MM-DD")
            search_date(session_date)
        elif answer == 3:
            day_month = input("Digite o mes e o ano que deseja procurar  -> YYYY-MM")
            

                         
        
    