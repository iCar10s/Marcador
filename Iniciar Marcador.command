#!/bin/bash
cd "$(dirname "$0")" || exit 1
PORT=8080

while nc -z 127.0.0.1 $PORT >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  echo ""
  echo "  No se encontro Python en este equipo."
  echo "  Abre la Terminal y ejecuta:  xcode-select --install"
  echo ""
  read -r -p "Pulsa Enter para cerrar."
  exit 1
fi

URL="http://localhost:$PORT/index.html"
echo ""
echo "  Marcador de Baloncesto"
echo "  -------------------------"
echo "  Se abrira en: $URL"
echo ""
echo "  Dejar esta ventana abierta mientras dure el partido."
echo "  Para cerrar el marcador: pulsa Ctrl+C aqui."
echo ""

(sleep 1; open "$URL") &

trap 'echo ""; echo "  Marcador cerrado."; exit 0' INT TERM
$PY -m http.server $PORT --bind 127.0.0.1
