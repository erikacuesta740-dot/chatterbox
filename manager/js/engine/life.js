/*
 * Día a día del club: entrenamiento y planes de desarrollo, red de ojeadores (incluidos juveniles),
 * charlas con jugadores y ruedas de prensa.
 */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const PL = MCM.players;
  const Lf = (MCM.life = {});
  const C = () => MCM.career;

  Lf.INTENSITY = { low: { label: 'Suave', rec: 1.18, dev: 0.8, inj: 0.85 }, normal: { label: 'Normal', rec: 1, dev: 1, inj: 1 }, high: { label: 'Intensa', rec: 0.82, dev: 1.3, inj: 1.15 } };
  Lf.REGIONS = {
    ESP: 'España', ENG: 'Inglaterra', ITA: 'Italia', GER: 'Alemania', FRA: 'Francia', EUR: 'Resto de Europa', FREE: 'Agentes libres',
  };
  Lf.SCOUT_COST = [0, 60000, 150000, 350000, 700000, 1200000];
  Lf.MAX_SCOUTS = 3;

  Lf.init = function (s) {
    const club = s.clubs[s.clubId];
    if (!club.training) club.training = 'normal';
    if (!s.scouting) s.scouting = { scouts: [], known: {}, reports: [], prospects: [], seq: 0 };
    return s.scouting;
  };

  // ---------- Entrenamiento ----------
  Lf.intensity = (s) => Lf.INTENSITY[(s.clubs[s.clubId].training) || 'normal'];
  Lf.recoveryFactor = (s, p) => (p.clubId === s.clubId ? Lf.intensity(s).rec : 1);
  Lf.devFactor = (s, p) => (p.clubId === s.clubId ? Lf.intensity(s).dev : 1);

  Lf.FOCUS = { pac: 'Ritmo', sho: 'Tiro', pas: 'Pase', dri: 'Regate', def: 'Defensa', phy: 'Físico', div: 'Estirada', han: 'Manos', kic: 'Saque', ref: 'Reflejos', spd: 'Velocidad', pos: 'Colocación' };
  Lf.canRetrain = (p, pos) => pos !== p.pos && pos !== 'POR' && p.pos !== 'POR' && PL.fit(p, pos) >= 0.75;

  Lf.setPlan = function (s, pid, plan) {
    const p = s.players[pid];
    if (!p || p.clubId !== s.clubId) return 'Solo puedes planificar a jugadores de tu plantilla.';
    if (plan.newPos && !Lf.canRetrain(p, plan.newPos)) return 'Ese cambio de posición no es posible para ' + p.name + '.';
    if (plan.focus && p.attrs[plan.focus] == null) return 'Atributo no válido.';
    p.plan = { focus: plan.focus || null, newPos: plan.newPos || null, progress: p.plan && p.plan.newPos === plan.newPos ? p.plan.progress || 0 : 0, gains: (p.plan && p.plan.gains) || 0 };
    if (!p.plan.focus && !p.plan.newPos) p.plan = null;
    return null;
  };

  function weeklyTraining(s, rng) {
    const f = Lf.intensity(s);
    C().squad(s, s.clubId).concat(MCM.dev ? MCM.dev.academy(s) : []).forEach((p) => {
      if (!p.plan || (p.injury && p.injury.days > 0)) return;
      const young = p.age <= 23 ? 1.3 : p.age <= 28 ? 1 : 0.6;
      if (p.plan.focus && p.attrs[p.plan.focus] < 99 && rng.chance(0.22 * young * f.dev)) {
        p.attrs[p.plan.focus]++;
        p.plan.gains = (p.plan.gains || 0) + 1;
        if (p.plan.gains % 4 === 0 && p.pot > p.ovr) {
          p.ovr++;
          p.sd = (p.sd || 0) + 1;
          p.value = PL.marketValue(p);
          C().news(s, 'training', p.name + ' mejora en ' + Lf.FOCUS[p.plan.focus].toLowerCase(), 'El trabajo específico da resultado: ' + p.name + ' sube a ' + p.ovr + ' de media.', { pid: p.id });
        }
      }
      if (p.plan.newPos) {
        p.plan.progress = Math.min(100, (p.plan.progress || 0) + (100 / 12) * (p.age <= 25 ? 1.2 : 0.9) * f.dev);
        if (p.plan.progress >= 100) {
          const old = p.pos;
          p.pos = p.plan.newPos;
          p.alt = Array.from(new Set([old].concat(p.alt || []).filter((x) => x !== p.pos))).slice(0, 3);
          // Los atributos se adaptan parcialmente al nuevo puesto
          const fresh = PL.makeAttrs(p.pos, p.ovr, rng);
          Object.keys(p.attrs).forEach((k) => { if (fresh[k] != null) p.attrs[k] = Math.round((p.attrs[k] + fresh[k]) / 2); });
          C().news(s, 'training', p.name + ' ya domina su nueva posición', p.name + ' completa su reconversión de ' + old + ' a ' + p.pos + '.', { pid: p.id });
          p.plan.newPos = null;
          p.plan.progress = 0;
          if (!p.plan.focus) p.plan = null;
        }
      }
    });
  }

  // ---------- Ojeadores ----------
  const SCOUT_NAMES = ['Paco Ledesma', 'Mark Hollis', 'Gianni Rota', 'Klaus Berger', 'Luc Moreau', 'Rui Pacheco', 'Sven Aldén', 'Tomás Ibarra', 'Owen Pryce', 'Marco Vitale'];

  Lf.hireScout = function (s, stars) {
    const sc = Lf.init(s);
    stars = U.clamp(Math.round(stars), 1, 5);
    if (sc.scouts.length >= Lf.MAX_SCOUTS) return 'Ya tienes ' + Lf.MAX_SCOUTS + ' ojeadores.';
    const cost = Lf.SCOUT_COST[stars];
    const club = s.clubs[s.clubId];
    if (cost > club.budget) return 'No hay presupuesto: contratarlo cuesta ' + U.money(cost) + '.';
    club.budget -= cost;
    if (s.market) { s.market.fin.expense.transfers += 0; s.market.ledger.unshift({ season: s.season.label, md: s.week || 0, date: s.date, concept: 'Contrato de ojeador (' + stars + '★)', amount: -cost, kind: 'scout' }); }
    const rng = U.rng(s.seed + ':scout:' + (++sc.seq));
    sc.scouts.push({ id: 'sc' + sc.seq, name: rng.pick(SCOUT_NAMES), stars, mission: null });
    return null;
  };
  Lf.fireScout = function (s, id) { const sc = Lf.init(s); sc.scouts = sc.scouts.filter((x) => x.id !== id); };

  Lf.assign = function (s, id, mission) {
    const sc = Lf.init(s);
    const scout = sc.scouts.find((x) => x.id === id);
    if (!scout) return 'Ojeador no encontrado.';
    if (!Lf.REGIONS[mission.region] && mission.type !== 'youth') return 'Región no válida.';
    scout.mission = {
      type: mission.type === 'youth' ? 'youth' : 'senior', region: mission.region, pos: mission.pos || 'ALL',
      ageMax: mission.ageMax ? Number(mission.ageMax) : null, minPot: mission.minPot ? Number(mission.minPot) : null,
      weeks: U.clamp(Number(mission.weeks) || 4, 2, 12), done: 0,
    };
    return null;
  };

  function regionOf(s, p) {
    const club = p.clubId ? s.clubs[p.clubId] : null;
    if (!club) return 'FREE';
    if (club.ext) return 'EUR';
    return s.leagues[club.leagueId].nat;
  }

  // Rango de potencial visible para jugadores sin informe
  Lf.potRange = function (s, p) {
    if (p.clubId === s.clubId || p.academy || (s.scouting && s.scouting.known[p.id]) || p.age >= 27) return null;
    const w = p.age <= 20 ? 10 : p.age <= 23 ? 7 : 4;
    const off = U.hash(s.seed + p.id) % (w + 1);
    const lo = Math.max(p.ovr, p.pot - off);
    return [lo, Math.min(99, lo + w)];
  };
  Lf.potLabel = function (s, p) {
    const r = Lf.potRange(s, p);
    return r ? r[0] + '–' + r[1] : String(p.pot);
  };

  function weeklyScouting(s, rng) {
    const sc = Lf.init(s);
    sc.scouts.forEach((scout) => {
      const m = scout.mission;
      if (!m) return;
      m.done++;
      if (m.type === 'youth') {
        if (m.done % 3 === 0) makeProspect(s, scout, rng);
      } else {
        const pool = Object.values(s.players).filter((p) => !p.academy && p.clubId !== s.clubId && regionOf(s, p) === m.region &&
          (m.pos === 'ALL' || p.pos === m.pos) && (!m.ageMax || p.age <= m.ageMax) && !sc.known[p.id] && p.pot >= (m.minPot || 0) - (5 - scout.stars));
        const n = rng.chance(0.35 + scout.stars * 0.1) ? 1 + (rng.chance(scout.stars / 8) ? 1 : 0) : 0;
        for (let i = 0; i < n && pool.length; i++) {
          // Mejores ojeadores encuentran mejor potencial
          const pick = rng.weighted(pool, (p) => Math.pow(Math.max(1, p.pot - 50), 1 + scout.stars * 0.35));
          pool.splice(pool.indexOf(pick), 1);
          sc.known[pick.id] = { week: s.week || 0, season: s.season.label, scout: scout.name };
          sc.reports.unshift({ pid: pick.id, season: s.season.label, date: s.date, scout: scout.name, stars: scout.stars });
          if (sc.reports.length > 60) sc.reports.length = 60;
        }
      }
      if (m.done >= m.weeks) {
        C().news(s, 'scouting', scout.name + ' termina su misión', 'Informe final: ' + (m.type === 'youth' ? 'revisa las promesas propuestas en Ojeadores.' : sc.reports.filter((r) => r.scout === scout.name).length + ' jugadores observados en ' + Lf.REGIONS[m.region] + '.'));
        scout.mission = null;
      }
    });
  }

  function makeProspect(s, scout, rng) {
    const sc = s.scouting;
    if (sc.prospects.length >= 6) return;
    const club = s.clubs[s.clubId];
    const m = scout.mission;
    const nat = m.region === 'EUR' || m.region === 'FREE' ? rng.pick(['POR', 'NED', 'BEL', 'CRO', 'SRB', 'DEN']) : m.region;
    const pos = m.pos !== 'ALL' ? m.pos : rng.pick(['DFC', 'LD', 'LI', 'MCD', 'MC', 'MCO', 'ED', 'EI', 'DC', 'POR']);
    const base = MCM.generator.baseOvr(club.rep) - rng.range(18, 26);
    const pot = U.clamp(Math.round(base + 18 + rng.range(0, 8) + scout.stars * 2.4 + rng.normal(0, 3)), 60, 94);
    sc.prospects.push({ id: 'pr' + (++sc.seq), name: null, nat, pos, age: rng.int(15, 17), ovr: Math.round(base), pot, scout: scout.name, seed: rng.int(1, 1e9) });
    C().news(s, 'scouting', 'Nueva promesa detectada', scout.name + ' recomienda a un ' + PL.POSITIONS[pos].name.toLowerCase() + ' de ' + MCM.DATA.nationName(nat) + ' con potencial ' + pot + '.');
  }

  Lf.signProspect = function (s, id) {
    const sc = Lf.init(s);
    const pr = sc.prospects.find((x) => x.id === id);
    if (!pr) return 'Promesa no encontrada.';
    if (MCM.dev.academy(s).length >= MCM.dev.ACADEMY_MAX) return 'La cantera está llena (' + MCM.dev.ACADEMY_MAX + ').';
    const rng = U.rng(pr.seed);
    const ctx = { rng, nextId: s.nextId, usedNames: new Set(), players: s.players, startYear: s.season.year };
    const club = s.clubs[s.clubId];
    const p = MCM.generator.createPlayer(ctx, { pos: pr.pos, age: pr.age, ovr: pr.ovr, pot: pr.pot, nat: pr.nat, clubId: s.clubId, rep: club.rep, wealth: club.wealth, contractEnd: s.season.year + 3, youth: true });
    p.academy = true;
    p.wage = 500;
    s.nextId = ctx.nextId;
    s.players[p.id] = p;
    s.dev.academy.push(p.id);
    sc.known[p.id] = { week: s.week || 0, season: s.season.label, scout: pr.scout };
    sc.prospects = sc.prospects.filter((x) => x.id !== id);
    C().news(s, 'youth', p.name + ' llega a la cantera', p.name + ' (' + p.pos + ', ' + p.age + ' años, potencial ' + p.pot + ') se une a la cantera.', { pid: p.id });
    return null;
  };
  Lf.dropProspect = function (s, id) { const sc = Lf.init(s); sc.prospects = sc.prospects.filter((x) => x.id !== id); };

  // ---------- Charlas con jugadores ----------
  Lf.TALKS = {
    praise: 'Elogiar su rendimiento',
    demand: 'Exigirle más',
    promise: 'Prometerle más minutos',
    role: 'Explicarle su papel',
  };
  Lf.canTalk = (s, p) => p.clubId === s.clubId && !p.academy && (p.lastTalk == null || (s.week || 0) - p.lastTalk >= 2 || p.lastTalkSeason !== s.season.label);

  Lf.talk = function (s, pid, kind) {
    const p = s.players[pid];
    if (!p || !Lf.canTalk(s, p)) return { error: 'Ya hablaste con él hace poco. Espera un par de semanas.' };
    const rng = U.rng(s.seed + ':talk:' + pid + ':' + s.season.label + ':' + (s.week || 0) + kind);
    const avg = p.stats.rN ? p.stats.rSum / p.stats.rN : p.form;
    let delta = 0;
    let text = '';
    if (kind === 'praise') {
      if (avg >= 6.9) { delta = rng.int(6, 10); text = 'Agradece el reconocimiento y se siente valorado.'; }
      else if (avg >= 6.3) { delta = rng.int(1, 4); text = 'Lo recibe bien, aunque sabe que puede dar más.'; }
      else { delta = -rng.int(1, 4); text = 'No se lo cree: sabe que no está jugando bien.'; }
    } else if (kind === 'demand') {
      if (avg < 6.4 && rng.chance(0.55)) { delta = rng.int(3, 7); text = 'Reacciona bien y promete dar un paso adelante.'; p.form = Math.min(8, p.form + 0.3); }
      else if (avg < 6.4) { delta = -rng.int(4, 8); text = 'Le sienta mal y se pone a la defensiva.'; }
      else { delta = -rng.int(5, 10); text = 'No entiende la crítica: cree que está rindiendo bien.'; }
    } else if (kind === 'promise') {
      delta = rng.int(8, 13);
      p.promise = { games: C().gamesPlayed(s, s.clubId), minutes: p.stats.min, season: s.season.label, week: s.week || 0 };
      text = 'Acepta tu palabra. Esperará más minutos en las próximas semanas.';
    } else if (kind === 'role') {
      const role = MCM.market.role(s, p);
      const share = p.stats.min / Math.max(1, C().gamesPlayed(s, s.clubId) * 90);
      const exp = (MCM.dev.EXPECTED_SHARE || {})[role] || 0.1;
      if (share + 0.05 >= exp) { delta = rng.int(2, 5); text = 'Entiende su papel (' + MCM.market.ROLE_LABEL[role].toLowerCase() + ') y está conforme.'; }
      else { delta = -rng.int(0, 3); text = 'Entiende lo que le dices, pero espera jugar más.'; }
    } else return { error: 'Charla no válida.' };
    p.morale = U.clamp(p.morale + delta, 5, 100);
    p.lastTalk = s.week || 0;
    p.lastTalkSeason = s.season.label;
    return { delta, text };
  };

  function checkPromises(s) {
    C().squad(s, s.clubId).forEach((p) => {
      if (!p.promise || p.promise.season !== s.season.label) { if (p.promise && p.promise.season !== s.season.label) p.promise = null; return; }
      if ((s.week || 0) - p.promise.week < 6) return;
      const games = C().gamesPlayed(s, s.clubId) - p.promise.games;
      const mins = p.stats.min - p.promise.minutes;
      if (games <= 0) return;
      const share = mins / (games * 90);
      if (share >= 0.4) {
        p.morale = U.clamp(p.morale + 6, 5, 100);
        C().news(s, 'morale', p.name + ', satisfecho', 'Cumpliste tu promesa de darle minutos y ' + p.name + ' lo valora.', { pid: p.id });
      } else {
        p.morale = U.clamp(p.morale - 20, 5, 100);
        C().news(s, 'morale', p.name + ' se siente engañado', 'No has cumplido la promesa de darle más minutos. Su moral se desploma.', { pid: p.id });
      }
      p.promise = null;
    });
  }

  // ---------- Ruedas de prensa ----------
  const Q = {
    win: [
      { q: '¿Qué le ha parecido la victoria de hoy?', a: [['Mérito de los jugadores, han estado enormes.', { team: 3 }], ['Es lo que se espera de este equipo.', { board: 2, team: -1 }], ['Hay cosas que mejorar, no nos vamos a relajar.', { team: 1, board: 1 }]] },
      { q: '¿Puede este equipo pelear por todo?', a: [['Vamos partido a partido.', {}], ['Sí, tenemos plantilla para ganar títulos.', { board: 3, pressure: 1 }], ['Nuestro objetivo es el que marca la directiva.', { board: 1 }]] },
    ],
    loss: [
      { q: '¿Qué ha fallado hoy?', a: [['La responsabilidad es mía.', { team: 2, board: -1 }], ['Algunos jugadores no han estado al nivel.', { team: -3, board: 1 }], ['El rival fue mejor, hay que felicitarle.', {}]] },
      { q: '¿Está en peligro su puesto?', a: [['Tengo la confianza de la directiva.', { board: -1 }], ['Solo pienso en el próximo partido.', { board: 1 }], ['Si no llegan resultados, lo entenderé.', { team: -1, board: 2 }]] },
    ],
    draw: [
      { q: '¿Un punto que sabe a poco?', a: [['Merecimos ganar.', { team: 1 }], ['Es un buen punto ante un rival difícil.', { board: -1 }], ['Tenemos que ser más ambiciosos.', { team: -1, board: 2 }]] },
    ],
    star: [
      { q: '¿Qué le parece el momento de {p}?', a: [['Es un jugador fundamental para nosotros.', { star: 6 }], ['Todos son importantes por igual.', { star: -2, team: 1 }], ['Tiene que seguir trabajando como todos.', { star: -4, board: 1 }]] },
    ],
  };

  Lf.maybePress = function (s, f) {
    const rng = U.rng(s.seed + ':press:' + f.id);
    if (!rng.chance(0.45)) return;
    const mine = f.home === s.clubId;
    const gf = mine ? f.hg : f.ag;
    const ga = mine ? f.ag : f.hg;
    const won = f.winner ? f.winner === s.clubId : gf > ga;
    const lost = f.winner ? f.winner !== s.clubId : gf < ga;
    const pool = won ? Q.win : lost ? Q.loss : Q.draw;
    const qs = [rng.pick(pool)];
    const star = C().squad(s, s.clubId).filter((p) => p.stats.rN >= 3).sort((a, b) => b.stats.rSum / b.stats.rN - a.stats.rSum / a.stats.rN)[0];
    if (star && rng.chance(0.5)) qs.push(Object.assign({}, Q.star[0], { q: Q.star[0].q.replace('{p}', star.name), pid: star.id }));
    s.press = { fid: f.id, date: s.date, questions: qs.map((x) => ({ q: x.q, a: x.a.map((y) => y[0]), fx: x.a.map((y) => y[1]), pid: x.pid || null })) };
  };

  Lf.answerPress = function (s, answers) {
    const pr = s.press;
    if (!pr) return null;
    const out = [];
    pr.questions.forEach((q, i) => {
      const k = answers[i];
      if (k == null || !q.fx[k]) return;
      const fx = q.fx[k];
      if (fx.team) C().squad(s, s.clubId).forEach((p) => { p.morale = U.clamp(p.morale + fx.team, 5, 100); });
      if (fx.board && s.dev) s.dev.confidence = U.clamp(s.dev.confidence + fx.board, 0, 100);
      if (fx.star && q.pid && s.players[q.pid]) s.players[q.pid].morale = U.clamp(s.players[q.pid].morale + fx.star, 5, 100);
      out.push(fx);
    });
    s.press = null;
    return out;
  };
  Lf.skipPress = function (s) { if (s.press && s.dev) s.dev.confidence = U.clamp(s.dev.confidence - 1, 0, 100); s.press = null; };

  // ---------- Semana ----------
  Lf.weekly = function (s) {
    Lf.init(s);
    const rng = U.rng(s.seed + ':life:' + s.season.label + ':' + (s.week || 0));
    weeklyTraining(s, rng);
    weeklyScouting(s, rng);
    checkPromises(s);
  };
})(globalThis.MCM = globalThis.MCM || {});
