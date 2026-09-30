var SB = window.SB || {};

SB.audio = (function () {
  var ctx = null;
  var enabled = true;
  var master = null;

  function ensure() {
    if (!enabled) return null;
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
      } catch (e) {
        enabled = false;
        return null;
      }
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended" && ctx.resume) {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  function tone(opts) {
    var c = ensure();
    if (!c) return;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = opts.type || "sine";
    o.frequency.setValueAtTime(opts.freq, c.currentTime);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(Math.max(30, opts.to), c.currentTime + opts.dur);
    var peak = opts.gain == null ? 0.3 : opts.gain;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(peak, c.currentTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + opts.dur);
    o.connect(g);
    g.connect(master);
    o.start(c.currentTime);
    o.stop(c.currentTime + opts.dur + 0.02);
  }

  function sequence(notes, gap) {
    var c = ensure();
    if (!c) return;
    notes.forEach(function (n, i) {
      setTimeout(function () {
        tone({ freq: n[0], dur: n[1], type: n[2] || "sine", gain: n[3] == null ? 0.32 : n[3] });
      }, i * (gap || 0) * 1000);
    });
  }

  return {
    setEnabled: function (v) { enabled = !!v; },
    isEnabled: function () { return enabled; },
    unlock: function () { ensure(); },
    point: function (value) {
      tone({ freq: value >= 3 ? 880 : 660, dur: 0.09, type: "triangle", gain: 0.18 });
      if (value >= 3) setTimeout(function () { tone({ freq: 1320, dur: 0.07, type: "triangle", gain: 0.12 }); }, 60);
    },
    foul: function () { tone({ freq: 240, dur: 0.14, type: "square", gain: 0.16 }); },
    timeout: function () { sequence([[700, 0.12, "sine"], [520, 0.18, "sine"]], 0.14); },
    warn: function (level) {
      if (level === "30") tone({ freq: 560, dur: 0.13, type: "sine", gain: 0.22 });
      else if (level === "10") sequence([[700, 0.11, "sine"], [700, 0.11, "sine"]], 0.15);
      else sequence([[880, 0.09, "square", 0.2], [880, 0.09, "square", 0.2], [880, 0.09, "square", 0.2]], 0.12);
    },
    periodEnd: function () { sequence([[1046, 0.28, "sine", 0.3], [1046, 0.28, "sine", 0.3]], 0.34); },
    shotLow: function () { tone({ freq: 1046, dur: 0.06, type: "square", gain: 0.18 }); },
    shotOff: function () { sequence([[180, 0.42, "sawtooth", 0.28]], 0); },
    click: function () { tone({ freq: 420, dur: 0.04, type: "sine", gain: 0.1 }); }
  };
})();
