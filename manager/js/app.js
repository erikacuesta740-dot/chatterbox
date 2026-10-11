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
    const cl = MCM.cloud;
    let text = App.saveState === 'saving' ? 'Guardando…' : App.saveState === 'ok' ? 'Guardado' : App.saveState === 'err' ? 'Error al guardar' : '';
    let cls = App.saveState === 'ok' ? 'ok' : App.saveState === 'err' ? 'err' : '';
    if (App.saveState === 'ok' && cl && cl.ready() && App.s && App.s.ownerUid === cl.uid) {
      if (cl.error) { text = 'Error al subir'; cls = 'err'; }
      else if (cl.dirty) { text = 'Subiendo…'; cls = ''; }
      else text = 'Guardado online';
    } else if (App.saveState === 'ok') text = 'Guardado en el iPhone';
    el.className = 'save-dot ' + cls;
    el.textContent = text;
  }

  function accountCard() {
    const cl = MCM.cloud;
    if (cl && cl.ready()) {
      return '<section class="notice info"><b>Guardado online activado' + (cl.name ? ' · ' + esc(cl.name) : '') + '.</b> Tus carreras se guardan en tu cuenta de claude.ai y son privadas: nadie más puede verlas ni modificarlas. Puedes continuarlas desde otro dispositivo abriendo este mismo enlace.</section>';
    }
    if (cl && cl.status === 'connecting') return '<section class="notice info">Conectando con tu cuenta…</section>';
    return '<section class="notice"><b>Guardado solo en este dispositivo.</b> ' + esc((cl && cl.reason) || 'El guardado online no está disponible aquí.') + ' Puedes exportar una copia desde Ajustes.</section>';
  }

  // ---------- Navegación ----------
  const TABS = [['hub', 'Inicio', 'home'], ['squad', 'Plantilla', 'squad'], ['calendar', 'Partidos', 'calendar'], ['table', 'Torneos', 'trophy'], ['menu', 'Menú', 'menu']];
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
      accountCard() +
      '<section class="notice small"><b>Datos.</b> 31 ligas y unos 590 clubes (2025/26). Unos 5.000 jugadores reales según lo que sabe el asistente hasta mediados de 2026, no verificados; los huecos de cada plantilla y los agentes libres son ficticios. No son datos oficiales de EA SPORTS FC.</section>';
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
        '<div class="row wrap">' + (App.s && App.s.id === m.id ? '<span class="pill solid-accent">Abierta ahora</span>' : '') +
        (m.where === 'cloud' || m.where === 'both' ? '<span class="pill good">En tu cuenta</span>' : m.where === 'pending' ? '<span class="pill warn">Pendiente de subir</span>' : '<span class="pill mute">Solo en este dispositivo</span>') + '</div>' +
        (m.where === 'device' && MCM.cloud.ready() ? '<button class="btn sm" data-act="adopt-career" data-id="' + esc(m.id) + '">Guardar en mi cuenta</button>' : '') +
        '<div class="btn-row"><button class="btn primary sm" data-act="open-career" data-id="' + esc(m.id) + '">Continuar</button>' +
        '<button class="btn sm" data-act="rename-career" data-id="' + esc(m.id) + '">Renombrar</button>' +
        '<button class="btn sm ghost" data-act="delete-career" data-id="' + esc(m.id) + '" style="color:var(--bad)">Eliminar</button></div></section>').join('') +
        '<button class="btn block" data-act="new-career">' + icon('plus') + 'Nueva carrera</button>';
    }
    return { title: 'Mis carreras', sub: App.metas.length + ' guardadas en este dispositivo', html };
  };

  // Dataset elegido para una carrera nueva: demo o base importada por el usuario.
  function activeDataset() {
    const k = App.ui.newDataset || 'real';
    if (k === 'custom' && App.customDataset) return App.customDataset;
    if (k === 'demo') return MCM.generator.defaultDataset();
    return realDs || (realDs = MCM.DATA.realDataset());
  }
  let realDs = null;
  const clubRow = (c) => (Array.isArray(c) ? { name: c[0], short: c[1], rep: c[2], stadium: c[3], colors: [c[4], c[5]] }
    : { name: c.name, short: c.short || c.name.slice(0, 3).toUpperCase(), rep: c.rep, stadium: c.stadium || '', colors: c.colors || ['#888888', '#ffffff'], id: c.id, players: c.players });

  VIEWS.newCareer = function () {
    const ds = activeDataset();
    const leagues = ds.leagues;
    const L = leagues.find((l) => l.id === App.ui.newLeague) || leagues[0];
    const cur = App.ui.newDataset === 'custom' && !App.customDataset ? 'real' : (App.ui.newDataset || 'real');
    const dsChips = '<div class="chips">' +
      '<button class="chip ' + (cur === 'real' ? 'on' : '') + '" data-act="new-dataset" data-v="real">Plantillas reales (no verificadas)</button>' +
      '<button class="chip ' + (cur === 'demo' ? 'on' : '') + '" data-act="new-dataset" data-v="demo">Demo ficticia</button>' +
      (App.customDataset ? '<button class="chip ' + (cur === 'custom' ? 'on' : '') + '" data-act="new-dataset" data-v="custom">' + esc((App.customDataset.info && App.customDataset.info.name) || 'Base importada') + '</button>' : '') + '</div>' +
      (cur === 'real' ? '<p class="notice small">31 ligas con jugadores reales según lo que sabe el asistente hasta mediados de 2026 (unos 5.000). Medias y potenciales estimados, no de FC 27; puede faltar algún fichaje reciente. Las grandes ligas están casi completas; en ligas pequeñas y categorías inferiores muchos huecos se completan con jugadores ficticios.</p>' : '');
    if (!App.ui.newClub) {
      const clubs = L.clubs.map(clubRow).sort((a, b) => b.rep - a.rep);
      const countries = Array.from(new Set(leagues.map((l) => l.country)));
      const html = dsChips + '<label class="field" for="nc-country">País<select class="input" id="nc-country" data-change="new-country">' +
        countries.map((c) => '<option' + (c === L.country ? ' selected' : '') + '>' + esc(c) + '</option>').join('') + '</select></label>' +
        '<div class="chips" role="tablist">' + leagues.filter((l) => l.country === L.country).map((l) => '<button class="chip ' + (l.id === L.id ? 'on' : '') + '" data-act="new-league" data-id="' + esc(l.id) + '">' + esc(l.name) + '</button>').join('') + '</div>' +
        '<section class="card"><div class="section-head"><h2>Elige club</h2><span class="small muted">' + clubs.length + ' clubes</span></div><div class="plist">' +
        clubs.map((c) => {
          const lvl = Math.round(MCM.generator.baseOvr(c.rep) + 2);
          const budget = MCM.generator.transferBudget(c.rep, L.wealth || 1);
          return '<button class="prow" data-act="new-club" data-id="' + esc(c.id || U.slug(c.name)) + '">' + UI.crest(c, 34) +
            '<span class="grow"><span class="name ellipsis" style="display:block">' + esc(c.name) + '</span><span class="meta">' + esc(c.stadium || 'Estadio sin datos') + ' · Presupuesto ' + U.money(budget) + '</span></span>' +
            UI.ovr(lvl) + '</button>';
        }).join('') + '</div></section>';
      return { title: 'Nueva carrera', sub: 'Paso 1 de 2 · Liga y club', html, tabs: false };
    }
    const club = L.clubs.map(clubRow).find((c) => (c.id || U.slug(c.name)) === App.ui.newClub);
    if (!club) { App.ui.newClub = null; return VIEWS.newCareer(); }
    const html = '<section class="card"><div class="row">' + UI.crest(club, 56) + '<div class="grow"><h2>' + esc(club.name) + '</h2><div class="small muted">' + esc(L.name) + ' · ' + esc(L.country) + '</div><div class="small muted">' + esc(club.stadium || '') + '</div></div></div>' +
      '<p class="small muted">Base de datos: ' + esc((ds.info && ds.info.name) || 'Importada') + '</p>' +
      '<button class="btn sm ghost" data-act="new-club-reset" style="justify-self:start">Cambiar club</button></section>' +
      '<form class="card" id="new-form" data-submit="create-career">' +
      '<label class="field" for="nc-name">Nombre de la carrera<input class="input" id="nc-name" name="name" maxlength="60" value="' + esc('Carrera con ' + club.name) + '"></label>' +
      '<label class="field" for="nc-manager">Nombre del entrenador<input class="input" id="nc-manager" name="manager" maxlength="40" value="' + esc(App.profile || '') + '" placeholder="Tu nombre"></label>' +
      '<p class="small muted">Propietario: <b>' + esc(App.profile || 'Jugador local') + '</b> (puedes cambiarlo en Ajustes). La carrera es independiente: crearla no modifica ninguna otra.</p>' +
      '<button class="btn primary block" type="submit">' + icon('play') + 'Crear carrera</button></form>';
    return { title: 'Nueva carrera', sub: 'Paso 2 de 2 · Detalles', html, tabs: false };
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
        return '<tr class="' + (r.clubId === s.clubId ? 'me' : '') + '"><td class="zone ' + SC.zone(L, r.pos, L.lower ? s.leagues[L.lower] : null) + '"></td><td class="l">' + r.pos + '</td>' +
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
      ['club', 'Club y plantilla', 'Palmarés, récords, historial', 'club', null],
      ['manager', 'Mi carrera', 'Reputación, ofertas, vitrina', 'resume', null],
      ['awards', 'Premios', 'Balón de Oro y premios de liga', 'trophy', null],
      ['market', 'Mercado de fichajes', MCM.market.window(s).open ? 'Ventana abierta' : 'Ventana cerrada', 'transfer', 2],
      ['freeagents', 'Agentes libres', s.freeAgents.length + ' sin equipo', 'free', 2],
      ['tactics', 'Tácticas y alineación', s.clubs[s.clubId].tactics.formation, 'tactics', null],
      ['calendar', 'Calendario y resultados', 'Jornadas y crónicas', 'calendar', null],
      ['table', 'Clasificación', 'Tablas y goleadores', 'table', null],
      ['training', 'Entrenamiento', 'Intensidad y planes de desarrollo', 'tactics', null],
      ['scouting', 'Ojeadores', 'Informes y promesas', 'free', null],
      ['youth', 'Cantera y jóvenes promesas', (s.dev ? s.dev.academy.length : 0) + ' en la cantera', 'youth', 3],
      ['finance', 'Finanzas y contratos', U.money(s.clubs[s.clubId].budget) + ' para fichajes', 'money', 2],
      ['news', 'Noticias', s.news.filter((n) => !n.read).length + ' sin leer', 'news', null],
      ['settings', 'Ajustes', 'Guardado, exportar, tema', 'settings', null],
    ];
    const html = '<div class="menu-grid">' + items.map((it) => '<button class="menu-item" data-act="' + (it[0] === 'new-career' ? 'new-career' : 'nav') + '" data-view="' + it[0] + '">' + icon(it[3]) + '<b>' + esc(it[1]) + '</b><span>' + esc(it[2]) + '</span>' +
      '</button>').join('') + '</div>';
    return { title: 'Menú principal', sub: s.name, html };
  };

  VIEWS.squad = function () {
    const s = App.s;
    C.ensureNumbers(s, s.clubId);
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
      '<div><span>Edad media</span><b>' + U.avg(all.map((p) => p.age)).toFixed(1) + '</b></div><div><span>Valor estimado</span><b>' + U.money(C.squadValue(s, s.clubId)) + '</b></div></section>' +
      '<div class="chips">' + [['ALL', 'Todos'], ['GK', 'Porteros'], ['DEF', 'Defensas'], ['MID', 'Centrocampistas'], ['ATT', 'Delanteros']].map((c) => '<button class="chip ' + (f === c[0] ? 'on' : '') + '" data-act="squad-filter" data-v="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>' +
      '<div class="chips">' + [['pos', 'Posición'], ['ovr', 'Media'], ['age', 'Edad'], ['fit', 'Forma física']].map((c) => '<button class="chip ' + (App.ui.squadSort === c[0] ? 'on' : '') + '" data-act="squad-sort" data-v="' + c[0] + '">Ordenar: ' + c[1] + '</button>').join('') + '</div>' +
      '<section class="card"><div class="plist">' + list.map((p) => UI.playerRow(p, { meta: '#' + p.number + ' · ' + (xi.has(p.id) ? 'Titular · ' : '') + p.stats.apps + ' PJ · ' + p.stats.goals + ' G' })).join('') + '</div></section>';
    return { title: 'Plantilla', sub: C.userClub(s).name + ' · ' + s.season.label, html };
  };

  /* Tarjeta del valor de mercado de FC 27: solo se muestra un importe si viene de una importación con fuente. */
  function fc27Card(p, club) {
    const r = MCM.values.lookup(p, club ? club.name : '');
    let html = '<section class="card"><div class="section-head"><h3>Valor de mercado FC 27</h3>';
    if (!r) {
      html += '<span class="pill warn">No verificado</span></div>' +
        '<p class="small">No hay un valor de FC 27 importado para este jugador' + (p.demo ? ' (es un jugador ficticio).' : '.') + '</p>' +
        '<p class="small muted">El juego no calcula ni estima este dato. Se puede incorporar desde Ajustes › Valores de mercado FC 27.</p>';
    } else {
      const e = r.entry;
      html += (e.status === 'verified' ? '<span class="pill good">Verificado según la fuente</span>' : '<span class="pill warn">Importado, no verificado</span>') + '</div>' +
        '<div class="scoreboard" style="font-size:2rem;text-align:left">' + esc(e.raw) + '</div>' +
        (e.raw !== MCM.values.formatExact(e.value, e.currency) ? '<p class="small muted">Importe registrado: ' + esc(MCM.values.formatExact(e.value, e.currency)) + (e.abbreviated ? ' (la fuente lo da abreviado)' : '') + '</p>' : '') +
        '<div class="stack small">' +
        '<div class="row"><span class="muted grow">Edición</span><b>' + esc(e.edition) + '</b></div>' +
        '<div class="row"><span class="muted grow">Fuente</span><b style="text-align:right">' + esc(e.source) + '</b></div>' +
        (e.sourceUrl ? '<div class="row"><span class="muted grow">Enlace</span><a href="' + esc(e.sourceUrl) + '" target="_blank" rel="noopener" class="ellipsis" style="max-width:60%">' + esc(e.sourceUrl) + '</a></div>' : '') +
        '<div class="row"><span class="muted grow">Consulta en la fuente</span><b>' + esc(e.retrievedAt || 'sin fecha') + '</b></div>' +
        '<div class="row"><span class="muted grow">Importado</span><b>' + esc(String(e.importedAt || '').slice(0, 10)) + '</b></div>' +
        '<div class="row"><span class="muted grow">Enlazado por</span><b>' + (r.match === 'id' ? 'identificador ' + esc(e.id) : 'nombre y club') + '</b></div></div>';
    }
    html += '<p class="small muted">El precio que pida un club, las ofertas, contraofertas y cesiones son cantidades distintas y nunca modifican este valor.</p></section>';
    return html;
  }

  VIEWS.tactics = function () {
    const s = App.s;
    const club = C.userClub(s);
    C.ensureNumbers(s, s.clubId);
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
          (p ? UI.ovr(p.ovr) : '<span class="ovr empty">?</span>') + '<span class="lab">' + esc(p ? (p.number ? p.number + ' ' : '') + shortName(p.name) : 'Vacío') + '</span><span class="p">' + sl[0] + '</span></button>';
      }).join('') + '</div>';
    html += '<p class="small muted">Toca un jugador del campo para cambiarlo. Borde amarillo: adaptado a la posición. Borde rojo: fuera de posición.</p>';
    html += '<section class="card"><h3>Avisos</h3>' + (warns.length ? '<div class="warn-list">' + warns.map((w) => '<div class="warn-item ' + w.level + '"><i></i><span>' + esc(w.text) + '</span></div>').join('') + '</div>' : '<p class="small" style="color:var(--good)">Alineación sin problemas.</p>') + '</section>';
    const tk = C.takers(s, s.clubId);
    const sqSorted = squad.slice().sort((a, b) => b.ovr - a.ovr);
    const tkSel = (k, label) => '<label class="field" for="tk-' + k + '">' + label + '<select class="input" id="tk-' + k + '" data-change="taker" data-k="' + k + '">' +
      sqSorted.map((p) => '<option value="' + p.id + '"' + (p.id === tk[k] ? ' selected' : '') + '>#' + p.number + ' ' + esc(p.name) + ' (' + p.pos + ', ' + p.ovr + ')</option>').join('') + '</select></label>';
    html += '<section class="card"><h3>Capitán y lanzadores</h3><div class="grid-2">' + tkSel('captain', 'Capitán') + tkSel('pen', 'Penaltis') + tkSel('fk', 'Faltas') + tkSel('corner', 'Córners') + '</div>' +
      '<p class="small muted">Si el elegido no juega, lo sustituye el siguiente mejor. El capitán en el campo da un pequeño plus al equipo.</p></section>';
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

  VIEWS.club = function () {
    const s = App.s;
    const club = C.userClub(s);
    const L = C.userLeague(s);
    let html = '<section class="card"><div class="row">' + UI.crest(club, 64) + '<div class="grow"><h2>' + esc(club.name) + '</h2><div class="small muted">' + esc(L.name) + ' · ' + esc(club.country) + '</div><div class="small muted">Estadio: ' + esc(club.stadium || 'sin datos') + '</div></div></div>' +
      '<div class="attr"><span>Reputación</span>' + UI.bar(club.rep, 100, 'accent') + '<b>' + club.rep + '</b></div></section>' +
      '<section class="kv"><div><span>Media del once</span><b>' + C.teamRatingCache(s, club.id) + '</b></div><div><span>Valor estimado plantilla</span><b>' + U.money(C.squadValue(s, club.id)) + '</b></div>' +
      '<div><span>Presupuesto</span><b>' + U.money(club.budget) + '</b></div><div><span>Masa salarial</span><b>' + U.wage(C.wageBill(s, club.id)) + '</b></div></section>' +
      '<section class="card"><h3>Objetivo de la directiva</h3><p>' + esc(club.objective.text) + '</p><p class="small muted">Puesto exigido: ' + club.objective.target + 'º o mejor.</p></section>' +
      '<button class="btn block" data-act="tab" data-view="squad">' + icon('squad') + 'Ver plantilla</button>';
    html += '<section class="card"><h3>Historial de temporadas</h3>' + (s.history.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th class="l">Temp.</th><th class="l">Liga</th><th>Pos</th><th>Pts</th><th class="l">Objetivo</th></tr></thead><tbody>' +
      s.history.map((h) => '<tr><td class="l">' + esc(h.season) + '</td><td class="l">' + esc(h.league) + (h.movement ? '<div class="small muted">' + esc(h.movement) + '</div>' : '') + '</td><td>' + h.pos + 'º</td><td>' + h.pts + '</td><td class="l">' + (h.objectiveMet ? '<span class="pill good">Cumplido</span>' : '<span class="pill bad">No</span>') + '</td></tr>').join('') +
      '</tbody></table></div>' : '<p class="small muted">Aún no has completado ninguna temporada.</p>') + '</section>';
    if (s.archive.length) {
      html += '<section class="card"><h3>Campeones</h3>' + s.archive.map((a) => '<div class="stack"><span class="eyebrow">' + esc(a.season) + '</span>' +
        Object.keys(a.champions).map((lid) => '<div class="row small"><span class="grow">' + esc((a.compNames && a.compNames[lid]) || (s.leagues[lid] ? s.leagues[lid].name : lid)) + '</span><b>' + esc(a.champions[lid]) + '</b></div>').join('') + '</div>').join('') + '</section>';
    }
    return { title: 'Club', sub: club.name, html };
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
    const cl = MCM.cloud;
    let html = '<section class="card"><h3>Cuenta y guardado online</h3>' + accountCard() +
      (cl.ready() ? '<p class="small">Estado: ' + (cl.error ? '<b style="color:var(--bad)">' + esc(cl.error) + '</b>' : cl.dirty ? 'subiendo cambios…' : 'todo sincronizado') + (cl.lastSync ? ' · última subida ' + esc(new Date(cl.lastSync).toLocaleTimeString('es-ES')) : '') + '.</p>' +
        '<button class="btn sm" data-act="cloud-sync">Sincronizar ahora</button>' : '') +
      '<details class="small"><summary><b>Cómo jugar con tu hermano</b></summary><ol class="stack" style="padding-left:18px;margin:8px 0 0">' +
      '<li>Abre este juego en claude.ai y pulsa <b>Compartir</b>.</li>' +
      '<li>Invítale por correo como <b>Editor</b> (no actives el enlace público: con él, los invitados de fuera no pueden guardar).</li>' +
      '<li>Él necesita su propia cuenta de claude.ai (la gratuita sirve) y abrir el enlace con su sesión iniciada.</li>' +
      '<li>Cada uno ve y guarda solo sus propias carreras; la plataforma impide leer o modificar las del otro.</li></ol></details></section>' +
      '<section class="card"><h3>Perfil local</h3><form class="stack" data-submit="profile"><label class="field" for="st-profile">Nombre para las carreras sin cuenta<input class="input" id="st-profile" name="profile" maxlength="30" value="' + esc(App.profile) + '" placeholder="Por ejemplo: Erika"></label>' +
      '<button class="btn sm" type="submit">Guardar perfil</button></form><p class="small muted">Solo se usa cuando no hay guardado online.</p></section>';
    html += '<section class="card"><h3>Tema</h3><div class="chips">' + [['system', 'Sistema'], ['light', 'Claro'], ['dark', 'Oscuro']].map((t) => '<button class="chip ' + ((App.theme || 'system') === t[0] ? 'on' : '') + '" data-act="theme" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div></section>';
    html += '<section class="card"><h3>Copia en el dispositivo</h3><p>Ubicación: <b>' + esc(prov ? prov.label : '—') + '</b></p>' +
      '<p class="small">Cada acción se guarda al momento en este dispositivo' + (cl.ready() ? ' y se sube a tu cuenta en segundo plano' : '') + '. ' + (cl.ready() ? '' : 'Si borras los datos del navegador o cambias de dispositivo, no estarán: exporta una copia para no perderlas.') + '</p>' +
      (prov && prov.kind === 'memory' ? '<p class="notice">Este navegador no permite guardar datos. La partida se perderá al cerrar la página.</p>' : '') + '</section>';
    if (App.s) {
      html += '<section class="card"><h3>Exportar carrera abierta</h3><p class="small muted">Genera una copia en texto de «' + esc(App.s.name) + '». Guárdala en Notas o Archivos del iPhone para restaurarla después.</p>' +
        '<div class="btn-row"><button class="btn sm" data-act="export-copy">Copiar al portapapeles</button>' + (canDownload() ? '<button class="btn sm" data-act="export-download">Descargar archivo</button>' : '') + '</div>' +
        '<textarea class="input" id="export-box" readonly hidden></textarea></section>';
    }
    html += '<section class="card"><h3>Importar carrera</h3><p class="small muted">Se importa como una carrera nueva; no sustituye a ninguna existente.</p>' +
      '<label class="field" for="import-file">Desde archivo<input class="input" id="import-file" type="file" accept=".json,application/json,text/plain" data-change="import-file"></label>' +
      '<label class="field" for="import-text">O pega el texto exportado<textarea class="input" id="import-text" placeholder="{ ... }"></textarea></label>' +
      '<button class="btn sm" data-act="import-text">Importar texto</button></section>';
    const vs = MCM.values.dbStats();
    html += '<section class="card" id="fc27"><h3>Valores de mercado FC 27</h3>' +
      '<div class="kv"><div><span>En el registro</span><b>' + vs.total + '</b></div><div><span>Verificados</span><b>' + vs.verified + '</b></div>' +
      '<div><span>Importados sin verificar</span><b>' + vs.unverified + '</b></div><div><span>Última importación</span><b>' + esc(MCM.values.db.imports[0] ? MCM.values.db.imports[0].at.slice(0, 10) : '—') + '</b></div></div>';
    if (App.s) {
      const cs = MCM.values.careerStats(App.s);
      html += '<p class="small">Carrera abierta: <b>' + cs.verified + '</b> jugadores con valor FC 27 verificado, <b>' + cs.imported + '</b> importados sin verificar y <b>' + cs.missing + '</b> sin valor (' + cs.fictional + ' son ficticios de la demo).</p>';
    }
    html += '<p class="small muted">Esta versión no incluye valores de FC 27: no se ha podido acceder a una fuente verificable con permiso de uso. Mientras no se importen, todos los jugadores muestran «No verificado». ' +
      'Solo se aceptan archivos que declaren la edición FC 27, con identificador, fuente y fecha por jugador. Importar actualiza por identificador, no duplica y no modifica ninguna carrera.</p>' +
      '<label class="field" for="values-file">Desde archivo (JSON o CSV)<input class="input" id="values-file" type="file" accept=".json,.csv,application/json,text/csv,text/plain" data-change="values-file"></label>' +
      '<label class="field" for="values-text">O pega el contenido<textarea class="input" id="values-text" placeholder="id,name,club,value,currency,edition,source,sourceUrl,retrievedAt,verified"></textarea></label>' +
      '<div class="btn-row"><button class="btn sm" data-act="values-import-text">Importar valores</button>' + (vs.total ? '<button class="btn sm ghost" data-act="values-clear" style="color:var(--bad)">Vaciar registro</button>' : '') + '</div></section>';
    const cd = App.customDataset;
    html += '<section class="card"><h3>Base de datos de plantillas</h3>' +
      (cd ? '<p class="small">Importada: <b>' + esc((cd.info && cd.info.name) || 'Sin nombre') + '</b> · ' + cd.leagues.length + ' ligas · ' + cd.leagues.reduce((n, l) => n + l.clubs.length, 0) + ' clubes · ' +
        cd.leagues.reduce((n, l) => n + l.clubs.reduce((m, c) => m + ((c.players && c.players.length) || 0), 0), 0) + ' jugadores reales. Se usa al elegir «' + esc((cd.info && cd.info.name) || 'Base importada') + '» en Nueva carrera.</p>'
        : '<p class="small muted">Para que haya jugadores reales a los que asociar valores de FC 27, importa una base de plantillas (formato en docs/DATA_FORMAT.md). Las carreras existentes no cambian.</p>') +
      '<label class="field" for="dataset-file">Desde archivo JSON<input class="input" id="dataset-file" type="file" accept=".json,application/json,text/plain" data-change="dataset-file"></label>' +
      '<label class="field" for="dataset-text">O pega el JSON<textarea class="input" id="dataset-text" placeholder="{ &quot;info&quot;: {...}, &quot;leagues&quot;: [...] }"></textarea></label>' +
      '<div class="btn-row"><button class="btn sm" data-act="dataset-import-text">Importar base</button>' + (cd ? '<button class="btn sm ghost" data-act="dataset-clear" style="color:var(--bad)">Quitar base</button>' : '') + '</div></section>';
    html += '<section class="card"><h3>Datos del juego</h3><p class="small">' + esc(MCM.DATA.datasetInfo.name) + '. ' + esc(MCM.DATA.datasetInfo.note) + '</p>' +
      '<p class="small muted">' + MCM.DATA.leagues.length + ' ligas · ' + MCM.DATA.leagues.reduce((n, l) => n + l.clubs.length, 0) + ' clubes. La estructura admite importar bases de datos legítimas (formato en docs/DATA_FORMAT.md).</p></section>';
    return { title: 'Ajustes', sub: 'Modo Carrera Manager', html, tabs: !!App.s };
  };

  // Dentro de un visor incrustado (vista previa) las descargas están bloqueadas.
  function canDownload() { try { return window.self === window.top; } catch (e) { return false; } }

  // ---------- Acciones ----------
  async function refreshMetas() { App.metas = await MCM.store.list(); }

  async function openCareer(id) {
    await busy('Cargando carrera…');
    try { await MCM.cloud.flush(); } catch (e) { /* se reintentará */ }
    try {
      const s = await MCM.store.load(id);
      if (!s) throw new Error('No se encontró la carrera.');
      C.migrate(s);
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
      if (['hub', 'squad', 'calendar', 'table', 'menu', 'tactics', 'club', 'finance', 'market', 'freeagents', 'youth', 'news', 'manager', 'awards', 'training', 'scouting'].includes(d.view) && !App.s) { toast('Abre o crea una carrera primero.'); return; }
      App.go(d.view, {});
    },
    'new-career': () => { App.ui.newClub = null; App.go('newCareer', {}); },
    'new-dataset': (d) => { App.ui.newDataset = d.v; App.ui.newLeague = null; App.ui.newClub = null; App.render(); },
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
        body: 'Se borrará esta carrera de este dispositivo' + (MCM.cloud.ready() ? ' y de tu cuenta online' : '') + ' y no se podrá recuperar (salvo que tengas una copia exportada). Las demás carreras no se verán afectadas.',
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
    'squad-filter': (d) => { App.ui.squadFilter = d.v; App.render(); },
    'squad-sort': (d) => { App.ui.squadSort = d.v; App.render(); },
    'fa-pos': (d) => { App.ui.faPos = d.v; App.render(); },
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
    'adopt-career': async (d) => {
      await busy('Subiendo a tu cuenta…');
      try { await MCM.store.adopt(d.id); await refreshMetas(); toast('Carrera guardada en tu cuenta'); } finally { unbusy(); }
      App.render();
    },
    'cloud-sync': async () => {
      await busy('Sincronizando…');
      try { if (App.s) await MCM.store.save(App.s); await MCM.cloud.flush(); await refreshMetas(); toast(MCM.cloud.error ? MCM.cloud.error : 'Sincronizado'); } finally { unbusy(); }
      App.render();
    },
    'values-import-text': () => importValues($('#values-text').value),
    'values-clear': () => confirmSheet({
      title: 'Vaciar registro de valores FC 27',
      body: 'Se borrarán los ' + MCM.values.dbStats().total + ' valores importados. Las carreras guardadas no cambian; sus jugadores volverán a mostrar «No verificado».',
      yes: 'Vaciar registro', danger: true,
      onYes: async () => { MCM.values.setDb(null); await MCM.values.save(); toast('Registro vaciado'); App.render(); },
    }),
    'dataset-import-text': () => importDataset($('#dataset-text').value),
    'dataset-clear': () => confirmSheet({
      title: 'Quitar base de plantillas',
      body: 'Las carreras ya creadas con esta base no cambian. Solo dejará de estar disponible para carreras nuevas.',
      yes: 'Quitar base', danger: true,
      onYes: async () => { App.customDataset = null; App.ui.newDataset = 'demo'; await MCM.store.setSetting('customDataset', null); toast('Base quitada'); App.render(); },
    }),
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

  async function importValues(text) {
    const parsed = MCM.values.parse(text);
    if (parsed.errors.length) { sheet('<h2>No se ha importado nada</h2><div class="warn-list">' + parsed.errors.map((e) => '<div class="warn-item error"><i></i><span>' + esc(e) + '</span></div>').join('') + '</div><button class="btn" data-act="sheet-close">Cerrar</button>'); return; }
    const report = parsed.entries.length ? MCM.values.merge(MCM.values.db, parsed.entries, new Date().toISOString()) : { added: 0, updated: 0, unchanged: 0 };
    MCM.values.setDb(MCM.values.db);
    if (parsed.entries.length) await MCM.values.save();
    const st = MCM.values.dbStats();
    const cs = App.s ? MCM.values.careerStats(App.s) : null;
    sheet('<h2>Importación de valores FC 27</h2>' +
      '<div class="kv"><div><span>Nuevos</span><b>' + report.added + '</b></div><div><span>Actualizados</span><b>' + report.updated + '</b></div>' +
      '<div><span>Sin cambios</span><b>' + report.unchanged + '</b></div><div><span>Rechazados</span><b>' + parsed.rejected.length + '</b></div></div>' +
      '<p class="small">Registro: ' + st.total + ' valores (' + st.verified + ' verificados, ' + st.unverified + ' sin verificar).' +
      (cs ? ' En la carrera abierta: ' + cs.verified + ' verificados, ' + cs.imported + ' sin verificar, ' + cs.missing + ' sin valor.' : '') + '</p>' +
      (parsed.rejected.length ? '<div class="warn-list">' + parsed.rejected.slice(0, 12).map((r) => '<div class="warn-item warn"><i></i><span>' + esc(r.line + ': ' + r.reason) + '</span></div>').join('') + (parsed.rejected.length > 12 ? '<p class="small muted">… y ' + (parsed.rejected.length - 12) + ' más.</p>' : '') + '</div>' : '') +
      '<button class="btn primary" data-act="sheet-close">Entendido</button>');
    App.render();
  }

  async function importDataset(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { toast('El texto no es un JSON válido.'); return; }
    const errors = MCM.generator.validateDataset(data);
    if (errors.length) { sheet('<h2>Base no válida</h2><div class="warn-list">' + errors.map((e) => '<div class="warn-item error"><i></i><span>' + esc(e) + '</span></div>').join('') + '</div><button class="btn" data-act="sheet-close">Cerrar</button>'); return; }
    data.info = Object.assign({ id: 'custom', name: 'Base importada' }, data.info || {}, { isDemo: false });
    App.customDataset = data;
    App.ui.newDataset = 'custom';
    await MCM.store.setSetting('customDataset', data);
    toast('Base importada: disponible en Nueva carrera');
    App.render();
  }

  async function importCareer(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { toast('El texto no es un JSON válido.'); return; }
    if (!data || !data.clubs || !data.players || !data.leagues || !data.clubId || !data.clubs[data.clubId]) { toast('No parece una carrera exportada de este juego.'); return; }
    const errors = C.validate(data);
    if (errors.length) { toast('Carrera dañada: ' + errors[0]); return; }
    C.migrate(data);
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
        const s = C.create({ dataset: activeDataset(), clubId: App.ui.newClub, name: fd.get('name'), managerName: fd.get('manager'), owner: (MCM.cloud.ready() && MCM.cloud.name) || App.profile || 'Jugador local' });
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
    'new-country': (el) => { const l = activeDataset().leagues.find((x) => x.country === el.value); if (l) App.ui.newLeague = l.id; App.render(); },
    taker: async (el) => {
      const club = C.userClub(App.s);
      club.takers = Object.assign(C.takers(App.s, App.s.clubId), club.takers || {});
      club.takers[el.dataset.k] = el.value;
      await persist();
      toast('Guardado');
    },
    'auto-lineup': async (el) => {
      App.s.settings.autoLineup = el.checked;
      if (el.checked) { const club = C.userClub(App.s); club.lineup = LU.autoPick(C.squad(App.s, App.s.clubId), club.tactics.formation); }
      await persist();
      App.render();
    },
    'values-file': (el) => readFile(el, importValues),
    'dataset-file': (el) => readFile(el, importDataset),
    'import-file': (el) => {
      const file = el.files && el.files[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = () => importCareer(String(r.result));
      r.readAsText(file);
    },
  };

  function readFile(el, fn) {
    const file = el.files && el.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => fn(String(r.result));
    r.readAsText(file);
  }

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
      if (fn) Promise.resolve(fn(new FormData(form), form, ev)).catch((e) => { console.error(e); unbusy(); toast('Error: ' + e.message); });
    });
    document.addEventListener('change', (ev) => {
      const el = ev.target.closest('[data-change]');
      if (!el) return;
      const fn = CHANGES[el.dataset.change];
      if (fn) Promise.resolve(fn(el)).catch((e) => { console.error(e); toast('Error: ' + e.message); });
    });
  }

  // Acceso para los módulos de interfaz que amplían la app (fichajes, cantera, nube).
  App.VIEWS = VIEWS;
  App.ACTIONS = ACTIONS;
  App.FORMS = FORMS;
  App.CHANGES = CHANGES;
  App.h = { sheet, closeSheet, confirmSheet, persist, toast, busy, unbusy, fc27Card, tableHtml, shortName, newsItem, refreshMetas, openCareer };

  App.start = async function () {
    bind();
    await MCM.store.init();
    try {
      App.profile = (await MCM.store.getSetting('profile')) || '';
      App.theme = (await MCM.store.getSetting('theme')) || 'system';
      await MCM.values.load();
      App.customDataset = (await MCM.store.getSetting('customDataset')) || null;
      applyTheme();
      await refreshMetas();
    } catch (e) { console.error(e); }
    App.view = 'start';
    App.render(true);
    MCM.cloud.onChange(paintSave);
    MCM.cloud.init().then(async () => {
      if (!MCM.cloud.ready()) { if (!App.s) App.render(); return; }
      await refreshMetas();
      if (!App.s && (App.view === 'start' || App.view === 'careers')) App.render();
    });
  };
})(globalThis.MCM = globalThis.MCM || {});
