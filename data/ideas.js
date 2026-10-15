// Hoogwan's own ideas — sketches and concepts shown in the Ideas view.
//
// To add one: put the image in assets/ideas/ and add an entry below.
// {
//   id:       'unique-slug',
//   title:    'Short title',
//   date:     '2026-10',                 // shown as-is
//   image:    'assets/ideas/my-sketch.png',   // optional — without it, the front view of relatesTo's structure is drawn
//   summary:  'One or two sentences on the idea.',
//   tags:     ['hybrid bonding', 'thermal'],
//   relatesTo: { packageId: 'cowos', elementId: 'hb-bondline' }   // optional — adds a "View in 3D" link
// }
window.IDEAS = [
  {
    id: 'gpu-hbm-pu-on-glass',
    title: 'GPU–HBM processing units on a glass interposer',
    date: '2026-10',
    summary: 'Put the HBM directly under each GPU so GPU + memory act as one processing unit, link the two units optically through a photonic glass interposer, send I/O out through a photonic engine, feed power up through the glass, and add HBF as a capacity tier. Drawn in 3D as structure f.',
    tags: ['memory-under-logic', 'glass interposer', 'HBF', 'vertical power', 'optical I/O'],
    relatesTo: { packageId: 'idea-pu', elementId: 'idea-hbm' }
  }
];
