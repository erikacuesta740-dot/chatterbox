/*
 * Motor de simulación de partidos.
 * El resultado depende de: medias del once, encaje por posición, forma, moral, cansancio,
 * táctica, localía y un componente de azar acotado. Se simula en tramos de 5 minutos.
 */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const PL = MCM.players;
  const M = (MCM.match = {});

  const TACTIC = {
    mentality: { def: { att: 0.95, def: 1.04 }, bal: { att: 1, def: 1 }, att: { att: 1.045, def: 0.955 } },
    pressing: { low: { ctrl: 0.97, def: 1.02, tire: 0.85, cards: 0.85 }, mid: { ctrl: 1, def: 1, tire: 1, cards: 1 }, high: { ctrl: 1.035, def: 1.005, tire: 1.25, cards: 1.2 } },
    tempo: { slow: { vol: 0.9, ctrl: 1.02 }, normal: { vol: 1, ctrl: 1 }, fast: { vol: 1.12, ctrl: 0.99 } },
  };
  M.TACTIC = TACTIC;

  M.condition = (p) => 0.88 + 0.12 * (p.fitness / 100) + ((p.morale - 50) / 50) * 0.025 + ((p.form || 6.5) - 6.5) * 0.012;

  M.strength = function (side) {
    const lines = { GK: [], DEF: [], MID: [], ATT: [] };
    side.slots.forEach((pos, i) => {
      const p = side.xi[i];
      const line = PL.POSITIONS[pos].line;
      lines[line].push(p ? p.ovr * PL.fit(p, pos) * M.condition(p) : 25);
    });
    const avg = (a, fb) => (a.length ? U.avg(a) : fb);
    const MID = avg(lines.MID, 50);
    const GK = avg(lines.GK, 25);
    const DEF = avg(lines.DEF, MID);
    const ATT = avg(lines.ATT, MID);
    const t = side.tactics || MCM.lineup.defaultTactics();
    const men = TACTIC.mentality[t.mentality] || TACTIC.mentality.bal;
    const pr = TACTIC.pressing[t.pressing] || TACTIC.pressing.mid;
    const te = TACTIC.tempo[t.tempo] || TACTIC.tempo.normal;
    return {
      attack: (0.55 * ATT + 0.35 * MID + 0.1 * DEF) * men.att,
      defense: (0.5 * DEF + 0.25 * MID + 0.25 * GK) * men.def * pr.def,
      control: (0.7 * MID + 0.15 * DEF + 0.15 * ATT) * pr.ctrl * te.ctrl,
      volume: te.vol,
      tire: pr.tire,
      cards: pr.cards,
      lines: { GK, DEF, MID, ATT },
    };
  };

  function shooterWeight(p, pos) {
    const line = PL.POSITIONS[pos].line;
    let w = line === 'ATT' ? 4.2 : pos === 'MCO' ? 3 : line === 'MID' ? 2 : pos === 'DFC' ? 0.8 : line === 'DEF' ? 0.6 : 0.01;
    if (pos === 'DC') w = 5;
    const sho = p.attrs.sho != null ? p.attrs.sho : 20;
    return w * Math.pow(sho / 70, 1.5);
  }
  function assistWeight(p, pos) {
    const line = PL.POSITIONS[pos].line;
    let w = pos === 'MCO' ? 3.6 : line === 'MID' ? 2.8 : line === 'ATT' ? 2.6 : pos === 'LD' || pos === 'LI' ? 1.8 : pos === 'DFC' ? 0.5 : 0.05;
    const pas = p.attrs.pas != null ? p.attrs.pas : p.attrs.kic || 30;
    return w * Math.pow(pas / 70, 2);
  }
  function cardWeight(p, pos) {
    const line = PL.POSITIONS[pos].line;
    const base = line === 'DEF' ? 3 : pos === 'MCD' ? 3.4 : line === 'MID' ? 2 : line === 'ATT' ? 1.3 : 0.3;
    const def = p.attrs.def != null ? p.attrs.def : 40;
    return base * (1.2 - def / 200);
  }

  /*
   * Motor con estado: permite jugar por tramos (en directo), hacer cambios y ajustar la táctica en el descanso.
   * side = { club, slots:[pos], xi:[player], bench:[player], tactics, takers? }
   * opts = { knockout: bool, prior: [golesIdaLocal, golesIdaVisitante] (del punto de vista de este partido), neutral: bool }
   * No modifica el estado de los jugadores: devuelve un resultado que aplica la carrera.
   */
  const SEG = 18;
  M.SEG = SEG;

  M.create = function (home, away, rng, opts) {
    opts = opts || {};
    const sides = [home, away];
    const day = sides.map(() => U.clamp(rng.normal(1, 0.035), 0.92, 1.08));
    const st = {
      sides, rng, opts, day,
      on: sides.map((s) => s.slots.map((pos, i) => (s.xi[i] ? { p: s.xi[i], pos, minIn: 0 } : null)).filter(Boolean)),
      bench: sides.map((s) => (s.bench || []).slice()),
      tactics: sides.map((s) => Object.assign({}, s.tactics || MCM.lineup.defaultTactics())),
      minutes: {}, goalsBy: {}, assistsBy: {}, cardsBy: {}, subsUsed: [0, 0], reds: [0, 0], yellows: [0, 0],
      shots: [0, 0], sot: [0, 0], xg: [0, 0], score: [0, 0], events: [], injuries: [], ownersOff: new Set(),
      seg: 0, possSum: [0, 0], possN: 0, et: false, pens: null, done: false,
    };
    recompute(st);
    return st;
  };

  // Fuerza actual a partir de quién está en el campo (cambios, lesiones y expulsiones incluidas).
  function recompute(st) {
    st.str = [0, 1].map((i) => {
      const lines = { GK: [], DEF: [], MID: [], ATT: [] };
      st.on[i].forEach((e) => { lines[PL.POSITIONS[e.pos].line].push(e.p.ovr * PL.fit(e.p, e.pos) * M.condition(e.p)); });
      const avg = (a, fb) => (a.length ? U.avg(a) : fb);
      const MID = avg(lines.MID, 50);
      const GK = avg(lines.GK, 30);
      const DEF = avg(lines.DEF, MID * 0.9);
      const ATT = avg(lines.ATT, MID * 0.95);
      const t = st.tactics[i];
      const men = TACTIC.mentality[t.mentality] || TACTIC.mentality.bal;
      const pr = TACTIC.pressing[t.pressing] || TACTIC.pressing.mid;
      const te = TACTIC.tempo[t.tempo] || TACTIC.tempo.normal;
      const d = st.day[i] * (st.sides[i].takers && st.sides[i].takers.captain && st.on[i].some((e) => e.p.id === st.sides[i].takers.captain) ? 1.006 : 1);
      const homeF = i === 0 && !st.opts.neutral;
      return {
        attack: (0.55 * ATT + 0.35 * MID + 0.1 * DEF) * men.att * (homeF ? 1.035 : 1) * d,
        defense: (0.5 * DEF + 0.25 * MID + 0.25 * GK) * men.def * pr.def * (1 + (d - 1) * 0.6),
        control: (0.7 * MID + 0.15 * DEF + 0.15 * ATT) * pr.ctrl * te.ctrl * (homeF ? 1.03 : 1) * d,
        volume: te.vol, tire: pr.tire, cards: pr.cards,
      };
    });
    const s0 = st.str[0];
    const s1 = st.str[1];
    const possH = U.clamp(50 + (s0.control - s1.control) * 1.6, 28, 72);
    st.poss = [possH, 100 - possH];
    const volume = 11 * (s0.volume + s1.volume) / 2;
    const ratio = [s0.attack / s1.defense, s1.attack / s0.defense];
    st.expShots = [0, 1].map((i) => Math.min(30, volume * Math.pow(st.poss[i] / 50, 0.7) * Math.pow(ratio[i], 1.8)));
    st.xgShot = [0, 1].map((i) => U.clamp(0.095 * Math.pow(ratio[i], 1.4), 0.035, 0.26));
  }
  M.recompute = recompute;

  function leave(st, sideIdx, entry, minute) {
    st.minutes[entry.p.id] = (st.minutes[entry.p.id] || 0) + (minute - entry.minIn);
    st.on[sideIdx] = st.on[sideIdx].filter((e) => e !== entry);
    st.ownersOff.add(entry.p.id);
  }
  function maxSubs(st) { return st.et ? 6 : 5; }
  function substitute(st, sideIdx, entry, minute, reason, inP) {
    if (st.subsUsed[sideIdx] >= maxSubs(st)) { leave(st, sideIdx, entry, minute); return null; }
    if (!inP) {
      const cands = st.bench[sideIdx].filter((b) => !st.ownersOff.has(b.id));
      if (!cands.length) { leave(st, sideIdx, entry, minute); return null; }
      cands.sort((a, b) => MCM.lineup.slotScore(b, entry.pos) - MCM.lineup.slotScore(a, entry.pos));
      inP = cands[0];
    }
    st.bench[sideIdx] = st.bench[sideIdx].filter((b) => b !== inP);
    leave(st, sideIdx, entry, minute);
    st.on[sideIdx].push({ p: inP, pos: entry.pos, minIn: minute });
    st.subsUsed[sideIdx]++;
    st.events.push({ min: minute, type: 'sub', side: sideIdx, pid: inP.id, outId: entry.p.id, reason });
    recompute(st);
    return inP;
  }

  function scoreGoal(st, s, shooter, minute, pen) {
    st.score[s]++;
    st.sot[s]++;
    st.goalsBy[shooter.p.id] = (st.goalsBy[shooter.p.id] || 0) + 1;
    let aid = null;
    if (!pen && st.rng.chance(0.74)) {
      const others = st.on[s].filter((e) => e !== shooter);
      const a = others.length ? st.rng.weighted(others, (e) => assistWeight(e.p, e.pos)) : null;
      if (a) { aid = a.p.id; st.assistsBy[aid] = (st.assistsBy[aid] || 0) + 1; }
    }
    st.events.push({ min: minute, type: 'goal', side: s, pid: shooter.p.id, aid, pen: !!pen });
  }

  function penaltyTaker(st, s) {
    const side = st.sides[s];
    const want = side.takers && side.takers.pen;
    const named = want && st.on[s].find((e) => e.p.id === want);
    return named || st.on[s].slice().sort((a, b) => (b.p.attrs.sho || 0) - (a.p.attrs.sho || 0))[0];
  }
  function gkOf(st, s) { return st.on[s].find((e) => e.pos === 'POR') || null; }
  function penProb(taker, gk) {
    const sho = taker.p.attrs.sho || 50;
    const ref = gk ? (gk.p.attrs.ref || gk.p.attrs.div || 60) : 40;
    return U.clamp(0.76 + (sho - 75) / 220 - (ref - 75) / 300, 0.55, 0.92);
  }

  function playSeg(st, seg, m0, rate) {
    const rng = st.rng;
    const last = seg === SEG - 1 || seg === SEG + 5;
    for (let s = 0; s < 2; s++) {
      const o = 1 - s;
      if (!st.on[s].length) continue;
      const str = st.str[s];
      const redFactor = Math.pow(0.78, st.reds[s]) * Math.pow(1.18, st.reds[o]);
      // Ocasiones
      const n = rng.poisson((st.expShots[s] / SEG) * redFactor * rate);
      for (let k = 0; k < n; k++) {
        const minute = m0 + rng.int(1, 5) + (last && rng.chance(0.3) ? rng.int(1, 4) : 0);
        const shooter = rng.weighted(st.on[s], (e) => shooterWeight(e.p, e.pos));
        if (!shooter) continue;
        st.shots[s]++;
        const q = st.xgShot[s] * U.clamp((shooter.p.attrs.sho || 40) / 72, 0.55, 1.35) * rng.range(0.55, 1.45);
        st.xg[s] += q;
        if (rng.chance(q)) scoreGoal(st, s, shooter, minute, false);
        else if (rng.chance(0.3)) st.sot[s]++;
      }
      // Penaltis
      if (rng.chance(0.0085 * rate * Math.min(1.4, st.expShots[s] / 11))) {
        const minute = m0 + rng.int(1, 5);
        const taker = penaltyTaker(st, s);
        if (taker) {
          st.shots[s]++;
          st.xg[s] += 0.76;
          if (rng.chance(penProb(taker, gkOf(st, o)))) scoreGoal(st, s, taker, minute, true);
          else st.events.push({ min: minute, type: 'penmiss', side: s, pid: taker.p.id });
        }
      }
      // Tarjetas
      const ny = rng.poisson((1.85 * str.cards * rate) / SEG);
      for (let k = 0; k < ny; k++) {
        const e = rng.weighted(st.on[s], (x) => cardWeight(x.p, x.pos));
        if (!e) continue;
        const minute = m0 + rng.int(1, 5);
        const prev = st.cardsBy[e.p.id] || 0;
        if (prev === 1) {
          st.cardsBy[e.p.id] = 2; st.yellows[s]++; st.reds[s]++;
          st.events.push({ min: minute, type: 'red', side: s, pid: e.p.id, second: true });
          leave(st, s, e, minute); recompute(st);
        } else {
          st.cardsBy[e.p.id] = 1; st.yellows[s]++;
          st.events.push({ min: minute, type: 'yellow', side: s, pid: e.p.id });
        }
      }
      if (rng.chance((0.032 / SEG) * str.cards * rate)) {
        const e = rng.weighted(st.on[s], (x) => cardWeight(x.p, x.pos));
        if (e) {
          const minute = m0 + rng.int(1, 5);
          st.cardsBy[e.p.id] = 3; st.reds[s]++;
          st.events.push({ min: minute, type: 'red', side: s, pid: e.p.id, second: false });
          leave(st, s, e, minute); recompute(st);
        }
      }
      // Lesiones
      st.on[s].slice().forEach((e) => {
        const risk = (0.0105 / SEG) * rate * (1 + Math.max(0, 75 - e.p.fitness) / 25) * (e.p.age >= 31 ? 1.25 : 1) * (st.sides[s].injuryFactor || 1);
        if (rng.chance(risk)) {
          const minute = m0 + rng.int(1, 5);
          const sev = rng.next();
          const weeks = sev < 0.55 ? rng.int(1, 2) : sev < 0.85 ? rng.int(3, 5) : sev < 0.97 ? rng.int(6, 10) : rng.int(12, 26);
          st.injuries.push({ pid: e.p.id, side: s, weeks, minute });
          st.events.push({ min: minute, type: 'injury', side: s, pid: e.p.id, weeks });
          substitute(st, s, e, minute, 'injury');
        }
      });
      // Cambios por cansancio (entre el 60 y el 80, y en la prórroga)
      const autoOk = !(st.sides[s].manual && st.sides[s].manual.noAutoSubs);
      if (autoOk && ((seg >= 12 && seg <= 16) || seg >= SEG + 1) && st.subsUsed[s] < maxSubs(st)) {
        const tiredness = (e) => e.p.fitness - (m0 - e.minIn) * 0.2 * str.tire;
        const cand = st.on[s].filter((e) => e.minIn === 0 && e.pos !== 'POR').sort((a, b) => tiredness(a) - tiredness(b))[0];
        if (cand && (tiredness(cand) < 62 || (seg >= 14 && rng.chance(0.45)))) {
          const best = st.bench[s].filter((b) => !st.ownersOff.has(b.id) && b.pos !== 'POR')
            .sort((a, b) => MCM.lineup.slotScore(b, cand.pos) - MCM.lineup.slotScore(a, cand.pos))[0];
          if (best && MCM.lineup.slotScore(best, cand.pos) >= MCM.lineup.slotScore(cand.p, cand.pos) * 0.86) substitute(st, s, cand, m0 + rng.int(1, 5), 'tactical');
        }
      }
    }
    st.possSum[0] += st.poss[0]; st.possN++;
  }

  /* Juega hasta el tramo indicado (9 = descanso, 18 = final de los 90). */
  M.playUntil = function (st, segEnd) {
    while (st.seg < Math.min(segEnd, SEG)) { playSeg(st, st.seg, st.seg * 5, 1); st.seg++; }
    st.events.sort((a, b) => a.min - b.min);
    return st;
  };
  M.minute = (st) => Math.min(st.seg, SEG) * 5 + (st.et ? 30 : 0);

  /* Cambio manual: sale outId y entra inId (del banquillo). */
  M.manualSub = function (st, sideIdx, outId, inId) {
    const entry = st.on[sideIdx].find((e) => e.p.id === outId);
    const inP = st.bench[sideIdx].find((b) => b.id === inId && !st.ownersOff.has(b.id));
    if (!entry || !inP) return 'Cambio no válido.';
    if (st.subsUsed[sideIdx] >= maxSubs(st)) return 'Ya has hecho los ' + maxSubs(st) + ' cambios permitidos.';
    substitute(st, sideIdx, entry, M.minute(st), 'manual', inP);
    return null;
  };
  M.setTactics = function (st, sideIdx, tactics) {
    Object.assign(st.tactics[sideIdx], tactics);
    recompute(st);
  };

  function knockoutTied(st) {
    const prior = st.opts.prior || [0, 0];
    return st.score[0] + prior[0] === st.score[1] + prior[1];
  }

  function shootout(st) {
    const rng = st.rng;
    const takers = [0, 1].map((s) => st.on[s].slice().sort((a, b) => (b.p.attrs.sho || 0) - (a.p.attrs.sho || 0)));
    const gk = [gkOf(st, 0), gkOf(st, 1)];
    const goals = [0, 0];
    const kicks = [[], []];
    for (let r = 0; r < 30; r++) {
      for (let s = 0; s < 2; s++) {
        const list = takers[s];
        if (!list.length) { kicks[s].push(false); continue; }
        const t = list[r % list.length];
        const ok = rng.chance(penProb(t, gk[1 - s]) - 0.04);
        if (ok) goals[s]++;
        kicks[s].push({ pid: t.p.id, ok });
      }
      const n = r + 1;
      if (n <= 5) {
        const left = 5 - n;
        if (goals[0] > goals[1] + left || goals[1] > goals[0] + left) break;
      } else if (goals[0] !== goals[1]) break;
    }
    st.pens = goals;
    st.penKicks = kicks;
    st.events.push({ min: 121, type: 'shootout', side: goals[0] > goals[1] ? 0 : 1, score: goals.slice() });
  }

  /* Termina el partido (prórroga y penaltis si es eliminatoria y hay empate) y devuelve el resultado. */
  M.finish = function (st) {
    M.playUntil(st, SEG);
    if (st.opts.knockout && knockoutTied(st)) {
      st.et = true;
      for (let k = 0; k < 6; k++) playSeg(st, SEG + k, 90 + k * 5, 0.85);
      st.events.sort((a, b) => a.min - b.min);
      if (knockoutTied(st) && !st.opts.noShootout) shootout(st);
    }
    const end = st.et ? 120 : 90;
    st.on.forEach((list) => list.forEach((e) => { st.minutes[e.p.id] = (st.minutes[e.p.id] || 0) + (end - e.minIn); }));
    st.on.forEach((list) => list.forEach((e) => { e.minIn = end; }));
    st.done = true;
    return result(st);
  };

  function result(st) {
    const rng = st.rng;
    const ratings = {};
    const sides = st.sides;
    const avgOvr = sides.map((s) => U.avg(s.xi.filter(Boolean).map((p) => p.ovr)));
    const posOf = {};
    sides.forEach((s, si) => {
      s.slots.forEach((pos, i) => { if (s.xi[i]) posOf[s.xi[i].id] = pos; });
      st.events.filter((e) => e.type === 'sub' && e.side === si).forEach((e) => { posOf[e.pid] = posOf[e.outId] || null; });
    });
    sides.forEach((s, si) => {
      const res = st.score[si] > st.score[1 - si] ? 1 : st.score[si] < st.score[1 - si] ? -1 : 0;
      const conceded = st.score[1 - si];
      s.xi.filter(Boolean).concat(s.bench || []).forEach((p) => {
        const mins = st.minutes[p.id];
        if (!mins) return;
        const pos = posOf[p.id] || p.pos;
        const line = PL.POSITIONS[pos] ? PL.POSITIONS[pos].line : 'MID';
        let r = 6.3 + res * 0.35 + (p.ovr - avgOvr[si]) * 0.03 + rng.normal(0, 0.38);
        r += (st.goalsBy[p.id] || 0) * 1.0 + (st.assistsBy[p.id] || 0) * 0.6;
        if (line === 'GK') r += (st.sot[1 - si] - conceded) * 0.18 - conceded * 0.35 + (conceded === 0 ? 0.6 : 0);
        if (line === 'DEF') r += conceded === 0 ? 0.5 : -conceded * 0.15;
        const c = st.cardsBy[p.id] || 0;
        if (c === 1) r -= 0.3;
        if (c >= 2) r -= 1.5;
        if (st.events.some((e) => e.type === 'penmiss' && e.pid === p.id)) r -= 0.6;
        if (mins < 30) r = 6 + (r - 6) * 0.5;
        ratings[p.id] = Math.round(U.clamp(r, 3, 10) * 10) / 10;
      });
    });
    let motm = null;
    Object.keys(ratings).forEach((id) => { if (!motm || ratings[id] > ratings[motm]) motm = id; });
    const possH = st.possN ? Math.round(st.possSum[0] / st.possN) : 50;
    let winner = null;
    if (st.opts.knockout) {
      const prior = st.opts.prior || [0, 0];
      const a = st.score[0] + prior[0];
      const b = st.score[1] + prior[1];
      winner = a > b ? 0 : b > a ? 1 : st.pens ? (st.pens[0] > st.pens[1] ? 0 : 1) : null;
    }
    return {
      hg: st.score[0], ag: st.score[1], events: st.events, injuries: st.injuries, ratings, minutes: st.minutes, motm,
      cards: st.cardsBy, goalsBy: st.goalsBy, assistsBy: st.assistsBy, et: st.et, pens: st.pens, penKicks: st.penKicks || null, winner,
      stats: {
        poss: [possH, 100 - possH], shots: st.shots, sot: st.sot,
        xg: st.xg.map((x) => Math.round(x * 100) / 100), yellows: st.yellows, reds: st.reds,
        corners: [rng.poisson(2 + st.shots[0] * 0.28), rng.poisson(2 + st.shots[1] * 0.28)],
        fouls: [rng.poisson(11 * st.str[0].cards), rng.poisson(11 * st.str[1].cards)],
      },
    };
  }

  /* Simulación directa (sin pausas). */
  M.simulate = function (home, away, rng, opts) {
    const st = M.create(home, away, rng, opts);
    return M.finish(st);
  };

  /* Crónica breve a partir de lo que ha ocurrido realmente. */
  M.summary = function (res, homeName, awayName, nameOf, rng) {
    const parts = [];
    const diff = res.hg - res.ag;
    const winner = diff > 0 ? homeName : awayName;
    const loser = diff > 0 ? awayName : homeName;
    const score = Math.max(res.hg, res.ag) + '-' + Math.min(res.hg, res.ag);
    if (diff === 0 && res.winner != null) parts.push((res.pens ? 'Tras ' + res.hg + '-' + res.ag + ', se decidió en los penaltis (' + res.pens[0] + '-' + res.pens[1] + '): ' : 'Empate ' + res.hg + '-' + res.ag + ' que da el pase a ') + (res.winner === 0 ? homeName : awayName) + (res.pens ? ' pasa de ronda.' : '.'));
    else if (diff === 0) parts.push(res.hg === 0 ? 'Empate sin goles entre ' + homeName + ' y ' + awayName + '.' : 'Reparto de puntos (' + res.hg + '-' + res.ag + ') entre ' + homeName + ' y ' + awayName + '.');
    else if (Math.abs(diff) >= 3) parts.push(winner + ' goleó ' + score + ' a ' + loser + '.');
    else parts.push(rng.pick(['Victoria de ', 'Triunfo de ']) + winner + ' por ' + score + ' ante ' + loser + '.');

    const goals = res.events.filter((e) => e.type === 'goal');
    const top = Object.keys(res.goalsBy).sort((a, b) => res.goalsBy[b] - res.goalsBy[a])[0];
    if (top && res.goalsBy[top] >= 3) parts.push(nameOf(top) + ' firmó un hat-trick.');
    else if (top && res.goalsBy[top] === 2) parts.push(nameOf(top) + ' marcó un doblete.');
    const last = goals[goals.length - 1];
    if (last && last.min >= 85 && Math.abs(diff) <= 1) parts.push('El último gol llegó en el minuto ' + last.min + '.');
    const p = res.stats.poss;
    if (p[0] >= 60 || p[1] >= 60) {
      const dom = p[0] >= 60 ? homeName : awayName;
      parts.push(dom + ' dominó la posesión (' + Math.max(p[0], p[1]) + '%).');
    }
    if (res.et && !res.pens && diff !== 0) parts.push('Hizo falta la prórroga.');
    const miss = res.events.filter((e) => e.type === 'penmiss');
    if (miss.length) parts.push(miss.map((e) => nameOf(e.pid)).join(' y ') + ' falló un penalti.');
    const reds = res.events.filter((e) => e.type === 'red');
    if (reds.length) parts.push('Expulsión de ' + reds.map((e) => nameOf(e.pid)).join(' y ') + '.');
    res.injuries.forEach((inj) => parts.push(nameOf(inj.pid) + ' se retiró lesionado (' + inj.weeks + ' sem.).'));
    if (res.motm) parts.push('Mejor jugador: ' + nameOf(res.motm) + ' (' + res.ratings[res.motm].toFixed(1) + ').');
    return parts.join(' ');
  };
})(globalThis.MCM = globalThis.MCM || {});
