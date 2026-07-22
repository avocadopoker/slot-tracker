// ============================================================
// SLOT MACHINE CONFIG  (developer edits this file — users never see it)
//
// COMMON_FIELDS are shown on top of EVERY game: $-In, $-Out, $/Spin.
//   $ result  = $-Out - $-In
//   Units     = $ result / $/Spin   (computed automatically)
//
// Each machine below adds its own fields under the common three.
//
// Field types:
//   'number'  -> numeric input
//   'text'    -> text input
//   'select'  -> dropdown; needs an `options` array
//
// To add a game: copy a { ... } block, change the values, save, push.
// The game list is sorted alphabetically automatically.
// ============================================================

export const COMMON_FIELDS = [
  { key: 'in',   label: '$-In',   type: 'number' },
  { key: 'out',  label: '$-Out',  type: 'number' },
  { key: 'spin', label: '$/Spin', type: 'number' },
]

export const MACHINES = [
  { id: 'buffalo-instant-hit', name: 'Buffalo Instant Hit', fields: [
    { key: 'play', label: 'Play', type: 'select', options: ['2/1', '1/2', '1/1'] },
  ]},
  { id: 'buffalo-link', name: 'Buffalo Link', fields: [
    { key: 'entry', label: 'Entry', type: 'number' },
  ]},
  { id: 'frankenstein', name: 'Frankenstein', fields: [
    { key: 'entry', label: 'Entry', type: 'number' },
  ]},
  { id: 'frankenstein-wheel', name: 'Frankenstein Wheel', fields: [
    { key: 'entry', label: 'Entry', type: 'number' },
  ]},
  { id: 'lightning-storm', name: 'Lightning Storm', fields: [
    { key: 'entry', label: 'Entry', type: 'number' },
  ]},
  { id: 'magic-rockets', name: 'Magic Rockets', fields: [
    { key: 'play',   label: 'Play',   type: 'select', options: ['GREEN/YELLOW', 'GREEN', 'YELLOW'] },
    { key: 'green',  label: 'Green',  type: 'number' },
    { key: 'yellow', label: 'Yellow', type: 'number' },
  ]},
  { id: 'magic-treasures', name: 'Magic Treasures', fields: [
    { key: 'balls', label: 'Balls', type: 'number' },
  ]},
  { id: 'magic-treasures-gold', name: 'Magic Treasures Gold', fields: [
    { key: 'play',  label: 'Play',  type: 'select', options: ['GREEN', 'PURPLE', 'GP'] },
    { key: 'value', label: 'Value', type: 'number' },
  ]},
  { id: 'phoenix-link', name: 'Phoenix Link', fields: [
    { key: 'entry', label: 'Entry', type: 'number' },
  ]},
  { id: 'regal-link', name: 'Regal Link', fields: [
    { key: 'play',  label: 'Play',  type: 'select', options: ['#', 'AMBER', 'SAPHIRE', 'PURPLE', 'AS'] },
    { key: 'value', label: 'Value', type: 'number' },
  ]},
  { id: 'regal-riches', name: 'Regal Riches', fields: [
    { key: 'play',  label: 'Play',  type: 'select', options: ['#', 'PURPLE', 'GREEN', 'YELLOW', 'TOTAL'] },
    { key: 'value', label: 'Value', type: 'number' },
  ]},
  { id: 'wof-highroller', name: 'WOF Highroller', fields: [
    { key: 'ways', label: 'Ways', type: 'number' },
    { key: 'type', label: 'Type', type: 'select', options: ['1/5 4x', '1/5 5x', '1/5 ?', '2/4 2x', '3?', 'WAYS'] },
  ]},
  { id: 'wolf-run-eclipse', name: 'Wolf Run Eclipse', fields: [
    { key: 'play',  label: 'Play',  type: 'select', options: ['MINOR/MINI', 'MINOR', 'MINI'] },
    { key: 'major', label: 'Major', type: 'number' },
    { key: 'minor', label: 'Minor', type: 'number' },
    { key: 'mini',  label: 'Mini',  type: 'number' },
  ]},
]

// Bigger geographic areas for the marketplace (seed more here as needed)
export const AREAS = ['VEGAS STRIP', 'VEGAS DOWNTOWN']
