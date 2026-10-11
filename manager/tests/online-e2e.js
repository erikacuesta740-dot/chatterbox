/*
 * Prueba del modo online con dos navegadores (dos jugadores) y una base de datos compartida simulada
 * (documentos de máx. 256 KiB, update con mezcla, acquire, onSnapshot por sondeo).
 * Uso: node tests/online-e2e.js   (servidor en :8765)
 */
const { chromium, devices } = require('playwright');
const URL = process.env.MCM_URL || 'http://127.0.0.1:8765/index.html';

const server = {};
const leases = {};
const merge = (a, b) => { Object.keys(b).forEach((k) => { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]); else a[k] = b[k]; }); return a; };
async function dbOp(uid, op, path, body) {
  if (path.startsWith('data/users/') && path.split('/')[2] !== uid) return op === 'get' ? null : { error: 'invalid_argument' };
  if (op === 'get') return server[path] === undefined ? null : JSON.parse(JSON.stringify(server[path]));
  if (op === 'set') { if (JSON.stringify(body).length > 256 * 1024) return { error: 'invalid_argument' }; server[path] = JSON.parse(JSON.stringify(body)); return {}; }
  if (op === 'update') { if (!server[path]) return { error: 'invalid_argument' }; merge(server[path], JSON.parse(JSON.stringify(body))); return {}; }
  if (op === 'delete') { delete server[path]; return {}; }
  if (op === 'acquire') {
    const l = leases[path];
    const now = Date.now();
    if (l && l.until > now && l.holder !== body.holder) return { acquired: false };
    leases[path] = { holder: body.holder, until: now + (body.ttlMs || 30000) };
    return { acquired: true };
  }
  if (op === 'query') {
    const depth = path.split('/').length + 1;
    return Object.keys(server).filter((k) => k.startsWith(path + '/') && k.split('/').length === depth)
      .filter((k) => (body || []).every(([f, op, v]) => (op === 'array-contains' ? Array.isArray(server[k][f]) && server[k][f].includes(v) : server[k][f] === v))).map((k) => ({ id: k.split('/').pop(), data: server[k] }));
  }
  return { error: 'bad op' };
}

const MOCK = ({ uid, name }) => {
  const call = (op, path, body) => window.__db(uid, op, path, body).then((r) => { if (r && r.error) throw { code: r.error, message: r.error }; return r; });
  const snap = (id, data) => ({ id, exists: data != null, data: () => (data == null ? undefined : data), metadata: { fromCache: false, hasPendingWrites: false } });
  const docRef = (path) => ({
    id: path.split('/').pop(), path,
    get: async () => snap(path.split('/').pop(), await call('get', path)),
    set: (b) => call('set', path, b), update: (b) => call('update', path, b), delete: () => call('delete', path),
    acquire: (o) => call('acquire', path, o),
    onSnapshot(next) {
      let last = '';
      let alive = true;
      const tick = async () => { if (!alive) return; const d = await call('get', path); const k = JSON.stringify(d); if (k !== last) { last = k; next(snap(path.split('/').pop(), d)); } setTimeout(tick, 250); };
      tick();
      return () => { alive = false; };
    },
    collection: (p) => query(path + '/' + p, []),
  });
  const query = (cpath, filters) => ({
    where: (f, op, v) => query(cpath, filters.concat([[f, op, v]])),
    async get() { const docs = (await call('query', cpath, filters)).map((d) => snap(d.id, d.data)); return { docs, size: docs.length, empty: !docs.length }; },
    doc: (id) => docRef(cpath + '/' + id),
  });
  const db = { doc: docRef, collection: (p) => query(p, []) };
  const user = { id: async () => uid, me: async () => ({ id: uid, name }), can: async () => true, isOwner: async () => uid === 'user-erika' };
  window.claude = { use: async (n) => (n === 'db' ? db : n === 'user' ? user : null) };
};

(async () => {
  const browser = await chromium.launch();
  const mk = async (uid, name) => {
    const ctx = await browser.newContext({ ...devices['iPhone 13'] });
    await ctx.exposeFunction('__db', dbOp);
    await ctx.addInitScript(MOCK, { uid, name });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => { console.error(name, 'ERROR', e.message); process.exitCode = 1; });
    await page.goto(URL);
    await page.waitForSelector('[data-view="online"]');
    return page;
  };
  const step = (t) => console.log('·', t);
  try {
    const a = await mk('user-erika', 'Erika');
    const b = await mk('user-amigo', 'Amigo');

    step('Erika crea la sala en Segunda con el Albacete');
    await a.click('[data-view="online"]');
    await a.click('[data-view="onlineCreate"]');
    await a.click('[data-act="on-league"][data-id="ESP2"]');
    await a.click('[data-act="on-stars"][data-v="4"]');
    await a.click('[data-act="on-create"][data-club="albacete-balompie"]');
    await a.waitForSelector('text=Código de la sala');
    const code = await a.evaluate(() => MCM.app.ui.online.code);
    console.log('  código', code);

    step('el amigo entra con el código y crea su propio club (4 estrellas, fijadas por Erika)');
    await b.click('[data-view="online"]');
    await b.fill('#on-code', code);
    await b.click('form[data-submit="on-code"] button[type=submit]');
    await b.waitForSelector('[data-act="on-join"][data-club="cordoba-cf"]');
    if (await b.$('[data-act="on-join"][data-club="albacete-balompie"]')) throw new Error('El club del creador no debería poder elegirse');
    await b.click('[data-act="on-custom"]');
    if (!(await b.$('text=Nivel fijado por el creador'))) throw new Error('El nivel lo fija el creador');
    await b.fill('#cc-name', 'Real Amigos');
    await b.fill('#cc-short', 'RAM');
    await b.click('form[data-submit="on-join-custom"] button[type=submit]');
    await b.waitForSelector('text=Esperando a que Erika');

    step('una tercera jugadora entra con el Real Zaragoza');
    const c = await mk('user-amiga', 'Amiga');
    await c.click('[data-view="online"]');
    await c.fill('#on-code', code);
    await c.click('form[data-submit="on-code"] button[type=submit]');
    await c.waitForSelector('[data-act="on-join"][data-club="real-zaragoza"]');
    const replaced = await c.evaluate(() => MCM.app.ui.online.join.players.find((p) => p.custom).custom.replaces);
    if (await c.$('[data-act="on-join"][data-club="' + replaced + '"]')) throw new Error('La plaza del club creado no debería poder elegirse');
    await c.click('[data-act="on-join"][data-club="real-zaragoza"]');
    await c.waitForSelector('text=Esperando a que Erika');

    step('Erika empieza la temporada');
    await a.waitForSelector('[data-act="on-start"]');
    await a.click('[data-act="on-start"]');
    await a.waitForSelector('[data-act="on-ready"]', { timeout: 30000 });
    await b.waitForSelector('[data-act="on-ready"]', { timeout: 30000 });
    await c.waitForSelector('[data-act="on-ready"]', { timeout: 30000 });

    step('el amigo ficha a un jugador desde su móvil');
    const signed = await b.evaluate(() => {
      const s = MCM.app.s; const T = MCM.market;
      const p = MCM.career.squad(s, s.leagues.ESP2.clubIds.filter((id) => !s.humans.includes(id))[3]).filter((x) => !x.loan).sort((x, y) => x.value - y.value)[2];
      const st = T.start(s, p.id, 'buy'); if (!st.talk) return { error: st.error };
      const r1 = T.offerClub(s, p.id, st.talk.asking); const r2 = T.offerContract(s, p.id, T.talkFor(s, p.id).demand);
      return { pid: p.id, r1: r1.status, r2: r2.status, club: s.clubId, avg: MCM.generator.xiAverage(s.players, s.clubs[s.clubId]) };
    });
    console.log('  ', JSON.stringify(signed));
    if (signed.r2 !== 'done') throw new Error('El fichaje no se hizo: ' + JSON.stringify(signed));
    if (Math.abs(signed.avg - 77) > 2) throw new Error('Media del club creado ' + signed.avg);
    step('el fichaje llega al momento a los demás (sin jugar jornada)');
    const t0 = Date.now();
    for (const pg of [a, c]) await pg.waitForFunction((x) => MCM.app.s && MCM.app.s.players[x.pid].clubId === x.club, signed, { timeout: 20000 });
    console.log('   visible para todos en', Date.now() - t0, 'ms');
    if ((await b.evaluate((pid) => MCM.app.s.players[pid].clubId, signed.pid)) !== signed.club) throw new Error('El que ficha lo pierde');
    if ((await a.evaluate(() => MCM.app.s.date)) !== (await b.evaluate(() => MCM.app.s.date))) throw new Error('No debe avanzar el calendario');

    step('el amigo cambia a 4-4-2 desde su móvil');
    await b.evaluate(() => MCM.app.go('tactics', {}));
    await b.click('[data-act="formation"][data-v="4-4-2"]');
    await b.waitForTimeout(1200);
    await b.evaluate(() => MCM.app.go('hub', {}, { root: true }));

    const deal = {};
    for (let j = 1; j <= 4; j++) {
      step('jornada ' + j + ': los dos pulsan «Listo»');
      const rev0 = await a.evaluate(() => MCM.app.ui.online.room.rev);
      await a.click('[data-act="on-ready"]');
      await a.waitForSelector('[data-act="on-unready"]');
      await b.waitForSelector('[data-act="on-ready"]');
      await b.click('[data-act="on-ready"]');
      await b.waitForSelector('[data-act="on-unready"]');
      if ((await a.evaluate(() => (MCM.app.ui.online.room.last || {}).rev || 0)) > rev0) throw new Error('No debe jugarse sin la tercera jugadora');
      await c.waitForSelector('[data-act="on-ready"]');
      await c.click('[data-act="on-ready"]');
      await a.waitForFunction((r) => { const m = MCM.app.ui.online.room; return m.last && m.last.rev > r && MCM.app.s && MCM.app.s.online.rev === m.rev; }, rev0, { timeout: 30000 });
      await b.waitForFunction((r) => { const m = MCM.app.ui.online.room; return m.last && m.last.rev > r && MCM.app.s && MCM.app.s.online.rev === m.rev; }, rev0, { timeout: 30000 });
      await c.waitForFunction((r) => { const m = MCM.app.ui.online.room; return m.last && m.last.rev > r && MCM.app.s && MCM.app.s.online.rev === m.rev; }, rev0, { timeout: 30000 });
      const info = await a.evaluate(() => { const s = MCM.app.s; const res = MCM.app.ui.online.room.last.results; return { date: s.date, n: res.length, txt: res.map((r) => s.clubs[r.home].short + ' ' + r.hg + '-' + r.ag + ' ' + s.clubs[r.away].short).join(', ') }; });
      console.log('  ', info.date, info.txt);
      if (!info.n) throw new Error('La jornada no tiene resultados de los jugadores');
      if (j === 1) {
        step('la tercera jugadora ofrece dinero por un jugador de Erika (decide Erika, no la máquina)');
        deal.pid = await c.evaluate(() => {
          const s = MCM.app.s; const T = MCM.market;
          const p = MCM.career.squad(s, 'albacete-balompie').filter((x) => !x.loan).sort((x, y) => x.value - y.value)[6];
          T.start(s, p.id, 'buy'); const r = T.offerClub(s, p.id, Math.round(T.askingPrice(s, p) * 0.7));
          if (r.status !== 'sent') throw new Error('oferta ' + JSON.stringify(r));
          return p.id;
        });
        await a.waitForFunction((pid) => MCM.app.s.market.offers.some((o) => o.human && o.pid === pid && o.status === 'pending'), deal.pid, { timeout: 20000 });
        console.log('   a Erika le llega la oferta al momento');
      } else if (j === 2) {
        step('a Erika le llega la oferta de su amiga y la acepta');
        await a.evaluate(() => MCM.app.go('market', {}));
        await a.click('[data-act="mk-tab"][data-v="offers"]');
        await a.waitForSelector('[data-act="offer-accept"]');
        const r = await a.evaluate((pid) => { const s = MCM.app.s; const o = s.market.offers.find((x) => x.human && x.pid === pid && x.status === 'pending'); return o ? MCM.market.respondOffer(s, o.id, 'accept') : { error: 'sin oferta' }; }, deal.pid);
        if (r.status !== 'accepted') throw new Error('aceptar ' + JSON.stringify(r));
        await c.waitForFunction((pid) => { const t = MCM.market.talkFor(MCM.app.s, pid); return t && t.stage === 'player'; }, deal.pid, { timeout: 20000 });
        await a.evaluate(() => MCM.app.go('hub', {}, { root: true }));
      } else if (j === 3) {
        step('la amiga cierra el contrato con el jugador (con cláusula)');
        const r = await c.evaluate((pid) => { const s = MCM.app.s; const T = MCM.market; const t = T.talkFor(s, pid); if (!t || t.stage !== 'player') return { error: 'talk ' + (t && t.stage) }; return T.offerContract(s, pid, Object.assign({}, t.demand, { clause: 30e6 })); }, deal.pid);
        if (r.status !== 'done') throw new Error('contrato ' + JSON.stringify(r));
        await a.waitForFunction((pid) => MCM.app.s.players[pid].clubId === 'real-zaragoza', deal.pid, { timeout: 20000 });
        console.log('   el jugador pasa al momento a la amiga');
      }
    }

    for (const pg of [a, b, c]) {
      const x = await pg.evaluate((pid) => ({ club: MCM.app.s.players[pid].clubId, clause: MCM.app.s.players[pid].clause }), deal.pid);
      if (x.club !== 'real-zaragoza' || x.clause !== 30e6) throw new Error('Traspaso entre amigos no aplicado: ' + JSON.stringify(x));
    }
    step('el fichaje del amigo está en el mundo de todos');
    for (const pg of [a, b, c]) {
      const who = await pg.evaluate((pid) => MCM.app.s.players[pid].clubId, signed.pid);
      if (who !== signed.club) throw new Error('Fichaje no aplicado en todos: ' + who);
    }

    step('los dos ven el mismo mundo y cada uno su club');
    const sa = await a.evaluate(() => ({ club: MCM.app.s.clubId, date: MCM.app.s.date, played: MCM.career.fixtures(MCM.app.s).filter((f) => f.played).length, f: MCM.app.s.clubs[MCM.app.s.humans[1]].tactics.formation }));
    const sb = await b.evaluate(() => ({ club: MCM.app.s.clubId, date: MCM.app.s.date, played: MCM.career.fixtures(MCM.app.s).filter((f) => f.played).length }));
    console.log('  ', JSON.stringify(sa), JSON.stringify(sb));
    if (sa.club !== 'albacete-balompie' || sb.club !== signed.club || !/^mi-/.test(sb.club)) throw new Error('Clubes cambiados');
    const sc = await c.evaluate(() => ({ club: MCM.app.s.clubId, humans: MCM.app.s.humans.length }));
    if (sc.club !== 'real-zaragoza' || sc.humans !== 3) throw new Error('La tercera jugadora no está en la partida: ' + JSON.stringify(sc));
    if (sa.date !== sb.date || sa.played !== sb.played) throw new Error('Mundos distintos');
    if (sa.f !== '4-4-2') throw new Error('No se aplicó la táctica del amigo');

    if (process.env.SHOTS) {
      await b.screenshot({ path: process.env.SHOTS + '/online-sala.png', fullPage: true });
      await a.screenshot({ path: process.env.SHOTS + '/online-sala-a.png' });
    }
    step('documentos dentro de los límites');
    const big = Object.keys(server).filter((k) => JSON.stringify(server[k]).length > 256 * 1024);
    if (big.length) throw new Error('Documentos demasiado grandes');
    console.log('   documentos en la base:', Object.keys(server).length);

    step('la lista de salas de cada uno muestra la sala');
    await a.evaluate(() => MCM.app.go('online', {}));
    await a.waitForSelector('[data-act="on-open"][data-code="' + code + '"]');
    console.log('ONLINE E2E OK');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
