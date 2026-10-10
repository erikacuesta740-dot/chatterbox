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
   * side = { club, slots:[pos], xi:[player], bench:[player], tactics }
   * Devuelve resultado detallado; NO modifica el estado de los jugadores.
   */
  M.simulate = function (home, away, rng) {
    const sides = [home, away];
    const st = sides.map(M.strength);
    // Ventaja de jugar en casa
    st[0].attack *= 1.035;
    st[0].control *= 1.03;
    // Día bueno o malo (azar acotado)
    st.forEach((s) => {
      const day = U.clamp(rng.normal(1, 0.035), 0.92, 1.08);
      s.attack *= day; s.defense *= (1 + (day - 1) * 0.6); s.control *= day;
    });

    const possH = U.clamp(50 + (st[0].control - st[1].control) * 1.6, 28, 72);
    const poss = [possH, 100 - possH];
    const volume = 11.5 * (st[0].volume + st[1].volume) / 2;
    const ratio = [st[0].attack / st[1].defense, st[1].attack / st[0].defense];
    const expShots = [0, 1].map((i) => Math.min(30, volume * Math.pow(poss[i] / 50, 0.7) * Math.pow(ratio[i], 1.8)));
    const xgShot = [0, 1].map((i) => U.clamp(0.095 * Math.pow(ratio[i], 1.4), 0.035, 0.26));

    // Estado en el campo
    const on = sides.map((s) => s.slots.map((pos, i) => (s.xi[i] ? { p: s.xi[i], pos, minIn: 0 } : null)).filter(Boolean));
    const bench = sides.map((s) => (s.bench || []).slice());
    const minutes = {};
    const goalsBy = {};
    const assistsBy = {};
    const cardsBy = {};
    const subsUsed = [0, 0];
    const reds = [0, 0];
    const yellows = [0, 0];
    const shots = [0, 0];
    const sot = [0, 0];
    const xg = [0, 0];
    const score = [0, 0];
    const events = [];
    const injuries = [];
    const ownersOff = new Set();

    function leave(sideIdx, entry, minute) {
      minutes[entry.p.id] = (minutes[entry.p.id] || 0) + (minute - entry.minIn);
      on[sideIdx] = on[sideIdx].filter((e) => e !== entry);
      ownersOff.add(entry.p.id);
    }
    function substitute(sideIdx, entry, minute, reason) {
      if (subsUsed[sideIdx] >= 5) { leave(sideIdx, entry, minute); return null; }
      const cands = bench[sideIdx].filter((b) => !ownersOff.has(b.id));
      if (!cands.length) { leave(sideIdx, entry, minute); return null; }
      cands.sort((a, b) => MCM.lineup.slotScore(b, entry.pos) - MCM.lineup.slotScore(a, entry.pos));
      const inP = cands[0];
      bench[sideIdx] = bench[sideIdx].filter((b) => b !== inP);
      leave(sideIdx, entry, minute);
      on[sideIdx].push({ p: inP, pos: entry.pos, minIn: minute });
      subsUsed[sideIdx]++;
      events.push({ min: minute, type: 'sub', side: sideIdx, pid: inP.id, outId: entry.p.id, reason });
      return inP;
    }

    const SEG = 18;
    for (let seg = 0; seg < SEG; seg++) {
      const m0 = seg * 5;
      for (let s = 0; s < 2; s++) {
        const o = 1 - s;
        if (!on[s].length) continue;
        const redFactor = Math.pow(0.78, reds[s]) * Math.pow(1.18, reds[o]);
        // Ocasiones
        const n = rng.poisson((expShots[s] / SEG) * redFactor);
        for (let k = 0; k < n; k++) {
          const minute = m0 + rng.int(1, 5) + (seg === SEG - 1 && rng.chance(0.3) ? rng.int(1, 4) : 0);
          const shooter = rng.weighted(on[s], (e) => shooterWeight(e.p, e.pos));
          if (!shooter) continue;
          shots[s]++;
          const q = xgShot[s] * U.clamp((shooter.p.attrs.sho || 40) / 72, 0.55, 1.35) * rng.range(0.55, 1.45);
          xg[s] += q;
          if (rng.chance(q)) {
            score[s]++;
            sot[s]++;
            goalsBy[shooter.p.id] = (goalsBy[shooter.p.id] || 0) + 1;
            let aid = null;
            if (rng.chance(0.74)) {
              const others = on[s].filter((e) => e !== shooter);
              const a = others.length ? rng.weighted(others, (e) => assistWeight(e.p, e.pos)) : null;
              if (a) { aid = a.p.id; assistsBy[aid] = (assistsBy[aid] || 0) + 1; }
            }
            events.push({ min: minute, type: 'goal', side: s, pid: shooter.p.id, aid });
          } else if (rng.chance(0.3)) {
            sot[s]++;
          }
        }
        // Tarjetas
        const yRate = (1.85 * st[s].cards) / SEG;
        const ny = rng.poisson(yRate);
        for (let k = 0; k < ny; k++) {
          const e = rng.weighted(on[s], (x) => cardWeight(x.p, x.pos));
          if (!e) continue;
          const minute = m0 + rng.int(1, 5);
          const prev = cardsBy[e.p.id] || 0;
          if (prev === 1) {
            cardsBy[e.p.id] = 2;
            yellows[s]++;
            reds[s]++;
            events.push({ min: minute, type: 'red', side: s, pid: e.p.id, second: true });
            leave(s, e, minute);
          } else {
            cardsBy[e.p.id] = 1;
            yellows[s]++;
            events.push({ min: minute, type: 'yellow', side: s, pid: e.p.id });
          }
        }
        if (rng.chance(0.032 / SEG * st[s].cards)) {
          const e = rng.weighted(on[s], (x) => cardWeight(x.p, x.pos));
          if (e) {
            const minute = m0 + rng.int(1, 5);
            cardsBy[e.p.id] = 3;
            reds[s]++;
            events.push({ min: minute, type: 'red', side: s, pid: e.p.id, second: false });
            leave(s, e, minute);
          }
        }
        // Lesiones
        on[s].slice().forEach((e) => {
          const risk = 0.0105 / SEG * (1 + Math.max(0, 75 - e.p.fitness) / 25) * (e.p.age >= 31 ? 1.25 : 1);
          if (rng.chance(risk)) {
            const minute = m0 + rng.int(1, 5);
            const sev = rng.next();
            const weeks = sev < 0.55 ? rng.int(1, 2) : sev < 0.85 ? rng.int(3, 5) : sev < 0.97 ? rng.int(6, 10) : rng.int(12, 26);
            injuries.push({ pid: e.p.id, side: s, weeks, minute });
            events.push({ min: minute, type: 'injury', side: s, pid: e.p.id, weeks });
            substitute(s, e, minute, 'injury');
          }
        });
        // Cambios tácticos por cansancio (minutos 60-80)
        if (seg >= 12 && seg <= 16 && subsUsed[s] < 5) {
          const tiredness = (e) => e.p.fitness - (m0 - e.minIn) * 0.2 * st[s].tire;
          const cand = on[s].filter((e) => e.minIn === 0 && e.pos !== 'POR').sort((a, b) => tiredness(a) - tiredness(b))[0];
          if (cand && (tiredness(cand) < 62 || (seg >= 14 && rng.chance(0.45)))) {
            const best = bench[s].filter((b) => !ownersOff.has(b.id) && b.pos !== 'POR')
              .sort((a, b) => MCM.lineup.slotScore(b, cand.pos) - MCM.lineup.slotScore(a, cand.pos))[0];
            if (best && MCM.lineup.slotScore(best, cand.pos) >= MCM.lineup.slotScore(cand.p, cand.pos) * 0.86) {
              substitute(s, cand, m0 + rng.int(1, 5), 'tactical');
            }
          }
        }
      }
    }
    on.forEach((list) => list.forEach((e) => { minutes[e.p.id] = (minutes[e.p.id] || 0) + (90 - e.minIn); }));
    events.sort((a, b) => a.min - b.min);

    // Valoraciones
    const ratings = {};
    const avgOvr = sides.map((s) => U.avg(s.xi.filter(Boolean).map((p) => p.ovr)));
    sides.forEach((s, si) => {
      const res = score[si] > score[1 - si] ? 1 : score[si] < score[1 - si] ? -1 : 0;
      const conceded = score[1 - si];
      const all = s.xi.filter(Boolean).concat(s.bench || []);
      all.forEach((p) => {
        const mins = minutes[p.id];
        if (!mins) return;
        const pos = s.slots[s.xi.indexOf(p)] || p.pos;
        const line = PL.POSITIONS[pos] ? PL.POSITIONS[pos].line : 'MID';
        let r = 6.3 + res * 0.35 + (p.ovr - avgOvr[si]) * 0.03 + rng.normal(0, 0.38);
        r += (goalsBy[p.id] || 0) * 1.0 + (assistsBy[p.id] || 0) * 0.6;
        if (line === 'GK') r += (sot[1 - si] - conceded) * 0.18 - conceded * 0.35 + (conceded === 0 ? 0.6 : 0);
        if (line === 'DEF') r += conceded === 0 ? 0.5 : -conceded * 0.15;
        const c = cardsBy[p.id] || 0;
        if (c === 1) r -= 0.3;
        if (c >= 2) r -= 1.5;
        if (mins < 30) r = 6 + (r - 6) * 0.5;
        ratings[p.id] = Math.round(U.clamp(r, 3, 10) * 10) / 10;
      });
    });
    let motm = null;
    Object.keys(ratings).forEach((id) => { if (!motm || ratings[id] > ratings[motm]) motm = id; });

    return {
      hg: score[0], ag: score[1], events, injuries, ratings, minutes, motm,
      cards: cardsBy, goalsBy, assistsBy,
      stats: {
        poss: [Math.round(poss[0]), 100 - Math.round(poss[0])], shots, sot,
        xg: xg.map((x) => Math.round(x * 100) / 100), yellows, reds,
        corners: [rng.poisson(2 + shots[0] * 0.28), rng.poisson(2 + shots[1] * 0.28)],
        fouls: [rng.poisson(11 * st[0].cards), rng.poisson(11 * st[1].cards)],
      },
      strength: st.map((s) => ({ attack: Math.round(s.attack), defense: Math.round(s.defense), control: Math.round(s.control) })),
    };
  };

  /* Crónica breve a partir de lo que ha ocurrido realmente. */
  M.summary = function (res, homeName, awayName, nameOf, rng) {
    const parts = [];
    const diff = res.hg - res.ag;
    const winner = diff > 0 ? homeName : awayName;
    const loser = diff > 0 ? awayName : homeName;
    const score = Math.max(res.hg, res.ag) + '-' + Math.min(res.hg, res.ag);
    if (diff === 0) parts.push(res.hg === 0 ? 'Empate sin goles entre ' + homeName + ' y ' + awayName + '.' : 'Reparto de puntos (' + res.hg + '-' + res.ag + ') entre ' + homeName + ' y ' + awayName + '.');
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
    const reds = res.events.filter((e) => e.type === 'red');
    if (reds.length) parts.push('Expulsión de ' + reds.map((e) => nameOf(e.pid)).join(' y ') + '.');
    res.injuries.forEach((inj) => parts.push(nameOf(inj.pid) + ' se retiró lesionado (' + inj.weeks + ' sem.).'));
    if (res.motm) parts.push('Mejor jugador: ' + nameOf(res.motm) + ' (' + res.ratings[res.motm].toFixed(1) + ').');
    return parts.join(' ');
  };
})(globalThis.MCM = globalThis.MCM || {});
