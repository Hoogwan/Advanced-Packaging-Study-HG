// Sketchboard: a free-form infinite canvas for sketching / mood-boarding ideas.
// Pan + zoom canvas, pen / shapes / text / sticky-notes / select-move, undo/redo,
// autosaves to Supabase (owner-gated write, public read) via window.dataStore.getSketch/setSketch.
(function () {
  'use strict';

  const BOARD_ID = 'main';
  const COLORS = ['#1c1a17', '#7a2e1f', '#2b4c7e', '#2f6b4f', '#b8862f', '#8a4fae', '#c94f4f', '#6b6b63'];
  const NOTE_COLORS = ['#fff3b0', '#c9f2d8', '#d6e4ff', '#ffd9d9', '#e8d9ff'];
  const WIDTHS = [2, 4, 8];

  let root = null;
  let canvas = null, ctx = null, wrap = null;
  let toolbar = { statusEl: null };

  // ---- Document state ----
  let elements = [];      // persisted sketch content
  let undoStack = [];
  let redoStack = [];

  // ---- View transform (infinite canvas) ----
  let view = { x: 0, y: 0, scale: 1 };

  // ---- Tool state ----
  let tool = 'pen';
  let color = COLORS[0];
  let strokeWidth = WIDTHS[1];
  let noteColor = NOTE_COLORS[0];

  let isOwner = false;
  let loaded = false;
  let dirty = false;
  let saveTimer = null;

  // ---- Interaction state ----
  let drawing = null;     // in-progress element while pointer is down
  let dragging = null;    // { el, offsetX, offsetY } while moving a selected element
  let panning = null;     // { startClientX, startClientY, startViewX, startViewY }
  let selectedEl = null;
  let editingTextEl = null;

  // ============================================================
  // Geometry helpers
  // ============================================================
  function screenToWorld(sx, sy) {
    const r = canvas.getBoundingClientRect();
    return { x: (sx - r.left - view.x) / view.scale, y: (sy - r.top - view.y) / view.scale };
  }
  function worldToScreen(wx, wy) {
    const r = canvas.getBoundingClientRect();
    return { x: wx * view.scale + view.x + r.left, y: wy * view.scale + view.y + r.top };
  }

  function boundsOf(el) {
    switch (el.type) {
      case 'path': {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        el.points.forEach(p => { minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]); maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]); });
        const pad = (el.width || 2) + 4;
        return { x: minX - pad, y: minY - pad, w: (maxX - minX) + pad * 2, h: (maxY - minY) + pad * 2 };
      }
      case 'line':
        return { x: Math.min(el.x1, el.x2) - 8, y: Math.min(el.y1, el.y2) - 8, w: Math.abs(el.x2 - el.x1) + 16, h: Math.abs(el.y2 - el.y1) + 16 };
      case 'rect': case 'ellipse': case 'note':
        return { x: Math.min(el.x, el.x + el.w), y: Math.min(el.y, el.y + el.h), w: Math.abs(el.w), h: Math.abs(el.h) };
      case 'text':
        return { x: el.x, y: el.y - (el.fontSize || 18), w: el.w || 160, h: (el.fontSize || 18) * 1.4 };
      default:
        return { x: 0, y: 0, w: 0, h: 0 };
    }
  }

  function hitTest(wx, wy) {
    for (let i = elements.length - 1; i >= 0; i--) {
      const b = boundsOf(elements[i]);
      if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) return elements[i];
    }
    return null;
  }

  // ============================================================
  // Undo / redo
  // ============================================================
  function snapshot() {
    return JSON.stringify(elements);
  }
  function pushUndo() {
    undoStack.push(snapshot());
    if (undoStack.length > 60) undoStack.shift();
    redoStack = [];
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    elements = JSON.parse(undoStack.pop());
    selectedEl = null;
    markDirty();
    draw();
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    elements = JSON.parse(redoStack.pop());
    selectedEl = null;
    markDirty();
    draw();
  }

  // ============================================================
  // Rendering
  // ============================================================
  function resize() {
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function drawGrid() {
    const r = canvas.getBoundingClientRect();
    const step = 32 * view.scale;
    if (step < 6) return;
    const offX = view.x % step, offY = view.y % step;
    ctx.save();
    ctx.strokeStyle = 'rgba(28,26,23,0.055)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = offX; x < r.width; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, r.height); }
    for (let y = offY; y < r.height; y += step) { ctx.moveTo(0, y); ctx.lineTo(r.width, y); }
    ctx.stroke();
    ctx.restore();
  }

  function wrapText(text, maxWidth) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let cur = '';
    words.forEach(word => {
      const test = cur ? cur + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur);
        cur = word;
      } else {
        cur = test;
      }
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function drawArrowHead(x1, y1, x2, y2, size) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 7), y2 - size * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 7), y2 - size * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
  }

  function drawElement(el) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    switch (el.type) {
      case 'path': {
        if (el.points.length < 2) break;
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.width;
        ctx.beginPath();
        ctx.moveTo(el.points[0][0], el.points[0][1]);
        for (let i = 1; i < el.points.length; i++) ctx.lineTo(el.points[i][0], el.points[i][1]);
        ctx.stroke();
        break;
      }
      case 'line': {
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.width;
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
        if (el.arrow) { ctx.fillStyle = el.color; drawArrowHead(el.x1, el.y1, el.x2, el.y2, 10 + el.width); }
        break;
      }
      case 'rect': {
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.width;
        ctx.strokeRect(el.x, el.y, el.w, el.h);
        break;
      }
      case 'ellipse': {
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.width;
        ctx.beginPath();
        ctx.ellipse(el.x + el.w / 2, el.y + el.h / 2, Math.abs(el.w) / 2, Math.abs(el.h) / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'note': {
        ctx.fillStyle = el.color;
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        roundRect(el.x, el.y, el.w, el.h, 6);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.font = '600 14px Inter, sans-serif';
        const lines = wrapText(el.text, el.w - 20);
        lines.slice(0, 8).forEach((line, i) => ctx.fillText(line, el.x + 10, el.y + 24 + i * 18));
        break;
      }
      case 'text': {
        ctx.fillStyle = el.color;
        ctx.font = `600 ${el.fontSize || 18}px Inter, sans-serif`;
        const lines = wrapText(el.text, el.w || 400);
        lines.forEach((line, i) => ctx.fillText(line, el.x, el.y + i * (el.fontSize || 18) * 1.3));
        break;
      }
    }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    if (!ctx) return;
    const r = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    ctx.fillStyle = '#fdfcf9';
    ctx.fillRect(0, 0, r.width, r.height);
    drawGrid();

    ctx.save();
    ctx.translate(view.x, view.y);
    ctx.scale(view.scale, view.scale);
    elements.forEach(el => drawElement(el));
    if (drawing) drawElement(drawing);

    if (selectedEl) {
      const b = boundsOf(selectedEl);
      ctx.save();
      ctx.strokeStyle = '#2b4c7e';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5 / view.scale;
      ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
      ctx.restore();
    }
    ctx.restore();
  }

  // ============================================================
  // Persistence
  // ============================================================
  function markDirty() { dirty = true; scheduleSave(); }

  function scheduleSave() {
    if (!isOwner) return;
    setStatus('Saving…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await window.dataStore.setSketch(BOARD_ID, { elements, v: 1 });
        dirty = false;
        const t = new Date();
        setStatus(`Saved · ${t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } catch (e) {
        console.error('[sketchboard] save failed', e);
        setStatus('Save failed');
      }
    }, 500);
  }

  function setStatus(text) {
    if (toolbar.statusEl) toolbar.statusEl.textContent = text;
  }

  async function loadBoard() {
    if (!window.dataStore) return;
    try {
      const res = await window.dataStore.getSketch(BOARD_ID);
      if (res && res.data && Array.isArray(res.data.elements)) {
        elements = res.data.elements;
      }
    } catch (e) {
      console.error('[sketchboard] load failed', e);
    }
    loaded = true;
    draw();
  }

  // ============================================================
  // Pointer interaction
  // ============================================================
  function onPointerDown(e) {
    if (editingTextEl) commitTextEdit();
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    const world = screenToWorld(e.clientX, e.clientY);

    if (tool === 'pan' || e.button === 1 || (e.button === 0 && e.altKey)) {
      panning = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
      return;
    }

    if (!isOwner) return; // view-only for non-owners

    if (tool === 'select') {
      const hit = hitTest(world.x, world.y);
      selectedEl = hit;
      if (hit) {
        if (hit.type === 'note' && e.detail === 2) { openTextEditor(hit); return; }
        if (hit.type === 'text' && e.detail === 2) { openTextEditor(hit); return; }
        pushUndo();
        dragging = { el: hit, ox: world.x - (hit.x != null ? hit.x : (hit.points ? hit.points[0][0] : hit.x1)), oy: world.y - (hit.y != null ? hit.y : (hit.points ? hit.points[0][1] : hit.y1)) };
      }
      draw();
      return;
    }

    if (tool === 'eraser') {
      const hit = hitTest(world.x, world.y);
      if (hit) {
        pushUndo();
        elements = elements.filter(el => el !== hit);
        selectedEl = null;
        markDirty();
        draw();
      }
      return;
    }

    if (tool === 'text') {
      const el = { type: 'text', x: world.x, y: world.y, text: '', color, fontSize: 18, w: 420 };
      pushUndo();
      elements.push(el);
      openTextEditor(el);
      return;
    }

    if (tool === 'note') {
      const el = { type: 'note', x: world.x - 90, y: world.y - 60, w: 180, h: 130, color: noteColor, text: '' };
      pushUndo();
      elements.push(el);
      openTextEditor(el);
      return;
    }

    if (tool === 'pen') {
      drawing = { type: 'path', points: [[world.x, world.y]], color, width: strokeWidth };
      return;
    }

    if (['line', 'arrow', 'rect', 'ellipse'].includes(tool)) {
      drawing = tool === 'line' || tool === 'arrow'
        ? { type: 'line', x1: world.x, y1: world.y, x2: world.x, y2: world.y, color, width: strokeWidth, arrow: tool === 'arrow' }
        : { type: tool, x: world.x, y: world.y, w: 0, h: 0, color, width: strokeWidth };
      return;
    }
  }

  function onPointerMove(e) {
    if (panning) {
      view.x = panning.vx + (e.clientX - panning.sx);
      view.y = panning.vy + (e.clientY - panning.sy);
      draw();
      return;
    }
    if (!isOwner) return;
    const world = screenToWorld(e.clientX, e.clientY);

    if (dragging) {
      const el = dragging.el;
      if (el.points) {
        const dx = world.x - dragging.ox - el.points[0][0];
        const dy = world.y - dragging.oy - el.points[0][1];
        el.points = el.points.map(p => [p[0] + dx, p[1] + dy]);
      } else if (el.x1 != null) {
        const dx = world.x - dragging.ox - el.x1;
        const dy = world.y - dragging.oy - el.y1;
        el.x1 += dx; el.y1 += dy; el.x2 += dx; el.y2 += dy;
      } else {
        el.x = world.x - dragging.ox;
        el.y = world.y - dragging.oy;
      }
      draw();
      return;
    }

    if (drawing) {
      if (drawing.type === 'path') drawing.points.push([world.x, world.y]);
      else if (drawing.type === 'line') { drawing.x2 = world.x; drawing.y2 = world.y; }
      else { drawing.w = world.x - drawing.x; drawing.h = world.y - drawing.y; }
      draw();
    }
  }

  function onPointerUp() {
    panning = null;
    if (dragging) { markDirty(); dragging = null; }
    if (drawing) {
      const el = drawing;
      drawing = null;
      const isTiny = (el.type === 'path' && el.points.length < 2) ||
        ((el.type === 'rect' || el.type === 'ellipse') && Math.abs(el.w) < 3 && Math.abs(el.h) < 3) ||
        (el.type === 'line' && Math.abs(el.x2 - el.x1) < 3 && Math.abs(el.y2 - el.y1) < 3);
      if (!isTiny) {
        pushUndo();
        elements.push(el);
        markDirty();
      }
      draw();
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const delta = -e.deltaY * 0.0015;
    const newScale = Math.min(3, Math.max(0.25, view.scale * (1 + delta)));
    const worldX = (mx - view.x) / view.scale, worldY = (my - view.y) / view.scale;
    view.scale = newScale;
    view.x = mx - worldX * newScale;
    view.y = my - worldY * newScale;
    draw();
  }

  function onKeyDown(e) {
    if (activeViewIsSketchboard() === false) return;
    if (editingTextEl) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEl && isOwner) {
      pushUndo();
      elements = elements.filter(el => el !== selectedEl);
      selectedEl = null;
      markDirty();
      draw();
    }
  }

  function activeViewIsSketchboard() {
    return window.AppNav && window.AppNav.getActiveView() === 'sketchboard';
  }

  // ============================================================
  // Text / note inline editor
  // ============================================================
  function openTextEditor(el) {
    editingTextEl = el;
    const screen = worldToScreen(el.x, el.y);
    const ta = document.createElement('textarea');
    ta.className = 'sb-text-editor';
    ta.value = el.text || '';
    ta.style.left = screen.x + 'px';
    ta.style.top = (el.type === 'note' ? screen.y : screen.y - (el.fontSize || 18)) + 'px';
    ta.style.width = Math.max(120, (el.w || 200) * view.scale) + 'px';
    ta.style.height = (el.type === 'note' ? Math.max(60, el.h * view.scale) : 60) + 'px';
    ta.style.fontSize = (el.type === 'note' ? 14 : (el.fontSize || 18)) * view.scale + 'px';
    wrap.appendChild(ta);
    ta.focus();
    ta.select();
    ta.addEventListener('blur', commitTextEdit);
    ta.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') { ta.value = el.text || ''; commitTextEdit(); }
      ev.stopPropagation();
    });
    editingTextEl._input = ta;
  }

  function commitTextEdit() {
    if (!editingTextEl) return;
    const el = editingTextEl;
    const ta = el._input;
    const text = ta ? ta.value.trim() : '';
    if (ta) ta.remove();
    delete el._input;
    if (!text) {
      elements = elements.filter(e => e !== el);
    } else {
      el.text = text;
    }
    editingTextEl = null;
    markDirty();
    draw();
  }

  // ============================================================
  // Toolbar
  // ============================================================
  function render() {
    root = document.getElementById('sketchboard-root');
    if (!root) return;

    root.innerHTML = `
      <div class="sb-toolbar">
        <div class="sb-tool-group" id="sb-tools">
          ${toolBtn('select', 'fa-arrow-pointer', 'Select / Move')}
          ${toolBtn('pen', 'fa-pen', 'Pen')}
          ${toolBtn('line', 'fa-slash', 'Line')}
          ${toolBtn('arrow', 'fa-arrow-right-long', 'Arrow')}
          ${toolBtn('rect', 'fa-square', 'Rectangle')}
          ${toolBtn('ellipse', 'fa-circle', 'Ellipse')}
          ${toolBtn('text', 'fa-font', 'Text')}
          ${toolBtn('note', 'fa-note-sticky', 'Sticky Note')}
          ${toolBtn('eraser', 'fa-eraser', 'Eraser')}
          ${toolBtn('pan', 'fa-hand', 'Pan canvas')}
        </div>
        <div class="sb-divider"></div>
        <div class="sb-tool-group" id="sb-colors">
          ${COLORS.map(c => `<button class="sb-color-swatch${c === color ? ' active' : ''}" data-color="${c}" style="background:${c}"></button>`).join('')}
        </div>
        <div class="sb-divider"></div>
        <div class="sb-tool-group" id="sb-widths">
          ${WIDTHS.map(w => `<button class="sb-width-btn${w === strokeWidth ? ' active' : ''}" data-width="${w}"><span style="width:${w + 4}px;height:${w + 4}px"></span></button>`).join('')}
        </div>
        <div class="sb-divider"></div>
        <div class="sb-tool-group">
          <button class="sb-action-btn" id="sb-undo" title="Undo (Ctrl+Z)"><i class="fa-solid fa-rotate-left"></i></button>
          <button class="sb-action-btn" id="sb-redo" title="Redo (Ctrl+Shift+Z)"><i class="fa-solid fa-rotate-right"></i></button>
          <button class="sb-action-btn" id="sb-clear" title="Clear board"><i class="fa-solid fa-trash-can"></i></button>
          <button class="sb-action-btn" id="sb-export" title="Export as PNG"><i class="fa-solid fa-download"></i></button>
          <button class="sb-action-btn" id="sb-reset-view" title="Reset view"><i class="fa-solid fa-compress"></i></button>
        </div>
        <div class="sb-status" id="sb-status">Loading…</div>
      </div>
      <div class="sb-canvas-wrap" id="sb-canvas-wrap">
        <canvas id="sb-canvas"></canvas>
        <div class="sb-viewonly-badge" id="sb-viewonly" style="display:none;"><i class="fa-solid fa-lock"></i> View only — log in as owner to sketch</div>
        <div class="sb-hint">scroll to zoom · hold Alt / middle-drag to pan · Ctrl+Z undo</div>
      </div>
    `;

    wrap = document.getElementById('sb-canvas-wrap');
    canvas = document.getElementById('sb-canvas');
    ctx = canvas.getContext('2d');
    toolbar.statusEl = document.getElementById('sb-status');

    bindToolbar();
    bindCanvasEvents();

    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap);

    isOwner = !!(window.auth && window.auth.isOwner());
    applyOwnerState();
    if (window.auth) {
      window.auth.onAuthChange(() => {
        isOwner = window.auth.isOwner();
        applyOwnerState();
      });
    }

    loadBoard().then(() => {
      resize();
      setStatus(isOwner ? 'Saved' : 'Viewing (read-only)');
    });
  }

  function toolBtn(name, icon, title) {
    return `<button class="sb-tool-btn${name === tool ? ' active' : ''}" data-tool="${name}" title="${title}"><i class="fa-solid ${icon}"></i></button>`;
  }

  function applyOwnerState() {
    const badge = document.getElementById('sb-viewonly');
    const toolsEl = document.getElementById('sb-tools');
    if (badge) badge.style.display = isOwner ? 'none' : 'flex';
    if (toolsEl) toolsEl.classList.toggle('sb-disabled', !isOwner);
    document.querySelectorAll('#sb-colors, #sb-widths').forEach(elm => elm.classList.toggle('sb-disabled', !isOwner));
    if (!isOwner) { tool = 'pan'; syncToolButtons(); }
    setStatus(isOwner ? (dirty ? 'Saving…' : 'Saved') : 'Viewing (read-only)');
  }

  function syncToolButtons() {
    document.querySelectorAll('.sb-tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
  }

  function bindToolbar() {
    document.getElementById('sb-tools').addEventListener('click', e => {
      const btn = e.target.closest('.sb-tool-btn');
      if (!btn || !isOwner) return;
      tool = btn.dataset.tool;
      selectedEl = null;
      syncToolButtons();
      draw();
    });
    document.getElementById('sb-colors').addEventListener('click', e => {
      const btn = e.target.closest('.sb-color-swatch');
      if (!btn || !isOwner) return;
      color = btn.dataset.color;
      document.querySelectorAll('.sb-color-swatch').forEach(b => b.classList.toggle('active', b === btn));
    });
    document.getElementById('sb-widths').addEventListener('click', e => {
      const btn = e.target.closest('.sb-width-btn');
      if (!btn || !isOwner) return;
      strokeWidth = parseInt(btn.dataset.width, 10);
      document.querySelectorAll('.sb-width-btn').forEach(b => b.classList.toggle('active', b === btn));
    });
    document.getElementById('sb-undo').addEventListener('click', () => isOwner && undo());
    document.getElementById('sb-redo').addEventListener('click', () => isOwner && redo());
    document.getElementById('sb-clear').addEventListener('click', () => {
      if (!isOwner) return;
      if (!elements.length) return;
      if (!confirm('Clear the entire sketchboard? This cannot be undone after saving.')) return;
      pushUndo();
      elements = [];
      selectedEl = null;
      markDirty();
      draw();
    });
    document.getElementById('sb-export').addEventListener('click', exportPNG);
    document.getElementById('sb-reset-view').addEventListener('click', () => {
      view = { x: 0, y: 0, scale: 1 };
      draw();
    });
  }

  function exportPNG() {
    // Render a clean copy (no grid, no selection box) at 2x for a crisp download.
    const tmp = document.createElement('canvas');
    let minX = 0, minY = 0, maxX = 800, maxY = 600;
    if (elements.length) {
      minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
      elements.forEach(el => {
        const b = boundsOf(el);
        minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.w); maxY = Math.max(maxY, b.y + b.h);
      });
    }
    const pad = 40;
    const w = Math.max(200, maxX - minX + pad * 2), h = Math.max(200, maxY - minY + pad * 2);
    tmp.width = w * 2; tmp.height = h * 2;
    const tctx = tmp.getContext('2d');
    tctx.scale(2, 2);
    tctx.fillStyle = '#fdfcf9';
    tctx.fillRect(0, 0, w, h);
    tctx.translate(pad - minX, pad - minY);
    const savedCtx = ctx;
    ctx = tctx;
    elements.forEach(el => drawElement(el));
    ctx = savedCtx;
    const a = document.createElement('a');
    a.download = 'sketchboard.png';
    a.href = tmp.toDataURL('image/png');
    a.click();
  }

  function bindCanvasEvents() {
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', e => {
      if (!isOwner) return;
      const world = screenToWorld(e.clientX, e.clientY);
      const hit = hitTest(world.x, world.y);
      if (hit && (hit.type === 'note' || hit.type === 'text')) openTextEditor(hit);
    });
    window.addEventListener('keydown', onKeyDown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

  window.SketchboardView = { resize };
})();
