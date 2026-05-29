@echo off
cd /d "%~dp0"
echo Starting WhoisSpy WebSocket server...
echo Keep this window open while playing.
echo.
node server\server.js
pause
