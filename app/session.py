from database import save_session

from timer import session_time

from datetime import datetime

def run_sessions():
     count_session = 0
     session = True
     type_of_session = []
     now = datetime.now().date()
     while session:
         wt = int(input("Digite o tempo que deseja trabalhar:"))
         rt = int(input("Digite o tempo que deseja descansar:"))
         session_time(wt,rt)
         type_of_session.append(wt)
         save_session(wt,rt,now)
         choice = input("Deseja fazer outra sessão? s/n: ")
         if choice =='n':
             session = not session 
         count_session +=1

