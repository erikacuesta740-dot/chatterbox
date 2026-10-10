/*
 * Carrera del entrenador: reputación, despidos, ofertas de otros clubes y cambio de equipo;
 * premios de temporada, historial de jugadores y récords del club.
 */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const R = (MCM.mgr = {});
  const C = () => MCM.career;
  const SC = () => MCM.schedule;

  R.init = function (s) {
    if (!s.manager) {
      const club = s.clubs[s.clubId];
      s.manager = {
        rep: U.clamp(Math.round(club.rep - 18), 25, 70), unemployed: false, offers: [], stints: [{ clubId: club.id, club: club.name, from: s.season.label, to: null }],
        stats: { games: 0, w: 0, d: 0, l: 0 },
      };
    }
    s.awards = s.awards || [];
    s.clubRecords = s.clubRecords || {};
    return s.manager;
  };

  R.repLabel = (r) => (r >= 85 ? 'Leyenda' : r >= 72 ? 'Élite' : r >= 60 ? 'Prestigioso' : r >= 45 ? 'Respetado' : r >= 32 ? 'Prometedor' : 'Desconocido');

  /* Después de cada partido del usuario. */
  R.afterMatch = function (s, f) {
    R.init(s);
    const st = s.manager.stats;
    const mine = f.home === s.clubId;
    const gf = mine ? f.hg : f.ag;
    const ga = mine ? f.ag : f.hg;
    st.games++;
    if (f.winner) { if (f.winner === s.clubId) st.w++; else st.l++; } else if (gf > ga) st.w++; else if (gf < ga) st.l++; else st.d++;
    // Récords del club: mayor goleada
    const rec = clubRec(s, s.clubId);
    if (gf - ga > (rec.bigWin ? rec.bigWin.diff : 0)) rec.bigWin = { diff: gf - ga, text: s.clubs[f.home].short + ' ' + f.hg + '-' + f.ag + ' ' + s.clubs[f.away].short, season: s.season.label };
  };

  function clubRec(s, clubId) {
    s.clubRecords = s.clubRecords || {};
    return (s.clubRecords[clubId] = s.clubRecords[clubId] || { goals: {}, apps: {}, bigWin: null, bestPts: null });
  }

  // ---------- Despido y ofertas ----------
  R.checkSack = function (s) {
    R.init(s);
    if (s.manager.unemployed || (s.week || 0) < 10) return false;
    if (s.dev && s.dev.confidence <= 4) { R.sack(s, 'La directiva ha perdido la confianza en el proyecto tras los malos resultados.'); return true; }
    return false;
  };

  R.sack = function (s, reason) {
    const club = s.clubs[s.clubId];
    s.manager.unemployed = true;
    s.manager.rep = U.clamp(s.manager.rep - 6, 10, 99);
    closeStint(s);
    s.manager.offers = R.generateOffers(s, true);
    C().news(s, 'board', 'Destituido por ' + club.name, reason + ' Tienes ' + s.manager.offers.length + ' ofertas de otros clubes.');
  };

  function closeStint(s) {
    const st = s.manager.stints[s.manager.stints.length - 1];
    if (st && !st.to) st.to = s.season.label;
  }

  /* Clubes interesados según la reputación del entrenador. */
  R.generateOffers = function (s, desperate) {
    const m = s.manager;
    const rng = U.rng(s.seed + ':offers:' + s.season.label + ':' + (s.week || 0) + ':' + m.rep);
    const cur = s.clubs[s.clubId];
    const ceiling = m.rep + 14;
    const floor = desperate ? 0 : cur.rep + 2;
    let cands = Object.values(s.clubs).filter((c) => c.leagueId && c.id !== s.clubId && c.rep <= ceiling && c.rep >= floor);
    if (desperate && cands.length < 3) cands = Object.values(s.clubs).filter((c) => c.leagueId && c.id !== s.clubId).sort((a, b) => a.rep - b.rep).slice(0, 8);
    const picks = rng.shuffle(cands).sort((a, b) => b.rep - a.rep).slice(0, desperate ? 4 : rng.int(0, 3));
    return picks.map((c) => ({ clubId: c.id, objective: c.objective ? c.objective.text : '', budget: c.budget }));
  };

  R.switchClub = function (s, newClubId) {
    const old = s.clubs[s.clubId];
    const club = s.clubs[newClubId];
    if (!club || !club.leagueId) return 'Club no válido.';
    // Los juveniles de la cantera se quedan en el club anterior
    (s.dev ? s.dev.academy : []).forEach((pid) => {
      const p = s.players[pid];
      if (!p) return;
      p.academy = false;
      if (!old.squad.includes(pid)) old.squad.push(pid);
    });
    if (s.dev) { s.dev.academy = []; s.dev.confidence = 60; s.dev.warned = {}; }
    if (!s.manager.unemployed) closeStint(s);
    s.clubId = club.id;
    s.manager.unemployed = false;
    s.manager.offers = [];
    s.manager.stints.push({ clubId: club.id, club: club.name, from: s.season.label, to: null });
    s.settings.autoLineup = true;
    club.lineup = MCM.lineup.autoPick(C().squad(s, club.id), club.tactics.formation);
    if (s.market) {
      s.market.talks = {};
      s.market.offers = [];
      s.market.shortlist = [];
      s.market.fin = MCM.market.emptyFin(s.season.label);
    }
    MCM.market.init(s);
    if (MCM.dev) MCM.dev.intake(s, U.rng(s.seed + ':newclub:' + club.id + s.season.label), 5, false);
    C().ensureNumbers(s, club.id);
    s._tr = {};
    C().news(s, 'board', s.managerName + ', nuevo entrenador de ' + club.name, 'Objetivo de la directiva: ' + (club.objective ? club.objective.text.toLowerCase() : 'consolidar al equipo') + '. Presupuesto de fichajes: ' + U.money(club.budget) + '.');
    return null;
  };

  R.resign = function (s) {
    R.init(s);
    const club = s.clubs[s.clubId];
    s.manager.unemployed = true;
    closeStint(s);
    s.manager.rep = U.clamp(s.manager.rep - 3, 10, 99);
    s.manager.offers = R.generateOffers(s, true);
    C().news(s, 'board', 'Dimisión en ' + club.name, s.managerName + ' deja el cargo. Tienes ' + s.manager.offers.length + ' ofertas.');
  };

  // ---------- Premios de temporada ----------
  const TEAM_SHAPE = [['POR', 1], ['DEF', 4], ['MID', 3], ['ATT', 3]];
  function leagueAwards(s, L) {
    const players = [];
    L.clubIds.forEach((cid) => C().squad(s, cid).forEach((p) => players.push(p)));
    const games = Math.max(1, L.totalMd);
    const elig = players.filter((p) => p.stats.apps >= games * 0.45 && p.stats.rN);
    const avgR = (p) => p.stats.rSum / p.stats.rN;
    const score = (p) => avgR(p) + p.stats.goals * 0.025 + p.stats.assists * 0.015 + p.stats.motm * 0.02;
    const pick = (list, fn) => list.slice().sort((a, b) => fn(b) - fn(a))[0];
    const tag = (p, extra) => (p ? Object.assign({ pid: p.id, name: p.name, club: s.clubs[p.clubId] ? s.clubs[p.clubId].name : '', pos: p.pos }, extra || {}) : null);
    const mvp = pick(elig, score);
    const lg = (p) => (p.stats.lgoals != null ? p.stats.lgoals : p.stats.goals);
    const scorer = pick(players, (p) => lg(p) * 100 + p.stats.assists);
    const gk = pick(elig.filter((p) => p.pos === 'POR'), (p) => p.stats.cs * 10 + avgR(p));
    const young = pick(elig.filter((p) => p.age <= 21), score);
    const team = [];
    TEAM_SHAPE.forEach(([line, n]) => {
      elig.filter((p) => (line === 'POR' ? p.pos === 'POR' : MCM.players.POSITIONS[p.pos].line === line)).sort((a, b) => score(b) - score(a)).slice(0, n)
        .forEach((p) => team.push(tag(p, { r: Math.round(avgR(p) * 100) / 100 })));
    });
    const table = SC().table(L);
    const champ = table[0].clubId;
    return {
      league: L.id, leagueName: L.name,
      mvp: tag(mvp, mvp ? { r: Math.round(avgR(mvp) * 100) / 100 } : null),
      scorer: tag(scorer, scorer ? { goals: lg(scorer) } : null),
      gk: tag(gk, gk ? { cs: gk.stats.cs } : null),
      young: tag(young, young ? { r: Math.round(avgR(young) * 100) / 100 } : null),
      team,
      champion: s.clubs[champ].name,
    };
  }

  /* Al terminar la temporada (antes de reiniciar estadísticas). */
  R.seasonAwards = function (s) {
    R.init(s);
    const tier1 = Object.values(s.leagues).filter((L) => L.tier === 1);
    const leagues = Object.values(s.leagues).map((L) => leagueAwards(s, L));
    // Balón de Oro: rendimiento + goles + títulos de equipo
    const trophyWeight = {};
    const add = (clubId, w) => { trophyWeight[clubId] = (trophyWeight[clubId] || 0) + w; };
    tier1.forEach((L) => add(SC().table(L)[0].clubId, 2));
    MCM.comps.all(s).forEach((c) => { if (c.winner) add(c.winner, c.id === 'UCL' ? 4 : c.id === 'UEL' ? 1.5 : c.type === 'cup' ? 1 : 1); });
    const cands = [];
    tier1.forEach((L) => L.clubIds.forEach((cid) => C().squad(s, cid).forEach((p) => { if (p.stats.rN >= 20) cands.push(p); })));
    Object.values(s.clubs).filter((c) => c.ext).forEach((c) => C().squad(s, c.id).forEach((p) => { if (p.stats.rN >= 8) cands.push(p); }));
    const bdo = cands.map((p) => ({ p, k: (p.stats.rSum / p.stats.rN) * 1.2 + p.stats.goals * 0.04 + p.stats.assists * 0.025 + (trophyWeight[p.clubId] || 0) * 0.35 + p.ovr * 0.05 }))
      .sort((a, b) => b.k - a.k).slice(0, 3).map((x, i) => ({ pid: x.p.id, name: x.p.name, club: s.clubs[x.p.clubId].name, pos: i + 1, goals: x.p.stats.goals }));
    // Entrenador del año: el usuario si gana la liga o supera claramente el objetivo
    const userL = C().userLeague(s);
    const myPos = SC().table(userL).findIndex((r) => r.clubId === s.clubId) + 1;
    const obj = s.clubs[s.clubId].objective;
    const coach = myPos === 1 || (obj && myPos + 4 <= obj.target);
    const entry = { season: s.season.label, ballonDor: bdo, leagues, coachOfYear: coach ? { league: userL.name, name: s.managerName } : null };
    s.awards.unshift(entry);
    if (s.awards.length > 30) s.awards.length = 30;
    // Premios individuales en la ficha del jugador
    const give = (a, label) => { if (a && s.players[a.pid]) { const p = s.players[a.pid]; (p.awards = p.awards || []).push(s.season.label + ' · ' + label); } };
    bdo.forEach((b) => give(b, b.pos === 1 ? 'Balón de Oro' : 'Balón de Oro (' + b.pos + 'º)'));
    leagues.forEach((l) => { give(l.mvp, 'Mejor jugador de ' + l.leagueName); give(l.scorer, 'Máximo goleador de ' + l.leagueName); give(l.gk, 'Mejor portero de ' + l.leagueName); give(l.young, 'Mejor joven de ' + l.leagueName); });
    if (bdo[0]) C().news(s, 'awards', bdo[0].name + ' gana el Balón de Oro', bdo[0].name + ' (' + bdo[0].club + ') se lleva el Balón de Oro ' + s.season.label + '. Le acompañan en el podio ' + bdo.slice(1).map((b) => b.name).join(' y ') + '.');
    const mine = leagues.find((l) => l.league === userL.id);
    if (mine && mine.scorer) C().news(s, 'awards', 'Premios de ' + mine.leagueName, 'Mejor jugador: ' + (mine.mvp ? mine.mvp.name : '—') + '. Máximo goleador: ' + mine.scorer.name + ' (' + mine.scorer.goals + '). Mejor portero: ' + (mine.gk ? mine.gk.name : '—') + '.');
    if (coach) C().news(s, 'awards', 'Entrenador del año', s.managerName + ' es elegido mejor entrenador de ' + userL.name + '.');
    return entry;
  };

  /* Historial de jugadores y récords del club, antes de reiniciar estadísticas. */
  R.recordSeasonStats = function (s) {
    const year = s.season.year;
    Object.values(s.players).forEach((p) => {
      if (!p.clubId || p.stats.apps < 3) return;
      const club = s.clubs[p.clubId];
      p.career = p.career || [];
      p.career.push([year, club.short, p.stats.apps, p.stats.goals, p.stats.assists, p.stats.rN ? Math.round((p.stats.rSum / p.stats.rN) * 10) : 0, p.clubId]);
      if (p.career.length > 15) p.career.shift();
    });
    const rec = clubRec(s, s.clubId);
    C().squad(s, s.clubId).forEach((p) => {
      if (!p.stats.apps) return;
      rec.goals[p.id] = rec.goals[p.id] || { name: p.name, n: 0 };
      rec.goals[p.id].n += p.stats.goals;
      rec.apps[p.id] = rec.apps[p.id] || { name: p.name, n: 0 };
      rec.apps[p.id].n += p.stats.apps;
    });
    // Recortar a los 25 mejores para no crecer sin límite
    ['goals', 'apps'].forEach((k) => {
      const top = Object.entries(rec[k]).sort((a, b) => b[1].n - a[1].n).slice(0, 25);
      rec[k] = Object.fromEntries(top);
    });
    const L = C().userLeague(s);
    const row = SC().table(L).find((r) => r.clubId === s.clubId);
    if (row && (!rec.bestPts || row.pts > rec.bestPts.pts)) rec.bestPts = { pts: row.pts, season: s.season.label, league: L.name };
  };

  /* Reputación y ofertas al cerrar la temporada. */
  R.endSeason = function (s, objectiveMet, movement, pos) {
    R.init(s);
    const m = s.manager;
    const myTrophies = (s.managerTrophies || []).filter((t) => t.season === s.season.label);
    let delta = objectiveMet ? 4 : -4;
    myTrophies.forEach((t) => { delta += /Campeones/.test(t.name) ? 10 : /Europa|Conference/.test(t.name) ? 5 : 3; });
    if (movement === 'up') delta += 4;
    if (movement === 'down') delta -= 6;
    m.rep = U.clamp(m.rep + delta, 10, 99);
    const conf = s.dev ? s.dev.confidence : 50;
    if (!objectiveMet && conf < 15) {
      R.sack(s, 'Tras no cumplir el objetivo, la directiva decide no continuar contigo.');
      return;
    }
    const rng = U.rng(s.seed + ':offerluck:' + s.season.label);
    m.offers = objectiveMet || rng.chance(0.25) ? R.generateOffers(s, false) : [];
    if (m.offers.length) C().news(s, 'board', 'Ofertas de otros clubes', m.offers.map((o) => s.clubs[o.clubId].name).join(', ') + (m.offers.length > 1 ? ' quieren' : ' quiere') + ' contratarte. Puedes aceptar antes del primer partido de la nueva temporada.');
  };
})(globalThis.MCM = globalThis.MCM || {});
