// ============================================================
// SLOT MACHINE CONFIG
// This is where YOU (the developer) set up machines and their
// tracking fields. Users never see this file — they just pick a
// machine and fill out whatever fields you define here.
//
// To ADD a machine: copy one { ... } block, paste it, change the
// values, save, commit, push. Netlify redeploys automatically.
//
// Each machine:
//   id    -> short unique code, lowercase, no spaces
//   name  -> what the user sees in the machine list
//   fields-> the inputs shown after the user picks this machine
//
// Each field:
//   key   -> short unique code within this machine
//   label -> what the user sees next to the input
//   type  -> 'number' or 'text'
//   role  -> OPTIONAL. Marks which field feeds the Results table:
//              role: 'units'   -> counts toward "± Units"
//              role: 'dollars' -> counts toward "± $"
//            Leave role off for fields that are just notes/data.
// ============================================================

export const MACHINES = [
  {
    id: 'buffalo',
    name: 'Buffalo',
    fields: [
      { key: 'bet',     label: 'Bet size ($)',    type: 'number' },
      { key: 'units',   label: 'Result (units)',  type: 'number', role: 'units' },
      { key: 'dollars', label: 'Result ($)',      type: 'number', role: 'dollars' },
      { key: 'notes',   label: 'Notes',           type: 'text' },
    ],
  },
  {
    id: 'dragon-link',
    name: 'Dragon Link',
    fields: [
      { key: 'meter',   label: 'Minor meter ($)', type: 'number' },
      { key: 'bet',     label: 'Bet size ($)',    type: 'number' },
      { key: 'units',   label: 'Result (units)',  type: 'number', role: 'units' },
      { key: 'dollars', label: 'Result ($)',      type: 'number', role: 'dollars' },
    ],
  },
  {
    id: 'lightning-link',
    name: 'Lightning Link',
    fields: [
      { key: 'meter',   label: 'Must-hit-by ($)', type: 'number' },
      { key: 'current', label: 'Current meter ($)', type: 'number' },
      { key: 'units',   label: 'Result (units)',  type: 'number', role: 'units' },
      { key: 'dollars', label: 'Result ($)',      type: 'number', role: 'dollars' },
    ],
  },
]
