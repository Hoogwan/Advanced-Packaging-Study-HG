// Overview ("big picture") landing view — icon/graphic-forward, minimal text.
(function () {
  'use strict';

  const FRAMEWORK = window.APP_FRAMEWORK || [];

  const SECTION_CARDS = [
    { view: 'explorer', icon: 'fa-cube', title: '3D Explorer', tagline: '7 architectures, taken apart layer by layer' },
    { view: 'applications', icon: 'fa-satellite-dish', title: 'Applications', tagline: 'Which block does each application need?' },
    { view: 'structure', icon: 'fa-diagram-project', title: 'Structure Map', tagline: 'The whole field as one visual map' }
  ];

  const STAT_CHIPS = [
    { icon: 'fa-layer-group', label: '7 architectures' },
    { icon: 'fa-industry', label: '4 foundry platforms' },
    { icon: 'fa-satellite-dish', label: '4 applications' },
    { icon: 'fa-triangle-exclamation', label: '8 challenges' }
  ];

  function render() {
    const root = document.getElementById('overview-root');
    if (!root) return;

    root.innerHTML = `
      <section class="ov-hero">
        <div class="ov-hero-icon"><i class="fa-solid fa-microchip"></i></div>
        <div class="ov-eyebrow">An interactive atlas</div>
        <h1 class="ov-title">The chip stopped scaling.<br>The <span class="ov-title-accent">package</span> took over.</h1>
        <p class="ov-lede">How dies are connected, stacked, and cooled now matters as much as the transistors inside them.</p>
        <div class="ov-stat-row">
          ${STAT_CHIPS.map(s => `
            <div class="ov-stat-chip"><i class="fa-solid ${s.icon}"></i><span>${escapeHtml(s.label)}</span></div>
          `).join('')}
        </div>
      </section>

      <section class="ov-framework">
        <div class="ov-framework-title"><i class="fa-solid fa-route"></i> Application → research target</div>
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
        ${SECTION_CARDS.map((c, i) => `
          <button class="ov-card" data-view="${c.view}">
            <div class="ov-card-icon"><i class="fa-solid ${c.icon}"></i></div>
            <h2 class="ov-card-title">${escapeHtml(c.title)}</h2>
            <div class="ov-card-tagline">${escapeHtml(c.tagline)}</div>
            <div class="ov-card-cta">Explore <i class="fa-solid fa-arrow-right"></i></div>
          </button>
        `).join('')}
      </section>

      <div class="ov-hint"><i class="fa-solid fa-hand-pointer"></i> drag to rotate · scroll to zoom · click any component</div>
    `;

    root.querySelectorAll('.ov-card').forEach(card => {
      card.addEventListener('click', () => {
        if (window.AppNav) window.AppNav.switchView(card.dataset.view);
      });
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
