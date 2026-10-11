/* Temporada: inicio, calendario por fechas, competiciones, crónicas y partido en directo. */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const UI = MCM.ui;
  const C = MCM.career;
  const K = MCM.comps;
  const SC = MCM.schedule;
  const LU = MCM.lineup;
  const PL = MCM.players;
  const App = MCM.app;
  const V = App.VIEWS;
  const A = App.ACTIONS;
  const H = App.h;
  const esc = U.esc;
  const icon = UI.icon;

  App.ui.cal = App.ui.cal || { comp: 'ALL' };
  App.ui.comp = App.ui.comp || { id: null, tab: 'table' };

  const compLabel = (s, f) => (s.leagues[f.comp] ? s.leagues[f.comp].name : s.comps[f.comp] ? s.comps[f.comp].name : f.comp);
  const compTone = (s, f) => (s.leagues[f.comp] ? 'mute' : s.comps[f.comp] && s.comps[f.comp].type === 'euro' ? 'info' : 'warn');
  function compPill(s, f) { return '<span class="pill ' + compTone(s, f) + '">' + esc(compLabel(s, f)) + '</span>'; }
  function scoreText(f) { return f.hg + '-' + f.ag + (f.pens ? ' (' + f.pens[0] + '-' + f.pens[1] + ' pen.)' : f.et ? ' (pr.)' : ''); }
  function resultFor(s, f) {
    if (!f.played) return '';
    if (f.winner) return f.winner === s.clubId ? 'V' : 'D';
    return UI.resultFor(f, s.clubId);
  }

  // ---------- Inicio ----------
  V.hub = function () {
    const s = App.s;
    const club = C.userClub(s);
    const L = C.userLeague(s);
    const table = SC.table(L);
    const me = table.find((r) => r.clubId === s.clubId);
    const unread = s.news.filter((n) => !n.read).length;
    let html = '<section class="card"><div class="row">' + UI.crest(club, 54) + '<div class="grow"><h2 class="ellipsis">' + esc(club.name) + '</h2>' +
      '<div class="small muted">' + esc(L.name) + ' · ' + esc(s.season.label) + ' · ' + esc(s.managerName) + '</div><div class="small muted">' + esc(U.dateLabel(s.date || s.season.year + '-08-01')) + '</div></div>' +
      '<div style="text-align:right"><div class="scoreboard" style="font-size:2rem">' + me.pos + 'º</div><div class="small muted num">' + me.pts + ' pts</div></div></div>' +
      '<div class="row wrap"><span class="pill info">Objetivo: ' + esc(club.objective.text) + '</span>' +
      (me.form.length ? '<span class="row" style="gap:4px">' + me.form.map((r) => '<span class="res ' + r + '">' + r + '</span>').join('') + '</span>' : '') + '</div></section>';

    const f = C.nextUserFixture(s);
    if (f) {
      const home = s.clubs[f.home];
      const away = s.clubs[f.away];
      html += '<section class="card hero-match"><div class="section-head"><span class="row wrap" style="gap:6px">' + compPill(s, f) + '<span class="eyebrow">' + esc(f.round || '') + '</span></span><span class="small muted">' + esc(U.dateLabel(f.date)) + '</span></div>' +
        '<div class="fixture"><div class="team">' + UI.crest(home, 52) + '<span class="nm">' + esc(home.name) + '</span><span class="small muted">Media ' + C.teamRatingCache(s, home.id) + '</span></div>' +
        '<div class="vs">VS</div><div class="team">' + UI.crest(away, 52) + '<span class="nm">' + esc(away.name) + '</span><span class="small muted">Media ' + C.teamRatingCache(s, away.id) + '</span></div></div>' +
        (f.firstLeg ? firstLegLine(s, f) : '') + (f.neutral ? '<p class="small muted" style="text-align:center">Campo neutral</p>' : '');
      const warns = LU.warnings(club.lineup || LU.autoPick(C.squad(s, s.clubId), club.tactics.formation), C.squad(s, s.clubId)).filter((w) => w.level !== 'info');
      if (warns.length && !s.settings.autoLineup) html += '<button class="notice" data-act="nav" data-view="tactics" style="text-align:left">⚠ ' + warns.length + ' aviso' + (warns.length > 1 ? 's' : '') + ' en tu alineación. Toca para revisar.</button>';
      html += '<div class="btn-row"><button class="btn primary" data-act="live-start">' + icon('play') + 'Jugar en directo</button><button class="btn" data-act="sim-match">Simular partido</button></div>' +
        '<div class="btn-row"><button class="btn ghost sm" data-act="nav" data-view="tactics">' + icon('tactics') + (s.settings.autoLineup ? 'Once automático' : 'Once manual') + ' · ' + esc(club.tactics.formation) + '</button><button class="btn ghost sm" data-act="sim-ask">Simular varios…</button></div></section>';
    } else if (!C.seasonFinished(s)) {
      html += '<section class="card hero-match"><span class="eyebrow">Tu temporada ha terminado</span><p>Quedan partidos de otras competiciones. Simúlalos para cerrar la temporada.</p>' +
        '<button class="btn primary block" data-act="sim-rest">Simular hasta el final</button></section>';
    } else {
      html += '<section class="card hero-match"><span class="eyebrow">Fin de temporada ' + esc(s.season.label) + '</span>' +
        '<h2>' + esc(s.clubs[table[0].clubId].name) + ', campeón de ' + esc(L.name) + '</h2>' +
        '<p>Has terminado ' + me.pos + 'º con ' + me.pts + ' puntos. Objetivo: ' + esc(club.objective.text.toLowerCase()) + ' — ' + (me.pos <= club.objective.target ? '<b style="color:var(--good)">cumplido</b>' : '<b style="color:var(--bad)">no cumplido</b>') + '.</p>' +
        C.compRuns(s, s.clubId).map((r) => '<div class="row small"><span class="grow">' + esc(r.name) + '</span><b>' + esc(r.reached) + '</b></div>').join('') +
        '<button class="btn primary block" data-act="end-season-ask">Cerrar temporada y empezar ' + esc(C.seasonLabel(s.season.year + 1)) + '</button></section>';
    }

    const last = C.lastUserFixture(s);
    if (last) {
      const r = resultFor(s, last);
      html += '<button class="card" data-act="match" data-id="' + last.id + '" data-comp="' + esc(last.comp) + '" style="text-align:left"><span class="eyebrow">Último partido · ' + esc(compLabel(s, last)) + '</span>' +
        '<div class="row"><span class="res ' + r + '">' + r + '</span><span class="grow ellipsis"><b>' + esc(s.clubs[last.home].short) + ' ' + scoreText(last) + ' ' + esc(s.clubs[last.away].short) + '</b></span><span class="small muted">Crónica ›</span></div></button>';
    }
    const upcoming = C.userFixtures(s).filter((x) => !x.played).slice(1, 5);
    if (upcoming.length) {
      html += '<section class="card"><div class="section-head"><h3>Próximos partidos</h3><button class="btn ghost sm" data-act="tab" data-view="calendar">Calendario ›</button></div>' +
        upcoming.map((x) => fixtureRow(s, x)).join('') + '</section>';
    }
    const idx = table.findIndex((r) => r.clubId === s.clubId);
    const from = U.clamp(idx - 2, 0, Math.max(0, table.length - 5));
    html += '<section class="card"><div class="section-head"><h3>Clasificación</h3><button class="btn ghost sm" data-act="tab" data-view="table">Competiciones ›</button></div>' + H.tableHtml(L, table.slice(from, from + 5), true) + '</section>';
    html += '<section class="card"><div class="section-head"><h3>Noticias' + (unread ? ' <span class="pill solid-accent">' + unread + '</span>' : '') + '</h3><button class="btn ghost sm" data-act="nav" data-view="news">Todas ›</button></div>' +
      s.news.slice(0, 3).map(H.newsItem).join('') + '</section>';
    return { title: club.name, sub: s.name, html };
  };

  function firstLegLine(s, f) {
    const comp = C.compOf(s, f);
    const f1 = comp.fixtures.find((x) => x.id === f.firstLeg);
    if (!f1 || !f1.played) return '';
    return '<p class="small" style="text-align:center">Ida: ' + esc(s.clubs[f1.home].short) + ' ' + f1.hg + '-' + f1.ag + ' ' + esc(s.clubs[f1.away].short) + '</p>';
  }

  function fixtureRow(s, f) {
    const home = f.home === s.clubId;
    const rival = s.clubs[home ? f.away : f.home];
    const r = resultFor(s, f);
    return '<button class="prow" data-act="' + (f.played ? 'match' : 'noop') + '" data-id="' + f.id + '" data-comp="' + esc(f.comp) + '">' +
      UI.crest(rival, 26) + '<span class="grow"><span class="name ellipsis" style="display:block">' + esc(rival.name) + '</span>' +
      '<span class="meta">' + esc(U.dateLabel(f.date)) + ' · ' + (f.neutral ? 'Neutral' : home ? 'Local' : 'Visitante') + ' · ' + esc(compLabel(s, f)) + (s.leagues[f.comp] ? '' : ' · ' + esc(f.round)) + '</span></span>' +
      (f.played ? '<b class="num" style="white-space:nowrap">' + scoreText(f) + '</b><span class="res ' + r + '">' + r + '</span>' : '<span class="small muted">' + esc(U.dateLabel(f.date).split(',')[0]) + '</span>') + '</button>';
  }

  // ---------- Simulación ----------
  async function afterSim(target) {
    await H.persist();
    H.unbusy();
    if (target) App.go('match', { id: target.id, comp: target.comp });
    else App.go('hub', {}, { root: true });
  }
  A['sim-match'] = async () => {
    await H.busy('Simulando…');
    try { const f = C.playUserMatch(App.s); await afterSim(f); } finally { H.unbusy(); }
  };
  A['sim-ask'] = () => {
    const s = App.s;
    const next = C.userFixtures(s).filter((f) => !f.played);
    const nextOther = next.find((f) => !s.leagues[f.comp]);
    H.sheet('<h2>Simular varios partidos</h2><p class="small muted">Se jugarán automáticamente con tu alineación y táctica actuales. No se puede deshacer.</p><div class="stack">' +
      '<button class="btn block" data-act="sim-n" data-n="3">Próximos 3 partidos</button>' +
      '<button class="btn block" data-act="sim-n" data-n="5">Próximos 5 partidos</button>' +
      (nextOther ? '<button class="btn block" data-act="sim-until" data-id="' + nextOther.id + '">Hasta antes de ' + esc(compLabel(s, nextOther)) + ' (' + esc(U.dateLabel(nextOther.date)) + ')</button>' : '') +
      '<button class="btn block" data-act="sim-n" data-n="999">Hasta el final de la temporada</button>' +
      '<button class="btn ghost block" data-act="sheet-close">Cancelar</button></div>');
  };
  A['sim-n'] = async (d) => {
    H.closeSheet();
    await H.busy('Simulando partidos…');
    try {
      let last = null;
      for (let i = 0; i < Number(d.n); i++) { const f = C.playUserMatch(App.s); if (!f) break; last = f; }
      if (Number(d.n) >= 999) C.simulateUntil(App.s);
      await H.persist();
      H.toast(last ? 'Simulado hasta el ' + U.dateLabel(last.date) : 'Temporada simulada');
      App.go('hub', {}, { root: true });
    } finally { H.unbusy(); }
  };
  A['sim-until'] = async (d) => {
    H.closeSheet();
    await H.busy('Simulando partidos…');
    try {
      let guard = 0;
      for (;;) {
        const nf = C.nextUserFixture(App.s);
        if (!nf || nf.id === d.id || guard++ > 60) break;
        C.playUserMatch(App.s);
      }
      await H.persist();
      App.go('hub', {}, { root: true });
    } finally { H.unbusy(); }
  };
  A['sim-rest'] = async () => {
    await H.busy('Simulando el resto de la temporada…');
    try { C.simulateUntil(App.s); await H.persist(); App.go('hub', {}, { root: true }); } finally { H.unbusy(); }
  };
  A.match = (d) => App.go('match', { id: d.id, comp: d.comp || d.league });

  // ---------- Calendario ----------
  V.calendar = function () {
    const s = App.s;
    const mine = C.userFixtures(s);
    const comps = Array.from(new Set(mine.map((f) => f.comp)));
    const sel = App.ui.cal.comp;
    const list = mine.filter((f) => sel === 'ALL' || f.comp === sel);
    const months = {};
    list.forEach((f) => { const k = f.date.slice(0, 7); (months[k] = months[k] || []).push(f); });
    const monthName = (k) => new Date(k + '-15T12:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const played = mine.filter((f) => f.played).length;
    let html = '<div class="chips"><button class="chip ' + (sel === 'ALL' ? 'on' : '') + '" data-act="cal-comp" data-v="ALL">Todas</button>' +
      comps.map((c) => '<button class="chip ' + (sel === c ? 'on' : '') + '" data-act="cal-comp" data-v="' + esc(c) + '">' + esc(K.compName(s, c)) + '</button>').join('') + '</div>';
    html += Object.keys(months).map((k) => '<section class="card"><h3 style="text-transform:capitalize">' + esc(monthName(k)) + '</h3><div class="plist">' + months[k].map((f) => fixtureRow(s, f)).join('') + '</div></section>').join('');
    return { title: 'Calendario', sub: s.season.label + ' · ' + played + '/' + mine.length + ' partidos', html };
  };
  A['cal-comp'] = (d) => { App.ui.cal.comp = d.v; App.render(); };

  // ---------- Competiciones ----------
  V.table = function () {
    const s = App.s;
    const userL = C.userClub(s).leagueId;
    const ids = [userL].concat(Object.keys(s.leagues).filter((x) => x !== userL)).concat(K.all(s).filter((c) => c.type === 'euro').map((c) => c.id)).concat(K.all(s).filter((c) => c.type === 'cup').map((c) => c.id)).concat(K.all(s).filter((c) => c.type === 'playoff').map((c) => c.id));
    const sel = App.ui.comp.id && (s.leagues[App.ui.comp.id] || s.comps[App.ui.comp.id]) ? App.ui.comp.id : userL;
    let html = '<div class="chips">' + ids.map((id) => '<button class="chip ' + (id === sel ? 'on' : '') + '" data-act="comp-sel" data-v="' + esc(id) + '">' + esc(K.compName(s, id)) + '</button>').join('') + '</div>';
    if (s.leagues[sel]) html += leagueBlock(s, s.leagues[sel]);
    else if (s.comps[sel].type === 'cup') html += cupBlock(s, s.comps[sel]);
    else if (s.comps[sel].type === 'playoff') html += playoffBlock(s, s.comps[sel]);
    else html += euroBlock(s, s.comps[sel]);
    return { title: 'Competiciones', sub: K.compName(s, sel) + ' · ' + s.season.label, html };
  };
  A['comp-sel'] = (d) => { App.ui.comp.id = d.v; App.ui.comp.tab = 'table'; App.render(); };
  A['comp-tab'] = (d) => { App.ui.comp.tab = d.v; App.render(); };

  function leagueBlock(s, L) {
    const tab = App.ui.comp.tab;
    let html = '<div class="chips"><button class="chip ' + (tab === 'table' ? 'on' : '') + '" data-act="comp-tab" data-v="table">Clasificación</button><button class="chip ' + (tab === 'scorers' ? 'on' : '') + '" data-act="comp-tab" data-v="scorers">Goleadores</button><button class="chip ' + (tab === 'results' ? 'on' : '') + '" data-act="comp-tab" data-v="results">Resultados</button></div>';
    if (tab === 'scorers') {
      const top = C.topScorers(s, L.id, 20);
      return html + '<section class="card"><h3>Máximos goleadores</h3>' + (top.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th class="l">#</th><th class="l">Jugador</th><th>PJ</th><th>G</th><th>Total</th></tr></thead><tbody>' +
        top.map((p, i) => '<tr class="' + (p.clubId === s.clubId ? 'me' : '') + '"><td class="l">' + (i + 1) + '</td><td class="l"><button data-act="player" data-id="' + p.id + '" class="row" style="gap:8px;border:0;background:none;padding:0;color:inherit">' + UI.crest(s.clubs[p.clubId], 18) + '<span class="ellipsis">' + esc(p.name) + '</span></button></td><td>' + (p.stats.lapps != null ? p.stats.lapps : p.stats.apps) + '</td><td class="pts">' + (p.stats.lgoals != null ? p.stats.lgoals : p.stats.goals) + '</td><td>' + p.stats.goals + '</td></tr>').join('') +
        '</tbody></table></div>' : '<p class="small muted">Aún no se han marcado goles.</p>') + '<p class="small muted">PJ y G: liga. Última columna: goles en todas las competiciones.</p></section>';
    }
    if (tab === 'results') {
      const md = Math.max(1, Math.min(L.totalMd, App.ui.calMd || L.played || 1));
      const fx = L.fixtures.filter((f) => f.md === md);
      return html + '<section class="card"><div class="section-head"><h3>Jornada ' + md + '</h3><span class="row" style="gap:6px"><button class="btn sm" data-act="cal-md" data-v="' + (md - 1) + '"' + (md <= 1 ? ' disabled' : '') + ' aria-label="Jornada anterior">‹</button><button class="btn sm" data-act="cal-md" data-v="' + (md + 1) + '"' + (md >= L.totalMd ? ' disabled' : '') + ' aria-label="Jornada siguiente">›</button></span></div>' +
        '<p class="small muted">' + esc(U.dateLabel(fx[0].date)) + '</p><div class="stack">' + fx.map((f) => pairRow(s, f)).join('') + '</div></section>';
    }
    return html + '<section class="card"><div class="section-head"><h3>' + esc(L.name) + '</h3><span class="small muted">Jornada ' + L.played + '/' + L.totalMd + '</span></div>' + H.tableHtml(L, SC.table(L), false) +
      legendHtml(s, L) +
      (!L.relegate && L.tier === 1 ? '<p class="small muted">En esta base de datos la liga no tiene segunda división cargada, así que no hay descensos.</p>' : '') + '</section>';
  }
  App.ACTIONS['cal-md'] = (d) => { App.ui.calMd = Number(d.v); App.render(); };

  function pairRow(s, f) {
    const h = s.clubs[f.home]; const a = s.clubs[f.away];
    const mine = f.home === s.clubId || f.away === s.clubId;
    const win = (id) => (f.winner === id ? 'font-weight:800' : '');
    return '<button class="row" data-act="match" data-id="' + f.id + '" data-comp="' + esc(f.comp) + '" style="border:0;background:' + (mine ? 'var(--accent-soft)' : 'none') + ';padding:6px;border-radius:10px;text-align:left;color:inherit"' + (f.played ? '' : ' disabled') + '>' +
      '<span class="grow ellipsis" style="text-align:right;' + win(f.home) + '">' + esc(h.name) + '</span>' + UI.crest(h, 20) +
      '<b class="num" style="min-width:52px;text-align:center">' + (f.played ? f.hg + '-' + f.ag : esc(U.dateLabel(f.date).split(',')[1] || '–')) + '</b>' + UI.crest(a, 20) +
      '<span class="grow ellipsis" style="' + win(f.away) + '">' + esc(a.name) + '</span></button>' +
      (f.played && (f.pens || f.et) ? '<div class="small muted" style="text-align:center;margin-top:-6px">' + (f.pens ? 'Penaltis ' + f.pens[0] + '-' + f.pens[1] : 'Tras prórroga') + '</div>' : '');
  }

  function legendHtml(s, L) {
    const lo = L.lower ? s.leagues[L.lower] : null;
    let h = '';
    if (L.tier === 1 && L.uefa !== false) h += '<span><i class="zone ucl"></i>Champions</span><span><i class="zone euro"></i>Europa / Conference</span>';
    if (L.upper && L.promote) h += '<span><i class="zone pro"></i>Ascenso directo</span>';
    if (L.upper && L.playoff) h += '<span><i class="zone po"></i>' + (L.playoff === 'ger' ? 'Promoción de ascenso' : 'Playoff de ascenso') + '</span>';
    if (lo && (lo.playoff === 'ger' || lo.playoff === 'fra')) h += '<span><i class="zone relpo"></i>Promoción de permanencia</span>';
    if (L.relegate) h += '<span><i class="zone rel"></i>Descenso</span>';
    return '<div class="legend">' + h + '</div>' + (L.upper && L.playoff ? '<p class="small muted">' + esc(K.PLAYOFF_INFO[L.playoff]) + '</p>' : '');
  }

  function playoffBlock(s, comp) {
    let html = '<section class="card"><div class="section-head"><h3>' + esc(comp.name) + '</h3>' + (comp.winner ? '<span class="pill good">' + esc(s.clubs[comp.winner].name) + '</span>' : '') + '</div>' +
      '<p class="small muted">' + esc(K.PLAYOFF_INFO[comp.format] || '') + '</p>' +
      '<p class="small">Participan: ' + comp.seeds.map((id) => esc(s.clubs[id].name)).join(', ') + (comp.upperClub ? ' y ' + esc(s.clubs[comp.upperClub].name) + ' (categoría superior)' : '') + '.</p></section>';
    comp.rounds.slice().reverse().forEach((r) => {
      html += '<section class="card"><div class="section-head"><h3>' + esc(r.name) + '</h3><span class="small muted">' + esc(U.dateLabel(r.date)) + '</span></div><div class="stack">' + r.ties.map((t) => {
        const fs = t.fixtures.map((id) => comp.fixtures.find((f) => f.id === id));
        return '<div class="stack" style="gap:4px;padding-bottom:6px;border-bottom:1px solid var(--line)">' + fs.map((f) => pairRow(s, f)).join('') + (t.winner ? '<p class="small muted">Pasa: <b>' + esc(s.clubs[t.winner].name) + '</b></p>' : '') + '</div>';
      }).join('') + '</div></section>';
    });
    return html;
  }

  function cupBlock(s, cup) {
    let html = '<section class="card"><div class="section-head"><h3>' + esc(cup.name) + '</h3>' + (cup.winner ? '<span class="pill good">Campeón: ' + esc(s.clubs[cup.winner].name) + '</span>' : '<span class="small muted">' + cup.alive.length + ' equipos vivos</span>') + '</div>' +
      '<p class="small muted">Eliminatorias a partido único. Si hay empate: prórroga y penaltis.' + (cup.lowerHosts ? ' Juega en casa el equipo de menor categoría.' : '') + '</p></section>';
    cup.rounds.slice().reverse().forEach((r) => {
      const fx = r.ties.map((t) => cup.fixtures.find((f) => f.id === t.fixtures[0]));
      const mineFirst = fx.sort((a, b) => ((b.home === s.clubId || b.away === s.clubId) ? 1 : 0) - ((a.home === s.clubId || a.away === s.clubId) ? 1 : 0));
      html += '<section class="card"><div class="section-head"><h3>' + esc(r.name) + '</h3><span class="small muted">' + esc(U.dateLabel(r.date)) + '</span></div><div class="stack">' + mineFirst.map((f) => pairRow(s, f)).join('') + '</div></section>';
    });
    return html;
  }

  function euroBlock(s, comp) {
    const tab = App.ui.comp.tab === 'ko' ? 'ko' : 'table';
    let html = '<div class="chips"><button class="chip ' + (tab === 'table' ? 'on' : '') + '" data-act="comp-tab" data-v="table">Fase liga</button><button class="chip ' + (tab === 'ko' ? 'on' : '') + '" data-act="comp-tab" data-v="ko">Eliminatorias</button></div>';
    if (comp.winner) html += '<section class="notice">Campeón: <b>' + esc(s.clubs[comp.winner].name) + '</b></section>';
    if (tab === 'table') {
      const rows = K.euroTable(comp);
      const zone = (pos) => (pos <= 8 ? 'ucl' : pos <= 24 ? 'euro' : 'rel');
      html += '<section class="card"><div class="section-head"><h3>Fase liga</h3><span class="small muted">' + comp.games + ' partidos por equipo</span></div><div class="table-wrap"><table class="tbl"><thead><tr><th></th><th class="l">#</th><th class="l">Club</th><th>PJ</th><th>DG</th><th>Pts</th></tr></thead><tbody>' +
        rows.map((r) => '<tr class="' + (r.clubId === s.clubId ? 'me' : '') + '"><td class="zone ' + (rows.length >= 24 ? zone(r.pos) : '') + '"></td><td class="l">' + r.pos + '</td><td class="l club"><span class="row" style="gap:8px">' + UI.crest(s.clubs[r.clubId], 18) + '<span class="ellipsis">' + esc(s.clubs[r.clubId].name) + '</span></span></td><td>' + r.p + '</td><td>' + (r.gd > 0 ? '+' : '') + r.gd + '</td><td class="pts">' + r.pts + '</td></tr>').join('') +
        '</tbody></table></div><div class="legend"><span><i class="zone ucl"></i>Octavos directos</span><span><i class="zone euro"></i>Playoff</span><span><i class="zone rel"></i>Eliminado</span></div></section>';
      const mine = comp.fixtures.filter((f) => f.phase === 'league' && (f.home === s.clubId || f.away === s.clubId));
      if (mine.length) html += '<section class="card"><h3>Tus partidos</h3><div class="plist">' + mine.map((f) => fixtureRow(s, f)).join('') + '</div></section>';
    } else {
      if (!comp.ko.length) html += '<section class="card empty"><p>Las eliminatorias empiezan al terminar la fase liga.</p></section>';
      comp.ko.slice().reverse().forEach((r) => {
        html += '<section class="card"><h3>' + esc(r.name) + '</h3><div class="stack">' + r.ties.map((t) => {
          const fs = t.fixtures.map((id) => comp.fixtures.find((f) => f.id === id));
          return '<div class="stack" style="gap:4px;padding-bottom:6px;border-bottom:1px solid var(--line)">' + fs.map((f) => pairRow(s, f)).join('') + '</div>';
        }).join('') + '</div></section>';
      });
    }
    return html;
  }

  // ---------- Crónica ----------
  function evRow(min, side, content) {
    return '<div class="ev"><div class="l">' + (side === 0 ? content : '') + '</div><div class="m">' + min + "'</div><div>" + (side === 1 ? content : '') + '</div></div>';
  }
  function evText(e) {
    if (e.type === 'goal') return '⚽ <b>' + esc(e.name) + '</b>' + (e.pen ? ' <span class="sub">(pen.)</span>' : '') + (e.assist ? '<div class="sub">Asist. ' + esc(e.assist) + '</div>' : '');
    if (e.type === 'penmiss') return '✕ ' + esc(e.name) + '<div class="sub">Penalti fallado</div>';
    if (e.type === 'yellow') return '<i class="ico yellow"></i>' + esc(e.name);
    if (e.type === 'red') return '<i class="ico red"></i>' + esc(e.name) + (e.second ? ' <span class="sub">(2ª amarilla)</span>' : '');
    if (e.type === 'injury') return '✚ ' + esc(e.name) + '<div class="sub">Lesión · ' + e.weeks + ' sem.</div>';
    if (e.type === 'sub') return '⇄ ' + esc(e.name) + '<div class="sub">por ' + esc(e.out) + '</div>';
    if (e.type === 'shootout') return '<b>Penaltis ' + e.score[0] + '-' + e.score[1] + '</b>';
    return '';
  }
  App.h.evRow = evRow;
  App.h.evText = evText;
  function statLines(st) {
    const line = (lbl, a, b, fmt) => {
      const tot = a + b || 1;
      return '<div class="statline"><span class="lbl">' + lbl + '</span><span class="v">' + (fmt ? fmt(a) : a) + '</span><div class="duel"><i style="width:' + (a / tot * 100) + '%"></i><i style="width:' + (b / tot * 100) + '%"></i></div><span class="v">' + (fmt ? fmt(b) : b) + '</span></div>';
    };
    return line('Posesión', st.poss[0], st.poss[1], (x) => x + '%') + line('Tiros', st.shots[0], st.shots[1]) + line('A puerta', st.sot[0], st.sot[1]) +
      line('Goles esperados (xG)', st.xg[0], st.xg[1], (x) => Number(x).toFixed(1)) + (st.corners ? line('Córners', st.corners[0], st.corners[1]) + line('Faltas', st.fouls[0], st.fouls[1]) : '') +
      line('Amarillas', st.yellows[0], st.yellows[1]) + line('Rojas', st.reds[0], st.reds[1]);
  }

  V.match = function (params) {
    const s = App.s;
    const f = K.find(s, params.comp || params.league, params.id);
    if (!f) return { title: 'Partido', html: '<div class="card empty">Partido no encontrado.</div>' };
    const home = s.clubs[f.home]; const away = s.clubs[f.away];
    let html = '<section class="card hero-match"><div class="row wrap" style="gap:6px">' + compPill(s, f) + '<span class="eyebrow">' + esc(f.round || '') + ' · ' + esc(U.dateLabel(f.date)) + '</span></div>' +
      '<div class="fixture"><div class="team">' + UI.crest(home, 52) + '<span class="nm">' + esc(home.name) + '</span></div><div class="scoreboard">' + f.hg + '-' + f.ag + '</div><div class="team">' + UI.crest(away, 52) + '<span class="nm">' + esc(away.name) + '</span></div></div>' +
      (f.pens ? '<p style="text-align:center"><b>Penaltis: ' + f.pens[0] + '-' + f.pens[1] + '</b></p>' : f.et ? '<p class="small muted" style="text-align:center">Tras la prórroga</p>' : '') +
      (f.firstLeg ? firstLegLine(s, f) : '') + (f.winner && f.knockout ? '<p class="small" style="text-align:center">Pasa de ronda: <b>' + esc(s.clubs[f.winner].name) + '</b></p>' : '');
    const rep = f.report;
    if (!rep) {
      html += (f.goals && f.goals.length ? '<div class="timeline">' + f.goals.map((g) => evRow(g[0], g[1], '⚽ ' + esc(g[2]))).join('') + '</div>' : '<p class="small muted">Sin crónica detallada para este partido.</p>') + '</section>';
      return { title: home.short + ' ' + f.hg + '-' + f.ag + ' ' + away.short, sub: 'Resultado', html };
    }
    html += '<p>' + esc(rep.summary) + '</p>';
    if (rep.motm) html += '<div class="row"><span class="pill solid-accent">Mejor jugador</span><b>' + esc(rep.motm.name) + '</b><span class="small muted">' + rep.motm.r.toFixed(1) + '</span></div>';
    html += '</section>';
    if (rep.notices && rep.notices.length) html += '<section class="notice">' + rep.notices.map(esc).join('<br>') + '</section>';
    html += '<section class="card"><h3>Desarrollo</h3><div class="timeline">' + (rep.events.length ? rep.events.filter((e) => e.type !== 'shootout').map((e) => evRow(e.min, e.side, evText(e))).join('') : '<p class="small muted">Partido sin incidencias.</p>') + '</div></section>';
    if (rep.penKicks) {
      html += '<section class="card"><h3>Tanda de penaltis</h3><div class="grid-2">' + rep.penKicks.map((list, i) => '<div class="stack small"><b>' + esc((i ? away : home).short) + '</b>' +
        list.filter(Boolean).map((k) => '<span>' + (k.ok ? '✓ ' : '✕ ') + esc(k.name) + '</span>').join('') + '</div>').join('') + '</div></section>';
    }
    html += '<section class="card"><h3>Estadísticas</h3>' + statLines(rep.stats) + '</section>';
    html += '<section class="grid-2">' + rep.lineups.map((lu, i) => '<div class="card flat" style="padding:12px"><span class="eyebrow">' + esc((i ? away : home).short) + ' · ' + esc(lu.formation) + '</span>' +
      lu.xi.concat(lu.subs).map((p, k) => '<div class="row small" style="gap:6px' + (k >= lu.xi.length ? ';color:var(--muted)' : '') + '"><span style="width:30px;font-weight:700">' + esc(p.pos) + '</span><span class="grow ellipsis">' + esc(H.shortName(p.name)) + '</span><b class="num">' + (p.r ? p.r.toFixed(1) : '—') + '</b></div>').join('') + '</div>').join('') + '</section>';
    return { title: home.short + ' ' + f.hg + '-' + f.ag + ' ' + away.short, sub: 'Crónica del partido', html };
  };

  // ---------- Partido en directo ----------
  const live = (App.live = { on: false });
  function stopTimer() { clearInterval(live.timer); live.timer = null; }

  A['live-start'] = async () => {
    const s = App.s;
    await H.busy('Preparando el partido…');
    try {
      const f = C.playUntilUserMatch(s);
      if (!f) { H.toast('No hay partido pendiente'); return; }
      await H.persist();
      const notices = [];
      const prep = C.prepareMatch(s, f, notices);
      const side = f.home === s.clubId ? 0 : 1;
      prep[side === 0 ? 'home' : 'away'].manual = { noAutoSubs: false };
      Object.assign(live, { on: true, f, prep, notices, side, st: MCM.match.create(prep.home, prep.away, prep.rng, prep.opts), speed: 1, paused: false, phase: 'play', shown: 0 });
      H.unbusy();
      App.go('live', {});
      runTimer();
    } finally { H.unbusy(); }
  };

  function runTimer() {
    stopTimer();
    live.timer = setInterval(tick, live.speed === 1 ? 900 : 300);
  }
  function tick() {
    if (!live.on || live.paused || App.view !== 'live') return;
    const st = live.st;
    if (st.seg === 9 && live.phase === 'play') { live.phase = 'ht'; stopTimer(); App.render(); return; }
    if (st.seg >= MCM.match.SEG) { endLive(); return; }
    MCM.match.playUntil(st, st.seg + 1);
    App.render();
  }
  async function endLive() {
    stopTimer();
    if (!live.on) return;
    live.on = false;
    const res = MCM.match.finish(live.st);
    C.finishLiveMatch(App.s, live.f, live.prep, res);
    const r = live.f.report;
    if (r && live.notices.length) r.notices = live.notices.slice();
    await H.persist();
    App.stack = [];
    App.view = 'hub';
    App.go('match', { id: live.f.id, comp: live.f.comp });
  }
  App.endLive = endLive;

  V.live = function () {
    if (!live.on && !live.st) return { title: 'Partido', html: '<div class="card empty">No hay ningún partido en juego.</div>' };
    const s = App.s;
    const st = live.st;
    const f = live.f;
    const home = s.clubs[f.home]; const away = s.clubs[f.away];
    const minute = Math.min(90, st.seg * 5);
    const evs = st.events.filter((e) => e.min <= minute && e.type !== 'shootout').map((e) => ({
      min: e.min, type: e.type, side: e.side, name: C.nameOf(s, e.pid), assist: e.aid ? C.nameOf(s, e.aid) : null, out: e.outId ? C.nameOf(s, e.outId) : null, weeks: e.weeks, second: e.second, pen: e.pen,
    }));
    const goalsAt = [0, 1].map((side) => evs.filter((e) => e.type === 'goal' && e.side === side).length);
    let html = '<section class="card hero-match"><div class="row wrap" style="gap:6px">' + compPill(s, f) + '<span class="eyebrow">' + esc(f.round || '') + '</span></div>' +
      '<div class="fixture"><div class="team">' + UI.crest(home, 46) + '<span class="nm">' + esc(home.short) + '</span></div><div style="text-align:center"><div class="scoreboard">' + goalsAt[0] + '-' + goalsAt[1] + '</div>' +
      '<div class="pill ' + (live.phase === 'ht' ? 'warn' : 'good') + '" style="margin-top:4px">' + (live.phase === 'ht' ? 'Descanso' : minute + "'") + '</div></div><div class="team">' + UI.crest(away, 46) + '<span class="nm">' + esc(away.short) + '</span></div></div>' +
      '<div class="bar accent"><i style="width:' + Math.round((minute / 90) * 100) + '%"></i></div></section>';
    if (live.phase === 'ht') html += halfTime(s, st);
    else {
      html += '<div class="btn-row"><button class="btn sm" data-act="live-pause">' + (live.paused ? 'Reanudar' : 'Pausa') + '</button><button class="btn sm" data-act="live-speed">' + (live.speed === 1 ? 'Más rápido' : 'Velocidad normal') + '</button><button class="btn sm ghost" data-act="live-skip">Ir al final</button></div>';
      if (live.paused) html += halfTime(s, st, true);
    }
    html += '<section class="card"><h3>En directo</h3><div class="timeline">' + (evs.length ? evs.slice().reverse().map((e) => evRow(e.min, e.side, evText(e))).join('') : '<p class="small muted">Empieza el partido.</p>') + '</div></section>';
    const stats = { poss: [Math.round(st.possN ? st.possSum[0] / st.possN : 50), 0], shots: st.shots, sot: st.sot, xg: st.xg, yellows: st.yellows, reds: st.reds };
    stats.poss[1] = 100 - stats.poss[0];
    html += '<section class="card"><h3>Estadísticas</h3>' + statLines(stats) + '</section>';
    return { title: home.short + ' – ' + away.short, sub: 'Partido en directo', html, tabs: false };
  };

  function halfTime(s, st, paused) {
    const side = live.side;
    const on = st.on[side];
    const bench = st.bench[side].filter((b) => !st.ownersOff.has(b.id));
    const t = st.tactics[side];
    const left = (st.et ? 6 : 5) - st.subsUsed[side];
    const opt = (v, label, cur) => '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>';
    let html = '<section class="card"><h3>' + (paused ? 'Pausa: cambios y táctica' : 'Descanso: cambios y táctica') + '</h3>' +
      '<form class="stack" data-submit="live-sub"><div class="grid-2"><label class="field" for="lv-out">Sale<select class="input" id="lv-out" name="out">' +
      on.slice().sort((a, b) => (a.pos === 'POR') - (b.pos === 'POR') || (a.p.fitness - (M_min(st) - a.minIn) * 0.2) - (b.p.fitness - (M_min(st) - b.minIn) * 0.2))
        .map((e) => opt(e.p.id, e.pos + ' · ' + H.shortName(e.p.name) + ' (' + Math.max(0, Math.round(e.p.fitness - (M_min(st) - e.minIn) * 0.2)) + '% físico)')).join('') + '</select></label>' +
      '<label class="field" for="lv-in">Entra<select class="input" id="lv-in" name="in">' + bench.slice().sort((a, b) => (a.pos === 'POR') - (b.pos === 'POR') || b.ovr - a.ovr).map((b) => opt(b.id, b.pos + ' · ' + H.shortName(b.name) + ' (' + b.ovr + ')')).join('') + '</select></label></div>' +
      '<button class="btn sm" type="submit"' + (left <= 0 || !bench.length ? ' disabled' : '') + '>Hacer cambio (' + left + ' restantes)</button></form>' +
      ['mentality', 'pressing', 'tempo'].map((k) => '<div class="chips">' + LU.TACTIC_OPTIONS[k].map((o) => '<button class="chip ' + (t[k] === o[0] ? 'on' : '') + '" data-act="live-tactic" data-k="' + k + '" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>').join('') +
      '<button class="btn primary block" data-act="live-resume">' + (paused ? 'Reanudar' : 'Empezar la segunda parte') + '</button></section>';
    return html;
  }
  const M_min = (st) => Math.min(90, st.seg * 5);

  A['live-pause'] = () => { live.paused = !live.paused; App.render(); };
  A['live-speed'] = () => { live.speed = live.speed === 1 ? 3 : 1; runTimer(); App.render(); };
  A['live-skip'] = () => { live.paused = false; endLive(); };
  A['live-resume'] = () => { live.paused = false; if (live.phase === 'ht') live.phase = 'play2'; runTimer(); App.render(); };
  A['live-tactic'] = (d) => { const t = {}; t[d.k] = d.v; MCM.match.setTactics(live.st, live.side, t); App.render(); };
  App.FORMS['live-sub'] = (fd) => {
    const err = MCM.match.manualSub(live.st, live.side, String(fd.get('out')), String(fd.get('in')));
    if (err) H.toast(err); else H.toast('Cambio realizado');
    App.render();
  };

  // Si se sale de la pantalla del partido, se termina automáticamente.
  const baseBack = App.back;
  App.back = function () {
    if (live.on && App.view === 'live') { endLive(); return; }
    return baseBack();
  };
  const baseGo = App.go;
  App.go = function (view, params, opts) {
    if (live.on && App.view === 'live' && view !== 'live') { live.paused = true; endLive(); return; }
    return baseGo(view, params, opts);
  };
})(globalThis.MCM = globalThis.MCM || {});
