@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0QuickAnswer.ps1"
if errorlevel 1 (
  echo.
  echo Quick Answer could not start. This school computer may restrict PowerShell scripts.
  pause
)
