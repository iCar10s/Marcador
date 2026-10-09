const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadScoreboardCore() {
  const context = vm.createContext({ window: {} });
  for (const file of ["js/rules.js", "js/state.js"]) {
    const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    vm.runInContext(source, context, { filename: file });
  }
  return context.window.SB;
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
