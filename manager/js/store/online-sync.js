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
  let dsCache = null;
  RU.dataset = () => (dsCache = dsCache || MCM.DATA.realDataset());
  RU.leagueClubs = (leagueId) => {
    const L = RU.dataset().leagues.find((l) => l.id === leagueId);
    return L ? L.clubs.map((c) => (Array.isArray(c) ? { id: MCM.util.slug(c[0]), name: c[0], rep: c[2] } : { id: c.id || MCM.util.slug(c.name), name: c.name, rep: c.rep })) : [];
  };
  /* Clubes ya cogidos (y plazas ocupadas por clubes creados). */
  RU.takenIds = (m) => [].concat(...RU.players(m).map((p) => [p.clubId].concat(p.custom ? [p.custom.replaces] : [])));
  RU.customs = (m) => RU.players(m).filter((p) => p.custom).map((p) => p.custom);
  /*
   * Elección de un jugador: { clubId } (club existente) o { custom: { name, short, stadium, c1, c2 } }.
   * Devuelve { error } o { player }.
   */
  RU.choose = function (m, uid, name, choice) {
    const ps = RU.players(m);
    const already = ps.find((p) => p.uid === uid);
    if (already) return { player: already };
    if (m.status !== 'lobby') return { error: 'La partida ya ha empezado.' };
    if (ps.length >= RU.maxPlayers(m)) return { error: 'La sala ya está completa (' + RU.maxPlayers(m) + ' jugadores).' };
    const taken = RU.takenIds(m);
    const clubs = RU.leagueClubs(m.leagueId);
    if (choice && choice.custom) {
      const def = MCM.generator.customClubDef(Object.assign({}, choice.custom, { stars: m.customStars || 3 }));
      if (!String(choice.custom.name || '').trim()) return { error: 'Ponle un nombre a tu club.' };
      if (taken.includes(def.id) || clubs.some((c) => MCM.util.slug(c.name) === MCM.util.slug(def.name))) return { error: 'Ya hay un club con ese nombre.' };
      const replaces = MCM.generator.weakestFree(RU.dataset(), m.leagueId, taken);
      if (!replaces) return { error: 'No quedan plazas en la liga.' };
      return { player: { uid, name, clubId: def.id, club: def.name, custom: { leagueId: m.leagueId, replaces, def } } };
    }
    const clubId = choice && choice.clubId;
    const c = clubs.find((x) => x.id === clubId);
    if (!c) return { error: 'Elige un club de ' + m.leagueName + '.' };
    const owner = ps.find((p) => p.clubId === clubId || (p.custom && p.custom.replaces === clubId));
    if (owner) return { error: owner.custom ? 'Ese club ya no está: su plaza la ocupa ' + owner.club + '.' : 'Ese club ya lo ha elegido ' + owner.name + '.' };
    return { player: { uid, name, clubId, club: c.name } };
  };
  /* Mundo de la temporada inicial con todos los jugadores (y sus clubes creados). */
  RU.buildWorld = function (m) {
    const s = MCM.online.createWorld({ leagueId: m.leagueId, clubId: m.host.clubId, seed: m.seed || 'room-' + m.code, code: m.code, customs: RU.customs(m) });
    RU.players(m).forEach((p) => MCM.online.addHuman(s, p.clubId));
    return s;
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
    s.online = Object.assign({}, s.online || {}, { code: meta.code, rev: meta.rev });
    const mine = RU.me(meta, me);
    if (mine) MCM.online.viewAs(s, mine.clubId);
    s.id = 'online-' + meta.code;
    return s;
  };

  // ---- salas ----
  /* choice: { clubId } o { custom }; stars: nivel de los clubes creados en la sala. */
  R.create = async function (leagueId, choice, stars) {
    const uid = R.uid();
    let code = newCode();
    for (let i = 0; i < 5 && (await R.get(code)); i++) code = newCode();
    const L0 = RU.dataset().leagues.find((l) => l.id === leagueId);
    const meta = {
      code, rev: 1, status: 'lobby', leagueId, leagueName: L0.name, country: L0.country, customStars: stars || 3, seed: 'room-' + code + '-' + Date.now(),
      players: [], uids: [], maxPlayers: Math.min(RU.MAX, L0.clubs.length), hostUid: uid,
      ready: {}, last: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const c = RU.choose(meta, uid, R.myName(), choice);
    if (c.error) throw new Error(c.error);
    meta.host = c.player;
    meta.players = [c.player];
    meta.uids = [uid];
    const s = RU.buildWorld(meta);
    const st = await writeState(code, 1, s);
    Object.assign(meta, { chunks: st.chunks, enc: st.enc, season: s.season.label, date: s.date });
    await retry(() => roomRef(code).set(meta));
    return meta;
  };

  /* Ocupar el hueco de invitado (con bloqueo corto para que no entren dos a la vez). */
  R.join = async function (code, choice) {
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
    const c = RU.choose(meta, uid, R.myName(), choice);
    if (c.error) throw new Error(c.error);
    const players = RU.players(meta).concat([c.player]);
    await retry(() => roomRef(code).update({ players, uids: players.map((p) => p.uid), updatedAt: new Date().toISOString() }));
    return R.get(code);
  };

  /* El creador empieza la partida: añade a todos los jugadores al mundo. */
  R.start = async function (meta) {
    if (meta.host.uid !== R.uid()) throw new Error('Solo quien creó la sala puede empezar.');
    if (RU.players(meta).length < 2) throw new Error('Falta al menos un amigo.');
    const s = RU.buildWorld(meta);
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
    s.online = Object.assign({}, s.online || {}, { code, rev: meta.rev });
    MCM.online.viewAs(s, (RU.me(meta, R.uid()) || meta.host).clubId);
    for (const u of RU.players(meta)) {
      const o = await retry(() => ordersRef(code, u.uid).get());
      if (o.exists) MCM.online.applyOrders(s, o.data());
    }
    const res = MCM.online.step(s);
    MCM.online.viewAs(s, s.clubId);
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
