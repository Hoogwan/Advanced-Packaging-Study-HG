// Structure Map — a hub-and-spoke, drill-down mind-map / org-chart of the
// whole Advanced Packaging field, with jump-to-3D links.
(function () {
  'use strict';

  const TREE = window.STRUCTURE_TREE;
  const PACKAGES = window.PACKAGES || [];

  // path: array of nodes from root to the current "hub" (last item = hub)
  let path = TREE ? [TREE] : [];
  let selectedLeafId = null; // a leaf child currently shown expanded inline

  function pkgName(id) {
    const p = PACKAGES.find(p => p.id === id);
    return p ? p.short : id;
  }
  function elName(packageId, elementId) {
    const p = PACKAGES.find(p => p.id === packageId);
    if (!p) return elementId;
    const el = (p.elements || []).find(e => e.id === elementId);
    return el ? el.name : elementId;
  }

  function currentColor() {
    for (let i = path.length - 1; i >= 0; i--) {
      if (path[i].color) return path[i].color;
    }
    return '#7a2e1f';
  }

  function render() {
    const root = document.getElementById('structure-root');
    if (!root || !TREE) return;

    root.innerHTML = `
      <header class="sv-header">
        <div class="sv-header-icon"><i class="fa-solid fa-diagram-project"></i></div>
        <h1 class="sv-title">The field, as one map</h1>
      </header>
      <div class="sv-crumbs" id="sv-crumbs"></div>
      <div class="sv-map" id="sv-map"></div>
    `;

    renderCrumbs();
    renderMap();
  }

  function renderCrumbs() {
    const crumbs = document.getElementById('sv-crumbs');
    if (!crumbs) return;
    crumbs.innerHTML = path.map((n, i) => `
      <button class="sv-crumb ${i === path.length - 1 ? 'active' : ''}" data-idx="${i}">
        ${n.icon ? `<i class="fa-solid ${n.icon}"></i>` : ''}${escapeHtml(n.title)}
      </button>
      ${i < path.length - 1 ? '<i class="fa-solid fa-chevron-right sv-crumb-sep"></i>' : ''}
    `).join('');

    crumbs.querySelectorAll('.sv-crumb').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        path = path.slice(0, idx + 1);
        selectedLeafId = null;
        renderCrumbs();
        renderMap();
      });
    });
  }

  function renderMap() {
    const map = document.getElementById('sv-map');
    if (!map) return;
    const hub = path[path.length - 1];
    const color = currentColor();
    const children = hub.children || [];

    map.style.setProperty('--hub-color', color);

    let html = `
      <div class="sv-hub-row">
        <div class="sv-hub-card" style="--hub-color:${color}">
          <div class="sv-hub-icon"><i class="fa-solid ${hub.icon || 'fa-circle'}"></i></div>
          <div class="sv-hub-title">${escapeHtml(hub.title)}</div>
          ${hub.desc ? `<div class="sv-hub-desc">${escapeHtml(hub.desc)}</div>` : ''}
          ${hub.link ? `<button class="sv-hub-jump" data-pkg="${hub.link.packageId}" data-el="${hub.link.elementId || ''}"><i class="fa-solid fa-cube"></i> View in 3D</button>` : ''}
        </div>
      </div>
    `;

    if (children.length) {
      html += `
        <div class="sv-connector"></div>
        <div class="sv-children-grid" style="--n:${Math.min(children.length, 4)}">
          ${children.map(c => renderChildCard(c, color)).join('')}
        </div>
      `;
    } else if (!hub.link) {
      html += `<div class="sv-empty-note"><i class="fa-solid fa-circle-info"></i> End of this branch</div>`;
    }

    map.innerHTML = html;

    map.querySelectorAll('.sv-child-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.sv-child-jump')) return;
        const node = findNode(TREE, card.dataset.id);
        if (!node) return;
        if (node.children && node.children.length) {
          path.push(node);
          selectedLeafId = null;
          renderCrumbs();
          renderMap();
        } else {
          selectedLeafId = selectedLeafId === node.id ? null : node.id;
          renderMap();
        }
      });
    });
    map.querySelectorAll('.sv-child-jump, .sv-hub-jump').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pkg = btn.dataset.pkg;
        const el = btn.dataset.el;
        if (window.AppNav && pkg) window.AppNav.goToPackage(pkg, el || undefined);
      });
    });
  }

  function renderChildCard(node, parentColor) {
    const hasChildren = node.children && node.children.length > 0;
    const hasLink = !!node.link;
    const isOpen = selectedLeafId === node.id;
    const color = node.color || parentColor;
    return `
      <div class="sv-child-card ${isOpen ? 'open' : ''} ${hasChildren ? 'has-children' : ''}" data-id="${node.id}" style="--card-color:${color}">
        <div class="sv-child-icon"><i class="fa-solid ${node.icon || 'fa-circle'}"></i></div>
        <div class="sv-child-title">${escapeHtml(node.title)}</div>
        ${hasChildren ? `<div class="sv-child-count">${node.children.length}</div>` : ''}
        ${hasLink && !hasChildren ? '<div class="sv-child-3d-badge"><i class="fa-solid fa-cube"></i></div>' : ''}
        ${isOpen && !hasChildren ? `
          <div class="sv-child-detail">
            ${node.desc ? `<p>${escapeHtml(node.desc)}</p>` : ''}
            ${hasLink ? `
              <button class="sv-child-jump" data-pkg="${node.link.packageId}" data-el="${node.link.elementId || ''}">
                <i class="fa-solid fa-cube"></i> ${escapeHtml(pkgName(node.link.packageId))}${node.link.elementId ? ' · ' + escapeHtml(elName(node.link.packageId, node.link.elementId)) : ''}
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  function findNode(node, id) {
    if (node.id === id) return node;
    if (node.children) {
      for (const c of node.children) {
        const found = findNode(c, id);
        if (found) return found;
      }
    }
    return null;
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
