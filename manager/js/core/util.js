/* Utilidades comunes: azar con semilla, formato y helpers. */
(function (MCM) {
  'use strict';
  const U = (MCM.util = {});

  U.hash = function (str) {
    let h = 2166136261 >>> 0;
    str = String(str);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  // Generador pseudoaleatorio con semilla (mulberry32): mismos datos de entrada, mismo resultado.
  U.rng = function (seed) {
    let a = (typeof seed === 'string' ? U.hash(seed) : seed) >>> 0;
    const next = function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r = {
      next,
      int(min, max) { return min + Math.floor(next() * (max - min + 1)); },
      range(min, max) { return min + next() * (max - min); },
      chance(p) { return next() < p; },
      pick(arr) { return arr[Math.floor(next() * arr.length)]; },
      normal(mean = 0, sd = 1) {
        let u = 0, v = 0;
        while (u === 0) u = next();
        while (v === 0) v = next();
        return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      },
      poisson(lambda) {
        if (lambda <= 0) return 0;
        const L = Math.exp(-lambda);
        let k = 0, p = 1;
        do { k++; p *= next(); } while (p > L);
        return k - 1;
      },
      weighted(items, weightFn) {
        let total = 0;
        const w = items.map((it) => { const x = Math.max(0, weightFn(it)); total += x; return x; });
        if (total <= 0) return items[Math.floor(next() * items.length)];
        let roll = next() * total;
        for (let i = 0; i < items.length; i++) { roll -= w[i]; if (roll <= 0) return items[i]; }
        return items[items.length - 1];
      },
      shuffle(arr) {
        const a2 = arr.slice();
        for (let i = a2.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [a2[i], a2[j]] = [a2[j], a2[i]];
        }
        return a2;
      },
    };
    return r;
  };

  U.clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  U.avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);
  U.sum = (arr) => arr.reduce((s, x) => s + x, 0);

  U.uid = function (prefix) {
    const rnd = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
    return (prefix || 'id') + '_' + Date.now().toString(36) + rnd;
  };

  U.slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Dinero en euros. Unidad única de salario del juego: euros por semana.
  U.money = function (eur) {
    const sign = eur < 0 ? '-' : '';
    const v = Math.abs(eur);
    if (v >= 1e6) return sign + '€' + (v / 1e6).toFixed(v >= 1e8 ? 0 : 1).replace('.', ',') + ' M';
    if (v >= 1e3) return sign + '€' + Math.round(v / 1e3) + ' mil';
    return sign + '€' + Math.round(v);
  };
  U.wage = (eurPerWeek) => U.money(eurPerWeek) + '/sem';

  U.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  U.deepClone = (o) => JSON.parse(JSON.stringify(o));

  U.dateLabel = function (iso) {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  U.addDays = function (iso, days) {
    const d = new Date(iso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
})(globalThis.MCM = globalThis.MCM || {});
