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
    return '#2f5a43';
  }

  const letterOf = id => { const i = PACKAGES.findIndex(p => p.id === id); return i >= 0 ? String.fromCharCode(97 + i) : ''; };
  const countLeaves = n => (n.children && n.children.length) ? n.children.reduce((k, c) => k + countLeaves(c), 0) : 1;

  function render() {
    const root = document.getElementById('structure-root');
    if (!root || !TREE) return;

    root.innerHTML = `
      <section class="pg-lead">
        <div class="ov-kicker">Structure Map</div>
        <h1 class="pg-title">The field, as one map.</h1>
        <p class="pg-lede">Fundamentals, architectures, commercial platforms, key technologies and open challenges — each entry links back to the structure where it lives in 3D.</p>
      </section>
      <div class="sv-layout">
        <aside class="sv-index" id="sv-index"></aside>
        <div class="sv-main">
          <div class="sv-crumbs" id="sv-crumbs"></div>
          <div id="sv-map"></div>
        </div>
      </div>
    `;
    renderIndex();
    renderCrumbs();
    renderMap();
  }

  function go(newPath) { path = newPath; selectedLeafId = null; renderIndex(); renderCrumbs(); renderMap(); }

  function renderIndex() {
    const idx = document.getElementById('sv-index');
    if (!idx) return;
    const top = TREE.children || [];
    const activeTop = path[1] ? path[1].id : null;
    idx.innerHTML = `
      <button class="sv-index-item ${!activeTop ? 'active' : ''}" data-top="">
        <span class="sv-index-n">00</span><span>${escapeHtml(TREE.title)}</span>
      </button>
      ${top.map((n, i) => `
        <button class="sv-index-item ${activeTop === n.id ? 'active' : ''}" data-top="${n.id}">
          <span class="sv-index-n">${String(i + 1).padStart(2, '0')}</span><span>${escapeHtml(n.title)}</span>
          <span class="sv-index-c">${countLeaves(n)}</span>
        </button>`).join('')}
    `;
    idx.querySelectorAll('.sv-index-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const node = btn.dataset.top ? top.find(n => n.id === btn.dataset.top) : null;
        go(node ? [TREE, node] : [TREE]);
      });
    });
  }

  function renderCrumbs() {
    const crumbs = document.getElementById('sv-crumbs');
    if (!crumbs) return;
    crumbs.innerHTML = path.map((n, i) => `
      <button class="sv-crumb ${i === path.length - 1 ? 'active' : ''}" data-idx="${i}">${escapeHtml(n.title)}</button>
      ${i < path.length - 1 ? '<span class="sv-crumb-sep">/</span>' : ''}
    `).join('');
    crumbs.querySelectorAll('.sv-crumb').forEach(btn => {
      btn.addEventListener('click', () => go(path.slice(0, parseInt(btn.dataset.idx, 10) + 1)));
    });
  }

  function jumpButton(link) {
    if (!link) return '';
    const label = link.elementId ? elName(link.packageId, link.elementId) : pkgName(link.packageId);
    return `<button class="ov-chip sv-jump" data-pkg="${link.packageId}" data-el="${link.elementId || ''}"><b>${letterOf(link.packageId)}</b>${escapeHtml(label)}</button>`;
  }

  function renderMap() {
    const map = document.getElementById('sv-map');
    if (!map) return;
    const hub = path[path.length - 1];
    const children = hub.children || [];

    map.innerHTML = `
      <header class="ov-head sv-hub-head">
        <h2>${escapeHtml(hub.title)}</h2>
        ${hub.desc ? `<span class="ov-head-note">${escapeHtml(hub.desc)}</span>` : ''}
      </header>
      ${hub.link ? `<div class="sv-hub-link">${jumpButton(hub.link)}</div>` : ''}
      <div class="sv-list">
        ${children.map((c, i) => {
          const hasKids = c.children && c.children.length;
          const pkgFig = c.link && !c.link.elementId && window.Figure2D
            ? (() => { const p = PACKAGES.find(x => x.id === c.link.packageId); return p ? `<span class="sv-fig">${window.Figure2D.render(p, { width: 200, height: 72, pad: 4 })}</span>` : ''; })()
            : '';
          return `
            <article class="sv-row ${hasKids ? 'is-branch' : ''}" data-id="${c.id}">
              <span class="sv-row-n">${String(i + 1).padStart(2, '0')}</span>
              <div class="sv-row-body">
                <h3>${hasKids ? `<a href="#" class="ov-link sv-open" data-id="${c.id}">${escapeHtml(c.title)}</a>` : escapeHtml(c.title)}</h3>
                ${c.desc ? `<p>${escapeHtml(c.desc)}</p>` : ''}
              </div>
              <div class="sv-row-side">
                ${pkgFig}
                ${hasKids ? `<a href="#" class="sv-more sv-open" data-id="${c.id}">${c.children.length} topics →</a>` : jumpButton(c.link)}
              </div>
            </article>`;
        }).join('')}
        ${!children.length ? '<p class="sv-empty">End of this branch.</p>' : ''}
      </div>
    `;

    map.querySelectorAll('.sv-open').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const node = findNode(TREE, a.dataset.id);
        if (node) go(path.concat([node]));
      });
    });
    map.querySelectorAll('.sv-jump').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (window.AppNav) window.AppNav.goToPackage(btn.dataset.pkg, btn.dataset.el || undefined);
      });
    });
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
