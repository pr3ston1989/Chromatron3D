@echo off
setlocal
title CHROMATRON REBORN - Windows Launcher
cd /d "%~dp0"

echo.
echo  ============================================
echo            CHROMATRON / REBORN
echo                 WINDOWS START
echo  ============================================
echo.

where node >nul 2>&1
if errorlevel 1 goto :missing_node
where npm >nul 2>&1
if errorlevel 1 goto :missing_node

if not exist "package.json" (
 echo [ERROR] Nie znaleziono package.json.
 echo Uruchom ten plik z katalogu rozpakowanego projektu.
 goto :failed
)

if not exist "node_modules\vite\bin\vite.js" (
 echo [1/2] Pobieranie zaleznosci gry. Wymagany jest Internet.
 call npm install --no-audit --no-fund
 if errorlevel 1 goto :install_failed
) else (
 echo [1/2] Zaleznosci sa juz zainstalowane.
)

echo.
echo [2/2] Uruchamiam gre i otwieram przegladarke...
echo Gdy zechcesz zakonczyc gre, nacisnij Ctrl+C.
echo.
call npm run dev -- --host 127.0.0.1 --port 5173 --strictPort --open
if errorlevel 1 goto :start_failed
exit /b 0

:missing_node
echo [ERROR] Node.js lub npm nie sa zainstalowane albo sa niedostepne.
echo Pobierz wersje LTS z https://nodejs.org/
echo Po instalacji zamknij i otworz ponownie ten plik.
goto :failed

:install_failed
echo [ERROR] Instalacja zaleznosci nie powiodla sie.
echo Sprawdz polaczenie z Internetem i sprobuj ponownie.
goto :failed

:start_failed
echo [ERROR] Nie udalo sie uruchomic gry.
echo Sprawdz, czy port 5173 nie jest juz zajety.
goto :failed

:failed
echo.
pause
exit /b 1
