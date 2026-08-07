@echo off
setlocal

set "ROOT=%~dp0"
set "CODEX_NODE_BIN=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "CODEX_PNPM=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
if exist "%CODEX_NODE_BIN%\node.exe" set "PATH=%CODEX_NODE_BIN%;%PATH%"

echo Verificando a API...
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/health -TimeoutSec 1 ^| Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    echo API desligada. Iniciando...
    start "Pomodoro API" /D "%ROOT%" "%ROOT%.venv\Scripts\python.exe" -m uvicorn app.api:app --host 127.0.0.1 --port 8000
) else (
    echo API ja esta funcionando.
)

echo Verificando o front-end...
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://localhost:3000/ -TimeoutSec 1 ^| Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    echo Front-end desligado. Iniciando...
    if exist "%CODEX_PNPM%" (
        start "Pomodoro Frontend" /D "%ROOT%frontend" cmd /c "%CODEX_PNPM% run dev"
    ) else (
        start "Pomodoro Frontend" /D "%ROOT%frontend" cmd /c pnpm run dev
    )
) else (
    echo Front-end ja esta funcionando.
)

timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

endlocal
