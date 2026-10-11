// Pruebas del motor. Ejecutar: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const M = require('./load.js');
const C = M.career;

test('calendario: doble vuelta completa, sin duplicados ni equipos repetidos por jornada', () => {
  const ids = Array.from({ length: 20 }, (_, i) => 'c' + i);
  const { fixtures, totalMd } = M.schedule.roundRobin(ids, M.util.rng(1));
  assert.strictEqual(totalMd, 38);
  assert.strictEqual(fixtures.length, 380);
  const pairs = new Set();
  for (let md = 1; md <= totalMd; md++) {
    const seen = new Set();
    fixtures.filter((f) => f.md === md).forEach((f) => {
      assert.ok(!seen.has(f.home) && !seen.has(f.away), 'equipo repetido en jornada ' + md);
      seen.add(f.home); seen.add(f.away);
      const key = f.home + '>' + f.away;
      assert.ok(!pairs.has(key), 'partido duplicado ' + key);
      pairs.add(key);
    });
    assert.strictEqual(seen.size, 20, 'jornada incompleta ' + md);
  }
  ids.forEach((id) => assert.strictEqual(fixtures.filter((f) => f.home === id).length, 19));
});

test('calendario con número impar de equipos usa descansos', () => {
  const { fixtures, totalMd } = M.schedule.roundRobin(['a', 'b', 'c', 'd', 'e'], M.util.rng(2));
  assert.strictEqual(totalMd, 10);
  assert.strictEqual(fixtures.length, 20);
});

test('simulación coherente: medias de goles y ventaja del favorito', () => {
  const s = C.create({ clubId: 'real-madrid', seed: 't-sim' });
  const side = (id) => {
    const c = s.clubs[id];
    const lu = M.lineup.autoPick(C.squad(s, id), '4-3-3');
    return { club: c, slots: M.lineup.slots('4-3-3'), xi: lu.xi.map((x) => s.players[x]), bench: lu.bench.map((x) => s.players[x]), tactics: c.tactics };
  };
  let goals = 0; let favWins = 0; let favLoss = 0; const N = 400;
  for (let i = 0; i < N; i++) {
    const r = M.match.simulate(side('real-madrid'), side('real-oviedo'), M.util.rng('m' + i));
    goals += r.hg + r.ag;
    if (r.hg > r.ag) favWins++; else if (r.hg < r.ag) favLoss++;
    assert.ok(r.stats.poss[0] + r.stats.poss[1] === 100);
    assert.ok(r.stats.sot[0] <= r.stats.shots[0] && r.hg <= r.stats.sot[0]);
    assert.strictEqual(r.events.filter((e) => e.type === 'goal' && e.side === 0).length, r.hg);
  }
  assert.ok(favWins / N > 0.6, 'el favorito debe ganar la mayoría: ' + favWins);
  assert.ok(favLoss / N < 0.15, 'el débil gana poco: ' + favLoss);
  assert.ok(goals / N > 2 && goals / N < 5, 'goles por partido razonables: ' + goals / N);
});

test('las carreras son independientes entre sí', () => {
  const a = C.create({ clubId: 'sunderland', seed: 'A' });
  const b = C.create({ clubId: 'real-madrid', seed: 'B' });
  C.playMatchday(a);
  C.playMatchday(a);
  assert.strictEqual(C.userLeague(a).played, 2);
  assert.strictEqual(Object.values(b.leagues).reduce((n, L) => n + L.played, 0), 0);
  assert.notStrictEqual(a.id, b.id);
  assert.ok(a.players.p1 !== b.players.p1);
});

test('lesionados y sancionados no se alinean; las sanciones se cumplen', () => {
  const s = C.create({ clubId: 'arsenal', seed: 'inj' });
  const squad = C.squad(s, 'arsenal');
  const best = squad.slice().sort((x, y) => y.ovr - x.ovr);
  best[0].injury = { weeks: 3, type: 'Prueba' };
  best[1].suspension = 1;
  const lu = M.lineup.autoPick(squad, '4-3-3');
  assert.ok(!lu.xi.includes(best[0].id) && !lu.bench.includes(best[0].id));
  assert.ok(!lu.xi.includes(best[1].id));
  // Alineación manual con un lesionado: el sistema avisa y lo sustituye
  s.settings.autoLineup = false;
  const club = s.clubs.arsenal;
  club.lineup = M.lineup.autoPick(squad.map((p) => Object.assign({}, p, { injury: null, suspension: 0 })), '4-3-3');
  const w = M.lineup.warnings(club.lineup, squad);
  assert.ok(w.some((x) => x.level === 'error'));
  C.playMatchday(s);
  const f = C.userLeague(s).fixtures.find((x) => x.md === 1 && (x.home === 'arsenal' || x.away === 'arsenal'));
  const names = f.report.lineups[f.home === 'arsenal' ? 0 : 1].xi.map((x) => x.name);
  assert.ok(!names.includes(best[0].name), 'el lesionado no juega');
  assert.ok(!names.includes(best[1].name), 'el sancionado no juega');
  assert.strictEqual(best[1].suspension, 0, 'la sanción se cumple');
  assert.ok(f.report.notices.length >= 2);
});

test('tres temporadas completas mantienen la integridad de los datos', () => {
  const s = C.create({ clubId: 'sunderland', seed: 'long' });
  for (let season = 0; season < 3; season++) {
    while (!C.seasonFinished(s)) C.playMatchday(s);
    Object.values(s.leagues).forEach((L) => assert.ok(L.fixtures.every((f) => f.played), 'quedan partidos sin jugar en ' + L.id));
    const h = C.endSeason(s);
    assert.ok(h.pos >= 1);
    assert.deepStrictEqual(C.validate(s), []);
    Object.values(s.clubs).forEach((c) => assert.ok(c.squad.length >= 19, c.id + ' con plantilla corta: ' + c.squad.length));
    assert.strictEqual(s.leagues.ESP1.clubIds.length, 20);
    assert.strictEqual(s.leagues.ESP2.clubIds.length, 22);
    assert.strictEqual(s.leagues.ENG1.clubIds.length, 20);
    assert.strictEqual(s.leagues.ENG2.clubIds.length, 24);
  }
  assert.strictEqual(s.history.length, 3);
  assert.strictEqual(s.season.label, '2029/30');
  // El filial nunca coincide con su primer equipo en la misma liga
  const rsb = s.clubs['real-sociedad-b'];
  assert.ok(!(rsb.leagueId === s.clubs['real-sociedad'].leagueId));
});

test('progresión de jugadores: jóvenes con potencial mejoran más que veteranos', () => {
  const rng = M.util.rng('dev');
  let young = 0; let old = 0;
  for (let i = 0; i < 300; i++) {
    const y = { ovr: 62, pot: 82, age: 19, attrs: { a: 60 } };
    const o = { ovr: 80, pot: 80, age: 33, attrs: { a: 80 } };
    young += M.players.developSeason(y, rng, 0.7);
    old += M.players.developSeason(o, rng, 0.7);
    assert.ok(y.ovr <= 82, 'nunca supera el potencial');
  }
  assert.ok(young / 300 > 2, 'jóvenes progresan: ' + young / 300);
  assert.ok(old / 300 < -1, 'veteranos declinan: ' + old / 300);
});

test('plantillas reales (no verificadas): todas las ligas, sin duplicados y marcadas', () => {
  const ds = M.DATA.realDataset();
  assert.deepStrictEqual(M.generator.validateDataset(ds), []);
  const s = C.create({ dataset: ds, clubId: 'real-madrid', seed: 'real' });
  assert.deepStrictEqual(C.validate(s), []);
  const real = Object.values(s.players).filter((p) => p.src === 'knowledge');
  assert.ok(real.length > 4500, 'jugadores reales: ' + real.length);
  real.forEach((p) => { assert.strictEqual(p.demo, false); assert.ok(p.extId.startsWith('mc:')); });
  assert.ok(C.squad(s, 'real-madrid').some((p) => p.name === 'Kylian Mbappé'));
  assert.ok(C.squad(s, 'inter').some((p) => p.name === 'Lautaro Martínez'));
  // Los huecos se completan con ficticios marcados
  assert.ok(C.squad(s, 'fc-thun').every((p) => p.demo || p.src === 'knowledge'));
  assert.ok(Object.keys(s.leagues).length >= 30, 'ligas: ' + Object.keys(s.leagues).length);
  // Cada club tiene plantilla suficiente en todas las líneas
  Object.values(s.clubs).filter((c) => !c.ext).forEach((c) => {
    const sq = C.squad(s, c.id);
    assert.ok(sq.filter((p) => p.pos === 'POR').length >= 2, c.id + ' sin porteros suficientes');
    assert.ok(sq.length >= 21, c.id + ' plantilla corta');
  });
  // Ningún valor FC 27 inventado
  M.values.setDb(null);
  assert.strictEqual(M.values.careerStats(s).verified, 0);
});
