// Application × Packaging Technology data
// Source: Mahajan et al., "Applications driving advanced packaging",
// Nature Reviews Electrical Engineering 3, 254–263 (2026), pp.255–262.
// Structure: for each application domain — system demand, packaging response,
// physical bottleneck, and roadmap/research target (matches the paper's framing),
// plus a link to the closest matching structures in the 3D Explorer.

window.APPLICATIONS = [
  {
    id: 'ai-hpc',
    name: 'AI / HPC',
    color: '#1F4E79',
    tagline: 'Compute and memory demand → packaging response',
    diagram: {
      caption: 'Off-package memory (cm-scale wiring) vs. co-packaged memory (sub-mm wiring)',
      before: {
        label: 'Off-package memory',
        note: 'cm-scale wiring → high latency and energy',
        stack: ['PCB', 'Package substrate', 'GPU / CPU', '← cm-scale traces →', 'DRAM (off-package)']
      },
      after: {
        label: 'Co-packaged memory (HI)',
        note: 'sub-mm wiring → lower latency and energy',
        stack: ['Package substrate', 'Silicon interposer / bridge', 'GPU / CPU', 'HBM stack (TSV)']
      }
    },
    quadrants: {
      demand: [
        'Compute demand doubling roughly every 3 months (2026)',
        'Memory capacity and bandwidth dominate system power',
        'Package power heading toward multi-kilowatt'
      ],
      response: [
        'GPU / CPU and HBM integrated in a single package',
        'Planar + vertical integration with very short links',
        'Voltage regulation moved inside the package'
      ],
      bottleneck: [
        'Memory wall — DRAM cell density has plateaued near 10 nm',
        'Power density and intra-stack thermal resistance',
        'PDN loss on the board; fine-pitch electromigration risk'
      ],
      roadmap: [
        'Pitch, bandwidth, and energy-per-bit scaling targets',
        '48 V → 1 V in-package conversion at ~90% efficiency',
        'Liquid / two-phase cooling with thermal co-design'
      ]
    },
    recommendedPackages: ['cowos', 'hybrid', 'hbm'],
    source: 'Mahajan et al. (2026), pp.256, 258–260 — AI energy, interconnect, power, and thermal sections.'
  },
  {
    id: 'smartphone',
    name: 'Smartphone',
    color: '#2E6B33',
    tagline: 'Volume constraint → packaging response',
    diagram: {
      caption: 'Each generation adds new blocks into the same electronics envelope — while total thickness must not grow',
      before: {
        label: 'Electronics envelope (< 1 mm)',
        note: 'Display · Battery · PCB share the same footprint',
        stack: ['Display', 'Processor die', 'RDL', 'Stacked memory (PoP) in epoxy mold', 'PCB', 'Battery']
      },
      after: {
        label: 'Added every upgrade cycle',
        note: 'while thickness stays constant or shrinks',
        stack: ['5G antennas × 5', 'Multiple modems', 'Power delivery', 'Cameras, sensors']
      }
    },
    quadrants: {
      demand: [
        'New functions added every upgrade cycle',
        'Larger battery for longer time between charges',
        'Constant or thinner overall form factor'
      ],
      response: [
        'Processor + RDL + stacked memory compressed under 1 mm',
        'Compact System-in-Package (SiP) with epoxy molding',
        'Up to five antennas and multiple modems for 5G'
      ],
      bottleneck: [
        'Severe volumetric envelope for all electronics',
        'Complex low-power power-delivery network (PDN) with switching transients',
        'Local thermal density inside a sealed body'
      ],
      roadmap: [
        'Higher integration density and further miniaturization',
        'Compact power conditioning with low quiescent power',
        'Cost and manufacturability at very high volume'
      ]
    },
    recommendedPackages: ['fowlp'],
    source: 'Mahajan et al. (2026), pp.256–257 (Smartphones), p.259 (low-power electronics).'
  },
  {
    id: '5g-6g',
    name: '5G / 6G',
    color: '#A66B00',
    tagline: 'mmWave and sub-THz → packaging response',
    diagram: {
      caption: 'Same 50 mm of board width — every array element still needs its own PA / LNA / filter behind it, so the parts must go vertical as frequency rises',
      before: {
        label: '3 GHz (4G / 5G low band)',
        note: 'λ/2 = 50 mm → 2 antenna elements',
        stack: ['Antenna element', 'Antenna element']
      },
      after: {
        label: '140 GHz (6G)',
        note: 'λ/2 = 1.07 mm → 47 antenna elements, stacked vertically',
        stack: ['47× antenna elements (vertical stack)', 'PA / LNA / filter per element', 'RF IC']
      }
    },
    quadrants: {
      demand: [
        'mmWave and sub-THz spectrum (100–300 GHz for 6G)',
        'Beamforming with dense phased arrays',
        'Front-end must support more than 20 bands'
      ],
      response: [
        'Antenna-in-package up to 60 GHz, on-chip above that',
        'RF IC + filters + PA / LNA co-integration',
        'Vertical element stacking at 140 GHz (λ/2 = 1.07 mm)'
      ],
      bottleneck: [
        'High propagation and insertion loss at mmWave/sub-THz',
        'Element spacing must be below half-wavelength',
        'Coupled electrical–thermal–mechanical behavior'
      ],
      roadmap: [
        'Low-insertion-loss multilayer substrates',
        'Finer feature size and tighter alignment accuracy',
        'Circuit–package–module multiphysics co-design'
      ]
    },
    recommendedPackages: ['fowlp'],
    source: 'Mahajan et al. (2026), pp.257–258 — 5G/6G cellular communications devices.'
  },
  {
    id: 'aerospace',
    name: 'Aerospace / Harsh',
    color: '#7B3F61',
    tagline: 'SWaP and lifetime → packaging response',
    diagram: {
      caption: 'Low volume · high product mix · long lifecycle — commercial parts must be re-validated before they can fly',
      before: {
        label: 'Commercial HI platform',
        note: 'Same building blocks as AI/HPC, mobile, 5G/6G',
        stack: ['Commercial HI platform']
      },
      after: {
        label: 'Deploy',
        note: 'Customize for mission → qualify in harsh lab environment → deploy',
        stack: ['Customize for mission', 'Qualify in harsh lab environment', 'Deploy: LEO satellite, radar, sensing']
      }
    },
    quadrants: {
      demand: [
        'Size, weight, and power (SWaP) constraints',
        'Security and very high reliability',
        'Long lifecycle, low volume, high product mix'
      ],
      response: [
        'Commercial HI platform used as the base',
        'Customized and hardened for the mission',
        'Compact compute, RF, and sensing in one package'
      ],
      bottleneck: [
        'Qualification across extreme use environments',
        'Material and interface mismatch over long service life',
        'Low production volume limits learning and yield data'
      ],
      roadmap: [
        'Environment-specific validation procedures',
        'Reliability test vehicles for advanced packages',
        'Qualification and readiness roadmap for HI'
      ]
    },
    recommendedPackages: ['chiplet', 'flipchip'],
    source: 'Mahajan et al. (2026), p.258 — HI devices for aerospace and harsh environments.'
  }
];

// Application × Packaging-building-block matrix (from the summary slide).
// level: 'essential' | 'relevant' | 'blank'
window.APP_MATRIX = {
  columns: [
    { id: 'ai-hpc',    name: 'AI / HPC',           color: '#1F4E79' },
    { id: 'smartphone',name: 'Smartphone',          color: '#2E6B33' },
    { id: '5g-6g',     name: '5G / 6G',             color: '#A66B00' },
    { id: 'aerospace', name: 'Aerospace / harsh',   color: '#7B3F61' }
  ],
  rows: [
    {
      block: '2.5D interposer / Si bridge (EMIB)',
      linkedPackages: ['cowos', 'chiplet'],
      values: { 'ai-hpc':'essential', 'smartphone':'relevant', '5g-6g':'relevant', 'aerospace':'relevant' }
    },
    {
      block: '3D die stacking + HBM (TSV)',
      linkedPackages: ['hbm', 'hybrid'],
      values: { 'ai-hpc':'essential', 'smartphone':'relevant', '5g-6g':'relevant', 'aerospace':'relevant' }
    },
    {
      block: 'Hybrid bonding (sub-10 µm pitch)',
      linkedPackages: ['hybrid'],
      values: { 'ai-hpc':'essential', 'smartphone':'relevant', '5g-6g':'blank', 'aerospace':'blank' }
    },
    {
      block: 'Fan-out / RDL / compact SiP',
      linkedPackages: ['fowlp'],
      values: { 'ai-hpc':'relevant', 'smartphone':'essential', '5g-6g':'essential', 'aerospace':'relevant' }
    },
    {
      block: 'Antenna-in-package / on-chip',
      linkedPackages: [],
      values: { 'ai-hpc':'blank', 'smartphone':'essential', '5g-6g':'essential', 'aerospace':'relevant' }
    },
    {
      block: 'In-package power delivery (GaN VRM)',
      linkedPackages: [],
      values: { 'ai-hpc':'essential', 'smartphone':'essential', '5g-6g':'relevant', 'aerospace':'relevant' }
    },
    {
      block: 'Advanced cooling (liquid / 2-phase)',
      linkedPackages: [],
      values: { 'ai-hpc':'essential', 'smartphone':'relevant', '5g-6g':'relevant', 'aerospace':'relevant' }
    }
  ],
  legend: {
    essential: 'Essential enabler',
    relevant: 'Relevant / secondary',
    blank: 'Not emphasized in the source'
  },
  source: 'Mahajan et al., Nature Rev. Electr. Eng. 3, 254–263 (2026), pp.255–261.'
};

// Overarching roadmap framework (from the closing slide) — shown as an intro strip.
window.APP_FRAMEWORK = [
  { step: 1, title: 'Application environment', detail: 'AI/HPC, mobile, 5G/6G, aerospace', sub: 'System-level demand' },
  { step: 2, title: 'Target attributes', detail: 'Bandwidth, energy, pitch, power density, cost', sub: 'Quantify future targets' },
  { step: 3, title: 'Building blocks', detail: 'Interconnect, photonics, power, thermal, reliability', sub: 'Technology response' },
  { step: 4, title: 'Co-design', detail: 'Chip ↔ package ↔ system (electrical, thermal, mechanical, test)', sub: '' },
  { step: 5, title: 'Models + metrology', detail: 'Multiphysics, multiscale, reduced-order, digital twin', sub: 'Predict and validate' },
  { step: 6, title: 'Research targets', detail: 'Materials, process, equipment, design, manufacturing', sub: 'Measurable R&D goals' }
];
