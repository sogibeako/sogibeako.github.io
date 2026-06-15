@echo off
echo Starting noise_engine local server...
echo.
echo URL: http://localhost:8000
echo.
start http://localhost:8000
python -m http.server 8000
pause
