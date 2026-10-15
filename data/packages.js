// 3D structures shown in the Explorer, composed from the component library
// (data/components.js) plus new components defined here.
//
// Element ids are never renamed: saved papers/notes in Supabase are keyed by
// (package_id, element_id). A component moved from an old structure carries
// `legacyPkg` = the package id it was saved under, and the app reads/writes
// its papers/notes with that id, so nothing previously saved is lost.
//
// Order tells a story: baseline packages → 2.5D/3D → bridges → optics →
// a full future AI server node.
(function () {
  'use strict';

  const LIB = window.LEGACY_PACKAGES || [];

  /* ---------- palette: muted, natural, journal-figure tones ---------- */
  const C = {
    board: '#3e5a46', substrate: '#7d8f5a', glass: '#b9d3cf', interposer: '#6f8291',
    die: '#b5583f', die2: '#c9805f', dieBase: '#8e4632', memory: '#3f5a78',
    solder: '#a9aaa3', ubump: '#c58b4b', copper: '#b07a3c', rdl: '#c99a5b',
    mold: '#33352f', underfill: '#d9cba6', lid: '#9aa0a0', bond: '#e0b84a',
    diamond: '#dfe7e6', photonics: '#2f7d78', fau: '#cfc3a1', fiber: '#e0b84a',
    laser: '#c4572f', coolant: '#4f8fb0', power: '#6a5d7b', passive: '#8a7a5c',
    tim: '#cfc6b0', dielectric: '#d8ccaa'
  };

  function findEl(pkgId, elId) {
    const p = LIB.find(x => x.id === pkgId);
    const e = p && p.elements.find(x => x.id === elId);
    if (!e) console.warn('[packages] missing component', pkgId, elId);
    return e;
  }

  // Take a component from the library. `o` may override name, color,
  // category, geo (replaced wholesale) and content (shallow-merged).
  function take(pkgId, elId, o) {
    o = o || {};
    const src = findEl(pkgId, elId);
    if (!src) return null;
    const el = JSON.parse(JSON.stringify(src));
    el.legacyPkg = pkgId;
    if (o.name) el.name = o.name;
    if (o.color) el.color = o.color;
    if (o.category) el.category = o.category;
    if (o.geo) el.geo = o.geo;
    if (o.content) el.content = Object.assign({}, el.content, o.content);
    return el;
  }

  // Scale + shift a component's geometry (used to place two packages side by side).
  function placeGeo(geo, s, dx, srcBottom, dstBottom) {
    const g = JSON.parse(JSON.stringify(geo));
    g.size = g.size.map(v => v * s);
    g.pos = [g.pos[0] * s + dx, dstBottom + (g.pos[1] - srcBottom) * s, g.pos[2] * s];
    const o = g.opts || {};
    ['r', 'h', 'yStep', 'gap'].forEach(k => { if (o[k] != null) o[k] *= s; });
    ['skipRect', 'skipCenter'].forEach(k => { if (o[k]) { o[k].x *= s; o[k].z *= s; } });
    return g;
  }

  const content = (overview, extra) => Object.assign({
    overview, keywords: [], materials: [], process: [], challenges: [], companies: [], papers: []
  }, extra || {});

  /* =================================================================
     a · FLIP-CHIP & FAN-OUT — the two baseline packages, side by side
     ================================================================= */
  const S = 0.62, BOTTOM = -1.8;
  // Seat the lid on the die (thin TIM gap) and stand the adhesive ring on the
  // substrate under the lid edge — the original data had both floating.
  const FC_FIX = {
    'fc-lid': g => { g.pos[1] = -0.545; },
    'fc-adhesive': g => { g.size[1] = 0.53; g.pos[1] = -0.935; }
  };
  const fc = id => {
    const e = take('flipchip', id);
    if (FC_FIX[id]) FC_FIX[id](e.geo);
    e.geo = placeGeo(e.geo, S, -2.55, -1.8, BOTTOM);
    return e;
  };
  const fo = id => {
    const e = take('fowlp', id);
    e.geo = placeGeo(e.geo, S, 2.55, -1.3, BOTTOM);
    return e;
  };
  const baseline = {
    id: 'fowlp',
    name: 'Flip-Chip BGA & Fan-Out WLP',
    short: 'Flip-Chip · Fan-Out',
    subtitle: 'The two baseline packages side by side. Left: flip-chip BGA — a face-down die on a laminate substrate under a lid. Right: fan-out WLP (InFO-class) — redistribution layers built on a molded panel replace the substrate.',
    elements: [
      Object.assign(fc('fc-bga'), { color: C.solder }),
      Object.assign(fc('fc-substrate'), { color: C.substrate }),
      Object.assign(fc('fc-c4'), { color: C.ubump }),
      Object.assign(fc('fc-underfill'), { color: C.underfill }),
      Object.assign(fc('fc-die'), { color: C.die }),
      Object.assign(fc('fc-adhesive'), { color: C.mold }),
      Object.assign(fc('fc-lid'), { color: C.lid }),
      Object.assign(fo('fo-bga'), { color: C.solder }),
      Object.assign(fo('fo-rdl'), { color: C.rdl }),
      Object.assign(fo('fo-mold'), { color: C.mold }),
      Object.assign(fo('fo-die'), { color: C.die }),
      Object.assign(fo('fo-tiv'), { color: C.copper })
    ]
  };
  // fowlp elements already live in package 'fowlp' — no alias needed
  baseline.elements.forEach(e => { if (e.legacyPkg === 'fowlp') delete e.legacyPkg; });

  /* =================================================================
     b · 2.5D + 3D INTEGRATION — CoWoS-class interposer carrying an
         SoIC-style hybrid-bonded stack, a GPU die and HBM (one opened)
     ================================================================= */
  const box = (size, pos, layer, opts) => ({ type: 'box', size, pos, layer, ...(opts ? { opts } : {}) });
  const integ = {
    id: 'cowos',
    name: '2.5D + 3D Integration',
    short: '2.5D + 3D',
    subtitle: 'One silicon interposer, two directions of scaling. Left to right: a hybrid-bonded 3D stack (SoIC / Foveros-class), a GPU die, an HBM stack, and a second HBM stack opened to show its TSVs and inter-die µbumps. A notional composite, not a specific product.',
    elements: [
      take('cowos', 'cowos-pcb', { color: C.board, geo: box([9.5, 0.2, 7], [0, -2.03, 0], 0) }),
      take('cowos', 'cowos-bga', { color: C.solder, geo: { type: 'ballGrid', size: [8, 0.35, 5.8], pos: [0, -1.75, 0], layer: 1, opts: { nx: 16, nz: 12, r: 0.18 } } }),
      take('cowos', 'cowos-substrate', { color: C.substrate, geo: box([8, 0.35, 5.8], [0, -1.4, 0], 2) }),
      take('cowos', 'cowos-c4', { color: C.solder, geo: { type: 'ballGrid', size: [6.6, 0.12, 3.8], pos: [0, -1.14, 0], layer: 3, opts: { nx: 26, nz: 15, r: 0.06 } } }),
      take('cowos', 'cowos-interposer', { color: C.interposer, geo: box([6.8, 0.1, 4.0], [0, -1.02, 0], 4) }),
      take('cowos', 'cowos-tsv', { color: C.copper, geo: { type: 'tsvArray', size: [6.8, 0.1, 4.0], pos: [0, -1.02, 0], layer: 4, opts: { nx: 10, nz: 6, r: 0.025, h: 0.1 } } }),
      take('cowos', 'cowos-underfill', { color: C.underfill, geo: box([6.6, 0.05, 3.8], [0, -0.895, 0], 5, { opacity: 0.55 }) }),
      take('cowos', 'cowos-ubump', { color: C.ubump, geo: { type: 'ballGrid', size: [6.6, 0.05, 3.8], pos: [0, -0.895, 0], layer: 5, opts: { nx: 52, nz: 30, r: 0.022 } } }),

      // 3D: hybrid-bonded stack (from the former SoIC / Foveros structure)
      take('hybrid', 'hb-base', { name: 'SoIC · Base Die', color: C.dieBase, geo: box([1.6, 0.2, 2.6], [-2.35, -0.77, 0], 6) }),
      take('hybrid', 'hb-tsv-base', { name: 'SoIC · TSVs (Base Die)', color: C.copper, geo: { type: 'tsvArray', size: [1.6, 0.2, 2.6], pos: [-2.35, -0.77, 0], layer: 6, opts: { nx: 6, nz: 8, r: 0.028, h: 0.2 } } }),
      take('hybrid', 'hb-bondline', { name: 'SoIC · Hybrid Bond Interface', color: C.bond, geo: box([1.6, 0.012, 2.6], [-2.35, -0.664, 0], 7, { glow: true }) }),
      take('hybrid', 'hb-cu-pads', { name: 'SoIC · Cu Bond Pads', color: C.ubump, geo: { type: 'padGrid', size: [1.6, 0.005, 2.6], pos: [-2.35, -0.664, 0], layer: 7, opts: { nx: 32, nz: 44, r: 0.012 } } }),
      take('hybrid', 'hb-top', { name: 'SoIC · Top Die (Compute)', color: C.die, geo: box([1.6, 0.15, 2.6], [-2.35, -0.583, 0], 8) }),

      // 2.5D: GPU die + HBM side by side on the interposer
      take('cowos', 'cowos-logic', { color: C.die2, geo: box([1.6, 0.35, 2.6], [-0.45, -0.695, 0], 6) }),
      take('cowos', 'cowos-hbm', { color: C.memory, geo: { type: 'hbmStack', size: [1.0, 0.7, 2.4], pos: [1.2, -0.825, 0], layer: 6, opts: { layers: 12 } } }),

      // HBM opened up (from the former HBM / TSV stack-detail structure)
      take('hbm', 'hbm-base', { name: 'HBM · Base Logic Die', color: C.dieBase, geo: box([1.0, 0.09, 2.4], [2.55, -0.825, 0], 6) }),
      take('hbm', 'hbm-ubump', { name: 'HBM · Inter-die µbumps', color: C.ubump, geo: { type: 'padGrid', size: [0.9, 0.01, 2.2], pos: [2.55, -0.775, 0], layer: 7, opts: { nx: 8, nz: 16, r: 0.012, tiers: 12, yStep: 0.055 } } }),
      take('hbm', 'hbm-dram', { name: 'HBM · DRAM Core Dies (12-Hi)', color: C.memory, geo: { type: 'stackedDram', size: [0.96, 0.045, 2.3], pos: [2.55, -0.7475, 0], layer: 7, opts: { n: 12, gap: 0.01 } } }),
      take('hbm', 'hbm-tsv', { name: 'HBM · TSV Columns', color: C.copper, geo: { type: 'tsvArray', size: [0.96, 0.65, 2.3], pos: [2.55, -0.445, 0], layer: 7, opts: { nx: 3, nz: 6, r: 0.02, h: 0.65 } } }),
      take('hbm', 'hbm-mold', { name: 'HBM · Stack Mold', color: C.mold, geo: box([1.06, 0.75, 2.46], [2.55, -0.495, 0], 8, { opacity: 0.28 }) }),

      take('cowos', 'cowos-mold', { color: C.mold, geo: { type: 'moldCap', size: [6.8, 0.9, 4.0], pos: [0, -0.42, 0], layer: 9, opts: { opacity: 0.28, cutout: true } } })
    ]
  };
  integ.elements.forEach(e => { if (e.legacyPkg === 'cowos') delete e.legacyPkg; });

  /* =================================================================
     c · SILICON BRIDGE — EMIB / UCIe (unchanged geometry, new tones)
     ================================================================= */
  const bridgeSrc = LIB.find(p => p.id === 'chiplet');
  const bridgeTone = { 'ch-substrate': C.substrate, 'ch-bridge': C.interposer, 'ch-c4': C.solder, 'ch-ubump': C.ubump, 'ch-die1': C.die, 'ch-die2': C.die2 };
  const bridge = Object.assign({}, JSON.parse(JSON.stringify(bridgeSrc)), { short: 'Bridge · EMIB / UCIe' });
  bridge.elements.forEach(e => { if (bridgeTone[e.id]) e.color = bridgeTone[e.id]; });
  // Embed the bridge in the substrate cavity (top flush with the substrate)
  // and seat bumps and chiplets on it — the original data left small gaps.
  const BR_Y = { 'ch-bridge': -1.365, 'ch-c4': -1.275, 'ch-ubump': -1.305, 'ch-die1': -1.075, 'ch-die2': -1.075 };
  bridge.elements.forEach(e => { if (BR_Y[e.id] != null) e.geo.pos[1] = BR_Y[e.id]; });
  bridge.elements.forEach(e => {
    if (e.id === 'ch-c4') e.geo.size[1] = 0.1;
    if (e.id === 'ch-ubump') { e.geo.pos[1] = -1.275; Object.assign(e.geo.opts, { nx: 14, nz: 26, r: 0.045 }); }
  });

  /* =================================================================
     d · CO-PACKAGED OPTICS — switch ASIC ringed by optical engines
     ================================================================= */
  const OE = [ // optical-engine slots: [x, z, axis] — axis 'x' = engine on ±x side
    [2.15, 0.75, 'x'], [2.15, -0.75, 'x'], [-2.15, 0.75, 'x'], [-2.15, -0.75, 'x'],
    [0.75, 2.15, 'z'], [-0.75, 2.15, 'z'], [0.75, -2.15, 'z'], [-0.75, -2.15, 'z']
  ];
  const sgn = v => (v > 0 ? 1 : -1);
  const picItems = OE.map(([x, z, a]) => ({ p: [x, 0, z], s: a === 'x' ? [0.8, 0.12, 1.1] : [1.1, 0.12, 0.8] }));
  const eicItems = OE.map(([x, z, a]) => a === 'x'
    ? { p: [x - sgn(x) * 0.15, 0, z], s: [0.42, 0.1, 0.8] }
    : { p: [x, 0, z - sgn(z) * 0.15], s: [0.8, 0.1, 0.42] });
  const fauItems = OE.map(([x, z, a]) => a === 'x'
    ? { p: [x + sgn(x) * 0.57, 0, z], s: [0.34, 0.2, 0.9] }
    : { p: [x, 0, z + sgn(z) * 0.57], s: [0.9, 0.2, 0.34] });
  const fiberPaths = [];
  OE.forEach(([x, z, a]) => {
    [-0.3, -0.1, 0.1, 0.3].forEach(o => {
      if (a === 'x') {
        const s = sgn(x), zz = z + o;
        fiberPaths.push([[s * 2.89, 0, zz], [s * 3.6, 0, zz], [s * 4.35, -0.42, zz * 1.05]]);
      } else {
        const s = sgn(z), xx = x + o;
        fiberPaths.push([[xx, 0, s * 2.89], [xx, 0, s * 3.6], [xx * 1.05, -0.42, s * 4.35]]);
      }
    });
  });

  const cpo = {
    id: 'cpo',
    name: 'Co-Packaged Optics (CPO)',
    short: 'CPO · Photonics',
    subtitle: 'Optical engines share the substrate with a switch ASIC (51.2 Tb/s class), so each electrical lane travels millimetres instead of across the board to a front-panel pluggable. Light is supplied by a replaceable external laser. Notional layout.',
    elements: [
      { id: 'cpo-pcb', name: 'Switch Board', category: 'Board', color: C.board,
        geo: box([9.5, 0.2, 8.6], [0, -2.2, 0], 0),
        content: content('The line-card or system board. With CPO, data leaves the package as light on fiber, so the board no longer has to carry the switch\'s highest-speed electrical lanes all the way to front-panel optical cages.', {
          keywords: ['Fiber management', 'Front-panel fiber connectors', 'Shorter electrical channels'],
          challenges: [{ name: 'Fiber routing', desc: 'Dozens of fiber ribbons must be routed and strain-relieved from package to faceplate.' },
                       { name: 'Serviceability', desc: 'An optics failure can no longer be fixed by swapping one pluggable module.' }]
        }) },
      { id: 'cpo-bga', name: 'BGA Solder Balls', category: 'Interconnect', color: C.solder,
        geo: { type: 'ballGrid', size: [6.4, 0.3, 6.4], pos: [0, -1.95, 0], layer: 1, opts: { nx: 14, nz: 14, r: 0.14 } },
        content: content('Second-level interconnect between the CPO substrate and the board. Optical engines must survive the same assembly reflow as the electrical package.', {
          keywords: ['Second-level interconnect', 'Reflow-compatible optics'] }) },
      { id: 'cpo-substrate', name: 'Package Substrate', category: 'Substrate', color: C.substrate,
        geo: box([6.6, 0.3, 6.6], [0, -1.65, 0], 2),
        content: content('A large organic substrate shared by the switch ASIC and the optical engines. It carries the short electrical links between each ASIC SerDes block and its optical engine.', {
          keywords: ['Shared substrate', 'Short-reach electrical links', 'Large body size'],
          challenges: [{ name: 'Warpage', desc: 'A large body with mixed components must stay flat enough for fiber alignment and reflow.' }]
        }) },
      { id: 'cpo-c4', name: 'C4 Bumps (ASIC)', category: 'Interconnect', color: C.solder,
        geo: { type: 'ballGrid', size: [2.0, 0.08, 2.0], pos: [0, -1.46, 0], layer: 3, opts: { nx: 14, nz: 14, r: 0.04 } },
        content: content('Flip-chip bumps connecting the switch ASIC to the substrate.', { keywords: ['Flip-chip', 'First-level interconnect'] }) },
      { id: 'cpo-asic', name: 'Switch ASIC', category: 'Active Die', color: C.die,
        geo: box([2.2, 0.32, 2.2], [0, -1.26, 0], 4),
        content: content('The Ethernet switch die (51.2 Tb/s class). With front-panel pluggables, its SerDes must drive a long board channel to the faceplate. With CPO, the optical engines sit millimetres away on the same substrate, so the electrical link is far shorter and can use less power.', {
          keywords: ['51.2 Tb/s switch', 'SerDes', 'I/O power', 'Short-reach link'],
          challenges: [{ name: 'I/O power', desc: 'As switch bandwidth doubles each generation, driving long electrical channels takes a growing share of system power — the main motivation for CPO.' }],
          companies: ['Broadcom', 'NVIDIA']
        }) },
      { id: 'cpo-pic', name: 'Photonic IC (PIC)', category: 'Photonics', color: C.photonics,
        geo: { type: 'boxes', size: [0.8, 0.12, 1.1], pos: [0, -1.44, 0], layer: 3, opts: { items: picItems } },
        content: content('Silicon photonic chip that turns electrical signals into light and back. It integrates waveguides, modulators (Mach–Zehnder or micro-ring), germanium photodetectors and fiber couplers. Eight engines ring the ASIC here.', {
          keywords: ['Silicon photonics', 'Modulator', 'Ge photodetector', 'Waveguide', 'Edge / grating coupler'],
          materials: [{ name: 'Silicon-on-insulator (SOI)', desc: 'Si waveguides on buried oxide' },
                      { name: 'Germanium', desc: 'Photodetectors at 1310 / 1550 nm' },
                      { name: 'Silicon nitride', desc: 'Low-loss waveguides and couplers' }],
          challenges: [{ name: 'Thermal sensitivity', desc: 'Resonant devices such as micro-rings drift with temperature and need active tuning — hard next to a hot ASIC.' },
                       { name: 'Coupling loss', desc: 'Every fiber-to-chip interface costs optical power budget.' }],
          companies: ['TSMC', 'GlobalFoundries', 'Intel']
        }) },
      { id: 'cpo-eic', name: 'Electronic IC (EIC)', category: 'Active Die', color: C.die2,
        geo: { type: 'boxes', size: [0.42, 0.1, 0.8], pos: [0, -1.33, 0], layer: 4, opts: { items: eicItems } },
        content: content('The electronic companion chip: modulator drivers and transimpedance amplifiers (TIAs). Stacking it directly on the PIC keeps the electrical path between them extremely short; TSMC\'s COUPE platform, for example, stacks the EIC on the PIC with SoIC.', {
          keywords: ['Driver', 'TIA', 'EIC-on-PIC 3D stacking'],
          challenges: [{ name: 'Heat in a thermally sensitive stack', desc: 'The EIC dissipates power right on top of temperature-sensitive photonics.' }]
        }) },
      { id: 'cpo-fau', name: 'Fiber Array Unit (FAU)', category: 'Optical', color: C.fau,
        geo: { type: 'boxes', size: [0.34, 0.2, 0.9], pos: [0, -1.38, 0], layer: 4, opts: { items: fauItems } },
        content: content('A precision V-groove block that aligns a ribbon of single-mode fibers to the PIC couplers. Single-mode alignment tolerances are around a micron, which makes fiber attach one of the hardest assembly steps in CPO.', {
          keywords: ['V-groove', 'Single-mode fiber', 'Active alignment', 'Detachable connector'],
          challenges: [{ name: 'Sub-micron alignment', desc: 'Small shifts during cure or reflow raise coupling loss.' },
                       { name: 'Detachability', desc: 'Pluggable fiber connectors at the package edge are needed for repair and test.' }]
        }) },
      { id: 'cpo-fiber', name: 'Single-Mode Fiber Ribbons', category: 'Optical', color: C.fiber,
        geo: { type: 'tubes', size: [9, 0.4, 9], pos: [0, -1.38, 0], layer: 4, opts: { r: 0.022, paths: fiberPaths } },
        content: content('Fiber ribbons that carry the switch\'s traffic off the package as light, toward the faceplate.', {
          keywords: ['Single-mode fiber', 'Ribbon', 'Fiber management'] }) },
      { id: 'cpo-els', name: 'External Laser Source', category: 'Light Source', color: C.laser,
        geo: box([1.0, 0.42, 0.9], [-3.85, -1.89, 3.5], 1),
        content: content('A continuous-wave laser kept off the package in a front-panel module (for example the OIF ELSFP form factor). Lasers are the least reliable and most temperature-sensitive part of the link, so keeping them away from the hot ASIC and field-replaceable is a common CPO choice.', {
          keywords: ['CW laser', 'ELSFP', 'Field-replaceable', 'Remote light source'],
          challenges: [{ name: 'Optical power budget', desc: 'Light loses power through connectors and couplers on its way to the PIC.' }]
        }) },
      { id: 'cpo-laser-fiber', name: 'Laser Feed Fiber (PM)', category: 'Optical', color: C.laser,
        geo: { type: 'tubes', size: [1.2, 0.6, 2.4], pos: [0, 0, 0], layer: 2, opts: { r: 0.03, glow: true, paths: [[[-3.35, -1.82, 3.3], [-3.05, -1.55, 2.3], [-2.8, -1.32, 1.15]]] } },
        content: content('Polarization-maintaining fiber that carries the CW laser light from the external source to the optical engine.', {
          keywords: ['Polarization-maintaining fiber', 'Laser delivery'] }) }
    ]
  };

  /* =================================================================
     e · FUTURE AI SERVER NODE — after the notional figure by
         Puneet Gupta (UCLA) and Sung kyu Lim (USC)
     ================================================================= */
  const FIG = 'Based on the notional AI server node figure courtesy of Puneet Gupta (UCLA) and Sung kyu Lim (USC).';
  const aiNode = {
    id: 'ai-node',
    name: 'Future AI Server Node',
    short: 'AI Server Node',
    subtitle: 'A notional future AI server node: a 24,025 mm² substrate with 225 heterogeneous chiplets drawing 11,950 W — compute, memory, passives, cooling, power delivery and optics in one package. After a figure courtesy of Puneet Gupta (UCLA) and Sung kyu Lim (USC); simplified, not to scale.',
    elements: [
      { id: 'ai-pcb', name: 'PCB (split for backside VR)', category: 'Board', color: C.board,
        geo: { type: 'boxes', size: [3.9, 0.2, 6.0], pos: [0, -2.45, 0], layer: 0, opts: { items: [{ p: [-3.05, 0, 0] }, { p: [3.05, 0, 0] }] } },
        content: content('In the figure the board is open under the package centre, leaving room for voltage regulators and a heat spreader on the package\'s back side. ' + FIG, {
          keywords: ['Board cut-out', 'Backside power delivery'] }) },
      take('glass', 'gl-bga', { color: C.solder, geo: { type: 'ballGrid', size: [7.0, 0.3, 5.0], pos: [0, -2.2, 0], layer: 1, opts: { nx: 16, nz: 12, r: 0.14, skipRect: { x: 2.4, z: 6 } } } }),
      { id: 'ai-vr', name: 'Backside VRs + Diamond Spreader', category: 'Power', color: C.power,
        geo: { type: 'boxes', size: [0.7, 0.3, 1.2], pos: [0, -2.2, 0], layer: 1, opts: { items: [
          { p: [-0.5, 0, 0] }, { p: [0.5, 0, 0] },
          { p: [0, -0.21, 0], s: [2.0, 0.12, 2.0], color: C.diamond }] } },
        content: content('Voltage regulators (VR) mounted directly under the package, with their own diamond heat spreader. Delivering power vertically from below shortens the high-current path compared with routing it in from the board edge. ' + FIG, {
          keywords: ['Vertical power delivery', 'Voltage regulator', 'Backside heat spreader'],
          challenges: [{ name: 'Current density', desc: 'Kilowatt-class packages at ~1 V carry thousands of amperes; resistive loss grows with path length.' },
                       { name: 'Heat on both sides', desc: 'The regulators add a second heat source that also needs a cooling path.' }]
        }) },
      take('glass', 'gl-rdl-bot', { name: 'Backside Build-up (M1–M10)', color: C.dielectric,
        geo: { type: 'layered', size: [7.0, 0.36, 5.0], pos: [0, -1.87, 0], layer: 2, opts: { n: 7, altColor: C.rdl, opacity: 0.85 } },
        content: { overview: 'Build-up wiring under the glass core. In the figure it is graded from a buffer layer and M1 next to the core, through HDI layers (>2 µm L/S, M2–M8), to ultra-HDI layers (0.5 µm L/S, M9–M10) at the outer surface. ' + FIG,
          keywords: ['Ultra-HDI (0.5 µm L/S)', 'HDI (>2 µm L/S)', 'Buffer layer', 'M1–M10'] } }),
      { id: 'ai-diamond', name: 'Diamond Substrate Layers', category: 'Diamond', color: C.diamond,
        geo: { type: 'boxes', size: [7.0, 0.06, 5.0], pos: [0, -1.38, 0], layer: 3, opts: { opacity: 0.6, items: [{ p: [0, -0.28, 0] }, { p: [0, 0.28, 0] }] } },
        content: content('Thin diamond layers on both faces of the glass core. Diamond spreads heat laterally far better than copper, pulling it away from hot spots in the embedded dielets. ' + FIG, {
          keywords: ['Heat spreading', 'CVD diamond'],
          materials: [{ name: 'CVD diamond', desc: 'Thermal conductivity roughly 1,000–2,000 W/m·K, versus ~400 W/m·K for copper' }],
          challenges: [{ name: 'Integration', desc: 'Bonding diamond to glass and build-up layers without voids or CTE-driven stress.' }]
        }) },
      take('glass', 'gl-panel', { name: 'Glass Core Substrate', category: 'Glass Core', color: C.glass,
        geo: box([7.0, 0.5, 5.0], [0, -1.38, 0], 3, { opacity: 0.45 }) }),
      take('glass', 'gl-tgv', { color: C.copper,
        geo: { type: 'tsvArray', size: [7.0, 0.5, 5.0], pos: [0, -1.38, 0], layer: 3, opts: { nx: 14, nz: 8, r: 0.035, h: 0.5, skipRect: { x: 6.2, z: 2.4 } } } }),
      take('glass', 'gl-die', { name: 'Embedded AI Dielets', color: C.die2,
        geo: { type: 'boxes', size: [0.9, 0.3, 1.7], pos: [0, -1.38, 0], layer: 3, opts: { items: [-2.4, -1.2, 0, 1.2, 2.4].map(x => ({ p: [x, 0.04, 0] })) } },
        content: { overview: 'Small AI accelerator dies embedded inside the package rather than mounted on top, placing compute directly between the logic dies above and the power delivery below. ' + FIG,
          keywords: ['Embedded die', 'Dielet', 'Near-memory compute'], materials: [], process: [],
          challenges: [{ name: 'Heat removal', desc: 'Buried dies cannot reach a top-side heat sink — hence the microfluidic channels and diamond layers around them.' },
                       { name: 'Known-good die', desc: 'An embedded die cannot be reworked once the build-up layers are on top.' }],
          companies: [] } }),
      { id: 'ai-microfluidic', name: 'Microfluidic Cooling Channels', category: 'Cooling', color: C.coolant,
        geo: { type: 'tubes', size: [4, 0.2, 6], pos: [0, -1.38, 0], layer: 3, opts: { r: 0.055, paths: [-1.8, -0.6, 0.6, 1.8].map(x => [[x, -0.18, -3.0], [x, -0.18, 3.0]]) } },
        content: content('Coolant channels running through the package itself ("microfluidic integrated package" in the figure), removing heat right where the embedded dielets generate it instead of only through the top surface. ' + FIG, {
          keywords: ['Embedded liquid cooling', 'In-package coolant flow'],
          challenges: [{ name: 'Sealing and reliability', desc: 'Liquid inside the package must never leak, and channels must not clog over the product lifetime.' },
                       { name: 'Pumping power', desc: 'Narrow channels raise pressure drop and pump energy.' }]
        }) },
      { id: 'ai-passives', name: 'Embedded Passives (Cap · Inductor)', category: 'Passive', color: C.passive,
        geo: { type: 'boxes', size: [0.4, 0.16, 0.4], pos: [0, -1.38, 0], layer: 3, opts: { items: [
          { p: [-1.6, -0.49, 1.4] }, { p: [1.6, -0.49, 1.4] }, { p: [-1.6, -0.49, -1.4] }, { p: [1.6, -0.49, -1.4] },
          { p: [-1.6, 0.49, 1.6] }, { p: [1.6, 0.49, 1.6] }] } },
        content: content('Capacitors (series and shunt) in the backside build-up and inductors in the front-side build-up, as labelled in the figure. Placing passives inside the package keeps them close to the dies they filter and power. ' + FIG, {
          keywords: ['Series capacitor', 'Shunt capacitor', 'Embedded inductor', 'Power integrity'],
          challenges: [{ name: 'Density vs. thickness', desc: 'Useful capacitance and inductance must fit in thin build-up layers.' }]
        }) },
      { id: 'ai-optical', name: 'Through-Glass Optical Via', category: 'Optical', color: C.bond,
        geo: { type: 'tubes', size: [0.2, 1.2, 0.2], pos: [0, 0, 0], layer: 3, opts: { r: 0.07, glow: true, paths: [[[3.25, -1.95, 0], [3.25, -0.8, 0]]] } },
        content: content('A vertical optical path through the glass core (labelled "through light via" in the figure), carrying light between fibers on the top and bottom of the package. ' + FIG, {
          keywords: ['Optical via', 'Vertical light path', 'Glass transparency'] }) },
      { id: 'ai-mirror', name: '45° Mirror', category: 'Optical', color: C.lid,
        geo: { type: 'boxes', size: [0.22, 0.03, 0.3], pos: [3.25, -1.93, 0], layer: 3, opts: { items: [{ p: [0, 0, 0], rot: [0, 0, Math.PI / 4] }] } },
        content: content('A 45° mirror at the bottom of the optical via turns vertical light into the horizontal fiber. ' + FIG, {
          keywords: ['Beam turning', '45° reflector'] }) },
      { id: 'ai-fiber', name: 'Fibers (top & bottom)', category: 'Optical', color: C.fiber,
        geo: { type: 'tubes', size: [1.5, 1.2, 0.2], pos: [0, 0, 0], layer: 3, opts: { r: 0.05, paths: [
          [[3.32, -0.82, 0], [4.0, -0.82, 0], [4.7, -0.9, 0]],
          [[3.3, -1.93, 0], [4.0, -1.93, 0], [4.7, -2.0, 0]]] } },
        content: content('Optical fibers entering at the top and leaving at the bottom of the package, linked by the through-glass optical via. ' + FIG, {
          keywords: ['Fiber I/O', 'Package-level optics'] }) },
      take('glass', 'gl-rdl-top', { name: 'Front-side Build-up (M1–M10)', color: C.dielectric,
        geo: { type: 'layered', size: [7.0, 0.36, 5.0], pos: [0, -0.89, 0], layer: 4, opts: { n: 7, altColor: C.rdl, opacity: 0.85 } },
        content: { overview: 'Build-up wiring above the glass core: buffer and M1 next to the core, HDI (>2 µm L/S, M2–M8), and ultra-HDI (0.5 µm L/S, M9–M10) under the dies. The finest layers carry the dense GPU–CPU and die-to-memory wiring. ' + FIG,
          keywords: ['Ultra-HDI (0.5 µm L/S)', 'HDI (>2 µm L/S)', 'Buffer layer', 'M1–M10'] } }),
      take('glass', 'gl-ubump', { color: C.ubump, geo: { type: 'ballGrid', size: [6.6, 0.04, 4.4], pos: [0, -0.69, 0], layer: 5, opts: { nx: 50, nz: 34, r: 0.018 } } }),
      { id: 'ai-gpu', name: 'GPU', category: 'Active Die', color: C.die,
        geo: box([1.5, 0.3, 2.4], [-0.9, -0.52, 0], 6),
        content: content('GPU die on the top side, next to the CPU so that GPU–CPU traffic runs through the ultra-HDI layers directly below. In the figure\'s floor plan a "GPU+HBM tile" is listed as 236 + 12 W, and the GPU+HBM tier holds 125 chiplets at 6,200 W. ' + FIG, {
          keywords: ['GPU', 'CPU–GPU communication', 'GPU+HBM tile'] }) },
      { id: 'ai-cpu', name: 'CPU', category: 'Active Die', color: C.die2,
        geo: box([1.5, 0.3, 2.4], [0.9, -0.52, 0], 6),
        content: content('CPU die beside the GPU. In the figure\'s floor plan the compute tile (CPU, SoC, AI, memory) is listed as 80 + 50 + 90 + 10 W, and the compute tier holds 100 chiplets at 5,750 W. ' + FIG, {
          keywords: ['CPU', 'Compute tile', 'Heterogeneous dies'] }) },
      { id: 'ai-hbm', name: 'HBM Stacks', category: 'Memory', color: C.memory,
        geo: { type: 'boxes', size: [0.9, 0.42, 2.0], pos: [0, -0.46, 0], layer: 6, opts: { items: [{ p: [-2.6, 0, 0] }, { p: [2.6, 0, 0] }] } },
        content: content('High-bandwidth memory stacks at the outer edge of the top tier, beside the GPU. Taller than the logic dies, so the TIM + shim layer evens out the heights. ' + FIG, {
          keywords: ['HBM', 'Memory bandwidth'] }) },
      { id: 'ai-tim', name: 'TIM + Shim', category: 'Thermal', color: C.tim,
        geo: { type: 'boxes', size: [1.5, 0.15, 2.4], pos: [0, 0, 0], layer: 7, opts: { items: [
          { p: [-0.9, -0.295, 0] }, { p: [0.9, -0.295, 0] },
          { p: [-2.6, -0.235, 0], s: [0.9, 0.03, 2.0] }, { p: [2.6, -0.235, 0], s: [0.9, 0.03, 2.0] }] } },
        content: content('Thermal interface material plus shims that level dies of different heights, so every die touches the heat spreader with a thin, low-resistance joint. ' + FIG, {
          keywords: ['Thermal interface material', 'Height compensation', 'Bond-line thickness'],
          challenges: [{ name: 'Mixed die heights', desc: 'HBM stacks and logic dies differ in height; without shims the TIM would be thick over the shorter dies.' }]
        }) },
      { id: 'ai-spreader', name: 'Diamond Heat Spreader', category: 'Diamond', color: C.diamond,
        geo: box([7.0, 0.2, 5.0], [0, -0.12, 0], 8, { opacity: 0.35 }),
        content: content('A diamond heat spreader over all top-side dies. With an ~12 kW package, spreading heat before it reaches the cold plate is as important as removing it. ' + FIG, {
          keywords: ['Heat spreader', 'CVD diamond', 'Hot-spot spreading'],
          materials: [{ name: 'CVD diamond', desc: 'Thermal conductivity roughly 1,000–2,000 W/m·K' }]
        }) }
    ]
  };

  window.PACKAGES = [baseline, integ, bridge, cpo, aiNode];

  // Old structure ids → where their components live now (for saved links).
  window.PACKAGE_ALIASES = { hybrid: 'cowos', hbm: 'cowos', flipchip: 'fowlp', glass: 'ai-node' };
})();
