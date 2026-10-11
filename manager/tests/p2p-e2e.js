/*
 * Prueba del modo online SIN servidor propio (conexión directa entre móviles con PeerJS).
 * Necesita un servidor PeerJS local:  npx peerjs --port 9000   y el juego en :8765.
 * Uso: node tests/p2p-e2e.js
 */
const { chromium, devices } = require('playwright');
const URL = process.env.MCM_URL || 'http://127.0.0.1:8765/index.html';
const PEER = { host: '127.0.0.1', port: Number(process.env.PEER_PORT || 9000), path: '/', secure: false, debug: 0, config: { iceServers: [] } };

(async () => {
  const browser = await chromium.launch({ args: ['--allow-loopback-in-peer-connection', '--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const ctxA = await browser.newContext({ ...devices['Pixel 7'] });
  const ctxB = await browser.newContext({ ...devices['Pixel 7'] });
  for (const c of [ctxA, ctxB]) await c.addInitScript((o) => { window.MCM_PEER_OPTS = o; }, PEER);
  const open = async (ctx, name) => {
    const page = await ctx.newPage();
    page.on('pageerror', (e) => { console.error(name, 'ERROR', e.message); process.exitCode = 1; });
    await page.goto(URL);
    await page.waitForSelector('[data-view="online"]');
    return page;
  };
  const step = (t) => console.log('·', t);
  const playDay = async (a, b, label) => {
    const rev0 = await a.evaluate(() => MCM.app.ui.online.room.rev);
    await a.click('[data-act="on-ready"]');
    await a.waitForSelector('[data-act="on-unready"]');
    await b.waitForSelector('[data-act="on-ready"]');
    await b.click('[data-act="on-ready"]');
    for (const p of [a, b]) await p.waitForFunction((r) => MCM.app.ui.online.room && MCM.app.ui.online.room.rev > r && MCM.app.s && MCM.app.s.online.rev === MCM.app.ui.online.room.rev, rev0, { timeout: 30000 });
    const info = await a.evaluate(() => { const s = MCM.app.s; return s.date + ' ' + (MCM.app.ui.online.room.last.results || []).map((r) => s.clubs[r.home].short + ' ' + r.hg + '-' + r.ag + ' ' + s.clubs[r.away].short).join(', '); });
    console.log('  ', label, info);
  };
  try {
    let a = await open(ctxA, 'Erika');
    let b = await open(ctxB, 'Amigo');
    const usesP2P = await a.evaluate(() => MCM.p2p.available() && !MCM.cloud.ready());
    if (!usesP2P) throw new Error('No se usa la conexión directa');

    step('nombres y creación de la sala (Premier, Arsenal)');
    await a.click('[data-view="online"]');
    await a.fill('#on-name', 'Erika'); await a.click('form[data-submit="on-name"] button'); await a.waitForSelector('text=Nombre guardado'); await a.waitForTimeout(300);
    await a.click('[data-view="onlineCreate"]');
    await a.selectOption('#on-country', 'Inglaterra');
    await a.click('[data-act="on-league"][data-id="ENG1"]');
    await a.click('[data-act="on-create"][data-club="arsenal"]');
    await a.waitForSelector('text=Código de la sala');
    const code = await a.evaluate(() => MCM.app.ui.online.code);
    console.log('  código', code);

    step('el amigo se conecta con el código y elige el Chelsea');
    await b.click('[data-view="online"]');
    await b.fill('#on-name', 'Amigo'); await b.click('form[data-submit="on-name"] button'); await b.waitForSelector('text=Nombre guardado'); await b.waitForTimeout(300);
    await b.fill('#on-code', code);
    await b.click('form[data-submit="on-code"] button[type=submit]');
    await b.waitForSelector('[data-act="on-join"][data-club="chelsea"]', { timeout: 30000 });
    await b.click('[data-act="on-join"][data-club="chelsea"]');
    await b.waitForSelector('text=Esperando a que Erika', { timeout: 30000 });

    step('empieza la temporada');
    await a.waitForSelector('[data-act="on-start"]', { timeout: 30000 });
    await a.click('[data-act="on-start"]');
    await a.waitForSelector('[data-act="on-ready"]', { timeout: 30000 });
    await b.waitForSelector('[data-act="on-ready"]', { timeout: 30000 });
    await b.waitForSelector('text=Conectado con Erika');

    step('el amigo cambia a 3-5-2');
    await b.evaluate(() => MCM.app.go('tactics', {}));
    await b.click('[data-act="formation"][data-v="3-5-2"]');
    await b.waitForTimeout(1500);
    await b.evaluate(() => MCM.app.go('hub', {}, { root: true }));
    await playDay(a, b, 'jornada 1:');
    await playDay(b, a, 'jornada 2 (pulsa primero el amigo):');
    const f = await a.evaluate(() => MCM.app.s.clubs.chelsea.tactics.formation);
    if (f !== '3-5-2') throw new Error('No llegó la táctica del amigo: ' + f);

    step('los dos guardan copia: se cierran y vuelven a abrir (primero el amigo)');
    const revBefore = await a.evaluate(() => MCM.app.ui.online.room.rev);
    await a.close(); await b.close();
    b = await open(ctxB, 'Amigo');
    await b.click('[data-view="online"]');
    await b.waitForSelector('[data-act="on-open"][data-code="' + code + '"]');
    await b.click('[data-act="on-open"][data-code="' + code + '"]');
    await b.waitForSelector('[data-act="on-ready"]', { timeout: 30000 });
    a = await open(ctxA, 'Erika');
    await a.click('[data-view="online"]');
    await a.click('[data-act="on-open"][data-code="' + code + '"]');
    await a.waitForSelector('[data-act="on-ready"]', { timeout: 30000 });
    await a.waitForSelector('text=Conectado con Amigo', { timeout: 30000 });
    const revs = [await a.evaluate(() => MCM.app.ui.online.room.rev), await b.evaluate(() => MCM.app.ui.online.room.rev)];
    if (revs[0] !== revBefore || revs[1] !== revBefore) throw new Error('Revisiones distintas tras volver: ' + revs + ' vs ' + revBefore);
    await playDay(a, b, 'jornada 3 (tras volver):');

    step('mismo mundo en los dos');
    const sa = await a.evaluate(() => ({ club: MCM.app.s.clubId, date: MCM.app.s.date, played: MCM.career.fixtures(MCM.app.s).filter((x) => x.played).length }));
    const sb = await b.evaluate(() => ({ club: MCM.app.s.clubId, date: MCM.app.s.date, played: MCM.career.fixtures(MCM.app.s).filter((x) => x.played).length }));
    console.log('  ', JSON.stringify(sa), JSON.stringify(sb));
    if (sa.club !== 'arsenal' || sb.club !== 'chelsea' || sa.date !== sb.date || sa.played !== sb.played) throw new Error('Mundos distintos');
    if (process.env.SHOTS) await b.screenshot({ path: process.env.SHOTS + '/p2p-sala.png' });
    console.log('P2P E2E OK');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
