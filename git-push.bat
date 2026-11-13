@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  ══════════════════════════════════════════════
echo   CHROMATRON 3D — Git Commit ^& Push
echo  ══════════════════════════════════════════════
echo.

:: Remove stale lock if present
if exist ".git\index.lock" del /f ".git\index.lock"

git add -A
if errorlevel 1 (
    echo [BLAD] git add nie powiodl sie
    pause
    exit /b 1
)

git status --short
echo.

set /p MSG="Commit message (Enter = domyslny): "
if "%MSG%"=="" set MSG=feat: multi-game EXE extraction, drag-and-drop import, enhanced solver and golden-master tests

git commit -m "%MSG%"
if errorlevel 1 (
    echo [INFO] Nic do commitowania lub blad
    pause
    exit /b 1
)

echo.
echo Pushing to origin...
git push origin main
if errorlevel 1 (
    echo [BLAD] Push nie powiodl sie — sprawdz czy masz skonfigurowane dane logowania
    echo   Sprobuj: git push --set-upstream origin main
    pause
    exit /b 1
)

echo.
echo  GOTOWE — zmiany wyslane na GitHub
echo.
pause
