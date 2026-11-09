@echo off
setlocal
cd /d "%~dp0"
echo Local website preview - no upload or deployment.
echo After rendering, open http://127.0.0.1:4200/ in your browser.
echo Keep this window open while editing. Press Ctrl+C to stop.
if exist ".tools\quarto\bin\quarto.cmd" (
  call ".tools\quarto\bin\quarto.cmd" run scripts/serve.ts --watch
) else (
  where quarto >nul 2>nul
  if errorlevel 1 (
    echo Quarto is missing. See README.md for installation instructions.
    pause
    exit /b 1
  )
  call quarto run scripts/serve.ts --watch
)
if errorlevel 1 pause
