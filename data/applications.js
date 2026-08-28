// Application × Packaging Technology — condensed for a visual dashboard.
// Every string here is short by design (chip/label length, not sentences).

window.APPLICATIONS = [
  {
    id: 'ai-hpc',
    name: 'AI / HPC',
    icon: 'fa-microchip',
    color: '#1F4E79',
    tagline: 'Compute & memory, fused into one package',
    diagram: {
      from: { label: 'Off-package memory', chips: ['GPU / CPU', 'cm-scale traces', 'DRAM'] },
      to:   { label: 'Co-packaged memory', chips: ['GPU / CPU', 'Si interposer', 'HBM stack'] }
    },
    quadrants: {
      demand:     ['Compute demand ×2 / 3mo', 'Memory-bound power budget', 'Multi-kW packages'],
      response:   ['GPU + HBM, one package', 'Ultra-short vertical links', 'VRM moved in-package'],
      bottleneck: ['Memory wall (~10nm)', 'Stack thermal resistance', 'Fine-pitch EM risk'],
      roadmap:    ['Higher bandwidth / bit', '48V→1V in-package, 90%η', 'Two-phase liquid cooling']
    },
    recommendedPackages: ['cowos', 'hybrid', 'hbm']
  },
  {
    id: 'smartphone',
    name: 'Smartphone',
    icon: 'fa-mobile-screen-button',
    color: '#2E6B33',
    tagline: 'More function, same 8mm of space',
    diagram: {
      from: { label: 'This generation', chips: ['Processor', 'RDL', 'PoP memory'] },
      to:   { label: 'Next generation', chips: ['5× antennas', 'Multi-modem', 'Same thickness'] }
    },
    quadrants: {
      demand:     ['New feature / cycle', 'Bigger battery, same size', 'Flat or thinner body'],
      response:   ['<1mm compute + memory', 'Compact SiP, epoxy mold', '5 antennas, multi-modem'],
      bottleneck: ['Extreme volume limit', 'Low-power PDN transients', 'Sealed-body hot spots'],
      roadmap:    ['Denser integration', 'Low quiescent power', 'High-volume manufacturability']
    },
    recommendedPackages: ['fowlp']
  },
  {
    id: '5g-6g',
    name: '5G / 6G',
    icon: 'fa-tower-broadcast',
    color: '#A66B00',
    tagline: 'As frequency climbs, antennas go vertical',
    diagram: {
      from: { label: '3 GHz · 5G low-band', chips: ['λ/2 = 50mm', '2 elements'] },
      to:   { label: '140 GHz · 6G', chips: ['λ/2 = 1.07mm', '47 elements, stacked'] }
    },
    quadrants: {
      demand:     ['mmWave → sub-THz', 'Dense phased arrays', '20+ band front-end'],
      response:   ['Antenna-in-package to 60GHz', 'RF + filter co-integration', 'Vertical element stacking'],
      bottleneck: ['High insertion loss', 'Sub-half-wavelength spacing', 'Coupled multiphysics'],
      roadmap:    ['Low-loss substrates', 'Finer alignment accuracy', 'Module-level co-design']
    },
    recommendedPackages: ['fowlp']
  },
  {
    id: 'aerospace',
    name: 'Aerospace / Harsh',
    icon: 'fa-satellite',
    color: '#7B3F61',
    tagline: 'Commercial tech, flight-qualified',
    diagram: {
      from: { label: 'Commercial HI platform', chips: ['Base building blocks'] },
      to:   { label: 'Deploy', chips: ['Customize', 'Harsh qualify', 'LEO / radar / sensing'] }
    },
    quadrants: {
      demand:     ['Size · weight · power', 'High reliability, secure', 'Low volume, long life'],
      response:   ['Commercial base platform', 'Mission-hardened variant', 'Compute + RF + sense'],
      bottleneck: ['Harsh-environment qualification', 'Long-life material mismatch', 'Sparse yield data'],
      roadmap:    ['Environment test protocols', 'Reliability test vehicles', 'HI readiness roadmap']
    },
    recommendedPackages: ['chiplet', 'flipchip']
  }
];

// Building-block matrix — level: 'essential' | 'relevant' | 'blank'
window.APP_MATRIX = {
  columns: [
    { id: 'ai-hpc',     name: 'AI / HPC',     icon: 'fa-microchip',            color: '#1F4E79' },
    { id: 'smartphone', name: 'Smartphone',    icon: 'fa-mobile-screen-button', color: '#2E6B33' },
    { id: '5g-6g',      name: '5G / 6G',       icon: 'fa-tower-broadcast',      color: '#A66B00' },
    { id: 'aerospace',  name: 'Aerospace',     icon: 'fa-satellite',           color: '#7B3F61' }
  ],
  rows: [
    { block: '2.5D interposer / bridge', linkedPackages: ['cowos', 'chiplet'], values: { 'ai-hpc':'essential', 'smartphone':'relevant', '5g-6g':'relevant', 'aerospace':'relevant' } },
    { block: '3D stacking + HBM (TSV)',   linkedPackages: ['hbm', 'hybrid'],   values: { 'ai-hpc':'essential', 'smartphone':'relevant', '5g-6g':'relevant', 'aerospace':'relevant' } },
    { block: 'Hybrid bonding (<10µm)',    linkedPackages: ['hybrid'],          values: { 'ai-hpc':'essential', 'smartphone':'relevant', '5g-6g':'blank',    'aerospace':'blank' } },
    { block: 'Fan-out / RDL / SiP',       linkedPackages: ['fowlp'],           values: { 'ai-hpc':'relevant',  'smartphone':'essential','5g-6g':'essential','aerospace':'relevant' } },
    { block: 'Antenna-in-package',        linkedPackages: [],                  values: { 'ai-hpc':'blank',     'smartphone':'essential','5g-6g':'essential','aerospace':'relevant' } },
    { block: 'In-package power (GaN)',    linkedPackages: [],                  values: { 'ai-hpc':'essential', 'smartphone':'essential','5g-6g':'relevant', 'aerospace':'relevant' } },
    { block: 'Advanced cooling',          linkedPackages: [],                  values: { 'ai-hpc':'essential', 'smartphone':'relevant', '5g-6g':'relevant', 'aerospace':'relevant' } }
  ],
  legend: { essential: 'Essential', relevant: 'Relevant', blank: 'Minor' }
};

// 6-step roadmap framework — kept as short stepper labels only.
window.APP_FRAMEWORK = [
  { step: 1, title: 'Application', icon: 'fa-bullseye' },
  { step: 2, title: 'Target attributes', icon: 'fa-ruler' },
  { step: 3, title: 'Building blocks', icon: 'fa-cubes' },
  { step: 4, title: 'Co-design', icon: 'fa-diagram-project' },
  { step: 5, title: 'Models + metrology', icon: 'fa-flask' },
  { step: 6, title: 'Research targets', icon: 'fa-flag-checkered' }
];
