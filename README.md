# 🏀 Marcador de Baloncesto

Marcador de baloncesto completo que funciona **en cualquier navegador y sin internet**: tablet, iPad, Android, Windows, Mac o Linux. No necesita instalación, ni servidor, ni cuentas.

**Descárgalo, doble clic, y a jugar.**

---

## Cómo usarlo

### Opción 1 — Doble clic (recomendada)

| Sistema | Archivo |
|---|---|
| macOS | `Iniciar Marcador.command` |
| Windows | `Iniciar Marcador.bat` |
| Linux | `iniciar-marcador.sh` |

El lanzador abre un servidor local en tu equipo y abre el marcador en el navegador. **Usa siempre esta opción**: el navegador guarda el marcador automáticamente y no se pierde al recargar, cerrar la pestaña o reiniciar la tablet.

En macOS, la primera vez puede que macOS pida permiso para abrir el archivo (**clic derecho → Abrir**).

### Opción 2 — Abrir `index.html` directamente

Funciona igual, pero Chrome y Edge **bloquean el guardado** cuando el archivo se abre sin servidor. Verás un aviso rojo arriba y el marcador **no se conservará al recargar**. Funciona bien en Safari y Firefox.

### Opción 3 — Como app en la tablet

1. Abre el marcador desde el lanzador y anota la dirección (por ejemplo `http://192.168.1.50:8080`).
2. En **Safari (iPad/iPhone)**: Compartir → *Añadir a pantalla de inicio*.
3. En **Chrome (Android)**: menú → *Añadir a pantalla de inicio*.

Quedará como una app a pantalla completa, con su propio icono.

---

## Verlo en una pantalla grande

Este es el escenario pensado para el que está diseñado: **la tablet hace de marcador y la pantalla grande muestra el resultado**.

1. Con la tablet y la pantalla conectadas a la **misma red WiFi**.
2. En el equipo, averigua su IP (en macOS: Ajustes de red; en Windows: `ipconfig`).
3. Arranca el lanzador y abre en la pantalla grande `http://IP-DEL-EQUIPO:8080` (por ejemplo `http://192.168.1.50:8080`).
4. Pulsa <kbd>F</kbd> para **pantalla completa**. La barra de herramientas desaparece y los números se agrandan solos.

En iPad, "Añadir a pantalla de inicio" + botón de pantalla completa deja el marcador sin bordes, como una app de TV.

> Cada dispositivo tiene su propia copia del marcador. Si necesitas corregirlos a mano, usa **Ajustes → Exportar (.json)** y **Importar**.

---

## Qué incluye

- **Marcador por equipo y por jugador**: `+1`, `+2`, `+3` en cada tarjeta. Los puntos del jugador suman al marcador de su equipo automáticamente.
- **Reloj de juego** con cuenta atrás o hacia arriba, avisos sonoros a 60s, 30s, 10s, 5s y 0, y pitido largo al terminar el periodo.
- **Reloj de posesión** independiente (24s por defecto), con aviso a 5 segundos, cuenta regresiva final y modo *posesión anulada* para falta en ataque.
- **Faltas** por equipo y por jugador, con indicador de **BONUS** automático.
- **Tiempos muertos** por equipo, con puntos que muestran cuántos quedan.
- **Periodos** configurables, con prórroga (PR1, PR2…) automática al pasar del último periodo.
- **Fichas de jugador** con dorsal, nombre, puntos, faltas y minutos jugados, en pista o en banquillo.
- **Deshacer** (`Ctrl+Z`) con historial de 60 pasos: un toque equivocado se corrige sin miedo.
- **Copia de seguridad**: guardado automático, historial de partidos, exportar e importar en `.json`.
- **Aviso de tiempo**: parpadeo rojo en los últimos 10 segundos del reloj.
- Temas oscuro, claro y negro puro para TV, colores configurables y cuatro tipografías de número.

---

## Atajos de teclado

Con el marcador enfocado (no mientras escribes un nombre):

| Tecla | Acción |
|---|---|
| <kbd>Espacio</kbd> | Arrancar / parar el reloj de juego |
| <kbd>Shift</kbd>+<kbd>Espacio</kbd> | Arrancar / parar el reloj de posesión |
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> | Sumar 1, 2 o 3 puntos al equipo **con el balón** |
| <kbd>Shift</kbd>+<kbd>1</kbd>…<kbd>3</kbd> | Sumar puntos al equipo **sin el balón** |
| <kbd>Z</kbd> <kbd>X</kbd> <kbd>C</kbd> | Sumar 1, 2 o 3 puntos al **jugador seleccionado** |
| <kbd>V</kbd> | Falta al jugador seleccionado |
| <kbd>B</kbd> | +1 minuto al jugador seleccionado |
| <kbd>A</kbd> / <kbd>D</kbd> | Jugador seleccionado anterior / siguiente |
| <kbd>R</kbd> | Reiniciar el reloj de posesión |
| <kbd>Shift</kbd>+<kbd>R</kbd> | Anular / restaurar la posesión |
| <kbd>O</kbd> | Cambiar el balón al otro equipo |
| <kbd>T</kbd> | Tiempo muerto del equipo con el balón |
| <kbd>P</kbd> | Terminar el periodo / empezar el siguiente |
| <kbd>L</kbd> | Modo pantalla (oculta los controles) |
| <kbd>F</kbd> | Pantalla completa |
| <kbd>M</kbd> | Silenciar / activar el sonido |
| <kbd>Ctrl</kbd>+<kbd>Z</kbd> | Deshacer |
| <kbd>Ctrl</kbd>+<kbd>S</kbd> | Guardar ahora |
| <kbd>?</kbd> | Recordatorio de atajos |

---

## Perfiles de reglas

En **Ajustes → Reglas**:

| Perfil | Periodos | Posesión | Bonus | T. muertos |
|---|---|---|---|---|
| FIBA / Nacional | 4 × 10 min | 24 s | 5 faltas | 4 |
| NCAA | 2 × 20 min | 35 s | 6 faltas | 5 |
| NBA | 4 × 12 min | 24 s | 6 faltas | 7 |
| Escolar | 4 × 8 min | 24 s | 5 faltas | 4 |
| Personalizado | lo que quieras | — | — | — |

Al cambiar de perfil se ajustan periodos, minutos, posesión, bonus, tiempos muertos y jugadores en pista.

---

## Tus datos

- Todo se guarda **en tu propio dispositivo** (localStorage). No hay servidores, cuentas ni envío de datos.
- Se guarda automáticamente tras cada cambio, y también al cerrar la pestaña.
- Además hay **4 copias de seguridad automáticas** en rotación: si el guardado principal se corrompe, la app las recupera sola.
- **Ajustes → Partidos** guarda el historial de partidos finalizados y permite recargar cualquiera.
- **Ajustes → Exportar (.json)** descarga una copia que puedes llevarte en un pendrive.

---

## Estructura

```
marcador-basketball/
├── index.html                 estructura de la interfaz
├── Iniciar Marcador.command   lanzador macOS
├── Iniciar Marcador.bat       lanzador Windows
├── iniciar-marcador.sh        lanzador Linux
├── manifest.webmanifest       para "Añadir a pantalla de inicio"
├── icon.svg
├── css/styles.css             estilos, responsive y modo pantalla
└── js/
    ├── state.js               modelo de datos y perfiles de reglas
    ├── storage.js             guardado, historial, exportar/importar
    ├── audio.js               pitidos generados con WebAudio (sin archivos)
    ├── timer.js               motor de relojes y avisos
    ├── i18n.js                textos
    ├── ui.js                  renderizado e interacción
    ├── shortcuts.js           atajos de teclado
    └── main.js                acciones del marcador y arranque
```

Sin dependencias, sin paso de compilación, sin framework. JavaScript plano para que funcione abierto desde el disco.

---

## Desarrollo

No hace falta instalar nada más que Python 3 para el servidor local:

```bash
python3 -m http.server 8080
# abre http://localhost:8080
```

Para probar en varios tamaños a la vez, usa las herramientas de desarrollo del navegador y cambia el modo dispositivo.

---

## Licencia

MIT. Úsalo, modifícalo y compártelo sin permiso.
