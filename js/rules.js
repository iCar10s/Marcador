var SB = window.SB || {};

SB.rules = (function () {
  var sports = {
    basketball: {
      label: "Baloncesto",
      profiles: {
        FIBA:   { label: "FIBA / Nacional", periods: 4, periodMinutes: 10, periodLabel: "Q", shotClockSeconds: 24, bonusFouls: 5, timeoutsTotal: 4, onCourt: 5 },
        NCAA:   { label: "NCAA",            periods: 2, periodMinutes: 20, periodLabel: "H", shotClockSeconds: 35, bonusFouls: 6, timeoutsTotal: 5, onCourt: 5 },
        NBA:    { label: "NBA",             periods: 4, periodMinutes: 12, periodLabel: "Q", shotClockSeconds: 24, bonusFouls: 6, timeoutsTotal: 7, onCourt: 5 },
        SCHOOL: { label: "Escolar",         periods: 4, periodMinutes: 8,  periodLabel: "Q", shotClockSeconds: 24, bonusFouls: 5, timeoutsTotal: 4, onCourt: 5 }
      }
    }
  };

  var PROFILE_FIELDS = ["periods", "periodMinutes", "periodLabel", "shotClockSeconds", "bonusFouls", "timeoutsTotal", "onCourt"];

  return {
    sports: sports,

    getProfile: function (sport, profileName) {
      var s = sports[sport];
      if (!s || !s.profiles[profileName]) return null;
      return SB.clone(s.profiles[profileName]);
    },

    applyProfile: function (config, sport, profileName) {
      var s = sports[sport];
      if (!s || !s.profiles[profileName]) return false;
      var p = s.profiles[profileName];
      for (var i = 0; i < PROFILE_FIELDS.length; i++) {
        var k = PROFILE_FIELDS[i];
        config[k] = p[k];
      }
      return true;
    },

    registerSport: function (name, definition) {
      sports[name] = definition;
      return sports[name];
    }
  };
})();
