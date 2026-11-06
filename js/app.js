/* Brit Hadasha · Mattityahu — aplicación de lectura */
(function () {
  'use strict';
  const CFG = window.APP_CONFIG;
  const CH = window.CHAPTERS;
  const app = document.getElementById('app');
  const hlbar = document.getElementById('hlbar');
  const cache = {};
  const COLORS = ['oro', 'oliva', 'cielo', 'rosa', 'lila'];
  const COLOR_HEX = { oro: '#E8C454', oliva: '#8DB25C', cielo: '#67A7DE', rosa: '#E88096', lila: '#A080D6' };

  /* ---------- Almacenamiento local seguro ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('bh.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('bh.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  let highlights = store.get('hl', {});
  let positions = store.get('pos', {});
  const prefs = Object.assign({ fs: 19, theme: 'auto', lastColor: 'oro' }, store.get('prefs', {}));
  function savePrefs() { store.set('prefs', prefs); applyPrefs(); }
  function applyPrefs() {
    document.documentElement.style.setProperty('--fs', prefs.fs + 'px');
    if (prefs.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', prefs.theme);
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = '#0D223D';
  }
  applyPrefs();

  /* ---------- Utilidades ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const HEB_RE = /[֐-׿יִ-ﭏ](?:[֐-׿יִ-ﭏ\s'"״׳־\-]*[֐-׿יִ-ﭏ])?/g;
  function fmt(t) { return esc(t).replace(HEB_RE, m => `<span class="he" lang="he" dir="rtl">${m}</span>`); }
  const icon = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const meta = n => CH.find(c => c.n === n);
  const base = location.pathname.replace(/[^/]*$/, '');
  function chapterUrl(n) {
    const site = (CFG.siteUrl || '').replace(/\/$/, '');
    const realHost = /^https?:$/.test(location.protocol) && !/claude/.test(location.hostname);
    if (realHost && (!site || new URL(site).origin !== location.origin)) return `${location.origin}${base}c/mateo-${n}.html`;
    return site ? `${site}/c/mateo-${n}.html` : `${location.href.split('#')[0]}#mateo-${n}`;
  }
  function homeUrl() {
    const site = (CFG.siteUrl || '').replace(/\/$/, '');
    const realHost = /^https?:$/.test(location.protocol) && !/claude/.test(location.hostname);
    if (realHost && (!site || new URL(site).origin !== location.origin)) return `${location.origin}${base}`;
    return site ? site + '/' : location.href.split('#')[0];
  }
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2400);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (x) {}
      ta.remove(); return ok;
    }
  }
  async function loadChapter(n) {
    if (cache[n]) return cache[n];
    const r = await fetch(`data/mateo-${n}.json`);
    if (!r.ok) throw new Error('No se pudo cargar el capítulo');
    return (cache[n] = await r.json());
  }

  /* ---------- Instalación (PWA) ---------- */
  let deferredPrompt = null;
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    if (!store.get('installDismissed', false) && !isStandalone()) showInstallBanner();
  });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; document.querySelector('.install-banner')?.remove(); toast('App instalada'); });
  function showInstallBanner() {
    if (document.querySelector('.install-banner')) return;
    const b = document.createElement('div'); b.className = 'install-banner no-print';
    b.innerHTML = `<img src="img/icon-192.png" alt=""><div><strong>Instala Brit Hadasha</strong>Léela sin conexión desde tu pantalla de inicio.</div>
      <button class="btn btn-gold" data-install>Instalar</button><button class="icon-btn" aria-label="Cerrar" data-x>${icon('close')}</button>`;
    b.querySelector('[data-install]').onclick = () => { b.remove(); install(); };
    b.querySelector('[data-x]').onclick = () => { b.remove(); store.set('installDismissed', true); };
    document.body.appendChild(b);
  }
  async function install() {
    if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice.catch(() => {}); deferredPrompt = null; return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const steps = ios
      ? `<li>Abre esta página en <strong>Safari</strong>.</li><li>Toca el botón <strong>Compartir</strong> (el cuadro con la flecha hacia arriba).</li><li>Elige <strong>Agregar a pantalla de inicio</strong> y toca <strong>Agregar</strong>.</li>`
      : `<li><strong>Android:</strong> abre el menú <strong>⋮</strong> de Chrome y elige <strong>Instalar app</strong> o <strong>Agregar a pantalla principal</strong>.</li><li><strong>Computador:</strong> en Chrome o Edge, haz clic en el ícono de instalar que aparece a la derecha de la barra de direcciones.</li>`;
    openSheet('Instalar la app', `<ol style="line-height:1.7;padding-left:1.2em;margin:0">${steps}</ol><p class="hint">Una vez instalada, los 18 capítulos se leen sin conexión.</p>`);
  }

  /* ---------- Hojas / paneles ---------- */
  function openSheet(title, html, onClose) {
    closeSheet();
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true'); sh.setAttribute('aria-label', title);
    sh.innerHTML = `<div class="sheet-grip"></div><div class="sheet-head"><h2>${esc(title)}</h2><button class="close" aria-label="Cerrar">${icon('close')}</button></div><div class="sheet-body">${html}</div>`;
    const close = () => { closeSheet(); onClose && onClose(); };
    scrim.onclick = close; sh.querySelector('.close').onclick = close;
    document.body.append(scrim, sh);
    sh._close = close;
    setTimeout(() => sh.querySelector('.close').focus({ preventScroll: true }), 30);
    return sh;
  }
  function closeSheet() { document.querySelectorAll('.scrim, .sheet').forEach(e => e.remove()); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSheet(); hideBar(); } });

  /* ---------- Compartir con tarjeta ---------- */
  function openShare(d) {
    let format = 'post';
    const text = `${d.title} — ${d.ref}\n“${d.quote}”\n\nLee el estudio completo: ${d.url}`;
    const enc = encodeURIComponent;
    const sh = openSheet('Compartir', `
      <div class="seg" role="group" aria-label="Formato de la tarjeta">
        <button data-f="post" aria-pressed="true">Publicación</button><button data-f="story" aria-pressed="false">Historia / Estado</button>
      </div>
      <canvas class="card-preview" width="1080" height="1350" aria-label="Vista previa de la tarjeta"></canvas>
      <button class="btn btn-gold share-primary" data-native hidden>${icon('share')}Compartir tarjeta</button>
      <div class="share-grid">
        <a href="https://wa.me/?text=${enc(text)}" target="_blank" rel="noopener"><span class="ico ico-wa">${icon('chat')}</span>WhatsApp</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${enc(d.url)}" target="_blank" rel="noopener"><span class="ico ico-fb">${icon('f')}</span>Facebook</a>
        <a href="https://twitter.com/intent/tweet?text=${enc(d.title + ' — ' + d.ref)}&url=${enc(d.url)}" target="_blank" rel="noopener"><span class="ico ico-x">${icon('xx')}</span>X</a>
        <a href="https://t.me/share/url?url=${enc(d.url)}&text=${enc(d.title + ' — ' + d.ref)}" target="_blank" rel="noopener"><span class="ico ico-tg">${icon('send')}</span>Telegram</a>
        <button data-ig><span class="ico ico-ig">${icon('camera')}</span>Instagram</button>
        <a href="mailto:?subject=${enc(d.title + ' — ' + d.ref)}&body=${enc(text)}"><span class="ico ico-mail">${icon('mail')}</span>Correo</a>
        <button data-copy><span class="ico ico-link">${icon('link')}</span>Copiar enlace</button>
        <button data-dl><span class="ico ico-dl">${icon('image')}</span>Guardar imagen</button>
      </div>
      <p class="hint">La tarjeta lleva un código QR y el enlace para entrar a la app.</p>`);
    const canvas = sh.querySelector('canvas');
    const render = () => window.ShareCard.draw(canvas, d, format, '');
    render();
    sh.querySelectorAll('.seg button').forEach(b => b.onclick = () => {
      format = b.dataset.f; sh.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-pressed', x === b)); render();
    });
    const fileName = `${d.file || 'brit-hadasha'}-${format}.png`;
    const getBlob = () => new Promise(res => canvas.toBlob(res, 'image/png'));
    const download = async () => {
      const blob = await getBlob(); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    };
    // Compartir nativo con imagen (móviles)
    const nat = sh.querySelector('[data-native]');
    try {
      const probe = new File([new Blob(['x'], { type: 'image/png' })], 'x.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [probe] })) nat.hidden = false;
      else if (navigator.share) { nat.hidden = false; nat.dataset.textOnly = '1'; nat.innerHTML = `${icon('share')}Compartir enlace`; }
    } catch (e) {}
    nat.onclick = async () => {
      try {
        if (nat.dataset.textOnly) { await navigator.share({ title: d.title, text, url: d.url }); return; }
        const blob = await getBlob();
        const file = new File([blob], fileName, { type: 'image/png' });
        await navigator.share({ files: [file], title: d.title, text });
      } catch (e) { if (e && e.name !== 'AbortError') toast('No se pudo abrir el menú para compartir'); }
    };
    sh.querySelector('[data-copy]').onclick = async () => { toast((await copyText(d.url)) ? 'Enlace copiado' : 'Selecciona y copia el enlace: ' + d.url); };
    sh.querySelector('[data-dl]').onclick = async () => { await download(); toast('Imagen guardada'); };
    sh.querySelector('[data-ig]').onclick = async () => {
      if (!nat.hidden && !nat.dataset.textOnly) { nat.click(); return; }
      await download(); toast('Imagen guardada. Súbela a tu historia de Instagram');
    };
  }
  function chapterShareData(n) {
    const m = meta(n);
    return { kicker: `Brit Hadasha · Mattityahu ${n}`, title: m.tema, quote: m.verso, ref: `Mattityahu ${m.ref}`, url: chapterUrl(n), chapter: n, file: `mattityahu-${n}` };
  }

  /* ---------- Vistas ---------- */
  function setTitle(t) { document.title = t ? `${t} · Brit Hadasha` : 'Brit Hadasha · Mattityahu'; }

  function viewHome() {
    setTitle('');
    const last = store.get('last', null);
    const total = Object.values(highlights).reduce((a, l) => a + l.length, 0);
    app.innerHTML = `
      <header class="hero">
        <div class="wrap">
          <img class="hero-logo" src="img/logo-banner.png" alt="Yeshúa La Torah Viviente — Ministerio Judío Mesiánico" width="1280" height="171">
          <div class="hero-text">
            <h1>Brit Hadasha<small>Besoráh según Mattityahu</small></h1>
            <p>Estudio expositivo profundo de los capítulos 1 al 18, a la luz del Mashíaj Yeshúa. Lee, subraya con colores y comparte cada capítulo.</p>
            <div class="hero-actions">
              ${last ? `<a class="btn btn-gold" href="#mateo-${last}" data-resume="${last}">${icon('book')}Continuar en Mattityahu ${last}</a>` : `<a class="btn btn-gold" href="#mateo-1">${icon('book')}Comenzar a leer</a>`}
              ${isStandalone() ? '' : `<button class="btn btn-ghost" data-install>${icon('install')}Instalar app</button>`}
              <button class="btn btn-ghost" data-share-app>${icon('share')}Compartir</button>
            </div>
          </div>
        </div>
      </header>
      <main>
        <section class="section wrap" aria-labelledby="h-caps">
          <div class="section-head"><h2 id="h-caps">Capítulos</h2><p>18 estudios · sin conexión una vez instalada</p></div>
          <ol class="chapters">
            ${CH.map(c => {
              const p = positions[c.n] || 0; const hl = (highlights[c.n] || []).length;
              return `<li><a class="chap-link" href="#mateo-${c.n}">
                <span class="chap-num">${c.n}</span>
                <span class="chap-body"><span class="chap-title">${esc(c.tema)}</span>
                  <span class="chap-sum" style="display:block">${esc(c.resumen)}</span>
                  <span class="chap-meta"><span>Mattityahu ${esc(c.ref)}</span>${p > 0.02 ? `<span class="done">Leído ${Math.min(100, Math.round(p * 100))}%</span>` : ''}${hl ? `<span class="done">${hl} subrayado${hl > 1 ? 's' : ''}</span>` : ''}</span></span>
                <span class="chap-arrow">${icon('next')}</span></a></li>`;
            }).join('')}
          </ol>
        </section>
        <section class="section wrap" aria-labelledby="h-hl" style="padding-top:0">
          <div class="section-head"><h2 id="h-hl">Mis subrayados</h2><p>${total ? `${total} guardado${total > 1 ? 's' : ''} en este dispositivo` : 'Selecciona cualquier texto mientras lees para subrayarlo'}</p></div>
          <a class="btn btn-plain" href="#subrayados">${icon('marker')}Ver mis subrayados</a>
        </section>
        <section class="section wrap" aria-labelledby="h-redes" style="padding-top:0">
          <div class="section-head"><h2 id="h-redes">Síguenos</h2><p>Recursos y redes del ministerio</p></div>
          <div class="links-grid">
            ${CFG.redes.map(r => `<a class="social" href="${r.url}" target="_blank" rel="noopener"><span class="ico">${icon({ instagram: 'camera', telegram: 'send', biblioteca: 'book', recursos: 'sparkle' }[r.id] || 'link')}</span><span style="min-width:0"><strong>${esc(r.nombre)}</strong><span>${esc(r.detalle)}</span></span></a>`).join('')}
          </div>
        </section>
      </main>
      <footer class="footer"><div class="wrap">
        <div class="sig">${esc(CFG.despedida)}</div>
        <p>Ministerio Judío Mesiánico · <a href="https://biblioteca-mesianica.vercel.app/" target="_blank" rel="noopener">biblioteca-mesianica.vercel.app</a></p>
        <p style="opacity:.7;margin:0">Am Israel Jai</p>
      </div></footer>`;
    app.querySelector('[data-install]')?.addEventListener('click', install);
    app.querySelector('[data-resume]')?.addEventListener('click', () => { pendingRestore = true; });
    app.querySelector('[data-share-app]').onclick = () => openShare({
      kicker: 'Brit Hadasha · Besoráh de Mattityahu', title: 'Yeshúa, la Toráh viviente', quote: 'Busca primero El Reino y su justicia, y a su tiempo todas estas cosas se les darán por añadidura.',
      ref: 'Mattityahu 6:33', url: homeUrl(), chapter: null, file: 'brit-hadasha'
    });
    window.scrollTo(0, 0);
  }

  let pendingRestore = false;
  let current = null; // { n, data }

  function renderBlocks(blocks) {
    let html = '', i = 0, inList = false, inScripture = false;
    const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
    const closeScr = () => { if (inScripture) { html += '</section>'; inScripture = false; } };
    for (i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.k === 'title') continue;
      const isScr = b.k === 'v' || (inScripture && (b.k === 'note'));
      if (!isScr) closeScr();
      if (b.k !== 'li') closeList();
      if (b.k === 'ref') {
        const nxt = blocks[i + 1];
        if (nxt && nxt.k === 'v') {
          html += `<section class="scripture" aria-label="Texto bíblico"><div class="scripture-head"><h2 id="texto">Texto bíblico</h2><span class="blk" data-b="${i}"><span class="tx">${fmt(b.t)}</span></span></div>`;
          inScripture = true;
        } else html += `<h3 class="blk" data-b="${i}"><span class="tx">${fmt(b.t)}</span></h3>`;
        continue;
      }
      if (b.k === 'v') {
        if (!inScripture) { html += `<section class="scripture" aria-label="Texto bíblico">`; inScripture = true; }
        html += `<p class="verse blk" id="v-${b.n}" data-b="${i}" data-v="${b.n}"><sup>${b.n}</sup><span class="tx">${fmt(b.t)}</span></p>`;
      } else if (b.k === 'note') html += `<p class="note blk" data-b="${i}"><span class="tx">${fmt(b.t)}</span></p>`;
      else if (b.k === 'h2') html += `<h2 class="blk" id="s-${i}" data-b="${i}"><span class="tx">${fmt(b.t)}</span></h2>`;
      else if (b.k === 'h3') html += `<h3 class="blk" id="s-${i}" data-b="${i}"><span class="tx">${fmt(b.t)}</span></h3>`;
      else if (b.k === 'li') { if (!inList) { html += '<ul>'; inList = true; } html += `<li class="blk" data-b="${i}"><span class="tx">${fmt(b.t)}</span></li>`; }
      else html += `<p class="blk${b.b ? ' strong' : ''}" data-b="${i}"><span class="tx">${fmt(b.t)}</span></p>`;
    }
    closeList(); closeScr();
    return html;
  }

  async function viewChapter(n, target) {
    const m = meta(n);
    if (!m) { location.hash = ''; return; }
    setTitle(`Mattityahu ${n}`);
    app.innerHTML = `<div class="loading">Cargando Mattityahu ${n}…</div>`;
    let data;
    try { data = await loadChapter(n); }
    catch (e) { app.innerHTML = `<div class="empty"><strong>No se pudo abrir el capítulo</strong>Revisa tu conexión a internet y vuelve a intentarlo.<p><a class="btn btn-plain" href="#mateo-${n}" onclick="location.reload()">Reintentar</a></p></div>`; return; }
    current = { n, data };
    store.set('last', n);
    const prev = meta(n - 1), next = meta(n + 1);
    app.innerHTML = `
      <header class="topbar"><div class="wrap topbar-in">
        <a class="icon-btn" href="#" aria-label="Volver a los capítulos">${icon('back')}</a>
        <div class="topbar-title"><small>Brit Hadasha</small>Mattityahu ${n}</div>
        <button class="icon-btn" data-toc aria-label="Índice del capítulo">${icon('list')}</button>
        <button class="icon-btn" data-settings aria-label="Tamaño de letra y tema">${icon('text')}</button>
        <button class="icon-btn" data-share aria-label="Compartir capítulo">${icon('share')}</button>
        <a class="icon-btn" href="pdf/Mattityahu-${n}.pdf" download="Mattityahu-${n}-Brit-Hadasha.pdf" aria-label="Descargar PDF" data-pdf>${icon('pdf')}</a>
      </div><div class="progress"></div></header>
      <section class="chap-hero"><span class="ghost" aria-hidden="true">${n}</span><div class="wrap">
        <div class="kicker">Mattityahu · Capítulo ${n}</div>
        <h1>${esc(m.tema)}</h1>
        <blockquote>“${esc(m.verso)}”<cite>Mattityahu ${esc(m.ref)}</cite></blockquote>
        <div class="hero-actions">
          <button class="btn btn-gold" data-share>${icon('share')}Compartir tarjeta</button>
          <a class="btn btn-ghost" href="pdf/Mattityahu-${n}.pdf" download="Mattityahu-${n}-Brit-Hadasha.pdf" data-pdf>${icon('pdf')}Descargar PDF</a>
        </div>
      </div></section>
      <main class="wrap"><article class="article measure" id="article" lang="es">${renderBlocks(data.blocks)}</article>
        <div class="chap-end measure">
          <div class="share-cta"><div><h3>Comparte Mattityahu ${n}</h3><p>Envía la tarjeta con el tema central y el enlace al estudio.</p></div>
            <button class="btn btn-gold" data-share>${icon('share')}Compartir tarjeta</button></div>
          <nav class="pager" aria-label="Otros capítulos">
            ${prev ? `<a class="prev" href="#mateo-${prev.n}"><small>Anterior · Capítulo ${prev.n}</small><strong>${esc(prev.tema)}</strong></a>` : ''}
            ${next ? `<a class="next" href="#mateo-${next.n}"><small>Siguiente · Capítulo ${next.n}</small><strong>${esc(next.tema)}</strong></a>` : ''}
          </nav>
          <div class="signoff"><div class="sig">${esc(CFG.despedida)}</div>
            <p>Más recursos: <a href="https://biblioteca-mesianica.vercel.app/" target="_blank" rel="noopener">biblioteca-mesianica.vercel.app</a></p></div>
        </div>
      </main>`;
    app.querySelectorAll('[data-share]').forEach(b => b.onclick = () => openShare(chapterShareData(n)));
    app.querySelector('[data-toc]').onclick = openToc;
    app.querySelector('[data-settings]').onclick = openSettings;
    app.querySelectorAll('[data-pdf]').forEach(a => a.addEventListener('click', () => toast('Descargando PDF…')));
    applyAllMarks();
    // Posición
    requestAnimationFrame(() => {
      if (target && target.v) { const el = document.getElementById('v-' + target.v); if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); } }
      else if (target && target.b != null) { const el = app.querySelector(`[data-b="${target.b}"]`); if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); } }
      else if (pendingRestore && positions[n]) { const h = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, positions[n] * h); }
      else window.scrollTo(0, 0);
      pendingRestore = false;
      onScroll();
    });
  }

  function openToc() {
    const hs = current.data.blocks.map((b, i) => ({ b, i })).filter(x => x.b.k === 'h2');
    const has = current.data.blocks.some(b => b.k === 'v');
    const sh = openSheet('Índice', `<ul class="toc-list">${has ? '<li><a href="#" data-to="texto">Texto bíblico</a></li>' : ''}${hs.map(x => `<li><a href="#" data-to="s-${x.i}">${esc(x.b.t)}</a></li>`).join('')}</ul>`);
    sh.querySelectorAll('[data-to]').forEach(a => a.onclick = e => {
      e.preventDefault(); closeSheet();
      const el = document.getElementById(a.dataset.to); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  function openSettings() {
    const sh = openSheet('Lectura', `
      <div class="setting"><span>Tamaño de letra</span><div class="stepper"><button data-d="-1" aria-label="Letra más pequeña">A−</button><output id="fs-out">${prefs.fs}</output><button data-d="1" aria-label="Letra más grande">A+</button></div></div>
      <div class="setting"><span>Apariencia</span><div class="seg" style="margin:0">${[['auto', 'Automática'], ['light', 'Clara'], ['dark', 'Oscura']].map(([v, l]) => `<button data-t="${v}" aria-pressed="${prefs.theme === v}">${l}</button>`).join('')}</div></div>`);
    sh.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
      prefs.fs = Math.max(15, Math.min(28, prefs.fs + Number(b.dataset.d))); sh.querySelector('#fs-out').textContent = prefs.fs; savePrefs();
    });
    sh.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
      prefs.theme = b.dataset.t; sh.querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-pressed', x === b)); savePrefs();
    });
  }

  function viewHighlights() {
    setTitle('Mis subrayados');
    const chs = Object.keys(highlights).map(Number).filter(n => highlights[n].length).sort((a, b) => a - b);
    app.innerHTML = `
      <header class="topbar"><div class="wrap topbar-in">
        <a class="icon-btn" href="#" aria-label="Volver al inicio">${icon('back')}</a>
        <div class="topbar-title"><small>Brit Hadasha</small>Mis subrayados</div>
      </div></header>
      <main class="wrap"><div class="measure section">
        ${chs.length ? chs.map(n => `<div class="hl-group"><h3>Mattityahu ${n} · ${esc(meta(n).tema)}</h3>
          ${highlights[n].slice().sort((a, b) => a.b - b.b || a.s - b.s).map(h => `<div class="hl-item"><span class="bar" style="background:${COLOR_HEX[h.c]}"></span>
            <a href="#mateo-${n}-b${h.b}">${h.v ? `<strong style="color:var(--gold-ink)">${n}:${h.v}</strong> ` : ''}${fmt(h.t)}</a>
            <button aria-label="Quitar subrayado" data-del="${n}|${h.id}">${icon('trash')}</button></div>`).join('')}</div>`).join('')
        : `<div class="empty"><strong>Aún no tienes subrayados</strong>Abre un capítulo y selecciona cualquier frase. Elige un color en la barra que aparece abajo.<p><a class="btn btn-gold" href="#mateo-1">Ir a Mattityahu 1</a></p></div>`}
        <p class="hint">Los subrayados se guardan en este dispositivo.</p>
      </div></main>`;
    app.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const [n, id] = b.dataset.del.split('|');
      highlights[n] = (highlights[n] || []).filter(h => h.id !== id); store.set('hl', highlights); viewHighlights();
    });
    window.scrollTo(0, 0);
  }

  /* ---------- Subrayado ---------- */
  function txOf(el) { return el.querySelector('.tx'); }
  function renderBlockText(el) {
    const i = Number(el.dataset.b);
    const tx = txOf(el); if (!tx) return;
    tx.innerHTML = fmt(current.data.blocks[i].t);
    const list = (highlights[current.n] || []).filter(h => h.b === i).sort((a, b) => a.s - b.s);
    list.forEach(h => wrapRange(tx, h));
  }
  function wrapRange(tx, h) {
    const walker = document.createTreeWalker(tx, NodeFilter.SHOW_TEXT);
    const nodes = []; let n; while ((n = walker.nextNode())) nodes.push(n);
    let pos = 0;
    for (const node of nodes) {
      const len = node.data.length, ns = pos, ne = pos + len; pos = ne;
      if (ne <= h.s || ns >= h.e) continue;
      let target = node;
      const a = Math.max(0, h.s - ns), b = Math.min(len, h.e - ns);
      if (b < len) target.splitText(b);
      if (a > 0) target = target.splitText(a);
      const mark = document.createElement('mark'); mark.className = 'hl hl-' + h.c; mark.dataset.id = h.id;
      target.parentNode.insertBefore(mark, target); mark.appendChild(target);
    }
  }
  function applyAllMarks() {
    const list = highlights[current.n] || [];
    const blocks = new Set(list.map(h => h.b));
    blocks.forEach(b => { const el = app.querySelector(`.blk[data-b="${b}"]`); if (el) renderBlockText(el); });
  }
  function offsetIn(tx, node, off) {
    const r = document.createRange(); r.setStart(tx, 0);
    try { r.setEnd(node, off); } catch (e) { return 0; }
    return r.toString().length;
  }

  let pending = null;   // selección actual: { pieces, text }
  let activeMark = null; // subrayado tocado: { n, id }

  function selectionPieces() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount || !current) return null;
    const range = sel.getRangeAt(0);
    const article = document.getElementById('article');
    if (!article || !article.contains(range.commonAncestorContainer)) return null;
    const pieces = [];
    article.querySelectorAll('.blk').forEach(el => {
      if (!range.intersectsNode(el)) return;
      const tx = txOf(el); if (!tx) return;
      const full = tx.textContent.length;
      const s = tx.contains(range.startContainer) ? offsetIn(tx, range.startContainer, range.startOffset)
        : (range.comparePoint(tx, 0) >= 0 ? 0 : full);
      const e = tx.contains(range.endContainer) ? offsetIn(tx, range.endContainer, range.endOffset)
        : (range.comparePoint(tx, tx.childNodes.length) <= 0 ? full : 0);
      if (e > s) {
        const raw = tx.textContent.slice(s, e);
        const lead = raw.length - raw.trimStart().length, trail = raw.length - raw.trimEnd().length;
        if (raw.trim()) pieces.push({ b: Number(el.dataset.b), s: s + lead, e: e - trail, t: raw.trim(), v: el.dataset.v ? Number(el.dataset.v) : null });
      }
    });
    if (!pieces.length) return null;
    return { pieces, text: pieces.map(p => p.t).join(' ') };
  }

  function showBar(mode) {
    hlbar.hidden = false;
    hlbar.querySelector('[data-act="remove"]').hidden = mode !== 'mark';
    const col = mode === 'mark' ? findHl(activeMark)?.c : null;
    hlbar.querySelectorAll('.swatch').forEach(s => s.setAttribute('aria-pressed', s.dataset.color === col));
    document.querySelector('.install-banner')?.setAttribute('hidden', '');
  }
  function hideBar() { hlbar.hidden = true; pending = null; activeMark = null; document.querySelector('.install-banner')?.removeAttribute('hidden'); }
  function findHl(a) { return a && (highlights[a.n] || []).find(h => h.id === a.id); }

  let selTimer = null;
  document.addEventListener('selectionchange', () => {
    clearTimeout(selTimer);
    selTimer = setTimeout(() => {
      const p = selectionPieces();
      if (p) { pending = p; activeMark = null; showBar('select'); }
      else if (!activeMark) hideBar();
    }, 120);
  });

  function addHighlight(color) {
    const n = current.n; const list = (highlights[n] = highlights[n] || []);
    const touched = new Set();
    pending.pieces.forEach(p => {
      for (let k = list.length - 1; k >= 0; k--) {
        const ex = list[k];
        if (ex.b !== p.b || ex.e <= p.s || ex.s >= p.e) continue;
        list.splice(k, 1);
        const blockText = current.data.blocks[p.b].t;
        const plain = blockPlain(p.b);
        if (ex.s < p.s) list.push(Object.assign({}, ex, { e: p.s, t: plain.slice(ex.s, p.s).trim() }));
        if (ex.e > p.e) list.push(Object.assign({}, ex, { id: uid(), s: p.e, t: plain.slice(p.e, ex.e).trim() }));
        void blockText;
      }
      list.push({ id: uid(), b: p.b, s: p.s, e: p.e, c: color, t: p.t, v: p.v, ts: Date.now() });
      touched.add(p.b);
    });
    store.set('hl', highlights);
    prefs.lastColor = color; store.set('prefs', prefs);
    window.getSelection().removeAllRanges();
    touched.forEach(b => renderBlockText(app.querySelector(`.blk[data-b="${b}"]`)));
    hideBar(); toast('Subrayado guardado');
  }
  function blockPlain(b) {
    const el = app.querySelector(`.blk[data-b="${b}"] .tx`); return el ? el.textContent : current.data.blocks[b].t;
  }
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

  hlbar.addEventListener('mousedown', e => e.preventDefault()); // conserva la selección en escritorio
  hlbar.addEventListener('click', async e => {
    const sw = e.target.closest('.swatch'); const act = e.target.closest('.act');
    if (sw) {
      if (activeMark) {
        const h = findHl(activeMark); if (h) { h.c = sw.dataset.color; store.set('hl', highlights); renderBlockText(app.querySelector(`.blk[data-b="${h.b}"]`)); }
        hideBar(); return;
      }
      if (pending) addHighlight(sw.dataset.color);
      return;
    }
    if (!act) return;
    const n = current.n;
    const sel = activeMark ? (() => { const h = findHl(activeMark); return h ? { text: h.t, v: h.v } : null; })()
      : pending ? { text: pending.text, v: pending.pieces.find(p => p.v)?.v } : null;
    if (act.dataset.act === 'remove' && activeMark) {
      const h = findHl(activeMark);
      highlights[n] = highlights[n].filter(x => x.id !== activeMark.id); store.set('hl', highlights);
      if (h) renderBlockText(app.querySelector(`.blk[data-b="${h.b}"]`));
      hideBar(); toast('Subrayado quitado'); return;
    }
    if (!sel) return;
    const ref = sel.v ? `Mattityahu ${n}:${sel.v}` : `Estudio de Mattityahu ${n}`;
    if (act.dataset.act === 'copy') {
      const ok = await copyText(`“${sel.text}”\n— ${ref}\n${chapterUrl(n)}`);
      toast(ok ? 'Texto copiado' : 'No se pudo copiar'); window.getSelection().removeAllRanges(); hideBar(); return;
    }
    if (act.dataset.act === 'share') {
      const m = meta(n);
      const quote = sel.text.length > 420 ? sel.text.slice(0, 417).replace(/\s+\S*$/, '') + '…' : sel.text;
      window.getSelection().removeAllRanges(); hideBar();
      openShare({ kicker: `Brit Hadasha · Mattityahu ${n}`, title: m.tema, quote, ref, url: chapterUrl(n), chapter: n, file: `mattityahu-${n}-cita` });
    }
  });
  document.addEventListener('click', e => {
    const mk = e.target.closest('mark.hl');
    if (mk && current) {
      const sel = window.getSelection(); if (sel && !sel.isCollapsed) return;
      activeMark = { n: current.n, id: mk.dataset.id }; pending = null; showBar('mark'); return;
    }
    if (!e.target.closest('#hlbar') && activeMark) hideBar();
  });

  /* ---------- Progreso de lectura ---------- */
  let saveT = null;
  function onScroll() {
    const bar = app.querySelector('.progress'); if (!bar || !current || !location.hash.startsWith('#mateo-')) return;
    const h = document.documentElement.scrollHeight - innerHeight;
    const r = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
    bar.style.width = (r * 100) + '%';
    clearTimeout(saveT);
    saveT = setTimeout(() => { positions[current.n] = Math.max(r, 0); store.set('pos', positions); }, 400);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Rutas ---------- */
  function route() {
    hideBar(); closeSheet();
    const h = decodeURIComponent(location.hash.slice(1));
    let m;
    if ((m = h.match(/^mateo-(\d+)(?:-v(\d+)|-b(\d+))?$/))) {
      current = null;
      return viewChapter(Number(m[1]), m[2] ? { v: Number(m[2]) } : m[3] ? { b: Number(m[3]) } : null);
    }
    current = null;
    if (h === 'subrayados') return viewHighlights();
    viewHome();
  }
  window.addEventListener('hashchange', route);
  route();

  /* ---------- Service worker (sin conexión) ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
})();
