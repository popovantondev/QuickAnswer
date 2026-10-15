@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Checking Node.js and Codex CLI...
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed. Please install Node.js for your user or run Gemini mode.
  pause
  exit /b 1
)
where codex >nul 2>&1
if errorlevel 1 (
  echo Codex CLI is missing. Install Codex CLI without admin rights and sign in with ChatGPT.
  pause
  exit /b 1
)
node luna-bridge.js
pause
