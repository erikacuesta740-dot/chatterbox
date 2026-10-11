/*
 * Salas online SIN servidor propio ni cuentas: los dos móviles se conectan directamente (WebRTC con PeerJS).
 * Misma interfaz que MCM.rooms (salas de claude.ai), para que la pantalla sea la misma.
 *
 * - El primero que abre la sala la «sirve» (anfitrión de red); el otro se conecta con el código.
 * - Los dos guardan una copia completa de la partida en su móvil. Al conectarse comparan revisiones
 *   y se juega con la más reciente, así cualquiera de los dos puede volver a abrir la sala otro día.
 * - Para jugar jornadas, los dos tienen que estar conectados a la vez.
 * - Encontrarse: servidor público gratuito de PeerJS; conexión: STUN públicos de Google. Sin registro.
 */
(function (MCM) {
  'use strict';
  const P = (MCM.p2p = { inited: false });
  const PREFIX = 'mcm-carrera-';
  const PART = 11 * 1024; // PeerJS (json) rechaza mensajes de más de ~16 KB
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rooms = {};
  P._rooms = rooms; // para pruebas
  let me = { uid: null, name: 'Jugador' };
  const RU = MCM.roomUtil;

  const store = () => MCM.store;
  const peerOpts = () => (typeof window !== 'undefined' && window.MCM_PEER_OPTS) || {
    debug: 0,
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, { urls: 'stun:stun.cloudflare.com:3478' }] },
  };

  P.init = async function () {
    if (typeof window === 'undefined' || !window.Peer) return;
    let uid = await store().getSetting('p2pUid');
    if (!uid) { uid = 'p' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); await store().setSetting('p2pUid', uid); }
    me = { uid, name: (await store().getSetting('p2pName')) || 'Jugador' };
    P.inited = true;
  };
  P.available = () => P.inited && typeof window !== 'undefined' && !!window.Peer;
  P.uid = () => me.uid;
  P.myName = () => me.name;
  P.setName = async (n) => { me.name = String(n || '').trim().slice(0, 24) || 'Jugador'; await store().setSetting('p2pName', me.name); };
  P.normalize = (code) => String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  P.kind = 'p2p';

  // ---------- copia local ----------
  async function saveLocal(r) {
    await store().setSetting('p2proom:' + r.code, { meta: r.meta, packed: r.packed });
    const list = (await store().getSetting('p2prooms')) || [];
    if (!list.includes(r.code)) { list.unshift(r.code); await store().setSetting('p2prooms', list.slice(0, 30)); }
  }
  async function room(code) {
    if (!rooms[code]) {
      const saved = await store().getSetting('p2proom:' + code);
      rooms[code] = { code, meta: saved ? saved.meta : null, packed: saved ? saved.packed : null, role: null, peer: null, conns: [], conn: null, listeners: [], orders: {}, incoming: null, waiters: [], retry: null, connected: false };
    }
    return rooms[code];
  }
  function notify(r) {
    r.listeners.forEach((fn) => { try { fn(r.meta); } catch (e) { /* nada */ } });
    r.waiters = r.waiters.filter((w) => !w());
  }
  const packWorld = async (s) => MCM.cloud.pack(JSON.stringify(s));

  // ---------- red ----------
  // Cola por conexión: no se manda el siguiente mensaje hasta que el canal se ha vaciado (si no, se pierden).
  let partSeq = 0;
  function send(conn, msg) {
    if (!conn) return;
    conn._q = conn._q || [];
    const txt = JSON.stringify(msg);
    if (txt.length > 12000) {
      // Mensaje grande: se trocea y el otro lo recompone (PeerJS rechaza los de más de ~16 KB).
      const id = ++partSeq;
      const n = Math.ceil(txt.length / 12000);
      for (let i = 0; i < n; i++) conn._q.push({ t: 'part', id, i, n, d: txt.slice(i * 12000, (i + 1) * 12000) });
    } else conn._q.push(msg);
    pump(conn);
  }
  /* Recompone los mensajes troceados antes de pasarlos al manejador. */
  function receiver(conn, handle) {
    const parts = {};
    return (msg) => {
      if (!msg || msg.t !== 'part') { handle(msg); return; }
      const p = (parts[msg.id] = parts[msg.id] || { n: msg.n, got: 0, d: [] });
      if (p.d[msg.i] == null) { p.d[msg.i] = msg.d; p.got++; }
      if (p.got === p.n) { delete parts[msg.id]; handle(JSON.parse(p.d.join(''))); }
    };
  }
  function pump(conn) {
    if (conn._pumping) return;
    conn._pumping = true;
    const tick = () => {
      if (!conn.open || !conn._q.length) { conn._pumping = false; return; }
      const dc = conn.dataChannel;
      if (dc && dc.bufferedAmount > 64 * 1024) { setTimeout(tick, 15); return; }
      const msg = conn._q.shift();
      try { conn.send(msg); } catch (e) { conn._q.unshift(msg); setTimeout(tick, 50); return; }
      setTimeout(tick, 0);
    };
    tick();
  }
  function sendState(conn, r) {
    const d = r.packed.data;
    const n = Math.max(1, Math.ceil(d.length / PART));
    for (let i = 0; i < n; i++) send(conn, { t: 'state', rev: r.packed.rev, enc: r.packed.enc, i, n, part: d.slice(i * PART, (i + 1) * PART) });
  }
  function presence(r) {
    if (r.role !== 'host') return;
    r.online = [me.uid].concat(r.conns.map((c) => c.uid).filter(Boolean));
    r.conns.forEach((c) => send(c, { t: 'presence', uids: r.online }));
  }
  function broadcast(r, withState) {
    r.conns.forEach((c) => { if (withState) sendState(c, r); send(c, { t: 'meta', meta: r.meta }); });
  }
  function onState(r, msg, then) {
    if (!r.incoming || r.incoming.rev !== msg.rev) r.incoming = { rev: msg.rev, enc: msg.enc, parts: new Array(msg.n), got: 0 };
    if (r.incoming.parts[msg.i] == null) { r.incoming.parts[msg.i] = msg.part; r.incoming.got++; }
    if (r.incoming.got === msg.n) { const inc = r.incoming; r.incoming = null; then({ rev: inc.rev, enc: inc.enc, data: inc.parts.join('') }); }
  }

  function hostHandle(r, conn, msg) {
    if (msg.t === 'hello') {
      conn.uid = msg.uid;
      presence(r);
      const mine = r.meta ? r.meta.rev : 0;
      if (msg.rev > mine) { send(conn, { t: 'sendState' }); return; }
      if (r.meta) { if (msg.rev < mine) sendState(conn, r); send(conn, { t: 'meta', meta: r.meta }); }
      notify(r);
    } else if (msg.t === 'state') {
      onState(r, msg, (packed) => { r.pendingPacked = packed; });
    } else if (msg.t === 'adopt') {
      // El otro tenía una copia más reciente: se adopta la suya.
      if (r.pendingPacked && msg.meta && msg.meta.rev === r.pendingPacked.rev && (!r.meta || msg.meta.rev > r.meta.rev)) {
        r.packed = r.pendingPacked; r.meta = msg.meta; r.pendingPacked = null;
        saveLocal(r); broadcast(r, false); notify(r);
      }
    } else if (msg.t === 'join') {
      const res = hostJoin(r, msg);
      res.then((err) => send(conn, { t: 'joinResult', ok: !err, error: err || null }));
    } else if (msg.t === 'orders') {
      r.orders[msg.uid] = msg.orders;
    } else if (msg.t === 'act') {
      P.applyActs(r, msg.uid, msg.acts);
    } else if (msg.t === 'ready') {
      if (msg.orders) r.orders[msg.uid] = msg.orders;
      if (r.meta) { r.meta.ready = Object.assign({}, r.meta.ready, { [msg.uid]: r.meta.rev }); saveLocal(r); broadcast(r, false); notify(r); P.tryStep(r.code); }
    } else if (msg.t === 'unready') {
      if (r.meta) { r.meta.ready = Object.assign({}, r.meta.ready, { [msg.uid]: 0 }); saveLocal(r); broadcast(r, false); notify(r); }
    }
  }
  async function hostJoin(r, msg) {
    const m = r.meta;
    if (!m) return 'La sala no está lista.';
    if (RU.me(m, msg.uid)) return null;
    const c = RU.choose(m, msg.uid, msg.name || 'Jugador', msg.choice || { clubId: msg.clubId });
    if (c.error) return c.error;
    m.players = RU.players(m).concat([c.player]);
    m.uids = m.players.map((p) => p.uid);
    m.updatedAt = new Date().toISOString();
    await saveLocal(r);
    broadcast(r, false);
    notify(r);
    return null;
  }
  function guestHandle(r, msg) {
    if (msg.t === 'state') {
      onState(r, msg, (packed) => { r.packedIn = packed; });
    } else if (msg.t === 'meta') {
      // El anfitrión manda primero el mundo y después la ficha: así la copia y la ficha siempre cuadran.
      if (r.packedIn && r.packedIn.rev === msg.meta.rev) { r.packed = r.packedIn; r.packedIn = null; }
      r.meta = msg.meta;
      if (r.packed && r.packed.rev === r.meta.rev) saveLocal(r);
      notify(r);
    } else if (msg.t === 'sendState') {
      if (r.packed && r.meta) { sendState(r.conn, r); send(r.conn, { t: 'adopt', meta: r.meta }); }
    } else if (msg.t === 'presence') {
      r.online = msg.uids || [];
      notify(r);
    } else if (msg.t === 'joinResult') {
      const w = r.joinWaiter; r.joinWaiter = null;
      if (w) w(msg);
    }
  }

  function close(r) {
    clearTimeout(r.retry);
    try { if (r.peer) r.peer.destroy(); } catch (e) { /* nada */ }
    r.peer = null; r.conn = null; r.conns = []; r.role = null; r.connected = false;
  }

  /* Abre la sala: si tengo copia intento servirla; si ya la sirve el otro, me conecto a él. */
  P.connect = async function (code, forceGuest) {
    const r = await room(code);
    if (r.peer && !r.peer.destroyed) return r;
    const Peer = window.Peer;
    const asGuest = () => {
      r.role = 'guest';
      const peer = new Peer(undefined, peerOpts());
      r.peer = peer;
      peer.on('open', () => {
        const conn = peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
        r.conn = conn;
        conn.on('open', () => { r.connected = true; send(conn, { t: 'hello', uid: me.uid, rev: r.meta && r.packed && r.packed.rev === r.meta.rev ? r.meta.rev : 0 }); notify(r); });
        conn.on('data', receiver(conn, (msg) => guestHandle(r, msg)));
        conn.on('close', () => { r.connected = false; notify(r); if (r.listeners.length) { close(r); r.retry = setTimeout(() => P.connect(code), 4000); } });
      });
      peer.on('error', (e) => {
        r.connected = false;
        notify(r);
        if (e && e.type === 'peer-unavailable' && r.meta && r.packed && !forceGuest) {
          // Nadie sirve la sala y tengo copia: la sirvo yo.
          close(r); P.connect(code); return;
        }
        if (r.listeners.length && !r.retry) { close(r); r.retry = setTimeout(() => { r.retry = null; P.connect(code, forceGuest); }, 5000); }
      });
    };
    if (r.meta && r.packed && !forceGuest) {
      r.role = 'host';
      const peer = new Peer(PREFIX + code, peerOpts());
      r.peer = peer;
      peer.on('open', () => notify(r));
      peer.on('connection', (conn) => {
        conn.on('open', () => { r.conns.push(conn); r.connected = true; notify(r); });
        conn.on('data', receiver(conn, (msg) => hostHandle(r, conn, msg)));
        conn.on('close', () => { r.conns = r.conns.filter((c) => c !== conn); r.connected = r.conns.length > 0; presence(r); notify(r); });
      });
      peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { /* nada */ } });
      peer.on('error', (e) => {
        if (e && e.type === 'unavailable-id') { close(r); asGuest(); return; }
        if (e && (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error')) { r.connected = false; notify(r); }
      });
    } else {
      asGuest();
    }
    return r;
  };

  P.status = function (code) {
    const r = rooms[code];
    if (!r) return { role: null, connected: false, online: [] };
    const online = r.role === 'host' ? [me.uid].concat(r.conns.map((c) => c.uid).filter(Boolean)) : r.connected ? (r.online || []) : [me.uid];
    return { role: r.role, connected: !!r.connected, online };
  };

  // ---------- interfaz común con MCM.rooms ----------
  P.mine = async function () {
    const list = (await store().getSetting('p2prooms')) || [];
    const out = [];
    for (const c of list) { const s = await store().getSetting('p2proom:' + c); if (s && s.meta) out.push(s.meta); }
    return out;
  };

  P.get = async function (code) {
    code = P.normalize(code);
    const r = await room(code);
    if (r.meta) return r.meta;
    await P.connect(code, true);
    await new Promise((res) => { const t = setTimeout(res, 20000); r.waiters.push(() => { if (!r.meta) return false; clearTimeout(t); res(); return true; }); });
    return r.meta;
  };

  P.create = async function (leagueId, choice, stars) {
    let code = '';
    for (let i = 0; i < 5; i++) code += ALPHA[Math.floor(Math.random() * ALPHA.length)];
    const L0 = RU.dataset().leagues.find((l) => l.id === leagueId);
    const meta = {
      code, rev: 1, status: 'lobby', leagueId, leagueName: L0.name, country: L0.country, p2p: true, customStars: stars || 3, seed: 'room-' + code + '-' + Date.now(),
      players: [], uids: [], maxPlayers: Math.min(RU.MAX, L0.clubs.length), hostUid: me.uid,
      ready: {}, last: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const c = RU.choose(meta, me.uid, me.name, choice);
    if (c.error) throw new Error(c.error);
    meta.host = c.player;
    meta.players = [c.player];
    meta.uids = [me.uid];
    const s = RU.buildWorld(meta);
    const r = await room(code);
    const packed = await packWorld(s);
    r.packed = { rev: 1, enc: packed.enc, data: packed.data };
    r.meta = Object.assign(meta, { season: s.season.label, date: s.date });
    await saveLocal(r);
    await P.connect(code);
    return r.meta;
  };

  P.join = async function (code, choice) {
    code = P.normalize(code);
    const r = await P.connect(code, true);
    if (r.role !== 'guest' || !r.conn || !r.conn.open) throw new Error('No hay conexión con la sala. El creador tiene que tenerla abierta.');
    const res = await new Promise((resolve) => { r.joinWaiter = resolve; send(r.conn, { t: 'join', uid: me.uid, name: me.name, choice }); setTimeout(() => { if (r.joinWaiter === resolve) { r.joinWaiter = null; resolve({ ok: false, error: 'La sala no responde.' }); } }, 15000); });
    if (!res.ok) throw new Error(res.error || 'No se pudo entrar');
    return r.meta;
  };

  P.subscribe = function (code, fn) {
    let alive = true;
    let ref = null;
    room(code).then((r) => {
      if (!alive) return;
      ref = r;
      r.listeners.push(fn);
      if (r.meta) fn(r.meta);
      P.connect(code);
    });
    return () => { alive = false; if (ref) { ref.listeners = ref.listeners.filter((f) => f !== fn); if (!ref.listeners.length) close(ref); } };
  };

  P.loadWorld = async function (meta) {
    const r = await room(meta.code);
    if (!r.packed || r.packed.rev !== meta.rev) throw new Error('Esperando la partida…');
    const s = JSON.parse(await MCM.cloud.unpack(r.packed.enc, r.packed.data));
    s.online = Object.assign({}, s.online || {}, { code: meta.code, rev: meta.rev, p2p: true });
    const mine = RU.me(meta, me.uid);
    if (mine) MCM.online.viewAs(s, mine.clubId);
    s.id = 'online-' + meta.code;
    return s;
  };

  async function commit(r, s, extra) {
    const packed = await packWorld(s);
    const rev = r.meta.rev + 1;
    r.packed = { rev, enc: packed.enc, data: packed.data };
    r.meta = Object.assign({}, r.meta, { rev, season: s.season.label, date: s.date, updatedAt: new Date().toISOString() }, extra || {});
    await saveLocal(r);
    broadcast(r, true);
    notify(r);
  }

  P.start = async function (meta) {
    const r = await room(meta.code);
    if (meta.host.uid !== me.uid) throw new Error('Solo quien creó la sala puede empezar.');
    if (RU.players(r.meta).length < 2) throw new Error('Falta al menos un amigo.');
    if (r.role !== 'host') throw new Error('Abre la sala desde este móvil para empezar.');
    const s = RU.buildWorld(r.meta);
    await commit(r, s, { status: 'playing' });
  };

  P.saveOrders = async function (code, orders) {
    const r = await room(code);
    if (r.role === 'host') r.orders[me.uid] = orders;
    else send(r.conn, { t: 'orders', uid: me.uid, orders });
  };

  P.ready = async function (meta, orders) {
    const r = await room(meta.code);
    if (r.role !== 'host' && !r.connected) throw new Error('No hay conexión con la sala. Quien la sirve tiene que tenerla abierta.');
    if (r.role === 'host') {
      r.orders[me.uid] = orders;
      r.meta.ready = Object.assign({}, r.meta.ready, { [me.uid]: r.meta.rev });
      await saveLocal(r);
      broadcast(r, false);
      notify(r);
      return P.tryStep(meta.code);
    }
    send(r.conn, { t: 'ready', uid: me.uid, rev: meta.rev, orders });
    return { stepped: false };
  };
  P.unready = async function (meta) {
    const r = await room(meta.code);
    if (r.role === 'host') { r.meta.ready = Object.assign({}, r.meta.ready, { [me.uid]: 0 }); await saveLocal(r); broadcast(r, false); notify(r); }
    else send(r.conn, { t: 'unready', uid: me.uid });
  };

  P.bothReady = RU.allReady;

  /*
   * Fichajes al momento: quien sirve la sala aplica las operaciones de mercado y publica una revisión nueva
   * (sin jugar nada). Se reaplican las tácticas guardadas de todos; quien estaba «Listo» lo sigue estando.
   */
  let acting = Promise.resolve();
  P.applyActs = function (r, uid, acts) {
    acting = acting.then(async () => {
      if (!r.meta || r.meta.status !== 'playing' || !r.packed) return;
      const u = RU.me(r.meta, uid);
      if (!u) return;
      while (stepping) await new Promise((res) => setTimeout(res, 200));
      const s = JSON.parse(await MCM.cloud.unpack(r.packed.enc, r.packed.data));
      s.online = Object.assign({}, s.online || {}, { code: r.code, rev: r.meta.rev, p2p: true });
      MCM.online.viewAs(s, (RU.me(r.meta, me.uid) || r.meta.host).clubId);
      if (!(acts || []).some((b) => b && b.seq > MCM.online.lastSeq(s, u.clubId))) return;
      RU.players(r.meta).forEach((x) => { if (r.orders[x.uid]) MCM.online.applyOrders(s, Object.assign({}, r.orders[x.uid], { acts: [] })); });
      MCM.online.applyActs(s, u.clubId, acts);
      MCM.online.viewAs(s, s.clubId);
      const old = r.meta.rev;
      const ready = {};
      Object.keys(r.meta.ready || {}).forEach((k) => { ready[k] = r.meta.ready[k] === old ? old + 1 : 0; });
      await commit(r, s, { ready });
    }).catch(() => {});
    return acting;
  };
  P.act = async function (code, acts) {
    const r = await room(code);
    if (r.role === 'host') { await P.applyActs(r, me.uid, acts); return { applied: true }; }
    if (!r.conn || !r.conn.open) return { applied: false };
    send(r.conn, { t: 'act', uid: me.uid, acts });
    return { applied: true };
  };

  let stepping = false;
  P.tryStep = async function (code) {
    const r = await room(code);
    if (r.role !== 'host' || stepping || !P.bothReady(r.meta)) return { stepped: false };
    stepping = true;
    await acting;
    try {
      const s = JSON.parse(await MCM.cloud.unpack(r.packed.enc, r.packed.data));
      s.online = Object.assign({}, s.online || {}, { code, rev: r.meta.rev, p2p: true });
      MCM.online.viewAs(s, (RU.me(r.meta, me.uid) || r.meta.host).clubId);
      RU.players(r.meta).forEach((u) => { if (r.orders[u.uid]) MCM.online.applyOrders(s, r.orders[u.uid]); });
      const res = MCM.online.step(s);
      MCM.online.viewAs(s, s.clubId);
      await commit(r, s, { last: { kind: res.kind, label: res.label || null, date: res.date || null, results: RU.lastResults(res), rev: r.meta.rev + 1 } });
      return { stepped: true, result: res };
    } finally { stepping = false; }
  };

  P.leave = async function (meta) {
    const r = await room(meta.code);
    close(r);
    await store().setSetting('p2proom:' + meta.code, null);
    const list = ((await store().getSetting('p2prooms')) || []).filter((c) => c !== meta.code);
    await store().setSetting('p2prooms', list);
    delete rooms[meta.code];
  };
})(globalThis.MCM = globalThis.MCM || {});
