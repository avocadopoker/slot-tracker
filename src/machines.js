// ============================================================
// SLOT MACHINE CONFIG  (developer edits this file — users never see it)
//
// Every game uses the SAME four fields, in this order:
//   $-In, $/Spin, Play (free text — user's own note per entry), $-Out
// $-Out is last since it's the one filled in last, when cashing out.
//
//   $ result  = $-Out - $-In
//   Units     = $ result / $-per-spin   (computed automatically)
//
// "Play" is free text — the user writes whatever they want per entry
// (e.g. "must-hit 900", "green bonus", anything). The Database screen
// later lists the different values users have typed, per game.
//
// To add a game: add a line to MACHINES below with a unique id and a
// display name. The list is sorted alphabetically automatically.
// ============================================================

export const COMMON_FIELDS = [
  { key: 'in',   label: '$-In',   type: 'number' },
  { key: 'spin', label: '$/Spin', type: 'number' },
  { key: 'play', label: 'Play',   type: 'text' },
  { key: 'out',  label: '$-Out',  type: 'number' },
]

export const MACHINES = [
  { id: 'buffalo-instant-hit', name: 'Buffalo Instant Hit' },
  { id: 'buffalo-link', name: 'Buffalo Link' },
  { id: 'frankenstein', name: 'Frankenstein' },
  { id: 'frankenstein-wheel', name: 'Frankenstein Wheel' },
  { id: 'lightning-storm', name: 'Lightning Storm' },
  { id: 'magic-rockets', name: 'Magic Rockets' },
  { id: 'magic-treasures', name: 'Magic Treasures' },
  { id: 'magic-treasures-gold', name: 'Magic Treasures Gold' },
  { id: 'phoenix-link', name: 'Phoenix Link' },
  { id: 'regal-link', name: 'Regal Link' },
  { id: 'regal-riches', name: 'Regal Riches' },
  { id: 'wof-highroller', name: 'WOF Highroller' },
  { id: 'wolf-run-eclipse', name: 'Wolf Run Eclipse' },
]

// Bigger geographic areas for the marketplace (seed more here as needed)
export const AREAS = ['VEGAS STRIP', 'VEGAS DOWNTOWN']
