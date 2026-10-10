// Pruebas del registro de valores FC 27. Ejecutar: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const M = require('./load.js');
const V = M.values;
const fx = (f) => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8');

test('importes exactos, sin redondeo', () => {
  assert.deepStrictEqual(V.parseAmount('85.000.000 €'), { value: 85000000, currency: 'EUR' });
  assert.deepStrictEqual(V.parseAmount('€85,000,000'), { value: 85000000, currency: 'EUR' });
  assert.strictEqual(V.parseAmount(1234567, 'EUR').value, 1234567);
  assert.strictEqual(V.parseAmount('€1.234.567').value, 1234567);
  assert.strictEqual(V.parseAmount('£72.5M').value, 72500000);
  assert.strictEqual(V.parseAmount('£72.5M').currency, 'GBP');
  assert.ok(V.parseAmount('1.5').error, 'cifra ambigua se rechaza');
  assert.ok(V.parseAmount('').error);
  assert.ok(V.parseAmount(12.5, 'EUR').error, 'no se aceptan decimales en euros');
  assert.strictEqual(V.formatExact(85000000, 'EUR'), '85.000.000 €');
  assert.strictEqual(V.formatExact(1234567, 'EUR'), '1.234.567 €');
});

test('solo FC 27: rechaza otras ediciones y entradas sin valor', () => {
  const r = V.parse(fx('valores-prueba.csv'));
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.entries.length, 2);
  assert.strictEqual(r.rejected.length, 2);
  assert.ok(r.rejected.some((x) => /FC 26/.test(x.reason)));
  assert.ok(r.rejected.some((x) => /sin valor/.test(x.reason)));
  const uno = r.entries.find((e) => e.id === 'TEST-0001');
  assert.strictEqual(uno.value, 85000000);
  assert.strictEqual(uno.raw, '85.000.000 €');
  assert.strictEqual(uno.status, 'verified');
  assert.strictEqual(r.entries.find((e) => e.id === 'TEST-0002').status, 'unverified');
  const whole = V.parse(JSON.stringify({ edition: 'FC 26', source: 'x', players: [{ id: 1, name: 'a', value: 1 }] }));
  assert.ok(whole.errors.length, 'un archivo de FC 26 se rechaza entero');
  const noEd = V.parse(JSON.stringify({ source: 'x', currency: 'EUR', players: [{ id: 1, name: 'a', value: 1 }] }));
  assert.strictEqual(noEd.entries.length, 0, 'sin edición no se acepta');
});

test('actualizar por identificador no duplica y conserva el anterior', () => {
  const db = { entries: {}, imports: [] };
  const first = V.parse(fx('valores-prueba.csv')).entries;
  assert.deepStrictEqual(V.merge(db, first, '2026-10-10T00:00:00Z'), { added: 2, updated: 0, unchanged: 0 });
  assert.deepStrictEqual(V.merge(db, first, '2026-10-11T00:00:00Z'), { added: 0, updated: 0, unchanged: 2 });
  const changed = first.map((e) => (e.id === 'TEST-0001' ? Object.assign({}, e, { value: 86000000, raw: '86.000.000 €' }) : e));
  assert.deepStrictEqual(V.merge(db, changed, '2026-10-12T00:00:00Z'), { added: 0, updated: 1, unchanged: 1 });
  assert.strictEqual(Object.keys(db.entries).length, 2);
  assert.strictEqual(db.entries['TEST-0001'].value, 86000000);
  assert.strictEqual(db.entries['TEST-0001'].previous.value, 85000000);
  const dup = V.parse('id,name,club,value,currency,edition,source\nA,x,c,1,EUR,FC 27,s\nA,y,c,2,EUR,FC 27,s\n');
  assert.strictEqual(dup.entries.length, 1);
  assert.ok(dup.rejected[0].reason.includes('duplicado'));
});

test('carrera con base importada: valores enlazados por id, sin tocar la carrera', () => {
  const ds = JSON.parse(fx('dataset-prueba.json'));
  assert.deepStrictEqual(M.generator.validateDataset(ds), []);
  const s = M.career.create({ dataset: ds, clubId: 'club-prueba-norte', seed: 'vals' });
  const before = JSON.stringify(s);
  const uno = Object.values(s.players).find((p) => p.extId === 'TEST-0001');
  assert.ok(uno && uno.demo === false && uno.ovr === 84);
  V.setDb({ entries: {}, imports: [] });
  assert.strictEqual(V.lookup(uno, 'Club Prueba Norte'), null, 'sin importar: No verificado');
  V.merge(V.db, V.parse(fx('valores-prueba.csv')).entries, '2026-10-10T00:00:00Z');
  V.setDb(V.db);
  const r = V.lookup(uno, 'Club Prueba Norte');
  assert.strictEqual(r.match, 'id');
  assert.strictEqual(r.entry.value, 85000000);
  assert.notStrictEqual(uno.value, 85000000, 'el valor del juego es otro campo');
  assert.strictEqual(JSON.stringify(s), before, 'importar valores no modifica la carrera');
  const st = V.careerStats(s);
  assert.strictEqual(st.verified, 1);
  assert.strictEqual(st.imported, 1);
  assert.strictEqual(st.verified + st.imported + st.missing, st.total);
  // Los jugadores ficticios nunca reciben un valor FC 27
  const fake = Object.values(s.players).find((p) => p.demo);
  assert.strictEqual(V.lookup(fake, 'Club Prueba Sur'), null);
  // La carrera sigue jugándose con normalidad
  while (!M.career.seasonFinished(s)) M.career.playMatchday(s);
  M.career.endSeason(s);
  assert.deepStrictEqual(M.career.validate(s), []);
  assert.strictEqual(V.lookup(s.players[uno.id], 'Club Prueba Norte').entry.value, 85000000);
});

test('validación de bases de plantillas', () => {
  assert.ok(M.generator.validateDataset({}).length);
  const bad = { leagues: [{ id: 'X', name: 'X', clubs: [{ name: 'A', rep: 50, players: [{ id: 1, name: 'p', pos: 'ZZ', ovr: 70, age: 20 }, { id: 1, name: 'q', pos: 'MC', ovr: 70, age: 20 }] }, { name: 'B', rep: 50 }] }] };
  const errs = M.generator.validateDataset(bad);
  assert.ok(errs.some((e) => /posición/.test(e)));
  assert.ok(errs.some((e) => /repetido/.test(e)));
});
