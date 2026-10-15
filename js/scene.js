// Three.js scene builder for Advanced Packaging viewer — premium infographic style
// Exposes window.PkgScene with init(), loadPackage(pkg), and controls
// Adds: studio-style lighting, material differentiation by category, tighter
// isometric framing, and clickable leader-line labels for every component.

(function(){
'use strict';

const THREE = window.THREE;

let renderer, scene, camera, controls;
let root;                    // parent group for current package (holds all elements)
let clickables = [];         // array of {mesh, element}
let raycaster, mouse;
let clipPlane;
let currentPkg = null;
let selectedId = null;
let hoveredId = null;

let state = {
  explode: 0,        // 0..1
  section: 0,        // 0..1  (0 = no cut)
  hidden: new Set(),
};

let onSelectCb = null;
let onHoverCb = null;

/* ============ MATERIAL PRESETS (by category → gives each block a distinct
   "made of" feel: silicon / metal / organic / glass / encapsulant) ========= */
const CATEGORY_MATERIAL = {
  'Active Die':          { metalness: 0.06, roughness: 0.30, clearcoat: 0.35, clearcoatRoughness: 0.18 },
  'Interposer':          { metalness: 0.05, roughness: 0.28, clearcoat: 0.30, clearcoatRoughness: 0.20 },
  'Bridge':              { metalness: 0.05, roughness: 0.28, clearcoat: 0.30, clearcoatRoughness: 0.20 },
  'Interconnect':        { metalness: 0.82, roughness: 0.24, clearcoat: 0.25, clearcoatRoughness: 0.15 },
  'Vertical Interconnect':{ metalness: 0.85, roughness: 0.22, clearcoat: 0.2,  clearcoatRoughness: 0.15 },
  'RDL':                 { metalness: 0.78, roughness: 0.26, clearcoat: 0.2,  clearcoatRoughness: 0.18 },
  'Thermal':             { metalness: 0.88, roughness: 0.18, clearcoat: 0.4,  clearcoatRoughness: 0.1 },
  'Bonding':             { metalness: 0.55, roughness: 0.30, clearcoat: 0.3,  clearcoatRoughness: 0.15 },
  'Substrate':           { metalness: 0.03, roughness: 0.72 },
  'Board':                { metalness: 0.02, roughness: 0.75 },
  'Encapsulant':         { metalness: 0.04, roughness: 0.58 },
  'Memory':              { metalness: 0.10, roughness: 0.38, clearcoat: 0.2, clearcoatRoughness: 0.2 },
  'Adhesive':            { metalness: 0.0,  roughness: 0.85 },
  'Photonics':           { metalness: 0.10, roughness: 0.25, clearcoat: 0.45, clearcoatRoughness: 0.12 },
  'Optical':             { metalness: 0.05, roughness: 0.30, clearcoat: 0.5,  clearcoatRoughness: 0.1 },
  'Light Source':        { metalness: 0.35, roughness: 0.35 },
  'Cooling':             { metalness: 0.10, roughness: 0.30, clearcoat: 0.4,  clearcoatRoughness: 0.1 },
  'Power':               { metalness: 0.25, roughness: 0.45 },
  'Passive':             { metalness: 0.30, roughness: 0.40 },
  'Diamond':             { metalness: 0.0,  roughness: 0.12, clearcoat: 0.8,  clearcoatRoughness: 0.05 }
};
const DEFAULT_MATERIAL = { metalness: 0.15, roughness: 0.55 };

function materialPresetFor(category, pkgId) {
  if (category === 'Glass Core') {
    return { glass: true, metalness: 0.0, roughness: 0.06, transmission: 0.55, thickness: 0.4, ior: 1.5, clearcoat: 0.6, clearcoatRoughness: 0.05 };
  }
  return CATEGORY_MATERIAL[category] || DEFAULT_MATERIAL;
}

/* ============ INIT ============ */
function init(canvasEl, callbacks) {
  onSelectCb = callbacks.onSelect;
  onHoverCb = callbacks.onHover;
  labelsRoot = callbacks.labelsRoot || document.getElementById('label-overlay');

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  renderer.physicallyCorrectLights = true;
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  else if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  scene = new THREE.Scene();

  // Tighter isometric orthographic camera — bigger object presence, less dead space
  const aspect = canvasEl.clientWidth / canvasEl.clientHeight;
  const d = 4.6;
  camera = new THREE.OrthographicCamera(-d*aspect, d*aspect, d, -d, 0.1, 100);
  camera.position.set(9, 8, 12);
  camera.lookAt(0, -0.4, 0);

  // ============ STUDIO-STYLE LIGHTING ============
  // Soft sky/ground bounce (fills shadows softly, avoids flat/dark look)
  const hemi = new THREE.HemisphereLight(0xffffff, 0xe4e2dc, 0.85);
  scene.add(hemi);
  // Gentle ambient to lift blacks (subtle AO-like fill)
  const ambient = new THREE.AmbientLight(0xffffff, 0.32);
  scene.add(ambient);
  // Key light: large soft shadows
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(7, 13, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -9; key.shadow.camera.right = 9;
  key.shadow.camera.top = 9; key.shadow.camera.bottom = -9;
  key.shadow.camera.near = 1; key.shadow.camera.far = 30;
  key.shadow.radius = 9;
  key.shadow.bias = -0.0006;
  scene.add(key);
  // Fill light: cool, opposite side, low intensity — softens shadow contrast
  const fill = new THREE.DirectionalLight(0xf2f4f7, 0.55);
  fill.position.set(-9, 6, -7);
  scene.add(fill);
  // Rim light: subtle warm backlight for edge definition / "premium" separation
  const rim = new THREE.DirectionalLight(0xffffff, 0.18);
  rim.position.set(-4, 4, -10);
  scene.add(rim);

  // Soft studio floor: faint shadow-catcher + radial vignette falloff (canvas texture)
  const groundGeo = new THREE.PlaneGeometry(30, 30);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.09 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -2.1;
  ground.receiveShadow = true;
  scene.add(ground);

  const vignetteTex = makeRadialVignetteTexture();
  const vignetteGeo = new THREE.PlaneGeometry(22, 22);
  const vignetteMat = new THREE.MeshBasicMaterial({ map: vignetteTex, transparent: true, depthWrite: false });
  const vignette = new THREE.Mesh(vignetteGeo, vignetteMat);
  vignette.rotation.x = -Math.PI/2;
  vignette.position.y = -2.11;
  // (vignette removed — a clean white field reads like a journal figure)

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, -0.4, 0);
  controls.minZoom = 0.4;
  controls.maxZoom = 3;

  // Raycaster
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Clip plane for cross-section (initially far away)
  clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 100);
  renderer.clippingPlanes = [];

  // Events
  canvasEl.addEventListener('click', onClick);
  canvasEl.addEventListener('pointermove', onMove);
  canvasEl.addEventListener('pointerleave', ()=>{ hoveredId = null; if(onHoverCb) onHoverCb(null,0,0); updateHighlight(); });
  window.addEventListener('resize', onResize);

  initLabelLayer();
  animate();
  onResize();
}

function makeRadialVignetteTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grad.addColorStop(0, 'rgba(20,18,14,0.13)');
  grad.addColorStop(0.55, 'rgba(20,18,14,0.05)');
  grad.addColorStop(1, 'rgba(20,18,14,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function onResize() {
  const canvas = renderer.domElement;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  const aspect = w/h;
  const d = 4.6;
  camera.left = -d*aspect;
  camera.right = d*aspect;
  camera.top = d;
  camera.bottom = -d;
  camera.updateProjectionMatrix();
  fitZoom();
  updateLabelPositions();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  updateLabelPositions();
}

/* ============ LOAD PACKAGE ============ */
function loadPackage(pkg) {
  if (root) {
    scene.remove(root);
    disposeGroup(root);
  }
  clickables = [];
  selectedId = null;
  state.hidden.clear();
  currentPkg = pkg;

  root = new THREE.Group();
  scene.add(root);

  // Track layer set for exploded view
  pkg._layers = new Set();
  pkg.elements.forEach(el => pkg._layers.add(el.geo.layer));

  pkg.elements.forEach(el => {
    const mesh = buildElement(el, pkg);
    if (mesh) {
      mesh.userData.element = el;
      mesh.userData.baseY = el.geo.pos[1];
      mesh.userData.layer = el.geo.layer;
      root.add(mesh);
      registerClickables(mesh, el);
    }
  });

  journalFinish(root);
  applyExplode();
  applySection();
  frameCamera('iso');
  rebuildLabels(pkg);
}

// Journal-figure finish: matte (not glossy) surfaces and fine, crisp outlines.
function journalFinish(group) {
  group.traverse(o => {
    if (o.isLineSegments && o.material) {
      o.material.color = new THREE.Color(0x1f2328);
      o.material.opacity = 0.42;
      return;
    }
    const m = o.material;
    if (!m || Array.isArray(m) || !('roughness' in m)) return;
    const metal = m.metalness > 0.5;
    m.roughness = Math.max(m.roughness, metal ? 0.32 : 0.5);
    if ('clearcoat' in m) m.clearcoat = (m.clearcoat || 0) * 0.25;
    m.needsUpdate = true;
  });
}

function registerClickables(obj, el) {
  if (obj.isMesh) {
    clickables.push({ mesh: obj, element: el });
  }
  if (obj.children) {
    obj.children.forEach(c => registerClickables(c, el));
  }
}

function disposeGroup(g) {
  g.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach(m=>m.dispose());
      else o.material.dispose();
    }
  });
}

/* ============ GEOMETRY BUILDERS ============ */
function makeMat(color, opts, category, pkgId) {
  opts = opts || {};
  const preset = materialPresetFor(category, pkgId);
  const useGlass = !!preset.glass;
  const baseOpacity = opts.opacity !== undefined ? opts.opacity : (useGlass ? 0.85 : 1);

  let mat;
  if (useGlass && THREE.MeshPhysicalMaterial) {
    mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      metalness: 0,
      roughness: preset.roughness,
      transmission: preset.transmission || 0,
      thickness: preset.thickness || 0.3,
      ior: preset.ior || 1.5,
      clearcoat: preset.clearcoat || 0,
      clearcoatRoughness: preset.clearcoatRoughness || 0.1,
      transparent: true,
      opacity: baseOpacity,
      side: opts.side || THREE.FrontSide,
      clippingPlanes: renderer.clippingPlanes,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    });
  } else if (THREE.MeshPhysicalMaterial) {
    mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      metalness: preset.metalness !== undefined ? preset.metalness : 0.15,
      roughness: preset.roughness !== undefined ? preset.roughness : 0.55,
      clearcoat: preset.clearcoat || 0,
      clearcoatRoughness: preset.clearcoatRoughness !== undefined ? preset.clearcoatRoughness : 0.15,
      transparent: opts.opacity !== undefined,
      opacity: baseOpacity,
      side: opts.side || THREE.FrontSide,
      clippingPlanes: renderer.clippingPlanes,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    });
  } else {
    mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: preset.metalness !== undefined ? preset.metalness : 0.15,
      roughness: preset.roughness !== undefined ? preset.roughness : 0.55,
      transparent: opts.opacity !== undefined,
      opacity: baseOpacity,
      side: opts.side || THREE.FrontSide,
      clippingPlanes: renderer.clippingPlanes,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    });
  }
  if (opts.glow) {
    mat.emissive = new THREE.Color(color);
    mat.emissiveIntensity = 0.35;
  }
  mat.userData.baseColor = color;
  mat.userData.baseOpacity = mat.opacity;
  return mat;
}

function buildElement(el, pkg) {
  const g = el.geo;
  const opts = g.opts || {};
  const [sx, sy, sz] = g.size;
  const [px, py, pz] = g.pos;
  const pkgId = pkg ? pkg.id : null;

  switch(g.type) {
    case 'box': {
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      const mesh = new THREE.Mesh(geo, makeMat(el.color, opts, el.category, pkgId));
      mesh.position.set(px, py, pz);
      mesh.castShadow = true; mesh.receiveShadow = true;
      // subtle outline
      const edges = new THREE.EdgesGeometry(geo, 30);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
        color: 0x1a1a17, transparent:true, opacity: 0.22,
        clippingPlanes: renderer.clippingPlanes
      }));
      mesh.add(line);
      return mesh;
    }

    case 'ballGrid': {
      const group = new THREE.Group();
      group.position.set(px, py, pz);
      const nx = opts.nx || 10, nz = opts.nz || 10, r = opts.r || 0.1;
      const stepX = (sx - r*2) / Math.max(1, nx-1);
      const stepZ = (sz - r*2) / Math.max(1, nz-1);
      const startX = -sx/2 + r;
      const startZ = -sz/2 + r;
      const geo = new THREE.SphereGeometry(r, 14, 10);
      const mat = makeMat(el.color, {}, el.category, pkgId);
      mat.metalness = 0.7; mat.roughness = 0.22;
      // Use instanced mesh for perf
      let count = nx * nz;
      const skipR = opts.skipRect;
      const skipC = opts.skipCenter;
      const inst = new THREE.InstancedMesh(geo, mat, count);
      inst.castShadow = true; inst.receiveShadow = true;
      const dummy = new THREE.Object3D();
      let idx = 0;
      for (let i=0; i<nx; i++){
        for (let k=0; k<nz; k++){
          const x = startX + i*stepX;
          const z = startZ + k*stepZ;
          if (skipR && Math.abs(x) < skipR.x/2 && Math.abs(z) < skipR.z/2) continue;
          if (skipC && Math.abs(x) < skipC.x/2 && Math.abs(z) < skipC.z/2) continue;
          dummy.position.set(x, 0, z);
          dummy.updateMatrix();
          inst.setMatrixAt(idx++, dummy.matrix);
        }
      }
      inst.count = idx;
      inst.instanceMatrix.needsUpdate = true;
      group.add(inst);
      return group;
    }

    case 'padGrid': {
      // flat cylinders (bond pads)
      const group = new THREE.Group();
      group.position.set(px, py, pz);
      const nx = opts.nx || 10, nz = opts.nz || 10, r = opts.r || 0.03;
      const tiers = opts.tiers || 1;
      const yStep = opts.yStep || 0;
      const geo = new THREE.CylinderGeometry(r, r, Math.max(sy, 0.008), 10);
      const mat = makeMat(el.color, {}, el.category, pkgId);
      mat.metalness = 0.82; mat.roughness = 0.18;
      const total = nx * nz * tiers;
      const inst = new THREE.InstancedMesh(geo, mat, total);
      inst.castShadow = true;
      const dummy = new THREE.Object3D();
      const stepX = (sx - r*2) / Math.max(1, nx-1);
      const stepZ = (sz - r*2) / Math.max(1, nz-1);
      let idx = 0;
      for (let t=0; t<tiers; t++){
        for (let i=0; i<nx; i++){
          for (let k=0; k<nz; k++){
            dummy.position.set(-sx/2+r+i*stepX, t*yStep, -sz/2+r+k*stepZ);
            dummy.updateMatrix();
            inst.setMatrixAt(idx++, dummy.matrix);
          }
        }
      }
      inst.count = idx;
      inst.instanceMatrix.needsUpdate = true;
      group.add(inst);
      return group;
    }

    case 'tsvArray': {
      // vertical cylinders penetrating a layer
      const group = new THREE.Group();
      group.position.set(px, py, pz);
      const nx = opts.nx || 6, nz = opts.nz || 5, r = opts.r || 0.03, h = opts.h || sy;
      const geo = new THREE.CylinderGeometry(r, r, h, 12);
      const mat = makeMat(el.color, {}, el.category, pkgId);
      mat.metalness = 0.88; mat.roughness = 0.16;
      const inst = new THREE.InstancedMesh(geo, mat, nx*nz);
      inst.castShadow = true;
      const dummy = new THREE.Object3D();
      const marginX = sx*0.15, marginZ = sz*0.15;
      const usableX = sx - 2*marginX;
      const usableZ = sz - 2*marginZ;
      const stepX = usableX / Math.max(1, nx-1);
      const stepZ = usableZ / Math.max(1, nz-1);
      let idx = 0;
      for (let i=0; i<nx; i++){
        for (let k=0; k<nz; k++){
          const x = -usableX/2 + i*stepX, z = -usableZ/2 + k*stepZ;
          const skip = opts.skipRect || opts.skipCenter;
          if (skip && Math.abs(x) < skip.x/2 && Math.abs(z) < skip.z/2) continue;
          dummy.position.set(x, 0, z);
          dummy.updateMatrix();
          inst.setMatrixAt(idx++, dummy.matrix);
        }
      }
      inst.count = idx;
      inst.instanceMatrix.needsUpdate = true;
      group.add(inst);
      return group;
    }

    case 'hbmStack': {
      const group = new THREE.Group();
      group.position.set(px, py, pz);
      const n = opts.layers || 8;
      const dieH = 0.05;
      const gap = 0.005;
      // base logic die (slightly wider/darker)
      const baseGeo = new THREE.BoxGeometry(sx*1.02, 0.09, sz*1.02);
      const baseMat = makeMat('#5a1e1e', {}, 'Active Die', pkgId);
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0;
      base.castShadow = base.receiveShadow = true;
      group.add(base);
      // stacked DRAM dies
      for (let i=0; i<n; i++){
        const gg = new THREE.BoxGeometry(sx, dieH, sz);
        const m = makeMat(el.color, {}, el.category, pkgId);
        m.roughness = 0.35; m.metalness = 0.08;
        const mesh = new THREE.Mesh(gg, m);
        mesh.position.y = 0.09/2 + dieH/2 + (dieH+gap)*i;
        mesh.castShadow = mesh.receiveShadow = true;
        // subtle edge
        const ed = new THREE.EdgesGeometry(gg, 30);
        mesh.add(new THREE.LineSegments(ed, new THREE.LineBasicMaterial({
          color: 0x0a0a0a, transparent:true, opacity:0.3,
          clippingPlanes: renderer.clippingPlanes
        })));
        group.add(mesh);
      }
      return group;
    }

    case 'stackedDram': {
      const group = new THREE.Group();
      group.position.set(px, py, pz);
      const n = opts.n || 8;
      const dieH = sy;
      const gap = opts.gap || 0.01;
      for (let i=0; i<n; i++){
        const gg = new THREE.BoxGeometry(sx, dieH, sz);
        const m = makeMat(el.color, {}, el.category, pkgId);
        const mesh = new THREE.Mesh(gg, m);
        mesh.position.y = i * (dieH + gap);
        mesh.castShadow = mesh.receiveShadow = true;
        const ed = new THREE.EdgesGeometry(gg, 30);
        mesh.add(new THREE.LineSegments(ed, new THREE.LineBasicMaterial({
          color: 0x0a0a0a, transparent:true, opacity:0.35,
          clippingPlanes: renderer.clippingPlanes
        })));
        group.add(mesh);
      }
      return group;
    }

    case 'moldCap': {
      // Transparent mold that hangs above the interposer showing where EMC sits
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      const mesh = new THREE.Mesh(geo, makeMat(el.color, opts, el.category, pkgId));
      mesh.position.set(px, py, pz);
      const ed = new THREE.EdgesGeometry(geo, 30);
      mesh.add(new THREE.LineSegments(ed, new THREE.LineBasicMaterial({
        color: 0x0a0a0a, transparent:true, opacity:0.18,
        clippingPlanes: renderer.clippingPlanes
      })));
      return mesh;
    }

    case 'lid': {
      // Metal lid: box with hollow inside (represented as flat plate + optional ring done separately)
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      const mat = makeMat(el.color, opts, el.category, pkgId);
      mat.metalness = 0.85; mat.roughness = 0.18;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(px, py, pz);
      const ed = new THREE.EdgesGeometry(geo, 30);
      mesh.add(new THREE.LineSegments(ed, new THREE.LineBasicMaterial({
        color: 0x1a1a17, transparent:true, opacity:0.35,
        clippingPlanes: renderer.clippingPlanes
      })));
      return mesh;
    }

    case 'ring': {
      // Rectangular ring (for adhesive around die)
      const shape = new THREE.Shape();
      shape.moveTo(-sx/2, -sz/2);
      shape.lineTo(sx/2, -sz/2);
      shape.lineTo(sx/2, sz/2);
      shape.lineTo(-sx/2, sz/2);
      shape.lineTo(-sx/2, -sz/2);
      const hole = new THREE.Path();
      const inX = sx*0.55, inZ = sz*0.55;
      hole.moveTo(-inX/2, -inZ/2);
      hole.lineTo(inX/2, -inZ/2);
      hole.lineTo(inX/2, inZ/2);
      hole.lineTo(-inX/2, inZ/2);
      hole.lineTo(-inX/2, -inZ/2);
      shape.holes.push(hole);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: sy, bevelEnabled:false });
      geo.rotateX(-Math.PI/2);
      geo.translate(0, sy, 0);
      const mesh = new THREE.Mesh(geo, makeMat(el.color, {}, el.category, pkgId));
      mesh.position.set(px, py-sy/2, pz);
      mesh.castShadow = true;
      return mesh;
    }

    case 'boxes': {
      // Several boxes that form ONE component (e.g. 8 optical engines, 2 HBM
      // stacks, PCB halves). opts.items: [{ p:[dx,dy,dz], s:[sx,sy,sz]?, rot:[rx,ry,rz]?, color? }]
      // Each item's size defaults to geo.size; positions are relative to geo.pos.
      const group = new THREE.Group();
      group.position.set(px, py, pz);
      (opts.items || []).forEach(it => {
        const s = it.s || [sx, sy, sz];
        const geo = new THREE.BoxGeometry(s[0], s[1], s[2]);
        const itOpts = it.opacity != null ? Object.assign({}, opts, { opacity: it.opacity }) : opts;
        const mesh = new THREE.Mesh(geo, makeMat(it.color || el.color, itOpts, el.category, pkgId));
        mesh.position.set(it.p[0], it.p[1], it.p[2]);
        if (it.rot) mesh.rotation.set(it.rot[0], it.rot[1], it.rot[2]);
        mesh.castShadow = true; mesh.receiveShadow = true;
        mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({
          color: 0x1a1a17, transparent: true, opacity: 0.22, clippingPlanes: renderer.clippingPlanes
        })));
        group.add(mesh);
      });
      return group;
    }

    case 'layered': {
      // A build-up stack drawn as n thin alternating sub-layers (dielectric /
      // metal) — reads like a cross-section in a journal figure.
      const group = new THREE.Group();
      group.position.set(px, py, pz);
      const n = opts.n || 6;
      const h = sy / n;
      const alt = opts.altColor || '#c99a5b';
      for (let i = 0; i < n; i++) {
        const isMetal = i % 2 === 1;
        const geo = new THREE.BoxGeometry(sx, h * (isMetal ? 0.55 : 1), sz);
        const mesh = new THREE.Mesh(geo, makeMat(isMetal ? alt : el.color, opts, el.category, pkgId));
        mesh.position.y = -sy / 2 + h * (i + 0.5);
        mesh.castShadow = true; mesh.receiveShadow = true;
        if (i === n - 1 || i === 0) {
          mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({
            color: 0x1a1a17, transparent: true, opacity: 0.2, clippingPlanes: renderer.clippingPlanes
          })));
        }
        group.add(mesh);
      }
      return group;
    }

    case 'tubes': {
      // Fibers, light pipes, microfluidic channels. opts.paths: [[[x,y,z],...], ...]
      // (relative to geo.pos); opts.r = tube radius.
      const group = new THREE.Group();
      group.position.set(px, py, pz);
      const r = opts.r || 0.03;
      const mat = makeMat(el.color, opts, el.category, pkgId);
      if (opts.glow) { mat.emissive = new THREE.Color(el.color); mat.emissiveIntensity = 0.45; }
      (opts.paths || []).forEach(pts => {
        const v = pts.map(p => new THREE.Vector3(p[0], p[1], p[2]));
        const curve = v.length === 2
          ? new THREE.LineCurve3(v[0], v[1])
          : new THREE.CatmullRomCurve3(v, false, 'centripetal');
        const geo = new THREE.TubeGeometry(curve, Math.max(8, v.length * 12), r, 10, false);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        group.add(mesh);
      });
      return group;
    }

    default:
      return null;
  }
}

/* ============ INTERACTION ============ */
function onClick(e) {
  const hit = pick(e);
  if (hit) {
    selectElement(hit.element.id);
    if (onSelectCb) onSelectCb(hit.element);
  } else {
    selectElement(null);
    if (onSelectCb) onSelectCb(null);
  }
}

function onMove(e) {
  const hit = pick(e);
  const id = hit ? hit.element.id : null;
  if (id !== hoveredId) {
    hoveredId = id;
    updateHighlight();
  }
  if (onHoverCb) {
    if (hit) onHoverCb(hit.element, e.clientX, e.clientY);
    else onHoverCb(null, 0, 0);
  }
}

function pick(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const meshes = clickables.filter(c => !state.hidden.has(c.element.id) && c.mesh.visible).map(c => c.mesh);
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length) {
    const hitMesh = hits[0].object;
    const found = clickables.find(c => c.mesh === hitMesh || c.mesh === hitMesh.parent);
    // Traverse up to find the element mapping
    let obj = hitMesh;
    while (obj) {
      const found2 = clickables.find(c => c.mesh === obj);
      if (found2) return found2;
      obj = obj.parent;
    }
    return found;
  }
  return null;
}

function selectElement(id) {
  selectedId = id;
  updateHighlight();
}

function updateHighlight() {
  clickables.forEach(({mesh, element}) => {
    const m = mesh.material;
    if (!m) return;
    const isSel = element.id === selectedId;
    const isHov = element.id === hoveredId;
    if (isSel) {
      m.emissive = new THREE.Color('#c9a227');
      m.emissiveIntensity = 0.45;
    } else if (isHov) {
      m.emissive = new THREE.Color('#2f5a43');
      m.emissiveIntensity = 0.2;
    } else {
      if (m.userData.baseColor) {
        // preserve baseline emissive for e.g. hb-bondline glow
        const el = element;
        if (el.geo.opts && el.geo.opts.glow) {
          m.emissive = new THREE.Color(m.userData.baseColor);
          m.emissiveIntensity = 0.35;
        } else {
          m.emissive = new THREE.Color(0x000000);
          m.emissiveIntensity = 0;
        }
      }
    }
  });
  updateLabelActiveStates();
}

/* ============ CONTROLS ============ */
function setExplode(v) {
  state.explode = v;
  applyExplode();
}

function applyExplode() {
  if (!root || !currentPkg) return;
  const layers = Array.from(currentPkg._layers).sort((a,b)=>a-b);
  const midLayer = (layers[0] + layers[layers.length-1]) / 2;
  // Keep the fully exploded stack on screen: tall stacks get a smaller step.
  const span = Math.max(1, layers[layers.length-1] - layers[0]);
  const spread = state.explode * Math.min(1.4, 5.5 / span);
  root.children.forEach(obj => {
    const el = obj.userData.element;
    if (!el) return;
    const layer = obj.userData.layer;
    const baseY = obj.userData.baseY;
    obj.position.y = baseY + (layer - midLayer) * spread;
  });
}

function setSection(v) {
  state.section = v;
  applySection();
}

function applySection() {
  if (state.section <= 0.01) {
    renderer.clippingPlanes = [];
  } else {
    const cutX = 5 - state.section * 10;   // sweeps from x=5 to x=-5
    const p = new THREE.Plane(new THREE.Vector3(-1,0,0), cutX);
    renderer.clippingPlanes = [p];
  }
  // Re-assign clipping planes to all mats
  scene.traverse(o => {
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach(m=>m.clippingPlanes = renderer.clippingPlanes);
      else o.material.clippingPlanes = renderer.clippingPlanes;
    }
  });
}

function setLayerVisible(elementId, visible) {
  if (visible) state.hidden.delete(elementId);
  else state.hidden.add(elementId);
  root.children.forEach(obj => {
    const el = obj.userData.element;
    if (el && el.id === elementId) obj.visible = visible;
  });
  updateLabelVisibility();
}

function frameCamera(preset) {
  controls.target.set(0, -0.4, 0);
  const dist = 15;
  switch(preset) {
    case 'top':
      camera.position.set(0.001, dist, 0);
      break;
    case 'side':
      camera.position.set(dist, 0, 0);
      break;
    case 'front':
      camera.position.set(0, 0, dist);
      break;
    case 'iso':
    default:
      camera.position.set(9, 8, 12);
  }
  camera.zoom = 1;
  camera.updateProjectionMatrix();
  controls.update();
  fitZoom();
}

// Zoom so the whole structure fits the frame (wide structures were cropped).
function fitZoom() {
  if (!root) return;
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  root.children.forEach(o => { if (o.visible) box.expandByObject(o); });
  if (box.isEmpty()) return;
  camera.updateMatrixWorld(true);
  let m = 0;
  const v = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
    m = Math.max(m, Math.abs(v.x), Math.abs(v.y));
  }
  if (m > 0) {
    camera.zoom = Math.min(1.5, Math.max(0.4, 0.86 / m));
    camera.updateProjectionMatrix();
  }
}

/* ============ LEADER-LINE LABELS ============
   Every visible component gets a small pill label that sits just outside its
   own part on screen and is tied to it by a short leader line. Everything is
   recomputed from the 3D geometry every frame, so labels and lines travel
   with the model while you rotate, zoom, pan, explode or cut it.

   Per frame, for each component:
     1. Take its 3D bounding box (current exploded position, clipped by the
        cross-section plane) and project the 8 corners → screen rectangle.
     2. Pick the anchor: the centre of the box face that faces the camera and
        points most toward the label's side, so the dot sits on a VISIBLE
        surface rather than the hidden centre of a stacked layer.
     3. Choose a side (left/right) from where the part sits relative to the
        model centre; parts in the middle alternate sides by height so
        stacked layers split evenly.
     4. Place the pill just outside the part's own screen extent at the
        anchor's height, then push overlapping pills apart and out of the
        viewer's UI panels (title, layer list, controls, hint).
   Clicking a label behaves exactly like clicking the 3D part. */
let labelsRoot = null;
let svgEl = null;
let labelDefs = [];     // [{id, el, obj, wrap, localMin, localMax, w, h, cur}]
let pathEls = {};       // id -> <path>
let dotEls = {};        // id -> anchor <circle>

function initLabelLayer() {
  if (!labelsRoot) return;
  labelsRoot.innerHTML = '';
  svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('class', 'label-lines');
  labelsRoot.appendChild(svgEl);
  // Pill widths change once web fonts arrive — re-measure then.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { measureLabels(); });
  }
}

function rebuildLabels(pkg) {
  if (!labelsRoot || !svgEl) return;
  svgEl.innerHTML = '';
  pathEls = {}; dotEls = {};
  labelDefs.forEach(d => d.wrap.remove());
  labelDefs = [];
  Object.keys(labelSide).forEach(k => delete labelSide[k]);
  Object.keys(altSide).forEach(k => delete altSide[k]);

  // Map element id → its root child object (for live position + geometry)
  const objById = {};
  root.children.forEach(obj => {
    const el = obj.userData.element;
    if (el) objById[el.id] = obj;
  });

  pkg.elements.forEach(el => {
    const obj = objById[el.id];
    if (!obj) return;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'label-leader');
    svgEl.appendChild(path);
    pathEls[el.id] = path;

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '3');
    dot.setAttribute('class', 'label-anchor-dot');
    dot.setAttribute('fill', el.color);
    svgEl.appendChild(dot);
    dotEls[el.id] = dot;

    const wrap = document.createElement('div');
    wrap.className = 'pkg-label';
    wrap.dataset.eid = el.id;
    wrap.innerHTML = `<span class="pkg-label-dot" style="background:${el.color}"></span><span class="pkg-label-text">${escapeHtml(el.name)}</span>`;
    wrap.addEventListener('click', () => {
      selectElement(el.id);
      if (onSelectCb) onSelectCb(el);
    });
    wrap.addEventListener('pointerenter', () => { hoveredId = el.id; updateHighlight(); });
    wrap.addEventListener('pointerleave', () => { hoveredId = null; updateHighlight(); });
    labelsRoot.appendChild(wrap);

    const box = localBoxFor(obj, el);
    labelDefs.push({ id: el.id, el, obj, wrap, localMin: box.min, localMax: box.max, w: 0, h: 0, cur: null });
  });

  // Stacked parts near the model's centre alternate left/right by height,
  // so a 10-layer stack puts ~5 labels on each side instead of 10 on one.
  labelDefs
    .slice()
    .sort((a, b) => (a.localMin.y + a.obj.userData.baseY) - (b.localMin.y + b.obj.userData.baseY))
    .forEach((d, i) => { altSide[d.id] = i % 2 === 0 ? 'left' : 'right'; });

  measureLabels();
  updateLabelPositions(true);
  updateLabelActiveStates();
}

// Bounding box of a component in its own local frame (relative to obj.position).
// Box3.setFromObject() ignores per-instance offsets of InstancedMesh (ball /
// pad / TSV grids), so those fall back to the declared geo.size, which is
// what the grid builders fill.
function localBoxFor(obj, el) {
  let hasInstanced = false;
  obj.traverse(o => { if (o.isInstancedMesh) hasInstanced = true; });
  if (!hasInstanced) {
    obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj);
    if (!b.isEmpty()) {
      return { min: b.min.clone().sub(obj.position), max: b.max.clone().sub(obj.position) };
    }
  }
  const [sx, sy, sz] = el.geo.size;
  return {
    min: new THREE.Vector3(-sx / 2, -sy / 2, -sz / 2),
    max: new THREE.Vector3(sx / 2, sy / 2, sz / 2),
  };
}

function measureLabels() {
  labelDefs.forEach(d => {
    d.w = d.wrap.offsetWidth || 120;
    d.h = d.wrap.offsetHeight || 24;
  });
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

const projVec = new THREE.Vector3();
const _bmin = new THREE.Vector3();
const _bmax = new THREE.Vector3();
const _p = new THREE.Vector3();
const _toCam = new THREE.Vector3();

// Per-id side memory ('left' | 'right') — hysteresis so a label near the
// model's centre doesn't flip sides every frame while orbiting.
const labelSide = {};
const altSide = {};   // default side for parts sitting in the model's middle

const FACE_NORMALS = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
];

let _frame = 0;
let _lastLabelT = 0;

function toScreen(v, w, h, out) {
  projVec.copy(v).project(camera);
  out.x = (projVec.x + 1) / 2 * w;
  out.y = (1 - projVec.y) / 2 * h;
  out.z = projVec.z;
  return out;
}

// UI panels inside the viewer that labels must not sit under.
function obstacleRects() {
  const base = labelsRoot.getBoundingClientRect();
  const viewer = labelsRoot.parentElement;
  if (!viewer) return [];
  const sel = ['.viewer-title', '.layer-panel', '.controls', '.hint'];
  const rects = [];
  sel.forEach(s => {
    const n = viewer.querySelector(s);
    if (!n || n.offsetParent === null) return;
    const r = n.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    rects.push({ x0: r.left - base.left - 6, y0: r.top - base.top - 6, x1: r.right - base.left + 6, y1: r.bottom - base.top + 6 });
  });
  return rects;
}
let _obstacles = [];

function updateLabelPositions(snap) {
  if (!root || !camera || !renderer || !labelsRoot || labelDefs.length === 0) return;
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  if (!w || !h) return;
  svgEl.setAttribute('width', w);
  svgEl.setAttribute('height', h);
  svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);

  // Panels can collapse / reflow — refresh their rects a few times a second.
  if (snap || _frame % 15 === 0) _obstacles = obstacleRects();
  if (_frame % 90 === 0) measureLabels();
  _frame++;

  // Cross-section keeps x <= cutX (see applySection)
  const cutX = state.section > 0.01 ? 5 - state.section * 10 : Infinity;
  camera.getWorldDirection(_toCam).negate();

  // ---- 1. project every visible part ----
  const items = [];
  let mMinX = Infinity, mMaxX = -Infinity;
  labelDefs.forEach(d => {
    const obj = d.obj;
    const hidden = state.hidden.has(d.id) || !obj.visible;
    _bmin.copy(d.localMin).add(obj.position);
    _bmax.copy(d.localMax).add(obj.position);
    if (_bmax.x > cutX) _bmax.x = cutX;
    if (hidden || _bmin.x >= _bmax.x) { items.push({ d, hidden: true }); return; }

    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const s = { x: 0, y: 0, z: 0 };
    for (let i = 0; i < 8; i++) {
      _p.set(i & 1 ? _bmax.x : _bmin.x, i & 2 ? _bmax.y : _bmin.y, i & 4 ? _bmax.z : _bmin.z);
      toScreen(_p, w, h, s);
      x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x);
      y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y);
    }
    const c = new THREE.Vector3().addVectors(_bmin, _bmax).multiplyScalar(0.5);
    const half = new THREE.Vector3().subVectors(_bmax, _bmin).multiplyScalar(0.5);
    const sc = toScreen(c, w, h, { x: 0, y: 0, z: 0 });
    mMinX = Math.min(mMinX, x0); mMaxX = Math.max(mMaxX, x1);
    items.push({ d, hidden: false, c, half, sc, rect: { x0, x1, y0, y1 } });
  });

  const visible = items.filter(it => !it.hidden);
  const modelW = Math.max(1, mMaxX - mMinX);
  const modelCX = (mMinX + mMaxX) / 2;

  // ---- 2. side + anchor + desired pill position ----
  const dz = modelW * 0.08;
  visible.forEach(it => {
    const id = it.d.id;
    const dx = it.sc.x - modelCX;
    const prev = labelSide[id];
    let side;
    if (prev && Math.abs(dx) < dz * 1.8) side = prev;
    else if (dx < -dz) side = 'left';
    else if (dx > dz) side = 'right';
    else side = prev || altSide[id] || 'left';
    labelSide[id] = side;
    const sgn = side === 'left' ? -1 : 1;
    it.side = side;

    // Anchor: centre of the camera-facing face that points most toward our
    // side, nudged a little toward that side within the face.
    let best = null, bestScore = -Infinity;
    const tmp = { x: 0, y: 0, z: 0 };
    FACE_NORMALS.forEach(n => {
      const facing = n[0] * _toCam.x + n[1] * _toCam.y + n[2] * _toCam.z;
      if (facing < 0.15) return;
      _p.set(it.c.x + n[0] * it.half.x, it.c.y + n[1] * it.half.y, it.c.z + n[2] * it.half.z);
      toScreen(_p, w, h, tmp);
      const ddx = tmp.x - it.sc.x, ddy = tmp.y - it.sc.y;
      const len = Math.hypot(ddx, ddy);
      const toward = len > 0.5 ? (ddx * sgn) / len : 0;
      const score = toward + facing * 0.8;
      if (score > bestScore) { bestScore = score; best = n; }
    });
    if (!best) best = [0, 1, 0];
    const a = new THREE.Vector3(
      it.c.x + best[0] * it.half.x,
      it.c.y + best[1] * it.half.y,
      it.c.z + best[2] * it.half.z
    );
    // In-plane nudge: along whichever in-face axis moves furthest sideways on screen
    let nudgeAxis = -1, nudgeDx = 0;
    const origin = toScreen(a, w, h, { x: 0, y: 0, z: 0 });
    for (let ax = 0; ax < 3; ax++) {
      if (best[ax] !== 0) continue;
      _p.copy(a); _p.setComponent(ax, _p.getComponent(ax) + 1);
      toScreen(_p, w, h, tmp);
      const ddx = tmp.x - origin.x;
      if (Math.abs(ddx) > Math.abs(nudgeDx)) { nudgeDx = ddx; nudgeAxis = ax; }
    }
    if (nudgeAxis >= 0) {
      const halfAx = it.half.getComponent(nudgeAxis);
      const dir = Math.sign(nudgeDx) * sgn;
      a.setComponent(nudgeAxis, a.getComponent(nudgeAxis) + dir * halfAx * 0.35);
    }
    it.anchor = toScreen(a, w, h, { x: 0, y: 0, z: 0 });

    // Pill sits just outside this part's own screen extent, at the anchor's height.
    const pw = it.d.w || 120, ph = it.d.h || 24;
    const gap = 22;
    let edgeX = side === 'left'
      ? Math.min(it.rect.x0, it.anchor.x - 28) - gap
      : Math.max(it.rect.x1, it.anchor.x + 28) + gap;
    // box = pill rect (x0..x1, centre y)
    let bx0 = side === 'left' ? edgeX - pw : edgeX;
    bx0 = Math.min(Math.max(bx0, 6), w - pw - 6);
    it.box = { x0: bx0, x1: bx0 + pw, cy: it.anchor.y, h: ph };
  });

  // ---- 3. place pills without overlap ----
  // Greedy, top-to-bottom by anchor height: each pill takes the free slot
  // nearest to its anchor's height (searching up and down), never covering an
  // already placed pill or a UI panel. If a UI panel is in the way at that
  // height, the pill first tries sliding sideways past it (toward the model).
  const vGap = 4;
  const placed = [];
  const hits = (x0, x1, top, bot, r) => !(x1 <= r.x0 || x0 >= r.x1 || bot <= r.y0 || top >= r.y1);
  const tryAt = (it, cy) => {
    const B = it.box, pw = B.x1 - B.x0, hh = B.h / 2;
    if (cy - hh < 6 || cy + hh > h - 6) return null;
    let x0 = B.x0;
    for (let pass = 0; pass < 2; pass++) {
      const o = _obstacles.find(r => hits(x0, x0 + pw, cy - hh, cy + hh, r));
      if (!o) break;
      if (pass === 1) return null;
      const goRight = (o.x0 + o.x1) / 2 < modelCX;
      x0 = goRight ? o.x1 : o.x0 - pw;
      if (x0 < 6 || x0 + pw > w - 6) return null;
    }
    if (_obstacles.some(r => hits(x0, x0 + pw, cy - hh, cy + hh, r))) return null;
    const clash = placed.some(p =>
      !(x0 + pw <= p.x0 || x0 >= p.x1) && Math.abs(cy - p.cy) < (B.h + p.h) / 2 + vGap);
    return clash ? null : { x0, x1: x0 + pw, cy, h: B.h };
  };
  visible
    .slice()
    .sort((a, b) => a.anchor.y - b.anchor.y)
    .forEach(it => {
      let slot = null;
      for (let k = 0; k < 600 && !slot; k++) {
        const off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 2;
        slot = tryAt(it, it.box.cy + off);
      }
      if (slot) it.box = slot;
      placed.push(it.box);
    });

  // ---- 4. write to DOM (light smoothing so re-ordering doesn't jump) ----
  // Time-based (not per-frame) easing so slow devices don't lag behind.
  const now = performance.now();
  const dt = _lastLabelT ? Math.min(200, now - _lastLabelT) : 16;
  _lastLabelT = now;
  const k = snap ? 1 : 1 - Math.exp(-dt / 45);
  items.forEach(it => {
    const d = it.d;
    const path = pathEls[d.id], dot = dotEls[d.id];
    if (it.hidden) {
      d.wrap.style.display = 'none';
      if (path) path.setAttribute('d', '');
      if (dot) dot.style.display = 'none';
      d.cur = null;
      return;
    }
    const B = it.box;
    if (!d.cur || snap) d.cur = { x0: B.x0, cy: B.cy };
    else {
      d.cur.x0 += (B.x0 - d.cur.x0) * k;
      d.cur.cy += (B.cy - d.cur.cy) * k;
    }
    const pw = B.x1 - B.x0;
    d.wrap.style.display = 'flex';
    d.wrap.style.left = d.cur.x0 + 'px';
    d.wrap.style.right = 'auto';
    d.wrap.style.top = d.cur.cy + 'px';
    d.wrap.classList.toggle('side-left', it.side === 'left');
    d.wrap.classList.toggle('side-right', it.side === 'right');

    // Leader: anchor → short horizontal tail into the near edge of the pill
    const ax = it.anchor.x, ay = it.anchor.y;
    const ex = it.side === 'left' ? d.cur.x0 + pw : d.cur.x0;
    const tail = it.side === 'left' ? 10 : -10;
    if (path) path.setAttribute('d', `M ${ax},${ay} L ${ex + tail},${d.cur.cy} L ${ex},${d.cur.cy}`);
    if (dot) {
      dot.setAttribute('cx', ax);
      dot.setAttribute('cy', ay);
      dot.style.display = 'block';
    }
  });
}

function updateLabelActiveStates() {
  labelDefs.forEach(d => {
    d.wrap.classList.toggle('active', d.id === selectedId);
    d.wrap.classList.toggle('hovered', d.id === hoveredId);
  });
}

function updateLabelVisibility() {
  updateLabelPositions();
}

window.PkgScene = {
  init, loadPackage,
  setExplode, setSection, setLayerVisible, frameCamera,
  selectElement,
  resize: onResize,
  getState: ()=>state
};
})();
