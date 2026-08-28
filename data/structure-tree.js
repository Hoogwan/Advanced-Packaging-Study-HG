// Site-wide "Structure Map" — a hub-and-spoke knowledge map of Advanced Packaging.
// Each leaf may carry a short phrase and/or a link into the 3D Explorer
// (packageId + optional elementId) so users can jump straight to the matching
// 3D structure.
//
// Node shape:
// { id, title, desc?, icon?, children?: Node[], link?: { packageId, elementId? } }

window.STRUCTURE_TREE = {
  id: 'root',
  title: 'Advanced Packaging',
  icon: 'fa-diagram-project',
  children: [
    {
      id: 'fundamentals',
      title: 'Fundamentals',
      icon: 'fa-lightbulb',
      color: '#7a2e1f',
      desc: 'Why packaging is the new scaling lever',
      children: [
        { id: 'why-advanced-packaging', title: 'Why Advanced Packaging?', icon: 'fa-chart-line', desc: 'Moore\'s Law slows → packaging drives gains' },
        { id: 'chiplet', title: 'Chiplet', icon: 'fa-puzzle-piece', desc: 'Split one die into many small dies', link: { packageId: 'chiplet' } },
        { id: 'heterogeneous-integration', title: 'Heterogeneous Integration', icon: 'fa-shapes', desc: 'Mix process nodes & materials in one package' },
        { id: 'interconnect-scaling', title: 'Interconnect Scaling', icon: 'fa-ruler-combined', desc: 'Shrinking pitch, µm → sub-µm' }
      ]
    },
    {
      id: 'package-architectures',
      title: 'Package Architectures',
      icon: 'fa-layer-group',
      color: '#2b4c7e',
      desc: 'Physical topologies for dies & interposers',
      children: [
        {
          id: 'arch-2d',
          title: '2D',
          icon: 'fa-square',
          desc: 'Side-by-side, no interposer',
          children: [
            { id: 'multi-die-mcm', title: 'Multi-Die / MCM', icon: 'fa-th-large', desc: 'Dies on one shared substrate' }
          ]
        },
        {
          id: 'fan-out',
          title: 'Fan-Out',
          icon: 'fa-up-right-and-down-left-from-center',
          desc: 'RDL fans I/O beyond die edge',
          link: { packageId: 'fowlp' },
          children: [
            { id: 'fowlp-node', title: 'FOWLP', icon: 'fa-microchip', desc: 'RDL on a molded wafer/panel', link: { packageId: 'fowlp' } },
            { id: 'chip-first-last', title: 'Chip-First / Chip-Last', icon: 'fa-arrow-right-arrow-left', desc: 'Die-first vs. RDL-first flow' },
            { id: 'fan-out-sip', title: 'Fan-Out SiP', icon: 'fa-box', desc: 'Fan-out + passives + shielding' }
          ]
        },
        {
          id: 'arch-2-5d',
          title: '2.5D',
          icon: 'fa-layer-group',
          desc: 'Dies share a passive interposer',
          link: { packageId: 'cowos' },
          children: [
            { id: 'silicon-interposer', title: 'Silicon Interposer', icon: 'fa-microchip', desc: 'Fine-pitch Si + TSV routing layer', link: { packageId: 'cowos', elementId: 'cowos-interposer' } },
            { id: 'rdl-interposer', title: 'RDL Interposer', icon: 'fa-route', desc: 'Lower-cost organic/glass alternative' },
            { id: 'silicon-bridge', title: 'Silicon Bridge', icon: 'fa-bridge', desc: 'Local tile, not a full interposer', link: { packageId: 'chiplet', elementId: 'ch-bridge' } }
          ]
        },
        {
          id: 'arch-3d',
          title: '3D',
          icon: 'fa-cubes',
          desc: 'Vertical die stacking',
          link: { packageId: 'hybrid' },
          children: [
            { id: 'tsv', title: 'TSV', icon: 'fa-grip-lines-vertical', desc: 'Vertical via through silicon', link: { packageId: 'hbm', elementId: 'hbm-tsv' } },
            { id: 'micro-bump', title: 'Micro-bump', icon: 'fa-circle-dot', desc: '10–40 µm solder joint', link: { packageId: 'cowos', elementId: 'cowos-ubump' } },
            { id: 'hybrid-bonding', title: 'Hybrid Bonding', icon: 'fa-link', desc: 'Solder-free Cu-Cu, sub-10 µm', link: { packageId: 'hybrid', elementId: 'hb-bondline' } },
            { id: 'wow', title: 'WoW', icon: 'fa-clone', desc: 'Wafer-on-wafer bonding' },
            { id: 'cow', title: 'CoW', icon: 'fa-layer-group', desc: 'Chip-on-wafer, mixed sizes' }
          ]
        },
        { id: 'arch-2-5d-3d', title: '2.5D + 3D', icon: 'fa-cubes-stacked', desc: 'Interposer + stacked dies combined', link: { packageId: 'cowos' } },
        { id: 'pop', title: 'PoP', icon: 'fa-boxes-stacked', desc: 'Package stacked on package' },
        { id: 'embedded-die', title: 'Embedded Die', icon: 'fa-microchip', desc: 'Die buried inside the substrate' },
        { id: 'sip', title: 'SiP', icon: 'fa-box-archive', desc: 'Dies + passives + antenna, one unit' },
        { id: 'co-packaged-optics', title: 'Co-Packaged Optics', icon: 'fa-wave-square', desc: 'Optics fused next to the switch die' }
      ]
    },
    {
      id: 'commercial-technologies',
      title: 'Commercial Technologies',
      icon: 'fa-industry',
      color: '#d4a017',
      desc: 'Foundry & OSAT brand names',
      children: [
        {
          id: 'tsmc', title: 'TSMC', icon: 'fa-building',
          children: [
            { id: 'cowos', title: 'CoWoS', icon: 'fa-microchip', desc: '2.5D interposer platform', link: { packageId: 'cowos' } },
            { id: 'info', title: 'InFO', icon: 'fa-microchip', desc: 'Fan-out wafer-level package', link: { packageId: 'fowlp' } },
            { id: 'soic', title: 'SoIC', icon: 'fa-microchip', desc: 'Hybrid-bonded 3D stack', link: { packageId: 'hybrid' } }
          ]
        },
        {
          id: 'intel', title: 'Intel', icon: 'fa-building',
          children: [
            { id: 'emib', title: 'EMIB', icon: 'fa-bridge', desc: 'Embedded silicon bridge', link: { packageId: 'chiplet' } },
            { id: 'foveros', title: 'Foveros', icon: 'fa-cubes', desc: 'Face-to-face 3D stacking', link: { packageId: 'hybrid' } }
          ]
        },
        {
          id: 'samsung', title: 'Samsung', icon: 'fa-building',
          children: [
            { id: 'i-cube', title: 'I-Cube', icon: 'fa-microchip', desc: '2.5D interposer, logic + HBM', link: { packageId: 'cowos' } },
            { id: 'x-cube', title: 'X-Cube', icon: 'fa-cubes', desc: '3D TSV die stacking', link: { packageId: 'hbm' } },
            { id: 'fopkg', title: 'FOPKG', icon: 'fa-box', desc: 'Compact fan-out platform', link: { packageId: 'fowlp' } }
          ]
        },
        {
          id: 'ase', title: 'ASE', icon: 'fa-building',
          children: [
            { id: 'vipack', title: 'VIPack', icon: 'fa-cubes-stacked', desc: 'Modular fan-out + 2.5D/3D + SiP' }
          ]
        }
      ]
    },
    {
      id: 'key-technologies',
      title: 'Key Technologies',
      icon: 'fa-screwdriver-wrench',
      color: '#2e6b33',
      desc: 'Process blocks reused everywhere',
      children: [
        { id: 'kt-rdl', title: 'RDL', icon: 'fa-route', desc: 'Reroutes die I/O to new pitch', link: { packageId: 'fowlp', elementId: 'fo-rdl' } },
        { id: 'kt-tsv', title: 'TSV', icon: 'fa-grip-lines-vertical', desc: 'Vertical via, chip to chip', link: { packageId: 'hbm', elementId: 'hbm-tsv' } },
        { id: 'kt-microbump', title: 'Micro-bump', icon: 'fa-circle-dot', desc: 'Fine-pitch stacking joint', link: { packageId: 'cowos', elementId: 'cowos-ubump' } },
        { id: 'kt-hybrid-bonding', title: 'Hybrid Bonding', icon: 'fa-link', desc: 'Sub-10 µm Cu-Cu bond', link: { packageId: 'hybrid', elementId: 'hb-bondline' } },
        { id: 'kt-interposer', title: 'Interposer', icon: 'fa-layer-group', desc: 'Passive routing between die & substrate', link: { packageId: 'cowos', elementId: 'cowos-interposer' } },
        { id: 'kt-silicon-bridge', title: 'Silicon Bridge', icon: 'fa-bridge', desc: 'Local fine-pitch tile', link: { packageId: 'chiplet', elementId: 'ch-bridge' } },
        { id: 'kt-underfill-mold', title: 'Underfill / Mold', icon: 'fa-shield', desc: 'Reinforce & protect the joints', link: { packageId: 'flipchip', elementId: 'fc-underfill' } }
      ]
    },
    {
      id: 'challenges',
      title: 'Challenges',
      icon: 'fa-triangle-exclamation',
      color: '#a63a3a',
      desc: 'Constraints every package must solve',
      children: [
        { id: 'ch-thermal', title: 'Thermal', icon: 'fa-temperature-high', desc: 'Heat trapped between stacked dies' },
        { id: 'ch-warpage', title: 'Warpage', icon: 'fa-wave-square', desc: 'CTE mismatch bows the package' },
        { id: 'ch-mechanical-reliability', title: 'Mechanical Reliability', icon: 'fa-shield-halved', desc: 'Survive cycling, shock, vibration' },
        { id: 'ch-electromigration', title: 'Electromigration', icon: 'fa-bolt', desc: 'Metal migrates at fine pitch' },
        { id: 'ch-power-delivery', title: 'Power Delivery', icon: 'fa-plug', desc: 'Clean power at 100s of amps' },
        { id: 'ch-signal-integrity', title: 'Signal Integrity', icon: 'fa-wifi', desc: 'Crosstalk & loss at high density' },
        { id: 'ch-yield-kgd', title: 'Yield / KGD', icon: 'fa-check-double', desc: 'Known-good-die before bonding' },
        { id: 'ch-cost', title: 'Cost', icon: 'fa-dollar-sign', desc: 'Extra steps must earn their keep' }
      ]
    }
  ]
};
