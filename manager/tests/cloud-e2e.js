/*
 * Prueba del guardado online con una simulación de la base de datos de claude.ai
 * (mismas reglas: documentos de máx. 256 KiB y subárbol data/users/<id> privado por usuario).
 * Uso: node tests/cloud-e2e.js   (servidor en :8765)
 */
const { chromium, devices } = require('playwright');
const URL = process.env.MCM_URL || 'http://127.0.0.1:8765/index.html';

const MOCK = () => {
  const uid = localStorage.getItem('mock:uid') || 'user-erika';
  const name = uid === 'user-erika' ? 'Erika' : 'Hermano';
  const load = () => JSON.parse(localStorage.getItem('mock:server') || '{}');
  const saveAll = (d) => localStorage.setItem('mock:server', JSON.stringify(d));
  const allowed = (path) => !path.startsWith('data/users/') || path.split('/')[2] === uid;
  const snap = (id, data) => ({ id, exists: data !== undefined, data: () => data, metadata: { fromCache: false, hasPendingWrites: false } });
  const docRef = (path) => ({
    id: path.split('/').pop(), path,
    async get() { const d = load(); return snap(path.split('/').pop(), allowed(path) ? d[path] : undefined); },
    async set(body) {
      if (!allowed(path)) throw { code: 'invalid_argument', message: 'otro usuario' };
      if (JSON.stringify(body).length > 256 * 1024) throw { code: 'invalid_argument', message: 'documento > 256 KiB' };
      const d = load(); d[path] = JSON.parse(JSON.stringify(body)); saveAll(d);
    },
    async delete() { if (!allowed(path)) throw { code: 'invalid_argument' }; const d = load(); delete d[path]; saveAll(d); },
  });
  const query = (cpath, filters) => ({
    where(f, op, v) { return query(cpath, filters.concat([[f, v]])); },
    async get() {
      const d = load();
      const docs = Object.keys(d).filter((k) => k.startsWith(cpath + '/') && k.split('/').length === cpath.split('/').length + 1 && allowed(k))
        .filter((k) => filters.every(([f, v]) => d[k][f] === v)).map((k) => snap(k.split('/').pop(), d[k]));
      return { docs, size: docs.length, empty: !docs.length };
    },
    doc(id) { return docRef(cpath + '/' + id); },
  });
  const db = { doc: docRef, collection: (p) => query(p, []) };
  const user = { id: async () => uid, me: async () => ({ id: uid, name }), can: async () => true, isOwner: async () => uid === 'user-erika' };
  window.claude = { use: async (n) => (n === 'db' ? db : n === 'user' ? user : null) };
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const step = (t) => console.log('·', t);

  await page.goto(URL);
  await page.waitForSelector('text=Guardado online activado');
  step('crear carrera con cuenta');
  await page.click('[data-act="new-career"]');
  await page.selectOption('#nc-country', 'España');
  await page.click('[data-act="new-league"][data-id="ESP1"]');
  await page.click('[data-act="new-club"][data-id="real-betis"]');
  await page.click('#new-form button[type=submit]');
  await page.waitForSelector('[data-act="sim-match"]');
  await page.click('[data-act="sim-match"]');
  await page.waitForSelector('text=Crónica del partido');
  await page.waitForTimeout(300);
  await page.evaluate(() => MCM.cloud.flush());
  await page.waitForSelector('text=Guardado online');
  const server = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('mock:server'))));
  const metas = server.filter((k) => k.includes('/meta_'));
  const chunks = server.filter((k) => k.includes('/chunk_'));
  if (metas.length !== 1 || chunks.length < 1) throw new Error('Subida incorrecta: ' + server.join(', '));
  if (!server.every((k) => k.startsWith('data/users/user-erika/'))) throw new Error('Datos fuera del espacio privado');
  console.log('  subida:', metas.length, 'ficha y', chunks.length, 'trozos');

  step('otro dispositivo (sin caché local) recupera la carrera');
  await page.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase('modo-carrera-manager'); q.onsuccess = q.onerror = q.onblocked = () => r(); }));
  await page.reload();
  await page.waitForSelector('text=Guardado online activado');
  await page.waitForSelector('[data-act="open-career"]');
  await page.click('[data-act="open-career"]');
  await page.waitForSelector('[data-act="sim-match"]');
  const md = await page.evaluate(() => MCM.career.userFixtures(MCM.app.s).filter((f) => f.played).length + ' ' + MCM.app.s.clubId);
  if (md !== '1 real-betis') throw new Error('No se recuperó la carrera online: ' + md);

  step('el segundo usuario no ve ni puede tocar la carrera');
  await page.evaluate(() => localStorage.setItem('mock:uid', 'user-hermano'));
  await page.reload();
  await page.waitForSelector('text=Guardado online activado');
  await page.waitForTimeout(500);
  const visible = await page.evaluate(() => MCM.app.metas.map((m) => m.name));
  if (visible.length) throw new Error('El hermano ve carreras ajenas: ' + visible.join(', '));
  const touch = await page.evaluate(async () => {
    const db = await window.claude.use('db');
    try { await db.doc('data/users/user-erika/meta_x').set({ a: 1 }); return 'escribió'; } catch (e) { return 'bloqueado'; }
  });
  if (touch !== 'bloqueado') throw new Error('Pudo escribir en el espacio de otro usuario');

  step('vuelve Erika: su carrera sigue intacta');
  await page.evaluate(() => localStorage.setItem('mock:uid', 'user-erika'));
  await page.reload();
  await page.waitForSelector('[data-act="open-career"]');
  await page.click('[data-act="open-career"]');
  await page.waitForSelector('[data-act="sim-match"]');
  step('borrar elimina también la copia online');
  await page.click('[data-act="tab"][data-view="menu"]');
  await page.click('[data-act="nav"][data-view="careers"]');
  await page.click('[data-act="delete-career"]');
  await page.click('[data-act="confirm-yes"]');
  await page.waitForTimeout(500);
  const left = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('mock:server'))).length);
  if (left !== 0) throw new Error('Quedan ' + left + ' documentos online tras borrar');

  await browser.close();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('CLOUD E2E OK');
})().catch((e) => { console.error(e); process.exit(1); });
