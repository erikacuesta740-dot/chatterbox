/*
 * Guardado online privado (Etapa 4) con la base de datos de claude.ai (capacidades `db` + `user`).
 *
 * - Solo funciona cuando el juego se abre dentro del visor de claude.ai con una cuenta iniciada.
 * - Cada persona guarda en su propio espacio `data/users/<su id>/`, que la plataforma mantiene privado:
 *   nadie más puede leerlo ni modificarlo (tampoco el propietario del juego).
 * - Una carrera ocupa ~2 MB en JSON: se comprime (gzip) y se divide en trozos de menos de 256 KiB.
 *   Los trozos llevan número de revisión y la ficha («meta») se escribe al final, así una subida
 *   interrumpida nunca deja una carrera a medias.
 * - IndexedDB sigue siendo la caché local (rápida y sin conexión). La nube se sincroniza en segundo plano.
 */
(function (MCM) {
  'use strict';
  const Cloud = (MCM.cloud = { status: 'off', reason: '', uid: null, name: '', canWrite: false, db: null, pending: {}, lastSync: null, listeners: [] });
  const CHUNK = 180 * 1024;

  function setStatus(st, reason) {
    Cloud.status = st;
    Cloud.reason = reason || '';
    Cloud.listeners.forEach((fn) => { try { fn(); } catch (e) { /* nada */ } });
  }
  Cloud.onChange = (fn) => Cloud.listeners.push(fn);
  Cloud.ready = () => Cloud.status === 'on';

  Cloud.init = async function () {
    if (typeof window === 'undefined' || !window.claude || typeof window.claude.use !== 'function') {
      setStatus('unavailable', 'El guardado online funciona al abrir el juego dentro de claude.ai.');
      return;
    }
    setStatus('connecting');
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) { setStatus('unavailable', 'Este visor no ofrece guardado online. Inicia sesión en claude.ai y abre el juego desde el enlace.'); return; }
      const uid = await user.id();
      if (!uid) { setStatus('unavailable', 'No hay una cuenta iniciada: las carreras se guardan solo en este dispositivo.'); return; }
      Cloud.db = db;
      Cloud.uid = uid;
      try { const me = await user.me(); Cloud.name = (me && me.name) || ''; } catch (e) { Cloud.name = ''; }
      const can = await user.can('data.write');
      Cloud.canWrite = can !== false;
      if (!Cloud.canWrite) { setStatus('readonly', 'Tu acceso a este juego es de solo lectura. Pide al propietario que te invite como editor para guardar online.'); return; }
      setStatus('on');
    } catch (e) {
      setStatus('unavailable', 'No se pudo conectar con el guardado online.');
    }
  };

  const col = () => Cloud.db.collection('data/users/' + Cloud.uid);
  const metaRef = (id) => col().doc('meta_' + id);
  const chunkRef = (id, rev, i) => col().doc('chunk_' + id + '_' + rev + '_' + i);

  // ---- compresión ----
  async function gzip(text) {
    if (typeof CompressionStream === 'undefined') return { enc: 'none', data: text };
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = new Uint8Array(await new Response(stream).arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return { enc: 'gzip64', data: btoa(bin) };
  }
  async function gunzip(enc, data) {
    if (enc === 'none') return data;
    const bin = atob(data);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  }

  async function withRetry(fn) {
    try { return await fn(); } catch (e) {
      if (e && e.code === 'unavailable') { await new Promise((r) => setTimeout(r, 400 + Math.random() * 800)); return fn(); }
      throw e;
    }
  }

  Cloud.list = async function () {
    if (!Cloud.ready()) return [];
    const snap = await withRetry(() => col().where('kind', '==', 'meta').get());
    return snap.docs.map((d) => d.data().meta).filter(Boolean);
  };

  Cloud.save = async function (state, meta) {
    if (!Cloud.ready()) return false;
    const packed = await gzip(JSON.stringify(state));
    const rev = Date.now().toString(36);
    const parts = [];
    for (let i = 0; i < packed.data.length; i += CHUNK) parts.push(packed.data.slice(i, i + CHUNK));
    const prev = await metaRef(state.id).get();
    for (let i = 0; i < parts.length; i++) {
      await withRetry(() => chunkRef(state.id, rev, i).set({ kind: 'chunk', career: state.id, rev, i, data: parts[i] }));
    }
    await withRetry(() => metaRef(state.id).set({ kind: 'meta', career: state.id, rev, chunks: parts.length, enc: packed.enc, size: packed.data.length, meta }));
    // Borrar los trozos de la revisión anterior
    if (prev.exists) {
      const p = prev.data();
      for (let i = 0; i < (p.chunks || 0); i++) { try { await chunkRef(state.id, p.rev, i).delete(); } catch (e) { /* se reintenta en la próxima subida */ } }
    }
    Cloud.lastSync = new Date().toISOString();
    return true;
  };

  Cloud.load = async function (id) {
    if (!Cloud.ready()) return null;
    const m = await withRetry(() => metaRef(id).get());
    if (!m.exists) return null;
    const meta = m.data();
    let data = '';
    for (let i = 0; i < meta.chunks; i++) {
      const c = await withRetry(() => chunkRef(id, meta.rev, i).get());
      if (!c.exists) throw new Error('La copia online de esta carrera está incompleta.');
      data += c.data().data;
    }
    return JSON.parse(await gunzip(meta.enc, data));
  };

  Cloud.remove = async function (id) {
    if (!Cloud.ready()) return;
    const m = await metaRef(id).get();
    if (m.exists) {
      const meta = m.data();
      await metaRef(id).delete();
      for (let i = 0; i < (meta.chunks || 0); i++) { try { await chunkRef(id, meta.rev, i).delete(); } catch (e) { /* huérfano inofensivo */ } }
    }
  };

  // ---- subida en segundo plano (agrupa guardados seguidos) ----
  let timer = null;
  let inflight = null;
  let queued = null;
  Cloud.schedule = function (state, delay) {
    if (!Cloud.ready()) return;
    queued = state;
    clearTimeout(timer);
    timer = setTimeout(Cloud.flush, delay == null ? 2500 : delay);
    setStatus('on');
    Cloud.dirty = true;
    Cloud.listeners.forEach((fn) => { try { fn(); } catch (e) { /* nada */ } });
  };
  Cloud.flush = async function () {
    clearTimeout(timer);
    if (!queued) return inflight;
    if (inflight) { await inflight.catch(() => {}); }
    const state = queued;
    queued = null;
    inflight = (async () => {
      try {
        await Cloud.save(state, MCM.career.meta(state));
        Cloud.dirty = !!queued;
        Cloud.error = null;
      } catch (e) {
        Cloud.error = (e && (e.code === 'quota_exceeded' ? 'Espacio online lleno: borra alguna carrera.' : e.message)) || 'Error al subir';
        queued = queued || state;
      }
      Cloud.listeners.forEach((fn) => { try { fn(); } catch (e2) { /* nada */ } });
    })();
    await inflight;
    inflight = null;
    if (queued) timer = setTimeout(Cloud.flush, 4000);
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Cloud.flush(); });
  }
})(globalThis.MCM = globalThis.MCM || {});
