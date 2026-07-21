from timer import session_time
from datetime import datetime
count_session = 0
wt = int(input("Digite o tempo que deseja trabalhar:"))
rt = int(input("Digite o tempo que deseja descansar:"))
session = True
total_day_time = 0
type_of_session = []
while session:
    session_time(wt,rt)
    total_day_time += wt
    type_of_session.append(wt)
    choice = input("Deseja fazer outra sessão? s/n: ")
    if choice =='n':
        session = not session 
    else:
        wt = int(input("Digite o tempo que deseja trabalhar:"))
        rt = int(input("Digite o tempo que deseja descansar:"))
        
    count_session +=1
now = datetime.now().date()
today_session = {"tempo total" : total_day_time,
                 "dia" : now,
                 "tipos de sessões" : type_of_session
                 }
