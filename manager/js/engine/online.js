/*
 * Carrera online con amigos: un mundo compartido con varios clubes (hasta 22) dirigidos por personas.
 * El creador de la sala elige la liga; el mundo incluye las ligas de ese país (más copas y Europa).
 * Cada jugador manda sus «órdenes» (táctica, once, lanzadores y sus operaciones de mercado) y, cuando todos
 * están listos, quien avanza aplica las órdenes de todos y juega hasta el siguiente partido de cualquiera.
 * Cada club humano tiene su propio mercado, finanzas y noticias (s.users). Sin cantera ni prensa en este modo.
 */
(function (MCM) {
  'use strict';
  const O = (MCM.online = {});
  const C = () => MCM.career;
  const LU = () => MCM.lineup;

  /* Mundo de la sala: ligas del país de la liga elegida. */
  /* opts.customs: [{ leagueId, replaces, def }] (clubes creados por los jugadores). */
  O.createWorld = function (opts) {
    const base = MCM.DATA.realDataset();
    const L = base.leagues.find((l) => l.id === opts.leagueId);
    if (!L) throw new Error('Liga no encontrada');
    let dataset = { info: base.info, leagues: base.leagues.filter((l) => l.country === L.country) };
    dataset = MCM.generator.withCustomClubs(dataset, opts.customs || []);
    const s = C().create({ dataset, clubId: opts.clubId, seed: opts.seed, name: 'Sala ' + (opts.code || ''), managerName: opts.name || 'Jugador 1' });
    s.online = { code: opts.code || null, leagueId: L.id };
    s.humans = [opts.clubId];
    s.users = { [opts.clubId]: { market: s.market, news: s.news } };
    s.settings.autoLineup = false;
    s.settings.autoFix = true;
    return s;
  };

  /* Prepara el mundo para verlo y jugarlo desde el club indicado (su mercado y sus noticias). */
  O.viewAs = function (s, clubId) {
    if (!s.users) s.users = {};
    if (s.users[s.clubId]) { s.users[s.clubId].market = s.market; s.users[s.clubId].news = s.news; }
    s.clubId = clubId;
    const u = (s.users[clubId] = s.users[clubId] || { market: null, news: [] });
    s.market = u.market;
    s.news = u.news || [];
    u.news = s.news;
    if (!s.market) { MCM.market.init(s); u.market = s.market; }
    return s;
  };

  /* Operaciones de mercado que se registran en el móvil y se repiten al avanzar (mismo orden y mismo resultado). */
  O.ACTIONS = ['start', 'cancel', 'offerClub', 'offerContract', 'toggleListed', 'toggleShortlist', 'respondOffer', 'loanOut', 'release', 'exerciseOption'];

  O.addHuman = function (s, clubId) {
    if (!s.clubs[clubId]) throw new Error('Club no encontrado');
    if (!s.humans.includes(clubId)) s.humans.push(clubId);
    if (!s.users) s.users = {};
    if (!s.users[clubId]) C().asUser(s, clubId, () => MCM.market.init(s));
    const club = s.clubs[clubId];
    club.lineup = LU().autoPick(C().squad(s, clubId), club.tactics.formation);
  };

  /* Órdenes de un club: lo que cada jugador decide desde su móvil. */
  O.extractOrders = function (s, clubId, actions) {
    const club = s.clubs[clubId];
    return { clubId, tactics: Object.assign({}, club.tactics), lineup: club.lineup ? JSON.parse(JSON.stringify(club.lineup)) : null, takers: Object.assign({}, club.takers || {}), actions: actions || [], baseRev: s.online ? s.online.rev : null };
  };
  O.applyOrders = function (s, orders) {
    if (!orders || !s.clubs[orders.clubId] || !s.humans.includes(orders.clubId)) return;
    const club = s.clubs[orders.clubId];
    const mine = (id) => id && s.players[id] && s.players[id].clubId === club.id;
    if (orders.tactics && LU().FORMATIONS[orders.tactics.formation]) club.tactics = Object.assign(club.tactics, orders.tactics);
    if (orders.lineup && Array.isArray(orders.lineup.xi)) {
      const lu = orders.lineup;
      club.lineup = { formation: club.tactics.formation, xi: lu.xi.map((id) => (mine(id) ? id : null)), bench: (lu.bench || []).filter(mine), covers: lu.covers || {} };
      if (lu.formation !== club.tactics.formation) club.lineup = LU().autoPick(C().squad(s, club.id), club.tactics.formation);
    }
    if (orders.takers) { club.takers = {}; Object.keys(orders.takers).forEach((k) => { if (mine(orders.takers[k])) club.takers[k] = orders.takers[k]; }); }
    // Operaciones de mercado hechas desde el móvil de ese jugador (en su orden).
    if (Array.isArray(orders.actions) && orders.actions.length && (orders.baseRev == null || orders.baseRev === (s.online && s.online.rev))) {
      C().asUser(s, club.id, () => {
        orders.actions.forEach((a) => {
          if (!a || !O.ACTIONS.includes(a.fn) || typeof MCM.market[a.fn] !== 'function') return;
          try { MCM.market[a.fn].apply(null, [s].concat(a.args || [])); } catch (e) { /* una operación que ya no es posible se ignora */ }
        });
      });
    }
  };

  /* Próximo partido de cualquiera de los dos clubes humanos. */
  O.nextHumanFixture = function (s) {
    let best = null;
    C().fixtures(s).forEach((f) => {
      if (f.played || !(s.humans.includes(f.home) || s.humans.includes(f.away))) return;
      if (!best || f.date < best.date) best = f;
    });
    return best;
  };

  /* Avanza: juega hasta el siguiente día con partido de algún humano (incluido) o cierra la temporada. */
  O.step = function (s) {
    const viewer = s.clubId;
    if (C().seasonFinished(s)) {
      const label = s.season.label;
      C().endSeason(s);
      s.clubId = viewer;
      return { kind: 'season', label, results: [] };
    }
    const from = s.date;
    const next = O.nextHumanFixture(s);
    C().simulateUntil(s, next ? next.date : undefined);
    s.clubId = viewer;
    const results = C().fixtures(s).filter((f) => f.played && (s.humans.includes(f.home) || s.humans.includes(f.away)) && (!from || f.date > from) && (!next || f.date <= next.date))
      .map((f) => ({ id: f.id, comp: f.comp, date: f.date, round: f.round || ('Jornada ' + f.md), home: f.home, away: f.away, hg: f.hg, ag: f.ag, pens: f.pens || null, winner: f.winner || null }));
    return { kind: 'matchday', date: s.date, results, finished: C().seasonFinished(s) };
  };

  /* Partidos entre clubes de jugadores esta temporada (si se indica un club, solo los suyos). */
  O.headToHead = function (s, clubId) {
    if (s.humans.length < 2) return [];
    return C().fixtures(s).filter((f) => s.humans.includes(f.home) && s.humans.includes(f.away) && (!clubId || f.home === clubId || f.away === clubId))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  };
})(globalThis.MCM = globalThis.MCM || {});
