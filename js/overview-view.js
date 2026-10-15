// Overview — the most important page, so only what matters:
// 1. lead: the idea + a carousel of every structure (2D front views)
// 2. the structures, each with its own front view
// 3. application → structure, and how I read a structure, side by side
(function () {
  'use strict';

  const FRAMEWORK = window.APP_FRAMEWORK || [];
  const PACKAGES = window.PACKAGES || [];
  const APPS = window.APPLICATIONS || [];
  const AUTO_MS = 4800;

  let slide = 0;
  let timer = null;

  function countChallenges() {
    const root = window.STRUCTURE_TREE;
    const ch = root && (root.children || []).find(n => n.id === 'challenges');
    return ch && ch.children ? ch.children.length : 0;
  }
  const letter = i => String.fromCharCode(97 + i);
  const fig = (pkg, w, h, pad) => (window.Figure2D ? window.Figure2D.render(pkg, { width: w, height: h, pad }) : '');
  // First sentence of a subtitle — enough for a caption.
  const firstSentence = s => { const m = String(s || '').match(/^.*?[.!?](\s|$)/); return m ? m[0].trim() : s; };

  function render() {
    const root = document.getElementById('overview-root');
    if (!root) return;

    const nComponents = PACKAGES.reduce((n, p) => n + p.elements.length, 0);
    const stats = [
      { n: PACKAGES.length, label: 'structures' },
      { n: nComponents, label: 'components' },
      { n: APPS.length, label: 'applications' },
      { n: countChallenges(), label: 'challenges' }
    ].filter(s => s.n > 0);
    const pkgShort = id => { const p = PACKAGES.find(x => x.id === id); return p ? p.short : id; };
    const pkgLetter = id => { const i = PACKAGES.findIndex(x => x.id === id); return i >= 0 ? letter(i) : ''; };

    root.innerHTML = `
      <section class="ov-lead">
        <div class="ov-lead-text">
          <div class="ov-kicker">Hoogwan's Lab Notebook · Advanced Packaging</div>
          <h1 class="ov-lead-title">The application sets the demand. The <em>system</em> answers it — from die to package.</h1>
          <p class="ov-lead-lede">A die is designed for what it computes. How it is connected, stacked, powered, cooled and linked to the world is decided at the package — and that choice follows the application.</p>
          <div class="ov-lead-stats">${stats.map(s => `<span><b>${s.n}</b>${s.label}</span>`).join('')}</div>
        </div>

        <div class="ov-stage" aria-roledescription="carousel" aria-label="Structures">
          <div class="ov-stage-slides">
            ${PACKAGES.map((p, i) => `
              <figure class="ov-slide${i === 0 ? ' is-active' : ''}" data-i="${i}" aria-hidden="${i === 0 ? 'false' : 'true'}">
                <div class="ov-slide-fig">${fig(p, 640, 320, 10)}</div>
                <figcaption>
                  <span class="ov-slide-letter">${letter(i)}</span>
                  <span class="ov-slide-name">${escapeHtml(p.name)}</span>
                  <span class="ov-slide-cap">${escapeHtml(firstSentence(p.subtitle))}</span>
                </figcaption>
              </figure>`).join('')}
          </div>
          <button class="ov-stage-arrow prev" aria-label="Previous structure">&#8249;</button>
          <button class="ov-stage-arrow next" aria-label="Next structure">&#8250;</button>
          <div class="ov-stage-foot">
            <div class="ov-stage-dots">
              ${PACKAGES.map((p, i) => `<button class="ov-dot${i === 0 ? ' is-active' : ''}" data-i="${i}" aria-label="${escapeHtml(p.short)}"></button>`).join('')}
            </div>
            <a href="#" class="ov-stage-open">Open in 3D</a>
          </div>
        </div>
      </section>

      <section class="ov-section">
        <header class="ov-head"><span class="ov-head-n">01</span><h2>Structures</h2><span class="ov-head-note">Front views, drawn from the same data as the 3D Explorer</span></header>
        <div class="ov-list">
          ${PACKAGES.map((p, i) => `
            <article class="ov-item">
              <div class="ov-item-meta">
                <div class="ov-item-letter">${letter(i)}</div>
                <div class="ov-item-sub">${p.elements.length} components</div>
              </div>
              <div class="ov-item-body">
                <h3><a href="#" class="ov-link" data-pkg="${escapeHtml(p.id)}">${escapeHtml(p.name)}</a></h3>
                <p>${escapeHtml(p.subtitle)}</p>
              </div>
              <a href="#" class="ov-item-fig" data-pkg="${escapeHtml(p.id)}" aria-label="Open ${escapeHtml(p.name)} in 3D">${fig(p, 260, 120, 8)}</a>
            </article>
          `).join('')}
        </div>
      </section>

      <div class="ov-split">
        ${APPS.length ? `
        <section class="ov-section">
          <header class="ov-head"><span class="ov-head-n">02</span><h2>From application to structure</h2></header>
          <div class="ov-chain">
            ${APPS.map(a => `
              <div class="ov-chain-row">
                <div>
                  <a href="#" class="ov-link ov-chain-app" data-view="applications">${escapeHtml(a.name)}</a>
                  <div class="ov-chain-tag">${escapeHtml(a.tagline || '')}</div>
                </div>
                <div class="ov-chain-pkgs">
                  ${(a.recommendedPackages || []).map(id => `
                    <button class="ov-chip" data-pkg="${escapeHtml(id)}"><b>${pkgLetter(id)}</b>${escapeHtml(pkgShort(id))}</button>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </section>` : ''}

        <section class="ov-section">
          <header class="ov-head"><span class="ov-head-n">03</span><h2>How I read a structure</h2></header>
          <ol class="ov-steps">
            ${FRAMEWORK.map(f => `<li><span class="ov-step-n">${f.step}</span><span>${escapeHtml(f.title)}</span></li>`).join('')}
          </ol>
        </section>
      </div>

      <nav class="ov-more">
        <a href="#" class="ov-link" data-view="structure">The whole field as one map</a>
        <a href="#" class="ov-link" data-view="ideas">My ideas and sketches</a>
      </nav>
    `;

    root.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); if (window.AppNav) window.AppNav.switchView(el.dataset.view); });
    });
    root.querySelectorAll('[data-pkg]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); if (window.AppNav) window.AppNav.goToPackage(el.dataset.pkg); });
    });
    bindStage(root);
  }

  /* ---------- carousel: auto-advances, arrows + dots for manual control ---------- */
  function bindStage(root) {
    const stage = root.querySelector('.ov-stage');
    if (!stage || !PACKAGES.length) return;
    const slides = stage.querySelectorAll('.ov-slide');
    const dots = stage.querySelectorAll('.ov-dot');
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const show = i => {
      slide = (i + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('is-active', k === slide); s.setAttribute('aria-hidden', k === slide ? 'false' : 'true'); });
      dots.forEach((d, k) => d.classList.toggle('is-active', k === slide));
    };
    const start = () => { stop(); if (!reduce) timer = setInterval(() => { if (isVisible()) show(slide + 1); }, AUTO_MS); };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };
    const isVisible = () => { const v = document.getElementById('view-overview'); return v && v.classList.contains('active') && !document.hidden; };

    stage.querySelector('.prev').addEventListener('click', () => { show(slide - 1); start(); });
    stage.querySelector('.next').addEventListener('click', () => { show(slide + 1); start(); });
    dots.forEach(d => d.addEventListener('click', () => { show(+d.dataset.i); start(); }));
    stage.querySelector('.ov-stage-open').addEventListener('click', e => {
      e.preventDefault();
      if (window.AppNav) window.AppNav.goToPackage(PACKAGES[slide].id);
    });
    stage.addEventListener('mouseenter', stop);
    stage.addEventListener('mouseleave', start);
    stage.addEventListener('focusin', stop);
    stage.addEventListener('focusout', start);
    show(slide);
    start();
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
