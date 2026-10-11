// Pruebas de fichajes, contratos, finanzas y cantera. Ejecutar: npm test
const test = require('node:test');
const assert = require('node:assert');
const M = require('./load.js');
const C = M.career;
// En las pruebas generales se permiten los cambios de titulares no disponibles (hay una prueba específica para el bloqueo).
const create0 = C.create;
C.create = (o) => { const s = create0(o); s.settings.autoFix = true; return s; };
const T = M.market;
const D = M.dev;

const fresh = (club, seed) => C.create({ dataset: M.DATA.realDataset(), clubId: club || 'real-madrid', seed: seed || 'mk' });
const target = (s, clubId) => C.squad(s, clubId).sort((a, b) => b.ovr - a.ovr)[3];

test('fichaje completo: club y jugador, dinero y plantillas coherentes', () => {
  const s = fresh();
  const p = target(s, 'real-oviedo');
  const from = p.clubId;
  const budget0 = s.clubs[s.clubId].budget;
  const fromBudget0 = s.clubs[from].budget;
  assert.ok(T.window(s).open, 'pretemporada: mercado abierto');
  const { talk } = T.start(s, p.id, 'buy');
  assert.ok(talk);
  assert.strictEqual(T.offerClub(s, p.id, talk.asking).status, 'accepted');
  const d = T.talkFor(s, p.id).demand;
  assert.strictEqual(T.offerContract(s, p.id, d).status, 'done');
  assert.strictEqual(p.clubId, s.clubId);
  assert.ok(s.clubs[s.clubId].squad.includes(p.id) && !s.clubs[from].squad.includes(p.id));
  assert.strictEqual(s.clubs[s.clubId].budget, budget0 - talk.asking - d.bonus - d.wage * 52, 'traspaso + prima + un año de salario');
  assert.strictEqual(s.clubs[from].budget, fromBudget0 + talk.asking);
  assert.strictEqual(p.wage, d.wage);
  assert.strictEqual(s.transfers[0].type, 'buy');
  assert.deepStrictEqual(C.validate(s), []);
});

test('oferta insultante rompe la negociación y bloquea al club en esa ventana', () => {
  const s = fresh();
  const p = target(s, 'getafe-cf');
  T.start(s, p.id, 'buy');
  assert.strictEqual(T.offerClub(s, p.id, 1000).status, 'rejected');
  assert.ok(T.start(s, p.id, 'buy').error);
});

test('reglas económicas: presupuesto, tope salarial y plantilla máxima', () => {
  const s = fresh('sunderland', 'eco');
  const star = C.squad(s, 'real-madrid').sort((a, b) => b.ovr - a.ovr)[0];
  const r = T.start(s, star.id, 'buy');
  if (!r.error) {
    const big = T.offerClub(s, star.id, s.clubs[s.clubId].budget + 1);
    assert.ok(big.error && /presupuesto/i.test(big.error));
  }
  // Presupuesto único: traspaso + prima + un año de salario
  const fa = s.freeAgents.map((id) => s.players[id]).sort((a, b) => b.ovr - a.ovr)[0];
  T.start(s, fa.id, 'free');
  const dem = T.talkFor(s, fa.id).demand;
  s.clubs[s.clubId].budget = dem.bonus + dem.wage * 52 - 1;
  const res = T.offerContract(s, fa.id, dem);
  assert.ok(res.error && /presupuesto/i.test(res.error));
  s.clubs[s.clubId].budget = dem.bonus + dem.wage * 52 + 5e6;
  const ok = T.offerContract(s, fa.id, dem);
  assert.strictEqual(ok.status, 'done');
  assert.ok(Math.abs(s.clubs[s.clubId].budget - 5e6) < 1, 'descuenta prima y un año de salario: ' + s.clubs[s.clubId].budget);
  assert.strictEqual(s.clubs[s.clubId].wageBudget, C.wageBill(s, s.clubId));
  // Plantilla máxima
  while (s.clubs[s.clubId].squad.length < T.MAX_SQUAD) { const x = s.freeAgents[0]; C.movePlayer(s, s.players[x], s.clubId); }
  const fa2 = s.players[s.freeAgents[0]];
  T.start(s, fa2.id, 'free');
  const r2 = T.offerContract(s, fa2.id, T.talkFor(s, fa2.id).demand);
  assert.ok(r2.error && /30/.test(r2.error));
});

test('el valor FC 27 importado es la referencia y ninguna operación lo modifica', () => {
  const s = fresh();
  const p = C.squad(s, 'real-betis').find((x) => x.name === 'Isco');
  M.values.setDb({ entries: {}, imports: [] });
  M.values.merge(M.values.db, M.values.parse('id,name,club,value,currency,edition,source\nX1,Isco,Real Betis,"12.345.678 €",EUR,FC 27,PRUEBA\n').entries, '2026-10-10');
  M.values.setDb(M.values.db);
  assert.strictEqual(T.reference(s, p).value, 12345678);
  const ask = T.askingPrice(s, p);
  assert.notStrictEqual(ask, 12345678, 'el precio pedido es otra cantidad');
  T.start(s, p.id, 'buy');
  T.offerClub(s, p.id, ask);
  T.offerContract(s, p.id, T.talkFor(s, p.id).demand);
  assert.strictEqual(p.clubId, s.clubId);
  assert.strictEqual(M.values.db.entries.X1.value, 12345678);
  assert.strictEqual(M.values.lookup(p, 'Real Betis').entry.value, 12345678, 'sigue enlazado por id/nombre del club de origen');
  M.values.setDb(null);
});

test('ventas, cesiones, rescisiones y renovaciones', () => {
  const s = fresh('real-betis', 'sell');
  const p = C.squad(s, s.clubId).sort((a, b) => a.ovr - b.ovr)[5];
  T.toggleListed(s, p.id);
  // Fuerza una oferta
  s.market.offers.unshift({ id: 'oX', pid: p.id, clubId: 'real-oviedo', type: 'buy', fee: 2e6, maxFee: 2.5e6, expiresMd: 5, status: 'pending', md: 0 });
  const b0 = s.clubs[s.clubId].budget;
  const w0 = p.wage;
  assert.strictEqual(T.respondOffer(s, 'oX', 'counter', 2.4e6).status, 'accepted');
  assert.strictEqual(s.clubs[s.clubId].budget, b0 + 2.4e6 + w0 * 52, 'venta + su año de salario');
  assert.strictEqual(p.clubId, 'real-oviedo');
  const y = C.squad(s, s.clubId).sort((a, b) => a.age - b.age)[0];
  assert.strictEqual(T.loanOut(s, y.id).status, 'done');
  assert.strictEqual(y.loan.parent, s.clubId);
  const r = C.squad(s, s.clubId).find((x) => !x.loan && x.ovr < 74);
  const cost = T.releaseCost(s, r);
  const b1 = s.clubs[s.clubId].budget;
  assert.strictEqual(T.release(s, r.id).status, 'done');
  assert.strictEqual(s.clubs[s.clubId].budget, b1 - cost);
  assert.ok(s.freeAgents.includes(r.id));
  const ren = C.squad(s, s.clubId).find((x) => !x.loan && x.morale >= 40);
  T.start(s, ren.id, 'renew');
  const d = T.talkFor(s, ren.id).demand;
  assert.strictEqual(T.offerContract(s, ren.id, d).status, 'done');
  assert.strictEqual(ren.contractEnd, s.season.year + 1 + d.years);
  assert.deepStrictEqual(C.validate(s), []);
  // Al final de temporada la cesión vuelve y los contratos no renovados se van
  const expiring = C.squad(s, s.clubId).filter((x) => !x.loan && x.contractEnd <= s.season.year + 1).map((x) => x.id);
  while (!C.seasonFinished(s)) C.playMatchday(s);
  C.endSeason(s);
  assert.strictEqual(y.clubId, s.clubId, 'vuelve de la cesión');
  assert.strictEqual(y.loan, null);
  expiring.forEach((id) => { if (s.players[id]) assert.notStrictEqual(s.players[id].clubId, 'real-betis'); });
  assert.deepStrictEqual(C.validate(s), []);
});

test('ventana cerrada: no se puede fichar de clubes, sí agentes libres', () => {
  const s = fresh('sunderland', 'win');
  for (let i = 0; i < 6; i++) C.playMatchday(s);
  assert.strictEqual(T.window(s).open, false);
  const p = target(s, 'burnley');
  assert.ok(T.start(s, p.id, 'buy').error);
  const fa = s.players[s.freeAgents[0]];
  assert.ok(T.start(s, fa.id, 'free').talk);
});

test('cantera: hornada, subir al primer equipo y datos íntegros', () => {
  const s = fresh('sunderland', 'acad');
  assert.ok(D.academy(s).length >= 5);
  const y = D.academy(s)[0];
  assert.ok(!s.clubs[s.clubId].squad.includes(y.id));
  assert.strictEqual(D.promote(s, y.id).status, 'done');
  assert.ok(s.clubs[s.clubId].squad.includes(y.id) && !y.academy);
  assert.deepStrictEqual(C.validate(s), []);
  while (!C.seasonFinished(s)) C.playMatchday(s);
  C.endSeason(s);
  assert.ok(D.academy(s).length > 4);
  assert.ok(s.dev.confidence >= 0 && s.dev.confidence <= 100);
  assert.deepStrictEqual(C.validate(s), []);
});

test('partidas antiguas se migran sin perder datos', () => {
  const s = fresh('sunderland', 'old');
  delete s.market; delete s.dev; s.schema = 1;
  C.migrate(s);
  assert.ok(s.market && s.dev && s.clubs.sunderland.wageBudget > 0);
  C.playMatchday(s);
  assert.deepStrictEqual(C.validate(s), []);
});

test('cesión sin compensación y ofertas con cantidades exactas', () => {
  const s = fresh('real-betis', 'loanin');
  const p = C.squad(s, 'real-madrid').sort((a, b) => a.ovr - b.ovr)[2];
  const { talk } = T.start(s, p.id, 'loan');
  assert.ok(talk && talk.asking === 0, 'sin compensación');
  const b0 = s.clubs[s.clubId].budget;
  if (talk.minShare > 25) assert.strictEqual(T.offerClub(s, p.id, 0, talk.minShare - 25).status, 'counter');
  assert.strictEqual(T.offerClub(s, p.id, 0, 100).status, 'accepted');
  assert.strictEqual(T.offerContract(s, p.id, { wage: 0, years: 1, bonus: 0 }).status, 'done');
  assert.strictEqual(p.clubId, s.clubId);
  assert.strictEqual(s.clubs[s.clubId].budget, b0 - p.wage * 52, 'solo se reserva un año de su salario');
  // Oferta de traspaso con una cantidad cualquiera (sin redondeos)
  const q = C.squad(s, 'real-oviedo').sort((a, b) => b.ovr - a.ovr)[3];
  const t2 = T.start(s, q.id, 'buy').talk;
  const exact = Math.round(t2.asking * 0.97) + 1678;
  T.offerClub(s, q.id, exact);
  assert.strictEqual(t2.rounds[0].fee, exact);
});

test('cesión de 2 temporadas con opción de compra y su ejecución', () => {
  const s = fresh('real-betis', 'loanopt');
  const p = C.squad(s, 'villarreal-cf').filter((x) => x.contractEnd >= s.season.year + 2).sort((a, b) => a.ovr - b.ovr)[3];
  p.contractEnd = Math.max(p.contractEnd, s.season.year + 3);
  const { talk } = T.start(s, p.id, 'loan');
  const min = T.optionMin(s, p);
  assert.strictEqual(T.offerClub(s, p.id, 0, 100, { years: 2, option: Math.round(min * 0.8) }).status, 'counter', 'opción baja: contraoferta');
  assert.strictEqual(T.offerClub(s, p.id, 0, 100, { years: 2, option: min + 1 }).status, 'accepted');
  assert.strictEqual(T.offerContract(s, p.id, { wage: 0, years: 1, bonus: 0 }).status, 'done');
  assert.strictEqual(p.loan.until, s.season.year + 2);
  assert.strictEqual(p.loan.option, min + 1);
  // Tras la primera temporada sigue cedido
  MCM.market.endOfSeasonContracts(s);
  assert.strictEqual(p.clubId, s.clubId, 'cesión de 2 años: no vuelve en el primer verano');
  s.clubs[s.clubId].budget += 200e6;
  const parentBudget = s.clubs[p.loan.parent].budget;
  const r = T.exerciseOption(s, p.id);
  assert.strictEqual(r.status, 'done');
  assert.strictEqual(p.loan, null);
  assert.strictEqual(s.clubs['villarreal-cf'].budget, parentBudget + min + 1);
});
