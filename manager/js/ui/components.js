/* Piezas visuales reutilizables (devuelven HTML como texto). */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const esc = U.esc;
  const UI = (MCM.ui = MCM.ui || {});

  const ICONS = {
    back: '<path d="M15 5l-7 7 7 7" />',
    home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" />',
    squad: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c.6-3.6 2.8-5.5 5.5-5.5s4.9 1.9 5.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.6-.3 4.2 1.4 4.6 4.4"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    table: '<path d="M4 6h16M4 12h16M4 18h16M9 6v12"/>',
    menu: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    tactics: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M3 12h4M17 12h4"/><circle cx="12" cy="12" r="2.5"/>',
    transfer: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    free: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6"/><path d="M18 4l3 3M21 4l-3 3"/>',
    youth: '<path d="M12 20V10"/><path d="M12 12c-4 0-6-2.5-6-6 3.5 0 6 2 6 6zM12 10c0-3.5 2.5-6 6-6 0 3.5-2 6-6 6z"/>',
    money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9v.01M18 15v.01"/>',
    news: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    club: '<path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    resume: '<path d="M5 12a7 7 0 1 0 2-5"/><path d="M5 4v4h4"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>',
  };
  UI.icon = (name) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';

  // Contraste del texto sobre el color principal del escudo
  function luminance(hex) {
    const h = String(hex).replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const r = (n >> 16) & 255; const g = (n >> 8) & 255; const b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  /* Escudo genérico: forma propia + colores del club + abreviatura. No reproduce escudos reales. */
  UI.crest = function (club, size) {
    size = size || 36;
    const c1 = club.colors[0] || '#888';
    const c2 = club.colors[1] || '#fff';
    const ink = luminance(c1) > 0.6 ? '#141414' : '#ffffff';
    const label = esc(club.short.slice(0, 4));
    const fs = label.length >= 4 ? 8.5 : 10.5;
    return '<svg class="crest" width="' + size + '" height="' + Math.round(size * 1.15) + '" viewBox="0 0 40 46" role="img" aria-label="Escudo de ' + esc(club.name) + '">' +
      '<path d="M20 2 L37 8 V22 C37 33 29.5 40.5 20 44 C10.5 40.5 3 33 3 22 V8 Z" fill="' + esc(c1) + '" stroke="' + esc(c2) + '" stroke-width="2.4"/>' +
      '<path d="M20 2 L37 8 V14 H3 V8 Z" fill="' + esc(c2) + '" opacity="0.9"/>' +
      '<text x="20" y="30" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="' + fs + '" fill="' + ink + '">' + label + '</text>' +
      '</svg>';
  };

  UI.ovrTier = (o) => (o >= 80 ? 'gold' : o >= 70 ? 'silver' : 'bronze');
  UI.ovr = (o, extra) => '<span class="ovr ' + UI.ovrTier(o) + ' ' + (extra || '') + '">' + Math.round(o) + '</span>';

  UI.bar = function (value, max, kind) {
    const pct = U.clamp((value / (max || 100)) * 100, 0, 100);
    let cls = kind || '';
    if (!kind) cls = pct < 60 ? 'bad' : pct < 80 ? 'warn' : '';
    return '<div class="bar ' + cls + '"><i style="width:' + pct.toFixed(0) + '%"></i></div>';
  };

  UI.moraleLabel = (m) => (m >= 80 ? 'Excelente' : m >= 65 ? 'Buena' : m >= 45 ? 'Normal' : m >= 30 ? 'Baja' : 'Muy baja');

  UI.statusPill = function (p) {
    const s = MCM.players.statusOf(p);
    if (s.code === 'inj') return '<span class="pill bad">LES ' + p.injury.weeks + 's</span>';
    if (s.code === 'sus') return '<span class="pill bad">SAN ' + p.suspension + '</span>';
    if (s.code === 'tired') return '<span class="pill warn">Cansado</span>';
    return '';
  };

  UI.playerRow = function (p, opts) {
    opts = opts || {};
    const st = MCM.players.statusOf(p);
    const attrs = 'data-act="' + (opts.act || 'player') + '" data-id="' + esc(p.id) + '"' + (opts.extra || '');
    return '<button class="prow" ' + attrs + (opts.disabled ? ' disabled' : '') + '>' +
      '<span class="pos">' + esc(opts.posLabel || p.pos) + '</span>' +
      UI.ovr(p.ovr) +
      '<span class="grow"><span class="name ellipsis" style="display:block">' + esc(p.name) + '</span>' +
      '<span class="meta">' + p.age + ' años · ' + esc(MCM.DATA.nationName(p.nat)) + (opts.meta ? ' · ' + opts.meta : '') + '</span></span>' +
      '<span class="side">' + (st.code !== 'ok' && st.code !== 'tired' ? UI.statusPill(p) : '<span class="small muted num">' + Math.round(p.fitness) + '%</span>' + UI.bar(p.fitness, 100)) + '</span>' +
      '</button>';
  };

  UI.resultFor = function (f, clubId) {
    if (!f.played) return '';
    const gf = f.home === clubId ? f.hg : f.ag;
    const ga = f.home === clubId ? f.ag : f.hg;
    return gf > ga ? 'V' : gf < ga ? 'D' : 'E';
  };
})(globalThis.MCM = globalThis.MCM || {});
