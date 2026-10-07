var SB = window.SB || {};

SB.pwa = (function () {
  var deferred = null;

  function notify(msg) {
    if (SB.ui && typeof SB.ui.toast === "function") SB.ui.toast(msg);
    else console.log(msg);
  }

  var api = {
    _deferred: null,

    isInstallable: function () { return !!deferred; },

    promptInstall: function () {
      if (!deferred) return Promise.resolve("unavailable");
      var evt = deferred;
      deferred = null;
      api._deferred = null;
      evt.prompt();
      return evt.userChoice.then(function (choice) {
        return choice && choice.outcome === "accepted" ? "accepted" : "dismissed";
      });
    },

    isStandalone: function () {
      try {
        if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
      } catch (e) {}
      return !!navigator.standalone;
    },

    isIOS: function () {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    },

    showInstallInstructions: function () {
      notify("Para instalar: Compartir → Añadir a pantalla de inicio.");
    }
  };

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    api._deferred = e;
    if (SB.ui && typeof SB.ui.showInstallButton === "function") SB.ui.showInstallButton();
  });

  return api;
})();
