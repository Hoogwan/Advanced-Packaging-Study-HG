// Three.js scene builder for Advanced Packaging viewer
// Exposes window.PkgScene with init(), loadPackage(pkg), and controls

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

/* ============ INIT ============ */
function init(canvasEl, callbacks) {
  onSelectCb = callbacks.onSelect;
  onHoverCb = callbacks.onHover;

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;

  scene = new THREE.Scene();

  // Isometric-ish orthographic camera
  const aspect = canvasEl.clientWidth / canvasEl.clientHeight;
  const d = 6;
  camera = new THREE.OrthographicCamera(-d*aspect, d*aspect, d, -d, 0.1, 100);
  camera.position.set(9, 8, 12);
  camera.lookAt(0, -0.5, 0);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(8, 15, 10);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.left = -10; dir.shadow.camera.right = 10;
  dir.shadow.camera.top = 10; dir.shadow.camera.bottom = -10;
  scene.add(dir);
  const fill = new THREE.DirectionalLight(0xdde5ee, 0.35);
  fill.position.set(-8, 6, -6);
  scene.add(fill);

  // Ground plane for shadow (barely visible)
  const groundGeo = new THREE.PlaneGeometry(30, 30);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.10 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -2.5;
  ground.receiveShadow = true;
  scene.add(ground);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, -0.5, 0);
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
  canvasEl.addEventListener('pointerleave', ()=>{ hoveredId = null; if(onHoverCb) onHoverCb(null,0,0); });
  window.addEventListener('resize', onResize);

  animate();
  onResize();
}

function onResize() {
  const canvas = renderer.domElement;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  const aspect = w/h;
  const d = 6;
  camera.left = -d*aspect;
  camera.right = d*aspect;
  camera.top = d;
  camera.bottom = -d;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
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
    const mesh = buildElement(el);
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
function makeMat(color, opts) {
  opts = opts || {};
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.55,
    metalness: 0.15,
    transparent: opts.opacity !== undefined,
    opacity: opts.opacity !== undefined ? opts.opacity : 1,
    side: opts.side || THREE.FrontSide,
    clippingPlanes: renderer.clippingPlanes,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  });
  if (opts.glow) {
    mat.emissive = new THREE.Color(color);
    mat.emissiveIntensity = 0.35;
  }
  mat.userData.baseColor = color;
  mat.userData.baseOpacity = mat.opacity;
  return mat;
}

function buildElement(el) {
  const g = el.geo;
  const opts = g.opts || {};
  const [sx, sy, sz] = g.size;
  const [px, py, pz] = g.pos;

  switch(g.type) {
    case 'box': {
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      const mesh = new THREE.Mesh(geo, makeMat(el.color, opts));
      mesh.position.set(px, py, pz);
      mesh.castShadow = true; mesh.receiveShadow = true;
      // subtle outline
      const edges = new THREE.EdgesGeometry(geo, 30);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
        color: 0x1a1a17, transparent:true, opacity: 0.25,
        clippingPlanes: renderer.clippingPlanes
      }));
      mesh.add(line);
      return mesh;
    }

    case 'ballGrid': {
      const group = new THREE.Group();
      group.position.set(px, py, pz);
      const nx = opts.nx || 10, nz = opts.nz || 10, r = opts.r || 0.1;
      const marginX = sx - r*2*nx > 0 ? (sx - r*2*nx) / (nx+1) : 0;
      const marginZ = sz - r*2*nz > 0 ? (sz - r*2*nz) / (nz+1) : 0;
      const stepX = (sx - r*2) / Math.max(1, nx-1);
      const stepZ = (sz - r*2) / Math.max(1, nz-1);
      const startX = -sx/2 + r;
      const startZ = -sz/2 + r;
      const geo = new THREE.SphereGeometry(r, 12, 8);
      const mat = makeMat(el.color, {});
      mat.metalness = 0.55; mat.roughness = 0.3;
      // Use instanced mesh for perf
      let count = nx * nz;
      // skipRect: remove balls in center region (for bridge-carve-out)
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
      const mat = makeMat(el.color, {});
      mat.metalness = 0.7; mat.roughness = 0.25;
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
      const mat = makeMat(el.color, {});
      mat.metalness = 0.8; mat.roughness = 0.2;
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
      const baseMat = makeMat('#5a1e1e', {});
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0;
      base.castShadow = base.receiveShadow = true;
      group.add(base);
      // stacked DRAM dies
      for (let i=0; i<n; i++){
        const g = new THREE.BoxGeometry(sx, dieH, sz);
        const m = makeMat(el.color, {});
        m.roughness = 0.6;
        const mesh = new THREE.Mesh(g, m);
        mesh.position.y = 0.09/2 + dieH/2 + (dieH+gap)*i;
        mesh.castShadow = mesh.receiveShadow = true;
        // subtle edge
        const ed = new THREE.EdgesGeometry(g, 30);
        mesh.add(new THREE.LineSegments(ed, new THREE.LineBasicMaterial({
          color: 0x0a0a0a, transparent:true, opacity:0.35,
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
        const g = new THREE.BoxGeometry(sx, dieH, sz);
        const m = makeMat(el.color, {});
        const mesh = new THREE.Mesh(g, m);
        mesh.position.y = i * (dieH + gap);
        mesh.castShadow = mesh.receiveShadow = true;
        const ed = new THREE.EdgesGeometry(g, 30);
        mesh.add(new THREE.LineSegments(ed, new THREE.LineBasicMaterial({
          color: 0x0a0a0a, transparent:true, opacity:0.4,
          clippingPlanes: renderer.clippingPlanes
        })));
        group.add(mesh);
      }
      return group;
    }

    case 'moldCap': {
      // Transparent mold that hangs above the interposer showing where EMC sits
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      const mesh = new THREE.Mesh(geo, makeMat(el.color, opts));
      mesh.position.set(px, py, pz);
      const ed = new THREE.EdgesGeometry(geo, 30);
      mesh.add(new THREE.LineSegments(ed, new THREE.LineBasicMaterial({
        color: 0x0a0a0a, transparent:true, opacity:0.2,
        clippingPlanes: renderer.clippingPlanes
      })));
      return mesh;
    }

    case 'lid': {
      // Metal lid: box with hollow inside (represented as flat plate + optional ring done separately)
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      const mat = makeMat(el.color, opts);
      mat.metalness = 0.75; mat.roughness = 0.25;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(px, py, pz);
      const ed = new THREE.EdgesGeometry(geo, 30);
      mesh.add(new THREE.LineSegments(ed, new THREE.LineBasicMaterial({
        color: 0x1a1a17, transparent:true, opacity:0.4,
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
      const mesh = new THREE.Mesh(geo, makeMat(el.color, {}));
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
    // Cut from +X side moving toward -X
    // Plane normal (-1, 0, 0), constant = right-x-limit
    const cutX = 5 - state.section * 10;   // sweeps from x=5 to x=-5
    const plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), cutX * -1 + cutX);
    // Actually: Plane defined by n·p + d = 0. keep p where n·p + d >= 0
    // We want to keep points where x <= cutX, i.e., -x >= -cutX -> n=(-1,0,0), d = -(-cutX) = cutX... let's use simpler
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
}

function frameCamera(preset) {
  controls.target.set(0, -0.5, 0);
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

window.PkgScene = {
  init, loadPackage,
  setExplode, setSection, setLayerVisible, frameCamera,
  selectElement,
  getState: ()=>state
};
})();
