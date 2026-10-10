/*
 * Registro de valores de mercado de EA SPORTS FC 27, con procedencia.
 *
 * - Es independiente de las carreras: actualizarlo nunca modifica ni borra una carrera guardada.
 * - El valor importado se guarda tal cual (número entero + texto original de la fuente). No se redondea.
 * - Nada en el juego calcula este valor: solo llega por importación. Si un jugador no tiene entrada, es «No verificado».
 * - El precio que pida un club, las ofertas o las cesiones son cantidades distintas y nunca escriben aquí.
 */
(function (MCM) {
  'use strict';
  const V = (MCM.values = {});

  V.EDITION = 'FC 27';
  V.SETTING_KEY = 'fc27Values';
  V.db = { entries: {}, imports: [] };

  const EDITION_RE = /^\s*(ea\s*sports\s*)?fc\s*27\s*$/i;
  V.isFc27 = (s) => EDITION_RE.test(String(s || ''));

  V.normName = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  const SYMBOLS = { '€': 'EUR', '£': 'GBP', '$': 'USD' };

  /*
   * Convierte un importe al entero exacto que expresa la fuente.
   * Acepta números o textos como «85.000.000 €», «€85,000,000», «€85.5M», «850K €».
   * Devuelve { value, currency } o { error }.
   */
  V.parseAmount = function (input, fallbackCurrency) {
    if (typeof input === 'number') {
      if (!Number.isFinite(input) || input < 0 || !Number.isInteger(input)) return { error: 'importe no válido: ' + input };
      return { value: input, currency: fallbackCurrency || null };
    }
    let s = String(input == null ? '' : input).trim();
    if (!s) return { error: 'importe vacío' };
    let currency = fallbackCurrency || null;
    Object.keys(SYMBOLS).forEach((sym) => { if (s.includes(sym)) currency = SYMBOLS[sym]; });
    const code = s.match(/\b(EUR|GBP|USD)\b/i);
    if (code) currency = code[1].toUpperCase();
    s = s.replace(/[€£$]|\b(EUR|GBP|USD)\b/gi, '').replace(/\s+/g, '');
    const suf = s.match(/^([0-9]+(?:[.,][0-9]+)?)([MK])$/i);
    if (suf) {
      // Cifra abreviada: la precisión es la que da la fuente (se conserva también el texto original).
      const n = Number(suf[1].replace(',', '.'));
      const mult = suf[2].toUpperCase() === 'M' ? 1e6 : 1e3;
      const v = Math.round(n * mult);
      if (!Number.isFinite(v)) return { error: 'importe no válido: ' + input };
      return { value: v, currency, abbreviated: true };
    }
    if (!/^[0-9]{1,3}([., ' ][0-9]{3})*$|^[0-9]+$/.test(s)) return { error: 'formato de importe no reconocido: ' + input };
    const v = Number(s.replace(/[., ' ]/g, ''));
    if (!Number.isFinite(v)) return { error: 'importe no válido: ' + input };
    return { value: v, currency };
  };

  // Formato exacto, sin abreviar ni redondear: 85000000 EUR -> «85.000.000 €»
  V.formatExact = function (value, currency) {
    const n = String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const sym = { EUR: '€', GBP: '£', USD: '$' }[currency] || currency || '';
    return n + ' ' + sym;
  };

  function parseCsv(text) {
    const rows = [];
    let row = []; let cell = ''; let q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',' || ch === ';') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
  }

  /*
   * Lee un archivo de valores (JSON o CSV). No toca la base: devuelve lo que se importaría y los rechazos.
   * JSON: { edition, source, sourceUrl, retrievedAt, currency, verified, players:[{ id, name, club, value, raw, currency, verified }] }
   * CSV (cabecera obligatoria): id,name,club,value,currency,edition,source,sourceUrl,retrievedAt,verified
   */
  V.parse = function (text) {
    const out = { meta: {}, entries: [], rejected: [], errors: [] };
    text = String(text || '').replace(/^﻿/, '').trim();
    if (!text) { out.errors.push('El archivo está vacío.'); return out; }
    let meta = {}; let list = [];
    if (text[0] === '{' || text[0] === '[') {
      let data;
      try { data = JSON.parse(text); } catch (e) { out.errors.push('JSON no válido: ' + e.message); return out; }
      if (Array.isArray(data)) list = data; else { meta = data; list = data.players || []; }
    } else {
      const rows = parseCsv(text);
      const head = (rows.shift() || []).map((h) => h.trim());
      ['id', 'name', 'value', 'edition', 'source'].forEach((k) => { if (head.indexOf(k) < 0) out.errors.push('Falta la columna «' + k + '» en el CSV.'); });
      if (out.errors.length) return out;
      list = rows.map((r) => { const o = {}; head.forEach((h, i) => { o[h] = (r[i] || '').trim(); }); return o; });
    }
    out.meta = {
      edition: meta.edition || null, source: meta.source || null, sourceUrl: meta.sourceUrl || null,
      retrievedAt: meta.retrievedAt || null, currency: meta.currency || null, verified: meta.verified === true,
    };
    if (meta.edition && !V.isFc27(meta.edition)) {
      out.errors.push('El archivo declara la edición «' + meta.edition + '». Solo se aceptan valores de FC 27.');
      return out;
    }
    const seen = new Set();
    list.forEach((raw, i) => {
      const line = 'Entrada ' + (i + 1) + (raw && raw.name ? ' (' + raw.name + ')' : '');
      const reject = (why) => out.rejected.push({ line, reason: why });
      if (!raw || typeof raw !== 'object') return reject('formato no válido');
      const edition = raw.edition || out.meta.edition;
      if (!edition) return reject('sin edición: no se puede confirmar que sea FC 27');
      if (!V.isFc27(edition)) return reject('edición «' + edition + '», no FC 27');
      const id = String(raw.id == null ? '' : raw.id).trim();
      if (!id) return reject('sin identificador único');
      if (seen.has(id)) return reject('identificador duplicado en el archivo: ' + id);
      if (!raw.name) return reject('sin nombre');
      const source = raw.source || out.meta.source;
      if (!source) return reject('sin fuente');
      if (raw.value == null || raw.value === '') return reject('sin valor de mercado (no se rellena con estimaciones)');
      const amt = V.parseAmount(raw.value, raw.currency || out.meta.currency);
      if (amt.error) return reject(amt.error);
      if (!amt.currency) return reject('moneda desconocida');
      seen.add(id);
      const verified = raw.verified === true || raw.verified === 'true' || raw.verified === '1' || (raw.verified == null && out.meta.verified);
      out.entries.push({
        id, name: String(raw.name).trim(), club: raw.club ? String(raw.club).trim() : '',
        value: amt.value, currency: amt.currency,
        raw: typeof raw.raw === 'string' && raw.raw ? raw.raw : (typeof raw.value === 'string' ? raw.value : V.formatExact(amt.value, amt.currency)),
        abbreviated: !!amt.abbreviated,
        edition: V.EDITION, source: String(source), sourceUrl: raw.sourceUrl || out.meta.sourceUrl || '',
        retrievedAt: raw.retrievedAt || out.meta.retrievedAt || '',
        status: verified ? 'verified' : 'unverified',
      });
    });
    return out;
  };

  /* Combina entradas en la base sin duplicar: misma id = actualización de esa misma entrada. */
  V.merge = function (db, entries, importedAt) {
    const report = { added: 0, updated: 0, unchanged: 0 };
    entries.forEach((e) => {
      const prev = db.entries[e.id];
      const next = Object.assign({}, e, { importedAt });
      if (!prev) { db.entries[e.id] = next; report.added++; return; }
      const same = prev.value === e.value && prev.currency === e.currency && prev.source === e.source && prev.status === e.status && prev.raw === e.raw;
      if (same) { report.unchanged++; return; }
      next.previous = { value: prev.value, currency: prev.currency, raw: prev.raw, source: prev.source, importedAt: prev.importedAt };
      db.entries[e.id] = next;
      report.updated++;
    });
    db.imports.unshift({ at: importedAt, count: entries.length, added: report.added, updated: report.updated });
    if (db.imports.length > 20) db.imports.length = 20;
    return report;
  };

  // Índice por nombre + club, solo para jugadores importados que no traen identificador externo.
  let nameIndex = null;
  function buildNameIndex() {
    nameIndex = {};
    Object.values(V.db.entries).forEach((e) => {
      const k = V.normName(e.name) + '|' + V.normName(e.club);
      nameIndex[k] = nameIndex[k] ? 'AMBIGUOUS' : e;
    });
  }
  V.setDb = function (db) { V.db = db && db.entries ? db : { entries: {}, imports: [] }; nameIndex = null; };

  /*
   * Valor FC 27 de un jugador de la carrera. Solo jugadores importados (no ficticios) pueden tener uno.
   * Devuelve { entry, match } o null.
   */
  V.lookup = function (p, clubName) {
    if (!p || p.demo) return null;
    if (p.extId && V.db.entries[p.extId]) return { entry: V.db.entries[p.extId], match: 'id' };
    if (!clubName) return null;
    if (!nameIndex) buildNameIndex();
    const e = nameIndex[V.normName(p.name) + '|' + V.normName(clubName)];
    return e && e !== 'AMBIGUOUS' ? { entry: e, match: 'nombre+club' } : null;
  };

  V.careerStats = function (s) {
    const st = { total: 0, verified: 0, imported: 0, missing: 0, fictional: 0 };
    Object.values(s.players).forEach((p) => {
      st.total++;
      if (p.demo) { st.fictional++; st.missing++; return; }
      const r = V.lookup(p, p.clubId && s.clubs[p.clubId] ? s.clubs[p.clubId].name : '');
      if (!r) st.missing++;
      else if (r.entry.status === 'verified') st.verified++;
      else st.imported++;
    });
    return st;
  };

  V.dbStats = function () {
    const all = Object.values(V.db.entries);
    return { total: all.length, verified: all.filter((e) => e.status === 'verified').length, unverified: all.filter((e) => e.status !== 'verified').length };
  };

  V.load = async function () {
    try { V.setDb(await MCM.store.getSetting(V.SETTING_KEY)); } catch (e) { V.setDb(null); }
  };
  V.save = () => MCM.store.setSetting(V.SETTING_KEY, V.db);
})(globalThis.MCM = globalThis.MCM || {});
