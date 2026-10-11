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
    const mine = meta.host.uid === me ? meta.host : meta.guest && meta.guest.uid === me ? meta.guest : null;
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
    const meta = {
      code, rev: 1, chunks: st.chunks, enc: st.enc, status: 'lobby', leagueId, leagueName: L.name, country: L.country,
      host: { uid, name: R.myName(), clubId, club: s.clubs[clubId].name }, guest: null, hostUid: uid, guestUid: '',
      ready: {}, last: null, season: s.season.label, date: s.date, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await retry(() => roomRef(code).set(meta));
    return meta;
  };

  /* Ocupar el hueco de invitado (con bloqueo corto para que no entren dos a la vez). */
  R.join = async function (code, clubId) {
    code = R.normalize(code);
    const uid = R.uid();
    const lease = await roomRef(code).acquire({ holder: uid, ttlMs: 8000 });
    if (!lease.acquired) throw new Error('Alguien está entrando en la sala ahora mismo. Prueba otra vez.');
    const meta = await R.get(code);
    if (!meta) throw new Error('No existe ninguna sala con el código ' + code + '.');
    if (meta.host.uid === uid) throw new Error('Esta sala la creaste tú.');
    if (meta.guest && meta.guest.uid !== uid) throw new Error('La sala ya está completa.');
    if (meta.status !== 'lobby' && !(meta.guest && meta.guest.uid === uid)) throw new Error('La partida ya ha empezado.');
    if (clubId === meta.host.clubId) throw new Error('Ese club ya lo ha elegido ' + meta.host.name + '.');
    const s = await readState(meta);
    if (!s.clubs[clubId] || s.clubs[clubId].leagueId !== meta.leagueId) throw new Error('Elige un club de ' + meta.leagueName + '.');
    await retry(() => roomRef(code).update({ guest: { uid, name: R.myName(), clubId, club: s.clubs[clubId].name }, guestUid: uid, updatedAt: new Date().toISOString() }));
    return R.get(code);
  };

  /* El creador empieza la partida: añade al invitado al mundo. */
  R.start = async function (meta) {
    if (meta.host.uid !== R.uid() || !meta.guest) throw new Error('Falta tu amigo.');
    const s = await readState(meta);
    MCM.online.addHuman(s, meta.guest.clubId);
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

  R.bothReady = (meta) => !!(meta && meta.guest && meta.status === 'playing' && meta.ready && meta.ready[meta.host.uid] === meta.rev && meta.ready[meta.guest.uid] === meta.rev);

  R.tryStep = async function (code) {
    let meta = await R.get(code);
    if (!R.bothReady(meta)) return { stepped: false };
    const lease = await roomRef(code).acquire({ holder: R.uid(), ttlMs: 90000 });
    if (!lease.acquired) return { stepped: false, busy: true };
    meta = await R.get(code);
    if (!R.bothReady(meta)) return { stepped: false };
    const s = await readState(meta);
    for (const u of [meta.host, meta.guest]) {
      const o = await retry(() => ordersRef(code, u.uid).get());
      if (o.exists) MCM.online.applyOrders(s, o.data());
    }
    s.clubId = meta.host.uid === R.uid() ? meta.host.clubId : meta.guest.clubId;
    const res = MCM.online.step(s);
    const rev = meta.rev + 1;
    const st = await writeState(code, rev, s);
    await retry(() => roomRef(code).update({
      rev, chunks: st.chunks, enc: st.enc, season: s.season.label, date: s.date,
      last: { kind: res.kind, label: res.label || null, date: res.date || null, results: (res.results || []).slice(0, 12), rev }, updatedAt: new Date().toISOString(),
    }));
    dropState(code, meta.rev, meta.chunks);
    return { stepped: true, result: res };
  };

  /* Mis salas (como creador o invitado). */
  R.mine = async function () {
    const uid = R.uid();
    const a = await retry(() => db().collection('rooms').where('hostUid', '==', uid).get());
    const b = await retry(() => db().collection('rooms').where('guestUid', '==', uid).get());
    return a.docs.concat(b.docs).map((d) => d.data()).sort((x, y) => String(y.updatedAt).localeCompare(String(x.updatedAt)));
  };

  R.leave = async function (meta) {
    if (meta.host.uid === R.uid() && meta.status === 'lobby') {
      await dropState(meta.code, meta.rev, meta.chunks);
      await retry(() => roomRef(meta.code).delete());
    }
  };
})(globalThis.MCM = globalThis.MCM || {});
