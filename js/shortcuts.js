var SB = window.SB || {};

SB.shortcuts = (function () {
  var actions = null;
  var ui = null;
  var getState = null;
  var helpShown = false;

  function isTyping(target) {
    if (!target) return false;
    var tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
  }

  function activeSide(state) {
    return state.possession;
  }

  function otherSideOf(state) {
    return state.possession === "home" ? "away" : "home";
  }

  function cycleActive(state, dir) {
    var side = activeSide(state);
    var list = state[side].players;
    if (!list.length) return;
    var limit = Math.min(list.length, state.config.onCourt);
    var cur = -1;
    for (var i = 0; i < limit; i++) if (list[i].id === ui.getActive(side)) cur = i;
    var next = (cur + dir + limit) % limit;
    if (cur === -1) next = dir > 0 ? 0 : limit - 1;
    actions.setActivePlayer(side, list[next].id);
    ui.toast((list[next].name || ui.escape("") || SB.t("playerPlaceholder") + (next + 1)));
  }

  function handle(e) {
    var state = getState();
    var k = e.key;

    if (k === "Escape") {
      if (ui.anyDialogOpen()) return;
      if (ui.isDisplayMode()) { ui.setDisplayMode(false); return; }
      return;
    }

    if (isTyping(e.target) || ui.anyDialogOpen()) return;
    if (e.altKey) return;

    var mod = e.ctrlKey || e.metaKey;

    if (mod && (k === "z" || k === "Z")) { e.preventDefault(); actions.undo(); return; }
    if (mod && (k === "y" || k === "Y")) { e.preventDefault(); actions.redo ? actions.redo() : actions.undo(); return; }
    if (mod && (k === "s" || k === "S")) { e.preventDefault(); actions.forceSave(); return; }
    if (mod) return;

    if (k === " " || k === "Spacebar") {
      e.preventDefault();
      if (e.shiftKey) actions.toggleShotClock();
      else actions.toggleGameClock();
      return;
    }

    switch (k) {
      case "1": case "2": case "3": {
        e.preventDefault();
        var pts = Number(k);
        var side = e.shiftKey ? otherSideOf(state) : activeSide(state);
        actions.addPoints(side, pts);
        break;
      }
      case "z": case "Z": actions.addToActive(1); break;
      case "x": case "X": actions.addToActive(2); break;
      case "c": case "C": actions.addToActive(3); break;
      case "v": case "V": actions.foulActive(); break;
      case "b": case "B": actions.addMinuteActive(); break;
      case "a": case "A": cycleActive(state, -1); break;
      case "d": case "D": cycleActive(state, 1); break;
      case "r": case "R":
        e.preventDefault();
        if (e.shiftKey) actions.toggleShotOff();
        else actions.resetShotClock();
        break;
      case "o": case "O": actions.swapPossession(); break;
      case "t": case "T": actions.useTimeout(activeSide(state)); break;
      case "p": case "P": actions.primaryAction(); break;
      case "l": case "L": ui.setDisplayMode(!ui.isDisplayMode()); break;
      case "f": case "F": e.preventDefault(); ui.toggleFullscreen(); break;
      case "m": case "M": actions.toggleSound(); break;
      case "?": case "/": showHelp(); break;
      default: return;
    }
  }

  function showHelp() {
    if (helpShown) return;
    helpShown = true;
    ui.toast("Espacio reloj · 1/2/3 puntos (Shift = otro equipo) · Z/X/C jugador · V falta · R posesión · O balón · T t. muerto · P periodo · L pantalla · F completa", true);
    setTimeout(function () { helpShown = false; }, 6000);
  }

  return {
    init: function (stateGetter, actionRef, uiRef) {
      getState = stateGetter;
      actions = actionRef;
      ui = uiRef;
      document.addEventListener("keydown", handle);
    }
  };
})();
