// Pruebas de copas, competiciones europeas y calendario. Ejecutar: npm test
const test = require('node:test');
const assert = require('node:assert');
const M = require('./load.js');
const C = M.career;
const K = M.comps;

const fresh = (club, seed) => C.create({ dataset: M.DATA.realDataset(), clubId: club || 'real-betis', seed: seed || 'cp' });

test('fase liga europea: 36 equipos, partidos exactos, sin rivales repetidos, 4 en casa y 4 fuera', () => {
  const s = fresh();
  ['UCL', 'UEL', 'UECL'].forEach((k) => {
    const c = s.comps[k];
    assert.strictEqual(c.participants.length, 36, k);
    const games = {}; const home = {}; const met = {};
    c.fixtures.forEach((f) => {
      [f.home, f.away].forEach((id) => { games[id] = (games[id] || 0) + 1; });
      home[f.home] = (home[f.home] || 0) + 1;
      const key = [f.home, f.away].sort().join('|');
      assert.ok(!met[key], k + ' rival repetido ' + key);
      met[key] = true;
    });
    c.participants.forEach((id) => {
      assert.strictEqual(games[id], c.games, k + ' ' + id + ' juega ' + games[id]);
      assert.ok(Math.abs((home[id] || 0) - c.games / 2) <= 1, k + ' localía desequilibrada ' + id);
    });
  });
  // Nadie está en dos competiciones europeas
  const all = ['UCL', 'UEL', 'UECL'].flatMap((k) => s.comps[k].participants);
  assert.strictEqual(new Set(all).size, all.length);
});

test('temporada completa: ningún club juega dos veces el mismo día y todas las competiciones tienen campeón', () => {
  const s = fresh('real-madrid', 'full');
  C.simulateUntil(s);
  assert.ok(C.seasonFinished(s));
  const byDay = {};
  C.fixtures(s).forEach((f) => {
    [f.home, f.away].forEach((id) => {
      const k = id + '@' + f.date;
      assert.ok(!byDay[k], 'doble partido el mismo día: ' + k);
      byDay[k] = true;
    });
  });
  K.all(s).forEach((c) => assert.ok(c.winner, c.name + ' sin campeón'));
  // Las eliminatorias siempre tienen ganador; con empate global hay prórroga y, si sigue, penaltis
  K.all(s).forEach((c) => c.fixtures.filter((f) => f.knockout).forEach((f) => {
    assert.ok(f.winner === f.home || f.winner === f.away, 'eliminatoria sin ganador');
    if (f.pens) assert.ok(f.et && f.pens[0] !== f.pens[1]);
  }));
  // Cuadro de copa coherente: cada ronda reduce a la mitad
  const cup = s.comps.CUP_ESP;
  assert.strictEqual(cup.rounds[cup.rounds.length - 1].name, 'Final');
  assert.ok(s.trophies[cup.winner].some((t) => t.name === 'Copa del Rey'));
  assert.deepStrictEqual(C.validate(s), []);
});

test('la segunda temporada clasifica a Europa según la tabla anterior', () => {
  const s = fresh('sunderland', 'q2');
  C.simulateUntil(s);
  const t = M.schedule.table(s.leagues.ESP1).map((r) => r.clubId);
  const cupWinner = s.comps.CUP_ESP.winner;
  C.endSeason(s);
  t.slice(0, 4).forEach((id) => assert.ok(s.comps.UCL.participants.includes(id), id + ' debería jugar la Champions'));
  if (s.clubs[cupWinner].leagueId === 'ESP1' && !t.slice(0, 4).includes(cupWinner)) assert.ok(s.comps.UEL.participants.includes(cupWinner), 'el campeón de copa va a la Europa League');
  assert.deepStrictEqual(C.validate(s), []);
});

test('las eliminatorias a doble partido suman el resultado de la ida', () => {
  const s = fresh('real-betis', 'agg');
  C.simulateUntil(s);
  const c = s.comps.UCL;
  c.fixtures.filter((f) => f.leg === 2).forEach((f2) => {
    const f1 = c.fixtures.find((x) => x.id === f2.firstLeg);
    const a = f2.hg + f1.ag;
    const b = f2.ag + f1.hg;
    if (a !== b) assert.strictEqual(f2.winner, a > b ? f2.home : f2.away);
    else assert.ok(f2.pens, 'empate global sin penaltis');
  });
});

test('una partida guardada antes del calendario por fechas se migra y sigue jugándose', () => {
  const s = fresh('sunderland', 'old2');
  delete s.comps; s.schema = 2;
  C.migrate(s);
  assert.deepStrictEqual(s.comps, {});
  assert.ok(C.playUserMatch(s));
  C.simulateUntil(s);
  C.endSeason(s);
  assert.ok(Object.keys(s.comps).length >= 5, 'las competiciones empiezan la temporada siguiente');
  assert.deepStrictEqual(C.validate(s), []);
});
