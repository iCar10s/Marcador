var SB = window.SB || {};

SB.ui = (function () {
  var state = null;
  var actions = null;
  var el = {};
  var rosterSig = { home: "", away: "" };
  var publicRosterSig = { home: "", away: "" };
  var active = { home: null, away: null };
  var toastTimer = null;
  var displayMode = false;

  function $(id) { return document.getElementById(id); }

  function cache() {
    [
      "homeName", "awayName", "homeLogo", "awayLogo", "homeLogoButton", "awayLogoButton", "homeLogoRemove", "awayLogoRemove", "homeLogoFile", "awayLogoFile", "homeScore", "awayScore", "homeFouls", "awayFouls",
      "homeDots", "awayDots", "homeTmsLeft", "awayTmsLeft", "homeBonus", "awayBonus",
      "homePoss", "awayPoss", "homeRoster", "awayRoster", "gameClock", "gameClockBox",
      "shotClock", "shotBox", "periodNum", "periodLabel", "periodDown", "periodUp",
      "chipStatus", "btnStart", "btnStop", "btnTimeoutHome", "btnTimeoutAway", "btnPossSwitch", "saveState", "toast", "board",
      "dlgSettings", "dlgRoster", "editHome", "editAway", "rosterTitleHome", "rosterTitleAway",
      "saveList", "fileImport", "btnUndo", "publicView", "pubClock", "pubPeriod",
      "pubShot", "pubStatus", "pubHomeName", "pubAwayName", "pubHomeScore",
      "pubAwayScore", "pubHomeFouls", "pubAwayFouls", "pubPossHome", "pubPossAway", "pubHomePlayers", "pubAwayPlayers", "pubHomeBench", "pubAwayBench", "pubHomeLogo", "pubAwayLogo"
    ].forEach(function (id) { el[id] = $(id); });

    el.setProfile = $("setProfile");
    el.setPeriods = $("setPeriods");
    el.setPeriodMinutes = $("setPeriodMinutes");
    el.setPeriodLabel = $("setPeriodLabel");
    el.setShotClock = $("setShotClock");
    el.setBonusFouls = $("setBonusFouls");
    el.setTimeouts = $("setTimeouts");
    el.setOnCourt = $("setOnCourt");
    el.setAutoShotReset = $("setAutoShotReset");
    el.setCountUp = $("setCountUp");
    el.setShowRoster = $("setShowRoster");
    el.setSound = $("setSound");
    el.setHomeColor = $("setHomeColor");
    el.setAwayColor = $("setAwayColor");
    el.setBgColor = $("setBgColor");
    el.setAccentColor = $("setAccentColor");
    el.setFont = $("setFont");
    el.setTheme = $("setTheme");
  }

  function applyConfig() {
    var c = state.config;
    var root = document.documentElement;
    root.dataset.theme = c.theme;
    root.dataset.font = c.font;
    root.style.setProperty("--home-color", c.homeColor);
    root.style.setProperty("--away-color", c.awayColor);
    root.style.setProperty("--bg", c.bgColor);
    root.style.setProperty("--accent", c.accentColor);
    document.body.classList.toggle("no-roster", !c.showRoster);
    SB.audio.setEnabled(c.sound);
  }

  function teamColor(side) {
    return side === "home" ? state.config.homeColor : state.config.awayColor;
  }

  function buildRosterItem(side, player, index) {
    var li = document.createElement("li");
    li.className = "player";
    li.draggable = true;
    li.title = "Arrastra esta tarjeta sobre el jugador con el que deseas hacer el cambio";
    li.style.setProperty("--team", teamColor(side));
    li.dataset.id = player.id;
    li.dataset.side = side;
    li.innerHTML =
      '<div class="player__top">' +
        '<input class="player__num" type="number" min="0" max="99" inputmode="numeric" aria-label="Número de camiseta" title="Editar número de camiseta">' +
        '<input class="player__name" type="text" maxlength="20" spellcheck="false" aria-label="Nombre del jugador">' +
        '<span class="player__pts">0</span>' +
      '</div>' +
      '<div class="player__bot">' +
        '<button class="mini mini--pts" data-act="pts" data-p="1" type="button">+1</button>' +
        '<button class="mini mini--pts" data-act="pts" data-p="2" type="button">+2</button>' +
        '<button class="mini mini--pts" data-act="pts" data-p="3" type="button">+3</button>' +
        '<button class="mini mini--foul" data-act="foul" type="button" title="Falta personal">F<b>0</b></button>' +
        '<button class="mini mini--time" data-act="time" type="button" title="Minutos jugados (+30s al tocar)">0:00</button>' +
        '<button class="mini mini--sub" data-act="sub" type="button" title="Cambio (meter/sacar)">&#8646;</button>' +
      '</div>';
    li.querySelector(".player__name").placeholder = SB.t("playerPlaceholder") + (index + 1);
    return li;
  }

  function rosterSignature(side) {
    return state[side].players.map(function (p) { return p.id; }).join("|");
  }

  function renderRoster(side) {
    var list = side === "home" ? el.homeRoster : el.awayRoster;
    var sig = rosterSignature(side) + "#" + state.config.onCourt;
    if (rosterSig[side] === sig) { paintRoster(side, list); return; }
    rosterSig[side] = sig;
    list.textContent = "";
    state[side].players.forEach(function (p, i) {
      list.appendChild(buildRosterItem(side, p, i));
    });
    paintRoster(side, list);
  }

  function paintRoster(side, list) {
    var onCourt = state.config.onCourt;
    state[side].players.forEach(function (p, i) {
      var li = list.children[i];
      if (!li) return;
      var nameInput = li.querySelector(".player__name");
      if (nameInput !== document.activeElement && nameInput.value !== p.name) nameInput.value = p.name;
      var num = li.querySelector(".player__num");
      var numText = p.num === "" ? (i + 1) + "" : p.num;
      if (num !== document.activeElement && num.value !== numText) num.value = numText;
      li.querySelector(".player__pts").textContent = String(p.points);
      var foulBtn = li.querySelector(".mini--foul");
      foulBtn.querySelector("b").textContent = String(p.fouls);
      li.querySelector(".mini--time").textContent = SB.formatPlayerClock(p.seconds);
      li.classList.toggle("player--fouled", p.fouls >= state.config.bonusFouls);
      li.classList.toggle("player--bench", i >= onCourt);
      li.classList.toggle("player--active", active[side] === p.id);
    });
  }

  function renderDots(side) {
    var wrap = side === "home" ? el.homeDots : el.awayDots;
    var total = state.config.timeoutsTotal;
    var used = state[side].timeoutsUsed;
    var sig = total + ":" + used;
    if (wrap.dataset.sig !== sig) {
      wrap.dataset.sig = sig;
      wrap.textContent = "";
      for (var i = 0; i < total; i++) {
        var d = document.createElement("span");
        d.className = "dot";
        wrap.appendChild(d);
      }
    }
    for (var j = 0; j < wrap.children.length; j++) {
      wrap.children[j].className = "dot " + (j < used ? "dot--used" : "dot--left");
    }
    var left = SB.timeoutsLeft(state, side);
    var label = side === "home" ? el.homeTmsLeft : el.awayTmsLeft;
    label.textContent = total ? "(" + left + ")" : "";
  }

  function renderTeam(side) {
    var t = state[side];
    var prefix = side === "home" ? "home" : "away";
    var nameInput = $(prefix + "Name");
    if (nameInput !== document.activeElement && nameInput.value !== t.name) nameInput.value = t.name;
    var logo = $(prefix + "Logo");
    var logoButton = $(prefix + "LogoButton");
    var logoRemove = $(prefix + "LogoRemove");
    if (logo) {
      if (logo.src !== t.logo && t.logo) logo.src = t.logo;
      if (!t.logo) logo.removeAttribute("src");
      logo.hidden = !t.logo;
      logoButton.hidden = false;
      logoButton.textContent = t.logo ? "Cambiar" : "Imagen";
      logoRemove.hidden = !t.logo;
    }
    $(prefix + "Score").textContent = String(t.score);
    $(prefix + "Fouls").textContent = String(t.fouls);
    $(prefix + "Bonus").hidden = !SB.isBonus(state, side);
    $(prefix + "Poss").hidden = state.possession !== side;
    renderDots(side);
    renderRoster(side);
  }

  function renderClocks() {
    var gc = el.gameClock;
    gc.textContent = SB.formatClock(state.gameSeconds, state.config.countUp);
    gc.classList.toggle("clock--run", state.gameRunning);
    var limit = SB.periodSeconds(state);
    var left = state.config.countUp ? limit - state.gameSeconds : state.gameSeconds;
    gc.classList.toggle("clock--low", left <= 10 && state.status === "live");
    gc.classList.toggle("clock--run", state.gameRunning);
    el.gameClockBox.classList.toggle("clockbox--low", left <= 10 && state.status === "live");

    var sc = el.shotClock;
    sc.textContent = state.shotOff ? "--" : String(Math.ceil(state.shotSeconds));
    el.shotBox.classList.toggle("shotbox--on", state.shotRunning && !state.shotOff);
    el.shotBox.classList.toggle("shotbox--off", state.shotOff);
    el.shotBox.classList.toggle("shotbox--low", !state.shotOff && state.shotSeconds <= 5);

    el.periodNum.textContent = SB.periodLabel(state);
    el.periodLabel.textContent = state.period > state.config.periods ? SB.t("overtime") : "Periodo";
  }

  function renderStatus() {
    var map = { pre: "statusPre", live: "statusLive", break: "statusBreak", final: "statusFinal" };
    el.chipStatus.textContent = SB.t(map[state.status] || "statusPre");
    el.chipStatus.dataset.live = state.status === "live" ? "1" : state.status === "break" ? "2" : "0";

    var label;
    if (state.status === "pre") label = "Iniciar partido";
    else if (state.status === "live") label = "Terminar periodo";
    else if (state.status === "break") label = "Empezar " + SB.periodLabel(state, state.period + 1);
    else label = "Archivar y empezar otro";
    el.btnStart.textContent = label;
    el.btnStart.classList.toggle("btn--go", state.status === "pre" || state.status === "break");
    el.btnStop.hidden = state.status !== "live";
    el.btnUndo.disabled = !SB.history.stack.length;
    el.btnTimeoutHome.textContent = "T. muerto · " + state.home.name;
    el.btnTimeoutAway.textContent = "T. muerto · " + state.away.name;
  }

  function renderPublicPlayers(side) {
    var team = state[side];
    var onCourtList = side === "home" ? el.pubHomePlayers : el.pubAwayPlayers;
    var benchList = side === "home" ? el.pubHomeBench : el.pubAwayBench;
    if (!onCourtList || !benchList) return;
    var on = Math.min(state.config.onCourt, team.players.length);
    var signature = team.players.map(function (p, i) {
      return p.id + ":" + p.num + ":" + p.name + ":" + (i < on ? "court" : "bench");
    }).join("|");
    if (publicRosterSig[side] === signature &&
        onCourtList.children.length === on &&
        benchList.children.length === team.players.length - on) return;
    publicRosterSig[side] = signature;
    onCourtList.textContent = "";
    benchList.textContent = "";
    team.players.forEach(function (player, index) {
      var item = document.createElement("li");
      item.className = "pub__player " + (index < on ? "pub__player--active" : "pub__player--bench");
      var number = document.createElement("span");
      number.className = "pub__player-num";
      number.textContent = player.num === "" ? String(index + 1) : String(player.num);
      var name = document.createElement("span");
      name.className = "pub__player-name";
      name.textContent = player.name || ("Jugador " + (index + 1));
      var status = document.createElement("span");
      status.className = "pub__player-status";
      status.textContent = index < on ? "CANCHA" : "BANCA";
      item.appendChild(number);
      item.appendChild(name);
      item.appendChild(status);
      (index < on ? onCourtList : benchList).appendChild(item);
    });
  }

  function renderPublic() {
    el.pubClock.textContent = SB.formatClock(state.gameSeconds, state.config.countUp);
    var limit = SB.periodSeconds(state);
    var left = state.config.countUp ? limit - state.gameSeconds : state.gameSeconds;
    el.pubClock.classList.toggle("low", left <= 10 && state.status === "live");
    el.pubPeriod.textContent = SB.periodLabel(state);
    el.publicView.classList.toggle("public--hide-shot", !SB.shouldShowPublicShotClock(state));
    el.pubShot.textContent = state.shotOff ? "--" : String(Math.ceil(state.shotSeconds));
    el.pubShot.classList.toggle("off", state.shotOff);
    el.pubHomeName.textContent = state.home.name;
    el.pubAwayName.textContent = state.away.name;
    [ ["home", el.pubHomeLogo], ["away", el.pubAwayLogo] ].forEach(function (entry) {
      var team = state[entry[0]], logo = entry[1];
      if (!logo) return;
      if (team.logo && logo.src !== team.logo) logo.src = team.logo;
      if (!team.logo) logo.removeAttribute("src");
      logo.hidden = !team.logo;
    });
    el.pubHomeScore.textContent = String(state.home.score);
    el.pubAwayScore.textContent = String(state.away.score);
    el.pubHomeFouls.textContent = String(state.home.fouls);
    el.pubAwayFouls.textContent = String(state.away.fouls);
    var map = { pre: "Previo", live: "En juego", break: "Pausa", final: "Finalizado" };
    el.pubStatus.textContent = map[state.status] || "Previo";
    el.pubStatus.dataset.live = state.status === "live" ? "1" : "0";
    el.pubPossHome.classList.toggle("on", state.possession === "home");
    el.pubPossAway.classList.toggle("on", state.possession === "away");
    renderPublicPlayers("home");
    renderPublicPlayers("away");
  }

  function render() {
    renderTeam("home");
    renderTeam("away");
    renderClocks();
    renderStatus();
    renderPublic();
  }

  function renderSettingsForm() {
    var c = state.config;
    el.setProfile.value = c.profile;
    el.setPeriods.value = c.periods;
    el.setPeriodMinutes.value = c.periodMinutes;
    el.setPeriodLabel.value = c.periodLabel;
    el.setShotClock.value = c.shotClockSeconds;
    el.setBonusFouls.value = c.bonusFouls;
    el.setTimeouts.value = c.timeoutsTotal;
    el.setOnCourt.value = c.onCourt;
    el.setAutoShotReset.checked = !!c.autoShotReset;
    el.setCountUp.checked = !!c.countUp;
    el.setShowRoster.checked = !!c.showRoster;
    el.setSound.checked = !!c.sound;
    el.setHomeColor.value = c.homeColor;
    el.setAwayColor.value = c.awayColor;
    el.setBgColor.value = c.bgColor;
    el.setAccentColor.value = c.accentColor;
    el.setFont.value = c.font;
    el.setTheme.value = c.theme;
  }

  function buildEditorItem(side, p, i) {
    var li = document.createElement("li");
    li.className = "pedit";
    li.dataset.id = p.id;
    li.innerHTML =
      '<input class="pedit__num" type="number" min="0" max="99" value="' + p.num + '" aria-label="Numero">' +
      '<input class="pedit__name" type="text" maxlength="20" value="" placeholder="Nombre" spellcheck="false" aria-label="Nombre">' +
      '<button class="btn btn--sm pedit__del" data-act="del" type="button" title="Quitar">&minus;</button>';
    li.querySelector(".pedit__name").value = p.name;
    return li;
  }

  function renderRosterEditor() {
    SB.sides.forEach(function (side) {
      var list = side === "home" ? el.editHome : el.editAway;
      var sig = rosterSignature(side);
      if (list.dataset.sig !== sig) {
        list.dataset.sig = sig;
        list.textContent = "";
        state[side].players.forEach(function (p, i) {
          list.appendChild(buildEditorItem(side, p, i));
        });
      }
      state[side].players.forEach(function (p, i) {
        var li = list.children[i];
        if (!li) return;
        var numInput = li.querySelector(".pedit__num");
        var nameInput = li.querySelector(".pedit__name");
        if (numInput !== document.activeElement) numInput.value = p.num;
        if (nameInput !== document.activeElement) nameInput.value = p.name;
      });
      var title = side === "home" ? el.rosterTitleHome : el.rosterTitleAway;
      title.textContent = state[side].name;
    });
  }

  function renderSaveList() {
    var list = SB.storage.index();
    el.saveList.textContent = "";
    if (!list.length) {
      var empty = document.createElement("li");
      empty.innerHTML = '<span>' + SB.t("noSaves") + '</span>';
      el.saveList.appendChild(empty);
      return;
    }
    list.forEach(function (entry) {
      var li = document.createElement("li");
      var d = new Date(entry.at);
      li.innerHTML =
        '<span class="grow"><b>' + escapeHtml(entry.name) + "</b> " + entry.home + " - " + entry.away +
        ' <span>· ' + SB.periodLabel({ period: entry.period, config: { periods: entry.periods } }, entry.period) +
        " · " + d.toLocaleString() + "</span></span>";
      var load = document.createElement("button");
      load.type = "button";
      load.className = "btn btn--sm";
      load.textContent = SB.t("loadGame");
      load.dataset.load = entry.id;
      var del = document.createElement("button");
      del.type = "button";
      del.className = "btn btn--sm btn--warn";
      del.textContent = SB.t("delGame");
      del.dataset.del = entry.id;
      li.appendChild(load);
      li.appendChild(del);
      el.saveList.appendChild(li);
    });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  function toast(msg, warn) {
    el.toast.textContent = msg;
    el.toast.classList.toggle("toast--warn", !!warn);
    el.toast.classList.add("toast--on");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove("toast--on"); }, 2600);
  }

  function setSaveIndicator(ok) {
    el.saveState.textContent = ok ? SB.t("saved") : SB.t("saveFail");
    el.saveState.dataset.save = ok ? "1" : "0";
  }

  function findPlayer(side, id) {
    var list = state[side].players;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function findPlayerFromEvent(target) {
    var li = target.closest("li.player");
    if (!li) return null;
    var side = li.dataset.side;
    var id = li.dataset.id;
    return { side: side, player: findPlayer(side, id), id: id };
  }

  function bind() {
    el.homeName.addEventListener("input", function () { actions.renameTeam("home", this.value); });
    el.awayName.addEventListener("input", function () { actions.renameTeam("away", this.value); });

    ["home", "away"].forEach(function (side) {
      var prefix = side === "home" ? "home" : "away";
      el[prefix + "LogoButton"].addEventListener("click", function () { el[prefix + "LogoFile"].click(); });
      el[prefix + "LogoRemove"].addEventListener("click", function () {
        actions.setTeamLogo(side, "");
        el[prefix + "LogoFile"].value = "";
        render();
        toast("Imagen del equipo eliminada");
      });
      el[prefix + "LogoFile"].addEventListener("change", function () {
        var file = this.files && this.files[0];
        var input = this;
        if (!file) return;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
          toast("Formato no válido. Usa PNG, JPG o WebP.", true);
          input.value = "";
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          toast("La imagen supera el máximo de 2 MB.", true);
          input.value = "";
          return;
        }
        var reader = new FileReader();
        reader.onerror = function () { toast("No se pudo leer la imagen.", true); input.value = ""; };
        reader.onload = function () {
          var source = new Image();
          source.onerror = function () { toast("El archivo no contiene una imagen válida.", true); input.value = ""; };
          source.onload = function () {
            var maxSide = 192;
            var scale = Math.min(1, maxSide / Math.max(source.naturalWidth, source.naturalHeight));
            var canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
            var ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
            var dataUrl = canvas.toDataURL("image/webp", 0.72);
            if (dataUrl.length > 35000) {
              toast("La imagen optimizada sigue siendo demasiado grande. Prueba con otra imagen.", true);
              input.value = "";
              return;
            }
            actions.setTeamLogo(side, dataUrl);
            render();
            toast("Imagen del equipo actualizada");
            input.value = "";
          };
          source.src = String(reader.result);
        };
        reader.readAsDataURL(file);
      });
    });

    el.homeScore.addEventListener("click", function () { actions.addPoints("home", -1); });
    el.awayScore.addEventListener("click", function () { actions.addPoints("away", -1); });

    el.gameClock.addEventListener("click", function () { actions.toggleGameClock(); });
    el.shotClock.addEventListener("click", function () { actions.toggleShotClock(); });
    el.periodUp.addEventListener("click", function () { actions.changePeriod(1); });
    el.periodDown.addEventListener("click", function () { actions.changePeriod(-1); });

    el.btnStart.addEventListener("click", function () { actions.primaryAction(); });
    el.btnStop.addEventListener("click", function () { actions.endPeriod(); });
    el.btnTimeoutHome.addEventListener("click", function () { actions.useTimeout("home"); });
    el.btnTimeoutAway.addEventListener("click", function () { actions.useTimeout("away"); });
    el.btnPossSwitch.addEventListener("click", function () { actions.swapPossession(); });
    el.homePoss.addEventListener("click", function () { actions.swapPossession(); });
    el.awayPoss.addEventListener("click", function () { actions.swapPossession(); });
    el.btnUndo.addEventListener("click", function () { actions.undo(); });

    el.board.addEventListener("input", function (e) {
      if (!e.target.classList.contains("player__num")) return;
      var found = findPlayerFromEvent(e.target);
      if (found && found.player) actions.setPlayerField(found.side, found.id, "num", e.target.value);
    });

    el.board.addEventListener("click", function (e) {
      var t = e.target;
      var pt = t.closest("[data-pts]");
      if (pt) { actions.addPoints(pt.dataset.side, Number(pt.dataset.pts)); return; }
      var foul = t.closest("[data-foul]");
      if (foul) { actions.addTeamFoul(foul.dataset.side, Number(foul.dataset.foul)); return; }
      var tm = t.closest("[data-tm]");
      if (tm) { actions.addTimeout(tm.dataset.side, Number(tm.dataset.tm)); return; }
      var gc = t.closest("[data-gc]");
      if (gc) { actions.adjustGameClock(gc.dataset.gc); return; }
      var sc = t.closest("[data-sc]");
      if (sc) { actions.adjustShotClock(sc.dataset.sc); return; }
      var mini = t.closest(".mini");
      if (mini) {
        var found = findPlayerFromEvent(mini);
        if (found && found.player) {
          if (mini.dataset.act === "pts") actions.addPlayerPoints(found.side, found.id, Number(mini.dataset.p));
          else if (mini.dataset.act === "foul") actions.addPlayerFoul(found.side, found.id);
          else if (mini.dataset.act === "time") actions.addPlayerSeconds(found.side, found.id);
          else if (mini.dataset.act === "sub") actions.subPlayer(found.side, found.id);
        }
        return;
      }
      var card = t.closest("li.player");
      if (card) {
        var f2 = findPlayerFromEvent(card);
        if (f2) actions.setActivePlayer(f2.side, f2.id);
      }
    });

    [el.homeRoster, el.awayRoster].forEach(function (wrap) {
      var draggedId = null;
      var draggedSide = null;
      var pointerStart = null;
      var pointerDrag = false;

      function clearDragStyles() {
        wrap.querySelectorAll(".player--dragging, .player--drop-target").forEach(function (node) {
          node.classList.remove("player--dragging", "player--drop-target");
        });
      }

      function swapDropTarget(target) {
        if (!target || !draggedId || target.dataset.side !== draggedSide || target.dataset.id === draggedId) return false;
        actions.swapPlayers(draggedSide, draggedId, target.dataset.id);
        draggedId = null;
        draggedSide = null;
        pointerStart = null;
        pointerDrag = false;
        clearDragStyles();
        render();
        return true;
      }

      // Arrastre nativo para ratón/escritorio.
      wrap.addEventListener("dragstart", function (e) {
        var card = e.target.closest("li.player");
        if (!card || e.target.closest("input, button")) { e.preventDefault(); return; }
        draggedId = card.dataset.id;
        draggedSide = card.dataset.side;
        card.classList.add("player--dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", draggedSide + ":" + draggedId);
        }
      });
      wrap.addEventListener("dragover", function (e) {
        var card = e.target.closest("li.player");
        if (!card || !draggedId || card.dataset.side !== draggedSide || card.dataset.id === draggedId) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        clearDragStyles();
        card.classList.add("player--drop-target");
      });
      wrap.addEventListener("drop", function (e) {
        var card = e.target.closest("li.player");
        if (!card || !draggedId || card.dataset.side !== draggedSide || card.dataset.id === draggedId) return;
        e.preventDefault();
        swapDropTarget(card);
      });
      wrap.addEventListener("dragend", function () {
        draggedId = null;
        draggedSide = null;
        clearDragStyles();
      });

      // Arrastre táctil: iniciar desde el asa para no interferir con la edición de campos.
      wrap.addEventListener("pointerdown", function (e) {
        var handle = e.target.closest(".player__drag");
        var card = handle && handle.closest("li.player");
        if (!card || e.pointerType === "mouse") return;
        draggedId = card.dataset.id;
        draggedSide = card.dataset.side;
        pointerStart = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
        pointerDrag = false;
      });
      wrap.addEventListener("pointermove", function (e) {
        if (!pointerStart || pointerStart.pointerId !== e.pointerId) return;
        if (!pointerDrag && Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) > 8) {
          pointerDrag = true;
          var source = wrap.querySelector('li.player[data-id="' + draggedId + '"]');
          if (source) source.classList.add("player--dragging");
        }
        if (!pointerDrag) return;
        var target = document.elementFromPoint(e.clientX, e.clientY);
        var card = target && target.closest("li.player");
        clearDragStyles();
        var source = wrap.querySelector('li.player[data-id="' + draggedId + '"]');
        if (source) source.classList.add("player--dragging");
        if (card && card.dataset.side === draggedSide && card.dataset.id !== draggedId) card.classList.add("player--drop-target");
        e.preventDefault();
      });
      wrap.addEventListener("pointerup", function (e) {
        if (!pointerStart || pointerStart.pointerId !== e.pointerId) return;
        var wasDrag = pointerDrag;
        var target = document.elementFromPoint(e.clientX, e.clientY);
        var card = target && target.closest("li.player");
        if (wasDrag) {
          e.preventDefault();
          swapDropTarget(card);
        }
        draggedId = null;
        draggedSide = null;
        pointerStart = null;
        pointerDrag = false;
        clearDragStyles();
      });
      wrap.addEventListener("pointercancel", function () {
        draggedId = null;
        draggedSide = null;
        pointerStart = null;
        pointerDrag = false;
        clearDragStyles();
      });

      wrap.addEventListener("input", function (e) {
        if (!e.target.classList.contains("player__name")) return;
        var f = findPlayerFromEvent(e.target);
        if (f && f.player) actions.setPlayerField(f.side, f.id, "name", e.target.value);
      });
    });

    document.querySelectorAll("[data-addplayer]").forEach(function (b) {
      b.addEventListener("click", function () {
        actions.addPlayer(this.dataset.addplayer);
        renderRosterEditor();
      });
    });

    el.dlgRoster.addEventListener("click", function (e) {
      var del = e.target.closest("[data-act=del]");
      if (del) {
        var li = del.closest("li.pedit");
        actions.removePlayer(li.parentElement.dataset.side || currentEditorSide(li), li.dataset.id);
        renderRosterEditor();
        render();
      }
    });

    el.dlgRoster.addEventListener("input", function (e) {
      var li = e.target.closest("li.pedit");
      if (!li) return;
      var side = currentEditorSide(li);
      if (e.target.classList.contains("pedit__num")) actions.setPlayerField(side, li.dataset.id, "num", e.target.value);
      else if (e.target.classList.contains("pedit__name")) actions.setPlayerField(side, li.dataset.id, "name", e.target.value);
    });

    var cfgMap = {
      setProfile: "profile", setPeriods: "periods", setPeriodMinutes: "periodMinutes",
      setPeriodLabel: "periodLabel", setShotClock: "shotClockSeconds", setBonusFouls: "bonusFouls",
      setTimeouts: "timeoutsTotal", setOnCourt: "onCourt", setHomeColor: "homeColor",
      setAwayColor: "awayColor", setBgColor: "bgColor", setAccentColor: "accentColor",
      setFont: "font", setTheme: "theme"
    };
    var boolMap = {
      setAutoShotReset: "autoShotReset", setCountUp: "countUp",
      setShowRoster: "showRoster", setSound: "sound"
    };

    Object.keys(cfgMap).forEach(function (id) {
      var node = el[id];
      var key = cfgMap[id];
      node.addEventListener("input", function () {
        var v = this.value;
        if (this.type === "number") v = Number(v);
        if (id === "setProfile") { actions.applyProfile(v); renderSettingsForm(); render(); return; }
        actions.updateConfig((function () { var o = {}; o[key] = v; return o; })());
        if (id === "setPeriodMinutes") actions.resetGameClockToFull();
        if (id === "setShotClock") actions.resetShotClock();
        render();
        renderSettingsForm();
      });
      node.addEventListener("change", function () {
        if (cfgMap[id] === "font" || cfgMap[id] === "theme") renderSettingsForm();
      });
    });

    Object.keys(boolMap).forEach(function (id) {
      el[id].addEventListener("change", function () {
        var o = {};
        o[boolMap[id]] = this.checked;
        actions.updateConfig(o);
        render();
      });
    });

    $("btnSettings").addEventListener("click", function () {
      renderSettingsForm();
      renderSaveList();
      el.dlgSettings.showModal();
    });

    $("btnRoster").addEventListener("click", function () {
      renderRosterEditor();
      el.dlgRoster.showModal();
    });

    $("btnFull").addEventListener("click", function () { api.toggleFullscreen(); });

    $("btnPublic").addEventListener("click", function () {
      window.open(location.pathname + "?view=display", "sb-public", "noopener");
    });

    $("btnExport").addEventListener("click", function () {
      SB.storage.exportFile(state);
      toast(SB.t("exported"));
    });

    $("btnImport").addEventListener("click", function () { el.fileImport.click(); });

    el.fileImport.addEventListener("change", function () {
      var file = this.files && this.files[0];
      if (!file) return;
      var self = this;
      SB.storage.importFile(file).then(function (st) {
        actions.replaceState(st);
        toast(SB.t("imported"));
        renderSettingsForm();
        render();
      }).catch(function () {
        toast(SB.t("importFail"), true);
      }).then(function () { self.value = ""; });
    });

    $("btnNewGame").addEventListener("click", function () {
      if (!confirm(SB.t("newGameConfirm"))) return;
      actions.newGame();
      renderSettingsForm();
      render();
      el.dlgSettings.close();
    });

    $("btnResetGame").addEventListener("click", function () {
      if (!confirm(SB.t("resetConfirm"))) return;
      actions.resetGame();
      render();
    });

    el.saveList.addEventListener("click", function (e) {
      var load = e.target.closest("[data-load]");
      if (load) {
        var entry = SB.storage.index().filter(function (x) { return x.id === load.dataset.load; })[0];
        if (!entry) return;
        actions.replaceState(SB.migrate(entry.data));
        renderSettingsForm();
        render();
        el.dlgSettings.close();
        toast("Cargado: " + entry.name);
        return;
      }
      var del = e.target.closest("[data-del]");
      if (del) {
        SB.storage.removeGame(del.dataset.del);
        renderSaveList();
      }
    });

    el.dlgSettings.addEventListener("close", function () { renderSaveList(); });
  }

  function currentEditorSide(li) {
    return li.closest(".roster-edit__list") === el.editAway ? "away" : "home";
  }

  var api = {
    init: function (stateRef, actionRef) {
      state = stateRef;
      actions = actionRef;
      cache();
      applyConfig();
      bind();
      render();
      rosterSig.home = rosterSig.away = "";
      render();
    },
    render: render,
    renderSettingsForm: renderSettingsForm,
    renderRosterEditor: renderRosterEditor,
    renderSaveList: renderSaveList,
    applyConfig: function () { applyConfig(); },
    setSaveIndicator: setSaveIndicator,
    banner: function (msg) {
      var node = document.getElementById("banner");
      if (!node) return;
      node.textContent = msg || "";
      node.hidden = !msg;
    },
    toast: toast,
    findPlayer: findPlayer,
    getActive: function (side) { return active[side]; },
    getFirstOnCourt: function (side) {
      var list = state[side].players;
      for (var i = 0; i < list.length; i++) if (i < state.config.onCourt) return list[i].id;
      return list.length ? list[0].id : null;
    },
    isDisplayMode: function () { return displayMode; },
    setState: function (next) { state = next; },
    setActivePlayer: function (side, id) { active[side] = id; },
    fullscreenSupported: function () {
      var el2 = document.documentElement;
      return !!(el2.requestFullscreen || el2.webkitRequestFullscreen || el2.webkitRequestFullScreen);
    },
    isFullscreen: function () {
      return !!(document.fullscreenElement || document.webkitFullscreenElement);
    },
    toggleFullscreen: function () {
      var node = document.documentElement;
      var exiting = document.fullscreenElement || document.webkitFullscreenElement;
      if (exiting) {
        var ex = document.exitFullscreen || document.webkitExitFullscreen;
        if (ex) ex.call(document);
        return;
      }
      var req = node.requestFullscreen || node.webkitRequestFullscreen || node.webkitRequestFullScreen;
      if (req) {
        try {
          var p = req.call(node);
          if (p && p.catch) p.catch(function () { api.setDisplayMode(!api.isDisplayMode()); });
        } catch (e) {
          api.setDisplayMode(!api.isDisplayMode());
        }
        return;
      }
      api.setDisplayMode(!api.isDisplayMode());
      toast("Pantalla completa no disponible: modo pantalla activa");
    },
    setDisplayMode: function (on) {
      displayMode = on;
      document.body.dataset.view = on ? "display" : "control";
      render();
    },
    toggleDisplayMode: function () { api.setDisplayMode(!displayMode); },
    anyDialogOpen: function () {
      return el.dlgSettings.open || el.dlgRoster.open;
    },
    escape: escapeHtml
  };

  return api;
})();
