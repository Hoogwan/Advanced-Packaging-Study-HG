// Advanced Packaging - Baseline Content
// Each package: id, name, subtitle, elements[]
// Each element: id, name, category, color, geometry(builder), content{overview, keywords, materials, process, challenges, companies, papers}
// Geometry: {type, size:[w,h,d], pos:[x,y,z], layer, opts?}
// layer index used for exploded view offset

window.PACKAGES = [

/* =============================================================
   1. 2.5D INTERPOSER (CoWoS-S)
   ============================================================= */
{
  id: "cowos",
  name: "2.5D Si Interposer",
  short: "CoWoS-S",
  subtitle: "Logic die + HBM stacks on a silicon interposer, mounted on organic substrate. The workhorse of modern AI accelerators.",
  elements: [
    {
      id: "cowos-pcb", name: "PCB / System Board", category: "Board", color: "#2d5c3f",
      geo: { type:"box", size:[9,0.2,7], pos:[0,-2.2,0], layer:0 },
      content: {
        overview: "The system-level printed circuit board that hosts the packaged device. Provides power delivery, high-speed signal routing, and mechanical mounting for the entire package assembly.",
        keywords: ["High-Tg FR-4", "Low-loss laminate", "Impedance-controlled routing", "Backdrilling", "HDI"],
        materials: [
          {name:"Megtron 6/7", desc:"Low-loss laminate for high-speed signaling (Df ~0.002)"},
          {name:"Copper foil", desc:"Signal / power planes, typ. 1/2 oz to 2 oz"},
          {name:"Solder mask", desc:"LPI, protects traces and defines pad openings"}
        ],
        process: [
          "Inner layer imaging and etching",
          "Lamination of core + prepreg stacks",
          "Mechanical / laser drilling of vias",
          "Electroless + electrolytic Cu plating",
          "Outer layer imaging and solder mask application",
          "Surface finish (ENIG / OSP)"
        ],
        challenges: [
          {name:"Signal integrity at >32 Gb/s", desc:"Dielectric loss dominates at PAM4 speeds; requires ultra-low-loss laminates."},
          {name:"Warpage under reflow", desc:"CTE mismatch with package substrate can cause board bow/twist."},
          {name:"Power delivery for >1000 W sockets", desc:"Low-inductance PDN with buried capacitance layers."}
        ],
        companies: ["Ibiden","Unimicron","AT&S","Shinko","TTM Technologies"],
        papers: [
          {title:"Signal Integrity Challenges for 224 Gb/s PAM4 Serial Links", url:"https://ieeexplore.ieee.org/document/10148930", notes:"Addresses laminate loss budgets at next-generation SerDes rates."},
          {title:"Ultra-Low-Loss PCB Materials for AI/HPC Systems", url:"", notes:""}
        ]
      }
    },
    {
      id: "cowos-bga", name: "BGA Solder Balls", category: "Interconnect", color: "#9c9c9c",
      geo: { type:"ballGrid", size:[7.5,0.35,5.5], pos:[0,-1.75,0], layer:1, opts:{nx:15, nz:11, r:0.18} },
      content: {
        overview: "Ball Grid Array (BGA) solder balls form the second-level interconnect between the package substrate and the system PCB. Typical ball pitch 0.8–1.0 mm for high-performance packages.",
        keywords: ["SAC305 solder","Ball pitch 0.8-1.0mm","Second-level interconnect","Reflow soldering"],
        materials: [
          {name:"SAC305 (Sn-Ag-Cu)", desc:"Lead-free solder alloy: 96.5Sn/3Ag/0.5Cu"},
          {name:"Ni-Au UBM", desc:"Under-bump metallization on substrate pads"},
          {name:"Flux", desc:"Removes oxides for wetting during reflow"}
        ],
        process: [
          "Solder ball attach via stencil printing or ball drop",
          "Reflow at peak ~245 °C for SAC305",
          "Flux residue clean",
          "Ball height / coplanarity inspection (AOI, X-ray)"
        ],
        challenges: [
          {name:"Electromigration at high current", desc:"Current density in each ball approaches EM limits for AI accelerators."},
          {name:"Head-in-pillow defects", desc:"Solder ball fails to coalesce with paste due to warpage."},
          {name:"Thermal fatigue (JEDEC TCT)", desc:"CTE mismatch drives crack propagation in solder joint."}
        ],
        companies: ["Senju Metal","Indium Corporation","Alpha Assembly","Tamura"],
        papers: [
          {title:"Electromigration Reliability of SAC Solder Joints in High-Power Packages", url:"", notes:"Reviews EM failure modes at >1 A/ball."},
          {title:"Head-in-Pillow Defect Mechanisms and Mitigation", url:"", notes:""}
        ]
      }
    },
    {
      id: "cowos-substrate", name: "Organic Package Substrate", category: "Substrate", color: "#3a5a2d",
      geo: { type:"box", size:[7.5,0.35,5.5], pos:[0,-1.4,0], layer:2 },
      content: {
        overview: "Multi-layer organic build-up substrate (BT resin core with ABF build-up dielectric) that routes signals from the interposer down to BGA balls. Modern high-end substrates have 20+ layers and body sizes >100×100 mm².",
        keywords: ["ABF (Ajinomoto Build-up Film)","BT resin core","SAP (Semi-Additive Process)","Line/space 8/8 µm","Coreless substrate"],
        materials: [
          {name:"ABF dielectric", desc:"Ajinomoto Build-up Film — epoxy-based low-Dk dielectric"},
          {name:"BT resin core", desc:"Bismaleimide-Triazine, provides rigidity"},
          {name:"Cu (electroplated)", desc:"Signal and power conductors"},
          {name:"Solder resist", desc:"Photodefinable coating for pad openings"}
        ],
        process: [
          "Core lamination and drilling",
          "Sequential build-up: ABF lamination → laser via drill → desmear → Cu SAP plating",
          "Photolithographic pattern definition",
          "Repeat build-up for each layer pair (2-1-2, 4-2-4 etc.)",
          "Solder resist coating and opening",
          "Surface finish (ENEPIG typical)"
        ],
        challenges: [
          {name:"ABF supply constraint", desc:"Ajinomoto is a monopoly supplier; global capacity is a bottleneck."},
          {name:"Warpage of large-body substrates", desc:">100 mm bodies flex during reflow, causing NCF voids and JOL cracks."},
          {name:"Fine line/space <10 µm", desc:"Approaches limits of SAP; roughness affects insertion loss."}
        ],
        companies: ["Ibiden","Unimicron","Shinko","Semco","Kyocera","AT&S"],
        papers: [
          {title:"Advanced Organic Substrate Technology for 2.5D/3D IC Packages", url:"", notes:"Roadmap for 8/8 µm and finer L/S."},
          {title:"Warpage Modeling of Large-Body ABF Substrates", url:"", notes:""},
          {title:"Coreless Substrate for High-Speed Signaling", url:"", notes:""}
        ]
      }
    },
    {
      id: "cowos-c4", name: "C4 Bumps", category: "Interconnect", color: "#b8b8b8",
      geo: { type:"ballGrid", size:[5.5,0.12,3.5], pos:[0,-1.14,0], layer:3, opts:{nx:22, nz:14, r:0.06} },
      content: {
        overview: "Controlled Collapse Chip Connection (C4) bumps are the first-level interconnect between the interposer and the organic substrate. Larger and coarser than micro-bumps, typically 100–150 µm pitch, they carry high current and provide stress compliance.",
        keywords: ["C4 bump","100-150 µm pitch","SnAg solder","UBM","Underfill"],
        materials: [
          {name:"SnAg solder cap", desc:"Sn/1.8Ag typical, plated on Cu pillar or bump"},
          {name:"Cu pillar", desc:"Provides standoff; reduces bridging"},
          {name:"Capillary underfill", desc:"Filled epoxy dispensed after reflow"}
        ],
        process: [
          "Electroplate UBM on interposer backside pads",
          "Electroplate Cu pillar + SnAg cap",
          "Reflow to form spherical bump",
          "Flux, place on substrate, mass reflow",
          "Capillary underfill dispense and cure"
        ],
        challenges: [
          {name:"CTE mismatch cracks", desc:"Si (2.6) vs organic (17 ppm/K) drives shear stress at C4 joints."},
          {name:"Underfill voiding", desc:"Large-body dies have long flow paths; voids reduce reliability."},
          {name:"Non-Wet Open (NWO)", desc:"Warpage during reflow causes intermittent contact."}
        ],
        companies: ["TSMC","ASE","Amkor","JCET"],
        papers: [
          {title:"C4 Bump Reliability in Large-Body 2.5D Packages", url:"", notes:""},
          {title:"Underfill Materials for Warpage Control", url:"", notes:""}
        ]
      }
    },
    {
      id: "cowos-interposer", name: "Silicon Interposer", category: "Interposer", color: "#4a6b8a",
      geo: { type:"box", size:[5.5,0.1,3.5], pos:[0,-1.02,0], layer:4 },
      content: {
        overview: "Passive silicon interposer that provides ultra-fine-pitch redistribution and TSV vertical interconnects between the top dies (logic + HBM) and the substrate below. Reticle-limited (currently up to ~3.3× reticle in CoWoS-L). No active transistors.",
        keywords: ["Passive Si interposer","65nm-class BEOL","3-4 metal layers","TSV middle","Reticle-limited size"],
        materials: [
          {name:"Bulk silicon", desc:"12-inch wafer, typ. 100 µm thick after backgrind"},
          {name:"SiO₂ dielectric", desc:"Inter-metal insulation"},
          {name:"Cu damascene", desc:"Fine-pitch signal routing (0.4-0.8 µm L/S)"}
        ],
        process: [
          "TSV formation (via-middle process)",
          "BEOL routing layers (typically 4 Cu damascene layers)",
          "Backside grind to expose TSVs",
          "Backside RDL + C4 UBM",
          "Micro-bump pad formation on frontside",
          "Reconstituted wafer flow (CoW: chip-on-wafer bonding)"
        ],
        challenges: [
          {name:"Reticle-size limit", desc:"Standard reticle is 26×33 mm; multi-reticle stitching required for larger interposers (CoWoS-L)."},
          {name:"Warpage during CoW", desc:"Thin interposer warps during die attach; requires carrier wafer."},
          {name:"Cost per mm²", desc:"Si interposer at ~$50-100/cm² is 10× organic substrate."}
        ],
        companies: ["TSMC","Samsung Foundry","Intel Foundry Services"],
        papers: [
          {title:"CoWoS: Chip-on-Wafer-on-Substrate for High-Performance Systems", url:"", notes:"Original TSMC 2011 paper introducing CoWoS."},
          {title:"3.3× Reticle Interposer for AI Accelerators", url:"", notes:"CoWoS-L extension enabling >5000 mm² interposers."},
          {title:"TSV Reliability in Silicon Interposers", url:"", notes:""}
        ]
      }
    },
    {
      id: "cowos-tsv", name: "TSV (Through-Silicon Via)", category: "Vertical Interconnect", color: "#c47f2a",
      geo: { type:"tsvArray", size:[5.5,0.1,3.5], pos:[0,-1.02,0], layer:4, opts:{nx:8, nz:6, r:0.025, h:0.1} },
      content: {
        overview: "Vertical copper vias etched through the silicon interposer to connect frontside micro-bumps to backside C4 bumps. Typical dimensions in an interposer TSV: 10 µm diameter × 100 µm depth (10:1 aspect ratio). Via-middle process is standard.",
        keywords: ["Via-middle","10 µm diameter","10:1 aspect ratio","Bosch DRIE","Cu ECD fill","CMP"],
        materials: [
          {name:"Cu (electroplated)", desc:"Via fill; requires bottom-up plating chemistry"},
          {name:"Ta/TaN barrier", desc:"Prevents Cu diffusion into Si"},
          {name:"SiO₂ liner", desc:"Electrical isolation, deposited by SACVD or PECVD"},
          {name:"PVD Cu seed", desc:"Seed for electroplating"}
        ],
        process: [
          "Deep reactive ion etch (Bosch DRIE) into Si",
          "Thermal oxide + PECVD SiO₂ liner deposition",
          "PVD Ta/TaN barrier + Cu seed",
          "Bottom-up Cu electroplating (super-fill)",
          "CMP to remove Cu overburden",
          "Backside reveal via backgrind + CMP"
        ],
        challenges: [
          {name:"Keep-out zone (KOZ)", desc:"TSV thermal stress affects nearby transistor mobility; KOZ ~5 µm around each TSV."},
          {name:"TSV protrusion (pumping)", desc:"Cu CTE > Si; TSVs pop up during anneal, damaging BEOL."},
          {name:"Void-free fill", desc:"Aspect ratios >10:1 challenge super-fill chemistry."}
        ],
        companies: ["Applied Materials","Lam Research","TEL","Atotech (chemistry)"],
        papers: [
          {title:"TSV Stress and Its Effect on Device Performance", url:"", notes:"Landmark work on KOZ definition."},
          {title:"Cu-Fill Chemistry for High-Aspect-Ratio TSVs", url:"", notes:""},
          {title:"TSV Reveal Process for Interposer Thinning", url:"", notes:""}
        ]
      }
    },
    {
      id: "cowos-underfill", name: "Underfill (µbump)", category: "Encapsulant", color: "#d9c9a3",
      geo: { type:"box", size:[5.3,0.05,3.3], pos:[0,-0.895,0], layer:5, opts:{opacity:0.55} },
      content: {
        overview: "Capillary or non-conductive film (NCF) underfill fills the gap between the top dies and the interposer, encapsulating the micro-bumps. Reduces solder joint stress from CTE mismatch and provides mechanical robustness.",
        keywords: ["Capillary underfill","NCF (Non-Conductive Film)","Silica-filled epoxy","CTE matching","MUF (Molded Underfill)"],
        materials: [
          {name:"Epoxy resin", desc:"Base polymer with anhydride or amine hardener"},
          {name:"Silica filler", desc:"60-70 wt% spherical fused silica, tunes CTE to 25-30 ppm/K"},
          {name:"Curing catalyst", desc:"Latent imidazole or similar"}
        ],
        process: [
          "For capillary: dispense along die edge post-reflow, let capillary action pull it under",
          "For NCF: laminate film on wafer before dicing, bond with heat+pressure (thermo-compression)",
          "Cure at ~150 °C for 1-2 hr"
        ],
        challenges: [
          {name:"Filler filtration at fine pitch", desc:"At <40 µm bump pitch, silica particles filter out at bump entrance, changing rheology."},
          {name:"Voiding at large die", desc:"Long flow paths trap air; requires vacuum-assisted dispense."},
          {name:"Warpage during cure", desc:"Cure shrinkage adds to package warpage."}
        ],
        companies: ["Namics","Henkel","Nagase","Hitachi Chemical (Resonac)"],
        papers: [
          {title:"NCF Materials for Fine-Pitch µbump Bonding", url:"", notes:""},
          {title:"Underfill Flow Modeling in Large-Body 2.5D Packages", url:"", notes:""}
        ]
      }
    },
    {
      id: "cowos-ubump", name: "Micro-bumps (µbump)", category: "Interconnect", color: "#e8b56b",
      geo: { type:"ballGrid", size:[5.3,0.05,3.3], pos:[0,-0.895,0], layer:5, opts:{nx:44, nz:28, r:0.025} },
      content: {
        overview: "Fine-pitch solder micro-bumps (typically 40 µm pitch, 20 µm diameter) that connect the top dies (logic + HBM) to the interposer. Consist of a Cu pillar with a thin SnAg solder cap.",
        keywords: ["µbump","40 µm pitch (going to 25 µm)","Cu pillar + SnAg cap","TCB (Thermocompression Bonding)","IMC growth"],
        materials: [
          {name:"Cu pillar", desc:"15-20 µm tall, defines standoff"},
          {name:"SnAg cap", desc:"5-7 µm solder, Sn-1.8Ag composition"},
          {name:"Ni barrier (optional)", desc:"Prevents Cu-Sn IMC over-growth"}
        ],
        process: [
          "Photoresist patterning on wafer",
          "Electroplate Cu pillar",
          "Electroplate SnAg cap",
          "Strip resist, remove UBM seed",
          "Reflow to shape cap",
          "TCB bonding to interposer with force + heat"
        ],
        challenges: [
          {name:"IMC growth", desc:"Cu₆Sn₅ / Cu₃Sn intermetallic consumes Cu pillar over time, embrittles joint."},
          {name:"Bump pitch scaling", desc:"Below 25 µm pitch, TCB alignment and solder bridging become severe."},
          {name:"Hybrid bonding transition", desc:"Industry moving beyond µbump to direct Cu-Cu below 10 µm pitch."}
        ],
        companies: ["ASMPT","Hanmi","BE Semiconductor (Besi)","Shinkawa"],
        papers: [
          {title:"Fine-Pitch Cu Pillar µbumps for 2.5D/3D Integration", url:"", notes:""},
          {title:"IMC Evolution and Reliability of µbump Joints", url:"", notes:""},
          {title:"TCB Process Optimization for Fine-Pitch Bumps", url:"", notes:""}
        ]
      }
    },
    {
      id: "cowos-logic", name: "Logic Die (SoC / GPU)", category: "Active Die", color: "#c53030",
      geo: { type:"box", size:[1.6,0.35,2.6], pos:[-1.4,-0.68,0], layer:6 },
      content: {
        overview: "The active compute die — typically a GPU, CPU, or AI accelerator ASIC — fabricated in a leading-edge node (currently 3-5 nm class). Central component that HBM stacks feed via the interposer.",
        keywords: ["3nm-5nm FinFET / GAA","Reticle-limited","Face-down orientation","Bump pad backside","Hotspot management"],
        materials: [
          {name:"Silicon", desc:"12-inch wafer, thinned to 300-700 µm"},
          {name:"BEOL Cu", desc:"15+ metal layers of on-die interconnect"},
          {name:"Low-k dielectric", desc:"SiOCH, k~2.5, between metal layers"}
        ],
        process: [
          "Wafer fabrication at foundry (3-5 nm CMOS)",
          "Wafer bump plating (µbumps on I/O pads)",
          "Wafer thinning + backside processing",
          "Dicing (stealth laser + tape expand)",
          "KGD test",
          "TCB attach to interposer"
        ],
        challenges: [
          {name:"Reticle-limited die size", desc:"Max ~858 mm² per die; drives push to chiplets."},
          {name:"Yield of massive dies", desc:"Defects scale with area; monolithic large dies have poor yield."},
          {name:"Thermal density", desc:">1 W/mm² local hotspots require advanced cooling."}
        ],
        companies: ["NVIDIA","AMD","Intel","Apple","Google (TPU)","Broadcom"],
        papers: [
          {title:"Chiplet Design Trends in AI Accelerators", url:"", notes:""},
          {title:"Thermal Management of >700W GPU Packages", url:"", notes:""}
        ]
      }
    },
    {
      id: "cowos-hbm", name: "HBM Stack", category: "Memory", color: "#2d3a8c",
      geo: { type:"hbmStack", size:[1.4,0.7,2.4], pos:[1.5,-0.5,0], layer:6, opts:{layers:12} },
      content: {
        overview: "High-Bandwidth Memory: a vertical stack of 8-16 DRAM dies + a logic base die, connected by TSVs. HBM3E offers ~1.2 TB/s per stack. Multiple HBM stacks (typ. 4-8) sit alongside the logic die on the interposer.",
        keywords: ["HBM3 / HBM3E / HBM4","12-Hi / 16-Hi stack","1024-bit-wide bus per stack","TSV pitch 40-50 µm","TCB stack bonding"],
        materials: [
          {name:"DRAM die (1a/1b nm)", desc:"8-16 core dies + 1 base logic die per stack"},
          {name:"Cu TSV", desc:"~5 µm × 50 µm through each core die"},
          {name:"NCF underfill", desc:"Laminated between core dies during stack build"}
        ],
        process: [
          "TSV formation in each DRAM core die (via-middle)",
          "Wafer thinning to ~50 µm",
          "µbump + NCF lamination on wafer",
          "D2W (Die-to-Wafer) TCB stacking",
          "Molding of finished stack",
          "Stack test → KGSD (Known Good Stack Die)"
        ],
        challenges: [
          {name:"Thermal dissipation from stack bottom", desc:"Base logic die traps heat from stacked DRAM above."},
          {name:"Yield across 12-16 dies", desc:"Y_stack = Y_die^N; requires >99% KGD."},
          {name:"NCF void control", desc:"Voids in NCF between dies cause open joints and thermal paths."}
        ],
        companies: ["SK hynix","Samsung","Micron"],
        papers: [
          {title:"HBM3E: Architecture and Reliability", url:"", notes:""},
          {title:"Thermal Modeling of 16-Hi HBM4 Stacks", url:"", notes:""},
          {title:"NCF-Based Stack Bonding for HBM", url:"", notes:""}
        ]
      }
    },
    {
      id: "cowos-mold", name: "Molding Compound", category: "Encapsulant", color: "#1e1e1e",
      geo: { type:"moldCap", size:[5.5,0.9,3.5], pos:[0,-0.3,0], layer:7, opts:{opacity:0.35, cutout:true} },
      content: {
        overview: "Epoxy molding compound (EMC) encapsulates the interposer and top dies, providing mechanical protection and warpage control. In modern lid-less packages, the mold is often ground flat to expose the die backside for direct cooling.",
        keywords: ["EMC (Epoxy Molding Compound)","Silica-filled epoxy","Compression molding","MUF variant","Die-exposed grinding"],
        materials: [
          {name:"Epoxy binder", desc:"Biphenyl or multi-aromatic epoxy"},
          {name:"Fused silica filler", desc:"~85 wt%, controls CTE (~10 ppm/K) and modulus"},
          {name:"Coupling agents", desc:"Silane, improves interface adhesion"},
          {name:"Carbon black", desc:"Pigment (black color)"}
        ],
        process: [
          "Pre-heat substrate + dies on mold chase",
          "Compression molding: EMC granules melted, pressed into cavity",
          "Post-mold cure at ~175 °C for 1-4 hr",
          "Optionally: grind top of mold to expose die"
        ],
        challenges: [
          {name:"Warpage of large panels", desc:"EMC shrinks on cure; asymmetric stack causes bow."},
          {name:"Die-exposed grind uniformity", desc:"Grinding must stop at die surface without damaging it (<5 µm tolerance)."},
          {name:"Filler settling", desc:"Non-uniform filler distribution changes local CTE."}
        ],
        companies: ["Sumitomo Bakelite","Nagase","Hitachi Chemical (Resonac)","KCC"],
        papers: [
          {title:"EMC Formulation for Large-Body 2.5D Packages", url:"", notes:""},
          {title:"Die-Exposed Molding for Thermal Enhancement", url:"", notes:""}
        ]
      }
    }
  ]
},


/* =============================================================
   2. 3D IC / HYBRID BONDING (Foveros / SoIC)
   ============================================================= */
{
  id: "hybrid",
  name: "3D IC / Hybrid Bonding",
  short: "SoIC / Foveros",
  subtitle: "Direct Cu-Cu bonding at sub-10 µm pitch. Eliminates solder — enables true wafer-scale 3D stacking with dramatically higher interconnect density.",
  elements: [
    {
      id: "hb-substrate", name: "Package Substrate", category: "Substrate", color: "#3a5a2d",
      geo: { type:"box", size:[6,0.3,4.5], pos:[0,-1.4,0], layer:0 },
      content: {
        overview: "Organic package substrate similar to CoWoS, but connects to a stacked die assembly rather than an interposer. Provides fanout of I/O from the stacked die complex to BGA balls.",
        keywords: ["ABF build-up","BT core","Fine-line SAP","20+ layers"],
        materials: [
          {name:"ABF", desc:"Ajinomoto Build-up Film dielectric"},
          {name:"BT core", desc:"Bismaleimide-triazine core layer"}
        ],
        process: ["Sequential build-up lamination","Laser via drill","SAP Cu plating","Solder resist"],
        challenges: [
          {name:"Warpage matching to Si stack", desc:"Very stiff stack requires substrate tuned to match warpage curve."}
        ],
        companies: ["Ibiden","Unimicron","Shinko"],
        papers: []
      }
    },
    {
      id: "hb-c4", name: "C4 Bumps", category: "Interconnect", color: "#b8b8b8",
      geo: { type:"ballGrid", size:[4.5,0.1,3.5], pos:[0,-1.19,0], layer:1, opts:{nx:20, nz:14, r:0.055} },
      content: {
        overview: "First-level Cu-pillar solder bumps connecting the bottom-most die of the 3D stack to the organic substrate.",
        keywords: ["Cu pillar","SnAg cap","100 µm pitch"],
        materials: [{name:"SnAg", desc:"Sn-1.8Ag solder"}],
        process: ["Electroplate on stack backside RDL","TCB or mass reflow"],
        challenges: [{name:"Stress on hybrid-bonded stack above", desc:"C4 reflow thermal cycle stresses fresh hybrid bonds."}],
        companies: ["TSMC","Intel","Samsung"],
        papers: []
      }
    },
    {
      id: "hb-base", name: "Base Die (Active)", category: "Active Die", color: "#8a3030",
      geo: { type:"box", size:[3,0.28,2.5], pos:[0,-1,0], layer:2 },
      content: {
        overview: "The bottom die of a 3D-stacked assembly. In Foveros / SoIC, the base die is an active silicon die (not a passive interposer) — it can contain I/O, cache, or power delivery. TSVs pass through it to connect to the substrate.",
        keywords: ["Active base die","TSV-last or TSV-middle","Face-up or face-down","Backside RDL","Foveros / SoIC-X"],
        materials: [
          {name:"Silicon", desc:"Thinned to 50-100 µm"},
          {name:"Cu TSVs", desc:"For vertical connection to substrate"}
        ],
        process: [
          "Fabricate base die at foundry",
          "Frontside CMP planarization for hybrid bond pads",
          "Top die bonding (D2W or W2W)",
          "Backside thin + TSV reveal + backside RDL",
          "C4 bump plating"
        ],
        challenges: [
          {name:"Thermal path through base die", desc:"Base die must sink heat from top die + generate its own."},
          {name:"Alignment during D2W bonding", desc:"Sub-micron placement over 3-4 mm die is challenging."}
        ],
        companies: ["Intel (Foveros)","TSMC (SoIC)","Samsung (X-Cube)"],
        papers: [
          {title:"Foveros: A New Era of 3D Chip Integration", url:"", notes:"Intel's 2019 Lakefield introduction."},
          {title:"SoIC: TSMC's Sub-10 µm Pitch 3D Integration", url:"", notes:""}
        ]
      }
    },
    {
      id: "hb-bondline", name: "Hybrid Bond Interface", category: "Bonding", color: "#e8b56b",
      geo: { type:"box", size:[3,0.015,2.5], pos:[0,-0.85,0], layer:3, opts:{glow:true} },
      content: {
        overview: "The atomically thin interface where two SiO₂/Cu surfaces are directly bonded — no solder, no bumps. Cu pads (typ. 3-5 µm) are recessed slightly below the SiO₂ surface; after room-temperature oxide-to-oxide bond, an anneal (~300-400 °C) causes Cu to expand and form metallurgical Cu-Cu bonds. Bond pitch already at 6 µm, roadmap to <1 µm.",
        keywords: ["Direct Cu-Cu bond","SiO₂ dielectric bond","6 µm pitch (heading to <1 µm)","Sub-nm surface roughness","300-400 °C anneal","W2W and D2W variants"],
        materials: [
          {name:"Cu bond pads", desc:"Electroplated Cu, CMP'd to sub-nm roughness, slightly dished"},
          {name:"SiO₂ bonding surface", desc:"PECVD or thermal oxide, CMP'd to <0.5 nm Ra"}
        ],
        process: [
          "CMP of Cu pads + surrounding oxide to sub-nm smoothness",
          "Cu dishing control (2-5 nm below oxide surface)",
          "Ultra-clean surface prep (megasonic, N₂/H₂ plasma activation)",
          "Room-temperature oxide-to-oxide contact bond (van der Waals + hydrogen bonds)",
          "Anneal at 300-400 °C: Cu expands, closes gap, forms metallic bond; SiO₂ dehydrates to covalent Si-O-Si"
        ],
        challenges: [
          {name:"Surface cleanliness", desc:"Particles >0.1 µm cause voids; requires class 1 environment."},
          {name:"Cu dishing control", desc:"Too little → dielectric-only bond (open); too much → poor Cu bond."},
          {name:"Overlay accuracy at sub-µm pitch", desc:"Bonders must achieve <200 nm placement, hard at wafer scale."},
          {name:"Void detection", desc:"SAT (scanning acoustic) + IR imaging needed to catch sub-µm voids."}
        ],
        companies: ["EV Group","SUSS MicroTec","BE Semiconductor (Besi)","TEL","Applied Materials"],
        papers: [
          {title:"Direct Cu-Cu Bonding for 3D IC Interconnects", url:"https://ieeexplore.ieee.org/document/6912123", notes:"Foundational review of hybrid bond mechanics."},
          {title:"Sub-µm Pitch Hybrid Bonding Roadmap", url:"", notes:"IMEC's roadmap toward 400 nm pitch."},
          {title:"Die-to-Wafer Hybrid Bonding for HBM4", url:"", notes:"D2W as enabling tech for next-gen HBM."}
        ]
      }
    },
    {
      id: "hb-tsv-base", name: "TSVs (Base Die)", category: "Vertical Interconnect", color: "#c47f2a",
      geo: { type:"tsvArray", size:[3,0.28,2.5], pos:[0,-1,0], layer:2, opts:{nx:8, nz:6, r:0.03, h:0.28} },
      content: {
        overview: "TSVs in the base die connect the hybrid-bonded top die's I/O down to the C4 bumps and package substrate. Denser than interposer TSVs because the die is thinner (~50-100 µm).",
        keywords: ["5-10 µm diameter","50-100 µm depth","Via-middle","Cu-filled"],
        materials: [{name:"Cu", desc:"Electroplated fill"}],
        process: ["DRIE","Liner + barrier","Cu ECD","CMP","Backside reveal"],
        challenges: [{name:"Cu pumping affects hybrid bond above", desc:"TSV protrusion can disturb the bonded interface."}],
        companies: ["Applied Materials","Lam Research"],
        papers: []
      }
    },
    {
      id: "hb-top", name: "Top Die (Compute)", category: "Active Die", color: "#c53030",
      geo: { type:"box", size:[3,0.15,2.5], pos:[0,-0.77,0], layer:4 },
      content: {
        overview: "The top die in a 2-Hi hybrid-bond stack — typically the higher-performance compute chip (e.g., a CPU core tile or SRAM cache tile). Bonded face-down to the base die via Cu-Cu bonds at 6-9 µm pitch.",
        keywords: ["Face-down","3-5 nm node","Cache-die or compute-die","Thinned to <50 µm"],
        materials: [{name:"Silicon", desc:"Thinned aggressively for stacking"}],
        process: [
          "Frontside CMP for hybrid bond preparation",
          "Wafer-to-wafer or die-to-wafer alignment",
          "Bond + anneal",
          "Backside grind (if further stacking)"
        ],
        challenges: [
          {name:"Post-bond thinning stress", desc:"Grinding thin die after bonding stresses fresh bonds."},
          {name:"Test access", desc:"After bonding, only base die I/O is accessible; KGD test critical pre-bond."}
        ],
        companies: ["Intel","AMD","TSMC"],
        papers: [
          {title:"AMD 3D V-Cache: 64MB SRAM via TSMC SoIC", url:"", notes:"Commercial hybrid-bond example."}
        ]
      }
    },
    {
      id: "hb-cu-pads", name: "Cu Bond Pads", category: "Interconnect", color: "#d4691c",
      geo: { type:"padGrid", size:[3,0.005,2.5], pos:[0,-0.85,0], layer:3, opts:{nx:60, nz:50, r:0.015} },
      content: {
        overview: "Fine-pitch Cu pads on both bonding surfaces that form the electrical connection. At 6 µm pitch, ~28,000 pads/mm² are possible — orders of magnitude denser than any bump-based interconnect.",
        keywords: ["3-5 µm pad diameter","6-9 µm pitch","Sub-nm CMP roughness","Slight dishing (2-5 nm)"],
        materials: [{name:"Electroplated Cu", desc:"Damascene-style pads in SiO₂"}],
        process: ["Damascene Cu plating","CMP with controlled dishing","Post-CMP clean"],
        challenges: [{name:"Dishing uniformity across wafer", desc:"Center-to-edge variation must be <2 nm for reliable bonds."}],
        companies: ["Applied Materials","Ebara (CMP)"],
        papers: []
      }
    }
  ]
},


/* =============================================================
   3. FAN-OUT WLP (InFO)
   ============================================================= */
{
  id: "fowlp",
  name: "Fan-Out WLP",
  short: "InFO / FOWLP",
  subtitle: "Redistribution built directly on molded reconstituted wafer — no organic substrate needed. Enabled TSMC's iPhone application processor packages.",
  elements: [
    {
      id: "fo-bga", name: "BGA Balls", category: "Interconnect", color: "#9c9c9c",
      geo: { type:"ballGrid", size:[5.5,0.3,4.5], pos:[0,-1.15,0], layer:0, opts:{nx:14, nz:11, r:0.14} },
      content: {
        overview: "Second-level BGA balls formed directly on the RDL solder-resist opening. No substrate below — the fan-out RDL replaces it.",
        keywords: ["Substrate-less","0.35-0.5 mm ball pitch","Direct-on-RDL"],
        materials: [{name:"SAC305", desc:"Sn-Ag-Cu solder"}],
        process: ["Ball drop or paste + ball","Reflow"],
        challenges: [{name:"Coplanarity across large panels", desc:"Panel warpage affects BGA planarity."}],
        companies: ["TSMC","ASE","Amkor","Powertech"],
        papers: []
      }
    },
    {
      id: "fo-rdl", name: "RDL (Redistribution Layer)", category: "RDL", color: "#c47f2a",
      geo: { type:"box", size:[5.5,0.15,4.5], pos:[0,-0.9,0], layer:1 },
      content: {
        overview: "Redistribution Layers built directly on the reconstituted wafer/panel surface using semiconductor-grade lithography (not organic substrate SAP). Enables 2/2 µm L/S with polymer dielectrics — much finer than any organic substrate.",
        keywords: ["2/2 µm L/S (typ)","Polymer dielectric (PBO/PI)","Cu electroplating","Multi-layer (3-6L)","Semi-additive"],
        materials: [
          {name:"PBO (polybenzoxazole)", desc:"Photodefinable low-Dk polymer dielectric"},
          {name:"Polyimide", desc:"Alternative dielectric with higher thermal stability"},
          {name:"Electroplated Cu", desc:"RDL conductors"}
        ],
        process: [
          "Spin-coat polymer dielectric",
          "Photolithographic via patterning",
          "Cure dielectric",
          "PVD Ti/Cu seed",
          "Photoresist patterning of Cu lines",
          "Electroplate Cu",
          "Strip resist, etch seed",
          "Repeat for each RDL layer"
        ],
        challenges: [
          {name:"Panel warpage during RDL", desc:"Multi-layer polymer stack shrinks; large panels bow."},
          {name:"Die shift during mold", desc:"Chips move during EMC cure, causing overlay error in RDL."},
          {name:"Fine L/S on non-flat surfaces", desc:"Post-mold topography challenges lithography."}
        ],
        companies: ["TSMC","ASE","Amkor","Powertech","Nepes","Deca"],
        papers: [
          {title:"InFO: Integrated Fan-Out Wafer Level Packaging", url:"", notes:"TSMC's original InFO paper for iPhone A10."},
          {title:"Fan-Out Panel Level Packaging (FOPLP) Advances", url:"", notes:""},
          {title:"Die Shift Compensation in FOWLP", url:"", notes:""}
        ]
      }
    },
    {
      id: "fo-mold", name: "EMC (Reconstituted Panel)", category: "Encapsulant", color: "#1e1e1e",
      geo: { type:"box", size:[5.5,0.35,4.5], pos:[0,-0.7,0], layer:2, opts:{opacity:0.5} },
      content: {
        overview: "Epoxy molding compound that embeds the die(s) and forms the 'reconstituted wafer' or panel. Die is placed face-down on a carrier, then over-molded — after carrier release, RDL is built on the exposed die face.",
        keywords: ["Face-down die placement","Reconstituted wafer/panel","Chip-first vs Chip-last","Granular or liquid EMC"],
        materials: [{name:"Fine-filler EMC", desc:"Silica filler <25 µm for around-die flow"}],
        process: [
          "Die placement (face-down) on temporary carrier via thermal-release tape",
          "Compression mold EMC over panel",
          "Cure",
          "Carrier debond → RDL processing on exposed die face"
        ],
        challenges: [
          {name:"Die shift", desc:"Chips move during mold flow; must be compensated in RDL mask design (adaptive lithography)."},
          {name:"Panel warpage post-cure", desc:"CTE mismatch EMC vs Si drives warpage."}
        ],
        companies: ["Sumitomo Bakelite","Nagase","Hitachi Chemical (Resonac)"],
        papers: []
      }
    },
    {
      id: "fo-die", name: "Active Die", category: "Active Die", color: "#c53030",
      geo: { type:"box", size:[2.5,0.28,2.5], pos:[0,-0.7,0], layer:2 },
      content: {
        overview: "The application die embedded in the reconstituted wafer. Placed face-down; the frontside I/O pads face the RDL. Multiple dies (e.g., AP + DRAM in InFO-PoP) can be placed side-by-side.",
        keywords: ["Face-down","No µbumps","Direct RDL contact via Cu pillar or Al pad"],
        materials: [{name:"Silicon", desc:"AP / SoC die"}],
        process: ["KGD test","Pick-and-place onto carrier","Overmold"],
        challenges: [{name:"Die placement accuracy", desc:"±5 µm placement typical; drives RDL design rules."}],
        companies: ["Apple","MediaTek","Qualcomm"],
        papers: []
      }
    },
    {
      id: "fo-tiv", name: "TIV / TMV", category: "Vertical Interconnect", color: "#c47f2a",
      geo: { type:"tsvArray", size:[5.5,0.35,4.5], pos:[0,-0.7,0], layer:2, opts:{nx:6, nz:5, r:0.05, h:0.35, skipCenter:{x:2.5,z:2.5}} },
      content: {
        overview: "Through-InFO-Via (TIV) or Through-Mold-Via (TMV): vertical Cu posts through the EMC that connect the bottom RDL to a top RDL — enabling Package-on-Package (PoP) structures like InFO-PoP where a memory package stacks on top.",
        keywords: ["Pre-fab Cu post","Or drilled + plated","250-400 µm tall","Package-on-Package enabler"],
        materials: [{name:"Electroplated Cu", desc:"Bulk conductor"}],
        process: [
          "Method A: Pre-fabricated Cu posts placed on carrier before mold",
          "Method B: Laser drill through EMC, then Cu plate",
          "Grind top to expose"
        ],
        challenges: [
          {name:"Copper post placement", desc:"Long thin posts can tilt during over-mold."},
          {name:"CTE mismatch with EMC", desc:"Cu (17) vs EMC (10 ppm/K) drives cracking."}
        ],
        companies: ["TSMC","ASE"],
        papers: []
      }
    }
  ]
},


/* =============================================================
   4. FLIP CHIP FCBGA
   ============================================================= */
{
  id: "flipchip",
  name: "Flip Chip FCBGA",
  short: "FCBGA",
  subtitle: "The mainstream high-performance package. Face-down die bonded to organic substrate via C4 bumps, encapsulated with underfill, capped with a lid.",
  elements: [
    {
      id: "fc-lid", name: "Metal Lid (IHS)", category: "Thermal", color: "#8f8f8f",
      geo: { type:"lid", size:[6,0.25,5], pos:[0,-0.15,0], layer:6, opts:{opacity:0.4} },
      content: {
        overview: "Integrated Heat Spreader (IHS) — a nickel-plated copper lid bonded to the die backside via TIM1 and to the substrate ring via adhesive. Spreads heat and protects the die.",
        keywords: ["Nickel-plated Cu","TIM1 (indium or grease)","Structural adhesive ring"],
        materials: [
          {name:"Cu (Ni-plated)", desc:"Base body for heat spread"},
          {name:"Indium TIM1", desc:"High-end: reflowed indium foil"},
          {name:"Polymer TIM1", desc:"Cost-optimized: silicone or PCM grease"}
        ],
        process: [
          "Apply TIM1 to die backside",
          "Apply adhesive to substrate ring",
          "Place lid, cure adhesive",
          "For indium TIM: reflow"
        ],
        challenges: [
          {name:"TIM1 degradation over time", desc:"Pump-out and dry-out in polymer TIMs."},
          {name:"Warpage-induced TIM voiding", desc:"Lid + die + substrate CTE mismatch pumps TIM."}
        ],
        companies: ["Intel","AMD","Cofan","Aavid"],
        papers: [
          {title:"Indium TIM1 for High-Power CPU Packages", url:"", notes:""}
        ]
      }
    },
    {
      id: "fc-die", name: "Silicon Die", category: "Active Die", color: "#c53030",
      geo: { type:"box", size:[2.5,0.3,2.5], pos:[0,-0.85,0], layer:5 },
      content: {
        overview: "The active silicon die, flipped face-down. Bump pads on the frontside connect to substrate via C4 bumps. Backside faces upward for thermal contact to the lid.",
        keywords: ["Face-down","Frontside bumps","Backside grind"],
        materials: [{name:"Silicon", desc:"Thinned to 300-780 µm depending on power/warpage tradeoff"}],
        process: ["Wafer bump plating","Backgrind","Dicing","KGD test"],
        challenges: [{name:"ELK crack risk", desc:"Extreme low-k dielectrics are fragile under C4 shear stress."}],
        companies: ["Intel","AMD","NVIDIA"],
        papers: [
          {title:"ELK Dielectric Reliability in Flip-Chip Packages", url:"", notes:""}
        ]
      }
    },
    {
      id: "fc-c4", name: "C4 Bumps", category: "Interconnect", color: "#e8b56b",
      geo: { type:"ballGrid", size:[2.5,0.1,2.5], pos:[0,-1.05,0], layer:4, opts:{nx:14, nz:14, r:0.05} },
      content: {
        overview: "Controlled Collapse Chip Connect bumps — the first-level interconnect. Modern C4 uses Cu pillar + SnAg cap at 100-150 µm pitch. Bumps are formed at wafer level before dicing.",
        keywords: ["Cu pillar","SnAg cap","100-150 µm pitch","Wafer-level plating"],
        materials: [
          {name:"Cu pillar", desc:"~50 µm tall"},
          {name:"SnAg solder cap", desc:"~30 µm tall"}
        ],
        process: [
          "UBM sputter on wafer",
          "Photoresist pattern",
          "Electroplate Cu pillar → SnAg cap",
          "Strip resist, etch UBM",
          "Reflow to shape",
          "Dice + flip + place on substrate",
          "Mass reflow"
        ],
        challenges: [
          {name:"Non-Wet Open (NWO)", desc:"Warpage causes some bumps not to touch substrate pads."},
          {name:"Electromigration", desc:"Current density in each C4 can exceed 10⁴ A/cm²."}
        ],
        companies: ["TSMC","ASE","Amkor"],
        papers: []
      }
    },
    {
      id: "fc-underfill", name: "Underfill", category: "Encapsulant", color: "#d9c9a3",
      geo: { type:"box", size:[2.6,0.1,2.6], pos:[0,-1.05,0], layer:4, opts:{opacity:0.5} },
      content: {
        overview: "Capillary underfill dispensed after C4 reflow. Fills the gap between die and substrate, encapsulating the bumps and coupling die to substrate mechanically. Reduces solder joint stress by ~10×.",
        keywords: ["Capillary flow","Silica-filled epoxy","L-shaped dispense pattern"],
        materials: [{name:"Silica-filled epoxy", desc:"~60 wt% filler"}],
        process: ["Dispense along one or two edges","Capillary fill","Cure at 150 °C"],
        challenges: [{name:"Voiding under large dies", desc:"Long flow path traps air."}],
        companies: ["Henkel","Namics","Nagase"],
        papers: []
      }
    },
    {
      id: "fc-substrate", name: "Package Substrate", category: "Substrate", color: "#3a5a2d",
      geo: { type:"box", size:[6,0.3,5], pos:[0,-1.35,0], layer:3 },
      content: {
        overview: "Organic FCBGA substrate. Fewer layers than 2.5D packages (typ. 4-12 layers) but same ABF/BT technology.",
        keywords: ["ABF build-up","4-12 layers","Fine L/S 15-25 µm"],
        materials: [{name:"ABF", desc:"Build-up dielectric"}],
        process: ["Sequential build-up"],
        challenges: [{name:"Warpage during die attach", desc:"Thin substrate + hot reflow → potato-chip shape."}],
        companies: ["Ibiden","Unimicron","Shinko"],
        papers: []
      }
    },
    {
      id: "fc-bga", name: "BGA Balls", category: "Interconnect", color: "#9c9c9c",
      geo: { type:"ballGrid", size:[6,0.3,5], pos:[0,-1.65,0], layer:2, opts:{nx:12, nz:10, r:0.14} },
      content: {
        overview: "Second-level BGA balls, 0.8-1.0 mm pitch. Standard 2nd-level interconnect for socketed or soldered-down FCBGA.",
        keywords: ["SAC305","0.8-1.0 mm pitch"],
        materials: [{name:"SAC305", desc:"Lead-free solder"}],
        process: ["Ball attach","Reflow"],
        challenges: [{name:"Board-level drop reliability", desc:"For mobile FCBGA, drop shock is the main failure mode."}],
        companies: ["Senju","Indium"],
        papers: []
      }
    },
    {
      id: "fc-adhesive", name: "Lid Adhesive Ring", category: "Adhesive", color: "#2a2a2a",
      geo: { type:"ring", size:[5.8,0.15,4.8], pos:[0,-0.5,0], layer:5 },
      content: {
        overview: "Structural adhesive that bonds the lid to the substrate perimeter. Must survive JEDEC MSL and hundreds of thermal cycles.",
        keywords: ["Silicone or epoxy","Cured at 150 °C"],
        materials: [{name:"Silicone adhesive", desc:"Compliant, absorbs CTE mismatch"}],
        process: ["Dispense ring","Place lid","Cure"],
        challenges: [{name:"Adhesive fillet cracking", desc:"Sharp fillet corners crack under TCT."}],
        companies: ["Dow","Shin-Etsu","Henkel"],
        papers: []
      }
    }
  ]
},


/* =============================================================
   5. CHIPLET / EMIB / UCIe
   ============================================================= */
{
  id: "chiplet",
  name: "Chiplet + Silicon Bridge",
  short: "EMIB / UCIe",
  subtitle: "Multiple chiplets connected through small embedded silicon bridges — cheaper than a full interposer, standardized die-to-die via UCIe.",
  elements: [
    {
      id: "ch-substrate", name: "Substrate w/ Bridge Cavity", category: "Substrate", color: "#3a5a2d",
      geo: { type:"box", size:[7,0.35,5], pos:[0,-1.5,0], layer:0 },
      content: {
        overview: "Modified organic substrate with cavities to embed silicon bridges. Rest of the substrate is standard FCBGA build-up. Intel's EMIB (Embedded Multi-die Interconnect Bridge) is the canonical example.",
        keywords: ["Bridge cavity","EMIB (Intel)","Standard ABF around cavity","Localized fine routing only where needed"],
        materials: [
          {name:"ABF", desc:"Build-up dielectric"},
          {name:"BT core", desc:"Structural"}
        ],
        process: [
          "Standard build-up to cavity depth",
          "Laser cavity formation",
          "Bridge placement + underfill",
          "Continued build-up over bridge",
          "Complete stack"
        ],
        challenges: [
          {name:"Bridge placement accuracy", desc:"Fine µbumps require ±3 µm bridge placement."},
          {name:"Cavity coplanarity", desc:"Bridge must sit flush with substrate surface."}
        ],
        companies: ["Intel","Ibiden","Unimicron"],
        papers: [
          {title:"EMIB: An Embedded Bridge for Chiplet Integration", url:"", notes:"Intel's original EMIB paper."}
        ]
      }
    },
    {
      id: "ch-bridge", name: "Silicon Bridge", category: "Bridge", color: "#4a6b8a",
      geo: { type:"box", size:[1.2,0.08,2.5], pos:[0,-1.28,0], layer:1 },
      content: {
        overview: "A small (~5-10 mm²) passive silicon chip embedded in the substrate that provides ultra-fine-pitch routing between two adjacent chiplets. Unlike a full interposer, it only spans the interface between two dies — dramatically lower cost.",
        keywords: ["Passive Si bridge","~5-10 mm² footprint","No TSVs needed","2-4 metal layers","0.4-1 µm L/S"],
        materials: [{name:"Silicon", desc:"Thinned to <100 µm"}],
        process: [
          "Fab bridge wafer at ~65 nm-class BEOL",
          "Dice into small bridges",
          "Place into substrate cavity",
          "Underfill / laminate"
        ],
        challenges: [
          {name:"Handling of small thin dies", desc:"Bridges are small and fragile — placement is challenging."},
          {name:"Signal integrity across bridge boundary", desc:"Transition from bridge µbumps to substrate C4 requires careful impedance matching."}
        ],
        companies: ["Intel","TSMC (LSI - Local Silicon Interconnect)"],
        papers: [
          {title:"Silicon Bridge vs Full Interposer: Cost/Performance Tradeoffs", url:"", notes:""}
        ]
      }
    },
    {
      id: "ch-c4", name: "C4 Bumps (Chiplet↔Substrate)", category: "Interconnect", color: "#b8b8b8",
      geo: { type:"ballGrid", size:[6,0.1,4], pos:[0,-1.15,0], layer:2, opts:{nx:24, nz:16, r:0.05, skipRect:{x:1.2,z:2.5}} },
      content: {
        overview: "Standard C4 bumps carry power, ground, and low-speed I/O from chiplet to substrate. The dense high-speed D2D signals go through the bridge below.",
        keywords: ["Standard C4","100 µm pitch","Coexist with fine bridge µbumps"],
        materials: [{name:"SnAg", desc:"Solder cap"}],
        process: ["Standard C4 flow"],
        challenges: [{name:"Height matching to bridge bumps", desc:"C4 and bridge µbump heights must land coplanar."}],
        companies: ["Intel","TSMC"],
        papers: []
      }
    },
    {
      id: "ch-ubump", name: "µbumps (Chiplet↔Bridge)", category: "Interconnect", color: "#e8b56b",
      geo: { type:"ballGrid", size:[1.2,0.04,2.5], pos:[0,-1.2,0], layer:2, opts:{nx:20, nz:35, r:0.015} },
      content: {
        overview: "Fine-pitch µbumps directly above the silicon bridge carry the D2D (die-to-die) parallel bus. 55 µm pitch typical for EMIB Gen 1, going finer with each generation.",
        keywords: ["55 µm pitch (EMIB)","Cu pillar + SnAg","Only over bridge region"],
        materials: [{name:"Cu pillar + SnAg", desc:"Standard µbump"}],
        process: ["Wafer µbump plating"],
        challenges: [{name:"Assembly alignment", desc:"Chiplet must align both to substrate C4s AND bridge µbumps simultaneously."}],
        companies: ["Intel","ASMPT"],
        papers: []
      }
    },
    {
      id: "ch-die1", name: "Chiplet A (CPU)", category: "Active Die", color: "#c53030",
      geo: { type:"box", size:[2.2,0.3,3], pos:[-1.7,-0.95,0], layer:3 },
      content: {
        overview: "One of multiple chiplets that make up the complete SoC. In AMD's Ryzen/EPYC or Intel's Sapphire Rapids, this could be a CPU compute chiplet (CCD). Uses UCIe or proprietary D2D interface to talk to neighboring chiplets.",
        keywords: ["Compute chiplet","3-5 nm node","UCIe D2D interface","Mix-and-match with other chiplets"],
        materials: [{name:"Silicon", desc:"Leading-node CMOS"}],
        process: ["Fab at leading node","Wafer bumping","KGD test"],
        challenges: [
          {name:"D2D protocol overhead", desc:"UCIe adds latency vs monolithic SoC — must be minimized."},
          {name:"Physical D2D layer power", desc:"Bump-based D2D consumes ~1 pJ/bit; hybrid bond aims for <0.1."}
        ],
        companies: ["AMD","Intel","Qualcomm"],
        papers: [
          {title:"UCIe 1.0: A Standard for Chiplet Interconnect", url:"", notes:"Standardization by UCIe consortium."},
          {title:"AMD Zen 4 Chiplet Architecture", url:"", notes:""}
        ]
      }
    },
    {
      id: "ch-die2", name: "Chiplet B (I/O)", category: "Active Die", color: "#a03030",
      geo: { type:"box", size:[2.2,0.3,3], pos:[1.7,-0.95,0], layer:3 },
      content: {
        overview: "A second chiplet — often an I/O die (older, cheaper node) — connected to Chiplet A via the embedded bridge. Splitting compute from I/O lets each be optimized in cost/performance.",
        keywords: ["I/O die","Older node (6-7 nm)","Memory controllers + PHYs"],
        materials: [{name:"Silicon", desc:"Trailing-edge node"}],
        process: ["Fab","Bump","Test"],
        challenges: [{name:"D2D signal budget across bridge", desc:"Signals must cross bump-bridge-bump path with SI margin."}],
        companies: ["AMD","Intel"],
        papers: []
      }
    }
  ]
},


/* =============================================================
   6. HBM STACK (detailed TSV view)
   ============================================================= */
{
  id: "hbm",
  name: "HBM / 3D NAND Stack",
  short: "TSV Stack Detail",
  subtitle: "A tall vertical stack of thinned DRAM dies bonded with TSVs. This tab zooms into a single HBM stack to reveal the TSV geometry.",
  elements: [
    {
      id: "hbm-base", name: "Base Logic Die", category: "Active Die", color: "#8a3030",
      geo: { type:"box", size:[3,0.25,3], pos:[0,-1.2,0], layer:0 },
      content: {
        overview: "The bottom die of the HBM stack. It's the only active logic die — contains the PHY, test circuitry, refresh logic, and self-repair. All 1024 data signals plus command/address enter through this die and get distributed vertically to the DRAM dies above via TSVs.",
        keywords: ["1024-bit interface","PHY logic","Test/repair engines","MBIST","IEEE 1500"],
        materials: [{name:"Silicon", desc:"Foundry logic node, typically ~14 nm"}],
        process: [
          "Fab base logic die",
          "Bump the topside (for stacking) and pad the bottomside (for µbump to interposer)"
        ],
        challenges: [
          {name:"Thermal sink for stack above", desc:"Heat from 12 DRAM dies above flows through base to package."},
          {name:"Signal integrity across TSV columns", desc:"1024 parallel signals need matched TSV impedance."}
        ],
        companies: ["SK hynix","Samsung","Micron"],
        papers: [
          {title:"HBM Base Die PHY Architecture", url:"", notes:""}
        ]
      }
    },
    {
      id: "hbm-dram", name: "DRAM Core Dies (12-Hi)", category: "Memory", color: "#2d3a8c",
      geo: { type:"stackedDram", size:[3,0.06,3], pos:[0,-1.0,0], layer:1, opts:{n:12, gap:0.02} },
      content: {
        overview: "8-16 DRAM core dies stacked vertically. Each die is thinned to ~50 µm and contains its own TSVs. Interlayer connection is via µbumps or (increasingly) hybrid bonding for HBM4.",
        keywords: ["1α/1β/1γ DRAM node","Thinned to ~50 µm","TSVs through each die","Stack height 8-16 dies","HBM4 → 16-Hi"],
        materials: [
          {name:"DRAM silicon", desc:"Advanced DRAM node"},
          {name:"NCF between dies", desc:"Laminated non-conductive film"}
        ],
        process: [
          "TSV formation in each DRAM die (via-middle)",
          "Wafer thinning + backside processing",
          "µbump on frontside + NCF laminate",
          "D2W TCB: stack die-by-die on base",
          "Post-stack anneal + molding"
        ],
        challenges: [
          {name:"Warpage of 50 µm-thin die", desc:"Ultra-thin die handling requires special carriers."},
          {name:"NCF air-void trapping", desc:"NCF flow during TCB must be void-free between all die pairs."},
          {name:"Yield loss compounding", desc:"Stack yield = (die yield)^N; even 99% → 88% at 12-Hi."}
        ],
        companies: ["SK hynix","Samsung","Micron"],
        papers: [
          {title:"HBM3E: 12-Hi Stack Technology", url:"", notes:""},
          {title:"Hybrid Bonding for HBM4", url:"", notes:"Path from µbump to hybrid bond in HBM roadmap."}
        ]
      }
    },
    {
      id: "hbm-tsv", name: "TSV Columns", category: "Vertical Interconnect", color: "#c47f2a",
      geo: { type:"tsvArray", size:[2.6,0.9,2.6], pos:[0,-0.7,0], layer:1, opts:{nx:6, nz:6, r:0.025, h:0.9} },
      content: {
        overview: "Vertical Cu columns that pass all the way through the DRAM stack, carrying data, address, command, power, and ground signals. ~5 µm diameter × 50 µm deep per die, aligned across all 12-16 dies.",
        keywords: ["5 µm diameter","50 µm/die × 12 dies = 600 µm total","10:1 aspect ratio","Cu filled"],
        materials: [{name:"Cu", desc:"Electroplated"}],
        process: ["Per-die via-middle formation","Backside reveal per die","Stack alignment during TCB"],
        challenges: [
          {name:"TSV-to-TSV alignment across stack", desc:"±2 µm alignment needed die-to-die; drives bonder precision."},
          {name:"Cumulative Cu pumping stress", desc:"12 dies × TSV expansion adds up during anneals."}
        ],
        companies: ["Applied Materials","Lam"],
        papers: []
      }
    },
    {
      id: "hbm-ubump", name: "Inter-die µbumps", category: "Interconnect", color: "#e8b56b",
      geo: { type:"padGrid", size:[2.6,0.02,2.6], pos:[0,-1.05,0], layer:1, opts:{nx:30, nz:30, r:0.015, tiers:12, yStep:0.08} },
      content: {
        overview: "Micro-bumps between each pair of stacked dies. Currently 40-55 µm pitch. HBM4 will transition inter-die connection to hybrid bonding for higher density and lower resistance.",
        keywords: ["40-55 µm pitch","Cu pillar + SnAg","NCF-embedded"],
        materials: [{name:"Cu pillar + SnAg", desc:"Standard µbump"}],
        process: ["Wafer µbump plating","NCF lamination","TCB stacking"],
        challenges: [{name:"Cu-Sn IMC growth over lifetime", desc:"Progressive intermetallic embrittles joints."}],
        companies: ["ASMPT","Hanmi","Besi"],
        papers: []
      }
    },
    {
      id: "hbm-mold", name: "Stack Mold", category: "Encapsulant", color: "#1e1e1e",
      geo: { type:"box", size:[3.2,0.9,3.2], pos:[0,-0.7,0], layer:2, opts:{opacity:0.35} },
      content: {
        overview: "Molding compound that encapsulates the stack sides after bonding, providing mechanical stability. Top surface is ground flat and may be exposed for direct thermal contact.",
        keywords: ["Compression mold","Side-encapsulate","Top-grind exposure"],
        materials: [{name:"EMC", desc:"Fine-filler formulation"}],
        process: ["Post-stack compression mold","Grind top to reveal top DRAM die"],
        challenges: [{name:"Stack warpage after cure", desc:"Ultra-tall EMC block shrinks unevenly."}],
        companies: ["Sumitomo Bakelite","Resonac"],
        papers: []
      }
    }
  ]
},


/* =============================================================
   7. GLASS SUBSTRATE / PANEL LEVEL
   ============================================================= */
{
  id: "glass",
  name: "Glass Substrate PLP",
  short: "Glass / PLP",
  subtitle: "Emerging: replaces organic substrate with a glass core panel. Enables ultra-fine RDL, extreme flatness, and huge panel-level throughput.",
  elements: [
    {
      id: "gl-panel", name: "Glass Core", category: "Substrate", color: "#a8c8d4",
      geo: { type:"box", size:[6.5,0.35,5], pos:[0,-1.3,0], layer:2, opts:{opacity:0.55} },
      content: {
        overview: "A thin glass panel (typ. 300-700 µm thick) replaces the traditional organic core. Glass offers ultra-flat surface, excellent dimensional stability (very low CTE ~3 ppm/K matched to Si), and low signal loss — enabling multi-layer RDL at 2/2 µm L/S over huge panels (515×510 mm class).",
        keywords: ["Ultra-flat (<10 µm TTV)","CTE ~3 ppm/K","No fiber weave → no skew","Enables 2/2 µm RDL","515×510 mm panel"],
        materials: [
          {name:"Alkali-free glass", desc:"Corning, AGC or Schott specialty formulations"},
          {name:"Fused silica variant", desc:"For very low CTE"}
        ],
        process: [
          "Purchase from glass maker in panel form",
          "TGV (Through-Glass-Via) formation",
          "RDL build-up on both sides"
        ],
        challenges: [
          {name:"Crack propagation", desc:"Glass is brittle; edge chips propagate under stress."},
          {name:"TGV formation cost/speed", desc:"Laser TGV is throughput-limited."},
          {name:"Handling large thin panels", desc:"Custom equipment needed vs organic PCB tools."}
        ],
        companies: ["Intel","Samsung","Absolics","Corning","AGC","Schott"],
        papers: [
          {title:"Glass Substrate for Advanced Packaging", url:"", notes:"Intel's glass substrate roadmap announcement (2023)."},
          {title:"TGV Formation for Panel-Level Packaging", url:"", notes:""}
        ]
      }
    },
    {
      id: "gl-tgv", name: "TGV (Through-Glass-Via)", category: "Vertical Interconnect", color: "#c47f2a",
      geo: { type:"tsvArray", size:[6.5,0.35,5], pos:[0,-1.3,0], layer:2, opts:{nx:10, nz:8, r:0.04, h:0.35} },
      content: {
        overview: "Vertical vias through the glass core, filled with Cu. Formed by laser (ns or fs pulse) followed by wet etch, then Cu plating. Aspect ratios 1:5 to 1:10.",
        keywords: ["Laser-drilled","30-80 µm diameter","1:5 to 1:10 aspect ratio","Cu-filled or conformal plated"],
        materials: [{name:"Cu", desc:"Electroplated fill"}],
        process: [
          "Laser induces damage track through glass",
          "Chemical etch enlarges hole",
          "Sputter Ti/Cu seed",
          "Cu ECD (bottom-up or conformal)",
          "CMP planarization"
        ],
        challenges: [
          {name:"Sidewall roughness", desc:"Laser+etch leaves scalloped sidewalls affecting plating."},
          {name:"Cu-glass adhesion", desc:"Cu doesn't stick to glass — needs adhesion layer engineering."},
          {name:"Void-free fill", desc:"Deep TGVs challenge super-fill chemistry."}
        ],
        companies: ["LPKF (laser)","Corning (via-in-glass)"],
        papers: [
          {title:"TGV Sidewall Engineering for Reliability", url:"", notes:""},
          {title:"Laser-Induced Deep Etching of Glass", url:"", notes:""}
        ]
      }
    },
    {
      id: "gl-rdl-top", name: "Top RDL", category: "RDL", color: "#d4691c",
      geo: { type:"box", size:[6.5,0.12,5], pos:[0,-1.05,0], layer:3 },
      content: {
        overview: "Multi-layer redistribution above the glass core, built with polymer dielectric + electroplated Cu. Because glass is so flat, RDL L/S can reach 2/2 µm.",
        keywords: ["2/2 µm L/S","PBO or PI dielectric","Semi-additive Cu","Multi-layer (4-6L typ)"],
        materials: [{name:"PBO/PI", desc:"Dielectric"},{name:"Cu", desc:"Traces"}],
        process: ["Spin dielectric","Litho","SAP Cu","Repeat"],
        challenges: [{name:"Interlayer alignment", desc:"Multi-layer overlay across full panel."}],
        companies: ["Intel","Samsung"],
        papers: []
      }
    },
    {
      id: "gl-rdl-bot", name: "Bottom RDL", category: "RDL", color: "#c47f2a",
      geo: { type:"box", size:[6.5,0.1,5], pos:[0,-1.6,0], layer:1 },
      content: {
        overview: "Bottom-side RDL fans out to BGA balls. Coarser L/S than top RDL (10-25 µm typical).",
        keywords: ["Bottom fan-out","10-25 µm L/S"],
        materials: [{name:"PBO", desc:"Dielectric"}],
        process: ["Same as top RDL"],
        challenges: [{name:"Balancing top/bot RDL stress", desc:"Asymmetric stack causes panel bow."}],
        companies: ["Intel","Samsung"],
        papers: []
      }
    },
    {
      id: "gl-die", name: "Active Die", category: "Active Die", color: "#c53030",
      geo: { type:"box", size:[2.6,0.3,2.6], pos:[0,-0.83,0], layer:4 },
      content: {
        overview: "Active silicon die (SoC / accelerator) mounted on the glass substrate via µbumps or hybrid bonding.",
        keywords: ["Face-down","Bonded to top RDL via µbumps or hybrid bond"],
        materials: [{name:"Si", desc:"Compute die"}],
        process: ["Standard flip-chip attach or W2W hybrid bond"],
        challenges: [{name:"CTE matching to glass", desc:"Si CTE 2.6 vs glass 3 → very good match; small underfill stress."}],
        companies: ["Intel","Samsung"],
        papers: []
      }
    },
    {
      id: "gl-ubump", name: "µbumps", category: "Interconnect", color: "#e8b56b",
      geo: { type:"ballGrid", size:[2.6,0.04,2.6], pos:[0,-0.97,0], layer:4, opts:{nx:30, nz:30, r:0.015} },
      content: {
        overview: "µbumps between die and glass-substrate top RDL. Because glass is ultra-flat, coplanarity is excellent and finer pitches are possible.",
        keywords: ["Very fine pitch enabled by flat glass","25-40 µm pitch"],
        materials: [{name:"Cu pillar + SnAg", desc:"Standard µbump"}],
        process: ["TCB"],
        challenges: [],
        companies: ["ASMPT","Besi"],
        papers: []
      }
    },
    {
      id: "gl-bga", name: "BGA Balls", category: "Interconnect", color: "#9c9c9c",
      geo: { type:"ballGrid", size:[6.5,0.3,5], pos:[0,-1.9,0], layer:0, opts:{nx:16, nz:12, r:0.14} },
      content: {
        overview: "Second-level BGA balls attached to bottom RDL, 0.8-1.0 mm pitch.",
        keywords: ["SAC305","0.8-1.0 mm pitch"],
        materials: [{name:"SAC305", desc:"Solder"}],
        process: ["Ball attach","Reflow"],
        challenges: [],
        companies: ["Senju","Indium"],
        papers: []
      }
    }
  ]
}

];
