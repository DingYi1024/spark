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

echo Checking existing dev server...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$url='http://127.0.0.1:5173/';" ^
  "$target='http://127.0.0.1:5173/#/pages/index/index';" ^
  "try {" ^
  "  $r=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 1;" ^
  "  if ($r.StatusCode -eq 200 -and $r.Content -match 'id=.app.') { Start-Process $target; exit 0 }" ^
  "} catch {}" ^
  "exit 1"
if not errorlevel 1 (
  echo App is already running. Browser opened.
  pause
  exit /b 0
)

echo Starting Love Flight Chess...
start "Love Flight Chess Dev Server" cmd /k "cd /d ""%~dp0"" && npm run dev:modern -- --port 5173 --strictPort"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$url='http://127.0.0.1:5173/';" ^
  "$target='http://127.0.0.1:5173/#/pages/index/index';" ^
  "for ($i=0; $i -lt 40; $i++) {" ^
  "  try {" ^
  "    $r=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 1;" ^
  "    if ($r.StatusCode -eq 200 -and $r.Content -match 'id=.app.') { Start-Process $target; exit 0 }" ^
  "  } catch {}" ^
  "  Start-Sleep -Milliseconds 500" ^
  "}" ^
  "exit 1"

if errorlevel 1 (
  echo Server did not become ready on http://127.0.0.1:5173/.
  echo If another process is using port 5173, close it and run this file again.
  pause
  exit /b 1
)

echo Browser opened. Keep the server window open while using the app.
pause
