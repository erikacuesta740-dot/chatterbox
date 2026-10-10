/* Aplicación: estado de la interfaz, pantallas y acciones. */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const UI = MCM.ui;
  const C = MCM.career;
  const SC = MCM.schedule;
  const LU = MCM.lineup;
  const PL = MCM.players;
  const esc = U.esc;
  const icon = UI.icon;

  const App = (MCM.app = {
    s: null,
    metas: [],
    view: 'start',
    params: {},
    stack: [],
    profile: '',
    saveState: '',
    ui: { squadFilter: 'ALL', squadSort: 'pos', tableLeague: null, tableTab: 'table', newLeague: 'ESP1', newClub: null, calMd: null, marketPos: 'ALL', marketQ: '', marketMinOvr: 0, faPos: 'ALL' },
  });

  const STAGE_NOTE = {
    2: 'Etapa 2 · Gestión deportiva',
    3: 'Etapa 3 · Profundidad',
    4: 'Etapa 4 · Usuarios y nube',
  };

  // ---------- Utilidades de interfaz ----------
  const $ = (sel) => document.querySelector(sel);
  function toast(msg) {
    const t = $('#toast');
    t.innerHTML = '<div>' + esc(msg) + '</div>';
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, 2600);
  }
  App.toast = toast;

  function busy(text) {
    const b = $('#busy');
    b.innerHTML = '<div><span class="spinner"></span>' + esc(text) + '</div>';
    b.hidden = false;
    return new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));
  }
  function unbusy() { $('#busy').hidden = true; }

  function sheet(html) {
    const sc = $('#sheet');
    sc.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + html + '</div>';
    sc.hidden = false;
  }
  function closeSheet() { const sc = $('#sheet'); sc.hidden = true; sc.innerHTML = ''; }
  App.closeSheet = closeSheet;

  // Confirmación propia (los diálogos nativos no funcionan en todos los visores)
  let pendingConfirm = null;
  function confirmSheet(opts) {
    pendingConfirm = opts.onYes;
    sheet('<h2>' + esc(opts.title) + '</h2><p>' + esc(opts.body) + '</p>' +
      '<div class="btn-row"><button class="btn" data-act="sheet-close">Cancelar</button>' +
      '<button class="btn ' + (opts.danger ? 'danger' : 'primary') + '" data-act="confirm-yes">' + esc(opts.yes || 'Confirmar') + '</button></div>');
  }

  async function persist() {
    if (!App.s) return;
    App.saveState = 'saving';
    paintSave();
    try {
      await MCM.store.save(App.s);
      await MCM.store.setSetting('lastCareer', App.s.id);
      App.saveState = 'ok';
    } catch (e) {
      console.error(e);
      App.saveState = 'err';
      toast('No se pudo guardar: ' + (e && e.message ? e.message : e));
    }
    paintSave();
  }
  function paintSave() {
    const el = $('#save-dot');
    if (!el) return;
    el.className = 'save-dot ' + (App.saveState === 'ok' ? 'ok' : App.saveState === 'err' ? 'err' : '');
    el.textContent = App.saveState === 'saving' ? 'Guardando…' : App.saveState === 'ok' ? 'Guardado' : App.saveState === 'err' ? 'Error al guardar' : '';
  }

  // ---------- Navegación ----------
  const TABS = [['hub', 'Inicio', 'home'], ['squad', 'Plantilla', 'squad'], ['calendar', 'Partidos', 'calendar'], ['table', 'Tabla', 'table'], ['menu', 'Menú', 'menu']];
  const TAB_ROOTS = new Set(TABS.map((t) => t[0]));

  App.go = function (view, params, opts) {
    opts = opts || {};
    if (opts.root) App.stack = [];
    else if (!opts.replace) App.stack.push({ view: App.view, params: App.params });
    App.view = view;
    App.params = params || {};
    App.render(true);
  };
  App.back = function () {
    const prev = App.stack.pop();
    if (prev) { App.view = prev.view; App.params = prev.params; }
    else App.view = App.s ? 'hub' : 'start';
    App.render(true);
  };

  App.render = function (scrollTop) {
    const fn = VIEWS[App.view] || VIEWS.start;
    let v;
    try { v = fn(App.params); } catch (e) { console.error(e); v = { title: 'Error', html: '<div class="card"><p>Ha ocurrido un error al mostrar esta pantalla.</p><p class="small muted">' + esc(e.message) + '</p></div>' }; }
    const withTabs = !!App.s && v.tabs !== false;
    const showBack = App.stack.length > 0 && !(TAB_ROOTS.has(App.view) && App.stack.length === 0);
    const club = App.s ? C.userClub(App.s) : null;
    $('#app').innerHTML =
      '<header class="topbar">' +
      (showBack ? '<button class="icon-btn" data-act="back" aria-label="Volver">' + icon('back') + '</button>' : (club && withTabs ? UI.crest(club, 34) : '')) +
      '<div class="title"><h1>' + esc(v.title) + '</h1>' + (v.sub ? '<div class="sub">' + esc(v.sub) + '</div>' : '') + '</div>' +
      (App.s ? '<span id="save-dot" class="save-dot"></span>' : '') +
      '</header>' +
      '<main class="' + (withTabs ? '' : 'no-tabs') + '">' + v.html + '</main>' +
      (withTabs ? '<nav class="tabbar" aria-label="Secciones">' + TABS.map((t) => '<button data-act="tab" data-view="' + t[0] + '" class="' + (activeTab() === t[0] ? 'on' : '') + '">' + icon(t[2]) + '<span>' + t[1] + '</span></button>').join('') + '</nav>' : '');
    paintSave();
    if (scrollTop) window.scrollTo(0, 0);
    if (v.after) v.after();
  };
  function activeTab() {
    if (TAB_ROOTS.has(App.view)) return App.view;
    for (let i = App.stack.length - 1; i >= 0; i--) if (TAB_ROOTS.has(App.stack[i].view)) return App.stack[i].view;
    return 'hub';
  }

  // ---------- Pantallas ----------
  const VIEWS = {};

  VIEWS.start = function () {
    const last = App.metas[0];
    let html = '<section class="brand"><span class="eyebrow">Simulador de gestión</span><h1>Modo Carrera<br><em>Manager</em></h1>' +
      '<p class="muted">Eres entrenador y director deportivo. Tú decides; los partidos se simulan.</p></section>';
    if (last) {
      html += '<section class="card"><span class="eyebrow">Continuar carrera</span>' + careerCardInner(last) +
        '<button class="btn primary block" data-act="open-career" data-id="' + esc(last.id) + '">' + icon('play') + 'Continuar</button></section>';
    }
    html += '<section class="stack">' +
      '<button class="btn ' + (last ? '' : 'primary') + ' block" data-act="new-career">' + icon('plus') + 'Nueva carrera</button>' +
      '<button class="btn block" data-act="nav" data-view="careers">' + icon('folder') + 'Mis carreras guardadas (' + App.metas.length + ')</button>' +
      '<button class="btn ghost block" data-act="nav" data-view="settings">' + icon('settings') + 'Ajustes</button></section>' +
      '<section class="notice info"><b>Guardado local.</b> En esta versión las carreras se guardan solo en este navegador y dispositivo. ' +
      'El guardado online con cuentas para dos usuarios llegará en la Etapa 4. Mientras tanto puedes exportar una copia desde Ajustes.</section>' +
      '<section class="notice"><b>Datos de demostración.</b> Clubes y estadios reales aproximados a 2025/26; jugadores con nombres ficticios generados. ' +
      'No son datos oficiales de EA Sports FC.</section>';
    return { title: 'Inicio', html, tabs: false };
  };

  function careerCardInner(m) {
    const club = { name: m.clubName, short: m.short || m.clubName.slice(0, 3), colors: m.colors || ['#888', '#fff'] };
    const when = new Date(m.updatedAt);
    return '<div class="row">' + UI.crest(club, 44) + '<div class="grow"><h3 class="ellipsis">' + esc(m.name) + '</h3>' +
      '<div class="small muted">' + esc(m.clubName) + ' · ' + esc(m.leagueName) + '</div>' +
      '<div class="small muted">Temporada ' + esc(m.season) + ' · Jornada ' + m.md + '/' + m.totalMd + ' · ' + esc(m.owner) + '</div>' +
      '<div class="small muted">Guardada ' + when.toLocaleDateString('es-ES') + ' ' + when.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + '</div></div></div>';
  }

  VIEWS.careers = function () {
    let html = '';
    if (!App.metas.length) {
      html = '<div class="card empty"><p>Todavía no tienes carreras guardadas.</p><button class="btn primary" data-act="new-career">' + icon('plus') + 'Crear la primera</button></div>';
    } else {
      html = App.metas.map((m) => '<section class="card career-card">' + careerCardInner(m) +
        (App.s && App.s.id === m.id ? '<span class="pill solid-accent" style="justify-self:start">Abierta ahora</span>' : '') +
        '<div class="btn-row"><button class="btn primary sm" data-act="open-career" data-id="' + esc(m.id) + '">Continuar</button>' +
        '<button class="btn sm" data-act="rename-career" data-id="' + esc(m.id) + '">Renombrar</button>' +
        '<button class="btn sm ghost" data-act="delete-career" data-id="' + esc(m.id) + '" style="color:var(--bad)">Eliminar</button></div></section>').join('') +
        '<button class="btn block" data-act="new-career">' + icon('plus') + 'Nueva carrera</button>';
    }
    return { title: 'Mis carreras', sub: App.metas.length + ' guardadas en este dispositivo', html };
  };

  VIEWS.newCareer = function () {
    const leagues = MCM.DATA.leagues;
    const L = leagues.find((l) => l.id === App.ui.newLeague) || leagues[0];
    if (!App.ui.newClub) {
      const clubs = L.clubs.map((row) => ({ name: row[0], short: row[1], rep: row[2], stadium: row[3], colors: [row[4], row[5]] }))
        .sort((a, b) => b.rep - a.rep);
      const html = '<div class="chips" role="tablist">' + leagues.map((l) => '<button class="chip ' + (l.id === L.id ? 'on' : '') + '" data-act="new-league" data-id="' + l.id + '">' + esc(l.name) + ' · ' + esc(l.country) + '</button>').join('') + '</div>' +
        '<section class="card"><div class="section-head"><h2>Elige club</h2><span class="small muted">' + clubs.length + ' clubes</span></div><div class="plist">' +
        clubs.map((c) => {
          const lvl = Math.round(MCM.generator.baseOvr(c.rep) + 2);
          const budget = MCM.generator.transferBudget(c.rep, L.wealth || 1);
          return '<button class="prow" data-act="new-club" data-id="' + esc(U.slug(c.name)) + '">' + UI.crest(c, 34) +
            '<span class="grow"><span class="name ellipsis" style="display:block">' + esc(c.name) + '</span><span class="meta">' + esc(c.stadium || 'Estadio sin datos') + ' · Presupuesto ' + U.money(budget) + '</span></span>' +
            UI.ovr(lvl) + '</button>';
        }).join('') + '</div></section>';
      return { title: 'Nueva carrera', sub: 'Paso 1 de 2 · Liga y club', html, tabs: false };
    }
    const row = L.clubs.find((r) => U.slug(r[0]) === App.ui.newClub);
    const club = { name: row[0], short: row[1], rep: row[2], stadium: row[3], colors: [row[4], row[5]] };
    const html = '<section class="card"><div class="row">' + UI.crest(club, 56) + '<div class="grow"><h2>' + esc(club.name) + '</h2><div class="small muted">' + esc(L.name) + ' · ' + esc(L.country) + '</div><div class="small muted">' + esc(club.stadium || '') + '</div></div></div>' +
      '<button class="btn sm ghost" data-act="new-club-reset" style="justify-self:start">Cambiar club</button></section>' +
      '<form class="card" id="new-form" data-submit="create-career">' +
      '<label class="field" for="nc-name">Nombre de la carrera<input class="input" id="nc-name" name="name" maxlength="60" value="' + esc('Carrera con ' + club.name) + '"></label>' +
      '<label class="field" for="nc-manager">Nombre del entrenador<input class="input" id="nc-manager" name="manager" maxlength="40" value="' + esc(App.profile || '') + '" placeholder="Tu nombre"></label>' +
      '<p class="small muted">Propietario: <b>' + esc(App.profile || 'Jugador local') + '</b> (puedes cambiarlo en Ajustes). La carrera es independiente: crearla no modifica ninguna otra.</p>' +
      '<button class="btn primary block" type="submit">' + icon('play') + 'Crear carrera</button></form>';
    return { title: 'Nueva carrera', sub: 'Paso 2 de 2 · Detalles', html, tabs: false };
  };

  VIEWS.hub = function () {
    const s = App.s;
    const club = C.userClub(s);
    const L = C.userLeague(s);
    const table = SC.table(L);
    const me = table.find((r) => r.clubId === s.clubId);
    const unread = s.news.filter((n) => !n.read).length;
    let html = '<section class="card"><div class="row">' + UI.crest(club, 54) + '<div class="grow"><h2 class="ellipsis">' + esc(club.name) + '</h2>' +
      '<div class="small muted">' + esc(L.name) + ' · ' + esc(s.season.label) + ' · ' + esc(s.managerName) + '</div></div>' +
      '<div style="text-align:right"><div class="scoreboard" style="font-size:2rem">' + me.pos + 'º</div><div class="small muted num">' + me.pts + ' pts</div></div></div>' +
      '<div class="row wrap"><span class="pill info">Objetivo: ' + esc(club.objective.text) + '</span>' +
      (me.form.length ? '<span class="row" style="gap:4px">' + me.form.map((r) => '<span class="res ' + r + '">' + r + '</span>').join('') + '</span>' : '') + '</div></section>';

    const md = C.nextMd(s);
    if (md) {
      const f = C.userFixture(s, md);
      if (f) {
        const home = s.clubs[f.home];
        const away = s.clubs[f.away];
        html += '<section class="card hero-match"><div class="section-head"><span class="eyebrow">Jornada ' + md + ' de ' + L.totalMd + '</span><span class="small muted">' + esc(U.dateLabel(f.date)) + '</span></div>' +
          '<div class="fixture"><div class="team">' + UI.crest(home, 52) + '<span class="nm">' + esc(home.name) + '</span><span class="small muted">Media ' + C.teamRatingCache(s, home.id) + '</span></div>' +
          (f.played ? '<div class="scoreboard">' + f.hg + '-' + f.ag + '</div>' : '<div class="vs">VS</div>') +
          '<div class="team">' + UI.crest(away, 52) + '<span class="nm">' + esc(away.name) + '</span><span class="small muted">Media ' + C.teamRatingCache(s, away.id) + '</span></div></div>';
        if (!f.played) {
          const warns = LU.warnings(club.lineup || LU.autoPick(C.squad(s, s.clubId), club.tactics.formation), C.squad(s, s.clubId)).filter((w) => w.level !== 'info');
          if (warns.length && !s.settings.autoLineup) html += '<button class="notice" data-act="nav" data-view="tactics" style="text-align:left">⚠ ' + warns.length + ' aviso' + (warns.length > 1 ? 's' : '') + ' en tu alineación. Toca para revisar.</button>';
          html += '<div class="btn-row"><button class="btn primary" data-act="sim-match">' + icon('play') + 'Simular partido</button>' +
            '<button class="btn" data-act="sim-md-ask">Simular jornada</button></div>' +
            '<button class="btn ghost sm" data-act="nav" data-view="tactics">' + icon('tactics') + (s.settings.autoLineup ? 'Alineación automática · ' : 'Alineación manual · ') + esc(club.tactics.formation) + '</button>';
        } else {
          html += '<p class="small">' + esc(f.report ? f.report.summary : '') + '</p><div class="btn-row"><button class="btn" data-act="match" data-id="' + f.id + '" data-league="' + L.id + '">Ver crónica</button>' +
            '<button class="btn primary" data-act="sim-md">Completar jornada</button></div>';
        }
        html += '</section>';
      }
    } else {
      html += '<section class="card hero-match"><span class="eyebrow">Fin de temporada ' + esc(s.season.label) + '</span>' +
        '<h2>' + icon('trophy').replace('<svg', '<svg width="22" height="22" style="vertical-align:-3px;margin-right:6px"') + esc(s.clubs[table[0].clubId].name) + ', campeón</h2>' +
        '<p>Has terminado ' + me.pos + 'º con ' + me.pts + ' puntos. Objetivo: ' + esc(club.objective.text.toLowerCase()) + ' — ' + (me.pos <= club.objective.target ? '<b style="color:var(--good)">cumplido</b>' : '<b style="color:var(--bad)">no cumplido</b>') + '.</p>' +
        '<button class="btn primary block" data-act="end-season-ask">Cerrar temporada y empezar ' + esc(C.seasonLabel(s.season.year + 1)) + '</button></section>';
    }

    const last = L.fixtures.filter((f) => f.played && f.report && (f.home === s.clubId || f.away === s.clubId)).sort((a, b) => b.md - a.md)[0];
    if (last && (!md || last.md !== md)) {
      const r = UI.resultFor(last, s.clubId);
      html += '<button class="card" data-act="match" data-id="' + last.id + '" data-league="' + L.id + '" style="text-align:left"><span class="eyebrow">Último partido · J' + last.md + '</span>' +
        '<div class="row"><span class="res ' + r + '">' + r + '</span><span class="grow ellipsis"><b>' + esc(s.clubs[last.home].short) + ' ' + last.hg + '-' + last.ag + ' ' + esc(s.clubs[last.away].short) + '</b></span><span class="small muted">Ver crónica ›</span></div></button>';
    }

    // Mini clasificación
    const idx = table.findIndex((r) => r.clubId === s.clubId);
    const from = U.clamp(idx - 2, 0, Math.max(0, table.length - 5));
    html += '<section class="card"><div class="section-head"><h3>Clasificación</h3><button class="btn ghost sm" data-act="tab" data-view="table">Completa ›</button></div>' + tableHtml(L, table.slice(from, from + 5), true) + '</section>';

    // Noticias
    html += '<section class="card"><div class="section-head"><h3>Noticias' + (unread ? ' <span class="pill solid-accent">' + unread + '</span>' : '') + '</h3><button class="btn ghost sm" data-act="nav" data-view="news">Todas ›</button></div>' +
      s.news.slice(0, 3).map(newsItem).join('') + '</section>';
    return { title: club.name, sub: s.name, html };
  };

  function newsItem(n) {
    return '<div class="news-item ' + (n.read ? '' : 'unread') + '"><span class="t">' + esc(n.title) + '</span><span class="small">' + esc(n.body) + '</span><span class="small muted">' + esc(n.season) + ' · Jornada ' + n.md + '</span></div>';
  }

  function tableHtml(L, rows, compact) {
    const s = App.s;
    return '<div class="table-wrap"><table class="tbl"><thead><tr><th></th><th class="l">#</th><th class="l">Club</th><th>PJ</th>' +
      (compact ? '' : '<th>G</th><th>E</th><th>P</th><th>GF:GC</th>') + '<th>DG</th><th>Pts</th>' + (compact ? '' : '<th class="l">Forma</th>') + '</tr></thead><tbody>' +
      rows.map((r) => {
        const c = s.clubs[r.clubId];
        return '<tr class="' + (r.clubId === s.clubId ? 'me' : '') + '"><td class="zone ' + SC.zone(L, r.pos) + '"></td><td class="l">' + r.pos + '</td>' +
          '<td class="l club"><span class="row" style="gap:8px">' + UI.crest(c, 20) + '<span class="ellipsis">' + esc(compact ? c.name : c.name) + '</span></span></td><td>' + r.p + '</td>' +
          (compact ? '' : '<td>' + r.w + '</td><td>' + r.d + '</td><td>' + r.l + '</td><td>' + r.gf + ':' + r.ga + '</td>') +
          '<td>' + (r.gd > 0 ? '+' : '') + r.gd + '</td><td class="pts">' + r.pts + '</td>' +
          (compact ? '' : '<td class="l"><span class="row" style="gap:2px">' + r.form.map((x) => '<span class="res ' + x + '" style="width:18px;height:18px;font-size:0.7rem">' + x + '</span>').join('') + '</span></td>') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  VIEWS.menu = function () {
    const s = App.s;
    const items = [
      ['hub', 'Continuar carrera', 'Partido y jornada', 'resume', null],
      ['new-career', 'Nueva carrera', 'Elige liga y club', 'plus', null],
      ['careers', 'Mis carreras guardadas', App.metas.length + ' en este dispositivo', 'folder', null],
      ['club', 'Club y plantilla', 'Estadio, objetivos, historial', 'club', null],
      ['market', 'Mercado de fichajes', 'Buscar jugadores', 'transfer', 2],
      ['freeagents', 'Agentes libres', s.freeAgents.length + ' sin equipo', 'free', 2],
      ['tactics', 'Tácticas y alineación', s.clubs[s.clubId].tactics.formation, 'tactics', null],
      ['calendar', 'Calendario y resultados', 'Jornadas y crónicas', 'calendar', null],
      ['table', 'Clasificación', 'Tablas y goleadores', 'table', null],
      ['youth', 'Cantera y jóvenes promesas', 'Sub-21 del club', 'youth', 3],
      ['finance', 'Finanzas y contratos', U.money(s.clubs[s.clubId].budget) + ' disponibles', 'money', 2],
      ['news', 'Noticias', s.news.filter((n) => !n.read).length + ' sin leer', 'news', null],
      ['settings', 'Ajustes', 'Guardado, exportar, tema', 'settings', null],
    ];
    const html = '<div class="menu-grid">' + items.map((it) => '<button class="menu-item" data-act="' + (it[0] === 'new-career' ? 'new-career' : 'nav') + '" data-view="' + it[0] + '">' + icon(it[3]) + '<b>' + esc(it[1]) + '</b><span>' + esc(it[2]) + '</span>' +
      (it[4] ? '<span class="pill mute" style="justify-self:start">Parcial · ' + esc(STAGE_NOTE[it[4]].split(' · ')[0]) + '</span>' : '') + '</button>').join('') + '</div>';
    return { title: 'Menú principal', sub: s.name, html };
  };

  VIEWS.squad = function () {
    const s = App.s;
    const all = C.squad(s, s.clubId);
    const f = App.ui.squadFilter;
    const lineOf = (p) => PL.POSITIONS[p.pos].line;
    let list = all.filter((p) => f === 'ALL' || lineOf(p) === f);
    const sorters = {
      pos: (a, b) => PL.POS_ORDER.indexOf(a.pos) - PL.POS_ORDER.indexOf(b.pos) || b.ovr - a.ovr,
      ovr: (a, b) => b.ovr - a.ovr,
      age: (a, b) => a.age - b.age,
      fit: (a, b) => a.fitness - b.fitness,
    };
    list = list.sort(sorters[App.ui.squadSort]);
    const avail = all.filter(PL.isAvailable).length;
    const xi = new Set((C.userClub(s).lineup || { xi: [] }).xi);
    const html = '<section class="kv"><div><span>Jugadores</span><b>' + all.length + '</b></div><div><span>Disponibles</span><b>' + avail + '</b></div>' +
      '<div><span>Edad media</span><b>' + U.avg(all.map((p) => p.age)).toFixed(1) + '</b></div><div><span>Valor</span><b>' + U.money(C.squadValue(s, s.clubId)) + '</b></div></section>' +
      '<div class="chips">' + [['ALL', 'Todos'], ['GK', 'Porteros'], ['DEF', 'Defensas'], ['MID', 'Centrocampistas'], ['ATT', 'Delanteros']].map((c) => '<button class="chip ' + (f === c[0] ? 'on' : '') + '" data-act="squad-filter" data-v="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>' +
      '<div class="chips">' + [['pos', 'Posición'], ['ovr', 'Media'], ['age', 'Edad'], ['fit', 'Forma física']].map((c) => '<button class="chip ' + (App.ui.squadSort === c[0] ? 'on' : '') + '" data-act="squad-sort" data-v="' + c[0] + '">Ordenar: ' + c[1] + '</button>').join('') + '</div>' +
      '<section class="card"><div class="plist">' + list.map((p) => UI.playerRow(p, { meta: (xi.has(p.id) ? 'Titular · ' : '') + p.stats.apps + ' PJ · ' + p.stats.goals + ' G' })).join('') + '</div></section>';
    return { title: 'Plantilla', sub: C.userClub(s).name + ' · ' + s.season.label, html };
  };

  VIEWS.player = function (params) {
    const s = App.s;
    const p = s.players[params.id];
    if (!p) return { title: 'Jugador', html: '<div class="card empty">Este jugador ya no está en la base de datos (retirado).</div>' };
    const club = p.clubId ? s.clubs[p.clubId] : null;
    const st = PL.statusOf(p);
    const attrs = p.pos === 'POR' ? PL.GK_ATTRS : PL.OUT_ATTRS;
    const sts = p.stats;
    let html = '<section class="card"><div class="row">' + UI.ovr(p.ovr, 'lg') + '<div class="grow"><h2>' + esc(p.name) + '</h2>' +
      '<div class="small muted">' + esc(PL.POSITIONS[p.pos].name) + (p.alt.length ? ' · también ' + p.alt.join(', ') : '') + '</div>' +
      '<div class="small muted">' + p.age + ' años · ' + esc(MCM.DATA.nationName(p.nat)) + '</div></div>' +
      '<div style="text-align:center"><div class="eyebrow">Pot.</div><div class="scoreboard" style="font-size:1.8rem">' + p.pot + '</div></div></div>' +
      '<div class="row wrap">' + (club ? '<span class="row" style="gap:6px">' + UI.crest(club, 20) + '<span class="small">' + esc(club.name) + '</span></span>' : '<span class="pill mute">Agente libre</span>') +
      '<span class="pill ' + (st.code === 'ok' ? 'good' : st.code === 'tired' ? 'warn' : 'bad') + '">' + esc(st.label) + '</span>' +
      (p.youth ? '<span class="pill info">Cantera</span>' : '') + (p.demo ? '<span class="pill mute">Ficticio (demo)</span>' : '') + '</div></section>';
    html += '<section class="kv"><div><span>Valor de mercado</span><b>' + U.money(p.value) + '</b></div><div><span>Salario</span><b>' + U.wage(p.wage) + '</b></div>' +
      '<div><span>Contrato hasta</span><b>Jun ' + (p.contractEnd) + '</b></div><div><span>Forma (nota)</span><b>' + p.form.toFixed(1) + '</b></div></section>';
    html += '<section class="card"><h3>Estado</h3>' +
      '<div class="attr"><span>Forma física</span>' + UI.bar(p.fitness, 100) + '<b>' + Math.round(p.fitness) + '</b></div>' +
      '<div class="attr"><span>Moral</span>' + UI.bar(p.morale, 100, p.morale < 45 ? 'bad' : 'accent') + '<b>' + Math.round(p.morale) + '</b></div>' +
      '<p class="small muted">Moral: ' + UI.moraleLabel(p.morale) + '. Amarillas acumuladas: ' + p.yc + '/5.</p></section>';
    html += '<section class="card"><h3>Atributos</h3>' + attrs.map((a) => '<div class="attr"><span>' + a[1] + '</span>' + UI.bar(p.attrs[a[0]], 99, 'accent') + '<b>' + p.attrs[a[0]] + '</b></div>').join('') + '</section>';
    html += '<section class="card"><h3>Temporada ' + esc(s.season.label) + '</h3><div class="grid-3">' +
      [['Partidos', sts.apps], ['Titular', sts.starts], ['Minutos', sts.min], ['Goles', sts.goals], ['Asist.', sts.assists], ['Nota', sts.rN ? (sts.rSum / sts.rN).toFixed(2) : '—'],
        ['MVP', sts.motm], ['Amarillas', sts.yel], ['Rojas', sts.red]].map((x) => '<div class="kv" style="display:block"><div><span>' + x[0] + '</span><b>' + x[1] + '</b></div></div>').join('') + '</div></section>';
    html += '<section class="card"><h3>Historial de lesiones</h3>' + (p.injuries.length
      ? p.injuries.slice().reverse().map((i) => '<div class="row"><span class="grow">' + esc(i.type) + '</span><span class="small muted">' + esc(i.season) + ' · ' + i.weeks + ' sem.</span></div>').join('')
      : '<p class="small muted">Sin lesiones registradas.</p>') + '</section>';
    return { title: p.name, sub: p.pos + ' · ' + (club ? club.name : 'Sin club'), html };
  };

  VIEWS.tactics = function () {
    const s = App.s;
    const club = C.userClub(s);
    const squad = C.squad(s, s.clubId);
    if (!club.lineup || club.lineup.formation !== club.tactics.formation) club.lineup = LU.autoPick(squad, club.tactics.formation);
    const lu = club.lineup;
    const slots = LU.FORMATIONS[lu.formation];
    const t = club.tactics;
    const warns = LU.warnings(lu, squad);
    let html = '<section class="card"><label class="switch" for="auto-lu"><span><b>Alineación automática</b><br><span class="small muted">El asistente elige el mejor once disponible antes de cada partido.</span></span>' +
      '<input type="checkbox" id="auto-lu" data-change="auto-lineup"' + (s.settings.autoLineup ? ' checked' : '') + '></label></section>';
    html += '<div class="chips">' + Object.keys(LU.FORMATIONS).map((fm) => '<button class="chip ' + (fm === lu.formation ? 'on' : '') + '" data-act="formation" data-v="' + fm + '">' + fm + '</button>').join('') + '</div>';
    html += '<div class="pitch"><svg class="lines" viewBox="0 0 68 92" preserveAspectRatio="none" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="0.4"><rect x="2" y="2" width="64" height="88"/><path d="M2 46h64"/><circle cx="34" cy="46" r="8"/><rect x="16" y="2" width="36" height="14"/><rect x="16" y="76" width="36" height="14"/><rect x="26" y="2" width="16" height="5"/><rect x="26" y="85" width="16" height="5"/></svg>' +
      slots.map((sl, i) => {
        const p = s.players[lu.xi[i]];
        const fit = p ? PL.fitLabel(PL.fit(p, sl[0])) : '';
        return '<button class="slot fit-' + fit + '" style="left:' + sl[1] + '%;top:' + sl[2] + '%" data-act="slot" data-i="' + i + '">' +
          (p ? UI.ovr(p.ovr) : '<span class="ovr empty">?</span>') + '<span class="lab">' + esc(p ? shortName(p.name) : 'Vacío') + '</span><span class="p">' + sl[0] + '</span></button>';
      }).join('') + '</div>';
    html += '<p class="small muted">Toca un jugador del campo para cambiarlo. Borde amarillo: adaptado a la posición. Borde rojo: fuera de posición.</p>';
    html += '<section class="card"><h3>Avisos</h3>' + (warns.length ? '<div class="warn-list">' + warns.map((w) => '<div class="warn-item ' + w.level + '"><i></i><span>' + esc(w.text) + '</span></div>').join('') + '</div>' : '<p class="small" style="color:var(--good)">Alineación sin problemas.</p>') + '</section>';
    html += '<section class="card"><h3>Instrucciones</h3>' + [['mentality', 'Mentalidad', 'Más ataque genera ocasiones pero deja huecos atrás.'], ['pressing', 'Presión', 'La presión alta da control del balón pero cansa más y provoca más tarjetas.'], ['tempo', 'Ritmo', 'Un ritmo rápido produce más disparos para ambos equipos.']].map((g) =>
      '<div class="stack"><span class="eyebrow">' + g[1] + '</span><div class="chips">' + LU.TACTIC_OPTIONS[g[0]].map((o) => '<button class="chip ' + (t[g[0]] === o[0] ? 'on' : '') + '" data-act="tactic" data-k="' + g[0] + '" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div><span class="small muted">' + g[2] + '</span></div>').join('') + '</section>';
    html += '<section class="card"><div class="section-head"><h3>Banquillo</h3><span class="small muted">' + lu.bench.length + ' suplentes</span></div><div class="plist">' +
      lu.bench.map((id) => s.players[id]).filter(Boolean).map((p) => UI.playerRow(p)).join('') + '</div>' +
      '<button class="btn block" data-act="auto-pick">Rehacer once automático</button></section>';
    const out = squad.filter((p) => !PL.isAvailable(p));
    if (out.length) html += '<section class="card"><h3>No disponibles</h3><div class="plist">' + out.map((p) => UI.playerRow(p)).join('') + '</div></section>';
    return { title: 'Tácticas y alineación', sub: club.name + ' · ' + lu.formation, html };
  };
  function shortName(n) { const parts = n.split(' '); return parts.length > 1 ? parts[0][0] + '. ' + parts.slice(1).join(' ') : n; }

  VIEWS.calendar = function () {
    const s = App.s;
    const L = C.userLeague(s);
    const mine = L.fixtures.filter((f) => f.home === s.clubId || f.away === s.clubId).sort((a, b) => a.md - b.md);
    const md = App.ui.calMd || Math.max(1, Math.min(L.totalMd, L.played || 1));
    const mdFix = L.fixtures.filter((f) => f.md === md);
    let html = '<section class="card"><div class="section-head"><h3>Jornada ' + md + '</h3><span class="row" style="gap:6px"><button class="btn sm" data-act="cal-md" data-v="' + (md - 1) + '"' + (md <= 1 ? ' disabled' : '') + ' aria-label="Jornada anterior">‹</button><button class="btn sm" data-act="cal-md" data-v="' + (md + 1) + '"' + (md >= L.totalMd ? ' disabled' : '') + ' aria-label="Jornada siguiente">›</button></span></div>' +
      '<div class="stack">' + mdFix.map((f) => {
        const h = s.clubs[f.home]; const a = s.clubs[f.away];
        const mineF = f.home === s.clubId || f.away === s.clubId;
        return '<button class="row" data-act="match" data-id="' + f.id + '" data-league="' + L.id + '" style="border:0;background:' + (mineF ? 'var(--accent-soft)' : 'none') + ';padding:6px;border-radius:10px;text-align:left"' + (f.played ? '' : ' disabled') + '>' +
          '<span class="grow ellipsis" style="text-align:right">' + esc(h.name) + '</span>' + UI.crest(h, 20) +
          '<b class="num" style="min-width:44px;text-align:center">' + (f.played ? f.hg + '-' + f.ag : '–') + '</b>' + UI.crest(a, 20) +
          '<span class="grow ellipsis">' + esc(a.name) + '</span></button>';
      }).join('') + '</div></section>';
    html += '<section class="card"><h3>Mis partidos</h3><div class="plist">' + mine.map((f) => {
      const home = f.home === s.clubId;
      const rival = s.clubs[home ? f.away : f.home];
      const r = UI.resultFor(f, s.clubId);
      return '<button class="prow" data-act="' + (f.played ? 'match' : 'noop') + '" data-id="' + f.id + '" data-league="' + L.id + '">' +
        '<span class="pos">J' + f.md + '</span>' + UI.crest(rival, 26) +
        '<span class="grow"><span class="name ellipsis" style="display:block">' + esc(rival.name) + '</span><span class="meta">' + (home ? 'Local' : 'Visitante') + ' · ' + esc(U.dateLabel(f.date)) + '</span></span>' +
        (f.played ? '<b class="num">' + f.hg + '-' + f.ag + '</b><span class="res ' + r + '">' + r + '</span>' : '<span class="small muted">Pendiente</span>') + '</button>';
    }).join('') + '</div></section>';
    return { title: 'Calendario', sub: L.name + ' · ' + s.season.label + ' · ' + L.played + '/' + L.totalMd + ' jornadas', html };
  };

  VIEWS.match = function (params) {
    const s = App.s;
    const L = s.leagues[params.league];
    const f = L && L.fixtures.find((x) => x.id === params.id);
    if (!f) return { title: 'Partido', html: '<div class="card empty">Partido no encontrado.</div>' };
    const home = s.clubs[f.home]; const away = s.clubs[f.away];
    let html = '<section class="card hero-match"><span class="eyebrow">' + esc(L.name) + ' · Jornada ' + f.md + ' · ' + esc(U.dateLabel(f.date)) + '</span>' +
      '<div class="fixture"><div class="team">' + UI.crest(home, 52) + '<span class="nm">' + esc(home.name) + '</span></div><div class="scoreboard">' + f.hg + '-' + f.ag + '</div><div class="team">' + UI.crest(away, 52) + '<span class="nm">' + esc(away.name) + '</span></div></div>';
    const rep = f.report;
    if (!rep) {
      html += (f.goals && f.goals.length ? '<div class="timeline">' + f.goals.map((g) => evRow(g[0], g[1], '⚽ ' + esc(g[2]))).join('') + '</div>' : '<p class="small muted">Sin crónica detallada para este partido.</p>') + '</section>';
      return { title: home.short + ' ' + f.hg + '-' + f.ag + ' ' + away.short, sub: 'Resultado', html };
    }
    html += '<p>' + esc(rep.summary) + '</p>';
    if (rep.motm) html += '<div class="row"><span class="pill solid-accent">Mejor jugador</span><b>' + esc(rep.motm.name) + '</b><span class="small muted">' + rep.motm.r.toFixed(1) + '</span></div>';
    html += '</section>';
    if (rep.notices && rep.notices.length) html += '<section class="notice">' + rep.notices.map(esc).join('<br>') + '</section>';
    html += '<section class="card"><h3>Desarrollo</h3><div class="timeline">' + (rep.events.length ? rep.events.map((e) => {
      let t = '';
      if (e.type === 'goal') t = '⚽ <b>' + esc(e.name) + '</b>' + (e.assist ? '<div class="sub">Asist. ' + esc(e.assist) + '</div>' : '');
      else if (e.type === 'yellow') t = '<i class="ico yellow"></i>' + esc(e.name);
      else if (e.type === 'red') t = '<i class="ico red"></i>' + esc(e.name) + (e.second ? ' <span class="sub">(2ª amarilla)</span>' : '');
      else if (e.type === 'injury') t = '✚ ' + esc(e.name) + '<div class="sub">Lesión · ' + e.weeks + ' sem.</div>';
      else if (e.type === 'sub') t = '⇄ ' + esc(e.name) + '<div class="sub">por ' + esc(e.out) + '</div>';
      return evRow(e.min, e.side, t);
    }).join('') : '<p class="small muted">Partido sin incidencias.</p>') + '</div></section>';
    const st = rep.stats;
    const line = (lbl, a, b, fmt) => {
      const tot = a + b || 1;
      return '<div class="statline"><span class="lbl">' + lbl + '</span><span class="v">' + (fmt ? fmt(a) : a) + '</span><div class="duel"><i style="width:' + (a / tot * 100) + '%"></i><i style="width:' + (b / tot * 100) + '%"></i></div><span class="v">' + (fmt ? fmt(b) : b) + '</span></div>';
    };
    html += '<section class="card"><h3>Estadísticas</h3>' + line('Posesión', st.poss[0], st.poss[1], (x) => x + '%') + line('Tiros', st.shots[0], st.shots[1]) + line('A puerta', st.sot[0], st.sot[1]) +
      line('Goles esperados (xG)', st.xg[0], st.xg[1], (x) => x.toFixed(1)) + line('Córners', st.corners[0], st.corners[1]) + line('Faltas', st.fouls[0], st.fouls[1]) +
      line('Amarillas', st.yellows[0], st.yellows[1]) + line('Rojas', st.reds[0], st.reds[1]) + '</section>';
    html += '<section class="grid-2">' + rep.lineups.map((lu, i) => '<div class="card flat" style="padding:12px"><span class="eyebrow">' + esc((i ? away : home).short) + ' · ' + esc(lu.formation) + '</span>' +
      lu.xi.concat(lu.subs).map((p, k) => '<div class="row small" style="gap:6px' + (k >= lu.xi.length ? ';color:var(--muted)' : '') + '"><span style="width:30px;font-weight:700">' + esc(p.pos) + '</span><span class="grow ellipsis">' + esc(shortName(p.name)) + '</span><b class="num">' + (p.r ? p.r.toFixed(1) : '—') + '</b></div>').join('') + '</div>').join('') + '</section>';
    return { title: home.short + ' ' + f.hg + '-' + f.ag + ' ' + away.short, sub: 'Crónica del partido', html };
  };
  function evRow(min, side, content) {
    return '<div class="ev"><div class="l">' + (side === 0 ? content : '') + '</div><div class="m">' + min + "'</div><div>" + (side === 1 ? content : '') + '</div></div>';
  }

  VIEWS.table = function () {
    const s = App.s;
    const lid = App.ui.tableLeague || C.userClub(s).leagueId;
    const L = s.leagues[lid];
    const tab = App.ui.tableTab;
    let html = '<div class="chips">' + Object.values(s.leagues).map((l) => '<button class="chip ' + (l.id === lid ? 'on' : '') + '" data-act="table-league" data-v="' + l.id + '">' + esc(l.name) + '</button>').join('') + '</div>' +
      '<div class="chips"><button class="chip ' + (tab === 'table' ? 'on' : '') + '" data-act="table-tab" data-v="table">Clasificación</button><button class="chip ' + (tab === 'scorers' ? 'on' : '') + '" data-act="table-tab" data-v="scorers">Goleadores</button></div>';
    if (tab === 'table') {
      html += '<section class="card"><div class="section-head"><h3>' + esc(L.name) + '</h3><span class="small muted">Jornada ' + L.played + '/' + L.totalMd + '</span></div>' + tableHtml(L, SC.table(L), false) +
        '<div class="legend">' + (L.tier === 1 ? '<span><i class="zone ucl"></i>Liga de Campeones</span><span><i class="zone euro"></i>Otras europeas</span>' + (L.relegate ? '<span><i class="zone rel"></i>Descenso</span>' : '') : '<span><i class="zone pro"></i>Ascenso directo</span>') + '</div>' +
        (!L.relegate && L.tier === 1 ? '<p class="small muted">En la base de demo esta liga no tiene segunda división cargada, así que no hay descensos.</p>' : '') + '</section>';
    } else {
      const top = C.topScorers(s, lid, 20);
      html += '<section class="card"><h3>Máximos goleadores</h3>' + (top.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th class="l">#</th><th class="l">Jugador</th><th>PJ</th><th>G</th><th>A</th></tr></thead><tbody>' +
        top.map((p, i) => '<tr class="' + (p.clubId === s.clubId ? 'me' : '') + '"><td class="l">' + (i + 1) + '</td><td class="l"><span class="row" style="gap:8px">' + UI.crest(s.clubs[p.clubId], 18) + '<span class="ellipsis">' + esc(p.name) + '</span></span></td><td>' + p.stats.apps + '</td><td class="pts">' + p.stats.goals + '</td><td>' + p.stats.assists + '</td></tr>').join('') +
        '</tbody></table></div>' : '<p class="small muted">Aún no se han marcado goles.</p>') + '</section>';
    }
    return { title: 'Clasificación', sub: L.name + ' · ' + s.season.label, html };
  };

  VIEWS.club = function () {
    const s = App.s;
    const club = C.userClub(s);
    const L = C.userLeague(s);
    let html = '<section class="card"><div class="row">' + UI.crest(club, 64) + '<div class="grow"><h2>' + esc(club.name) + '</h2><div class="small muted">' + esc(L.name) + ' · ' + esc(club.country) + '</div><div class="small muted">Estadio: ' + esc(club.stadium || 'sin datos') + '</div></div></div>' +
      '<div class="attr"><span>Reputación</span>' + UI.bar(club.rep, 100, 'accent') + '<b>' + club.rep + '</b></div></section>' +
      '<section class="kv"><div><span>Media del once</span><b>' + C.teamRatingCache(s, club.id) + '</b></div><div><span>Valor plantilla</span><b>' + U.money(C.squadValue(s, club.id)) + '</b></div>' +
      '<div><span>Presupuesto</span><b>' + U.money(club.budget) + '</b></div><div><span>Masa salarial</span><b>' + U.wage(C.wageBill(s, club.id)) + '</b></div></section>' +
      '<section class="card"><h3>Objetivo de la directiva</h3><p>' + esc(club.objective.text) + '</p><p class="small muted">Puesto exigido: ' + club.objective.target + 'º o mejor.</p></section>' +
      '<button class="btn block" data-act="tab" data-view="squad">' + icon('squad') + 'Ver plantilla</button>';
    html += '<section class="card"><h3>Historial de temporadas</h3>' + (s.history.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th class="l">Temp.</th><th class="l">Liga</th><th>Pos</th><th>Pts</th><th class="l">Objetivo</th></tr></thead><tbody>' +
      s.history.map((h) => '<tr><td class="l">' + esc(h.season) + '</td><td class="l">' + esc(h.league) + (h.movement ? '<div class="small muted">' + esc(h.movement) + '</div>' : '') + '</td><td>' + h.pos + 'º</td><td>' + h.pts + '</td><td class="l">' + (h.objectiveMet ? '<span class="pill good">Cumplido</span>' : '<span class="pill bad">No</span>') + '</td></tr>').join('') +
      '</tbody></table></div>' : '<p class="small muted">Aún no has completado ninguna temporada.</p>') + '</section>';
    if (s.archive.length) {
      html += '<section class="card"><h3>Campeones</h3>' + s.archive.map((a) => '<div class="stack"><span class="eyebrow">' + esc(a.season) + '</span>' +
        Object.keys(a.champions).map((lid) => '<div class="row small"><span class="grow">' + esc(s.leagues[lid] ? s.leagues[lid].name : lid) + '</span><b>' + esc(a.champions[lid]) + '</b></div>').join('') + '</div>').join('') + '</section>';
    }
    return { title: 'Club', sub: club.name, html };
  };

  VIEWS.finance = function () {
    const s = App.s;
    const club = C.userClub(s);
    const squad = C.squad(s, club.id).sort((a, b) => a.contractEnd - b.contractEnd || b.wage - a.wage);
    const wages = C.wageBill(s, club.id);
    const endYear = s.season.year + 1;
    let html = '<section class="kv"><div><span>Presupuesto fichajes</span><b>' + U.money(club.budget) + '</b></div><div><span>Salarios / semana</span><b>' + U.money(wages) + '</b></div>' +
      '<div><span>Salarios / temporada</span><b>' + U.money(wages * 52) + '</b></div><div><span>Valor plantilla</span><b>' + U.money(C.squadValue(s, club.id)) + '</b></div></section>' +
      '<section class="notice info">Todos los salarios del juego se expresan en euros por semana. La negociación de renovaciones, ingresos por taquilla y el balance detallado llegan en la Etapa 2. Por ahora, los contratos que vencen se renuevan automáticamente al cerrar la temporada.</section>' +
      '<section class="card"><h3>Contratos</h3><div class="table-wrap"><table class="tbl"><thead><tr><th class="l">Jugador</th><th>Media</th><th>Salario</th><th>Fin</th></tr></thead><tbody>' +
      squad.map((p) => '<tr><td class="l"><button data-act="player" data-id="' + p.id + '" style="border:0;background:none;padding:0;text-align:left;font-weight:600">' + esc(p.name) + '</button><div class="small muted">' + p.pos + ' · ' + p.age + ' años</div></td><td>' + p.ovr + '</td><td>' + U.money(p.wage) + '</td><td>' +
        (p.contractEnd <= endYear ? '<span class="pill warn">' + p.contractEnd + '</span>' : p.contractEnd) + '</td></tr>').join('') + '</tbody></table></div></section>';
    return { title: 'Finanzas y contratos', sub: club.name, html };
  };

  VIEWS.market = function () {
    const s = App.s;
    const q = App.ui.marketQ.trim().toLowerCase();
    const pos = App.ui.marketPos;
    const minOvr = App.ui.marketMinOvr;
    const res = Object.values(s.players).filter((p) => p.clubId && p.clubId !== s.clubId && (pos === 'ALL' || p.pos === pos) && p.ovr >= minOvr && (!q || p.name.toLowerCase().includes(q)))
      .sort((a, b) => b.ovr - a.ovr).slice(0, 60);
    let html = '<section class="notice">Vista previa del mercado: puedes buscar y consultar jugadores. Las ofertas, negociaciones, ventas y cesiones llegan en la Etapa 2.</section>' +
      '<form class="card" data-submit="market-search"><label class="field" for="mk-q">Buscar por nombre<input class="input" id="mk-q" name="q" value="' + esc(App.ui.marketQ) + '" placeholder="Nombre del jugador"></label>' +
      '<div class="grid-2"><label class="field" for="mk-pos">Posición<select class="input" id="mk-pos" name="pos"><option value="ALL">Todas</option>' + PL.POS_ORDER.map((p) => '<option value="' + p + '"' + (p === pos ? ' selected' : '') + '>' + p + '</option>').join('') + '</select></label>' +
      '<label class="field" for="mk-ovr">Media mínima<input class="input" id="mk-ovr" name="ovr" type="number" inputmode="numeric" min="0" max="99" value="' + (minOvr || '') + '"></label></div>' +
      '<button class="btn primary" type="submit">Buscar</button></form>' +
      '<section class="card"><div class="section-head"><h3>Resultados</h3><span class="small muted">' + res.length + (res.length === 60 ? '+' : '') + '</span></div><div class="plist">' +
      res.map((p) => UI.playerRow(p, { meta: esc(s.clubs[p.clubId].short) + ' · ' + U.money(p.value) })).join('') + '</div></section>';
    return { title: 'Mercado de fichajes', sub: 'Presupuesto ' + U.money(C.userClub(s).budget), html };
  };

  VIEWS.freeagents = function () {
    const s = App.s;
    const pos = App.ui.faPos;
    const list = s.freeAgents.map((id) => s.players[id]).filter((p) => p && (pos === 'ALL' || p.pos === pos)).sort((a, b) => b.ovr - a.ovr);
    const html = '<section class="notice">Consulta de jugadores sin club. La oferta y negociación de contratos llega en la Etapa 2.</section>' +
      '<div class="chips"><button class="chip ' + (pos === 'ALL' ? 'on' : '') + '" data-act="fa-pos" data-v="ALL">Todos</button>' + PL.POS_ORDER.map((p) => '<button class="chip ' + (pos === p ? 'on' : '') + '" data-act="fa-pos" data-v="' + p + '">' + p + '</button>').join('') + '</div>' +
      '<section class="card"><div class="plist">' + (list.length ? list.map((p) => UI.playerRow(p, { meta: 'Pot. ' + p.pot + ' · pide ' + U.wage(p.wage) })).join('') : '<p class="small muted">No hay agentes libres en esta posición.</p>') + '</div></section>';
    return { title: 'Agentes libres', sub: s.freeAgents.length + ' jugadores sin club', html };
  };

  VIEWS.youth = function () {
    const s = App.s;
    const list = C.squad(s, s.clubId).filter((p) => p.age <= 21).sort((a, b) => b.pot - a.pot);
    const html = '<section class="notice">Los jóvenes progresan al final de cada temporada según edad, potencial y minutos jugados. Cada verano llegan canteranos nuevos. La gestión detallada de la cantera (ojeadores, cesiones, promoción) llega en la Etapa 3.</section>' +
      '<section class="card"><h3>Sub-21 del primer equipo</h3><div class="plist">' + (list.length ? list.map((p) => '<button class="prow" data-act="player" data-id="' + p.id + '"><span class="pos">' + p.pos + '</span>' + UI.ovr(p.ovr) +
        '<span class="grow"><span class="name ellipsis" style="display:block">' + esc(p.name) + (p.youth ? ' <span class="pill info">Cantera</span>' : '') + '</span><span class="meta">' + p.age + ' años · ' + p.stats.min + ' min esta temporada</span>' + UI.bar(p.ovr, p.pot, 'accent') + '</span>' +
        '<span class="side"><span class="small muted">Potencial</span><b class="num">' + p.pot + '</b></span></button>').join('') : '<p class="small muted">No hay jugadores sub-21.</p>') + '</div></section>';
    return { title: 'Cantera', sub: 'Jóvenes promesas', html };
  };

  VIEWS.news = function () {
    const s = App.s;
    const html = '<section class="card">' + (s.news.length ? s.news.map(newsItem).join('') : '<p class="small muted">Sin noticias.</p>') + '</section>';
    return {
      title: 'Noticias', sub: s.news.length + ' noticias', html,
      after() { let changed = false; s.news.forEach((n) => { if (!n.read) { n.read = true; changed = true; } }); if (changed) persist(); },
    };
  };

  VIEWS.settings = function () {
    const prov = MCM.store.provider;
    let html = '<section class="card"><h3>Perfil</h3><form class="stack" data-submit="profile"><label class="field" for="st-profile">Nombre del propietario de las carreras nuevas<input class="input" id="st-profile" name="profile" maxlength="30" value="' + esc(App.profile) + '" placeholder="Por ejemplo: Erika"></label>' +
      '<button class="btn sm" type="submit">Guardar perfil</button></form><p class="small muted">En la Etapa 1 el perfil solo etiqueta las carreras. Las cuentas con contraseña y la privacidad real entre usuarios llegan en la Etapa 4.</p></section>';
    html += '<section class="card"><h3>Tema</h3><div class="chips">' + [['system', 'Sistema'], ['light', 'Claro'], ['dark', 'Oscuro']].map((t) => '<button class="chip ' + ((App.theme || 'system') === t[0] ? 'on' : '') + '" data-act="theme" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div></section>';
    html += '<section class="card"><h3>Guardado</h3><p>Ubicación: <b>' + esc(prov ? prov.label : '—') + '</b></p>' +
      '<p class="small">Las carreras se guardan automáticamente después de cada acción. Este guardado es <b>local</b>: si borras los datos del navegador o cambias de dispositivo, no estarán. Para no perder una carrera, exporta una copia.</p>' +
      (prov && prov.kind === 'memory' ? '<p class="notice">Este navegador no permite guardar datos. La partida se perderá al cerrar la página.</p>' : '') + '</section>';
    if (App.s) {
      html += '<section class="card"><h3>Exportar carrera abierta</h3><p class="small muted">Genera una copia en texto de «' + esc(App.s.name) + '». Guárdala en Notas o Archivos del iPhone para restaurarla después.</p>' +
        '<div class="btn-row"><button class="btn sm" data-act="export-copy">Copiar al portapapeles</button><button class="btn sm" data-act="export-download">Descargar archivo</button></div>' +
        '<textarea class="input" id="export-box" readonly hidden></textarea></section>';
    }
    html += '<section class="card"><h3>Importar carrera</h3><p class="small muted">Se importa como una carrera nueva; no sustituye a ninguna existente.</p>' +
      '<label class="field" for="import-file">Desde archivo<input class="input" id="import-file" type="file" accept=".json,application/json,text/plain" data-change="import-file"></label>' +
      '<label class="field" for="import-text">O pega el texto exportado<textarea class="input" id="import-text" placeholder="{ ... }"></textarea></label>' +
      '<button class="btn sm" data-act="import-text">Importar texto</button></section>';
    html += '<section class="card"><h3>Datos del juego</h3><p class="small">' + esc(MCM.DATA.datasetInfo.name) + '. ' + esc(MCM.DATA.datasetInfo.note) + '</p>' +
      '<p class="small muted">' + MCM.DATA.leagues.length + ' ligas · ' + MCM.DATA.leagues.reduce((n, l) => n + l.clubs.length, 0) + ' clubes. La estructura admite importar bases de datos legítimas (formato en docs/DATA_FORMAT.md).</p></section>';
    html += '<section class="card"><h3>Hoja de ruta</h3><div class="stack small">' +
      '<div><span class="pill good">Hecho</span> Etapa 1 · Base jugable: carreras, clubes, calendario, simulación, clasificación, guardado local.</div>' +
      '<div><span class="pill mute">Próximo</span> Etapa 2 · Fichajes, agentes libres, contratos y presupuesto.</div>' +
      '<div><span class="pill mute">Después</span> Etapa 3 · Lesiones, moral y cantera en profundidad; noticias y objetivos.</div>' +
      '<div><span class="pill mute">Después</span> Etapa 4 · Cuentas y guardado online privado para dos usuarios.</div>' +
      '<div><span class="pill mute">Después</span> Etapa 5 · Datos ampliados, pruebas, publicación e instalación en el iPhone.</div></div></section>';
    return { title: 'Ajustes', sub: 'Versión Etapa 1', html, tabs: !!App.s };
  };

  // ---------- Acciones ----------
  async function refreshMetas() { App.metas = await MCM.store.list(); }

  async function openCareer(id) {
    await busy('Cargando carrera…');
    try {
      const s = await MCM.store.load(id);
      if (!s) throw new Error('No se encontró la carrera.');
      App.s = s;
      App.ui.tableLeague = null;
      App.ui.calMd = null;
      await MCM.store.setSetting('lastCareer', id);
      App.saveState = 'ok';
      App.go('hub', {}, { root: true });
    } catch (e) {
      toast(e.message);
    } finally { unbusy(); }
  }

  const ACTIONS = {
    back: () => App.back(),
    noop: () => {},
    'sheet-close': closeSheet,
    'confirm-yes': async () => { const fn = pendingConfirm; pendingConfirm = null; closeSheet(); if (fn) await fn(); },
    tab: (d) => { App.go(d.view, {}, { root: true }); },
    nav: (d) => {
      if (['hub', 'squad', 'calendar', 'table', 'menu', 'tactics', 'club', 'finance', 'market', 'freeagents', 'youth', 'news'].includes(d.view) && !App.s) { toast('Abre o crea una carrera primero.'); return; }
      App.go(d.view, {});
    },
    'new-career': () => { App.ui.newClub = null; App.go('newCareer', {}); },
    'new-league': (d) => { App.ui.newLeague = d.id; App.render(); },
    'new-club': (d) => { App.ui.newClub = d.id; App.render(true); },
    'new-club-reset': () => { App.ui.newClub = null; App.render(true); },
    'open-career': (d) => openCareer(d.id),
    'rename-career': (d) => {
      const m = App.metas.find((x) => x.id === d.id);
      sheet('<h2>Renombrar carrera</h2><form class="stack" data-submit="rename" data-id="' + esc(d.id) + '"><label class="field" for="rn-name">Nuevo nombre<input class="input" id="rn-name" name="name" maxlength="60" value="' + esc(m ? m.name : '') + '" required></label>' +
        '<div class="btn-row"><button class="btn" type="button" data-act="sheet-close">Cancelar</button><button class="btn primary" type="submit">Guardar</button></div></form>');
    },
    'delete-career': (d) => {
      const m = App.metas.find((x) => x.id === d.id);
      confirmSheet({
        title: 'Eliminar «' + (m ? m.name : '') + '»',
        body: 'Se borrará esta carrera de este dispositivo y no se podrá recuperar (salvo que tengas una copia exportada). Las demás carreras no se verán afectadas.',
        yes: 'Eliminar definitivamente',
        danger: true,
        onYes: async () => {
          await MCM.store.remove(d.id);
          if (App.s && App.s.id === d.id) { App.s = null; App.stack = []; }
          await refreshMetas();
          toast('Carrera eliminada');
          App.view = 'careers';
          App.render(true);
        },
      });
    },
    player: (d) => App.go('player', { id: d.id }),
    match: (d) => App.go('match', { id: d.id, league: d.league }),
    'squad-filter': (d) => { App.ui.squadFilter = d.v; App.render(); },
    'squad-sort': (d) => { App.ui.squadSort = d.v; App.render(); },
    'table-league': (d) => { App.ui.tableLeague = d.v; App.render(); },
    'table-tab': (d) => { App.ui.tableTab = d.v; App.render(); },
    'cal-md': (d) => { App.ui.calMd = Number(d.v); App.render(); },
    'fa-pos': (d) => { App.ui.faPos = d.v; App.render(); },
    'sim-match': async () => {
      await busy('Simulando partido…');
      try {
        const f = C.playUserMatch(App.s);
        await persist();
        unbusy();
        if (f) App.go('match', { id: f.id, league: C.userLeague(App.s).id });
      } finally { unbusy(); }
    },
    'sim-md-ask': () => {
      const md = C.nextMd(App.s);
      confirmSheet({
        title: 'Simular jornada ' + md,
        body: 'Se jugarán todos los partidos de la jornada ' + md + ', incluido el tuyo, y avanzarán el resto de ligas. No se puede deshacer.',
        yes: 'Simular jornada',
        onYes: () => ACTIONS['sim-md'](),
      });
    },
    'sim-md': async () => {
      await busy('Simulando jornada…');
      try {
        const r = C.playMatchday(App.s);
        await persist();
        unbusy();
        if (r && r.userFixture) toast('Jornada ' + r.md + ' completada');
        App.go('hub', {}, { root: true });
      } finally { unbusy(); }
    },
    'end-season-ask': () => confirmSheet({
      title: 'Cerrar temporada ' + App.s.season.label,
      body: 'Se guardará el historial, se aplicarán ascensos y descensos, los jugadores envejecerán y evolucionarán, llegarán canteranos y empezará la temporada ' + C.seasonLabel(App.s.season.year + 1) + '.',
      yes: 'Cerrar temporada',
      onYes: async () => {
        await busy('Cerrando temporada…');
        try {
          const h = C.endSeason(App.s);
          await persist();
          unbusy();
          toast('Temporada ' + h.season + ' archivada: ' + h.pos + 'º');
          App.go('hub', {}, { root: true });
        } finally { unbusy(); }
      },
    }),
    slot: (d) => {
      const s = App.s;
      const club = C.userClub(s);
      const i = Number(d.i);
      const pos = LU.slots(club.lineup.formation)[i];
      const squad = C.squad(s, s.clubId).sort((a, b) => LU.slotScore(b, pos) - LU.slotScore(a, pos));
      const cur = club.lineup.xi[i];
      sheet('<h2>Elegir ' + esc(PL.POSITIONS[pos].name.toLowerCase()) + ' (' + pos + ')</h2><div class="plist">' + squad.map((p) => {
        const fit = PL.fitLabel(PL.fit(p, pos));
        const inXi = club.lineup.xi.indexOf(p.id);
        const meta = (fit === 'natural' ? 'Posición natural' : fit === 'adaptado' ? 'Adaptado' : 'Fuera de posición') + (inXi >= 0 ? ' · en el once (' + LU.slots(club.lineup.formation)[inXi] + ')' : '');
        return UI.playerRow(p, { act: 'pick-slot', extra: ' data-i="' + i + '"', meta, disabled: !PL.isAvailable(p) || p.id === cur });
      }).join('') + '</div><button class="btn" data-act="sheet-close">Cerrar</button>');
    },
    'pick-slot': async (d) => {
      const s = App.s;
      const club = C.userClub(s);
      const lu = club.lineup;
      const i = Number(d.i);
      const prev = lu.xi[i];
      const j = lu.xi.indexOf(d.id);
      lu.xi[i] = d.id;
      if (j >= 0) lu.xi[j] = prev; // intercambio dentro del once
      lu.bench = rebuildBench(s, lu);
      closeSheet();
      if (s.settings.autoLineup) { s.settings.autoLineup = false; toast('Alineación manual activada'); }
      await persist();
      App.render();
    },
    'auto-pick': async () => {
      const s = App.s;
      const club = C.userClub(s);
      club.lineup = LU.autoPick(C.squad(s, s.clubId), club.tactics.formation);
      await persist();
      toast('Once automático aplicado');
      App.render();
    },
    formation: async (d) => {
      const s = App.s;
      const club = C.userClub(s);
      const squad = C.squad(s, s.clubId);
      const prevIds = new Set((club.lineup && club.lineup.xi) || []);
      club.tactics.formation = d.v;
      if (s.settings.autoLineup) club.lineup = LU.autoPick(squad, d.v);
      else {
        // Recoloca a los mismos titulares en la nueva formación
        const lu = LU.autoPick(squad.filter((p) => prevIds.has(p.id)), d.v);
        lu.bench = [];
        LU.repair(lu, squad);
        lu.bench = rebuildBench(s, lu);
        club.lineup = lu;
      }
      s._tr = {};
      await persist();
      App.render();
    },
    tactic: async (d) => { C.userClub(App.s).tactics[d.k] = d.v; await persist(); App.render(); },
    theme: async (d) => { App.theme = d.v; applyTheme(); await MCM.store.setSetting('theme', d.v); App.render(); },
    'export-copy': async () => {
      const text = JSON.stringify(App.s);
      const box = $('#export-box');
      try { await navigator.clipboard.writeText(text); toast('Copia copiada al portapapeles (' + Math.round(text.length / 1024) + ' KB)'); }
      catch (e) { box.hidden = false; box.value = text; box.focus(); box.select(); toast('Selecciona el texto y cópialo manualmente'); }
    },
    'export-download': () => {
      const blob = new Blob([JSON.stringify(App.s)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = U.slug(App.s.name) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      toast('Si no se descarga, usa «Copiar al portapapeles»');
    },
    'import-text': () => importCareer($('#import-text').value),
  };

  function rebuildBench(s, lu) {
    const inXi = new Set(lu.xi);
    const rest = C.squad(s, s.clubId).filter((p) => !inXi.has(p.id) && PL.isAvailable(p)).sort((a, b) => b.ovr - a.ovr);
    const bench = [];
    const gk = rest.find((p) => p.pos === 'POR');
    if (gk) bench.push(gk.id);
    rest.forEach((p) => { if (bench.length < 9 && !bench.includes(p.id)) bench.push(p.id); });
    return bench;
  }

  async function importCareer(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { toast('El texto no es un JSON válido.'); return; }
    if (!data || !data.clubs || !data.players || !data.leagues || !data.clubId || !data.clubs[data.clubId]) { toast('No parece una carrera exportada de este juego.'); return; }
    const errors = C.validate(data);
    if (errors.length) { toast('Carrera dañada: ' + errors[0]); return; }
    data.id = U.uid('car');
    data.name = data.name + ' (importada)';
    data.owner = App.profile || data.owner;
    await MCM.store.save(data);
    await refreshMetas();
    toast('Carrera importada');
    openCareer(data.id);
  }

  const FORMS = {
    'create-career': async (fd) => {
      await busy('Creando carrera…');
      try {
        const s = C.create({ clubId: App.ui.newClub, name: fd.get('name'), managerName: fd.get('manager'), owner: App.profile || 'Jugador local' });
        App.s = s;
        await persist();
        await refreshMetas();
        App.ui.newClub = null;
        App.ui.tableLeague = null;
        App.ui.calMd = null;
        unbusy();
        App.go('hub', {}, { root: true });
        toast('Carrera creada');
      } catch (e) { console.error(e); toast('Error al crear: ' + e.message); } finally { unbusy(); }
    },
    rename: async (fd, form) => {
      const name = String(fd.get('name') || '').trim();
      if (!name) return;
      const id = form.dataset.id;
      if (App.s && App.s.id === id) { App.s.name = name; await persist(); } else await MCM.store.rename(id, name);
      await refreshMetas();
      closeSheet();
      toast('Nombre actualizado');
      App.render();
    },
    profile: async (fd) => {
      App.profile = String(fd.get('profile') || '').trim();
      await MCM.store.setSetting('profile', App.profile);
      toast('Perfil guardado');
      App.render();
    },
    'market-search': (fd) => {
      App.ui.marketQ = String(fd.get('q') || '');
      App.ui.marketPos = String(fd.get('pos') || 'ALL');
      App.ui.marketMinOvr = Number(fd.get('ovr') || 0);
      App.render();
    },
  };

  const CHANGES = {
    'auto-lineup': async (el) => {
      App.s.settings.autoLineup = el.checked;
      if (el.checked) { const club = C.userClub(App.s); club.lineup = LU.autoPick(C.squad(App.s, App.s.clubId), club.tactics.formation); }
      await persist();
      App.render();
    },
    'import-file': (el) => {
      const file = el.files && el.files[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = () => importCareer(String(r.result));
      r.readAsText(file);
    },
  };

  function applyTheme() {
    const root = document.documentElement;
    if (!App.theme || App.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', App.theme);
  }

  function bind() {
    document.addEventListener('click', (ev) => {
      const sc = $('#sheet');
      if (ev.target === sc) { closeSheet(); return; }
      const el = ev.target.closest('[data-act]');
      if (!el || el.disabled) return;
      const fn = ACTIONS[el.dataset.act];
      if (fn) { ev.preventDefault(); Promise.resolve(fn(el.dataset, el)).catch((e) => { console.error(e); unbusy(); toast('Error: ' + e.message); }); }
    });
    document.addEventListener('submit', (ev) => {
      const form = ev.target.closest('form[data-submit]');
      if (!form) return;
      ev.preventDefault();
      const fn = FORMS[form.dataset.submit];
      if (fn) Promise.resolve(fn(new FormData(form), form)).catch((e) => { console.error(e); unbusy(); toast('Error: ' + e.message); });
    });
    document.addEventListener('change', (ev) => {
      const el = ev.target.closest('[data-change]');
      if (!el) return;
      const fn = CHANGES[el.dataset.change];
      if (fn) Promise.resolve(fn(el)).catch((e) => { console.error(e); toast('Error: ' + e.message); });
    });
  }

  App.start = async function () {
    bind();
    await MCM.store.init();
    try {
      App.profile = (await MCM.store.getSetting('profile')) || '';
      App.theme = (await MCM.store.getSetting('theme')) || 'system';
      applyTheme();
      await refreshMetas();
    } catch (e) { console.error(e); }
    App.view = 'start';
    App.render(true);
  };
})(globalThis.MCM = globalThis.MCM || {});
