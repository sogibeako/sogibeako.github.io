@echo off
title SpectroSampler - Local Server
echo.
echo  ◈ SpectroSampler - Starting local server...
echo  ─────────────────────────────────────────────
echo.
echo  http://localhost:8080
echo.
echo  Press Ctrl+C to stop the server.
echo.
start "" "http://localhost:8080"
python -m http.server 8080
pause
