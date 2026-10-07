var SB = window.SB || {};

SB.storage = (function () {
  var KEY_CURRENT = "sb.autosave.current";
  var KEY_SLOTS = "sb.autosave.slots";
  var KEY_INDEX = "sb.games.index";
  var SLOT_COUNT = 4;
  var pending = null;
  var lastError = "";

  function available() {
    try {
      var k = "__sb_test__";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  var ok = available();

  function serialize(state) {
    return {
      v: state.v,
      id: state.id,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      config: state.config,
      home: state.home,
      away: state.away,
      period: state.period,
      overtime: state.overtime,
      gameSeconds: state.gameSeconds,
      shotSeconds: state.shotSeconds,
      shotOff: state.shotOff,
      possession: state.possession,
      status: state.status
    };
  }

  function readJSON(key, fallback) {
    if (!ok) return fallback;
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    if (!ok) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      lastError = (e && e.name) || "error";
      return false;
    }
  }

  function rotateSlot(payload) {
    var slots = readJSON(KEY_SLOTS, []);
    if (!Array.isArray(slots)) slots = [];
    slots.unshift({ at: Date.now(), data: payload });
    slots = slots.slice(0, SLOT_COUNT);
    writeJSON(KEY_SLOTS, slots);
  }

  var api = {
    available: function () { return ok; },
    lastError: function () { return lastError; },

    save: function (state) {
      if (!ok) return false;
      state.updatedAt = Date.now();
      var payload = serialize(state);
      var good = writeJSON(KEY_CURRENT, payload);
      if (good) rotateSlot(payload);
      return good;
    },

    schedule: function (state) {
      if (pending) clearTimeout(pending);
      pending = setTimeout(function () {
        pending = null;
        var okSave = api.save(state);
        if (api.onSave) api.onSave(okSave);
      }, 120);
    },

    load: function () {
      var candidates = [];
      var main = readJSON(KEY_CURRENT, null);
      if (main) candidates.push(main);
      var slots = readJSON(KEY_SLOTS, []);
      if (Array.isArray(slots)) {
        slots.forEach(function (s) { if (s && s.data) candidates.push(s.data); });
      }
      for (var i = 0; i < candidates.length; i++) {
        var migrated = SB.migrate(candidates[i]);
        if (migrated) return migrated;
      }
      return null;
    },

    clearAutosave: function () {
      if (!ok) return;
      localStorage.removeItem(KEY_CURRENT);
      localStorage.removeItem(KEY_SLOTS);
    },

    index: function () {
      var list = readJSON(KEY_INDEX, []);
      return Array.isArray(list) ? list : [];
    },

    archive: function (state) {
      var list = api.index();
      list = list.filter(function (e) { return e.id !== state.id; });
      list.unshift({
        id: state.id,
        at: Date.now(),
        name: state.home.name + " vs " + state.away.name,
        home: state.home.score,
        away: state.away.score,
        period: state.period,
        periods: state.config.periods,
        status: state.status,
        data: serialize(state)
      });
      writeJSON(KEY_INDEX, list.slice(0, 40));
      return list;
    },

    removeGame: function (id) {
      var list = api.index().filter(function (e) { return e.id !== id; });
      writeJSON(KEY_INDEX, list);
      return list;
    },

    clearIndex: function () {
      writeJSON(KEY_INDEX, []);
      return [];
    },

    exportFile: function (state) {
      var name = "marcador-" + state.home.name + "-vs-" + state.away.name + "-" + new Date().toISOString().slice(0, 10) + ".json";
      var blob = new Blob([JSON.stringify(api.exportPayload(state), null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = name.replace(/[^\w.\- ]+/g, "_");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    },

    exportPayload: function (state) {
      var payload = serialize(state);
      return {
        app: "marcador-basketball",
        v: state.v,
        exportedAt: new Date().toISOString(),
        config: payload.config,
        home: payload.home,
        away: payload.away,
        period: payload.period,
        overtime: payload.overtime,
        gameSeconds: payload.gameSeconds,
        shotSeconds: payload.shotSeconds,
        shotOff: payload.shotOff,
        possession: payload.possession,
        status: payload.status
      };
    },

    importFile: function (file) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onerror = function () { reject(new Error("No se pudo leer el archivo")); };
        reader.onload = function () {
          try {
            var data = JSON.parse(String(reader.result));
            var state = SB.migrate(data);
            if (!state) throw new Error("Formato no reconocido");
            resolve(state);
          } catch (e) {
            reject(e);
          }
        };
        reader.readAsText(file);
      });
    },

    estimateUsage: function () {
      if (!ok) return 0;
      var total = 0;
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf("sb.") === 0) total += (localStorage.getItem(k) || "").length + k.length;
        }
      } catch (e) {
        return 0;
      }
      return total;
    }
  };

  api.onSave = null;
  api.save.lastOk = true;

  var nativeSave = api.save;
  api.save = function (state) {
    var res = nativeSave(state);
    api.save.lastOk = res;
    return res;
  };

  return api;
})();
