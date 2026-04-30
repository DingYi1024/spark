@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or is not in PATH.
  echo Please install Node.js, then run this file again.
  pause
  exit /b 1
)

if not exist "scripts\tasks-admin-server.mjs" (
  echo Task admin server file is missing.
  echo Expected: scripts\tasks-admin-server.mjs
  pause
  exit /b 1
)

echo Checking existing task admin server...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$api='http://127.0.0.1:5199/api/auth/status';" ^
  "$target='http://127.0.0.1:5199/admin/';" ^
  "try {" ^
  "  $r=Invoke-WebRequest -UseBasicParsing -Uri $api -TimeoutSec 1;" ^
  "  if ($r.StatusCode -eq 200 -and $r.Content -match 'authenticated') { Start-Process $target; exit 0 }" ^
  "} catch {}" ^
  "exit 1"
if not errorlevel 1 (
  echo Task admin is already running. Browser opened.
  pause
  exit /b 0
)

echo Starting task admin server...
start "Task Bank Admin Server" cmd /k "cd /d ""%~dp0"" && node scripts/tasks-admin-server.mjs"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$api='http://127.0.0.1:5199/api/auth/status';" ^
  "$target='http://127.0.0.1:5199/admin/';" ^
  "for ($i=0; $i -lt 40; $i++) {" ^
  "  try {" ^
  "    $r=Invoke-WebRequest -UseBasicParsing -Uri $api -TimeoutSec 1;" ^
  "    if ($r.StatusCode -eq 200 -and $r.Content -match 'authenticated') { Start-Process $target; exit 0 }" ^
  "  } catch {}" ^
  "  Start-Sleep -Milliseconds 500" ^
  "}" ^
  "exit 1"

if errorlevel 1 (
  echo Task admin did not become ready on http://127.0.0.1:5199/.
  echo If another process is using port 5199, close it and run this file again.
  pause
  exit /b 1
)

echo Browser opened. Keep the server window open while editing tasks.
pause
