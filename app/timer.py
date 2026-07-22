import time
#colocar o timer de forma formatada com 2 casas, mesmo se nao tiver necessidade
def work_time(wt):
    wtt = wt * 60
    wt_h = wtt // 3600
    wtt = wtt % 3600
    wt_m = wtt // 60
    wtt = wtt % 60
    wt_s = wtt
    while wt_h >= 0:
        while wt_m >= 0:
            while wt_s >= 0 :
                print(f"{wt_h}:{wt_m}:{wt_s}")
                wt_s -=1
                time.sleep(1)
            wt_s = 59
            wt_m -= 1
        wt_m = 59
        wt_s = 59
        wt_h -= 1
def rest_time(rt):
    rtt = rt * 60
    rt_m = rtt // 60
    rtt = rtt % 60
    rt_s = rtt
    while rt_m >= 0:
        while rt_s >= 0 :
            print(f"00:{rt_m}:{rt_s}")
            rt_s -=1
            time.sleep(1)
        rt_s = 59
        rt_m -= 1   

def session_time(wt,rt):
    print("Work time:")
    work_time(wt)
    print("Rest time:")
    rest_time(rt)

      
        
