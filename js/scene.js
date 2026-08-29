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
  'Adhesive':            { metalness: 0.0,  roughness: 0.85 }
};
const DEFAULT_MATERIAL = { metalness: 0.15, roughness: 0.55 };

function materialPresetFor(category, pkgId) {
  if (category === 'Substrate' && pkgId === 'glass') {
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
  renderer.toneMappingExposure = 1.08;

  scene = new THREE.Scene();

  // Tighter isometric orthographic camera — bigger object presence, less dead space
  const aspect = canvasEl.clientWidth / canvasEl.clientHeight;
  const d = 4.6;
  camera = new THREE.OrthographicCamera(-d*aspect, d*aspect, d, -d, 0.1, 100);
  camera.position.set(9, 8, 12);
  camera.lookAt(0, -0.4, 0);

  // ============ STUDIO-STYLE LIGHTING ============
  // Soft sky/ground bounce (fills shadows softly, avoids flat/dark look)
  const hemi = new THREE.HemisphereLight(0xf6f5f1, 0xd9d4c8, 0.55);
  scene.add(hemi);
  // Gentle ambient to lift blacks (subtle AO-like fill)
  const ambient = new THREE.AmbientLight(0xffffff, 0.28);
  scene.add(ambient);
  // Key light: large soft shadows
  const key = new THREE.DirectionalLight(0xfff8ee, 1.35);
  key.position.set(7, 13, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -9; key.shadow.camera.right = 9;
  key.shadow.camera.top = 9; key.shadow.camera.bottom = -9;
  key.shadow.camera.near = 1; key.shadow.camera.far = 30;
  key.shadow.radius = 5;
  key.shadow.bias = -0.0006;
  scene.add(key);
  // Fill light: cool, opposite side, low intensity — softens shadow contrast
  const fill = new THREE.DirectionalLight(0xdfe8f2, 0.42);
  fill.position.set(-9, 6, -7);
  scene.add(fill);
  // Rim light: subtle warm backlight for edge definition / "premium" separation
  const rim = new THREE.DirectionalLight(0xffe9cf, 0.30);
  rim.position.set(-4, 4, -10);
  scene.add(rim);

  // Soft studio floor: faint shadow-catcher + radial vignette falloff (canvas texture)
  const groundGeo = new THREE.PlaneGeometry(30, 30);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.16 });
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
  scene.add(vignette);

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

  applyExplode();
  applySection();
  frameCamera('iso');
  rebuildLabels(pkg);
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
          dummy.position.set(-usableX/2 + i*stepX, 0, -usableZ/2 + k*stepZ);
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
      m.emissive = new THREE.Color('#d4a017');
      m.emissiveIntensity = 0.45;
    } else if (isHov) {
      m.emissive = new THREE.Color('#7a2e1f');
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
  const spread = state.explode * 1.4;
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
}

/* ============ LEADER-LINE LABELS ============
   For every visible component, draw a small pill label on the left/right
   edge of the viewport, connected to its 3D anchor point by an elbow leader
   line (SVG). Clicking a label behaves exactly like clicking the 3D part. */
let labelsRoot = null;
let svgEl = null;
let labelDefs = [];     // [{id, name, color, wrap, textEl}]
let pathEls = {};       // id -> <path>
let dotEls = {};        // id -> anchor <circle>

function initLabelLayer() {
  if (!labelsRoot) return;
  labelsRoot.innerHTML = '';
  svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('class', 'label-lines');
  labelsRoot.appendChild(svgEl);
}

function rebuildLabels(pkg) {
  if (!labelsRoot || !svgEl) return;
  svgEl.innerHTML = '';
  pathEls = {}; dotEls = {};
  labelDefs.forEach(d => d.wrap.remove());
  labelDefs = [];
  Object.keys(labelSide).forEach(k => delete labelSide[k]);

  pkg.elements.forEach(el => {
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
    labelDefs.push({ id: el.id, name: el.name, color: el.color, wrap });
  });

  updateLabelPositions();
  updateLabelActiveStates();
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

const projVec = new THREE.Vector3();

// Per-id side memory ('left' | 'right'), used as hysteresis so a label near
// the screen's vertical centerline doesn't flip left/right every frame while
// orbiting the camera (that flipping was part of what looked like "flicker").
const labelSide = {};

function updateLabelPositions() {
  if (!root || !camera || !renderer || !labelsRoot || labelDefs.length === 0) return;
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  if (!w || !h) return;
  svgEl.setAttribute('width', w);
  svgEl.setAttribute('height', h);
  svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);

  // Compute anchor screen coords for each element
  const anchors = [];
  root.children.forEach(obj => {
    const el = obj.userData.element;
    if (!el) return;
    if (state.hidden.has(el.id)) return;
    projVec.copy(obj.position);
    projVec.project(camera);
    const x = (projVec.x + 1) / 2 * w;
    const y = (1 - projVec.y) / 2 * h;
    anchors.push({ id: el.id, x, y, behind: projVec.z > 1 });
  });

  const leftBendX = Math.max(150, w * 0.18);
  const rightBendX = w - Math.max(150, w * 0.18);
  const midX = w / 2;
  const hysteresis = 40; // px of "dead zone" around center before a label switches sides

  anchors.forEach(a => {
    const prevSide = labelSide[a.id];
    if (!prevSide) {
      labelSide[a.id] = a.x < midX ? 'left' : 'right';
    } else if (prevSide === 'left' && a.x > midX + hysteresis) {
      labelSide[a.id] = 'right';
    } else if (prevSide === 'right' && a.x < midX - hysteresis) {
      labelSide[a.id] = 'left';
    }
    a.side = labelSide[a.id];
  });

  const left = anchors.filter(a => a.side === 'left').sort((a, b) => a.y - b.y);
  const right = anchors.filter(a => a.side === 'right').sort((a, b) => a.y - b.y);

  distributeLabelY(left, h);
  distributeLabelY(right, h);

  [...left, ...right].forEach(a => {
    const side = a.side;
    const bendX = side === 'left' ? leftBendX : rightBendX;
    const wrap = labelDefs.find(d => d.id === a.id);
    if (wrap) {
      wrap.wrap.style.display = a.behind ? 'none' : 'flex';
      wrap.wrap.style.top = a.labelY + 'px';
      if (side === 'left') {
        wrap.wrap.style.right = (w - bendX + 8) + 'px';
        wrap.wrap.style.left = 'auto';
        wrap.wrap.classList.add('side-left');
        wrap.wrap.classList.remove('side-right');
      } else {
        wrap.wrap.style.left = (bendX + 8) + 'px';
        wrap.wrap.style.right = 'auto';
        wrap.wrap.classList.add('side-right');
        wrap.wrap.classList.remove('side-left');
      }
    }
    const path = pathEls[a.id];
    const dot = dotEls[a.id];
    if (path) {
      // Small vertical elbow before the horizontal run makes the line easier to
      // trace back to its pill when many labels are stacked closely.
      path.setAttribute('d', a.behind ? '' : `M ${a.x},${a.y} L ${bendX},${a.y} L ${bendX},${a.labelY}`);
    }
    if (dot) {
      dot.setAttribute('cx', a.x);
      dot.setAttribute('cy', a.y);
      dot.style.display = a.behind ? 'none' : 'block';
    }
  });
}

function getLabelPillHeight() {
  // Measure the ACTUAL rendered height of a label pill (font-size/padding are
  // fixed in CSS, so any existing pill is representative). Falls back to a
  // generous estimate if nothing is in the DOM yet.
  const sample = labelsRoot && labelsRoot.querySelector('.pkg-label');
  const h = sample ? sample.getBoundingClientRect().height : 0;
  return h > 0 ? h : 26;
}

function distributeLabelY(list, height) {
  if (!list.length) return;
  // Gap = full pill height + fixed breathing room, so pills never touch or
  // overlap even when many anchors land at nearly the same screen Y (common
  // for stacked package layers). No compression is ever applied afterwards —
  // if everything doesn't fit within the margins, the whole stack is allowed
  // to spill upward past the top margin rather than squeezing labels together.
  const minGap = getLabelPillHeight() + 14;
  const margin = 18;

  list[0].labelY = Math.min(Math.max(list[0].y, margin), height - margin);
  for (let i = 1; i < list.length; i++) {
    const natural = Math.min(Math.max(list[i].y, margin), height - margin);
    list[i].labelY = Math.max(natural, list[i - 1].labelY + minGap);
  }

  // If the stack overflows past the bottom margin, shift the WHOLE stack up
  // (allowed to go above the top margin — "push up" is fine per design intent).
  const bottomOverflow = list[list.length - 1].labelY - (height - margin);
  if (bottomOverflow > 0) {
    list.forEach(a => { a.labelY -= bottomOverflow; });
  }
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
