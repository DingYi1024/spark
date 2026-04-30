@echo off
setlocal

cd /d "%~dp0"

set "PORT=8080"
set "URL=http://localhost:%PORT%/index.html"

echo Starting local server at %URL%

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "%URL%"
  python -m http.server %PORT%
  goto :done
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "%URL%"
  py -m http.server %PORT%
  goto :done
)

where node >nul 2>nul
if %errorlevel%==0 (
  start "" "%URL%"
  npx --yes http-server . -p %PORT% -c-1
  goto :done
)

echo Could not find Python or Node.js in PATH.
echo Install Python or Node.js, then run this file again.
pause

:done
endlocal
