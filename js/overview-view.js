// Overview — landing page in a journal-front-page mood: a lead story
// (application → system), then the structures listed like featured articles.
(function () {
  'use strict';

  const FRAMEWORK = window.APP_FRAMEWORK || [];
  const PACKAGES = window.PACKAGES || [];
  const APPS = window.APPLICATIONS || [];

  function countChallenges() {
    const root = window.STRUCTURE_TREE;
    const ch = root && (root.children || []).find(n => n.id === 'challenges');
    return ch && ch.children ? ch.children.length : 0;
  }

  // Small "strata" swatch: the structure's own layer colours, bottom → top.
  function strata(pkg) {
    const seen = new Set();
    const layers = pkg.elements
      .slice()
      .sort((a, b) => (a.geo.layer - b.geo.layer) || (a.geo.pos[1] - b.geo.pos[1]))
      .filter(e => { if (seen.has(e.color)) return false; seen.add(e.color); return true; })
      .slice(0, 9)
      .reverse();
    return `<div class="ov-strata" aria-hidden="true">${layers.map((e, i) =>
      `<span style="background:${e.color};width:${58 + (i * 37) % 42}%"></span>`).join('')}</div>`;
  }

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

    const letter = i => String.fromCharCode(97 + i);
    const pkgShort = id => { const p = PACKAGES.find(x => x.id === id); return p ? p.short : id; };
    const pkgLetter = id => { const i = PACKAGES.findIndex(x => x.id === id); return i >= 0 ? letter(i) : ''; };

    root.innerHTML = `
      <section class="ov-lead">
        <div class="ov-lead-text">
          <div class="ov-lead-kicker">Hoogwan's Lab Notebook · Advanced Packaging</div>
          <h1 class="ov-lead-title">The application sets the demand. The system answers it — from die to package.</h1>
          <p class="ov-lead-lede">A die is designed for what it computes. How it is connected, stacked, powered, cooled and linked to the world is decided at the package — and that choice follows the application.</p>
          <div class="ov-lead-stats">
            ${stats.map(s => `<span><b>${s.n}</b> ${s.label}</span>`).join('')}
          </div>
        </div>
        <div class="ov-lead-art">
          <img src="assets/hero.svg" alt="Illustrated package cross-section with a cleanroom engineer holding a wafer">
        </div>
      </section>

      <section class="ov-section">
        <h2 class="ov-section-head">Structures</h2>
        <div class="ov-list">
          ${PACKAGES.map((p, i) => `
            <article class="ov-item">
              <div class="ov-item-meta">
                <div class="ov-item-type">Structure ${letter(i)}</div>
                <div class="ov-item-sub">${p.elements.length} components</div>
              </div>
              <div class="ov-item-body">
                <h3><a href="#" class="ov-item-link" data-pkg="${escapeHtml(p.id)}">${escapeHtml(p.name)}</a></h3>
                <p>${escapeHtml(p.subtitle)}</p>
              </div>
              ${strata(p)}
            </article>
          `).join('')}
        </div>
      </section>

      ${APPS.length ? `
      <section class="ov-section">
        <h2 class="ov-section-head">From application to structure</h2>
        <div class="ov-chain-grid">
          ${APPS.map(a => `
            <div class="ov-chain-row">
              <a href="#" class="ov-chain-app" data-view="applications" style="--app:${a.color}">${escapeHtml(a.name)}</a>
              <div class="ov-chain-tag">${escapeHtml(a.tagline || '')}</div>
              <div class="ov-chain-pkgs">
                ${(a.recommendedPackages || []).map(id => `
                  <button class="ov-chain-pkg" data-pkg="${escapeHtml(id)}"><b>${pkgLetter(id)}</b> ${escapeHtml(pkgShort(id))}</button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </section>` : ''}

      <section class="ov-section">
        <h2 class="ov-section-head">How I read a structure</h2>
        <ol class="ov-steps">
          ${FRAMEWORK.map(f => `<li><span class="ov-step-n">${f.step}</span>${escapeHtml(f.title)}</li>`).join('')}
        </ol>
      </section>

      <section class="ov-section ov-more">
        <a href="#" data-view="structure">The whole field as one map</a>
        <a href="#" data-view="ideas">My ideas and sketches</a>
      </section>
    `;

    root.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); if (window.AppNav) window.AppNav.switchView(el.dataset.view); });
    });
    root.querySelectorAll('[data-pkg]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); if (window.AppNav) window.AppNav.goToPackage(el.dataset.pkg); });
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
