/*
 * Celebración de títulos: al ganar cualquier trofeo (liga, copa, Europa…) aparece unos segundos
 * una pantalla «HAS GANADO <competición>» con la imagen elegida.
 * La imagen vive solo en el dispositivo (Ajustes) o dentro de la APK (celebration.jpg); no va en la web pública.
 */
(function (MCM) {
  'use strict';
  const App = MCM.app;
  const U = MCM.util;
  const esc = U.esc;
  const V = App.VIEWS;
  const A = App.ACTIONS;
  const KEY = 'celebrationImg';
  const SHOW_MS = 5000;
  let img = null; // dataURL guardada en el dispositivo
  let loaded = false;
  const queue = [];
  let showing = false;

  async function loadImg() {
    try { img = (await MCM.store.getSetting(KEY)) || null; } catch (e) { img = null; }
    loaded = true;
  }
  const seenKey = (s) => 'mcm-trophies-seen:' + s.id + ':' + s.clubId;
  function getSeen(s) { try { const v = localStorage.getItem(seenKey(s)); return v == null ? null : Number(v); } catch (e) { return null; } }
  function setSeen(s, n) { try { localStorage.setItem(seenKey(s), String(n)); } catch (e) { /* sin almacenamiento: se celebra una vez por sesión */ } }
  const sessionSeen = {};

  /* Comprueba si el club del jugador tiene títulos nuevos desde la última vez. */
  function check() {
    const s = App.s;
    if (!s || !s.clubId || !s.id) return;
    const list = (s.trophies && s.trophies[s.clubId]) || [];
    const k = seenKey(s);
    let seen = getSeen(s);
    if (seen == null) seen = sessionSeen[k];
    if (seen == null) { sessionSeen[k] = list.length; setSeen(s, list.length); return; } // carrera abierta por primera vez aquí: no se celebran títulos antiguos
    if (list.length > seen) {
      list.slice(seen).forEach((t) => queue.push(t.name));
      sessionSeen[k] = list.length;
      setSeen(s, list.length);
      next();
    } else if (list.length < seen) { sessionSeen[k] = list.length; setSeen(s, list.length); }
  }

  function next() {
    if (showing || !queue.length) return;
    showing = true;
    const name = queue.shift();
    const el = document.createElement('div');
    el.className = 'celebrate';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Has ganado ' + name);
    const src = img || 'celebration.jpg';
    el.innerHTML = '<div class="celebrate-confetti" aria-hidden="true">' + Array.from({ length: 28 }, (_, i) => '<i style="left:' + ((i * 37) % 100) + '%;animation-delay:' + ((i % 7) * 0.18).toFixed(2) + 's;background:' + ['#f5c542', '#ffffff', '#3fb950', '#58a6ff', '#ff7b72'][i % 5] + '"></i>').join('') + '</div>' +
      '<div class="celebrate-box"><img class="celebrate-img" alt="" src="' + esc(src) + '">' +
      '<div class="celebrate-trophy" aria-hidden="true">🏆</div>' +
      '<div class="celebrate-title">HAS GANADO</div><div class="celebrate-name">' + esc(name) + '</div>' +
      '<div class="celebrate-hint">Toca para continuar</div></div>';
    const imgEl = el.querySelector('img');
    imgEl.onerror = () => { imgEl.remove(); };
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      el.classList.add('out');
      setTimeout(() => { el.remove(); showing = false; next(); }, 350);
    };
    el.addEventListener('click', close);
    document.body.appendChild(el);
    setTimeout(close, SHOW_MS);
  }

  // Tras cada pantalla se mira si hay títulos nuevos.
  const baseRender = App.render;
  App.render = function () {
    const r = baseRender.apply(this, arguments);
    if (loaded) check(); else loadImg().then(check);
    return r;
  };
  App.celebrate = (name) => { queue.push(name); next(); };

  // ---------- Ajustes: imagen de celebración ----------
  function card() {
    return '<section class="card stack"><h3>Celebración de títulos</h3>' +
      '<p class="small">Al ganar un título aparece unos segundos «HAS GANADO …» con esta imagen. Se guarda solo en este dispositivo.</p>' +
      '<div class="row" style="gap:12px">' + (img ? '<img src="' + esc(img) + '" alt="Imagen de celebración" style="width:64px;height:64px;object-fit:cover;border-radius:12px">' : '<span class="small muted">' + 'Sin imagen elegida (en la app de Android ya viene una).' + '</span>') + '</div>' +
      '<label class="btn sm" for="cel-file" style="justify-self:start">Elegir imagen<input id="cel-file" type="file" accept="image/*" data-change="cel-file" style="display:none"></label>' +
      '<div class="btn-row">' + (img ? '<button class="btn sm ghost" data-act="cel-clear">Quitar imagen</button>' : '') + '<button class="btn sm" data-act="cel-test">Probar</button></div></section>';
  }
  const baseSettings = V.settings;
  V.settings = function (params) {
    const v = baseSettings(params);
    v.html = card() + v.html;
    return v;
  };
  // Reduce la foto (máx. 720 px) para guardarla en el dispositivo.
  function shrink(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = reject;
      r.onload = () => {
        const im = new Image();
        im.onerror = reject;
        im.onload = () => {
          const k = Math.min(1, 720 / Math.max(im.width, im.height));
          const c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.85));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  App.CHANGES['cel-file'] = async (el) => {
    const f = el.files && el.files[0];
    if (!f) return;
    try {
      img = await shrink(f);
      await MCM.store.setSetting(KEY, img);
      App.h.toast('Imagen guardada');
    } catch (e) { App.h.toast('No se pudo usar esa imagen'); }
    App.render();
  };
  A['cel-clear'] = async () => { img = null; await MCM.store.setSetting(KEY, null); App.render(); };
  A['cel-test'] = () => App.celebrate('LaLiga EA Sports');
})(globalThis.MCM = globalThis.MCM || {});
