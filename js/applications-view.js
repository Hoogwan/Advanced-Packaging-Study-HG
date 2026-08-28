// Applications view — per-domain packaging demand / response / bottleneck /
// roadmap, plus the essential/relevant matrix, with jump-to-3D links.
(function () {
  'use strict';

  const APPS = window.APPLICATIONS || [];
  const MATRIX = window.APP_MATRIX || { columns: [], rows: [], legend: {} };
  const PACKAGES = window.PACKAGES || [];

  let activeAppId = APPS.length ? APPS[0].id : null;

  function pkgName(id) {
    const p = PACKAGES.find(p => p.id === id);
    return p ? p.short : id;
  }

  function render() {
    const root = document.getElementById('applications-root');
    if (!root) return;

    root.innerHTML = `
      <header class="av-header">
        <div class="av-eyebrow">Application × Packaging Technology</div>
        <h1 class="av-title">Which application needs which packaging building block?</h1>
        <p class="av-lede">Every application domain pushes packaging in a different direction. Pick a domain below to see
          its system-level demand, the packaging response, the physical bottleneck it runs into, and the open research
          target — then jump straight into the matching 3D structure.</p>
      </header>

      <nav class="av-tabs" id="av-tabs">
        ${APPS.map(a => `
          <button class="av-tab" data-app="${a.id}" style="--app-color:${a.color}">
            <span class="av-tab-dot"></span>${escapeHtml(a.name)}
          </button>
        `).join('')}
      </nav>

      <section class="av-detail" id="av-detail"></section>

      <section class="av-matrix-section">
        <div class="av-matrix-title">Building-block matrix</div>
        <div class="av-matrix-wrap">
          <table class="av-matrix">
            <thead>
              <tr>
                <th class="av-matrix-corner">Packaging building block</th>
                ${MATRIX.columns.map(c => `<th style="--col-color:${c.color}">${escapeHtml(c.name)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${MATRIX.rows.map(row => `
                <tr>
                  <td class="av-matrix-row-label">
                    ${escapeHtml(row.block)}
                    ${row.linkedPackages && row.linkedPackages.length ? `
                      <span class="av-matrix-links">
                        ${row.linkedPackages.map(pid => `<button class="av-matrix-link" data-pkg="${pid}">${escapeHtml(pkgName(pid))} →</button>`).join('')}
                      </span>` : ''}
                  </td>
                  ${MATRIX.columns.map(c => {
                    const level = row.values[c.id] || 'blank';
                    return `<td class="av-cell av-cell-${level}" title="${escapeHtml(MATRIX.legend[level] || level)}">
                      ${level === 'essential' ? '●' : level === 'relevant' ? '○' : ''}
                    </td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="av-legend">
          <span class="av-legend-item"><span class="av-legend-swatch av-cell-essential">●</span> ${escapeHtml(MATRIX.legend.essential || '')}</span>
          <span class="av-legend-item"><span class="av-legend-swatch av-cell-relevant">○</span> ${escapeHtml(MATRIX.legend.relevant || '')}</span>
          <span class="av-legend-item"><span class="av-legend-swatch av-cell-blank"></span> ${escapeHtml(MATRIX.legend.blank || '')}</span>
        </div>
        <div class="av-source">${escapeHtml(MATRIX.source || '')}</div>
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
        <h2 class="av-detail-title">${escapeHtml(app.name)}</h2>
        <div class="av-detail-tagline">${escapeHtml(app.tagline)}</div>
      </div>

      <div class="av-diagram">
        <div class="av-diagram-block">
          <div class="av-diagram-label">${escapeHtml(app.diagram.before.label)}</div>
          <div class="av-diagram-stack">
            ${app.diagram.before.stack.map(s => `<div class="av-diagram-layer">${escapeHtml(s)}</div>`).join('')}
          </div>
          <div class="av-diagram-note">${escapeHtml(app.diagram.before.note)}</div>
        </div>
        <div class="av-diagram-arrow">→</div>
        <div class="av-diagram-block">
          <div class="av-diagram-label">${escapeHtml(app.diagram.after.label)}</div>
          <div class="av-diagram-stack">
            ${app.diagram.after.stack.map(s => `<div class="av-diagram-layer">${escapeHtml(s)}</div>`).join('')}
          </div>
          <div class="av-diagram-note">${escapeHtml(app.diagram.after.note)}</div>
        </div>
      </div>
      <div class="av-diagram-caption">${escapeHtml(app.diagram.caption)}</div>

      <div class="av-quadrants">
        ${renderQuadrant('System demand', app.quadrants.demand, 'demand')}
        ${renderQuadrant('Packaging response', app.quadrants.response, 'response')}
        ${renderQuadrant('Physical bottleneck', app.quadrants.bottleneck, 'bottleneck')}
        ${renderQuadrant('Roadmap / research target', app.quadrants.roadmap, 'roadmap')}
      </div>

      ${app.recommendedPackages && app.recommendedPackages.length ? `
        <div class="av-recommended">
          <div class="av-recommended-title">Recommended packaging structures for this application</div>
          <div class="av-recommended-list">
            ${app.recommendedPackages.map(pid => `
              <button class="av-recommended-btn" data-pkg="${pid}">
                ${escapeHtml(pkgName(pid))} <span class="av-recommended-arrow">↗ view in 3D</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="av-source">${escapeHtml(app.source)}</div>
    `;

    detail.querySelectorAll('.av-recommended-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.AppNav) window.AppNav.goToPackage(btn.dataset.pkg);
      });
    });
  }

  function renderQuadrant(title, items, kind) {
    return `
      <div class="av-quadrant av-quadrant-${kind}">
        <div class="av-quadrant-title">${escapeHtml(title)}</div>
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
