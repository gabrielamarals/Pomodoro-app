@echo off
setlocal

set "ROOT=%~dp0"

echo Verificando a API...
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/health -TimeoutSec 1 ^| Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    echo API desligada. Iniciando...
    start "Pomodoro API" /D "%ROOT%app" "%ROOT%.venv\Scripts\python.exe" api.py
) else (
    echo API ja esta funcionando.
)

echo Verificando o front-end...
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://localhost:3000/ -TimeoutSec 1 ^| Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    echo Front-end desligado. Iniciando...
    start "Pomodoro Frontend" /D "%ROOT%frontend" pnpm run dev
) else (
    echo Front-end ja esta funcionando.
)

timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

endlocal
