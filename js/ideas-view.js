// Ideas view — Hoogwan's own concepts, laid out like figure plates.
(function () {
  'use strict';

  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Front view of the related 3D structure (same drawing as the Overview).
  function figureFor(it) {
    const id = it.relatesTo && it.relatesTo.packageId;
    const pkg = (window.PACKAGES || []).find(p => p.id === id);
    return pkg && window.Figure2D ? window.Figure2D.render(pkg, { width: 480, height: 300, pad: 14 }) : '';
  }

  function render() {
    const root = document.getElementById('ideas-root');
    if (!root) return;
    const ideas = window.IDEAS || [];

    const plates = ideas.length
      ? ideas.map((it, i) => `
        <article class="idea-plate">
          ${it.image ? `<a class="idea-figure" href="${esc(it.image)}" target="_blank" rel="noopener">
            <img src="${esc(it.image)}" alt="${esc(it.title)}" loading="lazy">
          </a>` : `<div class="idea-figure idea-figure-2d">${figureFor(it)}</div>`}
          <div class="idea-caption">
            <div class="idea-fig"><b>Idea ${i + 1}</b>${it.date ? ` · ${esc(it.date)}` : ''}</div>
            <h2 class="idea-title">${esc(it.title)}</h2>
            ${it.summary ? `<p class="idea-summary">${esc(it.summary)}</p>` : ''}
            ${it.tags && it.tags.length ? `<div class="idea-tags">${it.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
            ${it.relatesTo ? `<button class="idea-link" data-pkg="${esc(it.relatesTo.packageId)}" data-el="${esc(it.relatesTo.elementId || '')}">View in 3D <i class="fa-solid fa-arrow-right"></i></button>` : ''}
          </div>
        </article>`).join('')
      : [1, 2, 3].map(n => `
        <article class="idea-plate idea-plate-empty" aria-hidden="true">
          <div class="idea-figure"><span>Idea ${n}</span></div>
          <div class="idea-caption">
            <div class="idea-fig"><b>Idea ${n}</b> · forthcoming</div>
            <div class="idea-line"></div><div class="idea-line short"></div>
          </div>
        </article>`).join('');

    root.innerHTML = `
      <header class="ideas-head">
        <div class="ov-eyebrow">Ideas</div>
        <h1 class="ideas-title">Where the structure could go next</h1>
        <p class="ideas-lede">My own sketches and concepts — each starts from an application’s need and asks what the system should look like.</p>
        ${ideas.length ? '' : '<p class="ideas-empty-note">The first sketches are on their way.</p>'}
      </header>
      <section class="ideas-grid${ideas.length === 1 ? ' is-single' : ''}">${plates}</section>
    `;

    root.querySelectorAll('.idea-link').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.AppNav) window.AppNav.goToPackage(btn.dataset.pkg, btn.dataset.el || undefined);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
