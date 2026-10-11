/*
 * Estado y reglas de una carrera: creación, jornadas, efectos de los partidos,
 * noticias y cierre de temporada. Cada carrera es un objeto independiente.
 */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const PL = MCM.players;
  const LU = MCM.lineup;
  const SC = MCM.schedule;
  const C = (MCM.career = {});

  C.SCHEMA = 3;
  C.START_YEAR = 2026;
  C.seasonLabel = (y) => y + '/' + String(y + 1).slice(2);

  // ---------- Consultas ----------
  C.club = (s, id) => s.clubs[id];
  C.userClub = (s) => s.clubs[s.clubId];
  C.userLeague = (s) => s.leagues[s.clubs[s.clubId].leagueId];
  C.squad = (s, clubId) => s.clubs[clubId].squad.map((id) => s.players[id]).filter(Boolean);
  C.nameOf = (s, pid) => (s.players[pid] ? s.players[pid].name : '—');

  C.teamRating = function (s, clubId) {
    const club = s.clubs[clubId];
    const lu = LU.autoPick(C.squad(s, clubId).map((p) => Object.assign({}, p, { fitness: 100, injury: null, suspension: 0 })), club.tactics.formation);
    const xi = lu.xi.map((id) => s.players[id]).filter(Boolean);
    return Math.round(U.avg(xi.map((p) => p.ovr)));
  };

  // ---------- Dorsales, capitán y lanzadores ----------
  const PREF_NUM = { POR: [1, 13, 25], DFC: [4, 5, 3, 2, 15, 24], LD: [2, 12, 22], LI: [3, 18, 23], MCD: [6, 16, 5], MC: [8, 14, 16, 6], MCO: [10, 20, 21], MD: [17, 7], MI: [11, 19], ED: [7, 17, 27], EI: [11, 19, 29], DC: [9, 19, 20] };
  C.ensureNumbers = function (s, clubId) {
    const sq = C.squad(s, clubId);
    const used = new Set();
    sq.forEach((p) => { if (p.number && !used.has(p.number)) used.add(p.number); else p.number = null; });
    sq.slice().sort((a, b) => b.ovr - a.ovr).forEach((p) => {
      if (p.number) return;
      const pref = (PREF_NUM[p.pos] || []).find((n) => !used.has(n));
      let n = pref;
      if (!n) { n = 14; while (used.has(n)) n++; }
      p.number = n;
      used.add(n);
    });
  };
  C.takers = function (s, clubId) {
    const club = s.clubs[clubId];
    const sq = C.squad(s, clubId).filter((p) => !p.loan || p.clubId === clubId);
    const t = Object.assign({}, club.takers || {});
    const has = (id) => id && sq.some((p) => p.id === id);
    const best = (fn) => sq.slice().sort((a, b) => fn(b) - fn(a))[0];
    if (!has(t.captain)) t.captain = (best((p) => p.ovr + Math.min(p.age, 32) * 0.6) || {}).id || null;
    if (!has(t.pen)) t.pen = (best((p) => (p.attrs.sho || 0) + (p.pos === 'DC' ? 3 : 0)) || {}).id || null;
    if (!has(t.fk)) t.fk = (best((p) => (p.attrs.sho || 0) * 0.5 + (p.attrs.pas || 0) * 0.5) || {}).id || null;
    if (!has(t.corner)) t.corner = (best((p) => (p.attrs.pas || 0)) || {}).id || null;
    return t;
  };

  C.squadValue = (s, clubId) => U.sum(C.squad(s, clubId).map((p) => p.value));
  C.wageBill = (s, clubId) => U.sum(C.squad(s, clubId).map((p) => p.wage));

  // ---------- Calendario por fechas ----------
  C.fixtures = (s) => MCM.comps.fixtures(s);
  C.userFixtures = (s) => C.fixtures(s).filter((f) => f.home === s.clubId || f.away === s.clubId).sort((a, b) => a.date.localeCompare(b.date));
  C.nextUserFixture = (s) => C.userFixtures(s).find((f) => !f.played) || null;
  C.lastUserFixture = (s) => C.userFixtures(s).filter((f) => f.played).pop() || null;
  C.seasonFinished = (s) => C.fixtures(s).every((f) => f.played);
  C.compOf = (s, f) => (s.leagues[f.comp] ? s.leagues[f.comp] : s.comps[f.comp]);
  C.gamesPlayed = function (s, clubId) {
    return C.fixtures(s).filter((f) => f.played && (f.home === clubId || f.away === clubId)).length;
  };
  // Compatibilidad: jornada siguiente de la liga del usuario
  C.nextMd = (s) => {
    const L = C.userLeague(s);
    return L.played < L.totalMd ? L.played + 1 : null;
  };
  C.userFixture = function (s, md) {
    const L = C.userLeague(s);
    md = md || C.nextMd(s);
    return L.fixtures.find((f) => f.md === md && (f.home === s.clubId || f.away === s.clubId)) || null;
  };

  // ---------- Noticias ----------
  C.news = function (s, type, title, body, extra) {
    s.news.unshift(Object.assign({
      id: 'n' + (s.newsSeq = (s.newsSeq || 0) + 1),
      season: s.season.label,
      md: C.userLeague(s).played,
      date: s.date || null,
      type, title, body, read: false,
    }, extra || {}));
    if (s.news.length > 200) s.news.length = 200;
  };

  // ---------- Objetivos de la directiva ----------
  function setObjectives(s) {
    Object.values(s.leagues).forEach((L) => {
      const ranked = L.clubIds.slice().sort((a, b) => C.teamRating(s, b) - C.teamRating(s, a) || s.clubs[b].rep - s.clubs[a].rep);
      const n = ranked.length;
      ranked.forEach((id, i) => {
        const rank = i + 1;
        let obj;
        if (L.tier === 1) {
          if (rank === 1) obj = { code: 'title', text: 'Ganar la liga', target: 1 };
          else if (rank <= 4 && L.ucl) obj = { code: 'ucl', text: 'Terminar entre los ' + L.ucl + ' primeros', target: L.ucl };
          else if (rank <= 8 && L.euro) obj = { code: 'euro', text: 'Clasificarse para Europa (top ' + L.euro + ')', target: L.euro };
          else if (rank <= 4) obj = { code: 'top4', text: 'Terminar entre los 4 primeros', target: 4 };
          else if (rank <= 8) obj = { code: 'top8', text: 'Terminar entre los 8 primeros', target: 8 };
          else if (rank <= n - 5) obj = { code: 'mid', text: 'Terminar en la mitad alta de la tabla', target: Math.ceil(n / 2) + 2 };
          else obj = { code: 'survive', text: L.relegate ? 'Evitar el descenso' : 'Evitar los 3 últimos puestos', target: n - Math.max(3, L.relegate) };
        } else {
          if (rank <= 3) obj = { code: 'promote', text: L.playoff ? 'Lograr el ascenso (directo o por playoff)' : 'Lograr el ascenso (top ' + L.promote + ')', target: L.promote };
          else if (rank <= 8) obj = { code: 'top8', text: 'Pelear por el ascenso (top 8)', target: 8 };
          else if (rank <= n - 5) obj = { code: 'mid', text: 'Terminar en mitad de tabla', target: Math.ceil(n / 2) + 2 };
          else obj = { code: 'survive', text: 'Evitar los últimos puestos', target: n - 4 };
        }
        s.clubs[id].objective = obj;
      });
    });
  }

  // ---------- Temporada ----------
  function seasonStartDate(year) { return year + '-08-15'; }

  function setupSeason(s, prevTables, cupWinners) {
    const rng = U.rng(s.seed + ':sched:' + s.season.year);
    Object.values(s.leagues).forEach((L) => {
      const r = SC.roundRobin(L.clubIds, rng, !!L.singleRound);
      L.fixtures = r.fixtures;
      L.totalMd = r.totalMd;
      L.played = 0;
      const dates = MCM.comps.leagueDates(s.season.year, L.totalMd);
      L.fixtures.forEach((f) => { f.date = dates[f.md - 1]; f.comp = L.id; f.round = 'Jornada ' + f.md; });
    });
    setObjectives(s);
    if (!prevTables) {
      // Primera temporada: clasificación europea según el nivel de los clubes
      prevTables = {};
      Object.values(s.leagues).forEach((L) => {
        prevTables[L.id] = L.clubIds.slice().sort((a, b) => C.teamRating(s, b) - C.teamRating(s, a) || s.clubs[b].rep - s.clubs[a].rep);
      });
    }
    MCM.comps.setupSeason(s, prevTables, cupWinners);
    s.date = s.season.year + '-08-01';
    s.week = 0;
    const club = C.userClub(s);
    club.lineup = LU.autoPick(C.squad(s, s.clubId), club.tactics.formation);
    s.season.finished = false;
  }

  C.create = function (opts) {
    const dataset = opts.dataset || MCM.generator.defaultDataset();
    const seed = opts.seed || U.uid('seed');
    const year = opts.startYear || C.START_YEAR;
    const world = MCM.generator.buildWorld(dataset, seed, year);
    if (!world.clubs[opts.clubId]) throw new Error('Club no encontrado: ' + opts.clubId);
    const now = new Date().toISOString();
    const s = {
      schema: C.SCHEMA,
      id: opts.id || U.uid('car'),
      name: (opts.name || '').trim() || 'Carrera con ' + world.clubs[opts.clubId].name,
      owner: opts.owner || 'local',
      managerName: (opts.managerName || '').trim() || 'Entrenador',
      clubId: opts.clubId,
      createdAt: now,
      updatedAt: now,
      seed,
      dataset: { id: (dataset.info && dataset.info.id) || 'custom', name: (dataset.info && dataset.info.name) || 'Personalizado', isDemo: !dataset.info || dataset.info.isDemo !== false },
      season: { year, label: C.seasonLabel(year), finished: false },
      leagues: world.leagues,
      clubs: world.clubs,
      players: world.players,
      freeAgents: world.freeAgents,
      nextId: world.nextId,
      news: [],
      history: [],
      archive: [],
      transfers: [],
      settings: { autoLineup: false, autoFix: true, lineupV2: true, lineupV3: true },
    };
    setupSeason(s);
    MCM.market.init(s);
    MCM.dev.init(s);
    MCM.mgr.init(s);
    if (MCM.life) MCM.life.init(s);
    C.ensureNumbers(s, s.clubId);
    const club = C.userClub(s);
    C.news(s, 'board', 'Bienvenido a ' + club.name,
      s.managerName + ' es el nuevo entrenador de ' + club.name + '. La directiva fija el objetivo de la temporada ' + s.season.label + ': ' + club.objective.text.toLowerCase() + '.');
    return s;
  };

  // ---------- Partidos ----------
  function buildSide(s, clubId, notices) {
    const club = s.clubs[clubId];
    const squad = C.squad(s, clubId);
    let lineup;
    if (clubId === s.clubId && !s.settings.autoLineup && club.lineup) {
      lineup = club.lineup;
      C.fixLineup(s, notices);
    } else {
      lineup = LU.autoPick(squad, club.tactics.formation);
      if (clubId === s.clubId) club.lineup = lineup;
    }
    return {
      club,
      slots: LU.slots(lineup.formation),
      xi: lineup.xi.map((id) => (id ? s.players[id] : null)),
      bench: (lineup.bench || []).map((id) => s.players[id]).filter(Boolean),
      tactics: club.tactics,
      takers: clubId === s.clubId ? C.takers(s, clubId) : null,
      injuryFactor: clubId === s.clubId && MCM.life ? MCM.life.intensity(s).inj : 1,
    };
  }

  function applyPlayers(s, side, res, sideIdx, rng, isUser, isLeague) {
    const club = side.club;
    const goalsFor = sideIdx === 0 ? res.hg : res.ag;
    const goalsAg = sideIdx === 0 ? res.ag : res.hg;
    const result = goalsFor > goalsAg ? 1 : goalsFor < goalsAg ? -1 : 0;
    const tire = (MCM.match.TACTIC.pressing[club.tactics.pressing] || { tire: 1 }).tire;
    const starters = new Set(side.xi.filter(Boolean).map((p) => p.id));
    C.squad(s, club.id).forEach((p) => {
      // Cumplir sanción: el partido cuenta para los sancionados antes de aplicar nuevas tarjetas.
      if (p.suspension > 0) p.suspension--;
      const mins = res.minutes[p.id] || 0;
      if (!mins) {
        if (p.ovr >= C.teamRatingCache(s, club.id) && P_isFit(p)) p.morale = U.clamp(p.morale - 1.2, 10, 100);
        return;
      }
      const st = p.stats;
      st.apps++;
      if (starters.has(p.id)) st.starts++;
      st.min += mins;
      st.goals += res.goalsBy[p.id] || 0;
      st.assists += res.assistsBy[p.id] || 0;
      if (isLeague) { st.lapps = (st.lapps || 0) + 1; st.lgoals = (st.lgoals || 0) + (res.goalsBy[p.id] || 0); }
      const r = res.ratings[p.id];
      if (r) { st.rSum += r; st.rN++; p.form = Math.round((p.form * 0.6 + r * 0.4) * 100) / 100; }
      if (res.motm === p.id) st.motm++;
      if (p.pos === 'POR' && goalsAg === 0 && mins >= 60) st.cs++;
      const ageF = p.age >= 31 ? 1.2 : p.age <= 21 ? 0.9 : 1;
      const phyF = 1.15 - ((p.attrs.phy || p.attrs.spd + 30 || 70) / 100) * 0.3;
      p.fitness = U.clamp(p.fitness - (mins / 90) * 15 * tire * ageF * phyF, 25, 100);
      p.morale = U.clamp(p.morale + result * 4 + (r ? (r - 6.5) * 1.5 : 0), 10, 100);
      const c = res.cards[p.id] || 0;
      if (c === 1) {
        st.yel++;
        if (isLeague) p.yc++;
        if (p.yc >= 5) {
          p.yc = 0;
          p.suspension = 1;
          if (isUser) C.news(s, 'discipline', p.name + ', sancionado', p.name + ' acumula cinco amarillas y se perderá el próximo partido.', { pid: p.id });
        }
      } else if (c === 2) {
        st.yel++; st.red++;
        p.suspension = 1;
        if (isUser) C.news(s, 'discipline', 'Expulsión de ' + p.name, p.name + ' vio la segunda amarilla y cumplirá un partido de sanción.', { pid: p.id });
      } else if (c === 3) {
        st.red++;
        p.suspension = rng.int(1, 3);
        if (isUser) C.news(s, 'discipline', 'Roja directa para ' + p.name, p.name + ' fue expulsado y estará ' + p.suspension + (p.suspension === 1 ? ' partido' : ' partidos') + ' sancionado.', { pid: p.id });
      }
    });
    res.injuries.filter((i) => i.side === sideIdx).forEach((inj) => {
      const p = s.players[inj.pid];
      const type = inj.weeks <= 2 ? 'Molestias musculares' : inj.weeks <= 5 ? 'Lesión muscular' : inj.weeks <= 10 ? 'Esguince de tobillo' : 'Lesión de rodilla';
      p.injury = { weeks: inj.weeks, days: inj.weeks * 7, type };
      p.injuries.push({ season: s.season.label, weeks: inj.weeks, type });
      if (isUser) C.news(s, 'injury', p.name + ' cae lesionado', p.name + ' sufre ' + type.toLowerCase() + '. Baja estimada: ' + inj.weeks + (inj.weeks === 1 ? ' semana.' : ' semanas.'), { pid: p.id });
    });
  }
  function P_isFit(p) { return PL.isAvailable(p); }

  // Media del once para la moral de los no convocados (cacheada por jornada).
  C.teamRatingCache = function (s, clubId) {
    s._tr = s._tr || {};
    const key = clubId + ':' + s.season.year;
    if (!s._tr[key]) s._tr[key] = C.teamRating(s, clubId);
    return s._tr[key];
  };

  function snapshotSide(s, side, res, sideIdx) {
    const list = side.slots.map((pos, i) => {
      const p = side.xi[i];
      return p ? { id: p.id, name: p.name, pos, ovr: p.ovr, r: res.ratings[p.id] || null } : null;
    }).filter(Boolean);
    const subs = res.events.filter((e) => e.type === 'sub' && e.side === sideIdx).map((e) => {
      const p = s.players[e.pid];
      return { id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, r: res.ratings[p.id] || null, min: e.min };
    });
    return { formation: side.club.tactics.formation, xi: list, subs };
  }

  function koOpts(s, comp, f) {
    if (!f.knockout) return { neutral: !!f.neutral };
    let prior = [0, 0];
    if (f.firstLeg) {
      const f1 = comp.fixtures.find((x) => x.id === f.firstLeg);
      // En la ida, el local era el visitante de la vuelta
      if (f1 && f1.played) prior = [f1.ag, f1.hg];
    }
    return { knockout: true, prior, neutral: !!f.neutral, noShootout: !!f.noShootout };
  }

  /* Titulares que no pueden jugar (lesión o sanción) en la alineación manual del usuario. */
  C.lineupIssues = function (s) {
    if (s.settings.autoLineup || (s.manager && s.manager.unemployed)) return [];
    const club = s.clubs[s.clubId];
    const lu = club.lineup;
    if (!lu) return [];
    const slots = LU.slots(lu.formation);
    const out = [];
    // Un hueco vacío solo cuenta si hay alguien disponible para ocuparlo.
    const spare = C.squad(s, s.clubId).some((p) => MCM.players.isAvailable(p) && !lu.xi.includes(p.id));
    lu.xi.forEach((id, i) => {
      const p = id && s.players[id];
      if (!p || p.clubId !== s.clubId) { if (spare) out.push({ pos: slots[i], pid: null, name: null, reason: 'hueco vacío' }); }
      else if (!MCM.players.isAvailable(p)) out.push({ pos: slots[i], pid: p.id, name: p.name, reason: MCM.players.statusOf(p).label.toLowerCase() });
    });
    return out;
  };
  /* ¿Hay que parar antes del partido del usuario para que decida los cambios? */
  C.lineupBlocked = (s) => !s.settings.autoFix && C.lineupIssues(s).length > 0;
  /*
   * Sustituciones temporales: si un titular de tu once no puede jugar, entra el mejor suplente para su puesto;
   * cuando el titular vuelve a estar disponible, recupera su sitio. lu.covers = { hueco: id del titular original }.
   */
  C.fixLineup = function (s, notices) {
    const club = s.clubs[s.clubId];
    const lu = club.lineup;
    if (!lu) return [];
    const squad = C.squad(s, s.clubId);
    const ok = (p) => p && p.clubId === s.clubId && MCM.players.isAvailable(p);
    const slots = LU.slots(lu.formation);
    lu.covers = lu.covers || {};
    const changes = [];
    // 1) Vuelven los titulares recuperados
    Object.keys(lu.covers).forEach((k) => {
      const i = Number(k);
      const orig = s.players[lu.covers[k]];
      if (!orig || orig.clubId !== s.clubId) { delete lu.covers[k]; return; }
      if (!ok(orig) || lu.xi.includes(orig.id)) return;
      const sub = lu.xi[i];
      lu.xi[i] = orig.id;
      delete lu.covers[k];
      changes.push({ pos: slots[i], in: orig.id, out: sub, back: true });
      if (notices) notices.push(orig.name + ' se ha recuperado y vuelve al once' + (sub ? ' en lugar de ' + C.nameOf(s, sub) : '') + '.');
    });
    // 2) Entran los mejores suplentes por los que no pueden jugar
    slots.forEach((pos, i) => {
      const cur = s.players[lu.xi[i]];
      if (ok(cur)) return;
      const cands = squad.filter((p) => ok(p) && !lu.xi.includes(p.id));
      const fitting = cands.filter((p) => MCM.players.fit(p, pos) >= 0.88);
      const pool = fitting.length ? fitting : cands;
      pool.sort((a, b) => LU.slotScore(b, pos) - LU.slotScore(a, pos));
      const rep = pool[0] || null;
      if (cur && cur.clubId === s.clubId && lu.covers[i] == null) lu.covers[i] = cur.id;
      lu.xi[i] = rep ? rep.id : null;
      changes.push({ pos, in: rep ? rep.id : null, out: cur ? cur.id : null });
      if (notices) notices.push((cur ? cur.name + ' no puede jugar (' + MCM.players.statusOf(cur).label.toLowerCase() + '). ' : '') + (rep ? 'Entra ' + rep.name + ' como ' + pos + ' hasta que vuelva.' : 'No hay sustituto para ' + pos + '.'));
    });
    if (changes.length) lu.bench = squad.filter((p) => ok(p) && !lu.xi.includes(p.id)).sort((a, b) => b.ovr - a.ovr).slice(0, 9).map((p) => p.id);
    return changes;
  };

  /* Prepara un partido (lados y opciones) sin jugarlo: lo usa el partido en directo. */
  C.prepareMatch = function (s, f, notices) {
    const comp = C.compOf(s, f);
    const home = buildSide(s, f.home, f.home === s.clubId ? notices : null);
    const away = buildSide(s, f.away, f.away === s.clubId ? notices : null);
    const rng = U.rng(s.seed + ':m:' + s.season.year + ':' + f.comp + ':' + f.id);
    return { home, away, rng, opts: koOpts(s, comp, f) };
  };

  /* Aplica un resultado ya simulado a la carrera (clasificaciones, jugadores, noticias, premios). */
  C.applyResult = function (s, f, prep, res, notices) {
    const { home, away, rng } = prep;
    const comp = C.compOf(s, f);
    const isLeague = !!s.leagues[f.comp];
    f.played = true;
    f.hg = res.hg;
    f.ag = res.ag;
    if (res.et) f.et = true;
    if (res.pens) f.pens = res.pens;
    if (res.winner != null) f.winner = res.winner === 0 ? f.home : f.away;
    const isUserMatch = f.home === s.clubId || f.away === s.clubId;
    applyPlayers(s, home, res, 0, rng, f.home === s.clubId, isLeague);
    applyPlayers(s, away, res, 1, rng, f.away === s.clubId, isLeague);
    MCM.comps.matchPrize(s, f);
    const nameOf = (id) => C.nameOf(s, id);
    if (isLeague && f.comp === C.userClub(s).leagueId) f.goals = res.events.filter((e) => e.type === 'goal').map((e) => [e.min, e.side, nameOf(e.pid)]);
    if (isUserMatch) {
      if (f.home === s.clubId && !f.neutral && s.market) s.market.fin.income.tickets += Math.round(MCM.market.ticketIncome(C.userClub(s)) * (isLeague ? 1 : s.comps[f.comp].type === 'euro' ? 1.4 : 0.6));
      f.report = {
        summary: MCM.match.summary(res, home.club.name, away.club.name, nameOf, rng),
        stats: res.stats,
        events: res.events.map((e) => ({
          min: e.min, type: e.type, side: e.side, name: e.pid ? nameOf(e.pid) : null, score: e.score || null, pen: !!e.pen,
          assist: e.aid ? nameOf(e.aid) : null, out: e.outId ? nameOf(e.outId) : null, weeks: e.weeks || null, second: !!e.second,
        })),
        motm: res.motm ? { name: nameOf(res.motm), r: res.ratings[res.motm], side: home.xi.concat(home.bench).some((p) => p && p.id === res.motm) ? 0 : 1 } : null,
        lineups: [snapshotSide(s, home, res, 0), snapshotSide(s, away, res, 1)],
        notices: notices ? notices.slice() : [],
        pens: res.pens || null,
        penKicks: res.penKicks ? res.penKicks.map((list) => list.map((k) => (k ? { name: nameOf(k.pid), ok: k.ok } : null))) : null,
      };
      matchNews(s, f, comp);
      if (isLeague) streakNews(s);
      MCM.mgr.afterMatch(s, f);
      if (MCM.life) MCM.life.maybePress(s, f);
    }
    return res;
  };

  function playFixture(s, f, notices) {
    const prep = C.prepareMatch(s, f, notices);
    const res = MCM.match.simulate(prep.home, prep.away, prep.rng, prep.opts);
    return C.applyResult(s, f, prep, res, notices);
  }

  function matchNews(s, f, comp) {
    const home = s.clubs[f.home];
    const away = s.clubs[f.away];
    const isHome = f.home === s.clubId;
    const gf = isHome ? f.hg : f.ag;
    const ga = isHome ? f.ag : f.hg;
    const rival = isHome ? away : home;
    const won = f.winner ? f.winner === s.clubId : gf > ga;
    const lost = f.winner ? f.winner !== s.clubId : gf < ga;
    const tag = s.leagues[f.comp] ? '' : comp.short + ': ';
    const title = tag + (won ? 'Victoria ante ' : lost ? 'Derrota ante ' : 'Empate ante ') + rival.name + ' (' + f.hg + '-' + f.ag + (f.pens ? ', pen. ' + f.pens[0] + '-' + f.pens[1] : '') + ')';
    C.news(s, 'match', title, f.report.summary, { fixtureId: f.id, comp: f.comp });
  }

  function streakNews(s) {
    const L = C.userLeague(s);
    const mine = L.fixtures.filter((f) => f.played && (f.home === s.clubId || f.away === s.clubId)).sort((a, b) => a.md - b.md);
    const res = mine.map((f) => {
      const gf = f.home === s.clubId ? f.hg : f.ag;
      const ga = f.home === s.clubId ? f.ag : f.hg;
      return gf > ga ? 'V' : gf < ga ? 'D' : 'E';
    });
    const run = (pred) => { let n = 0; for (let i = res.length - 1; i >= 0 && pred(res[i]); i--) n++; return n; };
    const wins = run((r) => r === 'V');
    const losses = run((r) => r === 'D');
    const unbeaten = run((r) => r !== 'D');
    const club = C.userClub(s);
    if (wins === 3 || wins === 5 || wins === 8) C.news(s, 'streak', 'Racha de ' + wins + ' victorias', club.name + ' encadena ' + wins + ' victorias consecutivas en liga.');
    else if (losses === 3 || losses === 5) C.news(s, 'streak', 'Mala racha: ' + losses + ' derrotas seguidas', 'La directiva pide una reacción tras ' + losses + ' derrotas consecutivas.');
    else if (unbeaten === 8 || unbeaten === 12) C.news(s, 'streak', unbeaten + ' partidos sin perder', club.name + ' suma ' + unbeaten + ' jornadas invicto.');

    const table = SC.table(L);
    const leader = table[0];
    if (mine.length >= 3 && s._leader !== leader.clubId) {
      if (leader.clubId === s.clubId) C.news(s, 'table', 'Líderes de ' + L.name, club.name + ' asalta el liderato con ' + leader.pts + ' puntos.');
      else if (s._leader === s.clubId) C.news(s, 'table', 'Se pierde el liderato', s.clubs[leader.clubId].name + ' supera a ' + club.name + ' en la clasificación.');
    }
    s._leader = leader.clubId;
    if (mine.length === Math.floor(L.totalMd / 2)) {
      const me = table.find((r) => r.clubId === s.clubId);
      const ok = me.pos <= club.objective.target;
      C.news(s, 'board', 'Balance de mitad de temporada',
        'Tras ' + mine.length + ' jornadas, ' + club.name + ' es ' + me.pos + 'º con ' + me.pts + ' puntos. Objetivo: ' + club.objective.text.toLowerCase() + '. ' +
        (ok ? 'La directiva está satisfecha con la marcha del equipo.' : 'La directiva espera una mejora en la segunda vuelta.'));
    }
  }

  function daysBetween(a, b) {
    return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000);
  }

  // Paso del tiempo entre dos fechas: recuperación física diaria, lesiones y tareas semanales.
  function passDays(s, toDate) {
    const from = s.date || toDate;
    const days = Math.max(0, daysBetween(from, toDate));
    if (days) {
      Object.values(s.players).forEach((p) => {
        if (p.injury) {
          if (p.injury.days == null) p.injury.days = (p.injury.weeks || 1) * 7;
          p.injury.days -= days;
          p.injury.weeks = Math.max(0, Math.ceil(p.injury.days / 7));
          if (p.injury.days <= 0) {
            p.injury = null;
            p.fitness = Math.min(p.fitness, 75);
            if (p.clubId === s.clubId && !p.academy) C.news(s, 'injury', p.name + ' recibe el alta', p.name + ' se ha recuperado y vuelve a estar disponible.', { pid: p.id });
          }
        }
        const phy = p.attrs.phy || 70;
        const rec = ((16 + (phy - 65) / 8 - (p.age >= 31 ? 3 : 0)) / 7) * (MCM.life ? MCM.life.recoveryFactor(s, p) : 1);
        p.fitness = U.clamp(p.fitness + rec * days, 20, 100);
        p.morale += (65 - p.morale) * 0.007 * days;
      });
    }
    s.date = toDate;
    const start = MCM.comps.seasonStart(s.season.year);
    const week = Math.max(0, Math.floor(daysBetween(start, toDate) / 7));
    while ((s.week || 0) < week) {
      s.week = (s.week || 0) + 1;
      MCM.market.weekly(s);
      if (MCM.dev) MCM.dev.weekly(s);
      if (MCM.life) MCM.life.weekly(s);
      MCM.mgr.checkSack(s);
    }
  }

  function updateLeagueProgress(s) {
    Object.values(s.leagues).forEach((L) => {
      let md = L.played;
      while (md < L.totalMd && L.fixtures.filter((f) => f.md === md + 1).every((f) => f.played)) md++;
      if (md !== L.played) {
        L.played = md;
        if (md === L.totalMd) {
          const t = SC.table(L);
          const champ = s.clubs[t[0].clubId];
          C.news(s, 'season', 'Campeón de ' + L.name, champ.name + ' se proclama campeón de ' + L.name + ' ' + s.season.label + '.');
          C.addTrophy(s, champ.id, L.name);
        }
      }
    });
  }

  /* Juega todos los partidos de una fecha (opcionalmente dejando el del usuario pendiente). */
  function playDate(s, date, skipUser) {
    passDays(s, date);
    C.fixtures(s).filter((f) => !f.played && f.date === date).forEach((f) => {
      const mine = f.home === s.clubId || f.away === s.clubId;
      if (mine && skipUser) return;
      playFixture(s, f, mine ? [] : null);
    });
    updateLeagueProgress(s);
    MCM.comps.progress(s);
  }

  function nextDate(s, maxDate, excludeUserOn) {
    let best = null;
    C.fixtures(s).forEach((f) => {
      if (f.played) return;
      if (excludeUserOn && f.date === excludeUserOn && (f.home === s.clubId || f.away === s.clubId)) return;
      if (maxDate && f.date > maxDate) return;
      if (!best || f.date < best) best = f.date;
    });
    return best;
  }

  /** Avanza hasta el día del próximo partido del usuario, dejando ese partido pendiente. */
  C.playUntilUserMatch = function (s) {
    if (s.manager && s.manager.unemployed) return null;
    const target = C.nextUserFixture(s);
    if (!target) return null;
    let guard = 0;
    for (;;) {
      const d = nextDate(s, target.date, target.date);
      if (!d || guard++ > 400) break;
      playDate(s, d, d === target.date);
      if (s.manager && s.manager.unemployed) return null;
    }
    passDays(s, target.date);
    if (s.manager && s.manager.unemployed) return null;
    return target;
  };

  /** Juega el próximo partido del usuario (y todo lo anterior). */
  C.playUserMatch = function (s) {
    const f = C.playUntilUserMatch(s);
    if (!f) return null;
    // Sin permiso para tocar la alineación: se para antes del partido.
    if (C.lineupBlocked(s)) return { blocked: true, fixture: f, issues: C.lineupIssues(s) };
    playFixture(s, f, []);
    updateLeagueProgress(s);
    MCM.comps.progress(s);
    if (C.seasonFinished(s)) s.season.finished = true;
    s.updatedAt = new Date().toISOString();
    return f;
  };

  /** Aplica el resultado de un partido jugado en directo. */
  C.finishLiveMatch = function (s, f, prep, res) {
    C.applyResult(s, f, prep, res, []);
    updateLeagueProgress(s);
    MCM.comps.progress(s);
    if (C.seasonFinished(s)) s.season.finished = true;
    s.updatedAt = new Date().toISOString();
    return f;
  };

  /** Simula el resto de la temporada (o hasta una fecha). */
  C.simulateUntil = function (s, maxDate) {
    let guard = 0;
    let blocked = null;
    for (;;) {
      const d = nextDate(s, maxDate, null);
      if (!d || guard++ > 800) break;
      const mine = C.fixtures(s).some((f) => !f.played && f.date === d && (f.home === s.clubId || f.away === s.clubId));
      if (mine) {
        passDays(s, d);
        if (C.lineupBlocked(s)) {
          playDate(s, d, true);
          blocked = { blocked: true, issues: C.lineupIssues(s) };
          break;
        }
      }
      playDate(s, d, false);
    }
    if (C.seasonFinished(s)) s.season.finished = true;
    s.updatedAt = new Date().toISOString();
    return blocked;
  };

  /** Compatibilidad: juega el siguiente partido del usuario (o el resto si ya no tiene). */
  C.playMatchday = function (s) {
    let f = C.playUserMatch(s);
    if (f && f.blocked) { C.fixLineup(s); f = C.playUserMatch(s); }
    if (!f) { if (C.simulateUntil(s)) { C.fixLineup(s); C.simulateUntil(s); } }
    return { userFixture: f };
  };

  /** Se puede cambiar de club si estás sin equipo o en pretemporada (sin partidos jugados). */
  C.canSwitchClub = (s) => (s.manager && s.manager.unemployed) || C.userFixtures(s).every((f) => !f.played);

  // ---------- Trofeos ----------
  C.addTrophy = function (s, clubId, name) {
    s.trophies = s.trophies || {};
    (s.trophies[clubId] = s.trophies[clubId] || []).push({ season: s.season.label, name });
    if (clubId === s.clubId) {
      s.managerTrophies = s.managerTrophies || [];
      s.managerTrophies.push({ season: s.season.label, name, club: s.clubs[clubId].name });
    }
  };

  // ---------- Cierre de temporada ----------
  C.topScorers = function (s, leagueId, n) {
    const L = s.leagues[leagueId];
    const ids = [];
    L.clubIds.forEach((cid) => s.clubs[cid].squad.forEach((pid) => ids.push(pid)));
    const lg = (p) => (p.stats.lgoals != null ? p.stats.lgoals : p.stats.goals);
    return ids.map((id) => s.players[id]).filter((p) => p && lg(p) > 0)
      .sort((a, b) => lg(b) - lg(a) || b.stats.assists - a.stats.assists).slice(0, n || 10);
  };

  function movePlayer(s, p, toClubId) {
    if (p.clubId && s.clubs[p.clubId]) s.clubs[p.clubId].squad = s.clubs[p.clubId].squad.filter((id) => id !== p.id);
    s.freeAgents = s.freeAgents.filter((id) => id !== p.id);
    p.clubId = toClubId;
    if (toClubId) {
      s.clubs[toClubId].squad.push(p.id);
      if (toClubId === s.clubId) { p.number = null; C.ensureNumbers(s, toClubId); }
    } else s.freeAgents.push(p.id);
  }
  C.movePlayer = movePlayer;

  function youthPlayer(s, club, pos, rng) {
    const ctx = { rng, nextId: s.nextId, usedNames: new Set(), players: s.players, startYear: s.season.year };
    const L = s.leagues[club.leagueId];
    const base = MCM.generator.baseOvr(club.rep);
    const p = MCM.generator.createPlayer(ctx, {
      pos, age: rng.int(16, 18), ovr: base - rng.range(14, 22), leagueNat: L ? L.nat : (MCM.DATA.nations[club.nat] ? club.nat : 'ENG'), rep: club.rep + 5,
      wealth: club.wealth, clubId: club.id, contractEnd: s.season.year + 3, youth: true,
    });
    p.pot = U.clamp(p.ovr + rng.int(10, 26), p.ovr, 92);
    p.value = PL.marketValue(p);
    s.nextId = ctx.nextId;
    s.players[p.id] = p;
    club.squad.push(p.id);
    return p;
  }

  /** Hasta dónde llegó un club en cada copa y competición europea. */
  C.compRuns = function (s, clubId) {
    const out = [];
    MCM.comps.all(s).forEach((c) => {
      if (!c.participants.includes(clubId)) return;
      let reached;
      if (c.winner === clubId) reached = 'Campeón';
      else {
        const mine = c.fixtures.filter((f) => f.home === clubId || f.away === clubId);
        const last = mine[mine.length - 1];
        reached = last ? (last.phase === 'league' ? 'Fase liga' : last.round.replace(/ \((ida|vuelta)\)$/, '')) : 'Sin jugar';
        if (last && last.round === 'Final') reached = 'Subcampeón';
      }
      out.push({ comp: c.id, name: c.name, reached });
    });
    return out;
  };

  const MIN_LINES = { GK: 2, DEF: 7, MID: 6, ATT: 4 };
  const LINE_POS = { GK: ['POR'], DEF: ['DFC', 'DFC', 'LD', 'LI'], MID: ['MC', 'MCD', 'MCO', 'MD', 'MI'], ATT: ['DC', 'ED', 'EI'] };

  /* Probabilidad de que un club de la IA renueve a un jugador que acaba contrato:
     las estrellas y los titulares casi siempre renuevan; que salga uno gratis es raro. */
  function renewChance(club, p) {
    const level = MCM.generator.baseOvr(club.rep);
    let k = 0.75;
    if (p.ovr >= level) k = 0.93;
    if (p.ovr >= level + 4 || p.ovr >= 80) k = 0.975;
    if (p.ovr >= 85) k = 0.985;
    if (p.age >= 33) k -= 0.3;
    else if (p.age >= 31) k -= 0.1;
    return U.clamp(k, 0.3, 0.99);
  }

  C.endSeason = function (s) {
    C.simulateUntil(s);
    if (!C.seasonFinished(s)) throw new Error('La temporada aún no ha terminado.');
    const rng = U.rng(s.seed + ':end:' + s.season.year);
    const year = s.season.year;
    const userClub = C.userClub(s);
    const userL = C.userLeague(s);

    // Archivo de la temporada
    const champions = {};
    const tables = {};
    Object.values(s.leagues).forEach((L) => {
      tables[L.id] = SC.table(L);
      champions[L.id] = s.clubs[tables[L.id][0].clubId].name;
    });
    const myRow = tables[userL.id].find((r) => r.clubId === s.clubId);
    const prevTables = {};
    Object.keys(tables).forEach((id) => { prevTables[id] = tables[id].map((r) => r.clubId); });
    const cupWinners = {};
    MCM.comps.all(s).forEach((c) => { if (c.type === 'cup' && c.winner) cupWinners[c.nat] = c.winner; });
    const compRuns = C.compRuns(s, s.clubId);
    const scorers = C.topScorers(s, userL.id, 3).map((p) => ({ name: p.name, club: s.clubs[p.clubId].name, goals: p.stats.goals }));
    const mySquad = C.squad(s, s.clubId);
    const myTop = mySquad.slice().sort((a, b) => b.stats.goals - a.stats.goals)[0];
    let objectiveMet = myRow.pos <= userClub.objective.target;

    // Ascensos y descensos
    const movements = [];
    Object.values(s.leagues).forEach((U1) => {
      if (!U1.lower || !s.leagues[U1.lower]) return;
      const Lo = s.leagues[U1.lower];
      const down = tables[U1.id].slice(U1.clubIds.length - (U1.relegate || 0)).map((r) => r.clubId);
      const up = MCM.comps.eligibleOrder(s, Lo).slice(0, Lo.promote || 0);
      const po = MCM.comps.playoffMoves(s, Lo);
      po.up.forEach((id) => { if (!up.includes(id)) up.push(id); });
      po.down.forEach((id) => { if (!down.includes(id)) down.push(id); });
      // Un filial no sube a la categoría en la que sigue su primer equipo.
      const ups = up.filter((id) => { const c = s.clubs[id]; return !(c.reserveOf && down.indexOf(c.reserveOf) < 0 && U1.clubIds.includes(c.reserveOf)); });
      if (ups.length !== down.length) {
        // Mantener el tamaño de las ligas: se recorta lo que sobre por cualquiera de los dos lados.
        const k = Math.min(ups.length, down.length);
        ups.length = k; down.length = k;
      }
      U1.clubIds = U1.clubIds.filter((id) => !down.includes(id)).concat(ups);
      Lo.clubIds = Lo.clubIds.filter((id) => !ups.includes(id)).concat(down);
      down.forEach((id) => { s.clubs[id].leagueId = Lo.id; s.clubs[id].wealth = Lo.wealth; movements.push({ clubId: id, type: 'down', from: U1.id, to: Lo.id }); });
      ups.forEach((id) => { s.clubs[id].leagueId = U1.id; s.clubs[id].wealth = U1.wealth; movements.push({ clubId: id, type: 'up', from: Lo.id, to: U1.id }); });
    });
    const myMove = movements.find((m) => m.clubId === s.clubId);
    if (userClub.objective.code === 'promote' && myMove && myMove.type === 'up') objectiveMet = true;

    s.history.unshift({
      season: s.season.label,
      club: userClub.name,
      league: userL.name,
      pos: myRow.pos, p: myRow.p, w: myRow.w, d: myRow.d, l: myRow.l, gf: myRow.gf, ga: myRow.ga, pts: myRow.pts,
      objective: userClub.objective.text, objectiveMet,
      champion: champions[userL.id],
      topScorer: myTop && myTop.stats.goals ? { name: myTop.name, goals: myTop.stats.goals } : null,
      movement: myMove ? (myMove.type === 'up' ? 'Ascenso a ' + s.leagues[myMove.to].name : 'Descenso a ' + s.leagues[myMove.to].name) : null,
      comps: compRuns,
    });
    MCM.comps.all(s).forEach((c) => { if (c.winner) champions[c.id] = s.clubs[c.winner].name; });
    s.archive.unshift({
      season: s.season.label,
      champions,
      compNames: Object.fromEntries(MCM.comps.all(s).map((c) => [c.id, c.name])),
      table: tables[userL.id].map((r) => [s.clubs[r.clubId].name, r.pts, r.gd]),
      leagueName: userL.name,
      scorers,
      movements: movements.map((m) => ({ club: s.clubs[m.clubId].name, type: m.type, to: s.leagues[m.to].name })),
    });
    if (s.archive.length > 30) s.archive.length = 30;

    // Premios, historial de jugadores y récords (antes de reiniciar estadísticas)
    MCM.mgr.recordSeasonStats(s);
    MCM.mgr.seasonAwards(s);

    // Economía de la temporada, cesiones que vuelven y contratos del usuario que vencen
    const finRes = MCM.market.closeSeason(s, myRow.pos, tables[userL.id].length, objectiveMet);
    MCM.market.endOfSeasonContracts(s);

    // Evolución, edad, contratos y retiradas
    const developments = [];
    const retired = [];
    const expiredUser = [];
    MCM.dev.beforeAnnualDevelopment(s);
    const clubGames = {};
    C.fixtures(s).forEach((f) => { if (f.played) { clubGames[f.home] = (clubGames[f.home] || 0) + 1; clubGames[f.away] = (clubGames[f.away] || 0) + 1; } });
    Object.values(s.players).forEach((p) => {
      const club = p.clubId ? s.clubs[p.clubId] : null;
      const total = club ? Math.max(1, clubGames[club.id] || 30) * 90 : 1;
      const share = p.academy ? 0.45 : club ? p.stats.min / Math.max(1, total) : 0.15;
      const before = p.ovr;
      PL.developSeason(p, rng, share);
      if (club && club.id === s.clubId && Math.abs(p.ovr - before) >= 3) developments.push({ name: p.name, from: before, to: p.ovr, age: p.age });
      p.age++;
      const retireP = p.age >= 38 ? 0.95 : p.age >= 36 ? 0.55 : p.age >= 34 ? 0.2 : (p.age >= 32 && p.ovr < 62 ? 0.25 : 0);
      if (!p.academy && rng.chance(retireP)) { retired.push(p); return; }
      if (club && !p.academy && p.contractEnd <= year + 1) {
        if (club.id === s.clubId) {
          // Ya gestionado en endOfSeasonContracts (renovar es decisión del usuario).
        } else if (rng.chance(renewChance(club, p))) {
          p.contractEnd = year + 1 + rng.int(1, 4);
          p.wage = PL.fairWage(p, club.wealth);
        } else {
          movePlayer(s, p, null);
        }
      }
      p.value = PL.marketValue(p);
      p.stats = PL.emptyStats();
      p.fitness = 100;
      p.yc = 0;
      p.suspension = 0;
      p.morale = U.clamp(p.morale * 0.5 + 35, 30, 90);
      if (p.injury) { p.injury.weeks = Math.max(0, p.injury.weeks - 6); if (!p.injury.weeks) p.injury = null; }
    });
    retired.forEach((p) => {
      if (p.clubId) s.clubs[p.clubId].squad = s.clubs[p.clubId].squad.filter((id) => id !== p.id);
      s.freeAgents = s.freeAgents.filter((id) => id !== p.id);
      delete s.players[p.id];
    });

    // Reposición de plantillas: cantera y agentes libres
    const intakeUser = [];
    Object.values(s.clubs).forEach((club) => {
      const squad = C.squad(s, club.id);
      Object.keys(MIN_LINES).forEach((line) => {
        let have = squad.filter((p) => PL.POSITIONS[p.pos].line === line).length;
        while (have < MIN_LINES[line]) {
          const pos = rng.pick(LINE_POS[line]);
          let signed = null;
          if (club.id !== s.clubId) {
            const fa = s.freeAgents.map((id) => s.players[id]).filter((p) => p && PL.POSITIONS[p.pos].line === line && p.ovr <= MCM.generator.baseOvr(club.rep) + 2)
              .sort((a, b) => b.ovr - a.ovr)[0];
            if (fa) { movePlayer(s, fa, club.id); fa.contractEnd = year + 1 + rng.int(1, 3); fa.wage = PL.fairWage(fa, club.wealth); signed = fa; }
          }
          if (!signed) {
            signed = youthPlayer(s, club, pos, rng);
            if (club.id === s.clubId) intakeUser.push(signed);
          }
          squad.push(signed);
          have++;
        }
      });
      // Completar hasta un tamaño mínimo de plantilla
      const target = !club.leagueId ? 20 : s.leagues[club.leagueId].tier === 1 ? 23 : 22;
      while (club.squad.length < target) {
        let signed = null;
        if (club.id !== s.clubId) {
          const fa = s.freeAgents.map((id) => s.players[id]).filter((p) => p && p.age <= 33 && p.ovr <= MCM.generator.baseOvr(club.rep) + 1)
            .sort((a, b) => b.ovr - a.ovr)[rng.int(0, 3)];
          if (fa) { movePlayer(s, fa, club.id); fa.contractEnd = year + 1 + rng.int(1, 3); fa.wage = PL.fairWage(fa, club.wealth); signed = fa; }
        }
        if (!signed) {
          signed = youthPlayer(s, club, rng.pick(PL.POS_ORDER), rng);
          if (club.id === s.clubId) intakeUser.push(signed);
        }
      }
    });
    // Renovar la bolsa de agentes libres (jugadores sin contrato que llegan al mercado)
    const faCtx = { rng, nextId: s.nextId, usedNames: new Set(), players: s.players, startYear: year + 1 };
    while (s.freeAgents.length < 80) {
      const age = rng.chance(0.2) ? rng.int(17, 20) : rng.chance(0.2) ? rng.int(32, 35) : rng.int(22, 31);
      const ovr = age <= 20 ? rng.range(52, 64) : rng.range(58, 76);
      const p = MCM.generator.createPlayer(faCtx, { pos: rng.pick(PL.POS_ORDER), ovr, age, leagueNat: rng.pick(['ESP', 'ENG', 'ITA', 'GER', 'FRA']), contractEnd: year + 1 });
      p.clubId = null;
      s.players[p.id] = p;
      s.freeAgents.push(p.id);
    }
    s.nextId = faCtx.nextId;
    // Limitar bolsa de agentes libres
    if (s.freeAgents.length > 140) {
      const sorted = s.freeAgents.map((id) => s.players[id]).sort((a, b) => b.ovr - a.ovr);
      sorted.slice(140).forEach((p) => delete s.players[p.id]);
      s.freeAgents = sorted.slice(0, 140).map((p) => p.id);
    }

    // Presupuesto: ingresos según posición y categoría
    Object.values(s.clubs).forEach((club) => {
      if (club.id === s.clubId) return;
      const wealth = club.leagueId ? s.leagues[club.leagueId].wealth : club.wealth;
      club.budget = Math.max(club.budget, MCM.generator.transferBudget(club.rep, wealth) * 0.6) + Math.round(MCM.generator.transferBudget(club.rep, wealth) * 0.4 / 1e5) * 1e5;
    });

    // Noticias de cierre
    C.news(s, 'season', 'Balance final ' + s.season.label,
      userClub.name + ' terminó ' + myRow.pos + 'º en ' + userL.name + ' con ' + myRow.pts + ' puntos (' + myRow.w + 'V ' + myRow.d + 'E ' + myRow.l + 'D). ' +
      (objectiveMet ? 'Objetivo cumplido: ' : 'Objetivo no cumplido: ') + userClub.objective.text.toLowerCase() + '.');
    if (myMove) C.news(s, 'season', myMove.type === 'up' ? '¡Ascenso!' : 'Descenso consumado', userClub.name + (myMove.type === 'up' ? ' jugará en ' : ' bajará a ') + s.leagues[myMove.to].name + ' la próxima temporada.');
    developments.slice(0, 6).forEach((d) => C.news(s, 'youth', d.name + (d.to > d.from ? ' progresa' : ' baja su nivel'), d.name + ' pasa de ' + d.from + ' a ' + d.to + ' de media.'));
    if (intakeUser.length) C.news(s, 'youth', 'Llegan ' + intakeUser.length + ' canteranos', 'Se incorporan desde la cantera: ' + intakeUser.map((p) => p.name + ' (' + p.pos + ', ' + p.age + ' años, pot. ' + p.pot + ')').join(', ') + '.');
    C.news(s, 'finance', 'Balance económico ' + s.season.label, 'Ingresos: ' + U.money(finRes.income) + '. Gastos: ' + U.money(finRes.expense) + '. Resultado: ' + U.money(finRes.net) + '.');
    MCM.market.newSeasonBudgets(s, objectiveMet, finRes.net);
    MCM.dev.endSeason(s, objectiveMet);
    const retiredMine = retired.filter((p) => p.clubId === s.clubId);
    if (retiredMine.length) C.news(s, 'contract', 'Retiradas', retiredMine.map((p) => p.name).join(', ') + ' se retira' + (retiredMine.length > 1 ? 'n' : '') + ' del fútbol profesional.');

    // Nueva temporada
    s.season = { year: year + 1, label: C.seasonLabel(year + 1), finished: false };
    s._tr = {};
    s._leader = null;
    setupSeason(s, prevTables, cupWinners);
    const club = C.userClub(s);
    C.news(s, 'board', 'Objetivo ' + s.season.label, 'La directiva fija el objetivo: ' + club.objective.text.toLowerCase() + '.');
    MCM.mgr.endSeason(s, objectiveMet, myMove ? myMove.type : null, myRow.pos);
    s.updatedAt = new Date().toISOString();
    return s.history[0];
  };

  /** Actualiza partidas guardadas con versiones anteriores sin perder nada. */
  C.migrate = function (s) {
    // Sustituciones temporales automáticas (el titular vuelve al recuperarse): activadas por defecto.
    if (s.settings && !s.settings.lineupV3) { s.settings.lineupV3 = true; s.settings.autoFix = true; }
    // La alineación ya no se cambia sin permiso: las partidas antiguas pasan a once manual.
    if (s.settings && !s.settings.lineupV2) {
      s.settings.lineupV2 = true;
      s.settings.autoLineup = false;
      const club = s.clubs[s.clubId];
      if (club && (!club.lineup || club.lineup.formation !== club.tactics.formation)) club.lineup = LU.autoPick(C.squad(s, s.clubId), club.tactics.formation);
    }
    // Reglas de liga actualizadas (ascensos directos, playoffs) para partidas creadas antes.
    (MCM.DATA.leagues || []).forEach((D) => {
      const L = s.leagues[D.id];
      if (!L) return;
      ['promote', 'relegate'].forEach((k) => { if (D[k] != null) L[k] = D[k]; });
      MCM.generator.LEAGUE_RULES.forEach((k) => { if (D[k] != null) L[k] = D[k]; });
    });
    if (!s.comps) {
      // Partidas anteriores al calendario por fechas: la liga sigue como estaba y las copas y Europa empiezan la próxima temporada.
      s.comps = {};
      Object.values(s.leagues).forEach((L) => L.fixtures.forEach((f) => { f.comp = L.id; f.round = f.round || 'Jornada ' + f.md; }));
      const played = C.fixtures(s).filter((f) => f.played).map((f) => f.date).sort();
      s.date = played.length ? played[played.length - 1] : s.season.year + '-08-01';
      s.week = Math.max(0, Math.floor((new Date(s.date + 'T12:00:00Z') - new Date(MCM.comps.seasonStart(s.season.year) + 'T12:00:00Z')) / 604800000));
    }
    MCM.market.init(s);
    if (MCM.dev) MCM.dev.init(s);
    MCM.mgr.init(s);
    if (MCM.life) MCM.life.init(s);
    C.ensureNumbers(s, s.clubId);
    Object.values(s.players).forEach((p) => {
      if (p.listed == null) p.listed = false;
      if (p.loan === undefined) p.loan = null;
    });
    s.schema = C.SCHEMA;
    return s;
  };

  // ---------- Metadatos y validación ----------
  C.meta = (s) => ({
    id: s.id, name: s.name, owner: s.owner, ownerUid: s.ownerUid || null, managerName: s.managerName, clubId: s.clubId,
    clubName: s.clubs[s.clubId].name, colors: s.clubs[s.clubId].colors, short: s.clubs[s.clubId].short,
    leagueName: C.userLeague(s).name, season: s.season.label, md: C.userLeague(s).played, totalMd: C.userLeague(s).totalMd,
    createdAt: s.createdAt, updatedAt: s.updatedAt, isDemo: s.dataset.isDemo,
  });

  /** Comprueba invariantes: cada jugador en un solo club, plantillas coherentes. */
  C.validate = function (s) {
    const errors = [];
    const seen = {};
    Object.values(s.clubs).forEach((c) => c.squad.forEach((pid) => {
      if (seen[pid]) errors.push('Jugador ' + pid + ' en dos clubes');
      seen[pid] = c.id;
      const p = s.players[pid];
      if (!p) errors.push('Jugador inexistente ' + pid);
      else if (p.clubId !== c.id) errors.push('Club incoherente para ' + pid);
    }));
    s.freeAgents.forEach((pid) => {
      if (seen[pid]) errors.push('Agente libre ' + pid + ' también en club');
      if (s.players[pid] && s.players[pid].clubId) errors.push('Agente libre con club ' + pid);
    });
    (s.dev ? s.dev.academy : []).forEach((pid) => {
      const p = s.players[pid];
      if (!p || !p.academy || p.clubId !== s.clubId) errors.push('Canterano incoherente ' + pid);
      if (seen[pid]) errors.push('Canterano también en plantilla ' + pid);
    });
    Object.values(s.leagues).forEach((L) => L.clubIds.forEach((id) => {
      if (s.clubs[id].leagueId !== L.id) errors.push('Liga incoherente para ' + id);
    }));
    return errors;
  };
})(globalThis.MCM = globalThis.MCM || {});
