var SB = window.SB || {};

SB.PROFILES = SB.rules.sports.basketball.profiles;

SB.uid = function (prefix) {
  return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
};

SB.clone = function (value) {
  return JSON.parse(JSON.stringify(value));
};

SB.makePlayer = function (num) {
  return { id: SB.uid("p"), num: String(num || ""), name: "", points: 0, fouls: 0, seconds: 0 };
};

SB.makeTeam = function (name) {
  var players = [];
  for (var i = 1; i <= 5; i++) players.push(SB.makePlayer(i));
  return { name: name, score: 0, fouls: 0, timeoutsUsed: 0, players: players };
};

SB.defaultConfig = function () {
  var p = SB.rules.sports.basketball.profiles.FIBA;
  return {
    profile: "FIBA",
    periods: p.periods,
    periodMinutes: p.periodMinutes,
    periodLabel: p.periodLabel,
    shotClockSeconds: p.shotClockSeconds,
    bonusFouls: p.bonusFouls,
    timeoutsTotal: p.timeoutsTotal,
    onCourt: p.onCourt,
    autoShotReset: true,
    countUp: false,
    showRoster: true,
    sound: true,
    theme: "dark",
    font: "digital",
    homeColor: "#f97316",
    awayColor: "#38bdf8",
    bgColor: "#0b1020",
    accentColor: "#facc15"
  };
};

SB.createState = function (config) {
  var cfg = config ? SB.clone(config) : SB.defaultConfig();
  return {
    v: 1,
    id: SB.uid("game"),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: cfg,
    home: SB.makeTeam("Local"),
    away: SB.makeTeam("Visitante"),
    period: 1,
    overtime: 0,
    gameSeconds: cfg.periodMinutes * 60,
    gameRunning: false,
    shotSeconds: cfg.shotClockSeconds,
    shotRunning: false,
    shotOff: false,
    possession: "home",
    status: "pre",
    warned: { gc: 0, sc: 0, gcRunning: false, scRunning: false }
  };
};

SB.sides = ["home", "away"];

SB.other = function (side) { return side === "home" ? "away" : "home"; };

SB.periodSeconds = function (state) {
  return Math.max(0, state.config.periodMinutes * 60);
};

SB.periodPrefix = function (state, period) {
  var p = period == null ? state.period : period;
  return p > state.config.periods ? "PR" : (state.config.periodLabel || "P");
};

SB.periodLabel = function (state, period) {
  var p = period == null ? state.period : period;
  return SB.periodPrefix(state, p) + p;
};

SB.timeoutsLeft = function (state, side) {
  return Math.max(0, state.config.timeoutsTotal - state[side].timeoutsUsed);
};

SB.isBonus = function (state, side) {
  return state[side].fouls >= state.config.bonusFouls;
};

// El reloj de posesión acompaña al reloj principal; no se ejecuta por separado.
SB.onCourtPlayers = function (state, side) {
  if (!state || !state[side] || !Array.isArray(state[side].players)) return [];
  return state[side].players.slice(0, Math.max(0, state.config.onCourt));
};

SB.shouldRunShotClock = function (state) {
  return !!(state && state.gameRunning && state.status === "live" &&
    !state.shotOff && state.shotSeconds > 0);
};

// La pantalla pública oculta la posesión cuando quedan menos de 24 segundos de juego.
SB.shouldShowPublicShotClock = function (state) {
  var remaining = state.config.countUp
    ? SB.periodSeconds(state) - state.gameSeconds
    : state.gameSeconds;
  return remaining >= 24;
};

SB.formatClock = function (seconds, countUp) {
  var neg = seconds < 0;
  var s = Math.abs(Math.floor(seconds));
  var m = Math.floor(s / 60);
  var r = s % 60;
  var sign = countUp ? "" : (neg ? "-" : "");
  return sign + (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
};

SB.formatPlayerClock = function (seconds) {
  var s = Math.max(0, Math.floor(seconds));
  return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
};

SB.migrate = function (raw) {
  if (!raw || typeof raw !== "object") return null;
  var base = SB.createState();
  var cfg = SB.defaultConfig();
  for (var k in cfg) if (raw.config && raw.config[k] !== undefined) cfg[k] = raw.config[k];
  var st = {
    v: 1,
    id: raw.id || base.id,
    createdAt: raw.createdAt || Date.now(),
    updatedAt: raw.updatedAt || Date.now(),
    config: cfg,
    home: raw.home || base.home,
    away: raw.away || base.away,
    period: typeof raw.period === "number" ? raw.period : 1,
    overtime: raw.overtime || 0,
    gameSeconds: typeof raw.gameSeconds === "number" ? raw.gameSeconds : base.gameSeconds,
    gameRunning: false,
    shotSeconds: typeof raw.shotSeconds === "number" ? raw.shotSeconds : cfg.shotClockSeconds,
    shotRunning: false,
    shotOff: !!raw.shotOff,
    possession: raw.possession === "away" ? "away" : "home",
    status: raw.status || "pre",
    warned: { gc: 0, sc: 0, gcRunning: false, scRunning: false }
  };
  SB.sides.forEach(function (side) {
    var t = st[side];
    t.score = Number(t.score) || 0;
    t.fouls = Number(t.fouls) || 0;
    t.timeoutsUsed = Number(t.timeoutsUsed) || 0;
    t.name = t.name || (side === "home" ? "Local" : "Visitante");
    t.players = (t.players && t.players.length ? t.players : []).map(function (p) {
      return {
        id: p.id || SB.uid("p"),
        num: String(p.num == null ? "" : p.num),
        name: p.name || "",
        points: Number(p.points) || 0,
        fouls: Number(p.fouls) || 0,
        seconds: Number(p.seconds) || 0
      };
    });
  });
  return st;
};

SB.history = {
  stack: [],
  limit: 60,
  push: function (state) {
    this.stack.push(SB.clone(state));
    if (this.stack.length > this.limit) this.stack.shift();
  },
  clear: function () { this.stack.length = 0; },
  pop: function () { return this.stack.pop() || null; }
};
