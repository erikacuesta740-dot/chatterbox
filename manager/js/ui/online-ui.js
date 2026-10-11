/* Modo online contra un amigo: crear o unirse a una sala, elegir club y avanzar cuando los dos estén listos. */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const UI = MCM.ui;
  const C = MCM.career;
  const SC = MCM.schedule;
  // Salas de claude.ai si hay base de datos; si no (app Android, web propia), conexión directa entre móviles.
  const R = new Proxy({}, { get: (_, k) => ((MCM.cloud && MCM.cloud.ready()) || !MCM.p2p || !MCM.p2p.available() ? MCM.rooms : MCM.p2p)[k] });
  const isP2P = () => !(MCM.cloud && MCM.cloud.ready()) && MCM.p2p && MCM.p2p.available();
  const O = MCM.online;
  const App = MCM.app;
  const V = App.VIEWS;
  const A = App.ACTIONS;
  const F = App.FORMS;
  const H = App.h;
  const esc = U.esc;
  App.ui.online = App.ui.online || { rooms: null, join: null, room: null, code: null, unsub: null, loading: false, country: null, league: null };
  const st = App.ui.online;

  const realLeagues = () => MCM.DATA.realDataset().leagues;

  function needCloud() {
    const c = MCM.cloud;
    return '<section class="card stack"><h3>Jugar online con un amigo</h3>' +
      '<p class="small">' + esc(c.reason || 'El modo online necesita abrir el juego dentro de claude.ai con tu cuenta.') + '</p>' +
      '<p class="small muted">Para jugar contra un amigo: abrid los dos el juego en claude.ai con vuestra cuenta. El propietario del juego debe invitar a su amigo por correo como <b>Editor</b> (Compartir) y no tener activado el enlace público, porque con enlace público los invitados de fuera solo pueden mirar.</p>' +
      '<p class="small muted">Necesitas conexión a internet.</p></section>';
  }

  // ---------- Inicio online ----------
  V.online = function () {
    if (!R.available()) return { title: 'Online', html: needCloud(), tabs: false };
    if (!st.rooms && !st.loading) {
      st.loading = true;
      R.mine().then((r) => { st.rooms = r; }).catch(() => { st.rooms = []; }).finally(() => { st.loading = false; if (App.view === 'online') App.render(); });
    }
    let html = '<section class="card stack"><h3>Carrera contra un amigo</h3><p class="small muted">Uno crea la sala y elige la liga; el otro entra con el código. Cada uno elige su club y dirige su once y su táctica desde su móvil. La temporada avanza cuando los dos pulsáis «Listo».</p>' +
      (isP2P() ? '<form class="row" data-submit="on-name" style="gap:8px;align-items:flex-end"><label class="field grow" for="on-name">Tu nombre<input class="input" id="on-name" name="name" maxlength="24" value="' + esc(MCM.p2p.myName()) + '"></label><button class="btn sm" type="submit">Guardar</button></form>' +
        '<p class="small muted">Conexión directa entre los dos móviles, sin cuentas. Para jugar jornadas tenéis que tener la sala abierta los dos a la vez. La partida se guarda en los dos móviles.</p>' : '') +
      '<button class="btn primary block" data-act="nav" data-view="onlineCreate">Crear sala</button>' +
      '<form class="stack" data-submit="on-code"><label class="field" for="on-code">Código de sala<input class="input" id="on-code" name="code" autocomplete="off" autocapitalize="characters" maxlength="8" placeholder="Por ejemplo, K7QMX"></label><button class="btn block" type="submit">Unirme con código</button></form></section>';
    html += '<section class="card"><div class="section-head"><h3>Mis salas</h3><button class="btn ghost sm" data-act="on-refresh">Actualizar</button></div>' +
      (st.rooms == null ? '<p class="small muted">Cargando…</p>' : st.rooms.length ? '<div class="plist">' + st.rooms.map((m) => {
        const me = m.host.uid === R.uid() ? m.host : m.guest;
        const rival = m.host.uid === R.uid() ? m.guest : m.host;
        return '<button class="prow" data-act="on-open" data-code="' + esc(m.code) + '"><span class="grow"><span class="name" style="display:block">' + esc(m.code) + ' · ' + esc(m.leagueName) + '</span><span class="meta">' +
          esc((me ? me.club : '—') + ' vs ' + (rival ? rival.club + ' (' + rival.name + ')' : 'esperando rival')) + ' · ' + esc(m.status === 'lobby' ? 'En espera' : m.season) + '</span></span></button>';
      }).join('') + '</div>' : '<p class="small muted">Aún no tienes salas.</p>') + '</section>';
    return { title: 'Online', sub: 'Contra un amigo', html, tabs: false };
  };
  A['on-refresh'] = () => { st.rooms = null; App.render(); };
  F['on-name'] = async (fd) => { await MCM.p2p.setName(fd.get('name')); H.toast('Nombre guardado'); App.render(); };
  F['on-code'] = async (fd) => {
    const code = R.normalize(fd.get('code'));
    if (code.length < 4) { H.toast('Escribe el código de la sala'); return; }
    await H.busy(isP2P() ? 'Conectando con la sala… (el creador tiene que tenerla abierta)' : 'Buscando la sala…');
    try {
      const meta = await R.get(code);
      if (!meta) { H.toast(isP2P() ? 'No se encuentra la sala: revisa el código y que tu amigo la tenga abierta' : 'No existe ninguna sala con ese código'); return; }
      if (meta.host.uid === R.uid() || (meta.guest && meta.guest.uid === R.uid())) { openRoom(code); return; }
      if (meta.guest) { H.toast('La sala ya está completa'); return; }
      st.join = meta;
      App.go('onlineJoin', { code });
    } catch (e) { H.toast(e.message || 'No se pudo abrir la sala'); } finally { H.unbusy(); }
  };
  A['on-open'] = (d) => openRoom(d.code);

  // ---------- Crear sala ----------
  function clubPicker(leagues, L, act, extra, taken) {
    const countries = Array.from(new Set(leagues.map((l) => l.country)));
    const clubs = L.clubs.map((c) => (Array.isArray(c) ? { id: U.slug(c[0]), name: c[0], short: c[1], rep: c[2], colors: [c[4], c[5]], stadium: c[3] } : Object.assign({ id: U.slug(c.name) }, c)))
      .filter((c) => c.id !== taken).sort((a, b) => b.rep - a.rep);
    return (countries.length > 1 ? '<label class="field" for="on-country">País<select class="input" id="on-country" data-change="on-country">' + countries.map((c) => '<option' + (c === L.country ? ' selected' : '') + '>' + esc(c) + '</option>').join('') + '</select></label>' +
      '<div class="chips">' + leagues.filter((l) => l.country === L.country).map((l) => '<button class="chip ' + (l.id === L.id ? 'on' : '') + '" data-act="on-league" data-id="' + esc(l.id) + '">' + esc(l.name) + '</button>').join('') + '</div>' : '') +
      '<section class="card"><div class="section-head"><h2>Elige tu club</h2><span class="small muted">' + esc(L.name) + '</span></div><div class="plist">' +
      clubs.map((c) => '<button class="prow" data-act="' + act + '" data-club="' + esc(c.id) + '" data-league="' + esc(L.id) + '"' + (extra || '') + '>' + UI.crest(c, 30) + '<span class="grow"><span class="name" style="display:block">' + esc(c.name) + '</span><span class="meta">' + esc(c.stadium || '') + '</span></span>' + UI.ovr(Math.round(MCM.generator.baseOvr(c.rep) + 2)) + '</button>').join('') + '</div></section>';
  }
  V.onlineCreate = function () {
    if (!R.available()) return { title: 'Crear sala', html: needCloud(), tabs: false };
    const leagues = realLeagues();
    const L = leagues.find((l) => l.id === st.league) || leagues[0];
    const html = '<p class="notice small">La liga que elijas será la de los dos. El mundo incluye las demás ligas de ese país, copas y Europa. En este modo no hay fichajes: gana quien mejor dirija su plantilla.</p>' + clubPicker(leagues, L, 'on-create');
    return { title: 'Crear sala', sub: 'Elige liga y club', html, tabs: false };
  };
  App.CHANGES['on-country'] = (el) => { const l = realLeagues().find((x) => x.country === el.value); if (l) st.league = l.id; App.render(); };
  A['on-league'] = (d) => { st.league = d.id; App.render(); };
  A['on-create'] = async (d) => {
    await H.busy('Creando la sala…');
    try {
      const meta = await R.create(d.league, d.club);
      st.rooms = null;
      H.unbusy();
      openRoom(meta.code, true);
    } catch (e) { H.toast(e.message || 'No se pudo crear la sala'); } finally { H.unbusy(); }
  };

  // ---------- Unirse ----------
  V.onlineJoin = function (params) {
    const meta = st.join;
    if (!meta || meta.code !== params.code) return { title: 'Unirse', html: '<p class="small muted">Vuelve a escribir el código.</p>', tabs: false };
    const L = realLeagues().find((l) => l.id === meta.leagueId);
    const html = '<section class="card"><h3>Sala ' + esc(meta.code) + '</h3><p class="small">' + esc(meta.host.name) + ' juega con <b>' + esc(meta.host.club) + '</b> en ' + esc(meta.leagueName) + '. Elige tu club:</p></section>' +
      clubPicker([L], L, 'on-join', ' data-code="' + esc(meta.code) + '"', meta.host.clubId);
    return { title: 'Unirse a la sala', sub: meta.leagueName, html, tabs: false };
  };
  A['on-join'] = async (d) => {
    await H.busy('Entrando en la sala…');
    try {
      await R.join(d.code, d.club);
      st.rooms = null;
      H.unbusy();
      openRoom(d.code, true);
    } catch (e) { H.toast(e.message || 'No se pudo entrar'); } finally { H.unbusy(); }
  };

  // ---------- Sala ----------
  function openRoom(code, replace) {
    if (st.unsub && st.code !== code) { st.unsub(); st.unsub = null; }
    if (st.code !== code) { st.room = null; App.s = null; }
    st.code = code;
    if (!st.unsub) {
      st.unsub = R.subscribe(code, (meta) => {
        st.room = meta;
        if (meta && meta.status === 'playing' && (!App.s || !App.s.online || App.s.online.code !== code || App.s.online.rev !== meta.rev)) loadWorld(meta);
        if (App.view === 'onlineRoom' || (App.s && App.s.online && App.view === 'hub')) App.render();
      }, () => H.toast('Se perdió la conexión con la sala'));
    }
    App.go('onlineRoom', { code }, { root: !!replace });
  }
  let loadingRev = 0;
  async function loadWorld(meta) {
    if (loadingRev === meta.rev) return;
    loadingRev = meta.rev;
    try {
      const s = await R.loadWorld(meta);
      if (!st.room || st.room.rev !== meta.rev) return;
      App.s = s;
      if (App.view === 'onlineRoom' || App.view === 'hub') App.render();
    } catch (e) {
      loadingRev = 0;
      setTimeout(() => { if (st.room && st.room.rev === meta.rev) loadWorld(meta); }, 2500);
    }
  }

  function resultRow(s, r) {
    const h = s.clubs[r.home];
    const a = s.clubs[r.away];
    const both = s.humans.includes(r.home) && s.humans.includes(r.away);
    return '<button class="prow" data-act="match" data-id="' + esc(r.id) + '" data-comp="' + esc(r.comp) + '"' + (both ? ' style="border-color:var(--accent)"' : '') + '>' +
      '<span class="grow"><span class="name" style="display:block">' + esc(h.name) + ' ' + r.hg + '-' + r.ag + ' ' + esc(a.name) + '</span><span class="meta">' + esc(MCM.comps.compName(s, r.comp)) + ' · ' + esc(r.round || '') + (r.pens ? ' · penaltis ' + r.pens[0] + '-' + r.pens[1] : '') + (both ? ' · ¡cara a cara!' : '') + '</span></span></button>';
  }

  V.onlineRoom = function (params) {
    const code = (params && params.code) || st.code;
    if (!st.unsub || st.code !== code) { setTimeout(() => openRoom(code, true), 0); return { title: 'Sala ' + code, html: '<p class="small muted">Conectando…</p>', tabs: false }; }
    const m = st.room;
    if (!m) return { title: 'Sala ' + code, html: '<p class="small muted">Cargando sala…</p>', tabs: false };
    const me = m.host.uid === R.uid() ? m.host : m.guest;
    const rival = m.host.uid === R.uid() ? m.guest : m.host;
    if (m.status === 'lobby') {
      const isHost = m.host.uid === R.uid();
      const html = '<section class="card stack" style="text-align:center"><span class="eyebrow">Código de la sala</span><h1 style="letter-spacing:.2em;font-size:40px">' + esc(m.code) + '</h1>' +
        '<p class="small muted">Pásaselo a tu amigo: entra en «Jugar online», escribe el código y elige su club de ' + esc(m.leagueName) + '.' + (isP2P() ? ' Deja esta pantalla abierta mientras se une.' : '') + '</p></section>' +
        '<section class="card stack small"><div class="row"><b class="grow">' + esc(m.host.name) + '</b><span>' + esc(m.host.club) + '</span></div>' +
        '<div class="row"><b class="grow">' + esc(m.guest ? m.guest.name : 'Esperando a tu amigo…') + '</b><span>' + esc(m.guest ? m.guest.club : '') + '</span></div></section>' +
        (isHost ? (m.guest ? '<button class="btn primary block" data-act="on-start">Empezar la temporada</button>' : '') + '<button class="btn ghost block" data-act="on-cancel">Cerrar la sala</button>'
          : '<p class="notice small">Esperando a que ' + esc(m.host.name) + ' empiece la temporada.</p>');
      return { title: 'Sala ' + m.code, sub: m.leagueName, html, tabs: false };
    }
    const s = App.s;
    if (!s || !s.online || s.online.code !== code || s.online.rev !== m.rev) return { title: 'Sala ' + m.code, html: '<p class="small muted">Cargando la jornada…</p>', tabs: false };
    const myClub = s.clubs[s.clubId];
    const rivalClub = rival ? s.clubs[rival.clubId] : null;
    const imReady = m.ready && m.ready[R.uid()] === m.rev;
    const net = isP2P() ? MCM.p2p.status(m.code) : null;
    const netPill = net ? '<p class="small"><span class="pill ' + (net.connected ? 'good' : 'warn') + '">' + (net.connected ? 'Conectado con ' + esc(rival ? rival.name : 'tu amigo') : esc(rival ? rival.name : 'Tu amigo') + ' no está conectado: pídele que abra la sala') + '</span></p>' : '';
    const heReady = rival && m.ready && m.ready[rival.uid] === m.rev;
    const finished = C.seasonFinished(s);
    const next = C.nextUserFixture(s);
    let html = '<section class="card"><div class="section-head"><h3>' + esc(myClub.name) + ' vs ' + esc(rivalClub ? rivalClub.name : '—') + '</h3><span class="small muted">' + esc(s.season.label) + '</span></div>' +
      '<p class="small">Tú: <b>' + esc(myClub.name) + '</b> · ' + esc(rival ? rival.name : '') + ': <b>' + esc(rivalClub ? rivalClub.name : '') + '</b> · Sala ' + esc(m.code) + '</p>';
    if (finished) html += '<p class="small"><b>Temporada terminada.</b> Cuando los dos estéis listos empieza la siguiente.</p>';
    else if (next) {
      const opp = s.clubs[next.home === s.clubId ? next.away : next.home];
      html += '<p class="small">Tu próximo partido: <b>' + esc(opp.name) + '</b> (' + (next.home === s.clubId ? 'local' : 'visitante') + ') · ' + esc(MCM.comps.compName(s, next.comp)) + ' · ' + esc(U.dateLabel(next.date)) + '</p>';
    } else html += '<p class="small">No te quedan partidos; tu amigo sí.</p>';
    html += netPill + '<div class="row small" style="gap:12px;margin:6px 0"><span class="pill ' + (imReady ? 'good' : 'mute') + '">Tú: ' + (imReady ? 'listo' : 'pensando') + '</span><span class="pill ' + (heReady ? 'good' : 'mute') + '">' + esc(rival ? rival.name : 'Rival') + ': ' + (heReady ? 'listo' : 'pensando') + '</span></div>' +
      (imReady ? '<button class="btn block" data-act="on-unready">Esperando a ' + esc(rival ? rival.name : 'tu amigo') + '… (quitar «Listo»)</button>'
        : '<button class="btn primary block" data-act="on-ready">' + (finished ? 'Listo para la nueva temporada' : 'Listo: jugar la jornada') + '</button>') +
      '<div class="btn-row" style="margin-top:8px"><button class="btn sm" data-act="nav" data-view="tactics">Tácticas y once</button><button class="btn sm" data-act="tab" data-view="squad">Plantilla</button><button class="btn sm" data-act="tab" data-view="table">Torneos</button></div></section>';
    if (m.last && m.last.results && m.last.results.length) {
      html += '<section class="card"><h3>Últimos resultados</h3><div class="plist">' + m.last.results.filter((r) => s.clubs[r.home] && s.clubs[r.away]).map((r) => resultRow(s, r)).join('') + '</div></section>';
    } else if (m.last && m.last.kind === 'season') html += '<section class="notice">Temporada ' + esc(m.last.label) + ' cerrada. ¡Empieza la ' + esc(s.season.label) + '!</section>';
    const h2h = O.headToHead(s);
    if (h2h.length) {
      html += '<section class="card"><h3>Cara a cara</h3><div class="plist">' + h2h.map((f) => f.played ? resultRow(s, { id: f.id, comp: f.comp, round: f.round || 'Jornada ' + f.md, home: f.home, away: f.away, hg: f.hg, ag: f.ag, pens: f.pens })
        : '<div class="prow"><span class="grow"><span class="name" style="display:block">' + esc(s.clubs[f.home].name) + ' - ' + esc(s.clubs[f.away].name) + '</span><span class="meta">' + esc(U.dateLabel(f.date)) + ' · ' + esc(MCM.comps.compName(s, f.comp)) + '</span></span></div>').join('') + '</div></section>';
    }
    const L = s.leagues[m.leagueId];
    if (L) {
      const rows = SC.table(L);
      html += '<section class="card"><div class="section-head"><h3>' + esc(L.name) + '</h3><span class="small muted">' + rows.filter((r) => s.humans.includes(r.clubId)).map((r) => esc(s.clubs[r.clubId].short) + ' ' + r.pos + 'º').join(' · ') + '</span></div>' + H.tableHtml(L, rows, true) + '</section>';
    }
    html += '<button class="btn ghost block" data-act="on-exit">Salir de la sala</button>';
    return { title: 'Sala ' + m.code, sub: myClub.name + ' · ' + s.season.label, html };
  };

  A['on-start'] = async () => {
    await H.busy('Preparando la temporada…');
    try { await R.start(st.room); } catch (e) { H.toast(e.message || 'No se pudo empezar'); } finally { H.unbusy(); }
  };
  A['on-cancel'] = () => H.confirmSheet({ title: 'Cerrar la sala', body: 'Se borrará la sala ' + st.code + '.', yes: 'Cerrar sala', danger: true,
    onYes: async () => { await R.leave(st.room); exitRoom(); } });
  A['on-ready'] = async () => {
    await H.busy('Enviando tu alineación…');
    try {
      const r = await R.ready(st.room, O.extractOrders(App.s, App.s.clubId));
      if (r.stepped) H.toast(r.result.kind === 'season' ? 'Nueva temporada' : 'Jornada jugada');
    } catch (e) { H.toast(e.message || 'No se pudo enviar'); } finally { H.unbusy(); }
  };
  A['on-unready'] = async () => { try { await R.unready(st.room); } catch (e) { H.toast('No se pudo cambiar'); } };
  function exitRoom() {
    if (st.unsub) st.unsub();
    st.unsub = null; st.code = null; st.room = null; st.rooms = null;
    App.s = null;
    App.go('start', {}, { root: true });
  }
  A['on-exit'] = exitRoom;

  // En el modo online, «Inicio» es la sala y el guardado manda tus órdenes a la sala.
  const baseHub = V.hub;
  V.hub = function (params) {
    if (App.s && App.s.online) return V.onlineRoom({ code: App.s.online.code });
    return baseHub(params);
  };
  let ordersTimer = null;
  App.onlinePersist = function () {
    const s = App.s;
    if (!s || !s.online) return;
    clearTimeout(ordersTimer);
    ordersTimer = setTimeout(() => { R.saveOrders(s.online.code, O.extractOrders(s, s.clubId)).catch(() => H.toast('No se pudo guardar tu alineación en la sala')); }, 600);
  };
  const baseMenu = V.menu;
  V.menu = function (params) {
    const s = App.s;
    if (!s || !s.online) return baseMenu(params);
    const html = '<section class="plist">' + [['hub', 'Sala ' + s.online.code, 'Jornada y resultados'], ['tactics', 'Tácticas y alineación', s.clubs[s.clubId].tactics.formation], ['squad', 'Plantilla', ''], ['calendar', 'Calendario', ''], ['table', 'Torneos', '']]
      .map(([v, t, m]) => '<button class="prow" data-act="nav" data-view="' + v + '"><span class="grow"><span class="name" style="display:block">' + esc(t) + '</span><span class="meta">' + esc(m) + '</span></span></button>').join('') + '</section>' +
      '<button class="btn ghost block" data-act="on-exit">Salir de la sala</button>';
    return { title: 'Menú', sub: 'Modo online', html };
  };
  // Botón en la pantalla de inicio
  const baseStart = V.start;
  V.start = function (params) {
    const v = baseStart(params);
    v.html = v.html.replace('<section class="stack">', '<section class="stack"><button class="btn block" data-act="nav" data-view="online">' + UI.icon('transfer') + 'Jugar online con un amigo</button>');
    return v;
  };
})(globalThis.MCM = globalThis.MCM || {});
