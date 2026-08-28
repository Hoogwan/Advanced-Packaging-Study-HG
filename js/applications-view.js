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

  function render() {
    const root = document.getElementById('applications-root');
    if (!root) return;

    root.innerHTML = `
      <header class="av-header">
        <div class="av-header-icon"><i class="fa-solid fa-satellite-dish"></i></div>
        <h1 class="av-title">One package, four different jobs</h1>
      </header>

      <nav class="av-tabs" id="av-tabs">
        ${APPS.map(a => `
          <button class="av-tab" data-app="${a.id}" style="--app-color:${a.color}">
            <i class="fa-solid ${a.icon}"></i><span>${escapeHtml(a.name)}</span>
          </button>
        `).join('')}
      </nav>

      <section class="av-detail" id="av-detail"></section>

      <section class="av-matrix-section">
        <div class="av-matrix-title"><i class="fa-solid fa-table-cells"></i> Building-block matrix</div>
        <div class="av-matrix-wrap">
          <table class="av-matrix">
            <thead>
              <tr>
                <th class="av-matrix-corner"></th>
                ${MATRIX.columns.map(c => `<th style="--col-color:${c.color}"><i class="fa-solid ${c.icon}"></i><span>${escapeHtml(c.name)}</span></th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${MATRIX.rows.map(row => `
                <tr>
                  <td class="av-matrix-row-label">
                    ${escapeHtml(row.block)}
                    ${row.linkedPackages && row.linkedPackages.length ? `
                      <span class="av-matrix-links">
                        ${row.linkedPackages.map(pid => `<button class="av-matrix-link" data-pkg="${pid}">${escapeHtml(pkgName(pid))} <i class="fa-solid fa-arrow-up-right-from-square"></i></button>`).join('')}
                      </span>` : ''}
                  </td>
                  ${MATRIX.columns.map(c => {
                    const level = row.values[c.id] || 'blank';
                    return `<td class="av-cell av-cell-${level}" title="${escapeHtml(MATRIX.legend[level] || level)}">
                      ${level === 'essential' ? '<i class="fa-solid fa-circle"></i>' : level === 'relevant' ? '<i class="fa-regular fa-circle"></i>' : ''}
                    </td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="av-legend">
          <span class="av-legend-item"><span class="av-legend-swatch av-cell-essential"><i class="fa-solid fa-circle"></i></span> ${escapeHtml(MATRIX.legend.essential || '')}</span>
          <span class="av-legend-item"><span class="av-legend-swatch av-cell-relevant"><i class="fa-regular fa-circle"></i></span> ${escapeHtml(MATRIX.legend.relevant || '')}</span>
          <span class="av-legend-item"><span class="av-legend-swatch av-cell-blank"></span> ${escapeHtml(MATRIX.legend.blank || '')}</span>
        </div>
      </section>
    `;

    document.querySelectorAll('.av-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeAppId = btn.dataset.app;
        renderTabs();
        renderDetail();
      });
    });
    document.querySelectorAll('.av-matrix-link').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.AppNav) window.AppNav.goToPackage(btn.dataset.pkg);
      });
    });

    renderTabs();
    renderDetail();
  }

  function renderTabs() {
    document.querySelectorAll('.av-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.app === activeAppId);
    });
  }

  function renderDetail() {
    const detail = document.getElementById('av-detail');
    if (!detail) return;
    const app = APPS.find(a => a.id === activeAppId);
    if (!app) { detail.innerHTML = ''; return; }

    detail.style.setProperty('--app-color', app.color);
    detail.innerHTML = `
      <div class="av-detail-head">
        <div class="av-detail-icon"><i class="fa-solid ${app.icon}"></i></div>
        <div>
          <h2 class="av-detail-title">${escapeHtml(app.name)}</h2>
          <div class="av-detail-tagline">${escapeHtml(app.tagline)}</div>
        </div>
      </div>

      <div class="av-diagram">
        <div class="av-diagram-block">
          <div class="av-diagram-label">${escapeHtml(app.diagram.from.label)}</div>
          <div class="av-diagram-chips">
            ${app.diagram.from.chips.map(s => `<div class="av-diagram-chip">${escapeHtml(s)}</div>`).join('')}
          </div>
        </div>
        <div class="av-diagram-arrow"><i class="fa-solid fa-arrow-right-long"></i></div>
        <div class="av-diagram-block av-diagram-block-to">
          <div class="av-diagram-label">${escapeHtml(app.diagram.to.label)}</div>
          <div class="av-diagram-chips">
            ${app.diagram.to.chips.map(s => `<div class="av-diagram-chip">${escapeHtml(s)}</div>`).join('')}
          </div>
        </div>
      </div>

      <div class="av-quadrants">
        ${renderQuadrant(app.quadrants.demand, 'demand')}
        ${renderQuadrant(app.quadrants.response, 'response')}
        ${renderQuadrant(app.quadrants.bottleneck, 'bottleneck')}
        ${renderQuadrant(app.quadrants.roadmap, 'roadmap')}
      </div>

      ${app.recommendedPackages && app.recommendedPackages.length ? `
        <div class="av-recommended">
          <div class="av-recommended-title"><i class="fa-solid fa-cube"></i> View in 3D</div>
          <div class="av-recommended-list">
            ${app.recommendedPackages.map(pid => `
              <button class="av-recommended-btn" data-pkg="${pid}">
                ${escapeHtml(pkgName(pid))} <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    detail.querySelectorAll('.av-recommended-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.AppNav) window.AppNav.goToPackage(btn.dataset.pkg);
      });
    });
  }

  function renderQuadrant(items, kind) {
    const meta = QUADRANT_META[kind];
    return `
      <div class="av-quadrant av-quadrant-${kind}">
        <div class="av-quadrant-title"><i class="fa-solid ${meta.icon}"></i> ${escapeHtml(meta.title)}</div>
        <ul class="av-quadrant-list">
          ${(items || []).map(it => `<li>${escapeHtml(it)}</li>`).join('')}
        </ul>
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
