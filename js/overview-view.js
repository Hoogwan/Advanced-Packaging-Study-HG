// Overview — landing page. Message: the application decides the system,
// and the package is where die-level design meets system-level needs.
(function () {
  'use strict';

  const FRAMEWORK = window.APP_FRAMEWORK || [];
  const PACKAGES = window.PACKAGES || [];
  const APPS = window.APPLICATIONS || [];

  const SECTION_CARDS = [
    { view: 'explorer', icon: 'fa-cube', title: '3D Explorer', tagline: `${PACKAGES.length} structures, taken apart layer by layer` },
    { view: 'applications', icon: 'fa-satellite-dish', title: 'Applications', tagline: 'What each application asks of the package' },
    { view: 'structure', icon: 'fa-diagram-project', title: 'Structure Map', tagline: 'The whole field as one map' },
    { view: 'ideas', icon: 'fa-lightbulb', title: 'Ideas', tagline: 'My own concepts and sketches' }
  ];

  function countChallenges() {
    const root = window.STRUCTURE_TREE;
    const ch = root && (root.children || []).find(n => n.id === 'challenges');
    return ch && ch.children ? ch.children.length : 0;
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

    const pkgShort = id => { const p = PACKAGES.find(x => x.id === id); return p ? p.short : id; };
    const pkgLetter = id => { const i = PACKAGES.findIndex(x => x.id === id); return i >= 0 ? String.fromCharCode(97 + i) : ''; };

    root.innerHTML = `
      <section class="ov-hero">
        <div class="ov-eyebrow">Hoogwan's Lab Notebook · Advanced Packaging</div>
        <h1 class="ov-title">The application sets the demand.<br>The <span class="ov-title-accent">system</span> answers it — from die to package.</h1>
        <p class="ov-lede">A die is designed for what it computes. How it is connected, stacked, powered, cooled and linked to the outside world is decided at the package — and that choice follows the application. This atlas traces that chain.</p>
        <div class="ov-stat-row">
          ${stats.map(s => `<div class="ov-stat"><span class="ov-stat-n">${s.n}</span><span class="ov-stat-l">${s.label}</span></div>`).join('')}
        </div>
      </section>

      ${APPS.length ? `
      <section class="ov-chain">
        <div class="ov-section-title"><b>Fig. 1</b> | Application → structure</div>
        <div class="ov-chain-grid">
          ${APPS.map(a => `
            <div class="ov-chain-row">
              <button class="ov-chain-app" data-view="applications" style="--app:${a.color}">
                <i class="fa-solid ${a.icon}"></i><span>${escapeHtml(a.name)}</span>
              </button>
              <div class="ov-chain-arrow" aria-hidden="true"></div>
              <div class="ov-chain-pkgs">
                ${(a.recommendedPackages || []).map(id => `
                  <button class="ov-chain-pkg" data-pkg="${escapeHtml(id)}"><b>${pkgLetter(id)}</b> ${escapeHtml(pkgShort(id))}</button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </section>` : ''}

      <section class="ov-framework">
        <div class="ov-section-title"><b>Fig. 2</b> | From application to research target</div>
        <div class="ov-framework-strip">
          ${FRAMEWORK.map((f, i) => `
            <div class="ov-framework-step">
              <div class="ov-framework-step-icon"><i class="fa-solid ${f.icon}"></i></div>
              <div class="ov-framework-step-title">${escapeHtml(f.title)}</div>
            </div>
            ${i < FRAMEWORK.length - 1 ? '<div class="ov-framework-arrow"><i class="fa-solid fa-chevron-right"></i></div>' : ''}
          `).join('')}
        </div>
      </section>

      <section class="ov-cards">
        ${SECTION_CARDS.map(c => `
          <button class="ov-card" data-view="${c.view}">
            <div class="ov-card-icon"><i class="fa-solid ${c.icon}"></i></div>
            <h2 class="ov-card-title">${escapeHtml(c.title)}</h2>
            <div class="ov-card-tagline">${escapeHtml(c.tagline)}</div>
            <div class="ov-card-cta">Open <i class="fa-solid fa-arrow-right"></i></div>
          </button>
        `).join('')}
      </section>
    `;

    root.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', () => { if (window.AppNav) window.AppNav.switchView(el.dataset.view); });
    });
    root.querySelectorAll('[data-pkg]').forEach(el => {
      el.addEventListener('click', () => { if (window.AppNav) window.AppNav.goToPackage(el.dataset.pkg); });
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
