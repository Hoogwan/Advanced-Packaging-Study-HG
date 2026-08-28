// Overview ("big picture") landing view — orients a first-time visitor before
// they dive into any of the three detailed views.
(function () {
  'use strict';

  const FRAMEWORK = window.APP_FRAMEWORK || [];

  const SECTION_CARDS = [
    {
      view: 'explorer',
      num: '01',
      title: '3D Explorer',
      tagline: 'Seven packaging architectures, taken apart layer by layer',
      body: 'Rotate, explode, and cross-section seven real packaging architectures — CoWoS, hybrid bonding, fan-out, flip-chip, chiplet + bridge, HBM stacking, and glass substrates — down to individual materials, process steps, and known challenges.',
      cta: 'Open the 3D Explorer →'
    },
    {
      view: 'applications',
      num: '02',
      title: 'Applications',
      tagline: 'Which building block does each application actually need?',
      body: 'AI/HPC, smartphones, 5G/6G, and aerospace each push packaging in a different direction. See the system-level demand, the packaging response, the physical bottleneck, and the open research target for each — then jump straight to the matching 3D structure.',
      cta: 'See the Applications view →'
    },
    {
      view: 'structure',
      num: '03',
      title: 'Structure Map',
      tagline: 'The whole field, as one navigable tree',
      body: 'Fundamentals, package architectures, commercial technology brand names (CoWoS, EMIB, Foveros…), key process technologies, and cross-cutting challenges — organized as a single collapsible map, with links back into the 3D models.',
      cta: 'Browse the Structure Map →'
    }
  ];

  function render() {
    const root = document.getElementById('overview-root');
    if (!root) return;

    root.innerHTML = `
      <section class="ov-hero">
        <div class="ov-eyebrow">An interactive atlas of advanced semiconductor packaging</div>
        <h1 class="ov-title">Why does packaging matter as much as the chip itself?</h1>
        <p class="ov-lede">
          As transistor scaling slows, most of the remaining gains in performance, power, and cost
          come from <em>how dies are connected, stacked, and cooled</em> — not from smaller transistors
          alone. This atlas walks through the physical architectures, the applications that drive them,
          and the underlying technology map, so you can see which packaging structure solves which
          real-world problem.
        </p>
      </section>

      <section class="ov-framework">
        <div class="ov-framework-title">From application need to a measurable research target</div>
        <div class="ov-framework-strip">
          ${FRAMEWORK.map((f, i) => `
            <div class="ov-framework-step">
              <div class="ov-framework-step-num">${String(f.step).padStart(2, '0')}</div>
              <div class="ov-framework-step-title">${escapeHtml(f.title)}</div>
              <div class="ov-framework-step-detail">${escapeHtml(f.detail)}</div>
              ${f.sub ? `<div class="ov-framework-step-sub">${escapeHtml(f.sub)}</div>` : ''}
            </div>
            ${i < FRAMEWORK.length - 1 ? '<div class="ov-framework-arrow">→</div>' : ''}
          `).join('')}
        </div>
        <div class="ov-framework-source">Source: Mahajan et al., Nature Rev. Electr. Eng. 3, 254–263 (2026), pp.258–262.</div>
      </section>

      <section class="ov-cards">
        ${SECTION_CARDS.map(c => `
          <button class="ov-card" data-view="${c.view}">
            <div class="ov-card-num">${c.num}</div>
            <h2 class="ov-card-title">${escapeHtml(c.title)}</h2>
            <div class="ov-card-tagline">${escapeHtml(c.tagline)}</div>
            <p class="ov-card-body">${escapeHtml(c.body)}</p>
            <div class="ov-card-cta">${escapeHtml(c.cta)}</div>
          </button>
        `).join('')}
      </section>

      <div class="ov-hint">drag to rotate · scroll to zoom · click any component to explore its materials, process, and challenges</div>
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
