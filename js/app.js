// Main app: tabs, info panel, Supabase-backed papers/notes, owner-gated editing
(function(){
'use strict';

const LASTPKG_KEY = 'advPkg.lastPkg'; // UI-only state, still fine in localStorage
const PACKAGES = window.PACKAGES;

let activePkgIdx = 0;
let activeElementId = null;
let currentEl = null; // the element object currently shown in the info panel

// ============ UI-ONLY STATE (localStorage) ============
function loadLastPkg() {
  const v = parseInt(localStorage.getItem(LASTPKG_KEY), 10);
  return Number.isFinite(v) ? v : 0;
}
function saveLastPkg(idx) {
  localStorage.setItem(LASTPKG_KEY, String(idx));
}

// ============ TABS ============
function renderTabs() {
  const nav = document.getElementById('tabs');
  nav.innerHTML = '';
  PACKAGES.forEach((pkg, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (i === activePkgIdx ? ' active' : '');
    btn.innerHTML = `<span class="tab-num">${String(i+1).padStart(2,'0')}</span><span>${pkg.short}</span>`;
    btn.addEventListener('click', () => switchTab(i));
    nav.appendChild(btn);
  });
}

function switchTab(i) {
  activePkgIdx = i;
  activeElementId = null;
  currentEl = null;
  saveLastPkg(i);
  renderTabs();
  const pkg = PACKAGES[i];
  document.getElementById('view-title').textContent = pkg.name;
  document.getElementById('view-subtitle').textContent = pkg.subtitle;
  window.PkgScene.loadPackage(pkg);
  renderLayerPanel(pkg);
  renderInfoEmpty();
  // Reset sliders
  document.getElementById('explode-slider').value = 0;
  document.getElementById('section-slider').value = 0;
  document.getElementById('explode-value').textContent = '0%';
  document.getElementById('section-value').textContent = 'OFF';
  window.PkgScene.setExplode(0);
  window.PkgScene.setSection(0);
}

// ============ LAYER PANEL ============
function renderLayerPanel(pkg) {
  const panel = document.getElementById('layer-panel');
  panel.innerHTML = `<div class="layer-panel-title">Layers · ${pkg.elements.length}</div>`;
  pkg.elements.forEach(el => {
    const row = document.createElement('label');
    row.className = 'layer-item';
    row.innerHTML = `
      <input type="checkbox" checked data-eid="${el.id}">
      <span class="layer-swatch" style="background:${el.color}"></span>
      <span>${el.name}</span>
    `;
    row.querySelector('input').addEventListener('change', e => {
      window.PkgScene.setLayerVisible(el.id, e.target.checked);
    });
    // click on row (not checkbox) selects the element
    row.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;
      selectElement(el);
    });
    panel.appendChild(row);
  });
}

// ============ INFO PANEL ============
function renderInfoEmpty() {
  const panel = document.getElementById('info-panel');
  panel.classList.add('empty');
  panel.innerHTML = `<div class="info-empty">Click any component in the 3D view to see its technology overview, materials, process, challenges, and related papers.</div>`;
}

function selectElement(el) {
  activeElementId = el.id;
  currentEl = el;
  window.PkgScene.selectElement(el.id);
  renderInfoPanel(el);
}

async function renderInfoPanel(el) {
  const pkg = PACKAGES[activePkgIdx];
  const c = el.content;
  const panel = document.getElementById('info-panel');
  panel.classList.remove('empty');

  // Show a lightweight loading state for the papers/notes section while fetching
  panel.innerHTML = renderStaticSections(pkg, el, c) + `
    <section class="info-section" id="papers-section">
      <div class="section-title">Related Papers</div>
      <div class="paper-list" id="paper-list"><div class="info-loading">Loading…</div></div>
    </section>
    <section class="info-section">
      <div class="section-title">My Notes</div>
      <div class="info-loading">Loading…</div>
    </section>
  `;
  panel.scrollTop = 0;

  const isOwner = window.auth && window.auth.isOwner();

  let userPapers = [];
  let notesBody = '';
  try {
    [userPapers, notesBody] = await Promise.all([
      window.dataStore.listPapers(pkg.id, el.id),
      window.dataStore.getNotes(pkg.id, el.id)
    ]);
  } catch (e) {
    console.error('[app] failed to load papers/notes', e);
  }

  // Guard against tab/selection switch while awaiting
  if (currentEl !== el) return;

  const allPapers = [
    ...(c.papers || []).map(p => ({...p, _baseline:true})),
    ...userPapers.map(p => ({...p, _baseline:false}))
  ];

  const papersSection = document.getElementById('papers-section');
  if (papersSection) {
    papersSection.innerHTML = `
      <div class="section-title">Related Papers <span style="color:var(--ink-soft); font-weight:normal; margin-left:6px;">(${allPapers.length})</span></div>
      <div class="paper-list" id="paper-list">
        ${allPapers.map(p=>renderPaperCard(p, isOwner)).join('')}
      </div>
      ${isOwner ? '<button class="add-paper-toggle" id="add-paper-btn">+ Add paper</button><div id="paper-form-container"></div>' : ''}
    `;
    if (isOwner) {
      document.getElementById('add-paper-btn').addEventListener('click', () => togglePaperForm(el));
    }
    bindPaperDeleteHandlers(el);
  }

  // Notes section (last .info-section)
  const sections = panel.querySelectorAll('.info-section');
  const notesSection = sections[sections.length - 1];
  if (notesSection) {
    if (isOwner) {
      notesSection.innerHTML = `
        <div class="section-title">My Notes</div>
        <textarea class="notes-area" id="notes-area" placeholder="Write your notes, insights, or questions about ${escapeAttr(el.name)} here. Auto-saves as you type.">${escapeHtml(notesBody)}</textarea>
        <div class="notes-status" id="notes-status">${notesBody ? 'Saved' : 'Not saved yet'}</div>
      `;
      const notesEl = document.getElementById('notes-area');
      const statusEl = document.getElementById('notes-status');
      let saveTimer;
      notesEl.addEventListener('input', () => {
        statusEl.textContent = 'Saving...';
        clearTimeout(saveTimer);
        saveTimer = setTimeout(async () => {
          try {
            await window.dataStore.setNotes(pkg.id, el.id, notesEl.value);
            const t = new Date();
            statusEl.textContent = `Saved · ${t.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
          } catch (e) {
            statusEl.textContent = 'Save failed';
            console.error('[app] setNotes failed', e);
          }
        }, 400);
      });
    } else {
      notesSection.innerHTML = `
        <div class="section-title">My Notes</div>
        ${notesBody
          ? `<pre class="notes-readonly">${escapeHtml(notesBody)}</pre>`
          : `<div class="notes-readonly-empty">No notes yet.</div>`}
      `;
    }
  }
}

function renderStaticSections(pkg, el, c) {
  return `
    <div class="info-header">
      <div class="eyebrow">${pkg.name} · Component</div>
      <h2>${el.name}</h2>
      <span class="category-tag">${el.category}</span>
    </div>

    ${c.overview ? `
    <section class="info-section">
      <div class="section-title">Overview</div>
      <p class="overview-text">${c.overview}</p>
    </section>` : ''}

    ${c.keywords && c.keywords.length ? `
    <section class="info-section">
      <div class="section-title">Key Technology Keywords</div>
      <div class="chips">${c.keywords.map(k=>`<span class="chip">${escapeHtml(k)}</span>`).join('')}</div>
    </section>` : ''}

    ${c.materials && c.materials.length ? `
    <section class="info-section">
      <div class="section-title">Materials</div>
      <ul class="material-list">
        ${c.materials.map(m=>`<li><span class="mat-name">${escapeHtml(m.name)}</span><span class="mat-desc">${escapeHtml(m.desc)}</span></li>`).join('')}
      </ul>
    </section>` : ''}

    ${c.process && c.process.length ? `
    <section class="info-section">
      <div class="section-title">Process Flow</div>
      <ol class="process-flow">
        ${c.process.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}
      </ol>
    </section>` : ''}

    ${c.challenges && c.challenges.length ? `
    <section class="info-section">
      <div class="section-title">Key Challenges</div>
      <ul class="challenge-list">
        ${c.challenges.map(ch=>`<li><strong>${escapeHtml(ch.name)}</strong><span>${escapeHtml(ch.desc)}</span></li>`).join('')}
      </ul>
    </section>` : ''}

    ${c.companies && c.companies.length ? `
    <section class="info-section">
      <div class="section-title">Companies · Foundries · Suppliers</div>
      <div class="company-grid">
        ${c.companies.map(co=>`<span class="company-badge">${escapeHtml(co)}</span>`).join('')}
      </div>
    </section>` : ''}
  `;
}

function renderPaperCard(p, isOwner) {
  const canDelete = !p._baseline && isOwner;
  return `
    <div class="paper ${p._baseline ? '' : 'user-added'}" data-id="${p.id != null ? p.id : ''}" data-baseline="${p._baseline ? 1 : 0}">
      <div class="paper-title">${escapeHtml(p.title || 'Untitled')}</div>
      ${p.url ? `<a class="paper-url" href="${escapeAttr(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.url)}</a>` : ''}
      ${p.notes ? `<div class="paper-notes">${escapeHtml(p.notes)}</div>` : ''}
      <div class="paper-actions">
        ${canDelete ? '<button data-action="delete">Delete</button>' : ''}
      </div>
    </div>
  `;
}

function togglePaperForm(el) {
  const container = document.getElementById('paper-form-container');
  if (container.querySelector('form')) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = `
    <form class="paper-add-form">
      <input type="text" name="title" placeholder="Paper title (required)" required>
      <input type="text" name="url" placeholder="DOI or URL (optional)">
      <textarea name="notes" placeholder="Abstract / your notes (optional)"></textarea>
      <div class="form-actions">
        <button type="button" class="btn-secondary" id="cancel-paper">Cancel</button>
        <button type="submit" class="btn-primary">Add Paper</button>
      </div>
    </form>
  `;
  const form = container.querySelector('form');
  form.querySelector('#cancel-paper').addEventListener('click', () => container.innerHTML = '');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
    const fd = new FormData(form);
    const pkg = PACKAGES[activePkgIdx];
    try {
      await window.dataStore.addPaper(pkg.id, el.id, {
        title: fd.get('title').trim(),
        url: fd.get('url').trim(),
        notes: fd.get('notes').trim()
      });
      container.innerHTML = '';
      renderInfoPanel(el);
    } catch (err) {
      console.error('[app] addPaper failed', err);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Paper';
      alert('Failed to add paper. Are you logged in as the owner?');
    }
  });
  form.querySelector('input[name="title"]').focus();
}

function bindPaperDeleteHandlers(el) {
  document.querySelectorAll('#paper-list .paper[data-baseline="0"] [data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const card = e.target.closest('.paper');
      const id = card.dataset.id;
      if (!id) return;
      btn.disabled = true;
      try {
        await window.dataStore.deletePaper(id);
        renderInfoPanel(el);
      } catch (err) {
        console.error('[app] deletePaper failed', err);
        btn.disabled = false;
        alert('Failed to delete paper. Are you logged in as the owner?');
      }
    });
  });
}

// ============ HELPERS ============
function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}
function escapeAttr(s) { return escapeHtml(s); }

// ============ CONTROLS BINDING ============
function bindControls() {
  const explodeSlider = document.getElementById('explode-slider');
  const explodeVal = document.getElementById('explode-value');
  explodeSlider.addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    window.PkgScene.setExplode(v);
    explodeVal.textContent = Math.round(v*100) + '%';
  });

  const sectionSlider = document.getElementById('section-slider');
  const sectionVal = document.getElementById('section-value');
  sectionSlider.addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    window.PkgScene.setSection(v);
    sectionVal.textContent = v > 0.01 ? Math.round(v*100) + '%' : 'OFF';
  });

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.PkgScene.frameCamera(btn.dataset.preset);
    });
  });
}

// ============ TOP-LEVEL VIEW SWITCHING ============
const VIEWS = ['overview', 'explorer', 'applications', 'structure', 'sketchboard'];
const LASTVIEW_KEY = 'advPkg.lastView';
let activeView = 'overview';
let explorerScenePrimed = false; // Three.js scene is only init'd once, lazily, on first explorer visit

function switchView(viewName, opts) {
  opts = opts || {};
  if (VIEWS.indexOf(viewName) === -1) viewName = 'overview';
  activeView = viewName;
  try { localStorage.setItem(LASTVIEW_KEY, viewName); } catch (e) {}

  VIEWS.forEach(v => {
    const sec = document.getElementById('view-' + v);
    if (sec) sec.classList.toggle('active', v === viewName);
  });
  document.querySelectorAll('.view-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  if (viewName === 'explorer') {
    ensureExplorerReady();
    // Canvas was possibly hidden (display:none) while resizing/measuring — fix size now.
    requestAnimationFrame(() => { if (window.PkgScene) window.PkgScene.resize(); });
  }
  if (viewName === 'sketchboard') {
    // Canvas was possibly hidden (display:none) while resizing/measuring — fix size now.
    requestAnimationFrame(() => { if (window.SketchboardView) window.SketchboardView.resize(); });
  }
  if (!opts.silent) window.scrollTo(0, 0);
}

function ensureExplorerReady() {
  if (explorerScenePrimed) return;
  explorerScenePrimed = true;

  renderTabs();

  window.PkgScene.init(document.getElementById('three-canvas'), {
    labelsRoot: document.getElementById('label-overlay'),
    onSelect: (el) => {
      if (el) selectElement(el);
      else { activeElementId = null; currentEl = null; renderInfoEmpty(); }
    },
    onHover: (el, x, y) => {
      const tip = document.getElementById('hover-tip');
      if (el) {
        tip.textContent = el.name;
        tip.style.display = 'block';
        tip.style.left = (x + 12) + 'px';
        tip.style.top = (y + 12) + 'px';
      } else {
        tip.style.display = 'none';
      }
    }
  });

  bindControls();

  const pkg = PACKAGES[activePkgIdx];
  document.getElementById('view-title').textContent = pkg.name;
  document.getElementById('view-subtitle').textContent = pkg.subtitle;
  window.PkgScene.loadPackage(pkg);
  renderLayerPanel(pkg);
  renderInfoEmpty();

  // Re-render the info panel (to show/hide owner-only controls) whenever auth state changes
  if (window.auth) {
    window.auth.onAuthChange(() => {
      if (currentEl) renderInfoPanel(currentEl);
    });
  }

  // Hide loading
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';
}

// Jump into the 3D Explorer at a specific package (and optionally a specific
// element within it), from the Applications or Structure Map views.
function goToPackage(packageId, elementId) {
  const idx = PACKAGES.findIndex(p => p.id === packageId);
  if (idx === -1) { console.warn('[app] goToPackage: unknown packageId', packageId); return; }

  switchView('explorer');
  ensureExplorerReady();

  if (idx !== activePkgIdx) {
    switchTab(idx);
  }

  if (elementId) {
    // Wait a tick for loadPackage()/scene rebuild to finish before selecting.
    requestAnimationFrame(() => {
      const pkg = PACKAGES[idx];
      const el = pkg.elements.find(e => e.id === elementId);
      if (el) selectElement(el);
    });
  }
}

window.AppNav = {
  switchView,
  goToPackage,
  getActiveView: () => activeView,
  listPackages: () => PACKAGES.map(p => ({ id: p.id, name: p.name, short: p.short }))
};

// ============ INIT ============
function init() {
  // Restore last-viewed package (UI-only state, kept in localStorage)
  activePkgIdx = loadLastPkg();
  if (!(activePkgIdx >= 0 && activePkgIdx < PACKAGES.length)) activePkgIdx = 0;

  // Top nav wiring
  document.querySelectorAll('.view-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Restore last top-level view (defaults to Overview on first-ever visit)
  let startView = 'overview';
  try {
    const saved = localStorage.getItem(LASTVIEW_KEY);
    if (saved && VIEWS.indexOf(saved) !== -1) startView = saved;
  } catch (e) {}
  switchView(startView, { silent: true });

  // Loading overlay only matters for the 3D explorer; hide it immediately
  // if we're not landing there so the Overview isn't blocked.
  if (startView !== 'explorer') {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
})();
