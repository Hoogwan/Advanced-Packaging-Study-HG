// Site-wide "Structure Map" — a collapsible knowledge tree of Advanced Packaging.
// Each leaf may carry a short description and/or a link into the 3D Explorer
// (packageId + optional elementId) so users can jump straight to the matching
// 3D structure.
//
// Node shape:
// { id, title, desc?, children?: Node[], link?: { packageId, elementId? } }

window.STRUCTURE_TREE = {
  id: 'root',
  title: 'Advanced Packaging',
  children: [
    {
      id: 'fundamentals',
      title: 'Fundamentals',
      desc: 'Core concepts behind why packaging — not just transistor scaling — is now the primary lever for system performance.',
      children: [
        {
          id: 'why-advanced-packaging',
          title: 'Why Advanced Packaging?',
          desc: 'As Moore\'s Law slows, most of the remaining performance-per-watt and cost gains come from how dies are connected, stacked, and cooled — not from smaller transistors alone. Packaging has become a first-class design axis alongside the chip itself.'
        },
        {
          id: 'chiplet',
          title: 'Chiplet',
          desc: 'Splitting one large monolithic die into several smaller, specialized dies (chiplets) that are reassembled in a package. Improves yield (smaller dies fail less), allows mixing process nodes, and shortens design cycles.',
          link: { packageId: 'chiplet' }
        },
        {
          id: 'heterogeneous-integration',
          title: 'Heterogeneous Integration',
          desc: 'Combining dies built in different process nodes or even different materials (logic, memory, RF, photonics) into a single package, so each function uses the most cost-effective technology for its job.'
        },
        {
          id: 'interconnect-scaling',
          title: 'Interconnect Scaling',
          desc: 'The drive to shrink the pitch between electrical connections (bumps, pads, vias) — from hundreds of microns down to single-digit microns — to raise interconnect density and cut energy per bit.'
        }
      ]
    },
    {
      id: 'package-architectures',
      title: 'Package Architectures',
      desc: 'The physical topologies used to arrange dies, interposers, and substrates.',
      children: [
        {
          id: 'arch-2d',
          title: '2D',
          children: [
            { id: 'multi-die-mcm', title: 'Multi-Die / MCM', desc: 'Several dies placed side-by-side on one substrate (Multi-Chip Module) with no shared interposer — the simplest form of multi-die integration.' }
          ]
        },
        {
          id: 'fan-out',
          title: 'Fan-Out',
          desc: 'Dies are embedded in a molded compound and redistribution layers (RDL) fan connections outward beyond the die footprint — no organic substrate needed underneath the die.',
          link: { packageId: 'fowlp' },
          children: [
            { id: 'fowlp-node', title: 'FOWLP', desc: 'Fan-Out Wafer-Level Package — RDL built directly on a reconstituted (molded) wafer or panel.', link: { packageId: 'fowlp' } },
            { id: 'chip-first-last', title: 'Chip-First / Chip-Last', desc: 'Two process flows for FOWLP: chip-first places the die before RDL build-up; chip-last builds RDL first, then attaches the known-good die — improving yield.' },
            { id: 'fan-out-sip', title: 'Fan-Out SiP', desc: 'Fan-out packaging extended to a full System-in-Package with passives, multiple dies, and shielding — common in compact mobile and RF modules.' }
          ]
        },
        {
          id: 'arch-2-5d',
          title: '2.5D',
          desc: 'Dies sit side-by-side on a shared passive interposer or bridge, which provides very fine-pitch die-to-die wiring without stacking dies vertically.',
          link: { packageId: 'cowos' },
          children: [
            { id: 'silicon-interposer', title: 'Silicon Interposer', desc: 'A passive silicon layer with fine RDL and through-silicon vias (TSV) that sits beneath multiple dies (e.g. GPU + HBM) to route ultra-fine-pitch signals — the basis of TSMC CoWoS.', link: { packageId: 'cowos', elementId: 'cowos-interposer' } },
            { id: 'rdl-interposer', title: 'RDL Interposer', desc: 'A lower-cost alternative to a silicon interposer: fine redistribution layers built on an organic or glass carrier instead of silicon, trading some density for cost.' },
            { id: 'silicon-bridge', title: 'Silicon Bridge', desc: 'A small embedded silicon tile placed only under the die-to-die junction (not a full interposer) to provide fine-pitch local routing — cheaper than a full interposer. Used in Intel EMIB.', link: { packageId: 'chiplet', elementId: 'ch-bridge' } }
          ]
        },
        {
          id: 'arch-3d',
          title: '3D',
          desc: 'Dies are stacked vertically and connected through the silicon itself, maximizing interconnect density and minimizing wiring length.',
          link: { packageId: 'hybrid' },
          children: [
            { id: 'tsv', title: 'TSV', desc: 'Through-Silicon Via — a vertical conductive channel etched through a die/wafer, allowing electrical signals to pass from top to bottom of a stacked die.', link: { packageId: 'hbm', elementId: 'hbm-tsv' } },
            { id: 'micro-bump', title: 'Micro-bump', desc: 'A small solder bump (typically 10–40 µm pitch) used to electrically and mechanically join two dies in a 3D stack.', link: { packageId: 'cowos', elementId: 'cowos-ubump' } },
            { id: 'hybrid-bonding', title: 'Hybrid Bonding', desc: 'Direct copper-to-copper bonding without solder, achieving sub-10 µm pitch — the enabling technology for the highest-density 3D stacking (e.g. TSMC SoIC).', link: { packageId: 'hybrid', elementId: 'hb-bondline' } },
            { id: 'wow', title: 'WoW', desc: 'Wafer-on-Wafer — two full wafers are aligned and bonded before dicing, offering the highest alignment precision but requiring matched die sizes.' },
            { id: 'cow', title: 'CoW', desc: 'Chip-on-Wafer — individual known-good dies are bonded onto a base wafer, allowing mixed die sizes and better yield than WoW.' }
          ]
        },
        {
          id: 'arch-2-5d-3d',
          title: '2.5D + 3D',
          desc: 'Combines a horizontal interposer (2.5D) with vertically stacked dies on top of it (3D) — e.g. an interposer carrying a stacked HBM cube next to a logic die.',
          link: { packageId: 'cowos' }
        },
        { id: 'pop', title: 'PoP', desc: 'Package-on-Package — a fully packaged memory die is stacked on top of a fully packaged logic die, each tested independently before stacking. Common in smartphones.' },
        { id: 'embedded-die', title: 'Embedded Die', desc: 'A bare die is embedded inside the substrate itself (rather than mounted on top), reducing package height and interconnect length.' },
        { id: 'sip', title: 'SiP', desc: 'System-in-Package — multiple dies, passives, and sometimes an antenna are combined in one package to form a nearly complete subsystem.' },
        { id: 'co-packaged-optics', title: 'Co-Packaged Optics', desc: 'Optical engines (lasers, modulators) are integrated directly next to the switch/compute die in the same package, replacing pluggable optical transceivers to cut power and latency.' }
      ]
    },
    {
      id: 'commercial-technologies',
      title: 'Commercial Technologies',
      desc: 'Foundry- and OSAT-specific brand names for the architectures above.',
      children: [
        {
          id: 'tsmc',
          title: 'TSMC',
          children: [
            { id: 'cowos', title: 'CoWoS', desc: 'Chip-on-Wafer-on-Substrate — TSMC\'s 2.5D silicon-interposer platform; the workhorse behind most modern AI accelerators (GPU + HBM).', link: { packageId: 'cowos' } },
            { id: 'info', title: 'InFO', desc: 'Integrated Fan-Out — TSMC\'s fan-out wafer-level packaging technology, first famous for Apple application-processor packages.', link: { packageId: 'fowlp' } },
            { id: 'soic', title: 'SoIC', desc: 'System-on-Integrated-Chips — TSMC\'s hybrid-bonding-based 3D stacking technology for sub-10 µm pitch die stacking.', link: { packageId: 'hybrid' } }
          ]
        },
        {
          id: 'intel',
          title: 'Intel',
          children: [
            { id: 'emib', title: 'EMIB', desc: 'Embedded Multi-die Interconnect Bridge — Intel\'s silicon-bridge technology embedding a small silicon tile in the substrate for fine-pitch 2.5D die-to-die links.', link: { packageId: 'chiplet' } },
            { id: 'foveros', title: 'Foveros', desc: 'Intel\'s 3D die-stacking technology using micro-bumps (and increasingly hybrid bonding) to stack active dies face-to-face.', link: { packageId: 'hybrid' } }
          ]
        },
        {
          id: 'samsung',
          title: 'Samsung',
          children: [
            { id: 'i-cube', title: 'I-Cube', desc: 'Samsung\'s 2.5D interposer packaging technology, comparable to CoWoS, for logic + HBM integration.', link: { packageId: 'cowos' } },
            { id: 'x-cube', title: 'X-Cube', desc: 'Samsung\'s 3D TSV-based die-stacking technology for vertically integrating SRAM/logic dies.', link: { packageId: 'hbm' } },
            { id: 'fopkg', title: 'FOPKG', desc: 'Samsung\'s fan-out package platform for compact, high-density mobile and system packages.', link: { packageId: 'fowlp' } }
          ]
        },
        {
          id: 'ase',
          title: 'ASE',
          children: [
            { id: 'vipack', title: 'VIPack', desc: 'ASE\'s modular advanced-packaging platform combining fan-out RDL, 2.5D/3D interconnect, and SiP integration for high-performance computing.' }
          ]
        }
      ]
    },
    {
      id: 'key-technologies',
      title: 'Key Technologies',
      desc: 'The individual process building blocks reused across many package architectures.',
      children: [
        { id: 'kt-rdl', title: 'RDL', desc: 'Redistribution Layer — thin-film metal/dielectric layers that reroute die I/O pads to new locations, e.g. spreading a die\'s dense pads to a wider ball-grid pitch.', link: { packageId: 'fowlp', elementId: 'fo-rdl' } },
        { id: 'kt-tsv', title: 'TSV', desc: 'Through-Silicon Via — see 3D Architectures above.', link: { packageId: 'hbm', elementId: 'hbm-tsv' } },
        { id: 'kt-microbump', title: 'Micro-bump', desc: 'Fine-pitch solder joints (10–40 µm) used between stacked dies.', link: { packageId: 'cowos', elementId: 'cowos-ubump' } },
        { id: 'kt-hybrid-bonding', title: 'Hybrid Bonding', desc: 'Solder-free direct Cu-Cu + dielectric bonding for the finest pitches (sub-10 µm).', link: { packageId: 'hybrid', elementId: 'hb-bondline' } },
        { id: 'kt-interposer', title: 'Interposer', desc: 'A passive routing layer (silicon, glass, or organic) between dies and the substrate.', link: { packageId: 'cowos', elementId: 'cowos-interposer' } },
        { id: 'kt-silicon-bridge', title: 'Silicon Bridge', desc: 'A small local interposer tile embedded only where fine-pitch die-to-die routing is needed.', link: { packageId: 'chiplet', elementId: 'ch-bridge' } },
        { id: 'kt-underfill-mold', title: 'Underfill / Mold', desc: 'Underfill is an epoxy dispensed beneath a flip-chip die to mechanically reinforce solder joints; mold compound (EMC) fully encapsulates dies for protection and handling.', link: { packageId: 'flipchip', elementId: 'fc-underfill' } }
      ]
    },
    {
      id: 'challenges',
      title: 'Challenges',
      desc: 'The physical and engineering constraints that every advanced package must solve — see the "Applications" tab for how these challenges map to specific end uses.',
      children: [
        { id: 'ch-thermal', title: 'Thermal', desc: 'Removing heat from tightly stacked, high-power-density dies where hot spots can\'t dissipate laterally through package materials as easily as through bulk silicon.' },
        { id: 'ch-warpage', title: 'Warpage', desc: 'Mismatched coefficients of thermal expansion (CTE) between silicon, substrate, and mold compound cause the package to bow during thermal cycling, risking cracked joints.' },
        { id: 'ch-mechanical-reliability', title: 'Mechanical Reliability', desc: 'Ensuring bumps, TSVs, and bonded interfaces survive thermal cycling, shock, and vibration over the product\'s lifetime without cracking or delaminating.' },
        { id: 'ch-electromigration', title: 'Electromigration', desc: 'At fine pitch and high current density, metal atoms in interconnects gradually migrate and can create voids or shorts — a key limiter on how small pitches can go.' },
        { id: 'ch-power-delivery', title: 'Power Delivery', desc: 'Getting clean, low-loss power to compute dies drawing hundreds of amps at low voltage, increasingly solved by moving voltage regulation into the package itself.' },
        { id: 'ch-signal-integrity', title: 'Signal Integrity', desc: 'Preserving clean high-speed signals across fine-pitch, densely-packed interconnects where crosstalk, reflections, and loss all increase with density and frequency.' },
        { id: 'ch-yield-kgd', title: 'Yield / KGD', desc: 'Known-Good-Die testing before assembly is critical — bonding an untested bad die into an expensive multi-die stack can scrap the entire package.' },
        { id: 'ch-cost', title: 'Cost', desc: 'Advanced packaging techniques (interposers, hybrid bonding, fine RDL) add process steps and materials cost that must be justified by the performance gained.' }
      ]
    }
  ]
};
