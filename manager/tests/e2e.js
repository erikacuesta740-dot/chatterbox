/*
 * Prueba de extremo a extremo en un navegador con tamaño de iPhone.
 * Uso: node tests/e2e.js [carpeta-capturas]   (requiere playwright y un servidor en :8765)
 */
const { chromium, devices } = require('playwright');
const path = require('path');
const shots = process.argv[2] || null;
const URL = process.env.MCM_URL || 'http://127.0.0.1:8765/index.html';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'], colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push('console: ' + m.text()); });
  const snap = async (name) => { if (shots) await page.screenshot({ path: path.join(shots, name + '.png'), fullPage: false }); };
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(120); };
  const step = (t) => console.log('·', t);

  await page.goto(URL);
  await page.waitForSelector('text=Nueva carrera');
  await snap('01-inicio');

  step('crear carrera Sunderland');
  await click('[data-act="new-career"]');
  await click('[data-act="new-league"][data-id="ENG1"]');
  await snap('02-elegir-club');
  await click('[data-act="new-club"][data-id="sunderland"]');
  await page.fill('#nc-manager', 'Erika');
  await click('#new-form button[type=submit]');
  await page.waitForSelector('[data-act="sim-match"]');
  await snap('03-hub');

  step('simular partido');
  await click('[data-act="sim-match"]');
  await page.waitForSelector('text=Estadísticas');
  await snap('04-cronica');
  await click('[data-act="back"]');
  await click('[data-act="sim-md"]');
  await page.waitForSelector('[data-act="sim-md-ask"]');

  step('simular jornada con confirmación');
  await click('[data-act="sim-md-ask"]');
  await page.waitForSelector('[data-act="confirm-yes"]');
  await snap('05-confirmar');
  await click('[data-act="confirm-yes"]');
  await page.waitForSelector('[data-act="sim-md-ask"]');
  const mdText = await page.locator('.hero-match .eyebrow').first().innerText();
  if (!/jornada 3 /i.test(mdText)) throw new Error('Se esperaba jornada 3, hay: ' + mdText);

  step('tácticas');
  await click('[data-act="tab"][data-view="menu"]');
  await snap('06-menu');
  await click('[data-act="nav"][data-view="tactics"]');
  await click('[data-act="formation"][data-v="4-4-2"]');
  await click('[data-act="slot"][data-i="9"]');
  await page.locator('.sheet [data-act="pick-slot"]:not([disabled])').nth(3).click();
  await page.waitForTimeout(150);
  await snap('07-tacticas');
  const auto = await page.locator('#auto-lu').isChecked();
  if (auto) throw new Error('La alineación debería ser manual tras cambiar un jugador');

  step('plantilla y jugador');
  await click('[data-act="tab"][data-view="squad"]');
  await snap('08-plantilla');
  await click('.prow[data-act="player"]');
  await snap('09-jugador');

  step('tabla y calendario');
  await click('[data-act="tab"][data-view="table"]');
  await snap('10-tabla');
  await click('[data-act="table-tab"][data-v="scorers"]');
  await click('[data-act="tab"][data-view="calendar"]');
  await snap('11-calendario');

  step('persistencia tras recargar');
  await page.reload();
  await page.waitForSelector('[data-act="open-career"]');
  await click('[data-act="open-career"]');
  await page.waitForSelector('[data-act="sim-md-ask"]');
  const md2 = await page.locator('.hero-match .eyebrow').first().innerText();
  if (!/jornada 3 /i.test(md2)) throw new Error('Tras recargar se esperaba jornada 3, hay: ' + md2);

  step('segunda carrera independiente + renombrar + borrar');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="new-career"]');
  await click('[data-act="new-club"][data-id="real-madrid"]');
  await click('#new-form button[type=submit]');
  await page.waitForSelector('[data-act="sim-match"]');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="nav"][data-view="careers"]');
  const cards = await page.locator('.career-card').count();
  if (cards !== 2) throw new Error('Se esperaban 2 carreras, hay ' + cards);
  await snap('12-carreras');
  await page.locator('.career-card', { hasText: 'Carrera con Sunderland' }).locator('[data-act="rename-career"]').click();
  await page.fill('#rn-name', 'Sunderland 2026');
  await click('.sheet button[type=submit]');
  await page.waitForSelector('text=Sunderland 2026');
  await page.locator('.career-card', { hasText: 'Carrera con Real Madrid' }).locator('[data-act="delete-career"]').click();
  await snap('13-borrar');
  await click('[data-act="confirm-yes"]');
  await page.waitForTimeout(300);
  const left = await page.locator('.career-card').count();
  if (left !== 1) throw new Error('Tras borrar se esperaba 1 carrera, hay ' + left);
  const remaining = await page.locator('.career-card h3').first().innerText();
  if (remaining !== 'Sunderland 2026') throw new Error('Se borró la carrera equivocada: queda ' + remaining);

  step('ajustes');
  await click('[data-act="open-career"]');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="nav"][data-view="settings"]');
  await snap('14-ajustes');

  step('cierre de temporada desde la interfaz');
  await page.evaluate(() => { const s = MCM.app.s; while (!MCM.career.seasonFinished(s)) MCM.career.playMatchday(s); MCM.app.go('hub', {}, { root: true }); });
  await page.waitForSelector('[data-act="end-season-ask"]');
  await snap('15-fin-temporada');
  await click('[data-act="end-season-ask"]');
  await click('[data-act="confirm-yes"]');
  await page.waitForSelector('text=2027/28');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="nav"][data-view="club"]');
  await page.waitForSelector('text=Historial de temporadas');
  await snap('16-club-historial');
  if (!(await page.locator('text=2026/27').count())) throw new Error('Falta la temporada 2026/27 en el historial');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) errors.push('Desbordamiento horizontal en ajustes');
  await browser.close();
  if (errors.length) { console.error('ERRORES:\n' + errors.join('\n')); process.exit(1); }
  console.log('E2E OK');
})().catch((e) => { console.error(e); process.exit(1); });
