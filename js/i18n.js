var SB = window.SB || {};

SB.LANG = "es";

SB.I18N = {
  es: {
    statusPre: "Presp. match",
    statusLive: "En juego",
    statusBreak: "Descanso",
    statusFinal: "Final",
    periodEnd: "Fin del periodo",
    periodEndNext: "Fin del periodo - siguiente: ",
    overtime: "Prórroga",
    finalGame: "Fin del partido",
    shotOff: "Posesion anulada",
    shotReset: "Posesion reiniciada a ",
    timeoutUsed: "Tiempo muerto",
    timeoutNone: "No quedan tiempos muertos",
    bonusOn: "Bonus de faltas",
    restored: "Marcador recuperado. Relojes pausados.",
    saved: "Guardado",
    saveFail: "No se pudo guardar (almacenamiento lleno)",
    playerPlaceholder: "Jugador ",
    onCourt: "en pista",
    min: "min",
    newGameConfirm: "Empezar un partido nuevo? El actual se guardara en el historial.",
    resetConfirm: "Reiniciar el marcador a 0?",
    imported: "Partido importado",
    importFail: "Archivo no valido",
    exported: "Archivo exportado",
    noSaves: "Sin partidos guardados",
    loadGame: "Cargar",
    delGame: "Borrar",
    clearSaves: "Vaciar historial",
    clockSet: "Reloj: ",
    confirm: "Si"
  },
  en: {
    statusPre: "Pre-game",
    statusLive: "Live",
    statusBreak: "Break",
    statusFinal: "Final",
    periodEnd: "End of period",
    periodEndNext: "End of period - next: ",
    overtime: "Overtime",
    finalGame: "End of game",
    shotOff: "Shot clock off",
    shotReset: "Shot clock reset to ",
    timeoutUsed: "Timeout",
    timeoutNone: "No timeouts left",
    bonusOn: "In the bonus",
    restored: "Score restored. Clocks paused.",
    saved: "Saved",
    saveFail: "Could not save (storage full)",
    playerPlaceholder: "Player ",
    onCourt: "on court",
    min: "min",
    newGameConfirm: "Start a new game? The current one is saved to history.",
    resetConfirm: "Reset the score to 0?",
    imported: "Game imported",
    importFail: "Invalid file",
    exported: "File exported",
    noSaves: "No saved games",
    loadGame: "Load",
    delGame: "Delete",
    clearSaves: "Clear history",
    clockSet: "Clock: ",
    confirm: "Yes"
  }
};

SB.t = function (key, vars) {
  var dict = SB.I18N[SB.LANG] || SB.I18N.es;
  var out = dict[key] != null ? dict[key] : (SB.I18N.es[key] != null ? SB.I18N.es[key] : key);
  if (vars) {
    Object.keys(vars).forEach(function (k) {
      out = out.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
    });
  }
  return out;
};
