@echo off
chcp 65001 >nul
cd /d "%~dp0\.."

echo.
echo  ================================================================
echo   CHROMATRON 3D — Premium Model Generator (Blender)
echo  ================================================================
echo.

set BLENDER="C:\Tools\blender-5.3.0-windows-x64\blender.exe"

if not exist %BLENDER% (
    echo [ERROR] Blender not found at %BLENDER%
    echo         Please update the path in this script.
    pause
    exit /b 1
)

echo  [1/3] Generating hero biome models...
echo.
%BLENDER% --background --python-exit-code 1 --python scripts/blender_generate_heroes.py 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Hero model generation failed
    pause
    exit /b 1
)

echo.
echo  [2/3] Generating midground set-piece models...
echo.
%BLENDER% --background --python-exit-code 1 --python scripts/blender_generate_midground.py 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Midground model generation failed
    pause
    exit /b 1
)

echo.
echo  [3/3] Generating optical device models...
echo.
%BLENDER% --background --python-exit-code 1 --python scripts/blender_optical_bench.py 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Optical device model generation failed
    pause
    exit /b 1
)

echo.
echo  ================================================================
echo   All premium models generated successfully!
echo.
echo   Output:
echo     public/models/biomes/     (4 hero GLB files)
echo     public/models/midground/  (8 midground GLB files)
echo     public/models/optics/     (22 optical device GLB files)
echo.
echo   Run "npm run dev" to see them in the game.
echo  ================================================================
echo.
pause
