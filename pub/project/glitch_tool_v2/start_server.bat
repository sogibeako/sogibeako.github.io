@echo off
echo Starting Glitch Tool Server...
echo Open http://localhost:8000 in your browser if it doesn't open automatically.
start http://localhost:8000
python -m http.server 8000
pause
