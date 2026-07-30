// ============================================================
// GUIDE CONTENT  (this is YOUR proprietary play data — you fill it in)
//
// Keyed by machine id (must match an id in machines.js).
// Each machine holds an array of advantage plays. Add as many as apply.
//
// Each play:
//   name      -> short label for the play (e.g. "Meter chase", "Must-hit")
//   condition -> WHEN it's an advantage play / +EV (the trigger + threshold)
//   variance  -> how swingy it is (e.g. Low / Medium / High + a note)
//   bankroll  -> bankroll / buy-in guidance
//   edge      -> optional: rough edge or EV note
//   notes     -> anything else (heat, difficulty, timing, resets, etc.)
//
// Leave the array empty ([]) for machines you haven't documented yet —
// the app shows "Not documented yet" for those.
//
// This is a STARTING POINT, not stated as fact — the app presents these
// as Slotly's own recommendations from testing + AP consultation.
// ============================================================

export const GUIDE = {
  'buffalo-instant-hit': [
    // { name: '', condition: '', variance: '', bankroll: '', edge: '', notes: '' },
  ],
  'buffalo-link': [],
  'frankenstein': [],
  'frankenstein-wheel': [],
  'lightning-storm': [],
  'magic-rockets': [],
  'magic-treasures': [],
  'magic-treasures-gold': [],
  'phoenix-link': [],
  'regal-link': [],
  'regal-riches': [],
  'wof-highroller': [],
  'wolf-run-eclipse': [],
}
