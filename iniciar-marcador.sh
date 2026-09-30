#!/bin/sh
cd "$(dirname "$0")" || exit 1
PORT=8080
URL="http://localhost:$PORT/index.html"

if command -v python3 >/dev/null 2>&1; then
  PY=python3
else
  PY=python
fi

LANIP=$(hostname -I 2>/dev/null | awk '{print $1}')

echo ""
echo "  Marcador de Baloncesto"
echo "  -------------------------"
echo "  En este equipo:  $URL"
if [ -n "$LANIP" ]; then
  echo ""
  echo "  En la tablet o pantalla grande, conecta al MISMO wifi y abre:"
  echo "    http://$LANIP:$PORT/index.html"
  echo ""
  echo "  (Ojo: solo funciona en la red local del recinto, sin internet.)"
fi
echo ""
echo "  Deja esta terminal abierta. Ctrl+C para cerrar."
echo ""

(sleep 1; xdg-open "$URL" >/dev/null 2>&1 || open "$URL") &

exec $PY -m http.server $PORT --bind 0.0.0.0
