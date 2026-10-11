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
  const snap = async (name) => {
    const wide = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      return Array.from(document.querySelectorAll('main .card, main section')).filter((el) => el.getBoundingClientRect().right > w + 1 && !el.closest('.table-wrap, .chips')).length;
    });
    if (wide) errors.push('Desbordamiento horizontal en ' + name + ' (' + wide + ' bloques)');
    if (shots) await page.screenshot({ path: path.join(shots, name + '.png'), fullPage: false });
  };
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(120); };
  const step = (t) => console.log('·', t);

  await page.goto(URL);
  await page.waitForSelector('text=Nueva carrera');
  await snap('01-inicio');

  step('crear carrera Sunderland');
  await click('[data-act="new-career"]');
  await page.selectOption('#nc-country', 'Inglaterra');
  await click('[data-act="new-league"][data-id="ENG1"]');
  await snap('02-elegir-club');
  await click('[data-act="new-club"][data-id="sunderland"]');
  await page.fill('#nc-manager', 'Erika');
  await click('#new-form button[type=submit]');
  await page.waitForSelector('[data-act="live-start"]');
  await snap('03-hub');

  step('simular partido');
  await click('[data-act="sim-match"]');
  await page.waitForSelector('text=Estadísticas');
  await snap('04-cronica');
  await click('[data-act="back"]');
  await page.waitForSelector('[data-act="sim-ask"]');

  step('simular varios partidos');
  await click('[data-act="sim-ask"]');
  await snap('05-simular-varios');
  await click('[data-act="sim-n"][data-n="3"]');
  await page.waitForSelector('[data-act="live-start"]');
  const played = await page.evaluate(() => MCM.career.userFixtures(MCM.app.s).filter((f) => f.played).length);
  if (played !== 4) throw new Error('Se esperaban 4 partidos jugados, hay ' + played);

  step('partido en directo con cambio en el descanso');
  await click('[data-act="live-start"]');
  await page.waitForSelector('text=En directo');
  await click('[data-act="live-speed"]');
  await page.waitForSelector('text=Descanso: cambios y táctica', { timeout: 30000 });
  await snap('06-descanso');
  await click('form[data-submit="live-sub"] button[type=submit]');
  await click('[data-act="live-tactic"][data-k="mentality"][data-v="att"]');
  await click('[data-act="live-resume"]');
  await page.waitForTimeout(1200);
  await snap('06b-directo');
  await click('[data-act="live-skip"]');
  await page.waitForSelector('text=Crónica del partido');
  const manual = await page.evaluate(() => { const s = MCM.app.s; const f = MCM.career.lastUserFixture(s); return f.report.events.some((e) => e.type === 'sub' && e.min === 45); });
  if (!manual) throw new Error('El cambio del descanso no aparece en la crónica');
  const played2 = await page.evaluate(() => MCM.career.userFixtures(MCM.app.s).filter((f) => f.played).length);
  if (played2 !== 5) throw new Error('Se esperaban 5 partidos jugados tras el directo, hay ' + played2);

  step('entrenamiento, ojeadores, charla y prensa');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="nav"][data-view="training"]');
  await click('[data-act="train-int"][data-v="high"]');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="nav"][data-view="scouting"]');
  await click('form[data-submit="scout-hire"] button[type=submit]');
  await click('[data-act="scout-assign"]');
  await page.selectOption('#sm-type', 'youth');
  await click('form[data-submit="scout-mission"] button[type=submit]');
  await page.waitForSelector('text=Buscando juveniles');
  await snap('07a-ojeadores');
  await click('[data-act="tab"][data-view="squad"]');
  await page.locator('.prow[data-act="player"]').nth(3).click();
  await page.waitForSelector('text=Plan de desarrollo');
  await page.selectOption('#pl-focus', 'pac').catch(() => page.selectOption('#pl-focus', 'div'));
  await click('form[data-submit="plan"] button[type=submit]');
  await click('[data-act="talk"][data-k="praise"]');
  await page.waitForSelector('.sheet >> text=Moral');
  await snap('07b-charla');
  await click('.sheet [data-act="sheet-close"]');
  await page.evaluate(() => { const s = MCM.app.s; MCM.life.maybePress(s, Object.assign({}, MCM.career.lastUserFixture(s), { id: 'forzada-prensa-1' })); if (!s.press) MCM.life.maybePress(s, Object.assign({}, MCM.career.lastUserFixture(s), { id: 'forzada-prensa-3' })); });
  const hasPress = await page.evaluate(() => !!MCM.app.s.press);
  if (hasPress) {
    await click('[data-act="tab"][data-view="hub"]');
    await click('[data-act="press-open"]');
    await snap('07c-prensa');
    await click('form[data-submit="press"] button[type=submit]');
    if (await page.evaluate(() => !!MCM.app.s.press)) throw new Error('La rueda de prensa no se cerró');
  }

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
  await click('[data-act="comp-tab"][data-v="scorers"]');
  await page.selectOption('#comp-pick', 'UCL');
  await page.waitForSelector('text=Fase liga');
  await snap('10b-champions');
  await click('[data-act="comp-sel"][data-v="CUP_ENG"]');
  await page.waitForSelector('text=FA Cup');
  await click('[data-act="tab"][data-view="calendar"]');
  await snap('11-calendario');

  step('persistencia tras recargar');
  await page.reload();
  await page.waitForSelector('[data-act="open-career"]');
  await click('[data-act="open-career"]');
  await page.waitForSelector('[data-act="live-start"]');
  const played3 = await page.evaluate(() => MCM.career.userFixtures(MCM.app.s).filter((f) => f.played).length);
  if (played3 !== 5) throw new Error('Tras recargar se esperaban 5 partidos jugados, hay ' + played3);

  step('segunda carrera independiente + renombrar + borrar');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="new-career"]');
  await click('[data-act="new-club"][data-id="real-madrid"]');
  await click('#new-form button[type=submit]');
  await page.waitForSelector('[data-act="live-start"]');
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

  step('mercado: buscar, negociar y fichar');
  // Tras varios partidos la ventana de verano ya cerró: para la prueba volvemos a agosto.
  await page.evaluate(() => { MCM.app.s.date = MCM.app.s.season.year + '-08-20'; });
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="nav"][data-view="market"]');
  await page.fill('#mk-q', 'Jarrad Branthwaite');
  await click('form[data-submit="mk-search"] button[type=submit]');
  await click('.prow[data-act="player"]');
  await page.waitForSelector('text=Precio que pide');
  await click('[data-act="talk-start"][data-kind="buy"]');
  await page.waitForSelector('#tk-fee');
  await snap('20-negociacion-club');
  const ask = await page.evaluate(() => { const s = MCM.app.s; s.clubs[s.clubId].budget += 80e6; const t = Object.values(s.market.talks)[0]; return t.asking; });
  await page.fill('#tk-fee', String(ask));
  await click('form[data-submit="talk-club"] button[type=submit]');
  await page.waitForSelector('#tk-wage');
  await snap('21-negociacion-jugador');
  await click('form[data-submit="talk-player"] button[type=submit]');
  await page.waitForSelector('text=Contrato y mercado');
  const owned = await page.evaluate(() => { const s = MCM.app.s; return s.players[Object.keys(s.players).find((id) => s.players[id].name === 'Jarrad Branthwaite')].clubId === s.clubId; });
  if (!owned) throw new Error('El fichaje no se completó');

  step('oferta recibida y venta');
  await page.evaluate(() => {
    const s = MCM.app.s; const p = MCM.career.squad(s, s.clubId).sort((a, b) => a.ovr - b.ovr)[2];
    s.market.offers.unshift({ id: 'oE2E', pid: p.id, clubId: 'real-oviedo', type: 'buy', fee: 3e6, maxFee: 3.3e6, expiresMd: 9, status: 'pending', md: 0 });
    MCM.app.go('market', { tab: 'offers' });
  });
  await page.waitForSelector('[data-act="offer-accept"]');
  await snap('22-ofertas');
  await click('[data-act="offer-accept"]');
  await click('[data-act="confirm-yes"]');
  await page.waitForTimeout(300);
  const sold = await page.evaluate(() => MCM.app.s.market.offers[0].status);
  if (sold !== 'accepted') throw new Error('La venta no se cerró: ' + sold);

  step('finanzas y cantera');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="nav"][data-view="finance"]');
  await page.waitForSelector('text=Un único presupuesto');
  await snap('23-finanzas');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="nav"][data-view="youth"]');
  await page.waitForSelector('text=Cantera');
  await page.locator('.card', { hasText: 'Cantera' }).locator('.prow').first().click();
  await click('[data-act="youth-promote"]');
  await page.waitForSelector('text=Contrato y mercado');
  await snap('24-canterano');

  step('cierre de temporada desde la interfaz');
  await page.evaluate(() => { const s = MCM.app.s; while (!MCM.career.seasonFinished(s)) { if (s.dev) s.dev.confidence = 100; MCM.career.playMatchday(s); } MCM.app.go('hub', {}, { root: true }); });
  const st = await page.evaluate(() => ({ fin: MCM.career.seasonFinished(MCM.app.s), unemployed: !!(MCM.app.s.manager && MCM.app.s.manager.unemployed), view: document.querySelector('h1') && document.querySelector('h1').textContent }));
  console.log('   estado', JSON.stringify(st));
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
  step('premios y carrera del entrenador');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="nav"][data-view="awards"]');
  await page.waitForSelector('text=Balón de Oro 2026/27');
  await snap('17a-premios');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="nav"][data-view="manager"]');
  await page.waitForSelector('text=Reputación');
  await snap('17b-mi-carrera');

  step('valores FC 27: jugador ficticio = No verificado');
  await click('[data-act="tab"][data-view="squad"]');
  await click('.prow[data-act="player"]');
  await page.waitForSelector('text=Valor de mercado FC 27');
  if (!(await page.locator('.pill', { hasText: 'No verificado' }).count())) throw new Error('El jugador ficticio debería mostrar No verificado');

  step('importar base de plantillas y valores FC 27');
  const fs = require('fs');
  const fx = (f) => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="nav"][data-view="settings"]');
  await page.fill('#dataset-text', fx('dataset-prueba.json'));
  await click('[data-act="dataset-import-text"]');
  await page.waitForSelector('text=Quitar base');
  await page.fill('#values-text', fx('valores-prueba.csv'));
  await click('[data-act="values-import-text"]');
  await page.waitForSelector('text=Importación de valores FC 27');
  await snap('17-informe-importacion');
  const rep = await page.locator('.sheet').innerText();
  if (!/NUEVOS\s*2/i.test(rep) || !/RECHAZADOS\s*2/i.test(rep)) throw new Error('Informe inesperado: ' + rep);
  await click('.sheet [data-act="sheet-close"]');

  step('carrera con base importada y ficha con valor exacto');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="new-career"]');
  await click('[data-act="new-dataset"][data-v="custom"]');
  await click('[data-act="new-club"][data-id="club-prueba-norte"]');
  await click('#new-form button[type=submit]');
  await page.waitForSelector('[data-act="sim-match"]');
  await click('[data-act="sim-match"]');
  await page.waitForSelector('text=Estadísticas');
  const openUno = async () => {
    await click('[data-act="tab"][data-view="squad"]');
    await page.locator('.prow', { hasText: 'Jugador Prueba Uno' }).click();
    await page.waitForSelector('text=Valor de mercado FC 27');
  };
  await openUno();
  await snap('18-ficha-fc27');
  const card = await page.locator('section.card', { hasText: 'Valor de mercado FC 27' }).innerText();
  for (const t of ['85.000.000 €', 'Verificado según la fuente', 'PRUEBA (no es un dato real)', '2026-10-10', 'TEST-0001']) {
    if (!card.includes(t)) throw new Error('Falta «' + t + '» en la ficha: ' + card);
  }
  step('persistencia de valores tras recargar');
  await page.reload();
  await click('[data-act="open-career"]');
  await page.waitForSelector('[data-act="tab"]');
  await openUno();
  const card2 = await page.locator('section.card', { hasText: 'Valor de mercado FC 27' }).innerText();
  if (!card2.includes('85.000.000 €')) throw new Error('El valor no persiste tras recargar');
  await click('[data-act="tab"][data-view="menu"]');
  await click('[data-act="nav"][data-view="market"]');
  await snap('19-mercado');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) errors.push('Desbordamiento horizontal en ajustes');
  await browser.close();
  if (errors.length) { console.error('ERRORES:\n' + errors.join('\n')); process.exit(1); }
  console.log('E2E OK');
})().catch((e) => { console.error(e); process.exit(1); });
