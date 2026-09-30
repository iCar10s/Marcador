@echo off
REM Lanzador del Marcador de Baloncesto para Windows
cd /d "%~dp0"
set PORT=8080

where py >nul 2>nul
if %errorlevel%==0 (
  set PY=py -3
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    set PY=python
  ) else (
    echo.
    echo   No se encontro Python.
    echo   Descargalo desde https://www.python.org/downloads/
    echo   y marca "Add Python to PATH" durante la instalacion.
    echo.
    pause
    exit /b 1
  )
)

start "" "http://localhost:%PORT%/index.html"
echo.
echo   Marcador de Baloncesto
echo   -----------------------
echo   Se abrira en: http://localhost:%PORT%/index.html
echo.
echo   Deja esta ventana abierta mientras dure el partido.
echo   Para cerrar el marcador: pulsa Ctrl+C aqui.
echo.

%PY% -m http.server %PORT% --bind 127.0.0.1
