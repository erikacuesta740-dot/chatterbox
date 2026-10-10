/*
 * Profundidad (Etapa 3): cantera, progresión durante la temporada, moral según rol y minutos,
 * peticiones de salida, confianza de la directiva y rumores.
 */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const PL = MCM.players;
  const D = (MCM.dev = {});
  const C = () => MCM.career;

  D.ACADEMY_MAX = 12;
  D.EXPECTED_SHARE = { clave: 0.6, rotacion: 0.3, joven: 0.08, suplente: 0.12 };

  D.init = function (s) {
    if (!s.dev) s.dev = { confidence: 60, academy: [], week: 0, warned: {} };
    const d = s.dev;
    d.academy = d.academy || [];
    d.warned = d.warned || {};
    if (!d.seeded) {
      d.seeded = true;
      // Partidas antiguas: los «canteranos» del primer equipo siguen ahí; la cantera empieza con una hornada.
      intake(s, U.rng(s.seed + ':academy:seed'), 5, false);
    }
    return d;
  };

  D.academy = (s) => (s.dev ? s.dev.academy.map((id) => s.players[id]).filter(Boolean) : []);

  function intake(s, rng, n, announce) {
    const club = s.clubs[s.clubId];
    const L = s.leagues[club.leagueId];
    const ctx = { rng, nextId: s.nextId, usedNames: new Set(), players: s.players, startYear: s.season.year };
    const base = MCM.generator.baseOvr(club.rep);
    const out = [];
    for (let i = 0; i < n && s.dev.academy.length < D.ACADEMY_MAX; i++) {
      const pos = rng.pick(['POR', 'DFC', 'DFC', 'LD', 'LI', 'MCD', 'MC', 'MC', 'MCO', 'ED', 'EI', 'DC', 'DC']);
      const star = rng.chance(0.08 + club.rep / 1000);
      const p = MCM.generator.createPlayer(ctx, {
        pos, age: rng.int(15, 17), ovr: base - rng.range(20, 28) + (star ? 4 : 0), leagueNat: L.nat, rep: club.rep,
        wealth: club.wealth, clubId: s.clubId, contractEnd: s.season.year + 3, youth: true,
      });
      p.pot = U.clamp(p.ovr + rng.int(12, 26) + (star ? rng.int(4, 10) : 0), p.ovr, 94);
      p.academy = true;
      p.wage = 500;
      p.value = PL.marketValue(p);
      s.players[p.id] = p;
      s.dev.academy.push(p.id);
      out.push(p);
    }
    s.nextId = ctx.nextId;
    if (announce && out.length) {
      const best = out.slice().sort((a, b) => b.pot - a.pot)[0];
      C().news(s, 'youth', 'Nueva hornada de la cantera', out.length + ' juveniles se incorporan a la cantera. El más prometedor: ' + best.name + ' (' + best.pos + ', ' + best.age + ' años, potencial ' + best.pot + ').', { pid: best.id });
    }
    return out;
  }
  D.intake = intake;

  D.promote = function (s, pid) {
    const p = s.players[pid];
    if (!p || !p.academy) return { error: 'No es un jugador de la cantera.' };
    if (s.clubs[s.clubId].squad.length >= MCM.market.MAX_SQUAD) return { error: 'La plantilla ya tiene ' + MCM.market.MAX_SQUAD + ' jugadores.' };
    p.academy = false;
    s.dev.academy = s.dev.academy.filter((id) => id !== pid);
    s.clubs[s.clubId].squad.push(pid);
    p.wage = Math.max(1500, PL.fairWage(p, s.clubs[s.clubId].wealth));
    p.contractEnd = s.season.year + 3;
    p.morale = 80;
    C().news(s, 'youth', p.name + ' sube al primer equipo', p.name + ' (' + p.age + ' años, media ' + p.ovr + ', potencial ' + p.pot + ') firma su primer contrato profesional.', { pid });
    s._tr = {};
    return { status: 'done' };
  };

  D.releaseYouth = function (s, pid) {
    const p = s.players[pid];
    if (!p || !p.academy) return { error: 'No es un jugador de la cantera.' };
    s.dev.academy = s.dev.academy.filter((id) => id !== pid);
    delete s.players[pid];
    return { status: 'done' };
  };

  // Progresión mensual (cada 4 jornadas): pequeños cambios visibles durante la temporada.
  function monthly(s, rng) {
    const L = C().userLeague(s);
    const weeks = Math.max(1, L.played);
    Object.values(s.players).forEach((p) => {
      if (!p.clubId) return;
      const share = p.academy ? 0.45 : U.clamp(p.stats.min / (weeks * 90), 0, 1);
      const gap = p.pot - p.ovr;
      let delta = 0;
      if (p.age <= 24 && gap > 0 && rng.chance(Math.min(0.5, gap * 0.025 * (0.4 + share)))) delta = 1;
      else if (p.age >= 31 && rng.chance(0.04 * (p.age - 30))) delta = -1;
      if (!delta) return;
      p.ovr += delta;
      p.sd = (p.sd || 0) + delta;
      PL.shiftAttrs(p, delta);
      p.value = PL.marketValue(p);
      if (p.clubId === s.clubId) {
        p.ovrHist = p.ovrHist || [];
        p.ovrHist.push({ s: s.season.label, md: L.played, ovr: p.ovr });
        if (p.ovrHist.length > 16) p.ovrHist.shift();
        if (delta > 0 && p.age <= 21 && p.ovr % 3 === 0) C().news(s, 'youth', p.name + ' sigue creciendo', p.name + ' (' + p.age + ' años) sube a ' + p.ovr + ' de media.', { pid: p.id });
      }
    });
  }

  // Moral según minutos esperados por su rol; peticiones de salida.
  function moraleByRole(s) {
    const L = C().userLeague(s);
    if (L.played < 4) return;
    C().squad(s, s.clubId).forEach((p) => {
      if (p.loan) return;
      const role = MCM.market.role(s, p);
      const share = p.stats.min / (L.played * 90);
      const exp = D.EXPECTED_SHARE[role] || 0.1;
      if (share + 0.05 < exp) p.morale = U.clamp(p.morale - (role === 'clave' ? 2.5 : 1.5), 5, 100);
      else if (share > exp) p.morale = U.clamp(p.morale + 0.8, 5, 100);
      if (p.morale < 28 && !p.wantsOut && (role === 'clave' || role === 'rotacion') && p.age >= 20) {
        p.wantsOut = true;
        p.listed = true;
        C().news(s, 'morale', p.name + ' pide salir', p.name + ' está descontento por su falta de minutos y pide salir del club. Queda en la lista de transferibles.', { pid: p.id });
      }
      if (p.wantsOut && p.morale > 55) { p.wantsOut = false; }
    });
  }

  // Confianza de la directiva según la posición respecto al objetivo y los resultados.
  function board(s) {
    const L = C().userLeague(s);
    const club = s.clubs[s.clubId];
    const table = MCM.schedule.table(L);
    const me = table.find((r) => r.clubId === s.clubId);
    if (!me || me.p === 0) return;
    const last = me.form[me.form.length - 1];
    const diff = club.objective.target - me.pos;
    let delta = U.clamp(diff * 0.35, -2.5, 2) + (last === 'V' ? 1.2 : last === 'D' ? -1.6 : 0);
    if (L.played < 5) delta *= 0.4;
    s.dev.confidence = U.clamp(s.dev.confidence + delta, 0, 100);
    const c = s.dev.confidence;
    const key = s.season.label;
    if (c < 25 && s.dev.warned[key] !== 'low') {
      s.dev.warned[key] = 'low';
      C().news(s, 'board', 'La directiva, preocupada', 'La confianza de la directiva ha caído al ' + Math.round(c) + '%. Se esperan mejores resultados para cumplir el objetivo: ' + club.objective.text.toLowerCase() + '.');
    } else if (c > 85 && s.dev.warned[key] !== 'high') {
      s.dev.warned[key] = 'high';
      C().news(s, 'board', 'La directiva, encantada', 'La confianza de la directiva está en el ' + Math.round(c) + '%. Valoran muy positivamente el trabajo del cuerpo técnico.');
    }
  }

  // Rumores de interés de otros clubes por tus mejores jugadores.
  function rumours(s, rng) {
    if (!rng.chance(0.12)) return;
    const sq = C().squad(s, s.clubId).filter((p) => !p.loan).sort((a, b) => b.ovr - a.ovr).slice(0, 6);
    if (!sq.length) return;
    const p = rng.pick(sq);
    const suitors = Object.values(s.clubs).filter((c) => c.id !== s.clubId && c.rep >= s.clubs[s.clubId].rep && MCM.generator.baseOvr(c.rep) <= p.ovr + 3);
    if (!suitors.length) return;
    const c = rng.pick(suitors);
    C().news(s, 'rumour', 'Rumor: ' + c.name + ' sigue a ' + p.name, 'Según la prensa, ' + c.name + ' sigue de cerca a ' + p.name + '. Podría llegar una oferta cuando se abra el mercado.', { pid: p.id });
  }

  D.weekly = function (s) {
    D.init(s);
    const L = C().userLeague(s);
    const rng = U.rng(s.seed + ':dev:' + s.season.label + ':' + L.played);
    if (L.played % 4 === 0) monthly(s, rng);
    moraleByRole(s);
    board(s);
    rumours(s, rng);
  };

  /* Al cerrar temporada: deshacer la progresión provisional (la anual la consolida), confianza y nueva hornada. */
  D.beforeAnnualDevelopment = function (s) {
    Object.values(s.players).forEach((p) => {
      if (p.sd) { p.ovr -= p.sd; PL.shiftAttrs(p, -p.sd); p.sd = 0; }
    });
  };
  D.endSeason = function (s, objectiveMet) {
    D.init(s);
    s.dev.confidence = U.clamp(s.dev.confidence + (objectiveMet ? 15 : -20), 5, 100);
    if (s.dev.confidence < 20) C().news(s, 'board', 'Ultimátum de la directiva', 'Tras no cumplir el objetivo, la directiva exige resultados inmediatos la próxima temporada.');
    D.academy(s).forEach((p) => { if (p.age >= 19) { /* a los 19 debe subir o marcharse */ p.mustDecide = true; } });
    intake(s, U.rng(s.seed + ':academy:' + s.season.label), U.rng(s.seed + 'n' + s.season.label).int(4, 6), true);
    const decide = D.academy(s).filter((p) => p.mustDecide);
    if (decide.length) C().news(s, 'youth', 'Decisiones en la cantera', decide.map((p) => p.name).join(', ') + ' ya tiene' + (decide.length > 1 ? 'n' : '') + ' edad para el primer equipo: súbelos o libéralos.');
  };
})(globalThis.MCM = globalThis.MCM || {});
