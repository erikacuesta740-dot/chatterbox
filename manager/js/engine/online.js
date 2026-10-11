/*
 * Carrera online contra un amigo: un mundo compartido con dos clubes dirigidos por personas.
 * El creador de la sala elige la liga; el mundo incluye las ligas de ese país (más copas y Europa).
 * Cada jugador manda sus «órdenes» (táctica, once, lanzadores) y, cuando los dos están listos,
 * se juega hasta el siguiente partido de cualquiera de los dos. Sin fichajes ni cantera en este modo.
 */
(function (MCM) {
  'use strict';
  const O = (MCM.online = {});
  const C = () => MCM.career;
  const LU = () => MCM.lineup;

  /* Mundo de la sala: ligas del país de la liga elegida. */
  O.createWorld = function (opts) {
    const base = MCM.DATA.realDataset();
    const L = base.leagues.find((l) => l.id === opts.leagueId);
    if (!L) throw new Error('Liga no encontrada');
    const dataset = { info: base.info, leagues: base.leagues.filter((l) => l.country === L.country) };
    const s = C().create({ dataset, clubId: opts.clubId, seed: opts.seed, name: 'Sala ' + (opts.code || ''), managerName: opts.name || 'Jugador 1' });
    s.online = { code: opts.code || null, leagueId: L.id };
    s.humans = [opts.clubId];
    s.settings.autoLineup = false;
    s.settings.autoFix = true;
    return s;
  };

  O.addHuman = function (s, clubId) {
    if (!s.clubs[clubId]) throw new Error('Club no encontrado');
    if (!s.humans.includes(clubId)) s.humans.push(clubId);
    const club = s.clubs[clubId];
    club.lineup = LU().autoPick(C().squad(s, clubId), club.tactics.formation);
  };

  /* Órdenes de un club: lo que cada jugador decide desde su móvil. */
  O.extractOrders = function (s, clubId) {
    const club = s.clubs[clubId];
    return { clubId, tactics: Object.assign({}, club.tactics), lineup: club.lineup ? JSON.parse(JSON.stringify(club.lineup)) : null, takers: Object.assign({}, club.takers || {}) };
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

  /* Cara a cara entre los dos humanos esta temporada. */
  O.headToHead = function (s) {
    if (s.humans.length < 2) return [];
    const [a, b] = s.humans;
    return C().fixtures(s).filter((f) => (f.home === a && f.away === b) || (f.home === b && f.away === a));
  };
})(globalThis.MCM = globalThis.MCM || {});
