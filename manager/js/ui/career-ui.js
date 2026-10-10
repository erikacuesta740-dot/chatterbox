/* Carrera del entrenador, ofertas, premios, palmarés, récords e historial de jugadores. */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const UI = MCM.ui;
  const C = MCM.career;
  const R = MCM.mgr;
  const App = MCM.app;
  const V = App.VIEWS;
  const A = App.ACTIONS;
  const H = App.h;
  const esc = U.esc;

  function offersCard(s, forced) {
    const m = s.manager;
    if (!m.offers.length) return forced ? '<section class="card"><p>No hay ofertas ahora mismo.</p></section>' : '';
    return '<section class="card"><div class="section-head"><h3>' + (forced ? 'Elige tu nuevo club' : 'Ofertas de otros clubes') + '</h3><span class="small muted">' + m.offers.length + '</span></div>' +
      (forced ? '' : '<p class="small muted">Puedes aceptar antes del primer partido de la temporada. Si cambias de club, tu cantera se queda en el club actual.</p>') +
      m.offers.map((o) => {
        const c = s.clubs[o.clubId];
        if (!c) return '';
        const L = s.leagues[c.leagueId];
        return '<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)">' + UI.crest(c, 32) + '<div class="grow"><b>' + esc(c.name) + '</b><div class="small muted">' + esc(L ? L.name : '') + ' · reputación ' + c.rep + ' · ' + U.money(c.budget) + '</div>' +
          '<div class="small">Objetivo: ' + esc(c.objective ? c.objective.text : '—') + '</div></div><button class="btn sm primary" data-act="mgr-accept" data-id="' + c.id + '">Aceptar</button></div>';
      }).join('') + (forced ? '' : '<button class="btn sm ghost" data-act="mgr-decline">Rechazar todas</button>') + '</section>';
  }

  // Inicio: sin club o con ofertas pendientes
  const baseHub = V.hub;
  V.hub = function () {
    const s = App.s;
    R.init(s);
    if (s.manager.unemployed) {
      return {
        title: 'Sin equipo', sub: s.name,
        html: '<section class="card"><h2>' + esc(s.managerName) + ' está sin equipo</h2><p>Reputación: <b>' + s.manager.rep + '</b> (' + esc(R.repLabel(s.manager.rep)) + '). Elige una oferta para seguir tu carrera.</p></section>' + offersCard(s, true),
      };
    }
    const v = baseHub();
    if (s.manager.offers.length && C.canSwitchClub(s)) {
      const i = v.html.indexOf('</section>');
      v.html = v.html.slice(0, i + 10) + '<button class="notice" data-act="nav" data-view="manager" style="text-align:left">💼 ' + s.manager.offers.length + (s.manager.offers.length > 1 ? ' clubes quieren' : ' club quiere') + ' contratarte. Toca para ver las ofertas.</button>' + v.html.slice(i + 10);
    }
    return v;
  };

  V.manager = function () {
    const s = App.s;
    const m = R.init(s);
    const club = s.clubs[s.clubId];
    const st = m.stats;
    const pct = st.games ? Math.round((st.w / st.games) * 100) : 0;
    const trophies = s.managerTrophies || [];
    let html = '<section class="card"><div class="row">' + (m.unemployed ? '' : UI.crest(club, 48)) + '<div class="grow"><h2>' + esc(s.managerName) + '</h2><div class="small muted">' + (m.unemployed ? 'Sin equipo' : 'Entrenador de ' + esc(club.name)) + '</div></div></div>' +
      '<div class="attr"><span>Reputación</span>' + UI.bar(m.rep, 100, 'accent') + '<b>' + m.rep + '</b></div><p class="small muted">' + esc(R.repLabel(m.rep)) + '. Sube cumpliendo objetivos y ganando títulos; baja con descensos, fracasos y despidos.</p></section>' +
      '<section class="kv"><div><span>Partidos</span><b>' + st.games + '</b></div><div><span>% victorias</span><b>' + pct + '%</b></div><div><span>V / E / D</span><b>' + st.w + ' / ' + st.d + ' / ' + st.l + '</b></div><div><span>Títulos</span><b>' + trophies.length + '</b></div></section>';
    if (C.canSwitchClub(s) || m.unemployed) html += offersCard(s, m.unemployed);
    html += '<section class="card"><h3>Vitrina</h3>' + (trophies.length ? trophies.slice().reverse().map((t) => '<div class="row small"><span>🏆</span><span class="grow"><b>' + esc(t.name) + '</b> · ' + esc(t.club) + '</span><span class="muted">' + esc(t.season) + '</span></div>').join('') : '<p class="small muted">Todavía sin títulos.</p>') + '</section>';
    html += '<section class="card"><h3>Trayectoria</h3>' + m.stints.slice().reverse().map((x) => '<div class="row small"><span class="grow"><b>' + esc(x.club) + '</b></span><span class="muted">' + esc(x.from) + ' – ' + esc(x.to || 'actualidad') + '</span></div>').join('') + '</section>';
    if (s.history.length) {
      html += '<section class="card"><h3>Temporadas</h3><div class="table-wrap"><table class="tbl"><thead><tr><th class="l">Temp.</th><th class="l">Club</th><th>Pos</th><th>Pts</th><th class="l">Copas y Europa</th></tr></thead><tbody>' +
        s.history.map((h) => '<tr><td class="l">' + esc(h.season) + '</td><td class="l">' + esc(h.club) + '<div class="small muted">' + esc(h.league) + '</div></td><td>' + h.pos + 'º</td><td>' + h.pts + '</td><td class="l small">' + (h.comps || []).map((c) => esc(c.name) + ': ' + esc(c.reached)).join('<br>') + '</td></tr>').join('') + '</tbody></table></div></section>';
    }
    if (!m.unemployed) html += '<button class="btn ghost block" data-act="mgr-resign" style="color:var(--bad)">Dimitir</button>';
    return { title: 'Mi carrera', sub: R.repLabel(m.rep), html };
  };

  A['mgr-accept'] = (d) => {
    const s = App.s;
    const c = s.clubs[d.id];
    if (!C.canSwitchClub(s)) { H.toast('Solo puedes cambiar de club en pretemporada o si estás sin equipo.'); return; }
    H.confirmSheet({
      title: 'Fichar por ' + c.name, body: 'Dejarás ' + (s.manager.unemployed ? 'el paro' : s.clubs[s.clubId].name) + ' y empezarás a dirigir a ' + c.name + '. Tus estadísticas y tu palmarés de entrenador te acompañan.', yes: 'Aceptar la oferta',
      onYes: async () => {
        const err = R.switchClub(s, d.id);
        if (err) { H.toast(err); return; }
        await H.persist();
        await H.refreshMetas();
        H.toast('Nuevo club: ' + c.name);
        App.go('hub', {}, { root: true });
      },
    });
  };
  A['mgr-decline'] = async () => { App.s.manager.offers = []; await H.persist(); App.render(); };
  A['mgr-resign'] = () => H.confirmSheet({
    title: 'Dimitir', body: 'Dejarás el club y perderás algo de reputación. Recibirás ofertas de otros clubes para continuar.', yes: 'Dimitir', danger: true,
    onYes: async () => { R.resign(App.s); await H.persist(); App.go('hub', {}, { root: true }); },
  });

  // Premios
  V.awards = function () {
    const s = App.s;
    R.init(s);
    if (!s.awards.length) return { title: 'Premios', html: '<section class="card empty"><p>Los premios se entregan al cerrar cada temporada.</p></section>' };
    const idx = U.clamp(Number(App.ui.awardIdx || 0), 0, s.awards.length - 1);
    const a = s.awards[idx];
    const userL = C.userClub(s).leagueId;
    const lid = App.ui.awardLeague && a.leagues.some((l) => l.league === App.ui.awardLeague) ? App.ui.awardLeague : userL;
    const l = a.leagues.find((x) => x.league === lid) || a.leagues[0];
    const person = (x, extra) => (x ? '<button data-act="player" data-id="' + x.pid + '" style="border:0;background:none;padding:0;color:inherit;text-align:left"><b>' + esc(x.name) + '</b></button> <span class="small muted">' + esc(x.club) + (extra ? ' · ' + extra : '') + '</span>' : '—');
    let html = '<div class="chips">' + s.awards.map((x, i) => '<button class="chip ' + (i === idx ? 'on' : '') + '" data-act="award-season" data-v="' + i + '">' + esc(x.season) + '</button>').join('') + '</div>';
    html += '<section class="card"><h3>Balón de Oro ' + esc(a.season) + '</h3>' + a.ballonDor.map((b) => '<div class="row"><span class="pill ' + (b.pos === 1 ? 'solid-accent' : 'mute') + '">' + b.pos + 'º</span><span class="grow">' + person(b) + '</span></div>').join('') + '</section>';
    if (a.coachOfYear) html += '<section class="notice">🏅 ' + esc(a.coachOfYear.name) + ', entrenador del año en ' + esc(a.coachOfYear.league) + '.</section>';
    html += '<div class="chips">' + a.leagues.map((x) => '<button class="chip ' + (x.league === l.league ? 'on' : '') + '" data-act="award-league" data-v="' + x.league + '">' + esc(x.leagueName) + '</button>').join('') + '</div>';
    html += '<section class="card"><h3>' + esc(l.leagueName) + '</h3><p class="small muted">Campeón: ' + esc(l.champion) + '</p>' +
      '<div class="stack"><div><span class="eyebrow">Mejor jugador</span><div>' + person(l.mvp, l.mvp ? 'nota ' + l.mvp.r : '') + '</div></div>' +
      '<div><span class="eyebrow">Máximo goleador</span><div>' + person(l.scorer, l.scorer ? l.scorer.goals + ' goles' : '') + '</div></div>' +
      '<div><span class="eyebrow">Mejor portero</span><div>' + person(l.gk, l.gk ? l.gk.cs + ' porterías a cero' : '') + '</div></div>' +
      '<div><span class="eyebrow">Mejor joven</span><div>' + person(l.young) + '</div></div></div></section>';
    html += '<section class="card"><h3>Equipo de la temporada</h3>' + l.team.map((x) => '<div class="row small"><span style="width:36px;font-weight:700">' + esc(x.pos) + '</span><span class="grow">' + person(x) + '</span><b class="num">' + x.r.toFixed(2) + '</b></div>').join('') + '</section>';
    return { title: 'Premios', sub: a.season, html };
  };
  A['award-season'] = (d) => { App.ui.awardIdx = Number(d.v); App.render(); };
  A['award-league'] = (d) => { App.ui.awardLeague = d.v; App.render(); };

  // Club: palmarés y récords
  const baseClub = V.club;
  V.club = function () {
    const v = baseClub();
    const s = App.s;
    const list = (s.trophies && s.trophies[s.clubId]) || [];
    const counts = {};
    list.forEach((t) => { counts[t.name] = (counts[t.name] || 0) + 1; });
    let html = '<section class="card"><h3>Palmarés (en esta carrera)</h3>' + (list.length ? Object.keys(counts).map((k) => '<div class="row small"><span>🏆</span><span class="grow">' + esc(k) + '</span><b>' + counts[k] + '</b></div>').join('') : '<p class="small muted">Sin títulos todavía.</p>') + '</section>';
    const rec = s.clubRecords && s.clubRecords[s.clubId];
    if (rec) {
      const top = (o) => Object.values(o).sort((a, b) => b.n - a.n).slice(0, 5);
      html += '<section class="card"><h3>Récords del club</h3>' +
        (rec.bestPts ? '<p class="small">Mejor temporada: <b>' + rec.bestPts.pts + ' puntos</b> (' + esc(rec.bestPts.season) + ', ' + esc(rec.bestPts.league) + ')</p>' : '') +
        (rec.bigWin ? '<p class="small">Mayor goleada: <b>' + esc(rec.bigWin.text) + '</b> (' + esc(rec.bigWin.season) + ')</p>' : '') +
        '<div class="grid-2"><div class="stack small"><span class="eyebrow">Goleadores</span>' + top(rec.goals).map((x) => '<span>' + esc(x.name) + ' · <b>' + x.n + '</b></span>').join('') + '</div>' +
        '<div class="stack small"><span class="eyebrow">Partidos</span>' + top(rec.apps).map((x) => '<span>' + esc(x.name) + ' · <b>' + x.n + '</b></span>').join('') + '</div></div>' +
        '<p class="small muted">Se actualizan al cerrar cada temporada.</p></section>';
    }
    v.html += html;
    return v;
  };

  // Jugador: trayectoria y premios
  const basePlayer = V.player;
  V.player = function (params) {
    const v = basePlayer(params);
    const s = App.s;
    const p = s.players[params.id];
    if (!p) return v;
    let html = '';
    if (p.career && p.career.length) {
      html += '<section class="card"><h3>Trayectoria</h3><div class="table-wrap"><table class="tbl"><thead><tr><th class="l">Temp.</th><th class="l">Club</th><th>PJ</th><th>G</th><th>A</th><th>Nota</th></tr></thead><tbody>' +
        p.career.slice().reverse().map((c) => '<tr><td class="l">' + esc(C.seasonLabel(c[0])) + '</td><td class="l">' + esc(c[1]) + '</td><td>' + c[2] + '</td><td>' + c[3] + '</td><td>' + c[4] + '</td><td>' + (c[5] ? (c[5] / 10).toFixed(1) : '—') + '</td></tr>').join('') + '</tbody></table></div></section>';
    }
    if (p.awards && p.awards.length) html += '<section class="card"><h3>Premios</h3>' + p.awards.slice().reverse().map((a) => '<div class="small">🏅 ' + esc(a) + '</div>').join('') + '</section>';
    v.html += html;
    return v;
  };
})(globalThis.MCM = globalThis.MCM || {});
