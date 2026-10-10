/* Jugadores: posiciones, compatibilidad, atributos, valor de mercado y salario. */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const P = (MCM.players = {});

  P.POSITIONS = {
    POR: { line: 'GK', name: 'Portero' },
    DFC: { line: 'DEF', name: 'Defensa central' },
    LD: { line: 'DEF', name: 'Lateral derecho' },
    LI: { line: 'DEF', name: 'Lateral izquierdo' },
    MCD: { line: 'MID', name: 'Mediocentro defensivo' },
    MC: { line: 'MID', name: 'Mediocentro' },
    MCO: { line: 'MID', name: 'Mediapunta' },
    MD: { line: 'MID', name: 'Interior derecho' },
    MI: { line: 'MID', name: 'Interior izquierdo' },
    ED: { line: 'ATT', name: 'Extremo derecho' },
    EI: { line: 'ATT', name: 'Extremo izquierdo' },
    DC: { line: 'ATT', name: 'Delantero centro' },
  };
  P.POS_ORDER = ['POR', 'LD', 'DFC', 'LI', 'MCD', 'MC', 'MD', 'MI', 'MCO', 'ED', 'EI', 'DC'];

  // Compatibilidad entre posiciones (1 = natural).
  const NEAR = {
    POR: {},
    DFC: { MCD: 0.9, LD: 0.88, LI: 0.88 },
    LD: { LI: 0.9, MD: 0.9, DFC: 0.88, ED: 0.82 },
    LI: { LD: 0.9, MI: 0.9, DFC: 0.88, EI: 0.82 },
    MCD: { MC: 0.95, DFC: 0.9, MCO: 0.82 },
    MC: { MCD: 0.95, MCO: 0.93, MD: 0.88, MI: 0.88 },
    MCO: { MC: 0.93, DC: 0.88, ED: 0.88, EI: 0.88 },
    MD: { ED: 0.93, MI: 0.9, MC: 0.88, LD: 0.88 },
    MI: { EI: 0.93, MD: 0.9, MC: 0.88, LI: 0.88 },
    ED: { EI: 0.92, MD: 0.93, DC: 0.88, MCO: 0.88 },
    EI: { ED: 0.92, MI: 0.93, DC: 0.88, MCO: 0.88 },
    DC: { ED: 0.88, EI: 0.88, MCO: 0.88 },
  };

  P.fit = function (player, slotPos) {
    if (player.pos === slotPos) return 1;
    if (player.alt && player.alt.indexOf(slotPos) >= 0) return 0.97;
    if (slotPos === 'POR') return 0.35;
    if (player.pos === 'POR') return 0.4;
    const n = NEAR[player.pos] && NEAR[player.pos][slotPos];
    return n || 0.75;
  };
  P.fitLabel = (f) => (f >= 0.97 ? 'natural' : f >= 0.9 ? 'adaptado' : 'fuera');

  // Atributos (desviación sobre la media según la posición).
  P.OUT_ATTRS = [['pac', 'Ritmo'], ['sho', 'Tiro'], ['pas', 'Pase'], ['dri', 'Regate'], ['def', 'Defensa'], ['phy', 'Físico']];
  P.GK_ATTRS = [['div', 'Estirada'], ['han', 'Manos'], ['kic', 'Saque'], ['ref', 'Reflejos'], ['spd', 'Velocidad'], ['pos', 'Colocación']];
  const PROFILE = {
    POR: { div: 1, han: -1, kic: -12, ref: 2, spd: -30, pos: 0 },
    DFC: { pac: -8, sho: -25, pas: -10, dri: -12, def: 4, phy: 3 },
    LD: { pac: 3, sho: -20, pas: -4, dri: -3, def: 0, phy: -2 },
    LI: { pac: 3, sho: -20, pas: -4, dri: -3, def: 0, phy: -2 },
    MCD: { pac: -8, sho: -12, pas: 0, dri: -5, def: 2, phy: 3 },
    MC: { pac: -5, sho: -6, pas: 3, dri: 0, def: -10, phy: -2 },
    MCO: { pac: -2, sho: 0, pas: 3, dri: 4, def: -30, phy: -10 },
    MD: { pac: 4, sho: -6, pas: 1, dri: 2, def: -22, phy: -8 },
    MI: { pac: 4, sho: -6, pas: 1, dri: 2, def: -22, phy: -8 },
    ED: { pac: 6, sho: -2, pas: -2, dri: 4, def: -35, phy: -10 },
    EI: { pac: 6, sho: -2, pas: -2, dri: 4, def: -35, phy: -10 },
    DC: { pac: 0, sho: 4, pas: -10, dri: -1, def: -40, phy: 2 },
  };

  P.makeAttrs = function (pos, ovr, rng) {
    const prof = PROFILE[pos] || PROFILE.MC;
    const out = {};
    Object.keys(prof).forEach((k) => {
      out[k] = Math.round(U.clamp(ovr + prof[k] + rng.normal(0, 3.5), 15, 99));
    });
    return out;
  };

  P.shiftAttrs = function (player, delta) {
    Object.keys(player.attrs).forEach((k) => {
      player.attrs[k] = Math.round(U.clamp(player.attrs[k] + delta, 15, 99));
    });
  };

  // Valor de mercado en euros (función de media, edad y potencial).
  P.marketValue = function (p) {
    let v = 500000 * Math.exp((p.ovr - 60) * 0.19);
    const gap = Math.max(0, p.pot - p.ovr);
    if (p.age <= 23) v *= 1 + gap * 0.045;
    if (p.age <= 20) v *= 1.15;
    if (p.age >= 30) v *= 0.8;
    if (p.age >= 32) v *= 0.6;
    if (p.age >= 34) v *= 0.5;
    if (v >= 1e6) return Math.round(v / 1e5) * 1e5;
    return Math.max(25000, Math.round(v / 5000) * 5000);
  };

  // Salario en euros por semana, ajustado a la riqueza del club.
  P.fairWage = function (p, clubWealth) {
    const w = P.marketValue(p) * 0.0021 * (0.55 + (clubWealth || 1) * 0.45);
    return Math.max(750, Math.round(w / 250) * 250);
  };

  P.isAvailable = (p) => !(p.injury && p.injury.weeks > 0) && !(p.suspension > 0);
  P.statusOf = function (p) {
    if (p.injury && p.injury.weeks > 0) return { code: 'inj', label: 'Lesionado (' + p.injury.weeks + ' sem)' };
    if (p.suspension > 0) return { code: 'sus', label: 'Sancionado (' + p.suspension + ' p.)' };
    if (p.fitness < 60) return { code: 'tired', label: 'Muy cansado' };
    return { code: 'ok', label: 'Disponible' };
  };

  P.emptyStats = () => ({ apps: 0, starts: 0, min: 0, goals: 0, assists: 0, yel: 0, red: 0, rSum: 0, rN: 0, motm: 0, cs: 0 });
  P.avgRating = (s) => (s && s.rN ? s.rSum / s.rN : 0);

  // Evolución anual de la media: depende de edad, potencial pendiente, minutos y azar.
  P.developSeason = function (p, rng, minutesShare) {
    const gap = Math.max(0, p.pot - p.ovr);
    const playFactor = 0.55 + 0.9 * U.clamp(minutesShare, 0, 1); // jugar acelera el desarrollo
    let delta;
    if (p.age <= 21) delta = gap * rng.range(0.18, 0.42) * playFactor + rng.normal(0, 1);
    else if (p.age <= 24) delta = gap * rng.range(0.15, 0.35) * playFactor + rng.normal(0, 1);
    else if (p.age <= 28) delta = gap * rng.range(0.1, 0.5) * playFactor + rng.normal(0, 0.8);
    else if (p.age <= 30) delta = rng.normal(-0.6, 1);
    else if (p.age <= 32) delta = rng.normal(-1.8, 1.2);
    else delta = rng.normal(-3.2, 1.5);
    delta = Math.round(delta);
    if (delta > 0) delta = Math.min(delta, gap, 7);
    delta = Math.max(delta, -7);
    const newOvr = U.clamp(p.ovr + delta, 35, 95);
    const real = newOvr - p.ovr;
    p.ovr = newOvr;
    if (p.pot < p.ovr) p.pot = p.ovr;
    if (p.age >= 29 && p.pot > p.ovr) p.pot = Math.max(p.ovr, p.pot - 2);
    P.shiftAttrs(p, real);
    return real;
  };
})(globalThis.MCM = globalThis.MCM || {});
