var SB = window.SB || {};

SB.timer = (function () {
  var handle = null;
  var lastNow = 0;
  var getState = null;
  var onEvent = null;
  var running = false;

  var GC_WARNS = [60, 30, 10, 5, 0];
  var SC_TICKS = [5, 3, 2, 1, 0];

  function crossedDown(from, to, threshold) {
    return from > threshold && to <= threshold;
  }

  function crossedUp(from, to, threshold) {
    return from < threshold && to >= threshold;
  }

  function emit(type, extra) {
    if (onEvent) onEvent(Object.assign({ type: type }, extra || {}));
  }

  function step(now) {
    var st = getState();
    if (!st) return;
    var dt = (now - lastNow) / 1000;
    lastNow = now;
    if (dt < 0) dt = 0;
    if (dt > 0.05) dt = Math.round(dt * 10) / 10;
    if (dt === 0) return;

    var limit = SB.periodSeconds(st);
    var countUp = !!st.config.countUp;

    if (st.gameRunning) {
      var before = st.gameSeconds;
      var after = countUp ? before + dt : before - dt;
      if (countUp) after = Math.min(after, limit);
      else after = Math.max(after, 0);
      st.gameSeconds = after;

      // Reloj de cada jugador en pista corre junto al de juego
      SB.sides.forEach(function (side) {
        var t = st[side];
        var on = Math.min(st.config.onCourt, t.players.length);
        for (var k = 0; k < on; k++) t.players[k].seconds += dt;
      });

      var reached = countUp ? after >= limit : after <= 0;
      var i;
      if (reached) {
        st.gameRunning = false;
        st.gameSeconds = countUp ? limit : 0;
        emit("gcEnd", { seconds: st.gameSeconds });
      } else {
        for (i = 0; i < GC_WARNS.length; i++) {
          var t = GC_WARNS[i];
          var hit = countUp ? crossedUp(before, after, limit - t) : crossedDown(before, after, t);
          if (hit) { emit("gcWarn", { level: String(t) }); break; }
        }
      }
    }

    // El reloj de posesión depende directamente del reloj general.
    // No puede correr por separado ni continuar al terminar/pausar el periodo.
    var runShotClock = !!(st.gameRunning && !st.shotOff && st.shotSeconds > 0);
    st.shotRunning = runShotClock;
    if (runShotClock) {
      var sBefore = st.shotSeconds;
      var sAfter = Math.max(0, sBefore - dt);
      st.shotSeconds = sAfter;
      if (sAfter <= 0) {
        st.shotRunning = false;
        emit("scOff", {});
      } else {
        for (var j = 0; j < SC_TICKS.length; j++) {
          var st2 = SC_TICKS[j];
          if (st2 === 0) continue;
          if (crossedDown(sBefore, sAfter, st2)) { emit("scWarn", { level: st2 }); break; }
        }
      }
    }

    emit("tick", {});
  }

  function loop() {
    var now = Date.now();
    step(now);
    handle = setTimeout(loop, 90);
  }

  return {
    attach: function (stateGetter, eventHandler) {
      getState = stateGetter;
      onEvent = eventHandler;
    },
    isRunning: function () { return running; },
    start: function () {
      if (running) return;
      running = true;
      lastNow = Date.now();
      loop();
    },
    stop: function () {
      running = false;
      if (handle) clearTimeout(handle);
      handle = null;
    },
    resync: function () {
      if (running) lastNow = Date.now();
    }
  };
})();
