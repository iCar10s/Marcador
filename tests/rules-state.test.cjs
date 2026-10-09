const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadScoreboardCore() {
  const context = vm.createContext({});
  context.window = context;
  for (const file of ["js/rules.js", "js/state.js"]) {
    const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    vm.runInContext(source, context, { filename: file });
  }
  return context.SB;
}

test("FIBA profile defines the standard four periods and 24-second shot clock", () => {
  const SB = loadScoreboardCore();
  const profile = SB.rules.getProfile("basketball", "FIBA");

  assert.equal(profile.periods, 4);
  assert.equal(profile.periodMinutes, 10);
  assert.equal(profile.periodLabel, "Q");
  assert.equal(profile.shotClockSeconds, 24);
  assert.equal(profile.onCourt, 5);
});

test("getProfile returns an independent copy", () => {
  const SB = loadScoreboardCore();
  const profile = SB.rules.getProfile("basketball", "FIBA");

  profile.periods = 99;

  assert.equal(SB.rules.getProfile("basketball", "FIBA").periods, 4);
});

test("applyProfile updates profile fields and rejects unknown profiles", () => {
  const SB = loadScoreboardCore();
  const config = SB.defaultConfig();

  assert.equal(SB.rules.applyProfile(config, "basketball", "SCHOOL"), true);
  assert.equal(config.periods, 4);
  assert.equal(config.periodMinutes, 8);
  assert.equal(config.shotClockSeconds, 24);

  const before = JSON.stringify(config);
  assert.equal(SB.rules.applyProfile(config, "basketball", "UNKNOWN"), false);
  assert.equal(JSON.stringify(config), before);
});

test("new match starts stopped with two teams and five initial players per team", () => {
  const SB = loadScoreboardCore();
  const state = SB.createState();

  assert.equal(state.gameRunning, false);
  assert.equal(state.shotRunning, false);
  assert.equal(state.home.players.length, 5);
  assert.equal(state.away.players.length, 5);
  assert.equal(state.home.score, 0);
  assert.equal(state.away.score, 0);
  assert.equal(state.possession, "home");
});

test("period labels switch to overtime after configured regulation periods", () => {
  const SB = loadScoreboardCore();
  const state = SB.createState();

  assert.equal(SB.periodLabel(state, 1), "Q1");
  assert.equal(SB.periodLabel(state, 4), "Q4");
  assert.equal(SB.periodLabel(state, 5), "PR5");
  assert.equal(SB.periodLabel(state, 6), "PR6");
});

test("team bonus is based on the configured team-foul threshold", () => {
  const SB = loadScoreboardCore();
  const state = SB.createState();

  state.home.fouls = 4;
  assert.equal(SB.isBonus(state, "home"), false);

  state.home.fouls = 5;
  assert.equal(SB.isBonus(state, "home"), true);
});

test("timeout count never reports a negative number remaining", () => {
  const SB = loadScoreboardCore();
  const state = SB.createState();

  state.home.timeoutsUsed = state.config.timeoutsTotal + 2;
  assert.equal(SB.timeoutsLeft(state, "home"), 0);
});

test("shot clock follows the game clock and stops when the game is paused", () => {
  const SB = loadScoreboardCore();
  const state = SB.createState();

  assert.equal(SB.shouldRunShotClock(state), false);
  state.status = "live";
  state.gameRunning = true;
  assert.equal(SB.shouldRunShotClock(state), true);

  state.gameRunning = false;
  assert.equal(SB.shouldRunShotClock(state), false);

  state.gameRunning = true;
  state.shotOff = true;
  assert.equal(SB.shouldRunShotClock(state), false);

  state.shotOff = false;
  state.shotSeconds = 0;
  assert.equal(SB.shouldRunShotClock(state), false);
});

test("public lineup contains only on-court players and follows substitutions", () => {
  const SB = loadScoreboardCore();
  const state = SB.createState();
  state.home.players = Array.from({ length: 8 }, (_, i) => ({ id: String(i + 1), num: String(i + 1), name: `Player ${i + 1}` }));

  assert.deepEqual(SB.onCourtPlayers(state, "home").map((p) => p.id), ["1", "2", "3", "4", "5"]);
  [state.home.players[0], state.home.players[5]] = [state.home.players[5], state.home.players[0]];
  assert.deepEqual(SB.onCourtPlayers(state, "home").map((p) => p.id), ["6", "2", "3", "4", "5"]);
});

test("public display hides possession clock below 24 seconds remaining", () => {
  const SB = loadScoreboardCore();
  const state = SB.createState();

  state.gameSeconds = 24;
  assert.equal(SB.shouldShowPublicShotClock(state), true);

  state.gameSeconds = 23.9;
  assert.equal(SB.shouldShowPublicShotClock(state), false);

  state.config.countUp = true;
  state.gameSeconds = SB.periodSeconds(state) - 24;
  assert.equal(SB.shouldShowPublicShotClock(state), true);

  state.gameSeconds = SB.periodSeconds(state) - 23.9;
  assert.equal(SB.shouldShowPublicShotClock(state), false);
});


test("shot clock advances with game clock even if shotRunning was not toggled", () => {
  let scheduled = null;
  const context = vm.createContext({});
  context.window = context;
  context.__now = 1000;
  context.Date = class FakeDate { static now() { return context.__now; } };
  context.setTimeout = (callback) => { scheduled = callback; return 1; };
  context.clearTimeout = () => { scheduled = null; };
  for (const file of ["js/rules.js", "js/state.js", "js/timer.js"]) {
    const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    vm.runInContext(source, context, { filename: file });
  }
  const state = context.SB.createState();
  state.status = "live";
  state.gameRunning = true;
  state.shotRunning = false;
  state.gameSeconds = 600;
  state.shotSeconds = 24;
  context.SB.timer.attach(() => state, () => {});
  context.SB.timer.start();

  context.__now += 1000;
  const tick = scheduled;
  scheduled = null;
  tick();

  assert.equal(state.gameSeconds, 599);
  assert.equal(state.shotSeconds, 23);
  assert.equal(state.shotRunning, true);
  context.SB.timer.stop();
});

test("shot clock resets to configured 24 seconds when a 14-second adjustment expires", () => {
  let scheduled = null;
  const context = vm.createContext({});
  context.window = context;
  context.__now = 1000;
  context.Date = class FakeDate { static now() { return context.__now; } };
  context.setTimeout = (callback) => { scheduled = callback; return 1; };
  context.clearTimeout = () => { scheduled = null; };
  for (const file of ["js/rules.js", "js/state.js", "js/timer.js"]) {
    const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    vm.runInContext(source, context, { filename: file });
  }
  const state = context.SB.createState();
  state.status = "live";
  state.gameRunning = true;
  state.shotRunning = true;
  state.gameSeconds = 600;
  state.config.shotClockSeconds = 24;
  state.shotSeconds = 14;
  context.SB.timer.attach(() => state, () => {});
  context.SB.timer.start();

  context.__now += 14000;
  const tick = scheduled;
  scheduled = null;
  tick();

  assert.equal(state.shotSeconds, 24);
  assert.equal(state.shotRunning, true);
  context.SB.timer.stop();
});
