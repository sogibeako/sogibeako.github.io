@echo off
setlocal

set "PORT=8030"
set "HOST=127.0.0.1"
set "ROOT=%~dp0"

echo.
echo Starting local server for pub...
echo Root: %ROOT%
echo.
echo Pub top:
echo   http://%HOST%:%PORT%/
echo.
echo Example - JSS project 0025:
echo   http://%HOST%:%PORT%/jssproject/0025/index.html
echo.
echo Press Ctrl+C to stop the server.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%start_pub_server.ps1" -Port %PORT% -HostName %HOST%
pause
