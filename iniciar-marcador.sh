#!/bin/sh
cd "$(dirname "$0")" || exit 1
PORT=8080
URL="http://localhost:$PORT/index.html"

if command -v python3 >/dev/null 2>&1; then
  PY=python3
else
  PY=python
fi

echo ""
echo "  Marcador de Baloncesto"
echo "  Se abrira en: $URL"
echo "  Deja esta terminal abierta. Ctrl+C para cerrar."
echo ""

(sleep 1; xdg-open "$URL" >/dev/null 2>&1 || open "$URL") &

exec $PY -m http.server $PORT --bind 127.0.0.1
