#!/usr/bin/env node
/*
 * Revisa ligas y plantillas reales: formato, posiciones, nacionalidades, duplicados y tamaño de plantilla.
 * Uso: node tools/check-data.js [ID_LIGA ...]   (sin argumentos: todas)
 */
const MCM = require('../tests/load.js');
const U = MCM.util;
const R = MCM.DATA.realRosters;
const POS = Object.keys(MCM.players.POSITIONS);
const only = process.argv.slice(2);
let errors = 0;
const err = (m) => { errors++; console.log('ERROR', m); };
const warn = (m) => console.log('aviso', m);

const ids = {};
Object.keys(R).forEach((club) => R[club].forEach((line) => {
  const p = line.split('|');
  const id = U.slug(p[0]) + '-' + p[2];
  if (ids[id] && ids[id] !== club) err('jugador repetido en dos clubes: ' + line + ' (' + ids[id] + ' y ' + club + ')');
  ids[id] = club;
}));

const allSlugs = new Set();
MCM.DATA.leagues.forEach((L) => {
  L.clubs.forEach((row) => { const sl = U.slug(row[0]); if (allSlugs.has(sl)) err('club repetido: ' + row[0]); allSlugs.add(sl); });
  if (only.length && !only.includes(L.id)) return;
  ['id', 'name', 'country', 'nat', 'tier'].forEach((k) => { if (L[k] == null) err(L.id + ': falta ' + k); });
  if (!MCM.DATA.nations[L.nat]) err(L.id + ': nacionalidad de liga desconocida ' + L.nat);
  if (L.clubs.length < 8) err(L.id + ': número de clubes raro (' + L.clubs.length + ')');
  if (L.upper && !MCM.DATA.leagues.some((x) => x.id === L.upper)) err(L.id + ': liga superior inexistente ' + L.upper);
  let real = 0;
  L.clubs.forEach((row) => {
    const [name, short, rep, stadium, c1, c2] = row;
    if (!name || !short || !(rep >= 30 && rep <= 99) || !/^#[0-9a-f]{6}$/i.test(c1) || !/^#[0-9a-f]{6}$/i.test(c2)) err(L.id + ': fila de club incorrecta ' + JSON.stringify(row));
    const list = R[U.slug(name)];
    if (!list) { warn(L.id + ': sin plantilla real ' + name); return; }
    real++;
    let gk = 0;
    list.forEach((line) => {
      const p = line.split('|');
      if (p.length !== 6) { err(name + ': formato ' + line); return; }
      const [n, pos, by, o, pt, nat] = p;
      if (!n.trim()) err(name + ': nombre vacío');
      if (!POS.includes(pos)) err(name + ': posición ' + line);
      if (!MCM.DATA.nations[nat]) err(name + ': nacionalidad desconocida ' + line);
      if (!(+by >= 1978 && +by <= 2010) || !(+o >= 40 && +o <= 95) || !(+pt >= +o && +pt <= 96)) err(name + ': números ' + line);
      if (pos === 'POR') gk++;
    });
    if (list.length < 14 || gk < 2) warn(name + ': plantilla corta (' + list.length + ' jugadores, ' + gk + ' porteros); se completa con ficticios');
  });
  console.log(L.id.padEnd(5), L.name.padEnd(28), L.clubs.length + ' clubes', real + ' con plantilla real');
});
// Plantillas cuyo club no existe en ninguna liga ni entre los clubes europeos invitados
const ext = new Set(MCM.comps.EXTRA_CLUBS.map((r) => U.slug(r[0])));
Object.keys(R).forEach((k) => { if (!allSlugs.has(k) && !ext.has(k)) err('plantilla de un club que no existe: ' + k); });
console.log(errors ? errors + ' errores' : 'OK', '·', Object.keys(ids).length, 'jugadores reales');
process.exit(errors ? 1 : 0);
