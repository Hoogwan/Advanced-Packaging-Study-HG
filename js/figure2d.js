// Figure2D — draws a package as a clean 2D FRONT VIEW (x → right, y → up),
// straight from the same geometry data the 3D Explorer uses. Used by the
// Overview (thumbnails + the lead carousel), so the pictures always match 3D.
(function () {
  'use strict';

  const OUTLINE = 'rgba(22,25,29,0.38)';

  // Turn one element into simple primitives in model units.
  // rect: {t:'r', x0,x1,y0,y1, c, o}   circle: {t:'c', x,y,r,c}
  // line: {t:'l', pts:[[x,y]...], w, c, o}
  function shapesFor(el) {
    const g = el.geo, o = g.opts || {};
    const [sx, sy, sz] = g.size, [px, py] = g.pos;
    const c = el.color;
    const out = [];
    const rect = (cx, cy, w, h, col, op, rot) =>
      out.push({ t: 'r', x0: cx - w / 2, x1: cx + w / 2, y0: cy - h / 2, y1: cy + h / 2, c: col || c, o: op, rot });
    const fullSkip = s => s && s.z >= sz; // a skip region only hides things in front view if it spans all depth

    switch (g.type) {
      case 'box': case 'moldCap': case 'lid':
        rect(px, py, sx, sy, c, o.opacity);
        break;
      case 'ring': { // a frame: in a cross-section only its two walls show
        const wall = sx * 0.225;
        rect(px - sx / 2 + wall / 2, py, wall, sy, c);
        rect(px + sx / 2 - wall / 2, py, wall, sy, c);
        break;
      }
      case 'ballGrid': {
        const nx = o.nx || 10, r = o.r || 0.1, skip = o.skipRect;
        const step = (sx - r * 2) / Math.max(1, nx - 1);
        for (let i = 0; i < nx; i++) {
          const x = -sx / 2 + r + i * step;
          if (fullSkip(skip) && Math.abs(x) < skip.x / 2) continue;
          out.push({ t: 'c', x: px + x, y: py, r, c });
        }
        break;
      }
      case 'padGrid': {
        const tiers = o.tiers || 1, yStep = o.yStep || 0;
        for (let t = 0; t < tiers; t++) rect(px, py + t * yStep, sx, Math.max(sy, 0.012), c);
        break;
      }
      case 'tsvArray': {
        const nx = o.nx || 6, h = o.h || sy, r = o.r || 0.03, skip = o.skipRect || o.skipCenter;
        const usable = sx * 0.7, step = usable / Math.max(1, nx - 1);
        for (let i = 0; i < nx; i++) {
          const x = -usable / 2 + i * step;
          if (fullSkip(skip) && Math.abs(x) < skip.x / 2) continue;
          rect(px + x, py, Math.max(r * 2, 0.02), h, c);
        }
        break;
      }
      case 'hbmStack': {
        const n = o.layers || 8, dieH = 0.05, gap = 0.005;
        rect(px, py, sx * 1.02, 0.09, '#8e4632');
        for (let i = 0; i < n; i++) rect(px, py + 0.045 + dieH / 2 + (dieH + gap) * i, sx, dieH, c);
        break;
      }
      case 'stackedDram': {
        const n = o.n || 8, gap = o.gap || 0.01;
        for (let i = 0; i < n; i++) rect(px, py + i * (sy + gap), sx, sy, c);
        break;
      }
      case 'layered': {
        const n = o.n || 6, h = sy / n, alt = o.altColor || '#c99a5b';
        for (let i = 0; i < n; i++) {
          const metal = i % 2 === 1;
          rect(px, py - sy / 2 + h * (i + 0.5), sx, h * (metal ? 0.55 : 1), metal ? alt : c, o.opacity);
        }
        break;
      }
      case 'boxes':
        (o.items || []).forEach(it => {
          const s = it.s || g.size;
          rect(px + it.p[0], py + it.p[1], s[0], s[1], it.color || c, o.opacity, it.rot ? it.rot[2] : 0);
        });
        break;
      case 'tubes':
        (o.paths || []).forEach(pts => out.push({
          t: 'l', pts: pts.map(p => [px + p[0], py + p[1]]), w: (o.r || 0.03) * 2, c, o: 1
        }));
        break;
    }
    return out;
  }

  // Draw order: back-to-front by layer, translucent encapsulants last.
  function order(pkg) {
    return pkg.elements.slice().sort((a, b) => {
      const ta = (a.geo.opts && a.geo.opts.opacity != null && a.geo.opts.opacity < 0.6) ? 1 : 0;
      const tb = (b.geo.opts && b.geo.opts.opacity != null && b.geo.opts.opacity < 0.6) ? 1 : 0;
      return (ta - tb) || (a.geo.layer - b.geo.layer);
    });
  }

  function render(pkg, opts) {
    opts = opts || {};
    const W = opts.width || 320, H = opts.height || 160, pad = opts.pad == null ? 10 : opts.pad;
    const all = [];
    order(pkg).forEach(el => shapesFor(el).forEach(s => all.push(s)));
    if (!all.length) return '';

    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    all.forEach(s => {
      if (s.t === 'r') { x0 = Math.min(x0, s.x0); x1 = Math.max(x1, s.x1); y0 = Math.min(y0, s.y0); y1 = Math.max(y1, s.y1); }
      else if (s.t === 'c') { x0 = Math.min(x0, s.x - s.r); x1 = Math.max(x1, s.x + s.r); y0 = Math.min(y0, s.y - s.r); y1 = Math.max(y1, s.y + s.r); }
      else s.pts.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    });
    // Package cross-sections are wide and thin: exaggerate height for legibility.
    const vExag = opts.vExag || 1.8;
    const k = Math.min((W - 2 * pad) / (x1 - x0), (H - 2 * pad) / ((y1 - y0) * vExag));
    const ox = (W - (x1 - x0) * k) / 2, oy = (H - (y1 - y0) * k * vExag) / 2;
    const X = x => ox + (x - x0) * k;
    const Y = y => H - (oy + (y - y0) * k * vExag);
    const sw = Math.max(0.5, Math.min(1, k * 0.012));

    const parts = all.map(s => {
      if (s.t === 'r') {
        const x = X(s.x0), y = Y(s.y1), w = Math.max(0.6, (s.x1 - s.x0) * k), h = Math.max(0.6, (s.y1 - s.y0) * k * vExag);
        const op = s.o != null ? ` fill-opacity="${Math.max(0.18, s.o)}"` : '';
        const tr = s.rot ? ` transform="rotate(${(-s.rot * 180 / Math.PI).toFixed(1)} ${(x + w / 2).toFixed(1)} ${(y + h / 2).toFixed(1)})"` : '';
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${s.c}"${op} stroke="${OUTLINE}" stroke-width="${sw}"${tr}/>`;
      }
      if (s.t === 'c') {
        const r = Math.max(0.6, s.r * k);
        return `<ellipse cx="${X(s.x).toFixed(1)}" cy="${Y(s.y).toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * vExag).toFixed(1)}" fill="${s.c}" stroke="${OUTLINE}" stroke-width="${sw * 0.8}"/>`;
      }
      const d = s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join(' ');
      return `<path d="${d}" fill="none" stroke="${s.c}" stroke-width="${Math.max(1, s.w * k).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    });

    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${(pkg.name || '').replace(/"/g, '')} — front view">${parts.join('')}</svg>`;
  }

  window.Figure2D = { render };
})();
