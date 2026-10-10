/* Interfaz del día a día: entrenamiento, planes de desarrollo, ojeadores, charlas y ruedas de prensa. */
(function (MCM) {
  'use strict';
  const U = MCM.util;
  const UI = MCM.ui;
  const C = MCM.career;
  const Lf = MCM.life;
  const PL = MCM.players;
  const App = MCM.app;
  const V = App.VIEWS;
  const A = App.ACTIONS;
  const F = App.FORMS;
  const H = App.h;
  const esc = U.esc;
  const opt = (v, cur, label) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(label) + '</option>';

  // ---------- Entrenamiento ----------
  V.training = function () {
    const s = App.s;
    Lf.init(s);
    const club = s.clubs[s.clubId];
    const cur = club.training || 'normal';
    const planned = C.squad(s, s.clubId).concat(MCM.dev.academy(s)).filter((p) => p.plan);
    let html = '<section class="card"><h3>Intensidad del entrenamiento</h3><div class="chips">' +
      Object.keys(Lf.INTENSITY).map((k) => '<button class="chip ' + (k === cur ? 'on' : '') + '" data-act="train-int" data-v="' + k + '">' + Lf.INTENSITY[k].label + '</button>').join('') + '</div>' +
      '<p class="small muted">Suave: se recuperan antes, progresan menos y se lesionan menos. Intensa: progresan más rápido, pero llegan más cansados a los partidos y con algo más de riesgo de lesión.</p></section>';
    html += '<section class="card"><div class="section-head"><h3>Planes de desarrollo</h3><span class="small muted">' + planned.length + '</span></div>' +
      (planned.length ? planned.map((p) => '<button class="prow" data-act="player" data-id="' + p.id + '"><span class="pos">' + p.pos + '</span>' + UI.ovr(p.ovr) + '<span class="grow"><span class="name">' + esc(p.name) + '</span><span class="meta" style="display:block">' +
        [p.plan.focus ? 'Mejorar ' + Lf.FOCUS[p.plan.focus].toLowerCase() : '', p.plan.newPos ? 'Reconversión a ' + p.plan.newPos + ' (' + Math.round(p.plan.progress || 0) + '%)' : ''].filter(Boolean).join(' · ') + '</span></span></button>').join('')
        : '<p class="small muted">Asigna planes desde la ficha de cada jugador: un atributo a mejorar o una nueva posición.</p>') + '</section>';
    return { title: 'Entrenamiento', sub: Lf.INTENSITY[cur].label, html };
  };
  A['train-int'] = async (d) => { App.s.clubs[App.s.clubId].training = d.v; await H.persist(); App.render(); };

  // ---------- Ficha del jugador: plan y charla ----------
  const basePlayer = V.player;
  V.player = function (params) {
    const v = basePlayer(params);
    const s = App.s;
    const p = s.players[params.id];
    if (!p) return v;
    // Potencial visible: rango hasta tener informe de ojeador
    const range = Lf.potRange(s, p);
    if (range) {
      v.html = v.html.replace('<div class="eyebrow">Pot.</div><div class="scoreboard" style="font-size:1.8rem">' + p.pot + '</div>', '<div class="eyebrow">Pot.</div><div class="scoreboard" style="font-size:1.4rem">' + range[0] + '–' + range[1] + '</div><div class="small muted">sin informe</div>');
    } else if (s.scouting && s.scouting.known[p.id] && p.clubId !== s.clubId) {
      v.html = v.html.replace('<div class="eyebrow">Pot.</div>', '<div class="eyebrow">Pot. · informe</div>');
    }
    if (p.clubId !== s.clubId) return v;
    const focusKeys = Object.keys(p.attrs);
    const pl = p.plan || {};
    let html = '<section class="card"><h3>Plan de desarrollo</h3><form class="stack" data-submit="plan" data-id="' + p.id + '">' +
      '<div class="grid-2"><label class="field" for="pl-focus">Atributo a mejorar<select class="input" id="pl-focus" name="focus">' + opt('', pl.focus || '', 'Ninguno') + focusKeys.map((k) => opt(k, pl.focus || '', Lf.FOCUS[k] + ' (' + p.attrs[k] + ')')).join('') + '</select></label>' +
      '<label class="field" for="pl-pos">Nueva posición<select class="input" id="pl-pos" name="newPos">' + opt('', pl.newPos || '', 'Ninguna') + PL.POS_ORDER.filter((x) => Lf.canRetrain(p, x)).map((x) => opt(x, pl.newPos || '', x + ' · ' + PL.POSITIONS[x].name)).join('') + '</select></label></div>' +
      (pl.newPos ? '<div class="attr"><span>Reconversión</span>' + UI.bar(pl.progress || 0, 100, 'accent') + '<b>' + Math.round(pl.progress || 0) + '%</b></div>' : '') +
      '<button class="btn sm" type="submit">Guardar plan</button></form><p class="small muted">El progreso depende de la edad y de la intensidad del entrenamiento. Una reconversión dura unas 12 semanas.</p></section>';
    if (!p.academy) {
      const can = Lf.canTalk(s, p);
      html += '<section class="card"><h3>Hablar con el jugador</h3><div class="btn-row">' + Object.keys(Lf.TALKS).map((k) => '<button class="btn sm" data-act="talk" data-k="' + k + '" data-id="' + p.id + '"' + (can ? '' : ' disabled') + '>' + esc(Lf.TALKS[k]) + '</button>').join('') + '</div>' +
        '<p class="small muted">' + (can ? 'El efecto depende de su rendimiento y de sus minutos. Si prometes minutos y no cumples, se sentirá engañado.' : 'Ya hablaste con él hace poco: espera un par de semanas.') + (p.promise ? ' Tiene una promesa de minutos pendiente.' : '') + '</p></section>';
    }
    v.html += html;
    return v;
  };
  F.plan = async (fd, form) => {
    const err = Lf.setPlan(App.s, form.dataset.id, { focus: String(fd.get('focus') || ''), newPos: String(fd.get('newPos') || '') });
    if (err) { H.toast(err); return; }
    await H.persist();
    H.toast('Plan guardado');
    App.render();
  };
  A.talk = async (d) => {
    const r = Lf.talk(App.s, d.id, d.k);
    if (r.error) { H.toast(r.error); return; }
    await H.persist();
    H.sheet('<h2>' + esc(Lf.TALKS[d.k]) + '</h2><p>' + esc(r.text) + '</p><p class="small muted">Moral ' + (r.delta >= 0 ? '+' : '') + r.delta + '</p><button class="btn primary" data-act="sheet-close">Entendido</button>');
    App.render();
  };

  // ---------- Ojeadores ----------
  V.scouting = function () {
    const s = App.s;
    const sc = Lf.init(s);
    let html = '<section class="card"><div class="section-head"><h3>Tus ojeadores</h3><span class="small muted">' + sc.scouts.length + '/' + Lf.MAX_SCOUTS + '</span></div>' +
      (sc.scouts.length ? sc.scouts.map((x) => {
        const m = x.mission;
        return '<div class="stack" style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row"><b class="grow">' + esc(x.name) + ' ' + '★'.repeat(x.stars) + '<span class="muted">' + '★'.repeat(5 - x.stars) + '</span></b><button class="btn sm ghost" data-act="scout-fire" data-id="' + x.id + '" style="color:var(--bad)">Despedir</button></div>' +
          (m ? '<div class="small">' + (m.type === 'youth' ? 'Buscando juveniles' : 'Observando') + ' en ' + esc(Lf.REGIONS[m.region] || m.region) + (m.pos !== 'ALL' ? ' · ' + m.pos : '') + (m.ageMax ? ' · ≤' + m.ageMax + ' años' : '') + (m.minPot ? ' · pot. ≥' + m.minPot : '') + '</div>' + UI.bar(m.done, m.weeks, 'accent') + '<div class="small muted">' + m.done + '/' + m.weeks + ' semanas</div>'
            : '<button class="btn sm" data-act="scout-assign" data-id="' + x.id + '">Asignar misión</button>') + '</div>';
      }).join('') : '<p class="small muted">Contrata ojeadores para descubrir el potencial real de los jugadores y encontrar promesas para tu cantera.</p>') +
      (sc.scouts.length < Lf.MAX_SCOUTS ? '<form class="row wrap" data-submit="scout-hire" style="margin-top:8px"><label class="field grow" for="sc-stars">Contratar ojeador<select class="input" id="sc-stars" name="stars">' + [1, 2, 3, 4, 5].map((n) => opt(n, 3, n + '★ · ' + U.money(Lf.SCOUT_COST[n]))).join('') + '</select></label><button class="btn sm primary" type="submit">Contratar</button></form>' : '') + '</section>';
    if (sc.prospects.length) {
      html += '<section class="card"><h3>Promesas propuestas</h3>' + sc.prospects.map((pr) => '<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="pos" style="width:38px;font-weight:700">' + pr.pos + '</span><div class="grow"><b>' + pr.age + ' años · ' + esc(MCM.DATA.nationName(pr.nat)) + '</b><div class="small muted">Media ' + pr.ovr + ' · potencial ' + pr.pot + ' · ' + esc(pr.scout) + '</div></div>' +
        '<button class="btn sm primary" data-act="prospect-sign" data-id="' + pr.id + '">A la cantera</button><button class="btn sm ghost" data-act="prospect-drop" data-id="' + pr.id + '">Descartar</button></div>').join('') + '</section>';
    }
    const reports = sc.reports.filter((r) => s.players[r.pid]).slice(0, 30);
    html += '<section class="card"><div class="section-head"><h3>Informes</h3><span class="small muted">' + reports.length + '</span></div><div class="plist">' +
      (reports.length ? reports.map((r) => { const p = s.players[r.pid]; return UI.playerRow(p, { meta: (p.clubId ? esc(s.clubs[p.clubId].short) : 'Libre') + ' · pot. ' + p.pot + ' · ' + esc(r.scout) }); }).join('') : '<p class="small muted">Sin informes todavía.</p>') + '</div></section>';
    return { title: 'Ojeadores', sub: sc.scouts.length + ' en plantilla', html };
  };
  F['scout-hire'] = async (fd) => { const err = Lf.hireScout(App.s, Number(fd.get('stars'))); if (err) { H.toast(err); return; } await H.persist(); H.toast('Ojeador contratado'); App.render(); };
  A['scout-fire'] = (d) => H.confirmSheet({ title: 'Despedir ojeador', body: 'Perderás su misión en curso. Los informes ya hechos se conservan.', yes: 'Despedir', danger: true, onYes: async () => { Lf.fireScout(App.s, d.id); await H.persist(); App.render(); } });
  A['scout-assign'] = (d) => {
    H.sheet('<h2>Nueva misión</h2><form class="stack" data-submit="scout-mission" data-id="' + d.id + '">' +
      '<label class="field" for="sm-type">Tipo<select class="input" id="sm-type" name="type"><option value="senior">Observar jugadores</option><option value="youth">Buscar juveniles para la cantera</option></select></label>' +
      '<label class="field" for="sm-region">Región<select class="input" id="sm-region" name="region">' + Object.keys(Lf.REGIONS).map((k) => opt(k, 'ESP', Lf.REGIONS[k])).join('') + '</select></label>' +
      '<div class="grid-2"><label class="field" for="sm-pos">Posición<select class="input" id="sm-pos" name="pos">' + opt('ALL', 'ALL', 'Cualquiera') + PL.POS_ORDER.map((x) => opt(x, '', x)).join('') + '</select></label>' +
      '<label class="field" for="sm-weeks">Duración<select class="input" id="sm-weeks" name="weeks">' + [3, 6, 9, 12].map((w) => opt(w, 6, w + ' semanas')).join('') + '</select></label></div>' +
      '<div class="grid-2"><label class="field" for="sm-age">Edad máxima<input class="input" id="sm-age" name="ageMax" type="number" inputmode="numeric" placeholder="Sin límite"></label>' +
      '<label class="field" for="sm-pot">Potencial mínimo<input class="input" id="sm-pot" name="minPot" type="number" inputmode="numeric" placeholder="Sin mínimo"></label></div>' +
      '<div class="btn-row"><button class="btn" type="button" data-act="sheet-close">Cancelar</button><button class="btn primary" type="submit">Enviar</button></div></form>');
  };
  F['scout-mission'] = async (fd, form) => {
    const err = Lf.assign(App.s, form.dataset.id, { type: fd.get('type'), region: fd.get('region'), pos: fd.get('pos'), weeks: fd.get('weeks'), ageMax: fd.get('ageMax'), minPot: fd.get('minPot') });
    H.closeSheet();
    if (err) { H.toast(err); return; }
    await H.persist();
    H.toast('Misión asignada');
    App.render();
  };
  A['prospect-sign'] = async (d) => { const err = Lf.signProspect(App.s, d.id); if (err) { H.toast(err); return; } await H.persist(); H.toast('Nuevo juvenil en la cantera'); App.render(); };
  A['prospect-drop'] = async (d) => { Lf.dropProspect(App.s, d.id); await H.persist(); App.render(); };

  // ---------- Rueda de prensa ----------
  const baseHub = V.hub;
  V.hub = function () {
    const v = baseHub();
    const s = App.s;
    if (s.press && !(s.manager && s.manager.unemployed)) {
      const i = v.html.indexOf('</section>');
      v.html = v.html.slice(0, i + 10) + '<button class="notice" data-act="press-open" style="text-align:left">🎙 Rueda de prensa pendiente. Tus respuestas influyen en el vestuario y la directiva.</button>' + v.html.slice(i + 10);
    }
    return v;
  };
  A['press-open'] = () => {
    const pr = App.s.press;
    if (!pr) return;
    H.sheet('<h2>Rueda de prensa</h2><form class="stack" data-submit="press">' + pr.questions.map((q, i) => '<fieldset class="stack" style="border:0;padding:0;margin:0"><legend><b>' + esc(q.q) + '</b></legend>' +
      q.a.map((a, k) => '<label class="row small" style="gap:8px;align-items:flex-start"><input type="radio" name="q' + i + '" value="' + k + '"' + (k === 0 ? ' checked' : '') + '> <span>' + esc(a) + '</span></label>').join('') + '</fieldset>').join('') +
      '<div class="btn-row"><button class="btn ghost" type="button" data-act="press-skip">No acudir</button><button class="btn primary" type="submit">Responder</button></div></form>');
  };
  A['press-skip'] = async () => { MCM.life.skipPress(App.s); H.closeSheet(); await H.persist(); App.render(); };
  F.press = async (fd) => {
    const pr = App.s.press;
    const answers = pr.questions.map((q, i) => Number(fd.get('q' + i)));
    const fx = Lf.answerPress(App.s, answers);
    H.closeSheet();
    const team = fx.reduce((n, x) => n + (x.team || 0), 0);
    const board = fx.reduce((n, x) => n + (x.board || 0), 0);
    H.toast('Vestuario ' + (team >= 0 ? '+' : '') + team + ' · Directiva ' + (board >= 0 ? '+' : '') + board);
    await H.persist();
    App.render();
  };
})(globalThis.MCM = globalThis.MCM || {});
