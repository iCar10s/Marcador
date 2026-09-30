# 🏀 Marcador de Baloncesto

Marcador de baloncesto completo que funciona **en cualquier navegador**: tablet, iPad, Android, Windows, Mac o Linux. No necesita instalación, ni cuentas, ni saber programar.

**Abre la dirección, añádela a la pantalla de inicio, y a jugar.**

Funciona en línea y también sin internet, para los recintos donde la wifi no llega.

---

## Cómo usarlo

Hay dos formas de abrirlo. **Elige según tengas internet o no.** Ninguna requiere instalar nada más que un navegador.

### Opción 1 — En línea, con internet (recomendada)

El marcador está publicado en GitHub Pages, gratis, y no necesita ningún equipo encendido:

**https://icar10s.github.io/Marcador/**

Copia esa dirección en la tablet, en el móvil o en el portátil. Ya está.

> Si algún día la dirección no carga, es que GitHub Pages está desactivado en el repositorio. Se activa en 30 segundos: **Settings → Pages → Deploy from a branch → main → / (root) → Save**. Está explicado en [Desarrollo](#desarrollo).

> La dirección es pública y cualquiera que la abra ve la app, pero **nadie ve tus partidos**: cada dispositivo tiene su propio marcador y todo se guarda solo en ese dispositivo. No hay servidor ni base de datos.

#### Dejarlo como app en la tablet

1. Abre la dirección de arriba.
2. **Safari (iPad/iPhone)**: Compartir → *Añadir a pantalla de inicio*.
3. **Chrome (Android)**: menú → *Añadir a pantalla de inicio*.

Queda como una app a pantalla completa, con su propio icono y sin barra de navegador. Pulsa <kbd>F</kbd> para pantalla completa y los números se agrandan solos.

### Opción 2 — Sin internet, en el local del partido

Para recintos con wifi que no llega o que se cae. Necesitas **un equipo con Python 3** encendido junto a la pista.

| Sistema | Archivo |
|---|---|
| Windows | `Iniciar Marcador.bat` |
| macOS | `Iniciar Marcador.command` |
| Linux | `iniciar-marcador.sh` |

El lanzador abre un servidor local, muestra la dirección exacta que debes escribir en la tablet y se queda en primer plano:

```
  En este equipo:  http://localhost:8080/index.html

  En la tablet o pantalla grande, conecta al MISMO wifi y abre:
    http://192.168.1.50:8080/index.html
```

Abre **esa segunda dirección en la tablet**, no la del propio equipo. Si el puerto 8080 ya está ocupado, el lanzador busca el siguiente libre y te avisa.

> La tablet y el equipo deben estar en la **misma red wifi**. El servidor es temporal: al cerrar la ventana negra, se para.

En macOS, la primera vez puede que macOS pida permiso para abrir el archivo (**clic derecho → Abrir**).

### Opción 3 — Abrir `index.html` directamente

Haz doble clic en `index.html`. Funciona, pero **no te lo recomendamos para un partido**: al abrir un archivo sin servidor, algunos navegadores bloquean el guardado y el marcador se pierde al recargar. Úsalo solo para curiosear.

---

## Plan del día del partido

1. **Prueba la Opción 1 en el móvil, con 4G**, unos días antes. Si la wifi del recinto va a fallar, ya lo sabes de antemano.
2. **Al llegar, prueba la wifi del recinto.** Si carga la dirección de GitHub, ya estás: úsala y no necesitas nada más.
3. **Si no hay internet**, arranca el `.bat` en un portátil con Python y usa la dirección IP que te muestre. Deja el portátil enchufado y con la tapa cerrada, pero **encendido**.
4. **Deja siempre abierto un lanzador como reserva.** Si el portátil se apaga o se queda sin batería, al menos tienes la nube.
5. **Prueba con el reloj corriendo antes del partido.** Arranca el reloj, espera a que llegue a 0, y comprueba que salta el pitido. El sonido es lo que más falla.

### Consejo sobre la batería

La tablet con pantalla encendida durante 2 horas de partido puede agotarse. El marcador intenta mantener la pantalla activa (wake lock), pero el navegador puede ignorarlo. **Ten el cargador a mano** y, si puedes, ponle un límite de carga alto para que no se apague sola.

---

## Verlo en una pantalla grande

Aquí hay que ser claro, porque es la confusión más habitual:

> **Cada dispositivo tiene su propio marcador. No se sincronizan entre sí.**

Si abres el marcador en la tablet y en la pantalla grande, verás **dos marcadores independientes**, no el mismo. La pantalla grande saldrá a 0-0 aunque la tablet lleve 40 puntos.

### Lo que sí funciona

**Un solo dispositivo a pantalla completa.** En el navegador de ese dispositivo, pulsa <kbd>L</kbd> para el modo pantalla (oculta los controles) y <kbd>F</kbd> para pantalla completa. Los números se agrandan solos y queda limpio, como un marcador de TV.

Sobre esa base, lo más práctico para un recinto es:

- **Una tablet o móvil en la mesa, junto al marcador**, con el cargador puesto y a pantalla completa. Es lo que mejor se ve desde las gradas.
- **Un portátil en la mesa con el `.bat` abierto**, y la tablet como segunda vista. **Pero solo para consultar**: si marcas puntos en uno, en el otro no se actualiza.

### Lo que NO funciona

- Poner la tablet junto a la pista y la pantalla grande con la misma URL **esperando ver lo mismo**. No va a pasar.
- Confiar en que por ser la misma página se actualiza sola. No hay servidor que reparta nada.

### Si de verdad necesitas dos marcadores sincronizados

Eso exige un servidor que guarde el resultado y lo reparta entre dispositivos, no solo un archivo HTML. Es posible con un plan gratuito (Supabase o Firebase), pero es un desarrollo aparte y rompe la simplicidad de "un archivo y a jugar". Si lo necesitas, dímelo y lo planteamos en separado.

Mientras tanto, para corregir un marcador a mano, usa **Ajustes → Exportar (.json)** e **Importar**.

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
Marcador/
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

Para trabajar en local, un servidor de Python 3 es suficiente:

```bash
python3 -m http.server 8080
# abre http://localhost:8080
```

Los lanzadores `.bat`, `.command` y `.sh` hacen exactamente esto, pero además buscan un puerto libre, abren el navegador y te muestran la dirección que hay que escribir en la tablet.

Para probar en varios tamaños a la vez, usa las herramientas de desarrollo del navegador y cambia el modo dispositivo.

### Publicar en GitHub Pages

Para que la app quede online en `https://<usuario>.github.io/<repo>/`:

1. En el repositorio, ve a **Settings → Pages**.
2. En **Build and deployment → Source**, elige **Deploy from a branch**.
3. Branch: `main`, carpeta: `/ (root)` → **Save**.
4. Espera un minuto.

Todo el proyecto usa rutas relativas, así que funciona en cualquier subcarpeta sin tocar nada.

---

## Problemas frecuentes

**La tablet no abre la dirección del portátil.**
No están en la misma wifi, o hay una red de invitados que aísla los dispositivos entre sí. Prueba con el hotspot de un móvil. También puede que el cortafuegos de Windows bloquee Python: en ese caso, permite Python en redes privadas la primera vez que lo pida.

**Al recargar se me borra el marcador.**
Estás en la Opción 3 (abriendo `index.html` sin servidor). Usa la Opción 1 o la 2.

**No suena.**
Los navegadores bloquean el audio hasta que tocas la pantalla. Haz un clic en cualquier parte al abrirla. Luego usa <kbd>M</kbd> para silenciar.

**La pantalla se apaga durante el partido.**
La tablet se queda dormida. Manténla enchufada y revisa los ajustes de bloqueo de pantalla del dispositivo.

**El reloj va con retraso respecto a la reality.**
Los relojes de partido se corrigen con <kbd>-1s</kbd> / <kbd>+1s</kbd> / <kbd>-1m</kbd> / <kbd>+1m</kbd>, o escribiendo directamente sobre la hora.

---

## Licencia

MIT. Úsalo, modifícalo y compártelo sin permiso.
