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

where npm >nul 2>nul
if errorlevel 1 (
  echo npm is not installed or is not in PATH.
  echo Please install Node.js, then run this file again.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

echo Checking existing unified server...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$api='http://127.0.0.1:5199/api/auth/status';" ^
  "$target='http://127.0.0.1:5199/';" ^
  "try {" ^
  "  $r=Invoke-WebRequest -UseBasicParsing -Uri $api -TimeoutSec 1;" ^
  "  if ($r.StatusCode -eq 200 -and $r.Content -match 'authenticated') { Start-Process $target; exit 0 }" ^
  "} catch {}" ^
  "exit 1"
if not errorlevel 1 (
  echo Server is already running. Browser opened.
  pause
  exit /b 0
)

echo Building and starting unified server...
start "Love Flight Unified Server" cmd /k "cd /d ""%~dp0"" && npm run start:server"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$api='http://127.0.0.1:5199/api/auth/status';" ^
  "$target='http://127.0.0.1:5199/';" ^
  "for ($i=0; $i -lt 60; $i++) {" ^
  "  try {" ^
  "    $r=Invoke-WebRequest -UseBasicParsing -Uri $api -TimeoutSec 1;" ^
  "    if ($r.StatusCode -eq 200 -and $r.Content -match 'authenticated') { Start-Process $target; exit 0 }" ^
  "  } catch {}" ^
  "  Start-Sleep -Milliseconds 500" ^
  "}" ^
  "exit 1"

if errorlevel 1 (
  echo Server did not become ready on http://127.0.0.1:5199/.
  echo If another process is using port 5199, close it and run this file again.
  pause
  exit /b 1
)

echo Browser opened. Player app: http://127.0.0.1:5199/
echo Admin page: http://127.0.0.1:5199/admin/
pause
