/*
 * Salas online (modo «contra un amigo») sobre la base de datos compartida de claude.ai.
 *
 * Documentos:
 *   rooms/<CÓDIGO>                 ficha de la sala (jugadores, estado, revisión, quién está listo)
 *   rooms/<CÓDIGO>/state/<rev>_<i>  el mundo compartido, comprimido y en trozos (< 256 KiB)
 *   rooms/<CÓDIGO>/orders/<uid>     táctica, once y lanzadores de cada jugador
 *
 * Avance: cada jugador pulsa «Listo» (guarda sus órdenes y marca ready[uid] = rev). Cuando los dos
 * están listos para la misma revisión, el último en pulsar toma un bloqueo corto de la sala, aplica
 * las órdenes, juega hasta el siguiente partido de cualquiera de los dos y sube la revisión nueva.
 */
(function (MCM) {
  'use strict';
  /* Utilidades comunes a las dos formas de jugar online (claude.ai y conexión directa). */
  const RU = (MCM.roomUtil = {});
  RU.MAX = 22;
  /* Jugadores de la sala (las salas antiguas tenían «host» y «guest»). */
  RU.players = (m) => (m ? (m.players && m.players.length ? m.players : [m.host, m.guest].filter(Boolean)) : []);
  RU.me = (m, uid) => RU.players(m).find((p) => p.uid === uid) || null;
  RU.allReady = (m) => !!(m && m.status === 'playing' && RU.players(m).length >= 2 && RU.players(m).every((p) => m.ready && m.ready[p.uid] === m.rev));
  RU.maxPlayers = (m) => (m && m.maxPlayers) || 2;
  /* Valida un jugador nuevo; devuelve un texto de error o null. */
  RU.joinError = function (m, uid, clubId, s) {
    const ps = RU.players(m);
    if (ps.some((p) => p.uid === uid)) return null;
    if (m.status !== 'lobby') return 'La partida ya ha empezado.';
    if (ps.length >= RU.maxPlayers(m)) return 'La sala ya está completa (' + RU.maxPlayers(m) + ' jugadores).';
    const taken = ps.find((p) => p.clubId === clubId);
    if (taken) return 'Ese club ya lo ha elegido ' + taken.name + '.';
    if (!s.clubs[clubId] || s.clubs[clubId].leagueId !== m.leagueId) return 'Elige un club de ' + m.leagueName + '.';
    return null;
  };
  RU.lastResults = (res) => (res.results || []).slice(0, 30);

  const R = (MCM.rooms = {});
  const Cloud = () => MCM.cloud;
  const CHUNK = 180 * 1024;
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  R.available = () => Cloud().ready();
  const db = () => Cloud().db;
  const roomRef = (code) => db().doc('rooms/' + code);
  const stateCol = (code) => db().collection('rooms/' + code + '/state');
  const ordersRef = (code, uid) => db().doc('rooms/' + code + '/orders/' + uid);
  const retry = (fn) => Cloud().retry(fn);
  R.uid = () => Cloud().uid;
  R.myName = () => Cloud().name || 'Jugador';

  function newCode() {
    let c = '';
    for (let i = 0; i < 5; i++) c += ALPHA[Math.floor(Math.random() * ALPHA.length)];
    return c;
  }
  R.normalize = (code) => String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

  // ---- mundo compartido ----
  async function writeState(code, rev, s) {
    const packed = await Cloud().pack(JSON.stringify(s));
    const parts = [];
    for (let i = 0; i < packed.data.length; i += CHUNK) parts.push(packed.data.slice(i, i + CHUNK));
    for (let i = 0; i < parts.length; i++) await retry(() => stateCol(code).doc(rev + '_' + i).set({ d: parts[i] }));
    return { chunks: parts.length, enc: packed.enc };
  }
  async function readState(meta) {
    let data = '';
    for (let i = 0; i < meta.chunks; i++) {
      const snap = await retry(() => stateCol(meta.code).doc(meta.rev + '_' + i).get());
      if (!snap.exists) throw new Error('La sala está guardándose. Vuelve a intentarlo en unos segundos.');
      data += snap.data().d;
    }
    return JSON.parse(await Cloud().unpack(meta.enc, data));
  }
  async function dropState(code, rev, chunks) {
    for (let i = 0; i < (chunks || 4); i++) { try { await stateCol(code).doc(rev + '_' + i).delete(); } catch (e) { /* nada */ } }
  }

  R.get = async function (code) {
    const snap = await retry(() => roomRef(R.normalize(code)).get());
    return snap.exists ? snap.data() : null;
  };
  R.subscribe = function (code, fn, onError) {
    return roomRef(code).onSnapshot((snap) => fn(snap.exists ? snap.data() : null), (e) => onError && onError(e));
  };
  /* Carga el mundo de la revisión actual, visto desde mi club. */
  R.loadWorld = async function (meta) {
    const s = await readState(meta);
    const me = R.uid();
    const mine = RU.me(meta, me);
    if (mine) s.clubId = mine.clubId;
    s.online = Object.assign({}, s.online || {}, { code: meta.code, rev: meta.rev });
    s.id = 'online-' + meta.code;
    return s;
  };

  // ---- salas ----
  R.create = async function (leagueId, clubId) {
    const uid = R.uid();
    let code = newCode();
    for (let i = 0; i < 5 && (await R.get(code)); i++) code = newCode();
    const s = MCM.online.createWorld({ leagueId, clubId, seed: 'room-' + code + '-' + Date.now(), code, name: R.myName() });
    const st = await writeState(code, 1, s);
    const L = s.leagues[leagueId];
    const host = { uid, name: R.myName(), clubId, club: s.clubs[clubId].name };
    const meta = {
      code, rev: 1, chunks: st.chunks, enc: st.enc, status: 'lobby', leagueId, leagueName: L.name, country: L.country,
      host, players: [host], uids: [uid], maxPlayers: Math.min(RU.MAX, L.clubIds.length), hostUid: uid,
      ready: {}, last: null, season: s.season.label, date: s.date, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await retry(() => roomRef(code).set(meta));
    return meta;
  };

  /* Ocupar el hueco de invitado (con bloqueo corto para que no entren dos a la vez). */
  R.join = async function (code, clubId) {
    code = R.normalize(code);
    const uid = R.uid();
    // Bloqueo corto para que dos no cojan el mismo club a la vez (se reintenta si otro está entrando).
    let lease = { acquired: false };
    for (let i = 0; i < 8 && !lease.acquired; i++) {
      lease = await roomRef(code).acquire({ holder: uid, ttlMs: 3000 });
      if (!lease.acquired) await new Promise((r) => setTimeout(r, 1000));
    }
    if (!lease.acquired) throw new Error('Hay alguien entrando en la sala ahora mismo. Prueba otra vez.');
    const meta = await R.get(code);
    if (!meta) throw new Error('No existe ninguna sala con el código ' + code + '.');
    if (RU.me(meta, uid)) return meta;
    const s = await readState(meta);
    const err = RU.joinError(meta, uid, clubId, s);
    if (err) throw new Error(err);
    const players = RU.players(meta).concat([{ uid, name: R.myName(), clubId, club: s.clubs[clubId].name }]);
    await retry(() => roomRef(code).update({ players, uids: players.map((p) => p.uid), updatedAt: new Date().toISOString() }));
    return R.get(code);
  };

  /* El creador empieza la partida: añade a todos los jugadores al mundo. */
  R.start = async function (meta) {
    if (meta.host.uid !== R.uid()) throw new Error('Solo quien creó la sala puede empezar.');
    if (RU.players(meta).length < 2) throw new Error('Falta al menos un amigo.');
    const s = await readState(meta);
    RU.players(meta).forEach((p) => MCM.online.addHuman(s, p.clubId));
    const rev = meta.rev + 1;
    const st = await writeState(meta.code, rev, s);
    await retry(() => roomRef(meta.code).update({ rev, chunks: st.chunks, enc: st.enc, status: 'playing', updatedAt: new Date().toISOString() }));
    dropState(meta.code, meta.rev, meta.chunks);
  };

  R.saveOrders = async function (code, orders) {
    await retry(() => ordersRef(code, R.uid()).set(Object.assign({}, orders, { at: new Date().toISOString() })));
  };

  /* Marcar «Listo» (con mis órdenes) y, si el otro también lo está, avanzar. */
  R.ready = async function (meta, orders) {
    await R.saveOrders(meta.code, orders);
    await retry(() => roomRef(meta.code).update({ ready: { [R.uid()]: meta.rev }, updatedAt: new Date().toISOString() }));
    return R.tryStep(meta.code);
  };
  R.unready = async function (meta) {
    await retry(() => roomRef(meta.code).update({ ready: { [R.uid()]: 0 } }));
  };

  R.bothReady = RU.allReady;

  R.tryStep = async function (code) {
    let meta = await R.get(code);
    if (!R.bothReady(meta)) return { stepped: false };
    const lease = await roomRef(code).acquire({ holder: R.uid(), ttlMs: 90000 });
    if (!lease.acquired) return { stepped: false, busy: true };
    meta = await R.get(code);
    if (!R.bothReady(meta)) return { stepped: false };
    const s = await readState(meta);
    for (const u of RU.players(meta)) {
      const o = await retry(() => ordersRef(code, u.uid).get());
      if (o.exists) MCM.online.applyOrders(s, o.data());
    }
    s.clubId = (RU.me(meta, R.uid()) || meta.host).clubId;
    const res = MCM.online.step(s);
    const rev = meta.rev + 1;
    const st = await writeState(code, rev, s);
    await retry(() => roomRef(code).update({
      rev, chunks: st.chunks, enc: st.enc, season: s.season.label, date: s.date,
      last: { kind: res.kind, label: res.label || null, date: res.date || null, results: RU.lastResults(res), rev }, updatedAt: new Date().toISOString(),
    }));
    dropState(code, meta.rev, meta.chunks);
    return { stepped: true, result: res };
  };

  /* Mis salas (como creador o invitado). */
  R.mine = async function () {
    const uid = R.uid();
    const a = await retry(() => db().collection('rooms').where('uids', 'array-contains', uid).get());
    const b = await retry(() => db().collection('rooms').where('guestUid', '==', uid).get()); // salas antiguas
    const seen = {};
    return a.docs.concat(b.docs).map((d) => d.data()).filter((m) => (seen[m.code] ? false : (seen[m.code] = true))).sort((x, y) => String(y.updatedAt).localeCompare(String(x.updatedAt)));
  };

  R.leave = async function (meta) {
    if (meta.host.uid === R.uid() && meta.status === 'lobby') {
      await dropState(meta.code, meta.rev, meta.chunks);
      await retry(() => roomRef(meta.code).delete());
    }
  };
})(globalThis.MCM = globalThis.MCM || {});
