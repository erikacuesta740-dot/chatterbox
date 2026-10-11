/* Genera el "mundo" de una carrera a partir de un dataset (demo o importado). */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const P = MCM.players;
  const G = (MCM.generator = {});

  const TEMPLATE = ['POR', 'POR', 'POR', 'DFC', 'DFC', 'DFC', 'DFC', 'LD', 'LD', 'LI', 'LI',
    'MCD', 'MCD', 'MC', 'MC', 'MC', 'MCO', 'ED', 'ED', 'EI', 'EI', 'DC', 'DC', 'WIDE'];
  const STARTER_COUNT = { POR: 1, DFC: 2, LD: 1, LI: 1, MCD: 1, MC: 2, MCO: 0, ED: 1, EI: 1, DC: 1, MD: 0, MI: 0 };
  const ALT_OPTIONS = {
    DFC: ['MCD', 'LD', 'LI'], LD: ['LI', 'MD', 'DFC'], LI: ['LD', 'MI', 'DFC'], MCD: ['MC', 'DFC'],
    MC: ['MCD', 'MCO', 'MD', 'MI'], MCO: ['MC', 'DC', 'ED', 'EI'], MD: ['ED', 'MC'], MI: ['EI', 'MC'],
    ED: ['EI', 'MD', 'DC'], EI: ['ED', 'MI', 'DC'], DC: ['ED', 'EI', 'MCO'], POR: [],
  };

  G.baseOvr = (rep) => 48 + rep * 0.38;
  // Reglas de liga opcionales que se copian a la partida (y se actualizan en partidas antiguas).
  G.LEAGUE_RULES = ['playoff', 'playoffFrom', 'uefa', 'spots', 'region'];

  function pickNation(rng, leagueNat) {
    if (rng.chance(0.55)) return leagueNat;
    return rng.pick(MCM.DATA.foreignNations);
  }

  function makeName(rng, nat, used) {
    const group = (MCM.DATA.nations[nat] || ['es'])[0];
    const pool = MCM.DATA.namePools[group];
    for (let i = 0; i < 20; i++) {
      const n = rng.pick(pool.first) + ' ' + rng.pick(pool.last);
      if (!used.has(n)) { used.add(n); return n; }
    }
    const n = rng.pick(pool.first) + ' ' + rng.pick(pool.last) + ' ' + rng.pick(pool.last);
    used.add(n);
    return n;
  }

  function potentialFor(rng, age, ovr, rep) {
    const topBonus = rep >= 85 ? 3 : 0;
    let pot;
    if (age <= 20) pot = ovr + rng.int(6, 20) + topBonus;
    else if (age <= 23) pot = ovr + rng.int(3, 12) + topBonus;
    else if (age <= 26) pot = ovr + rng.int(0, 6);
    else pot = ovr + rng.int(0, 2);
    return U.clamp(pot, ovr, 95);
  }

  G.createPlayer = function (ctx, opts) {
    const rng = ctx.rng;
    const nat = opts.nat || pickNation(rng, opts.leagueNat || 'ESP');
    const pos = opts.pos;
    const ovr = Math.round(U.clamp(opts.ovr, 38, 93));
    const age = opts.age;
    const p = {
      id: 'p' + ctx.nextId++,
      extId: opts.extId || null, // identificador de la base importada (para enlazar valores FC 27)
      name: opts.name || makeName(rng, nat, ctx.usedNames),
      age,
      nat,
      pos,
      alt: opts.alt || (rng.chance(0.55) && ALT_OPTIONS[pos].length ? [rng.pick(ALT_OPTIONS[pos])] : []),
      ovr,
      pot: opts.pot || potentialFor(rng, age, ovr, opts.rep || 60),
      attrs: opts.attrs || P.makeAttrs(pos, ovr, rng),
      clubId: opts.clubId || null,
      contractEnd: opts.contractEnd || (ctx.startYear + rng.int(1, 5)),
      fitness: 100,
      morale: 70,
      form: 6.5,
      injury: null,
      injuries: [],
      suspension: 0,
      yc: 0,
      youth: !!opts.youth,
      stats: P.emptyStats(),
      demo: !opts.real,
    };
    p.value = P.marketValue(p);
    p.wage = opts.wage || P.fairWage(p, opts.wealth || 1);
    return p;
  };

  function generateSquad(ctx, club, league) {
    const rng = ctx.rng;
    const base = G.baseOvr(club.rep);
    const counts = {};
    const template = TEMPLATE.slice();
    if (league.tier >= 2) template.splice(template.indexOf('MC'), 1);
    const ids = [];
    const youthSlots = new Set();
    while (youthSlots.size < 3) youthSlots.add(rng.int(11, template.length - 1));
    template.forEach((slot, idx) => {
      const pos = slot === 'WIDE' ? rng.pick(['MD', 'MI']) : slot;
      counts[pos] = (counts[pos] || 0) + 1;
      const starter = counts[pos] <= (STARTER_COUNT[pos] || 0);
      let ovr, age;
      if (starter) {
        ovr = base + rng.normal(2.5, 2.2);
        age = Math.round(U.clamp(rng.normal(27, 3.5), 19, 35));
      } else if (youthSlots.has(idx) && pos !== 'POR') {
        age = rng.int(17, 20);
        ovr = base - rng.range(8, 14);
      } else {
        ovr = base + rng.normal(-4, 3);
        age = Math.round(U.clamp(rng.normal(25.5, 4.5), 18, 35));
      }
      if (pos === 'POR' && counts[pos] === 3) { ovr = base - rng.range(8, 13); age = rng.int(18, 21); }
      if (age >= 33) ovr -= 1;
      const p = G.createPlayer(ctx, {
        pos, ovr, age, clubId: club.id, leagueNat: league.nat, rep: club.rep, wealth: club.wealth,
      });
      ctx.players[p.id] = p;
      ids.push(p.id);
    });
    // Estrella del club en los equipos grandes
    if (club.rep >= 84) {
      const stars = rng.shuffle(ids.filter((id) => ctx.players[id].age >= 21 && ctx.players[id].age <= 30)).slice(0, club.rep >= 90 ? 2 : 1);
      stars.forEach((id) => {
        const p = ctx.players[id];
        const d = rng.int(3, 6);
        p.ovr = Math.min(93, p.ovr + d);
        p.pot = Math.max(p.pot, p.ovr + rng.int(0, 2));
        P.shiftAttrs(p, d);
        p.value = P.marketValue(p);
        p.wage = P.fairWage(p, club.wealth);
      });
    }
    return ids;
  }

  function importSquad(ctx, club, league, list) {
    return list.map((raw) => {
      const p = G.createPlayer(ctx, {
        name: raw.name, nat: raw.nat, pos: raw.pos, alt: raw.alt, ovr: raw.ovr, pot: raw.pot, age: raw.age,
        attrs: raw.attrs, wage: raw.wage, contractEnd: raw.contractEnd, clubId: club.id, leagueNat: league.nat,
        rep: club.rep, wealth: club.wealth, real: true, extId: raw.id != null ? String(raw.id) : null,
      });
      if (raw.src) p.src = raw.src;
      ctx.players[p.id] = p;
      return p.id;
    });
  }

  // Completa una plantilla importada incompleta con jugadores ficticios (marcados como tales).
  const FILL_MIN = { GK: 3, DEF: 8, MID: 8, ATT: 5 };
  const FILL_POS = { GK: ['POR'], DEF: ['DFC', 'LD', 'LI', 'DFC'], MID: ['MC', 'MCD', 'MCO'], ATT: ['DC', 'ED', 'EI'] };
  function fillSquad(ctx, club, league, ids) {
    const base = G.baseOvr(club.rep);
    Object.keys(FILL_MIN).forEach((line) => {
      let have = ids.filter((id) => P.POSITIONS[ctx.players[id].pos].line === line).length;
      while (have < FILL_MIN[line]) {
        const young = ctx.rng.chance(0.6);
        const p = G.createPlayer(ctx, {
          pos: ctx.rng.pick(FILL_POS[line]), clubId: club.id, leagueNat: league.nat, rep: club.rep, wealth: club.wealth,
          age: young ? ctx.rng.int(17, 20) : ctx.rng.int(22, 31), ovr: base - (young ? ctx.rng.range(10, 15) : ctx.rng.range(5, 9)),
        });
        ctx.players[p.id] = p;
        ids.push(p.id);
        have++;
      }
    });
    return ids;
  }

  G.importSquad = importSquad;
  G.fillSquad = fillSquad;

  G.transferBudget = function (rep, wealth) {
    const x = U.clamp((rep - 42) / 52, 0.02, 1.1);
    return Math.round((Math.pow(x, 3) * 150e6 * (0.6 + 0.4 * wealth) + 0.4e6) / 1e5) * 1e5;
  };

  G.buildWorld = function (dataset, seed, startYear) {
    const ctx = {
      rng: U.rng(seed), nextId: 1, usedNames: new Set(), players: {}, startYear,
    };
    const leagues = {};
    const clubs = {};
    dataset.leagues.forEach((L) => {
      const clubIds = [];
      L.clubs.forEach((row) => {
        const c = Array.isArray(row)
          ? { name: row[0], short: row[1], rep: row[2], stadium: row[3], colors: [row[4], row[5]], ...(row[6] || {}) }
          : row;
        const id = c.id || U.slug(c.name);
        const wealth = L.wealth || 1;
        const club = {
          id,
          name: c.name,
          short: c.short || c.name.slice(0, 3).toUpperCase(),
          leagueId: L.id,
          country: L.country,
          rep: c.rep,
          stadium: c.stadium || '',
          colors: c.colors || ['#888888', '#ffffff'],
          wealth,
          reserveOf: c.reserveOf || null,
          budget: c.budget || G.transferBudget(c.rep, wealth),
          tactics: MCM.lineup.defaultTactics(),
          lineup: null,
          squad: [],
        };
        clubs[id] = club;
        if (c.players && c.players.length) {
          club.squad = importSquad(ctx, club, L, c.players);
          if (c.fill) fillSquad(ctx, club, L, club.squad);
        } else club.squad = generateSquad(ctx, club, L);
        clubIds.push(id);
      });
      leagues[L.id] = {
        id: L.id, name: L.name, country: L.country, nat: L.nat, tier: L.tier,
        upper: L.upper || null, lower: L.lower || null, promote: L.promote || 0, relegate: L.relegate || 0,
        euro: L.euro || 0, ucl: L.ucl || 0, wealth: L.wealth || 1, clubIds, fixtures: [], played: 0, totalMd: 0,
      };
      G.LEAGUE_RULES.forEach((k) => { if (L[k] != null) leagues[L.id][k] = L[k]; });
    });
    // Agentes libres
    const freeAgents = [];
    for (let i = 0; i < 70; i++) {
      const age = i < 12 ? ctx.rng.int(17, 20) : i < 55 ? ctx.rng.int(22, 31) : ctx.rng.int(32, 36);
      const ovr = age <= 20 ? ctx.rng.range(52, 64) : age >= 32 ? ctx.rng.range(66, 79) : ctx.rng.range(58, 76);
      const p = G.createPlayer(ctx, {
        pos: ctx.rng.pick(P.POS_ORDER), ovr, age, leagueNat: ctx.rng.pick(['ESP', 'ENG', 'ITA', 'GER', 'FRA']), contractEnd: startYear,
      });
      p.clubId = null;
      ctx.players[p.id] = p;
      freeAgents.push(p.id);
    }
    return { leagues, clubs, players: ctx.players, freeAgents, nextId: ctx.nextId };
  };

  /* Comprueba un dataset importado antes de usarlo. Devuelve una lista de errores (vacía si es válido). */
  G.validateDataset = function (d) {
    const errors = [];
    if (!d || !Array.isArray(d.leagues) || !d.leagues.length) return ['Falta la lista «leagues».'];
    const leagueIds = new Set();
    const clubIds = new Set();
    const extIds = new Set();
    d.leagues.forEach((L, li) => {
      const where = 'Liga ' + (L && L.id ? L.id : li + 1);
      if (!L || !L.id || !L.name) { errors.push(where + ': falta id o name.'); return; }
      if (leagueIds.has(L.id)) errors.push(where + ': id repetido.');
      leagueIds.add(L.id);
      if (!Array.isArray(L.clubs) || L.clubs.length < 2) { errors.push(where + ': necesita al menos 2 clubes.'); return; }
      L.clubs.forEach((c, ci) => {
        const name = Array.isArray(c) ? c[0] : c && c.name;
        const rep = Array.isArray(c) ? c[2] : c && c.rep;
        if (!name) { errors.push(where + ', club ' + (ci + 1) + ': sin nombre.'); return; }
        const id = (c && c.id) || U.slug(name);
        if (clubIds.has(id)) errors.push('Club repetido: ' + name);
        clubIds.add(id);
        if (!(rep >= 1 && rep <= 100)) errors.push(name + ': «rep» debe estar entre 1 y 100.');
        ((c && c.players) || []).forEach((pl, pi) => {
          const w = name + ', jugador ' + (pi + 1) + (pl && pl.name ? ' (' + pl.name + ')' : '');
          if (!pl || !pl.name) errors.push(w + ': sin nombre.');
          if (!P.POSITIONS[pl && pl.pos]) errors.push(w + ': posición no válida.');
          if (!(pl && pl.ovr >= 30 && pl.ovr <= 99)) errors.push(w + ': media no válida.');
          if (!(pl && pl.age >= 15 && pl.age <= 45)) errors.push(w + ': edad no válida.');
          if (pl && pl.id != null) {
            if (extIds.has(String(pl.id))) errors.push(w + ': identificador repetido ' + pl.id + '.');
            extIds.add(String(pl.id));
          }
        });
      });
    });
    d.leagues.forEach((L) => {
      if (L.lower && !leagueIds.has(L.lower)) errors.push('Liga ' + L.id + ': «lower» apunta a una liga inexistente.');
      if (L.upper && !leagueIds.has(L.upper)) errors.push('Liga ' + L.id + ': «upper» apunta a una liga inexistente.');
    });
    return errors.slice(0, 30);
  };

  G.defaultDataset = () => ({ info: MCM.DATA.datasetInfo, leagues: MCM.DATA.leagues });
})(globalThis.MCM = globalThis.MCM || {});
