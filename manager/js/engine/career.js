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

  C.SCHEMA = 2;
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

  C.squadValue = (s, clubId) => U.sum(C.squad(s, clubId).map((p) => p.value));
  C.wageBill = (s, clubId) => U.sum(C.squad(s, clubId).map((p) => p.wage));

  C.nextMd = (s) => {
    const L = C.userLeague(s);
    return L.played < L.totalMd ? L.played + 1 : null;
  };
  C.userFixture = function (s, md) {
    const L = C.userLeague(s);
    md = md || C.nextMd(s);
    return L.fixtures.find((f) => f.md === md && (f.home === s.clubId || f.away === s.clubId)) || null;
  };
  C.seasonFinished = (s) => C.nextMd(s) === null;

  // ---------- Noticias ----------
  C.news = function (s, type, title, body, extra) {
    s.news.unshift(Object.assign({
      id: 'n' + (s.newsSeq = (s.newsSeq || 0) + 1),
      season: s.season.label,
      md: C.userLeague(s).played,
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
          else if (rank <= 4) obj = { code: 'ucl', text: 'Terminar entre los ' + L.ucl + ' primeros', target: L.ucl };
          else if (rank <= 8) obj = { code: 'euro', text: 'Clasificarse para Europa (top ' + L.euro + ')', target: L.euro };
          else if (rank <= n - 5) obj = { code: 'mid', text: 'Terminar en la mitad alta de la tabla', target: Math.ceil(n / 2) + 2 };
          else obj = { code: 'survive', text: L.relegate ? 'Evitar el descenso' : 'Evitar los 3 últimos puestos', target: n - Math.max(3, L.relegate) };
        } else {
          if (rank <= 3) obj = { code: 'promote', text: 'Lograr el ascenso (top ' + L.promote + ')', target: L.promote };
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

  function setupSeason(s) {
    const rng = U.rng(s.seed + ':sched:' + s.season.year);
    Object.values(s.leagues).forEach((L) => {
      const r = SC.roundRobin(L.clubIds, rng);
      L.fixtures = r.fixtures;
      L.totalMd = r.totalMd;
      L.played = 0;
      const start = seasonStartDate(s.season.year);
      L.fixtures.forEach((f) => {
        f.date = U.addDays(start, Math.round(((f.md - 1) * 280) / Math.max(1, L.totalMd - 1)));
      });
    });
    setObjectives(s);
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
      settings: { autoLineup: true },
    };
    setupSeason(s);
    MCM.market.init(s);
    MCM.dev.init(s);
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
      const changes = LU.repair(lineup, squad);
      changes.forEach((ch) => {
        if (notices) notices.push((ch.out ? C.nameOf(s, ch.out) + ' no está disponible. ' : '') + (ch.in ? 'Entra ' + C.nameOf(s, ch.in) + ' como ' + ch.pos + '.' : 'No hay sustituto para ' + ch.pos + '.'));
      });
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
    };
  }

  function applyPlayers(s, side, res, sideIdx, rng, isUser) {
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
        p.yc++;
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
      p.injury = { weeks: inj.weeks, type };
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

  function playFixture(s, L, f, detailed, notices) {
    const rng = U.rng(s.seed + ':m:' + s.season.year + ':' + L.id + ':' + f.id);
    const home = buildSide(s, f.home, f.home === s.clubId ? notices : null);
    const away = buildSide(s, f.away, f.away === s.clubId ? notices : null);
    const res = MCM.match.simulate(home, away, rng);
    f.played = true;
    f.hg = res.hg;
    f.ag = res.ag;
    const isUserMatch = f.home === s.clubId || f.away === s.clubId;
    applyPlayers(s, home, res, 0, rng, f.home === s.clubId);
    applyPlayers(s, away, res, 1, rng, f.away === s.clubId);
    const nameOf = (id) => C.nameOf(s, id);
    if (detailed) {
      f.goals = res.events.filter((e) => e.type === 'goal').map((e) => [e.min, e.side, nameOf(e.pid)]);
    }
    if (isUserMatch) {
      f.report = {
        summary: MCM.match.summary(res, home.club.name, away.club.name, nameOf, rng),
        stats: res.stats,
        events: res.events.map((e) => ({
          min: e.min, type: e.type, side: e.side, name: nameOf(e.pid),
          assist: e.aid ? nameOf(e.aid) : null, out: e.outId ? nameOf(e.outId) : null, weeks: e.weeks || null, second: !!e.second,
        })),
        motm: res.motm ? { name: nameOf(res.motm), r: res.ratings[res.motm], side: home.xi.concat(home.bench).some((p) => p && p.id === res.motm) ? 0 : 1 } : null,
        lineups: [snapshotSide(s, home, res, 0), snapshotSide(s, away, res, 1)],
        notices: notices ? notices.slice() : [],
      };
      matchNews(s, f);
    }
    return res;
  }

  function matchNews(s, f) {
    const home = s.clubs[f.home];
    const away = s.clubs[f.away];
    const isHome = f.home === s.clubId;
    const gf = isHome ? f.hg : f.ag;
    const ga = isHome ? f.ag : f.hg;
    const rival = isHome ? away : home;
    const title = gf > ga ? 'Victoria ante ' + rival.name : gf < ga ? 'Derrota ante ' + rival.name : 'Empate ante ' + rival.name;
    C.news(s, 'match', title + ' (' + f.hg + '-' + f.ag + ')', f.report.summary, { fixtureId: f.id, leagueId: home.leagueId });
  }

  function weeklyTick(s) {
    Object.values(s.players).forEach((p) => {
      if (p.injury && p.injury.weeks > 0) {
        p.injury.weeks--;
        if (p.injury.weeks === 0) {
          p.injury = null;
          p.fitness = Math.min(p.fitness, 75);
          if (p.clubId === s.clubId) C.news(s, 'injury', p.name + ' recibe el alta', p.name + ' se ha recuperado y vuelve a estar disponible.', { pid: p.id });
        }
      }
      const phy = p.attrs.phy || 70;
      const rec = 16 + (phy - 65) / 8 - (p.age >= 31 ? 3 : 0);
      p.fitness = U.clamp(p.fitness + rec, 20, 100);
      p.morale += (65 - p.morale) * 0.05;
    });
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
    if (L.played >= 3 && s._leader !== leader.clubId) {
      if (leader.clubId === s.clubId) C.news(s, 'table', 'Líderes de ' + L.name, club.name + ' asalta el liderato con ' + leader.pts + ' puntos.');
      else if (s._leader === s.clubId) C.news(s, 'table', 'Se pierde el liderato', s.clubs[leader.clubId].name + ' supera a ' + club.name + ' en la clasificación.');
    }
    s._leader = leader.clubId;
    if (L.played === Math.floor(L.totalMd / 2)) {
      const me = table.find((r) => r.clubId === s.clubId);
      const ok = me.pos <= club.objective.target;
      C.news(s, 'board', 'Balance de mitad de temporada',
        'Tras ' + L.played + ' jornadas, ' + club.name + ' es ' + me.pos + 'º con ' + me.pts + ' puntos. Objetivo: ' + club.objective.text.toLowerCase() + '. ' +
        (ok ? 'La directiva está satisfecha con la marcha del equipo.' : 'La directiva espera una mejora en la segunda vuelta.'));
    }
  }

  function advanceOtherLeagues(s, fraction) {
    const userL = C.userLeague(s);
    Object.values(s.leagues).forEach((L) => {
      if (L === userL) return;
      const target = fraction >= 1 ? L.totalMd : Math.round(L.totalMd * fraction);
      while (L.played < target) {
        const md = L.played + 1;
        L.fixtures.filter((f) => f.md === md && !f.played).forEach((f) => playFixture(s, L, f, false, null));
        L.played = md;
      }
    });
  }

  /** Simula solo el partido del club del usuario en la jornada actual. */
  C.playUserMatch = function (s) {
    const md = C.nextMd(s);
    if (!md) return null;
    const f = C.userFixture(s, md);
    if (!f || f.played) return f;
    playFixture(s, C.userLeague(s), f, true, []);
    s.updatedAt = new Date().toISOString();
    return f;
  };

  /** Completa la jornada actual en todas las ligas. */
  C.playMatchday = function (s) {
    const md = C.nextMd(s);
    if (!md) return null;
    const L = C.userLeague(s);
    const userF = C.userFixture(s, md);
    if (userF && !userF.played) playFixture(s, L, userF, true, []);
    L.fixtures.filter((f) => f.md === md && !f.played).forEach((f) => playFixture(s, L, f, true, null));
    L.played = md;
    advanceOtherLeagues(s, L.played / L.totalMd);
    weeklyTick(s);
    MCM.market.weekly(s, !!(userF && userF.home === s.clubId));
    if (MCM.dev) MCM.dev.weekly(s);
    streakNews(s);
    if (L.played === L.totalMd) {
      s.season.finished = true;
      const table = SC.table(L);
      C.news(s, 'season', 'Campeón de ' + L.name, s.clubs[table[0].clubId].name + ' se proclama campeón de ' + L.name + ' ' + s.season.label + '.');
    }
    s.updatedAt = new Date().toISOString();
    return { md, fixtures: L.fixtures.filter((f) => f.md === md), userFixture: userF };
  };

  // ---------- Cierre de temporada ----------
  C.topScorers = function (s, leagueId, n) {
    const L = s.leagues[leagueId];
    const ids = [];
    L.clubIds.forEach((cid) => s.clubs[cid].squad.forEach((pid) => ids.push(pid)));
    return ids.map((id) => s.players[id]).filter((p) => p && p.stats.goals > 0)
      .sort((a, b) => b.stats.goals - a.stats.goals || b.stats.assists - a.stats.assists).slice(0, n || 10);
  };

  function movePlayer(s, p, toClubId) {
    if (p.clubId && s.clubs[p.clubId]) s.clubs[p.clubId].squad = s.clubs[p.clubId].squad.filter((id) => id !== p.id);
    s.freeAgents = s.freeAgents.filter((id) => id !== p.id);
    p.clubId = toClubId;
    if (toClubId) s.clubs[toClubId].squad.push(p.id);
    else s.freeAgents.push(p.id);
  }
  C.movePlayer = movePlayer;

  function youthPlayer(s, club, pos, rng) {
    const ctx = { rng, nextId: s.nextId, usedNames: new Set(), players: s.players, startYear: s.season.year };
    const L = s.leagues[club.leagueId];
    const base = MCM.generator.baseOvr(club.rep);
    const p = MCM.generator.createPlayer(ctx, {
      pos, age: rng.int(16, 18), ovr: base - rng.range(14, 22), leagueNat: L.nat, rep: club.rep + 5,
      wealth: club.wealth, clubId: club.id, contractEnd: s.season.year + 3, youth: true,
    });
    p.pot = U.clamp(p.ovr + rng.int(10, 26), p.ovr, 92);
    p.value = PL.marketValue(p);
    s.nextId = ctx.nextId;
    s.players[p.id] = p;
    club.squad.push(p.id);
    return p;
  }

  const MIN_LINES = { GK: 2, DEF: 7, MID: 6, ATT: 4 };
  const LINE_POS = { GK: ['POR'], DEF: ['DFC', 'DFC', 'LD', 'LI'], MID: ['MC', 'MCD', 'MCO', 'MD', 'MI'], ATT: ['DC', 'ED', 'EI'] };

  C.endSeason = function (s) {
    if (!C.seasonFinished(s)) throw new Error('La temporada aún no ha terminado.');
    advanceOtherLeagues(s, 1);
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
    const scorers = C.topScorers(s, userL.id, 3).map((p) => ({ name: p.name, club: s.clubs[p.clubId].name, goals: p.stats.goals }));
    const mySquad = C.squad(s, s.clubId);
    const myTop = mySquad.slice().sort((a, b) => b.stats.goals - a.stats.goals)[0];
    const objectiveMet = myRow.pos <= userClub.objective.target;

    // Ascensos y descensos
    const movements = [];
    Object.values(s.leagues).forEach((U1) => {
      if (!U1.lower || !U1.relegate) return;
      const Lo = s.leagues[U1.lower];
      const down = tables[U1.id].slice(-U1.relegate).map((r) => r.clubId);
      const up = [];
      tables[Lo.id].forEach((r) => {
        if (up.length >= Lo.promote) return;
        const c = s.clubs[r.clubId];
        if (c.reserveOf && U1.clubIds.includes(c.reserveOf) && !down.includes(c.reserveOf)) return; // filial no puede coincidir con su primer equipo
        up.push(r.clubId);
      });
      U1.clubIds = U1.clubIds.filter((id) => !down.includes(id)).concat(up);
      Lo.clubIds = Lo.clubIds.filter((id) => !up.includes(id)).concat(down);
      down.forEach((id) => { s.clubs[id].leagueId = Lo.id; s.clubs[id].wealth = Lo.wealth; movements.push({ clubId: id, type: 'down', from: U1.id, to: Lo.id }); });
      up.forEach((id) => { s.clubs[id].leagueId = U1.id; s.clubs[id].wealth = U1.wealth; movements.push({ clubId: id, type: 'up', from: Lo.id, to: U1.id }); });
    });
    const myMove = movements.find((m) => m.clubId === s.clubId);

    s.history.unshift({
      season: s.season.label,
      club: userClub.name,
      league: userL.name,
      pos: myRow.pos, p: myRow.p, w: myRow.w, d: myRow.d, l: myRow.l, gf: myRow.gf, ga: myRow.ga, pts: myRow.pts,
      objective: userClub.objective.text, objectiveMet,
      champion: champions[userL.id],
      topScorer: myTop && myTop.stats.goals ? { name: myTop.name, goals: myTop.stats.goals } : null,
      movement: myMove ? (myMove.type === 'up' ? 'Ascenso a ' + s.leagues[myMove.to].name : 'Descenso a ' + s.leagues[myMove.to].name) : null,
    });
    s.archive.unshift({
      season: s.season.label,
      champions,
      table: tables[userL.id].map((r) => [s.clubs[r.clubId].name, r.pts, r.gd]),
      leagueName: userL.name,
      scorers,
      movements: movements.map((m) => ({ club: s.clubs[m.clubId].name, type: m.type, to: s.leagues[m.to].name })),
    });
    if (s.archive.length > 30) s.archive.length = 30;

    // Economía de la temporada, cesiones que vuelven y contratos del usuario que vencen
    const finRes = MCM.market.closeSeason(s, myRow.pos, tables[userL.id].length, objectiveMet);
    MCM.market.endOfSeasonContracts(s);

    // Evolución, edad, contratos y retiradas
    const developments = [];
    const retired = [];
    const expiredUser = [];
    MCM.dev.beforeAnnualDevelopment(s);
    Object.values(s.players).forEach((p) => {
      const club = p.clubId ? s.clubs[p.clubId] : null;
      const total = club ? s.leagues[club.leagueId].totalMd * 90 : 1;
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
        } else if (rng.chance(0.78)) {
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
      const target = s.leagues[club.leagueId].tier === 1 ? 23 : 22;
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
      const L = s.leagues[club.leagueId];
      club.budget = Math.max(club.budget, MCM.generator.transferBudget(club.rep, L.wealth) * 0.6) + Math.round(MCM.generator.transferBudget(club.rep, L.wealth) * 0.4 / 1e5) * 1e5;
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
    setupSeason(s);
    const club = C.userClub(s);
    C.news(s, 'board', 'Objetivo ' + s.season.label, 'La directiva fija el objetivo: ' + club.objective.text.toLowerCase() + '.');
    s.updatedAt = new Date().toISOString();
    return s.history[0];
  };

  /** Actualiza partidas guardadas con versiones anteriores sin perder nada. */
  C.migrate = function (s) {
    MCM.market.init(s);
    if (MCM.dev) MCM.dev.init(s);
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
