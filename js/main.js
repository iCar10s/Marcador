(function () {
  var state = null;
  var ui = null;
  var wakeLock = null;

  function getState() { return state; }

  function setState(next) {
    state = next;
    SB.ui.setState(next);
  }

  function snapshot() { SB.history.push(state); }

  function commit() {
    SB.storage.schedule(state);
    syncTimer();
    if (ui) ui.render();
  }

  function mutate(fn) {
    snapshot();
    fn();
    commit();
  }

  function syncTimer() {
    if (state.gameRunning || state.shotRunning) SB.timer.start();
    else SB.timer.stop();
  }

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  function activePlayerId(side) {
    var id = ui.getActive(side);
    if (id && ui.findPlayer(side, id)) return id;
    var first = ui.getFirstOnCourt(side);
    ui.setActivePlayer(side, first);
    return first;
  }

  var actions = {
    forceSave: function () {
      var ok = SB.storage.save(state);
      ui.setSaveIndicator(ok);
      ui.toast(ok ? SB.t("saved") : SB.t("saveFail"), !ok);
    },

    renameTeam: function (side, name) {
      state[side].name = name;
      SB.storage.schedule(state);
    },

    addPoints: function (side, value) {
      mutate(function () { state[side].score = Math.max(0, state[side].score + value); });
      if (value > 0) SB.audio.point(value);
    },

    addPlayerPoints: function (side, id, value) {
      var p = ui.findPlayer(side, id);
      if (!p) return;
      mutate(function () { p.points = Math.max(0, p.points + value); state[side].score = Math.max(0, state[side].score + value); });
      if (value > 0) SB.audio.point(value);
    },

    addTeamFoul: function (side, delta) {
      mutate(function () { state[side].fouls = Math.max(0, state[side].fouls + delta); });
      if (delta > 0) SB.audio.foul();
    },

    addPlayerFoul: function (side, id) {
      var p = ui.findPlayer(side, id);
      if (!p) return;
      mutate(function () {
        p.fouls += 1;
        state[side].fouls = Math.max(0, state[side].fouls + 1);
      });
      SB.audio.foul();
    },

    addPlayerSeconds: function (side, id) {
      var p = ui.findPlayer(side, id);
      if (!p) return;
      mutate(function () { p.seconds += 30; });
    },

    addMinuteActive: function () {
      var side = state.possession;
      var p = ui.findPlayer(side, activePlayerId(side));
      if (!p) return;
      mutate(function () { p.seconds += 60; });
    },

    addToActive: function (value) {
      var side = state.possession;
      var p = ui.findPlayer(side, activePlayerId(side));
      if (!p) return;
      actions.addPlayerPoints(side, p.id, value);
    },

    foulActive: function () {
      var side = state.possession;
      var p = ui.findPlayer(side, activePlayerId(side));
      if (!p) return;
      actions.addPlayerFoul(side, p.id);
    },

    setPlayerField: function (side, id, field, value) {
      var p = ui.findPlayer(side, id);
      if (!p) return;
      p[field] = value;
      SB.storage.schedule(state);
    },

    setActivePlayer: function (side, id) {
      ui.setActivePlayer(side, id);
    },

    addPlayer: function (side) {
      mutate(function () {
        var n = state[side].players.length + 1;
        state[side].players.push(SB.makePlayer(n));
      });
    },

    removePlayer: function (side, id) {
      if (state[side].players.length <= 1) {
        ui.toast("Debe quedar al menos un jugador", true);
        return;
      }
      mutate(function () {
        state[side].players = state[side].players.filter(function (p) { return p.id !== id; });
      });
    },

    addTimeout: function (side, delta) {
      var next = clamp(state[side].timeoutsUsed + delta, 0, state.config.timeoutsTotal);
      if (next === state[side].timeoutsUsed) {
        ui.toast(SB.t("timeoutNone"), true);
        return;
      }
      mutate(function () { state[side].timeoutsUsed = next; });
    },

    useTimeout: function (side) {
      if (state[side].timeoutsUsed >= state.config.timeoutsTotal) {
        ui.toast(SB.t("timeoutNone"), true);
        return;
      }
      mutate(function () {
        state[side].timeoutsUsed += 1;
        state.gameRunning = false;
        state.shotRunning = false;
        if (state.status === "pre") state.status = "live";
      });
      SB.audio.timeout();
      ui.toast(SB.t("timeoutUsed") + " · " + state[side].name);
    },

    toggleGameClock: function () {
      if (state.status === "final") { ui.toast("Partido finalizado", true); return; }
      if (state.status === "break") { ui.toast("Empieza el periodo antes de correr el reloj", true); return; }
      mutate(function () {
        state.gameRunning = !state.gameRunning;
        if (state.gameRunning) state.status = "live";
      });
    },

    adjustGameClock: function (cmd) {
      mutate(function () {
        if (cmd === "reset") {
          state.gameSeconds = state.config.countUp ? 0 : SB.periodSeconds(state);
          state.gameRunning = false;
          return;
        }
        var delta = Number(cmd);
        if (state.config.countUp) state.gameSeconds = Math.min(SB.periodSeconds(state), Math.max(0, state.gameSeconds + delta));
        else state.gameSeconds = Math.max(0, state.gameSeconds + delta);
      });
    },

    resetGameClockToFull: function () {
      state.gameSeconds = state.config.countUp ? 0 : SB.periodSeconds(state);
      state.gameRunning = false;
      commit();
    },

    toggleShotClock: function () {
      if (state.shotOff) { ui.toast(SB.t("shotOff"), true); return; }
      mutate(function () {
        state.shotRunning = !state.shotRunning;
        if (state.shotRunning && state.status === "pre") state.status = "live";
      });
    },

    adjustShotClock: function (cmd) {
      mutate(function () {
        if (cmd === "reset") { state.shotSeconds = state.config.shotClockSeconds; state.shotRunning = false; return; }
        state.shotSeconds = clamp(state.shotSeconds + Number(cmd), 0, state.config.shotClockSeconds);
      });
    },

    resetShotClock: function () {
      mutate(function () {
        state.shotSeconds = state.config.shotClockSeconds;
        state.shotRunning = false;
        state.shotOff = false;
      });
    },

    toggleShotOff: function () {
      mutate(function () {
        state.shotOff = !state.shotOff;
        if (state.shotOff) state.shotRunning = false;
        else state.shotSeconds = state.config.shotClockSeconds;
      });
      ui.toast(state.shotOff ? SB.t("shotOff") : SB.t("shotReset") + state.config.shotClockSeconds + "s");
    },

    swapPossession: function () {
      mutate(function () {
        state.possession = SB.other(state.possession);
        if (state.config.autoShotReset) {
          state.shotSeconds = state.config.shotClockSeconds;
          state.shotRunning = false;
          state.shotOff = false;
        }
      });
    },

    changePeriod: function (delta) {
      var next = clamp(state.period + delta, 1, state.config.periods + 9);
      if (next === state.period) return;
      mutate(function () {
        state.period = next;
        state.overtime = Math.max(0, next - state.config.periods);
        state.gameSeconds = state.config.countUp ? 0 : SB.periodSeconds(state);
        state.shotSeconds = state.config.shotClockSeconds;
        state.gameRunning = false;
        state.shotRunning = false;
        state.shotOff = false;
        state.status = "break";
      });
    },

    endPeriod: function () {
      var isFinal = state.period >= state.config.periods;
      mutate(function () {
        state.gameRunning = false;
        state.shotRunning = false;
        state.shotOff = false;
        state.shotSeconds = state.config.shotClockSeconds;
        state.gameSeconds = SB.periodSeconds(state);
        state.status = isFinal ? "final" : "break";
      });
      if (isFinal) {
        SB.storage.archive(state);
        SB.audio.periodEnd();
        ui.toast(SB.t("finalGame") + ": " + state.home.name + " " + state.home.score + " - " + state.away.score + " " + state.away.name);
      } else {
        SB.audio.periodEnd();
        ui.toast(SB.t("periodEndNext") + SB.periodLabel(state, state.period + 1));
      }
    },

    primaryAction: function () {
      if (state.status === "pre") {
        mutate(function () { state.status = "live"; });
        ui.toast("Partido en juego");
        return;
      }
      if (state.status === "live") { actions.endPeriod(); return; }
      if (state.status === "break") {
        mutate(function () {
          state.period += 1;
          state.overtime = Math.max(0, state.period - state.config.periods);
          state.gameSeconds = state.config.countUp ? 0 : SB.periodSeconds(state);
          state.shotSeconds = state.config.shotClockSeconds;
          state.status = "live";
        });
        return;
      }
      actions.newGame();
    },

    newGame: function () {
      SB.storage.archive(state);
      SB.history.clear();
      var cfg = SB.clone(state.config);
      setState(SB.createState(cfg));
      ui.setDisplayMode(ui.isDisplayMode());
      ui.renderSettingsForm();
      commit();
      ui.toast("Nuevo partido: " + state.home.name + " vs " + state.away.name);
    },

    resetGame: function () {
      var cfg = SB.clone(state.config);
      var homeName = state.home.name;
      var awayName = state.away.name;
      SB.history.clear();
      var fresh = SB.createState(cfg);
      fresh.home.name = homeName;
      fresh.away.name = awayName;
      setState(fresh);
      commit();
      ui.toast("Marcador reiniciado");
    },

    replaceState: function (st) {
      SB.history.clear();
      setState(st);
      SB.storage.save(state);
      ui.applyConfig();
      syncTimer();
    },

    updateConfig: function (patch) {
      Object.assign(state.config, patch);
      ui.applyConfig();
      SB.storage.schedule(state);
    },

    applyProfile: function (name) {
      var p = SB.PROFILES[name];
      if (!p) {
        state.config.profile = "CUSTOM";
        return;
      }
      Object.assign(state.config, {
        profile: name,
        periods: p.periods,
        periodMinutes: p.periodMinutes,
        periodLabel: p.periodLabel,
        shotClockSeconds: p.shotClockSeconds,
        bonusFouls: p.bonusFouls,
        timeoutsTotal: p.timeoutsTotal,
        onCourt: p.onCourt
      });
      ui.applyConfig();
      actions.resetGameClockToFull();
      actions.resetShotClock();
      SB.storage.schedule(state);
    },

    toggleSound: function () {
      state.config.sound = !state.config.sound;
      ui.applyConfig();
      SB.storage.schedule(state);
      ui.toast(state.config.sound ? "Sonido activado" : "Sonido silenciado");
    },

    undo: function () {
      var prev = SB.history.pop();
      if (!prev) { ui.toast("Nada que deshacer", true); return; }
      setState(prev);
      SB.storage.save(state);
      ui.applyConfig();
      syncTimer();
      ui.render();
      ui.toast("Deshecho");
    }
  };

  function onTimerEvent(ev) {
    switch (ev.type) {
      case "tick":
        ui.render();
        break;
      case "gcWarn":
        SB.audio.warn(ev.level);
        break;
      case "gcEnd":
        actions.endPeriod();
        break;
      case "scWarn":
        SB.audio.shotLow();
        break;
      case "scOff":
        SB.audio.shotOff();
        state.shotRunning = false;
        ui.render();
        break;
    }
  }

  function requestWakeLock() {
    if (!navigator.wakeLock || !navigator.wakeLock.request) return;
    navigator.wakeLock.request("screen").then(function (lock) {
      wakeLock = lock;
    }).catch(function () {});
  }

  function bootstrap() {
    if (!SB.storage.available()) {
      console.warn("localStorage no disponible: el marcador no se guardara entre recargas");
      SB.ui.banner("El navegador esta bloqueando el guardado automatico. Si abriste el archivo con doble clic, usa el lanzador \"Iniciar Marcador\" (doble clic) para abrirlo desde un servidor local y que el marcador se guarde al recargar. Mientras tanto, exporta el partido en Ajustes antes de cerrar.");
    }

    var restored = SB.storage.load();
    state = restored || SB.createState();

    ui = SB.ui;
    SB.ui.init(state, actions);
    SB.ui.setSaveIndicator(SB.storage.save(state));

    SB.timer.attach(getState, onTimerEvent);
    SB.shortcuts.init(getState, actions, SB.ui);

    SB.storage.onSave = function (ok) { SB.ui.setSaveIndicator(ok); };

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        SB.storage.save(state);
        if (wakeLock && wakeLock.release) wakeLock.release().catch(function () {});
      } else {
        SB.timer.resync();
        requestWakeLock();
      }
    });

    window.addEventListener("pagehide", function () { SB.storage.save(state); });
    window.addEventListener("beforeunload", function () { SB.storage.save(state); });

    ["gesturestart", "gesturechange"].forEach(function (evt) {
      document.addEventListener(evt, function (e) { e.preventDefault(); });
    });

    document.addEventListener("pointerdown", function once() {
      SB.audio.unlock();
      requestWakeLock();
      document.removeEventListener("pointerdown", once);
    }, { once: true });

    if (restored) {
      SB.ui.toast(SB.t("restored"));
    } else {
      SB.storage.save(state);
    }

    window.SBApp = { getState: getState, actions: actions, ui: SB.ui, timer: SB.timer };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootstrap);
  else bootstrap();
})();
