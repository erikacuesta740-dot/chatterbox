/* Interfaz de fichajes, negociaciones, finanzas, contratos y cantera (Etapas 2 y 3). */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const UI = MCM.ui;
  const C = MCM.career;
  const T = MCM.market;
  const D = MCM.dev;
  const PL = MCM.players;
  const App = MCM.app;
  const V = App.VIEWS;
  const A = App.ACTIONS;
  const F = App.FORMS;
  const H = App.h;
  const esc = U.esc;
  const icon = UI.icon;
  const $ = (sel) => document.querySelector(sel);

  App.ui.mk = App.ui.mk || { tab: 'search', q: '', pos: 'ALL', league: 'ALL', club: 'ALL', nat: 'ALL', ageMin: '', ageMax: '', ovr: '', pot: '', price: '', sort: 'ovr' };
  App.ui.fa = App.ui.fa || { pos: 'ALL', ageMax: '', ovr: '', pot: '' };

  const TYPE_LABEL = { buy: 'Fichaje', free: 'Agente libre', 'loan-in': 'Cesión (llega)', 'loan-out': 'Cesión (sale)', sell: 'Venta', release: 'Rescisión', renew: 'Renovación', expired: 'Fin de contrato', ai: 'Otros clubes' };

  function windowChip(s) {
    const w = T.window(s);
    return '<span class="pill ' + (w.open ? 'good' : 'mute') + '">' + esc(w.label) + (w.open ? ' · ' + esc(w.until) : '') + '</span>';
  }
  function refLine(s, p) {
    const r = T.reference(s, p);
    return r.kind === 'fc27'
      ? 'Valor FC 27: <b>' + esc(r.entry.raw) + '</b> <span class="small muted">(' + (r.entry.status === 'verified' ? 'verificado según ' : 'importado de ') + esc(r.entry.source) + ')</span>'
      : 'Valor de referencia: <b>' + U.money(r.value) + '</b> <span class="small muted">(estimado del juego; FC 27 no verificado)</span>';
  }
  function statusIcons(p) {
    return (p.listed ? ' <span class="pill warn">Transferible</span>' : '') + (p.loan ? ' <span class="pill info">Cedido</span>' : '') + (p.wantsOut ? ' <span class="pill bad">Pide salir</span>' : '');
  }

  // ---------- Inicio: estado del mercado ----------
  const baseHub = V.hub;
  V.hub = function () {
    const v = baseHub();
    const s = App.s;
    const pend = s.market.offers.filter((o) => o.status === 'pending');
    const club = s.clubs[s.clubId];
    const conf = Math.round(s.dev ? s.dev.confidence : 60);
    const block = '<section class="card"><div class="section-head"><h3>Despacho</h3>' + windowChip(s) + '</div>' +
      '<div class="kv"><div><span>Presupuesto fichajes</span><b>' + U.money(club.budget) + '</b></div><div><span>Margen salarial</span><b>' + U.wage(Math.max(0, T.wageRoom(s))) + '</b></div></div>' +
      '<div class="attr"><span>Directiva</span>' + UI.bar(conf, 100, conf < 30 ? 'bad' : conf < 55 ? 'warn' : '') + '<b>' + conf + '</b></div>' +
      (pend.length ? '<button class="btn primary block" data-act="nav" data-view="market" data-tab="offers">' + icon('transfer') + pend.length + (pend.length > 1 ? ' ofertas recibidas' : ' oferta recibida') + '</button>' : '') +
      '</section>';
    const i = v.html.indexOf('</section>');
    v.html = v.html.slice(0, i + 10) + block + v.html.slice(i + 10);
    return v;
  };

  // ---------- Ficha del jugador ----------
  V.player = function (params) {
    const s = App.s;
    const p = s.players[params.id];
    if (!p) return { title: 'Jugador', html: '<div class="card empty">Este jugador ya no está en la base de datos (retirado o liberado de la cantera).</div>' };
    const club = p.clubId ? s.clubs[p.clubId] : null;
    const st = PL.statusOf(p);
    const attrs = p.pos === 'POR' ? PL.GK_ATTRS : PL.OUT_ATTRS;
    const sts = p.stats;
    const mine = p.clubId === s.clubId;
    let html = '<section class="card"><div class="row">' + UI.ovr(p.ovr, 'lg') + '<div class="grow"><h2>' + esc(p.name) + '</h2>' +
      '<div class="small muted">' + esc(PL.POSITIONS[p.pos].name) + (p.alt.length ? ' · también ' + p.alt.join(', ') : '') + '</div>' +
      '<div class="small muted">' + p.age + ' años · ' + esc(MCM.DATA.nationName(p.nat)) + '</div></div>' +
      '<div style="text-align:center"><div class="eyebrow">Pot.</div><div class="scoreboard" style="font-size:1.8rem">' + p.pot + '</div></div></div>' +
      '<div class="row wrap">' + (club ? '<span class="row" style="gap:6px">' + UI.crest(club, 20) + '<span class="small">' + esc(club.name) + (p.academy ? ' (cantera)' : '') + '</span></span>' : '<span class="pill mute">Agente libre</span>') +
      '<span class="pill ' + (st.code === 'ok' ? 'good' : st.code === 'tired' ? 'warn' : 'bad') + '">' + esc(st.label) + '</span>' +
      (p.youth ? '<span class="pill info">Cantera</span>' : '') + (p.demo ? '<span class="pill mute">Ficticio</span>' : p.src === 'knowledge' ? '<span class="pill warn">Real · no verificado</span>' : '<span class="pill info">Importado</span>') + statusIcons(p) + '</div>' +
      (p.loan ? '<p class="small">Cedido ' + (p.loan.parent === s.clubId ? 'a ' + esc(club.name) : 'por ' + esc(s.clubs[p.loan.parent].name)) + ' hasta junio de ' + p.loan.until + '.</p>' : '') +
      '<p class="small muted">' + (p.demo ? 'Jugador ficticio: nombre, media, potencial, edad y posición son inventados, no datos de FC 27.'
        : p.src === 'knowledge' ? 'Jugador real. Club, posición y edad según el conocimiento del asistente hasta mediados de 2026 (no verificados; puede haber cambiado de club). Media y potencial son estimaciones, no las valoraciones de FC 27.'
          : 'Datos de la base importada «' + esc(s.dataset.name) + '»' + (p.extId ? ' (id ' + esc(p.extId) + ')' : '') + '.') + '</p></section>';
    html += dealCard(s, p);
    html += H.fc27Card(p, club);
    html += '<section class="kv"><div><span>Valor estimado del juego</span><b>' + U.money(p.value) + '</b></div><div><span>Salario</span><b>' + U.wage(p.wage) + '</b></div>' +
      '<div><span>Contrato hasta</span><b>' + (p.academy ? 'Juvenil' : 'Jun ' + p.contractEnd) + '</b></div><div><span>Rol</span><b>' + esc(T.ROLE_LABEL[T.role(s, p)] || '—') + '</b></div></section>';
    html += '<section class="card"><h3>Estado</h3>' +
      '<div class="attr"><span>Forma física</span>' + UI.bar(p.fitness, 100) + '<b>' + Math.round(p.fitness) + '</b></div>' +
      '<div class="attr"><span>Moral</span>' + UI.bar(p.morale, 100, p.morale < 45 ? 'bad' : 'accent') + '<b>' + Math.round(p.morale) + '</b></div>' +
      '<p class="small muted">Moral: ' + UI.moraleLabel(p.morale) + '. Forma (nota media reciente): ' + p.form.toFixed(1) + '. Amarillas acumuladas: ' + p.yc + '/5.</p></section>';
    html += '<section class="card"><h3>Atributos</h3>' + attrs.map((a) => '<div class="attr"><span>' + a[1] + '</span>' + UI.bar(p.attrs[a[0]], 99, 'accent') + '<b>' + p.attrs[a[0]] + '</b></div>').join('') + '</section>';
    if (p.ovrHist && p.ovrHist.length) {
      html += '<section class="card"><h3>Progresión</h3><div class="row wrap" style="gap:6px">' + p.ovrHist.map((h) => '<span class="pill mute">' + esc(h.s) + ' J' + h.md + ': <b>' + h.ovr + '</b></span>').join('') + '</div></section>';
    }
    html += '<section class="card"><h3>Temporada ' + esc(s.season.label) + '</h3><div class="grid-3">' +
      [['Partidos', sts.apps], ['Titular', sts.starts], ['Minutos', sts.min], ['Goles', sts.goals], ['Asist.', sts.assists], ['Nota', sts.rN ? (sts.rSum / sts.rN).toFixed(2) : '—'],
        ['MVP', sts.motm], ['Amarillas', sts.yel], ['Rojas', sts.red]].map((x) => '<div class="kv" style="display:block"><div><span>' + x[0] + '</span><b>' + x[1] + '</b></div></div>').join('') + '</div></section>';
    html += '<section class="card"><h3>Historial de lesiones</h3>' + (p.injuries.length
      ? p.injuries.slice().reverse().map((i) => '<div class="row"><span class="grow">' + esc(i.type) + '</span><span class="small muted">' + esc(i.season) + ' · ' + i.weeks + ' sem.</span></div>').join('')
      : '<p class="small muted">Sin lesiones registradas.</p>') + '</section>';
    return { title: p.name, sub: p.pos + ' · ' + (club ? club.name : 'Sin club'), html };
  };

  function dealCard(s, p) {
    const mine = p.clubId === s.clubId;
    const talk = T.talkFor(s, p.id);
    let html = '<section class="card"><div class="section-head"><h3>' + (mine ? (p.academy ? 'Cantera' : 'Contrato y mercado') : 'Fichar') + '</h3>' + (p.academy ? '' : windowChip(s)) + '</div>';
    if (p.academy) {
      html += '<p class="small">Juvenil de la cantera. Súbelo al primer equipo cuando esté preparado' + (p.mustDecide ? ' (ya tiene edad para hacerlo)' : '') + '.</p>' +
        '<div class="btn-row"><button class="btn primary sm" data-act="youth-promote" data-id="' + p.id + '">Subir al primer equipo</button><button class="btn sm ghost" data-act="youth-release" data-id="' + p.id + '" style="color:var(--bad)">Liberar</button></div></section>';
      return html;
    }
    if (talk && talk.stage !== 'failed') {
      html += '<p class="small">Negociación en curso (' + (talk.stage === 'club' ? 'con el club' : 'con el jugador') + ').</p><button class="btn primary block" data-act="talk-open" data-id="' + p.id + '">Continuar negociación</button></section>';
      return html;
    }
    if (mine) {
      const yl = T.yearsLeft(s, p);
      html += '<p class="small">' + refLine(s, p) + '</p><p class="small muted">Contrato hasta junio de ' + p.contractEnd + (yl === 0 ? ' — <b style="color:var(--warn)">vence esta temporada</b>' : '') + '. ' + esc(T.ROLE_LABEL[T.role(s, p)]) + '.</p>' +
        '<div class="btn-row">' +
        (!p.loan ? '<button class="btn sm' + (yl <= 1 ? ' primary' : '') + '" data-act="talk-start" data-kind="renew" data-id="' + p.id + '">Renovar</button>' : '') +
        (!p.loan ? '<button class="btn sm" data-act="toggle-listed" data-id="' + p.id + '">' + (p.listed ? 'Quitar de transferibles' : 'Poner transferible') + '</button>' : '') +
        (!p.loan ? '<button class="btn sm" data-act="loan-out-ask" data-id="' + p.id + '">Ceder</button>' : '') +
        (!p.loan ? '<button class="btn sm ghost" data-act="release-ask" data-id="' + p.id + '" style="color:var(--bad)">Rescindir</button>' : '') +
        '</div></section>';
      return html;
    }
    if (p.loan && p.loan.parent === s.clubId) return html + '<p class="small">Jugador de tu club cedido hasta junio.</p></section>';
    const w = T.willingness(s, p);
    const d = T.contractDemand(s, p, p.clubId ? 'buy' : 'free');
    const short = s.market.shortlist.includes(p.id);
    html += '<p class="small">' + refLine(s, p) + '</p>';
    if (p.clubId) html += '<p class="small">Precio que pide ' + esc(s.clubs[p.clubId].name) + ': <b>' + U.money(T.askingPrice(s, p)) + '</b> <span class="muted">(' + esc(T.ROLE_LABEL[T.role(s, p)].toLowerCase()) + ', contrato hasta ' + p.contractEnd + ')</span></p>';
    html += '<p class="small">Pediría unos <b>' + U.wage(d.wage) + '</b> durante ' + d.years + (d.years > 1 ? ' años' : ' año') + ' y ' + U.money(d.bonus) + ' de prima. <span class="' + (w.ok ? 'muted' : '') + '" style="' + (w.ok ? '' : 'color:var(--bad)') + '">' + esc(w.reason) + '</span></p>';
    const err = T.canApproach(s, p);
    html += '<div class="btn-row">' +
      (p.clubId ? '<button class="btn primary sm" data-act="talk-start" data-kind="buy" data-id="' + p.id + '"' + (err || !w.ok ? ' disabled' : '') + '>Ofertar traspaso</button><button class="btn sm" data-act="talk-start" data-kind="loan" data-id="' + p.id + '"' + (err || !w.ok ? ' disabled' : '') + '>Pedir cesión</button>'
        : '<button class="btn primary sm" data-act="talk-start" data-kind="free" data-id="' + p.id + '"' + (!w.ok ? ' disabled' : '') + '>Ofrecer contrato</button>') +
      '<button class="btn sm ghost" data-act="shortlist" data-id="' + p.id + '">' + (short ? '★ En seguimiento' : '☆ Seguir') + '</button></div>' +
      (err && p.clubId ? '<p class="small muted">' + esc(err) + '</p>' : '') + '</section>';
    return html;
  }

  // ---------- Hoja de negociación ----------
  const KIND_LABEL = { buy: 'Traspaso', loan: 'Cesión', free: 'Agente libre', renew: 'Renovación' };
  function talkSheet(pid) {
    const s = App.s;
    const p = s.players[pid];
    const t = T.talkFor(s, pid);
    if (!t) { H.closeSheet(); return; }
    const club = p.clubId ? s.clubs[p.clubId] : null;
    let html = '<div class="section-head"><h2>' + esc(KIND_LABEL[t.kind]) + ': ' + esc(p.name) + '</h2>' + UI.ovr(p.ovr) + '</div>' +
      '<p class="small">' + refLine(s, p) + '</p>' +
      '<div class="kv"><div><span>Presupuesto fichajes</span><b>' + U.money(s.clubs[s.clubId].budget) + '</b></div><div><span>Margen salarial</span><b>' + U.wage(Math.max(0, T.wageRoom(s))) + '</b></div></div>';
    if (t.rounds.length) {
      html += '<div class="stack small">' + t.rounds.map((r) => '<div class="row" style="align-items:flex-start"><b style="width:64px;flex:none">' + esc(r.by === 'tú' ? 'Tú' : r.by === 'club' ? 'Club' : 'Jugador') + '</b><span class="grow">' +
        [r.fee != null ? 'Traspaso ' + U.money(r.fee) : '', r.wageShare != null ? 'pagas ' + r.wageShare + '% del salario' : '', r.wage != null ? U.wage(r.wage) : '', r.years ? r.years + ' años' : '', r.bonus != null ? 'prima ' + U.money(r.bonus) : '', r.text ? esc(r.text) : ''].filter(Boolean).join(' · ') + '</span></div>').join('') + '</div>';
    }
    if (t.stage === 'failed') {
      html += '<p class="notice">Negociación terminada sin acuerdo.</p><button class="btn block" data-act="talk-close" data-id="' + pid + '">Cerrar</button>';
    } else if (t.stage === 'club') {
      const def = t.kind === 'loan' ? t.asking : Math.round(t.asking * 0.9);
      html += '<form class="stack" data-submit="talk-club" data-id="' + pid + '">' +
        '<p class="small">' + (t.kind === 'loan' ? 'Cesión hasta final de temporada. ' + esc(club.name) + ' pide una compensación de ' + U.money(t.asking) + ' si pagas el 50% del salario (pagar más salario reduce la compensación).' : esc(club.name) + ' pide <b>' + U.money(t.asking) + '</b>. Paciencia del club: ' + t.patience + '.') + '</p>' +
        '<label class="field" for="tk-fee">' + (t.kind === 'loan' ? 'Compensación (€)' : 'Tu oferta (€)') + '<input class="input" id="tk-fee" name="fee" type="number" inputmode="numeric" min="0" step="50000" value="' + def + '"></label>' +
        (t.kind === 'loan' ? '<label class="field" for="tk-share">Porcentaje del salario que pagas<select class="input" id="tk-share" name="share">' + [0, 25, 50, 75, 100].map((x) => '<option value="' + x + '"' + (x === t.wageShare ? ' selected' : '') + '>' + x + '% (' + U.wage(Math.round(p.wage * x / 100)) + ')</option>').join('') + '</select></label>' : '') +
        '<div class="btn-row"><button class="btn primary" type="submit">Enviar oferta</button><button class="btn ghost" type="button" data-act="talk-cancel" data-id="' + pid + '">Abandonar</button></div></form>';
    } else {
      const d = t.demand;
      html += '<form class="stack" data-submit="talk-player" data-id="' + pid + '">' +
        '<p class="small">' + (t.kind === 'loan' ? 'Acuerdo con ' + esc(club.name) + ' cerrado. Confirma la cesión: el jugador cobrará lo acordado y tú pagas el ' + t.wageShare + '% (' + U.wage(Math.round(p.wage * t.wageShare / 100)) + ').'
          : 'Petición del jugador: <b>' + U.wage(d.wage) + '</b>, ' + d.years + (d.years > 1 ? ' años' : ' año') + ', prima de ' + U.money(d.bonus) + '. Paciencia: ' + t.patience + '.') + '</p>' +
        (t.kind === 'loan' ? '' :
          '<label class="field" for="tk-wage">Salario (€/semana)<input class="input" id="tk-wage" name="wage" type="number" inputmode="numeric" min="0" step="250" value="' + d.wage + '"></label>' +
          '<div class="grid-2"><label class="field" for="tk-years">Años<select class="input" id="tk-years" name="years">' + [1, 2, 3, 4, 5].map((y) => '<option' + (y === d.years ? ' selected' : '') + '>' + y + '</option>').join('') + '</select></label>' +
          '<label class="field" for="tk-bonus">Prima de firma (€)<input class="input" id="tk-bonus" name="bonus" type="number" inputmode="numeric" min="0" step="10000" value="' + d.bonus + '"></label></div>') +
        (t.fee ? '<p class="small muted">Traspaso acordado: ' + U.money(t.fee) + '. Se paga al firmar.</p>' : '') +
        '<div class="btn-row"><button class="btn primary" type="submit">' + (t.kind === 'loan' ? 'Confirmar cesión' : 'Ofrecer contrato') + '</button><button class="btn ghost" type="button" data-act="talk-cancel" data-id="' + pid + '">Abandonar</button></div></form>';
    }
    H.sheet(html);
  }

  A['talk-start'] = async (d) => {
    const r = T.start(App.s, d.id, d.kind);
    if (r.error) { H.toast(r.error); return; }
    await H.persist();
    App.render();
    talkSheet(d.id);
  };
  A['talk-open'] = (d) => talkSheet(d.id);
  A['talk-cancel'] = async (d) => { T.cancel(App.s, d.id); await H.persist(); H.closeSheet(); App.render(); };
  A['talk-close'] = async (d) => { T.cancel(App.s, d.id); await H.persist(); H.closeSheet(); App.render(); };
  F['talk-club'] = async (fd, form) => {
    const pid = form.dataset.id;
    const r = T.offerClub(App.s, pid, Number(fd.get('fee') || 0), Number(fd.get('share') || 0));
    if (r.error) { H.toast(r.error); return; }
    await H.persist();
    App.render();
    talkSheet(pid);
  };
  F['talk-player'] = async (fd, form) => {
    const pid = form.dataset.id;
    const r = T.offerContract(App.s, pid, { wage: Number(fd.get('wage') || 0), years: Number(fd.get('years') || 1), bonus: Number(fd.get('bonus') || 0) });
    if (r.error) { H.toast(r.error); return; }
    await H.persist();
    if (r.status === 'done') { H.closeSheet(); H.toast('¡Acuerdo cerrado!'); App.render(); return; }
    App.render();
    talkSheet(pid);
  };
  A.shortlist = async (d) => { T.toggleShortlist(App.s, d.id); await H.persist(); App.render(); };
  A['toggle-listed'] = async (d) => { T.toggleListed(App.s, d.id); await H.persist(); App.render(); };
  A['loan-out-ask'] = (d) => {
    const p = App.s.players[d.id];
    H.confirmSheet({ title: 'Ceder a ' + p.name, body: 'Se buscará un club que le dé minutos hasta final de temporada. Su salario lo paga el club de destino y vuelve en junio.', yes: 'Buscar cesión',
      onYes: async () => { const r = T.loanOut(App.s, d.id); if (r.error) { H.toast(r.error); return; } await H.persist(); H.toast('Cedido a ' + r.club); App.render(); } });
  };
  A['release-ask'] = (d) => {
    const p = App.s.players[d.id];
    H.confirmSheet({ title: 'Rescindir a ' + p.name, body: 'Pagarás ' + U.money(T.releaseCost(App.s, p)) + ' (la mitad del salario que le queda) y quedará como agente libre. No se puede deshacer.', yes: 'Rescindir contrato', danger: true,
      onYes: async () => { const r = T.release(App.s, d.id); if (r.error) { H.toast(r.error); return; } await H.persist(); H.toast('Contrato rescindido'); App.back(); } });
  };

  // ---------- Mercado ----------
  V.market = function (params) {
    const s = App.s;
    const f = App.ui.mk;
    if (params && params.tab) { f.tab = params.tab; params.tab = null; }
    const club = s.clubs[s.clubId];
    const pend = s.market.offers.filter((o) => o.status === 'pending');
    let html = '<section class="card"><div class="row wrap">' + windowChip(s) + '</div><div class="kv"><div><span>Presupuesto fichajes</span><b>' + U.money(club.budget) + '</b></div><div><span>Margen salarial</span><b>' + U.wage(Math.max(0, T.wageRoom(s))) + '</b></div></div>' +
      '<p class="small muted">Plantilla: ' + club.squad.length + '/' + T.MAX_SQUAD + '. Fuera de ventana solo puedes fichar agentes libres y renovar.</p></section>' +
      '<div class="chips">' + [['search', 'Buscar'], ['offers', 'Ofertas recibidas' + (pend.length ? ' (' + pend.length + ')' : '')], ['talks', 'Negociaciones'], ['short', 'Seguimiento'], ['moves', 'Movimientos']].map((t) => '<button class="chip ' + (f.tab === t[0] ? 'on' : '') + '" data-act="mk-tab" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
    if (f.tab === 'search') html += searchTab(s, f);
    else if (f.tab === 'offers') html += offersTab(s);
    else if (f.tab === 'talks') html += talksTab(s);
    else if (f.tab === 'short') html += listCard('Seguimiento', s.market.shortlist.map((id) => s.players[id]).filter(Boolean), s, 'Sigue jugadores con la estrella de su ficha.');
    else html += movesTab(s);
    return { title: 'Mercado de fichajes', sub: T.window(s).label, html };
  };

  function listCard(title, list, s, empty) {
    return '<section class="card"><div class="section-head"><h3>' + esc(title) + '</h3><span class="small muted">' + list.length + '</span></div><div class="plist">' +
      (list.length ? list.map((p) => UI.playerRow(p, { meta: (p.clubId ? esc(s.clubs[p.clubId].short) : 'Libre') + ' · ' + marketLabel(s, p) })).join('') : '<p class="small muted">' + esc(empty) + '</p>') + '</div></section>';
  }
  function marketLabel(s, p) {
    const r = T.reference(s, p);
    return r.kind === 'fc27' ? 'FC 27: ' + esc(r.entry.raw) : 'est. ' + U.money(r.value);
  }

  function searchTab(s, f) {
    const leagues = Object.values(s.leagues);
    const clubs = Object.values(s.clubs).filter((c) => f.league === 'ALL' || c.leagueId === f.league).sort((a, b) => a.name.localeCompare(b.name));
    const nats = Array.from(new Set(Object.values(s.players).map((p) => p.nat))).sort((a, b) => MCM.DATA.nationName(a).localeCompare(MCM.DATA.nationName(b)));
    const q = f.q.trim().toLowerCase();
    const num = (x) => (x === '' || x == null ? null : Number(x));
    const ageMin = num(f.ageMin), ageMax = num(f.ageMax), ovr = num(f.ovr), pot = num(f.pot), price = num(f.price);
    let res = Object.values(s.players).filter((p) => p.clubId && p.clubId !== s.clubId && !p.academy &&
      (f.pos === 'ALL' || p.pos === f.pos) && (f.league === 'ALL' || s.clubs[p.clubId].leagueId === f.league) &&
      (f.club === 'ALL' || p.clubId === f.club) && (f.nat === 'ALL' || p.nat === f.nat) &&
      (ageMin == null || p.age >= ageMin) && (ageMax == null || p.age <= ageMax) && (ovr == null || p.ovr >= ovr) && (pot == null || p.pot >= pot) &&
      (!q || p.name.toLowerCase().includes(q)));
    if (price != null) res = res.filter((p) => T.askingPrice(s, p) <= price);
    const sorters = { ovr: (a, b) => b.ovr - a.ovr, pot: (a, b) => b.pot - a.pot, age: (a, b) => a.age - b.age, value: (a, b) => T.reference(s, b).value - T.reference(s, a).value };
    res.sort(sorters[f.sort] || sorters.ovr);
    const total = res.length;
    res = res.slice(0, 80);
    const opt = (v, cur, label) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(label) + '</option>';
    return '<form class="card" data-submit="mk-search"><label class="field" for="mk-q">Nombre<input class="input" id="mk-q" name="q" value="' + esc(f.q) + '" placeholder="Buscar por nombre"></label>' +
      '<div class="grid-2"><label class="field" for="mk-pos">Posición<select class="input" id="mk-pos" name="pos">' + opt('ALL', f.pos, 'Todas') + PL.POS_ORDER.map((x) => opt(x, f.pos, x)).join('') + '</select></label>' +
      '<label class="field" for="mk-league">Liga<select class="input" id="mk-league" name="league">' + opt('ALL', f.league, 'Todas') + leagues.map((l) => opt(l.id, f.league, l.name)).join('') + '</select></label></div>' +
      '<div class="grid-2"><label class="field" for="mk-club">Club<select class="input" id="mk-club" name="club">' + opt('ALL', f.club, 'Todos') + clubs.map((c) => opt(c.id, f.club, c.name)).join('') + '</select></label>' +
      '<label class="field" for="mk-nat">Nacionalidad<select class="input" id="mk-nat" name="nat">' + opt('ALL', f.nat, 'Todas') + nats.map((n) => opt(n, f.nat, MCM.DATA.nationName(n))).join('') + '</select></label></div>' +
      '<div class="grid-2"><label class="field" for="mk-agemin">Edad mín.<input class="input" id="mk-agemin" name="ageMin" type="number" inputmode="numeric" value="' + esc(f.ageMin) + '"></label>' +
      '<label class="field" for="mk-agemax">Edad máx.<input class="input" id="mk-agemax" name="ageMax" type="number" inputmode="numeric" value="' + esc(f.ageMax) + '"></label></div>' +
      '<div class="grid-3"><label class="field" for="mk-ovr">Media mín.<input class="input" id="mk-ovr" name="ovr" type="number" inputmode="numeric" value="' + esc(f.ovr) + '"></label>' +
      '<label class="field" for="mk-pot">Pot. mín.<input class="input" id="mk-pot" name="pot" type="number" inputmode="numeric" value="' + esc(f.pot) + '"></label>' +
      '<label class="field" for="mk-price">Precio máx. (€)<input class="input" id="mk-price" name="price" type="number" inputmode="numeric" step="100000" value="' + esc(f.price) + '"></label></div>' +
      '<label class="field" for="mk-sort">Ordenar por<select class="input" id="mk-sort" name="sort">' + opt('ovr', f.sort, 'Media') + opt('pot', f.sort, 'Potencial') + opt('age', f.sort, 'Edad') + opt('value', f.sort, 'Valor') + '</select></label>' +
      '<div class="btn-row"><button class="btn primary" type="submit">Buscar</button><button class="btn ghost" type="button" data-act="mk-reset">Limpiar filtros</button></div></form>' +
      '<section class="card"><div class="section-head"><h3>Resultados</h3><span class="small muted">' + total + (total > 80 ? ' (mostrando 80)' : '') + '</span></div><div class="plist">' +
      res.map((p) => UI.playerRow(p, { meta: esc(s.clubs[p.clubId].short) + ' · pide ' + U.money(T.askingPrice(s, p)) })).join('') + '</div></section>';
  }

  function offersTab(s) {
    const list = s.market.offers.slice(0, 30);
    if (!list.length) return '<section class="card empty"><p>No has recibido ofertas. Pon jugadores como transferibles para atraer interés cuando el mercado esté abierto.</p></section>';
    return '<section class="card"><h3>Ofertas recibidas</h3><div class="stack">' + list.map((o) => {
      const p = s.players[o.pid];
      const c = s.clubs[o.clubId];
      if (!p || !c) return '';
      const pending = o.status === 'pending';
      const label = { pending: 'Pendiente', accepted: 'Aceptada', rejected: 'Rechazada', expired: 'Caducada', withdrawn: 'Retirada' }[o.status];
      return '<div class="card flat" style="padding:12px"><div class="row">' + UI.crest(c, 26) + '<div class="grow"><b>' + esc(c.name) + '</b><div class="small">' + (o.type === 'loan' ? 'Cesión de ' : 'Traspaso de ') + '<button data-act="player" data-id="' + p.id + '" style="border:0;background:none;padding:0;font-weight:700;color:inherit;text-decoration:underline">' + esc(p.name) + '</button>' + (o.type === 'loan' ? '' : ' por <b>' + U.money(o.fee) + '</b>') + '</div>' +
        '<div class="small muted">' + refLine(s, p) + '</div></div><span class="pill ' + (pending ? 'warn' : o.status === 'accepted' ? 'good' : 'mute') + '">' + label + '</span></div>' +
        (pending ? '<div class="btn-row"><button class="btn primary sm" data-act="offer-accept" data-id="' + o.id + '">Aceptar</button>' +
          (o.type === 'buy' ? '<button class="btn sm" data-act="offer-counter" data-id="' + o.id + '">Pedir más</button>' : '') +
          '<button class="btn sm ghost" data-act="offer-reject" data-id="' + o.id + '">Rechazar</button></div>' : '') + '</div>';
    }).join('') + '</div></section>';
  }

  function talksTab(s) {
    const talks = Object.values(s.market.talks);
    if (!talks.length) return '<section class="card empty"><p>No hay negociaciones abiertas.</p></section>';
    return '<section class="card"><h3>Negociaciones</h3><div class="plist">' + talks.map((t) => {
      const p = s.players[t.pid];
      return p ? '<button class="prow" data-act="talk-open" data-id="' + p.id + '">' + UI.ovr(p.ovr) + '<span class="grow"><span class="name">' + esc(p.name) + '</span><span class="meta" style="display:block">' + esc(KIND_LABEL[t.kind]) + ' · ' + (t.stage === 'club' ? 'con el club' : t.stage === 'player' ? 'con el jugador' : 'terminada') + '</span></span></button>' : '';
    }).join('') + '</div></section>';
  }

  function movesTab(s) {
    const mine = s.transfers.filter((t) => t.type !== 'ai');
    const other = s.transfers.filter((t) => t.type === 'ai' && t.fee > 0).slice(0, 25);
    const row = (t) => '<div class="row small" style="align-items:flex-start;padding:6px 0;border-bottom:1px solid var(--line)"><span style="width:72px;flex:none" class="muted">' + esc(t.season) + '</span><span class="grow"><b>' + esc(t.name) + '</b> <span class="muted">(' + esc(t.pos) + ', ' + t.ovr + ')</span><br>' + esc(t.from) + ' → ' + esc(t.to) + ' · ' + esc(TYPE_LABEL[t.type] || t.type) + '</span><b class="num">' + (t.fee ? U.money(t.fee) : '—') + '</b></div>';
    return '<section class="card"><h3>Tus movimientos</h3>' + (mine.length ? mine.map(row).join('') : '<p class="small muted">Aún no hay movimientos.</p>') + '</section>' +
      '<section class="card"><h3>Otros traspasos</h3>' + (other.length ? other.map(row).join('') : '<p class="small muted">Sin traspasos entre otros clubes todavía.</p>') + '</section>';
  }

  A['mk-tab'] = (d) => { App.ui.mk.tab = d.v; App.render(); };
  A['mk-reset'] = () => { const t = App.ui.mk.tab; App.ui.mk = { tab: t, q: '', pos: 'ALL', league: 'ALL', club: 'ALL', nat: 'ALL', ageMin: '', ageMax: '', ovr: '', pot: '', price: '', sort: 'ovr' }; App.render(); };
  F['mk-search'] = (fd) => {
    const f = App.ui.mk;
    ['q', 'pos', 'league', 'club', 'nat', 'ageMin', 'ageMax', 'ovr', 'pot', 'price', 'sort'].forEach((k) => { f[k] = String(fd.get(k) == null ? '' : fd.get(k)); });
    if (f.club !== 'ALL' && f.league !== 'ALL' && App.s.clubs[f.club] && App.s.clubs[f.club].leagueId !== f.league) f.club = 'ALL';
    App.render();
  };
  A['offer-accept'] = (d) => {
    const s = App.s;
    const o = s.market.offers.find((x) => x.id === d.id);
    const p = s.players[o.pid];
    H.confirmSheet({ title: (o.type === 'loan' ? 'Ceder a ' : 'Vender a ') + p.name, body: o.type === 'loan' ? p.name + ' jugará cedido en ' + s.clubs[o.clubId].name + ' hasta junio.' : p.name + ' se marchará a ' + s.clubs[o.clubId].name + ' por ' + U.money(o.fee) + '. No se puede deshacer.', yes: o.type === 'loan' ? 'Aceptar cesión' : 'Aceptar venta',
      onYes: async () => { const r = T.respondOffer(s, d.id, 'accept'); if (r.error) { H.toast(r.error); return; } await H.persist(); H.toast('Operación cerrada'); App.render(); } });
  };
  A['offer-reject'] = async (d) => { T.respondOffer(App.s, d.id, 'reject'); await H.persist(); App.render(); };
  A['offer-counter'] = (d) => {
    const o = App.s.market.offers.find((x) => x.id === d.id);
    H.sheet('<h2>Pedir más</h2><p class="small">Oferta actual: ' + U.money(o.fee) + '. Si pides demasiado, el club puede retirarla.</p><form class="stack" data-submit="offer-counter" data-id="' + o.id + '">' +
      '<label class="field" for="oc-fee">Cantidad que pides (€)<input class="input" id="oc-fee" name="fee" type="number" inputmode="numeric" step="100000" value="' + T.roundMoney(o.fee * 1.2) + '"></label>' +
      '<div class="btn-row"><button class="btn" type="button" data-act="sheet-close">Cancelar</button><button class="btn primary" type="submit">Enviar</button></div></form>');
  };
  F['offer-counter'] = async (fd, form) => {
    const r = T.respondOffer(App.s, form.dataset.id, 'counter', Number(fd.get('fee') || 0));
    H.closeSheet();
    if (r.error) H.toast(r.error);
    else H.toast(r.status === 'accepted' ? 'Aceptan: venta cerrada por ' + U.money(r.fee || 0) : r.status === 'counter' ? 'Mejoran su oferta a ' + U.money(r.fee) : 'Retiran la oferta');
    await H.persist();
    App.render();
  };

  // ---------- Agentes libres ----------
  V.freeagents = function () {
    const s = App.s;
    const f = App.ui.fa;
    const num = (x) => (x === '' || x == null ? null : Number(x));
    const list = s.freeAgents.map((id) => s.players[id]).filter((p) => p && (f.pos === 'ALL' || p.pos === f.pos) &&
      (num(f.ageMax) == null || p.age <= num(f.ageMax)) && (num(f.ovr) == null || p.ovr >= num(f.ovr)) && (num(f.pot) == null || p.pot >= num(f.pot)))
      .sort((a, b) => b.ovr - a.ovr);
    const opt = (v, cur, label) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(label) + '</option>';
    const html = '<section class="notice small">Los agentes libres se pueden fichar en cualquier momento, sin pagar traspaso: solo salario y prima de firma.</section>' +
      '<form class="card" data-submit="fa-search"><div class="grid-2"><label class="field" for="fa-pos">Posición<select class="input" id="fa-pos" name="pos">' + opt('ALL', f.pos, 'Todas') + PL.POS_ORDER.map((x) => opt(x, f.pos, x)).join('') + '</select></label>' +
      '<label class="field" for="fa-age">Edad máx.<input class="input" id="fa-age" name="ageMax" type="number" inputmode="numeric" value="' + esc(f.ageMax) + '"></label></div>' +
      '<div class="grid-2"><label class="field" for="fa-ovr">Media mín.<input class="input" id="fa-ovr" name="ovr" type="number" inputmode="numeric" value="' + esc(f.ovr) + '"></label>' +
      '<label class="field" for="fa-pot">Potencial mín.<input class="input" id="fa-pot" name="pot" type="number" inputmode="numeric" value="' + esc(f.pot) + '"></label></div>' +
      '<button class="btn primary" type="submit">Filtrar</button></form>' +
      '<section class="card"><div class="section-head"><h3>Sin club</h3><span class="small muted">' + list.length + '</span></div><div class="plist">' +
      (list.length ? list.map((p) => UI.playerRow(p, { meta: 'Pot. ' + p.pot + ' · pide ~' + U.wage(T.contractDemand(s, p, 'free').wage) })).join('') : '<p class="small muted">Ningún agente libre cumple los filtros.</p>') + '</div></section>';
    return { title: 'Agentes libres', sub: s.freeAgents.length + ' jugadores sin club', html };
  };
  F['fa-search'] = (fd) => { ['pos', 'ageMax', 'ovr', 'pot'].forEach((k) => { App.ui.fa[k] = String(fd.get(k) || (k === 'pos' ? 'ALL' : '')); }); App.render(); };

  // ---------- Finanzas y contratos ----------
  V.finance = function () {
    const s = App.s;
    const club = s.clubs[s.clubId];
    const fin = s.market.fin;
    const bill = C.wageBill(s, club.id);
    const inc = U.sum(Object.values(fin.income));
    const exp = U.sum(Object.values(fin.expense));
    const squad = C.squad(s, club.id).sort((a, b) => a.contractEnd - b.contractEnd || b.wage - a.wage);
    const endYear = s.season.year + 1;
    const line = (label, v, neg) => '<div class="row small"><span class="grow">' + label + '</span><b class="num" style="color:' + (neg ? 'var(--bad)' : 'inherit') + '">' + (neg && v ? '-' : '') + U.money(v) + '</b></div>';
    let html = '<section class="kv"><div><span>Presupuesto fichajes</span><b>' + U.money(club.budget) + '</b></div><div><span>Presupuesto salarial</span><b>' + U.wage(club.wageBudget) + '</b></div>' +
      '<div><span>Masa salarial</span><b>' + U.wage(bill) + '</b></div><div><span>Margen salarial</span><b>' + U.wage(Math.max(0, club.wageBudget - bill)) + '</b></div></section>' +
      '<section class="card"><h3>Reasignar presupuesto</h3><p class="small muted">1 € de salario semanal equivale a ' + T.WAGE_TO_BUDGET + ' € del presupuesto de fichajes. Solo puedes devolver a fichajes el margen salarial no usado.</p>' +
      '<form class="stack" data-submit="convert"><label class="field" for="cv-amount">Cantidad de presupuesto de fichajes (€)<input class="input" id="cv-amount" name="amount" type="number" inputmode="numeric" step="100000" value="1000000"></label>' +
      '<div class="btn-row"><button class="btn sm" type="submit" name="dir" value="toWage">Pasar a salarios</button><button class="btn sm" type="submit" name="dir" value="toBudget">Pasar a fichajes</button></div></form></section>' +
      '<section class="card"><h3>Temporada ' + esc(fin.season) + '</h3>' +
      line('Taquilla', fin.income.tickets) + line('Ventas y cesiones', fin.income.sales) + line('Derechos de TV y premios (al final)', fin.income.tv + fin.income.prizes) +
      line('Salarios pagados', fin.expense.wages, true) + line('Traspasos', fin.expense.transfers, true) + line('Primas de fichaje y renovación', fin.expense.bonuses, true) + line('Rescisiones', fin.expense.releases, true) +
      '<div class="row"><b class="grow">Balance provisional</b><b class="num" style="color:' + (inc - exp >= 0 ? 'var(--good)' : 'var(--bad)') + '">' + U.money(inc - exp) + '</b></div></section>';
    if (s.market.finHistory.length) {
      html += '<section class="card"><h3>Temporadas anteriores</h3>' + s.market.finHistory.map((h) => '<div class="row small"><span class="grow">' + esc(h.season) + '</span><b class="num" style="color:' + (h.net >= 0 ? 'var(--good)' : 'var(--bad)') + '">' + U.money(h.net) + '</b></div>').join('') + '</section>';
    }
    html += '<section class="card"><h3>Contratos</h3><p class="small muted">Salarios en euros por semana. Los contratos que terminan en junio se pierden si no renuevas: el jugador se marcha libre.</p><div class="table-wrap"><table class="tbl"><thead><tr><th class="l">Jugador</th><th>Media</th><th>Salario</th><th>Fin</th></tr></thead><tbody>' +
      squad.map((p) => '<tr><td class="l"><button data-act="player" data-id="' + p.id + '" style="border:0;background:none;padding:0;text-align:left;font-weight:600;color:inherit">' + esc(p.name) + '</button><div class="small muted">' + p.pos + ' · ' + p.age + ' años' + (p.loan ? ' · cedido' : '') + '</div></td><td>' + p.ovr + '</td><td>' + U.money(p.wage) + '</td><td>' +
        (p.contractEnd <= endYear ? '<span class="pill warn">' + p.contractEnd + '</span>' : p.contractEnd) + '</td></tr>').join('') + '</tbody></table></div></section>';
    if (s.market.ledger.length) {
      html += '<section class="card"><h3>Movimientos de caja</h3>' + s.market.ledger.slice(0, 30).map((l) => '<div class="row small"><span class="grow">' + esc(l.concept) + ' <span class="muted">(' + esc(l.season) + ', J' + l.md + ')</span></span><b class="num" style="color:' + (l.amount >= 0 ? 'var(--good)' : 'var(--bad)') + '">' + U.money(l.amount) + '</b></div>').join('') + '</section>';
    }
    return { title: 'Finanzas y contratos', sub: club.name, html };
  };
  F.convert = async (fd, form, ev) => {
    const amount = Math.abs(Number(fd.get('amount') || 0));
    const dir = (ev && ev.submitter && ev.submitter.value) || 'toWage';
    const err = T.convertBudget(App.s, dir === 'toWage' ? amount : -amount);
    if (err) { H.toast(err); return; }
    await H.persist();
    H.toast('Presupuesto reasignado');
    App.render();
  };

  // ---------- Cantera ----------
  V.youth = function () {
    const s = App.s;
    const academy = D.academy(s).sort((a, b) => b.pot - a.pot);
    const u21 = C.squad(s, s.clubId).filter((p) => p.age <= 21).sort((a, b) => b.pot - a.pot);
    const row = (p, extra) => '<button class="prow" data-act="player" data-id="' + p.id + '"><span class="pos">' + p.pos + '</span>' + UI.ovr(p.ovr) +
      '<span class="grow"><span class="name ellipsis" style="display:block">' + esc(p.name) + (p.mustDecide ? ' <span class="pill warn">Decidir</span>' : '') + '</span><span class="meta">' + p.age + ' años · ' + esc(extra) + '</span>' + UI.bar(p.ovr, p.pot, 'accent') + '</span>' +
      '<span class="side"><span class="small muted">Potencial</span><b class="num">' + p.pot + '</b></span></button>';
    const html = '<section class="notice small">Cada verano llega una nueva hornada a la cantera. Los juveniles mejoran entrenando; en el primer equipo progresan más si juegan. A los 19 años debes subirlos o liberarlos. Máximo ' + D.ACADEMY_MAX + ' en la cantera.</section>' +
      '<section class="card"><div class="section-head"><h3>Cantera</h3><span class="small muted">' + academy.length + '/' + D.ACADEMY_MAX + '</span></div><div class="plist">' +
      (academy.length ? academy.map((p) => row(p, 'juvenil')).join('') : '<p class="small muted">La cantera está vacía hasta la próxima hornada.</p>') + '</div></section>' +
      '<section class="card"><div class="section-head"><h3>Sub-21 del primer equipo</h3><span class="small muted">' + u21.length + '</span></div><div class="plist">' +
      (u21.length ? u21.map((p) => row(p, p.stats.min + ' min esta temporada')).join('') : '<p class="small muted">No hay jugadores sub-21.</p>') + '</div></section>';
    return { title: 'Cantera', sub: 'Jóvenes promesas', html };
  };
  A['youth-promote'] = async (d) => { const r = D.promote(App.s, d.id); if (r.error) { H.toast(r.error); return; } await H.persist(); H.toast('Sube al primer equipo'); App.render(); };
  A['youth-release'] = (d) => {
    const p = App.s.players[d.id];
    H.confirmSheet({ title: 'Liberar a ' + p.name, body: 'Dejará la cantera y no podrás recuperarlo.', yes: 'Liberar', danger: true,
      onYes: async () => { D.releaseYouth(App.s, d.id); await H.persist(); H.toast('Juvenil liberado'); App.back(); } });
  };

  // La navegación desde el inicio puede pedir una pestaña concreta del mercado
  const baseNav = A.nav;
  A.nav = (d) => { if (d.view === 'market' && d.tab) App.ui.mk.tab = d.tab; return baseNav(d); };

  // Indicadores en la lista de plantilla
  const baseRow = UI.playerRow;
  UI.playerRow = function (p, opts) {
    const html = baseRow(p, opts);
    const tag = (p.listed ? ' ⇄' : '') + (p.loan ? ' ↗' : '') + (p.wantsOut ? ' !' : '');
    return tag ? html.replace('</span><span class="meta">', '<span class="small" style="color:var(--warn)">' + tag + '</span></span><span class="meta">') : html;
  };
})(globalThis.MCM = globalThis.MCM || {});
