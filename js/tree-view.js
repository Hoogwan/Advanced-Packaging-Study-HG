// Structure Map — a collapsible knowledge tree of the whole Advanced
// Packaging field, with a detail panel and jump-to-3D links.
(function () {
  'use strict';

  const TREE = window.STRUCTURE_TREE;
  const PACKAGES = window.PACKAGES || [];

  let selectedNode = null;
  let expanded = new Set(); // node ids currently expanded

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

  function render() {
    const root = document.getElementById('structure-root');
    if (!root || !TREE) return;

    // Expand the 5 top-level branches by default so the shape of the tree is
    // visible immediately; deeper levels start collapsed.
    (TREE.children || []).forEach(c => expanded.add(c.id));

    root.innerHTML = `
      <header class="sv-header">
        <div class="sv-eyebrow">Structure Map</div>
        <h1 class="sv-title">Advanced Packaging — the whole field as one tree</h1>
        <p class="sv-lede">Click any branch to expand it, and any node to see its explanation. Nodes with a
          <span class="sv-link-hint">↗ 3D</span> tag link straight into the matching structure in the 3D Explorer.</p>
      </header>

      <div class="sv-body">
        <div class="sv-tree-col">
          <div class="sv-tree-actions">
            <button class="sv-mini-btn" id="sv-expand-all">Expand all</button>
            <button class="sv-mini-btn" id="sv-collapse-all">Collapse all</button>
          </div>
          <div class="sv-tree" id="sv-tree"></div>
        </div>
        <aside class="sv-detail-col" id="sv-detail"></aside>
      </div>
    `;

    document.getElementById('sv-expand-all').addEventListener('click', () => {
      collectAllIds(TREE).forEach(id => expanded.add(id));
      renderTree();
    });
    document.getElementById('sv-collapse-all').addEventListener('click', () => {
      expanded.clear();
      renderTree();
    });

    renderTree();
    renderDetail(TREE); // show root description initially
  }

  function collectAllIds(node) {
    let ids = [];
    if (node.children) {
      node.children.forEach(c => {
        ids.push(c.id);
        ids = ids.concat(collectAllIds(c));
      });
    }
    return ids;
  }

  function renderTree() {
    const container = document.getElementById('sv-tree');
    if (!container) return;
    container.innerHTML = buildNodeHtml(TREE, 0, true);
    bindTreeEvents(container);
  }

  function buildNodeHtml(node, depth, isRoot) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id) || isRoot;
    const isSelected = selectedNode === node;
    const hasLink = !!node.link;

    let html = `
      <div class="sv-node" style="--depth:${depth}">
        <div class="sv-node-row ${isSelected ? 'selected' : ''} ${isRoot ? 'sv-node-root' : ''}" data-id="${node.id}">
          ${hasChildren ? `<button class="sv-toggle ${isExpanded ? 'open' : ''}" data-toggle="${node.id}">${isExpanded ? '−' : '+'}</button>` : '<span class="sv-toggle-spacer"></span>'}
          <span class="sv-node-title">${escapeHtml(node.title)}</span>
          ${hasLink ? '<span class="sv-node-3d-badge">↗ 3D</span>' : ''}
        </div>
    `;
    if (hasChildren && isExpanded) {
      html += `<div class="sv-children">${node.children.map(c => buildNodeHtml(c, depth + 1, false)).join('')}</div>`;
    }
    html += `</div>`;
    return html;
  }

  function bindTreeEvents(container) {
    container.querySelectorAll('.sv-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.toggle;
        if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
        renderTree();
      });
    });
    container.querySelectorAll('.sv-node-row').forEach(row => {
      row.addEventListener('click', () => {
        const node = findNode(TREE, row.dataset.id);
        if (node) {
          selectedNode = node;
          renderTree();
          renderDetail(node);
        }
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

  function renderDetail(node) {
    const detail = document.getElementById('sv-detail');
    if (!detail) return;

    const crumbs = findPath(TREE, node.id) || [TREE];

    detail.innerHTML = `
      <div class="sv-crumbs">${crumbs.map(n => escapeHtml(n.title)).join(' / ')}</div>
      <h2 class="sv-detail-title">${escapeHtml(node.title)}</h2>
      ${node.desc ? `<p class="sv-detail-desc">${escapeHtml(node.desc)}</p>` : '<p class="sv-detail-desc sv-detail-desc-empty">A category node — expand it to see the items inside.</p>'}
      ${node.link ? `
        <button class="sv-jump-btn" id="sv-jump-btn">
          Open in 3D Explorer: ${escapeHtml(pkgName(node.link.packageId))}${node.link.elementId ? ' → ' + escapeHtml(elName(node.link.packageId, node.link.elementId)) : ''} ↗
        </button>
      ` : ''}
      ${node.children && node.children.length ? `
        <div class="sv-detail-children-title">Contains</div>
        <ul class="sv-detail-children">
          ${node.children.map(c => `<li data-id="${c.id}">${escapeHtml(c.title)}</li>`).join('')}
        </ul>
      ` : ''}
    `;

    const jumpBtn = document.getElementById('sv-jump-btn');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        if (window.AppNav && node.link) {
          window.AppNav.goToPackage(node.link.packageId, node.link.elementId);
        }
      });
    }
    detail.querySelectorAll('.sv-detail-children li').forEach(li => {
      li.addEventListener('click', () => {
        const child = findNode(TREE, li.dataset.id);
        if (child) {
          selectedNode = child;
          expanded.add(node.id);
          renderTree();
          renderDetail(child);
        }
      });
    });
  }

  function findPath(node, targetId, path) {
    path = path || [];
    const nextPath = path.concat([node]);
    if (node.id === targetId) return nextPath;
    if (node.children) {
      for (const c of node.children) {
        const found = findPath(c, targetId, nextPath);
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
