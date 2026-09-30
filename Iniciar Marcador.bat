@echo off
REM Lanzador del Marcador de Baloncesto para Windows
setlocal EnableDelayedExpansion
cd /d "%~dp0"
set PORT=8080
:buscar_puerto
netstat -an | findstr /c:"LISTENING" | findstr /c:":%PORT%" >nul 2>nul
if not errorlevel 1 (
  set /a PORT+=1
  if !PORT! GEQ 8100 (
    echo.
    echo   No hay puertos libres entre 8080 y 8099.
    echo   Cierra el Marcador en otra ventana y vuelve a abrir este lanzador.
    echo.
    pause
    exit /b 1
  )
  goto buscar_puerto
)

set LANIP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  set "cand=%%a"
  set "cand=!cand: =!"
  if not "!cand!"=="127.0.0.1" if not defined LANIP set "LANIP=!cand!"
)

where py >nul 2>nul
if !errorlevel!==0 (
  set PY=py -3
) else (
  where python >nul 2>nul
  if !errorlevel!==0 (
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
echo   En este equipo:  http://localhost:%PORT%/index.html
if defined LANIP (
  echo.
  echo   En la tablet o pantalla grande, conecta al MISMO wifi y abre:
  echo     http://!LANIP!:%PORT%/index.html
  echo.
  echo   ^(Ojo: solo funciona en la red local del recinto, sin internet.^)
) else (
  echo.
  echo   No se detecto una IP de red. Conecta el equipo al wifi del recinto
  echo   y vuelve a abrir este lanzador.
)
echo.
echo   Deja esta ventana abierta mientras dure el partido.
echo   Para cerrar el marcador: pulsa Ctrl+C aqui.
echo.

%PY% -m http.server %PORT% --bind 0.0.0.0
