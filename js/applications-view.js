// Applications view — icon-based dashboard: per-domain demand / response /
// bottleneck / roadmap, plus the essential/relevant matrix, with jump-to-3D links.
(function () {
  'use strict';

  const APPS = window.APPLICATIONS || [];
  const MATRIX = window.APP_MATRIX || { columns: [], rows: [], legend: {} };
  const PACKAGES = window.PACKAGES || [];

  let activeAppId = APPS.length ? APPS[0].id : null;

  const QUADRANT_META = {
    demand:     { title: 'Demand',    icon: 'fa-arrow-trend-up' },
    response:   { title: 'Response',  icon: 'fa-shield-halved' },
    bottleneck: { title: 'Bottleneck', icon: 'fa-triangle-exclamation' },
    roadmap:    { title: 'Roadmap',   icon: 'fa-flag-checkered' }
  };

  function pkgName(id) {
    const p = PACKAGES.find(p => p.id === id);
    return p ? p.short : id;
  }

  const letterOf = id => { const i = PACKAGES.findIndex(p => p.id === id); return i >= 0 ? String.fromCharCode(97 + i) : ''; };
  const fig = (id, w, h) => {
    const p = PACKAGES.find(x => x.id === id);
    return p && window.Figure2D ? window.Figure2D.render(p, { width: w, height: h, pad: 8 }) : '';
  };

  function render() {
    const root = document.getElementById('applications-root');
    if (!root) return;

    root.innerHTML = `
      <section class="pg-lead">
        <div class="ov-kicker">Applications</div>
        <h1 class="pg-title">One package, four different jobs.</h1>
        <p class="pg-lede">Each application pulls the package in a different direction. Pick one to see what it demands, how packaging responds, and which structures answer it.</p>
      </section>

      <nav class="av-switch" id="av-tabs" role="tablist">
        ${APPS.map((a, i) => `
          <button class="av-switch-btn" role="tab" data-app="${a.id}">
            <span class="av-switch-n">${String(i + 1).padStart(2, '0')}</span>
            <span class="av-switch-name">${escapeHtml(a.name)}</span>
            <span class="av-switch-tag">${escapeHtml(a.tagline || '')}</span>
          </button>
        `).join('')}
      </nav>

      <div id="av-detail"></div>

      <section class="ov-section">
        <header class="ov-head"><span class="ov-head-n">02</span><h2>Building blocks × applications</h2><span class="ov-head-note">● ${escapeHtml(MATRIX.legend.essential || '')} &nbsp; ○ ${escapeHtml(MATRIX.legend.relevant || '')}</span></header>
        <div class="av-table-wrap">
          <table class="av-table">
            <thead><tr><th></th>${MATRIX.columns.map(c => `<th>${escapeHtml(c.name)}</th>`).join('')}</tr></thead>
            <tbody>
              ${MATRIX.rows.map(row => `
                <tr>
                  <td class="av-table-block">
                    <span>${escapeHtml(row.block)}</span>
                    ${(row.linkedPackages || []).length ? `<span class="av-table-links">${row.linkedPackages.filter((v, i, a) => a.indexOf(v) === i).map(pid => `<button class="ov-chip" data-pkg="${pid}"><b>${letterOf(pid)}</b>${escapeHtml(pkgName(pid))}</button>`).join('')}</span>` : ''}
                  </td>
                  ${MATRIX.columns.map(c => {
                    const level = row.values[c.id] || 'blank';
                    return `<td class="av-dot av-dot-${level}" title="${escapeHtml(MATRIX.legend[level] || level)}">${level === 'essential' ? '●' : level === 'relevant' ? '○' : '·'}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;

    root.querySelectorAll('.av-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => { activeAppId = btn.dataset.app; renderTabs(); renderDetail(); });
    });
    root.querySelectorAll('.av-table [data-pkg]').forEach(btn => {
      btn.addEventListener('click', () => { if (window.AppNav) window.AppNav.goToPackage(btn.dataset.pkg); });
    });
    renderTabs();
    renderDetail();
  }

  function renderTabs() {
    document.querySelectorAll('.av-switch-btn').forEach(btn => {
      const on = btn.dataset.app === activeAppId;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function renderDetail() {
    const detail = document.getElementById('av-detail');
    if (!detail) return;
    const app = APPS.find(a => a.id === activeAppId);
    if (!app) { detail.innerHTML = ''; return; }
    const recs = (app.recommendedPackages || []).filter(id => PACKAGES.some(p => p.id === id));

    detail.innerHTML = `
      <section class="av-hero">
        <div class="av-hero-text">
          <h2 class="av-hero-name">${escapeHtml(app.name)}</h2>
          <p class="av-hero-tag">${escapeHtml(app.tagline)}</p>
          <div class="av-shift">
            <div class="av-shift-col">
              <div class="av-shift-label">${escapeHtml(app.diagram.from.label)}</div>
              ${app.diagram.from.chips.map(s => `<div class="av-shift-item">${escapeHtml(s)}</div>`).join('')}
            </div>
            <div class="av-shift-arrow" aria-hidden="true">→</div>
            <div class="av-shift-col to">
              <div class="av-shift-label">${escapeHtml(app.diagram.to.label)}</div>
              ${app.diagram.to.chips.map(s => `<div class="av-shift-item">${escapeHtml(s)}</div>`).join('')}
            </div>
          </div>
        </div>
        <div class="av-stage">
          <div class="av-stage-title">Structures that answer it</div>
          ${recs.map(id => `
            <button class="av-stage-item" data-pkg="${id}">
              <span class="av-stage-fig">${fig(id, 420, 120)}</span>
              <span class="av-stage-cap"><b>${letterOf(id)}</b>${escapeHtml(pkgName(id))}<i>Open in 3D →</i></span>
            </button>`).join('')}
        </div>
      </section>

      <section class="ov-section">
        <header class="ov-head"><span class="ov-head-n">01</span><h2>From demand to roadmap</h2></header>
        <div class="av-four">
          ${renderQuadrant(app.quadrants.demand, 'demand')}
          ${renderQuadrant(app.quadrants.response, 'response')}
          ${renderQuadrant(app.quadrants.bottleneck, 'bottleneck')}
          ${renderQuadrant(app.quadrants.roadmap, 'roadmap')}
        </div>
      </section>
    `;

    detail.querySelectorAll('[data-pkg]').forEach(btn => {
      btn.addEventListener('click', () => { if (window.AppNav) window.AppNav.goToPackage(btn.dataset.pkg); });
    });
  }

  function renderQuadrant(items, kind) {
    const meta = QUADRANT_META[kind];
    return `
      <div class="av-q">
        <div class="av-q-title">${escapeHtml(meta.title)}</div>
        <ul>${(items || []).map(it => `<li>${escapeHtml(it)}</li>`).join('')}</ul>
      </div>
    `;
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
