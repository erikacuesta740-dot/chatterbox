// Pruebas de copas, competiciones europeas y calendario. Ejecutar: npm test
const test = require('node:test');
const assert = require('node:assert');
const M = require('./load.js');
const C = M.career;
// En las pruebas generales se permiten los cambios de titulares no disponibles (hay una prueba específica para el bloqueo).
const create0 = C.create;
C.create = (o) => { const s = create0(o); s.settings.autoFix = true; return s; };
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
  K.all(s).forEach((c) => c.fixtures.filter((f) => f.knockout && !f.noShootout).forEach((f) => {
    assert.ok(f.winner === f.home || f.winner === f.away, 'eliminatoria sin ganador');
    if (f.pens) assert.ok(f.et && f.pens[0] !== f.pens[1]);
  }));
  // Cuadro de copa coherente: cada ronda reduce a la mitad
  const cup = s.comps.CUP_ESP;
  assert.strictEqual(cup.rounds[cup.rounds.length - 1].name, 'Final');
  assert.ok(s.trophies[cup.winner].some((t) => t.name === 'Copa del Rey'));
  assert.deepStrictEqual(C.validate(s), []);
});

test('playoffs de ascenso: Segunda (ida y vuelta) y Championship (final única); ascensos y descensos cuadran', () => {
  const s = fresh('cd-leganes', 'playoff');
  C.simulateUntil(s);
  const esp = s.comps.PO_ESP2;
  const eng = s.comps.PO_ENG2;
  assert.ok(esp && eng, 'se crean al terminar la liga');
  const tEsp = K.eligibleOrder(s, s.leagues.ESP2);
  assert.deepStrictEqual(esp.seeds, tEsp.slice(2, 6), 'juegan del 3º al 6º');
  assert.deepStrictEqual(esp.rounds.map((r) => r.name), ['Semifinales', 'Final']);
  assert.ok(esp.rounds.every((r) => r.ties.every((t) => t.fixtures.length === 2)), 'Segunda: todo a ida y vuelta');
  assert.strictEqual(eng.rounds[1].ties[0].fixtures.length, 1, 'Championship: final a partido único');
  const lastLeague = s.leagues.ESP2.fixtures.reduce((m, f) => (f.date > m ? f.date : m), '');
  assert.ok(esp.fixtures.every((f) => f.date > lastLeague), 'después de la liga');
  assert.ok(esp.promoted && eng.promoted);
  const up = tEsp.slice(0, 2).concat([esp.promoted]);
  C.endSeason(s);
  up.forEach((id) => assert.strictEqual(s.clubs[id].leagueId, 'ESP1'));
  assert.strictEqual(s.leagues.ESP1.clubIds.length, 20);
  assert.strictEqual(s.leagues.ESP2.clubIds.length, 22);
  assert.strictEqual(s.leagues.ENG2.clubIds.length, 24);
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

test('carrera del entrenador: premios, historial, despido y cambio de club', () => {
  const s = fresh('sunderland', 'mgr1');
  C.simulateUntil(s);
  C.endSeason(s);
  assert.strictEqual(s.awards.length, 1);
  const a = s.awards[0];
  assert.strictEqual(a.ballonDor.length, 3);
  assert.ok(a.leagues.every((l) => l.team.length === 11 || l.team.length > 0));
  assert.ok(Object.values(s.players).some((p) => p.career && p.career.length === 1));
  // Despido por confianza mínima
  s.dev.confidence = 1; s.week = 12;
  M.mgr.checkSack(s);
  assert.ok(s.manager.unemployed && s.manager.offers.length >= 1);
  assert.strictEqual(C.playUserMatch(s), null, 'sin club no se juega');
  const target = s.manager.offers[0].clubId;
  assert.strictEqual(M.mgr.switchClub(s, target), null);
  assert.strictEqual(s.clubId, target);
  assert.ok(!s.manager.unemployed);
  assert.ok(M.dev.academy(s).length >= 5, 'nueva cantera');
  assert.ok(C.playUserMatch(s));
  assert.deepStrictEqual(C.validate(s), []);
});

test('día a día: entrenamiento, ojeadores, cantera, charlas y prensa', () => {
  const s = fresh('real-betis', 'life2');
  const Lf = M.life;
  assert.strictEqual(Lf.hireScout(s, 3), null);
  const sc = s.scouting.scouts[0];
  assert.strictEqual(Lf.assign(s, sc.id, { region: 'ENG', pos: 'ALL', weeks: 6 }), null);
  const young = Object.values(s.players).find((p) => p.clubId && p.clubId !== s.clubId && p.age <= 20);
  const r = Lf.potRange(s, young);
  assert.ok(r && r[0] <= young.pot && young.pot <= r[1], 'el rango contiene el potencial real');
  const p = C.squad(s, s.clubId).find((x) => x.pos !== 'POR');
  assert.strictEqual(Lf.setPlan(s, p.id, { focus: 'pas' }), null);
  const pas0 = p.attrs.pas;
  s.clubs[s.clubId].training = 'high';
  for (let i = 0; i < 10; i++) C.playUserMatch(s);
  assert.ok(s.scouting.reports.length > 0, 'el ojeador entrega informes');
  assert.ok(p.attrs.pas >= pas0, 'el plan no empeora el atributo');
  const known = s.scouting.reports[0].pid;
  assert.strictEqual(Lf.potRange(s, s.players[known]), null, 'con informe se ve el potencial exacto');
  const t = Lf.talk(s, p.id, 'praise');
  assert.ok(t.text);
  assert.ok(Lf.talk(s, p.id, 'praise').error, 'no se puede repetir la charla enseguida');
  if (s.press) { Lf.answerPress(s, s.press.questions.map(() => 0)); assert.strictEqual(s.press, null); }
  assert.deepStrictEqual(C.validate(s), []);
});

test('alineación manual: sin permiso no se cambia y la simulación se para a preguntar', () => {
  const s = fresh('real-betis', 'lu');
  s.settings.autoFix = false;
  assert.strictEqual(s.settings.autoLineup, false);
  const club = s.clubs[s.clubId];
  const before = club.lineup.xi.slice();
  const p = s.players[before[9]];
  p.injury = { type: 'Esguince', weeks: 3, days: 21 };
  const r = C.playUserMatch(s);
  assert.ok(r && r.blocked, 'se para antes del partido');
  assert.ok(r.issues.some((x) => x.pid === p.id));
  assert.deepStrictEqual(club.lineup.xi, before, 'la alineación no se toca');
  assert.ok(!r.fixture.played);
  const b2 = C.simulateUntil(s);
  assert.ok(b2 && b2.blocked, 'simular el resto también se para');
  C.fixLineup(s);
  assert.ok(!club.lineup.xi.includes(p.id), 'con permiso entra un suplente');
  const f = C.playUserMatch(s);
  assert.ok(f && !f.blocked && f.played);
});

test('suplentes automáticos: entra el mejor de su puesto y el titular vuelve al recuperarse', () => {
  const s = fresh('real-betis', 'cover');
  assert.strictEqual(s.settings.autoFix, true, 'activado por defecto');
  const club = s.clubs[s.clubId];
  const before = club.lineup.xi.slice();
  const slots = MCM.lineup.slots(club.lineup.formation);
  const i = slots.indexOf('DFC');
  const star = s.players[before[i]];
  star.injury = { type: 'Esguince', weeks: 3, days: 21 };
  const f1 = C.playUserMatch(s);
  assert.ok(f1 && !f1.blocked && f1.played, 'no se para la simulación');
  const sub = s.players[club.lineup.xi[i]];
  assert.notStrictEqual(sub.id, star.id);
  assert.ok(MCM.players.fit(sub, 'DFC') >= 0.88, 'el suplente puede jugar de central');
  assert.strictEqual(club.lineup.covers[i], star.id);
  // El resto del once no cambia
  before.forEach((id, k) => { if (k !== i) assert.strictEqual(club.lineup.xi[k], id); });
  star.injury = null;
  const f2 = C.playUserMatch(s);
  assert.ok(f2 && f2.played);
  assert.strictEqual(club.lineup.xi[i], star.id, 'el titular vuelve al once');
  assert.ok(!club.lineup.covers[i]);
});

test('modo online: dos clubes humanos, órdenes, jornadas y cambio de temporada', () => {
  const O = MCM.online;
  const s = O.createWorld({ leagueId: 'ESP2', clubId: 'albacete-balompie', seed: 'on1', code: 'TEST1' });
  assert.deepStrictEqual(Object.keys(s.leagues).sort(), ['ESP1', 'ESP2']);
  O.addHuman(s, 'cordoba-cf');
  const ord = O.extractOrders(s, 'cordoba-cf');
  ord.tactics.formation = '4-4-2';
  ord.lineup = null;
  O.applyOrders(s, ord);
  assert.strictEqual(s.clubs['cordoba-cf'].tactics.formation, '4-4-2');
  // Órdenes con jugadores ajenos se ignoran
  O.applyOrders(s, { clubId: 'cordoba-cf', lineup: { formation: '4-4-2', xi: [C.squad(s, 'real-madrid')[0].id] }, tactics: { formation: '4-4-2' } });
  assert.ok(s.clubs['cordoba-cf'].lineup.xi.every((id) => !id || s.players[id].clubId === 'cordoba-cf'));
  const sq0 = s.clubs['cordoba-cf'].squad.slice().sort();
  let steps = 0;
  while (!C.seasonFinished(s) && steps < 200) {
    const r = O.step(s);
    assert.ok(r.results.every((x) => s.humans.includes(x.home) || s.humans.includes(x.away)));
    steps++;
  }
  assert.ok(C.seasonFinished(s) && steps > 20);
  assert.strictEqual(s.clubId, 'albacete-balompie', 'cada dispositivo conserva su club');
  assert.ok(O.headToHead(s).length >= 2, 'al menos ida y vuelta de liga (y copa si coinciden)');
  assert.deepStrictEqual(s.clubs['cordoba-cf'].squad.slice().sort(), sq0, 'la IA no toca la plantilla de un jugador humano');
  const r = O.step(s);
  assert.strictEqual(r.kind, 'season');
  assert.ok(!C.seasonFinished(s));
  assert.deepStrictEqual(C.validate(s), []);
});
