/*
 * Almacenamiento de carreras.
 * Etapa 1: guardado LOCAL en el navegador (IndexedDB, con localStorage como respaldo).
 * Esto NO es un guardado online: los datos solo existen en este dispositivo y navegador.
 * La interfaz es asíncrona para poder cambiar a un proveedor en la nube (Etapa 4) sin tocar el juego.
 */
(function (MCM) {
  'use strict';
  const DB_NAME = 'modo-carrera-manager';
  const DB_VERSION = 1;

  function idbOpen() {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB no disponible')); return; }
      let req;
      try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { reject(e); return; }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('careers')) db.createObjectStore('careers', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('Base de datos bloqueada'));
    });
  }

  function tx(db, stores, mode, fn) {
    return new Promise((resolve, reject) => {
      const t = db.transaction(stores, mode);
      let out;
      t.oncomplete = () => resolve(out);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('Transacción abortada'));
      out = fn(t);
    });
  }
  const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  function IdbProvider(db) {
    return {
      kind: 'indexeddb',
      label: 'Este dispositivo (IndexedDB)',
      async list() { return reqP(db.transaction('meta').objectStore('meta').getAll()); },
      async load(id) { return reqP(db.transaction('careers').objectStore('careers').get(id)); },
      async save(state, meta) {
        return tx(db, ['meta', 'careers'], 'readwrite', (t) => {
          t.objectStore('careers').put(state);
          t.objectStore('meta').put(meta);
        });
      },
      async remove(id) {
        return tx(db, ['meta', 'careers'], 'readwrite', (t) => {
          t.objectStore('careers').delete(id);
          t.objectStore('meta').delete(id);
        });
      },
      async putMeta(meta) { return tx(db, ['meta'], 'readwrite', (t) => t.objectStore('meta').put(meta)); },
      async getSetting(key) { const r = await reqP(db.transaction('settings').objectStore('settings').get(key)); return r ? r.value : undefined; },
      async setSetting(key, value) { return tx(db, ['settings'], 'readwrite', (t) => { t.objectStore('settings').put({ key, value }); }); },
    };
  }

  function LocalProvider() {
    const ls = globalThis.localStorage;
    const K = 'mcm:';
    const read = (k) => { try { const v = ls.getItem(K + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
    const write = (k, v) => ls.setItem(K + k, JSON.stringify(v));
    return {
      kind: 'localstorage',
      label: 'Este dispositivo (localStorage, espacio limitado)',
      async list() { return read('index') || []; },
      async load(id) { return read('career:' + id); },
      async save(state, meta) {
        write('career:' + state.id, state);
        const idx = (read('index') || []).filter((m) => m.id !== meta.id);
        idx.push(meta);
        write('index', idx);
      },
      async remove(id) {
        ls.removeItem(K + 'career:' + id);
        write('index', (read('index') || []).filter((m) => m.id !== id));
      },
      async putMeta(meta) { const idx = (read('index') || []).filter((m) => m.id !== meta.id); idx.push(meta); write('index', idx); },
      async getSetting(key) { const v = read('set:' + key); return v == null ? undefined : v; },
      async setSetting(key, value) { write('set:' + key, value); },
    };
  }

  function MemoryProvider() {
    const careers = {}; const metas = {}; const settings = {};
    return {
      kind: 'memory',
      label: 'Memoria temporal (se pierde al cerrar)',
      async list() { return Object.values(metas); },
      async load(id) { return careers[id] ? JSON.parse(careers[id]) : null; },
      async save(state, meta) { careers[state.id] = JSON.stringify(state); metas[meta.id] = meta; },
      async remove(id) { delete careers[id]; delete metas[id]; },
      async putMeta(meta) { metas[meta.id] = meta; },
      async getSetting(key) { return settings[key]; },
      async setSetting(key, value) { settings[key] = value; },
    };
  }

  const Store = (MCM.store = { provider: null });

  Store.init = async function () {
    try {
      const db = await idbOpen();
      Store.provider = IdbProvider(db);
    } catch (e) {
      try {
        globalThis.localStorage.setItem('mcm:probe', '1');
        globalThis.localStorage.removeItem('mcm:probe');
        Store.provider = LocalProvider();
      } catch (e2) {
        Store.provider = MemoryProvider();
      }
    }
    return Store.provider;
  };

  Store.useProvider = (p) => { Store.provider = p; };
  Store.MemoryProvider = MemoryProvider;

  // ---- Lista, carga, guardado y borrado: caché local + nube privada cuando está disponible ----
  const Cloud = () => MCM.cloud;
  const cloudOn = () => !!(Cloud() && Cloud().ready());

  Store.list = async () => {
    const local = (await Store.provider.list()) || [];
    let out;
    if (cloudOn()) {
      const uid = Cloud().uid;
      let remote = [];
      try { remote = await Cloud().list(); } catch (e) { remote = []; Store.cloudListError = true; }
      const byId = {};
      local.filter((m) => !m.ownerUid || m.ownerUid === uid).forEach((m) => {
        byId[m.id] = Object.assign({}, m, { where: m.ownerUid ? 'pending' : 'device' });
      });
      remote.forEach((m) => {
        const l = byId[m.id];
        if (!l) byId[m.id] = Object.assign({}, m, { where: 'cloud' });
        else byId[m.id] = Object.assign({}, String(l.updatedAt) >= String(m.updatedAt) ? l : m, { where: 'both', cloudUpdatedAt: m.updatedAt });
      });
      out = Object.values(byId);
    } else {
      out = local.map((m) => Object.assign({}, m, { where: 'device' }));
    }
    return out.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  };

  Store.load = async (id) => {
    const local = await Store.provider.load(id);
    if (cloudOn()) {
      const metas = await Store.list();
      const m = metas.find((x) => x.id === id);
      const cloudNewer = m && (m.where === 'cloud' || (m.where === 'both' && (!local || String(m.cloudUpdatedAt) > String(local.updatedAt))));
      if (cloudNewer) {
        const remote = await Cloud().load(id);
        if (remote) { await Store.provider.save(remote, MCM.career.meta(remote)); return remote; }
      }
    }
    return local;
  };

  Store.save = async (state) => {
    state.updatedAt = new Date().toISOString();
    if (cloudOn() && !state.ownerUid) state.ownerUid = Cloud().uid;
    await Store.provider.save(state, MCM.career.meta(state));
    if (cloudOn() && state.ownerUid === Cloud().uid) Cloud().schedule(state);
  };

  Store.remove = async (id) => {
    await Store.provider.remove(id);
    if (cloudOn()) await Cloud().remove(id);
  };

  /** Una carrera guardada antes de tener cuenta pasa a la cuenta actual y se sube. */
  Store.adopt = async (id) => {
    const s = await Store.provider.load(id);
    if (!s || !cloudOn()) return null;
    s.ownerUid = Cloud().uid;
    if (Cloud().name) s.owner = Cloud().name;
    await Store.save(s);
    await Cloud().flush();
    return s;
  };

  Store.rename = async (id, name) => {
    const s = await Store.load(id);
    if (!s) throw new Error('Carrera no encontrada');
    s.name = name;
    await Store.save(s);
    return s;
  };
  Store.getSetting = (k) => Store.provider.getSetting(k);
  Store.setSetting = (k, v) => Store.provider.setSetting(k, v);
})(globalThis.MCM = globalThis.MCM || {});
