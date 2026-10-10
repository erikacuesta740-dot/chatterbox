/* Formaciones, alineación automática, tácticas y avisos. */
(function (MCM) {
  'use strict';
  const L = (MCM.lineup = {});
  const fitOf = (p, pos) => MCM.players.fit(p, pos);

  // Cada formación: posición de cada hueco y coordenadas (x %, y %) para dibujar el campo.
  L.FORMATIONS = {
    '4-3-3': [['POR', 50, 91], ['LD', 86, 70], ['DFC', 62, 75], ['DFC', 38, 75], ['LI', 14, 70], ['MC', 72, 50], ['MCD', 50, 57], ['MC', 28, 50], ['ED', 82, 24], ['DC', 50, 15], ['EI', 18, 24]],
    '4-4-2': [['POR', 50, 91], ['LD', 86, 70], ['DFC', 62, 75], ['DFC', 38, 75], ['LI', 14, 70], ['MD', 84, 45], ['MC', 60, 51], ['MC', 40, 51], ['MI', 16, 45], ['DC', 62, 18], ['DC', 38, 18]],
    '4-2-3-1': [['POR', 50, 91], ['LD', 86, 70], ['DFC', 62, 75], ['DFC', 38, 75], ['LI', 14, 70], ['MCD', 62, 56], ['MCD', 38, 56], ['ED', 82, 32], ['MCO', 50, 36], ['EI', 18, 32], ['DC', 50, 14]],
    '4-1-4-1': [['POR', 50, 91], ['LD', 86, 70], ['DFC', 62, 75], ['DFC', 38, 75], ['LI', 14, 70], ['MCD', 50, 59], ['MD', 84, 40], ['MC', 61, 43], ['MC', 39, 43], ['MI', 16, 40], ['DC', 50, 15]],
    '3-5-2': [['POR', 50, 91], ['DFC', 72, 74], ['DFC', 50, 77], ['DFC', 28, 74], ['MD', 88, 46], ['MC', 66, 50], ['MCD', 50, 58], ['MC', 34, 50], ['MI', 12, 46], ['DC', 62, 18], ['DC', 38, 18]],
    '3-4-3': [['POR', 50, 91], ['DFC', 72, 74], ['DFC', 50, 77], ['DFC', 28, 74], ['MD', 86, 48], ['MC', 61, 52], ['MC', 39, 52], ['MI', 14, 48], ['ED', 80, 22], ['DC', 50, 15], ['EI', 20, 22]],
    '5-3-2': [['POR', 50, 91], ['LD', 90, 62], ['DFC', 70, 75], ['DFC', 50, 78], ['DFC', 30, 75], ['LI', 10, 62], ['MC', 70, 48], ['MCD', 50, 55], ['MC', 30, 48], ['DC', 62, 18], ['DC', 38, 18]],
  };
  L.slots = (formation) => (L.FORMATIONS[formation] || L.FORMATIONS['4-3-3']).map((s) => s[0]);

  L.TACTIC_OPTIONS = {
    mentality: [['def', 'Defensiva'], ['bal', 'Equilibrada'], ['att', 'Ofensiva']],
    pressing: [['low', 'Bloque bajo'], ['mid', 'Media'], ['high', 'Presión alta']],
    tempo: [['slow', 'Pausado'], ['normal', 'Normal'], ['fast', 'Rápido']],
  };
  L.defaultTactics = () => ({ formation: '4-3-3', mentality: 'bal', pressing: 'mid', tempo: 'normal' });

  // Valor de un jugador en un hueco, teniendo en cuenta encaje y estado físico.
  L.slotScore = function (p, pos) {
    return p.ovr * fitOf(p, pos) * (0.72 + 0.28 * (p.fitness / 100));
  };

  /* Alineación automática: asignación voraz global de los mejores pares jugador-hueco. */
  L.autoPick = function (players, formation) {
    const slots = L.slots(formation);
    const avail = players.filter(MCM.players.isAvailable);
    const pairs = [];
    avail.forEach((p) => slots.forEach((pos, i) => pairs.push([L.slotScore(p, pos), p.id, i])));
    pairs.sort((a, b) => b[0] - a[0]);
    const xi = new Array(slots.length).fill(null);
    const used = new Set();
    for (const [, pid, i] of pairs) {
      if (xi[i] || used.has(pid)) continue;
      xi[i] = pid;
      used.add(pid);
    }
    const rest = avail.filter((p) => !used.has(p.id)).sort((a, b) => b.ovr * (0.6 + 0.4 * b.fitness / 100) - a.ovr * (0.6 + 0.4 * a.fitness / 100));
    const bench = [];
    const gk = rest.find((p) => p.pos === 'POR');
    if (gk) bench.push(gk.id);
    rest.forEach((p) => { if (bench.length < 9 && bench.indexOf(p.id) < 0) bench.push(p.id); });
    return { formation, xi, bench };
  };

  /* Revisa una alineación y sustituye a los no disponibles. Devuelve cambios realizados. */
  L.repair = function (lineup, players) {
    const byId = {};
    players.forEach((p) => { byId[p.id] = p; });
    const slots = L.slots(lineup.formation);
    const changes = [];
    const used = new Set(lineup.xi.filter(Boolean));
    lineup.bench = (lineup.bench || []).filter((id) => byId[id] && MCM.players.isAvailable(byId[id]) && !lineup.xi.includes(id));
    lineup.xi = lineup.xi.slice(0, slots.length);
    while (lineup.xi.length < slots.length) lineup.xi.push(null);
    slots.forEach((pos, i) => {
      const pid = lineup.xi[i];
      const p = pid && byId[pid];
      if (p && MCM.players.isAvailable(p)) return;
      const cands = players.filter((c) => MCM.players.isAvailable(c) && !used.has(c.id) && !lineup.xi.includes(c.id));
      cands.sort((a, b) => L.slotScore(b, pos) - L.slotScore(a, pos));
      const rep = cands[0] || null;
      if (p) used.delete(p.id);
      lineup.xi[i] = rep ? rep.id : null;
      if (rep) {
        used.add(rep.id);
        lineup.bench = lineup.bench.filter((id) => id !== rep.id);
      }
      changes.push({ slot: i, pos, out: p ? p.id : null, in: rep ? rep.id : null });
    });
    return changes;
  };

  L.warnings = function (lineup, players) {
    const byId = {};
    players.forEach((p) => { byId[p.id] = p; });
    const slots = L.slots(lineup.formation);
    const w = [];
    const seen = new Set();
    slots.forEach((pos, i) => {
      const p = byId[lineup.xi[i]];
      if (!p) { w.push({ level: 'error', text: 'Hueco de ' + pos + ' sin jugador.' }); return; }
      if (seen.has(p.id)) w.push({ level: 'error', text: p.name + ' está repetido en el once.' });
      seen.add(p.id);
      if (p.injury && p.injury.weeks > 0) w.push({ level: 'error', text: p.name + ' está lesionado.' });
      if (p.suspension > 0) w.push({ level: 'error', text: p.name + ' está sancionado.' });
      const f = fitOf(p, pos);
      if (f < 0.9) w.push({ level: 'warn', text: p.name + ' (' + p.pos + ') juega fuera de posición como ' + pos + '.' });
      if (p.fitness < 65) w.push({ level: 'warn', text: p.name + ' llega muy cansado (' + Math.round(p.fitness) + '%).' });
    });
    const bench = (lineup.bench || []).map((id) => byId[id]).filter(Boolean);
    if (!bench.some((p) => p.pos === 'POR')) w.push({ level: 'info', text: 'No hay portero suplente en el banquillo.' });
    if (bench.length < 5) w.push({ level: 'info', text: 'Banquillo corto: solo ' + bench.length + ' suplentes.' });
    const avail = players.filter(MCM.players.isAvailable).length;
    if (avail < 16) w.push({ level: 'warn', text: 'Solo ' + avail + ' jugadores disponibles en la plantilla.' });
    return w;
  };
})(globalThis.MCM = globalThis.MCM || {});
