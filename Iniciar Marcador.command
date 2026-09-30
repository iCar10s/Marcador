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
LANIP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')

echo ""
echo "  Marcador de Baloncesto"
echo "  -------------------------"
echo "  En este equipo:  $URL"
if [ -n "$LANIP" ]; then
  echo ""
  echo "  En el iPad o la pantalla grande, conecta al MISMO wifi y abre:"
  echo "    http://$LANIP:$PORT/index.html"
  echo ""
  echo "  (Ojo: solo funciona en la red local del recinto, sin internet.)"
fi
echo ""
echo "  Dejar esta ventana abierta mientras dure el partido."
echo "  Para cerrar el marcador: pulsa Ctrl+C aqui."
echo ""

(sleep 1; open "$URL") &

trap 'echo ""; echo "  Marcador cerrado."; exit 0' INT TERM
$PY -m http.server $PORT --bind 0.0.0.0
