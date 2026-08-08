import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { COMMON_FIELDS } from '../machines'
import Field from './Field'

const fmt = (n) => {
  const r = Math.round(n * 100) / 100
  return Number.isInteger(r) ? String(r) : r.toFixed(2)
}
const sign = (n) => (n > 0 ? '+' : '')
const cls = (n) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '')

export default function Database() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [openMachine, setOpenMachine] = useState(null) // { id, name }

  useEffect(() => { loadOverview() }, [])

  const loadOverview = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('plays')
      .select('machine_id, machine_name, result_units, result_dollars')
    if (!error && data) {
      const map = {}
      for (const p of data) {
        const k = p.machine_id
        if (!map[k]) map[k] = { id: k, name: p.machine_name, entries: 0, units: 0, dollars: 0 }
        map[k].entries += 1
        map[k].units += Number(p.result_units) || 0
        map[k].dollars += Number(p.result_dollars) || 0
      }
      setRows(Object.values(map).sort((a, b) => b.entries - a.entries))
    }
    setLoading(false)
  }

  if (openMachine) {
    return <GameEntries machine={openMachine} onBack={() => { setOpenMachine(null); loadOverview() }} />
  }

  if (loading) return <p className="muted">Loading…</p>
  if (rows.length === 0) return <div className="empty">No plays tracked yet. Add one from the Tracking tab.</div>

  const total = rows.reduce(
    (acc, r) => ({ entries: acc.entries + r.entries, units: acc.units + r.units, dollars: acc.dollars + r.dollars }),
    { entries: 0, units: 0, dollars: 0 }
  )

  return (
    <div>
      <table className="results">
        <thead>
          <tr>
            <th className="left">Game</th>
            <th>#</th>
            <th>Units</th>
            <th>$$$</th>
            <th aria-hidden="true"></th>
          </tr>
        </thead>
        <tbody>
          <tr className="total-row">
            <td className="left">TOTAL</td>
            <td className="num">{total.entries}</td>
            <td className={`num ${cls(total.units)}`}>{sign(total.units)}{fmt(total.units)}</td>
            <td className={`num ${cls(total.dollars)}`}>{sign(total.dollars)}{fmt(total.dollars)}</td>
            <td></td>
          </tr>
          {rows.map((r) => (
            <tr key={r.id} className="clickable-row" onClick={() => setOpenMachine(r)}>
              <td className="left">{r.name}</td>
              <td className="num">{r.entries}</td>
              <td className={`num ${cls(r.units)}`}>{sign(r.units)}{fmt(r.units)}</td>
              <td className={`num ${cls(r.dollars)}`}>{sign(r.dollars)}{fmt(r.dollars)}</td>
              <td className="num row-chev">›</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function matchesFilter(playText, filter) {
  if (!filter) return true
  const text = (playText || '').toLowerCase()
  const trimmed = filter.trim()
  // Quoted filter ("A") = exact match on the play text
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    const exact = trimmed.slice(1, -1).toLowerCase()
    return text === exact
  }
  // Otherwise = contains match
  return text.includes(trimmed.toLowerCase())
}

function GameEntries({ machine, onBack }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [editingEntry, setEditingEntry] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('plays')
      .select('*')
      .eq('machine_id', machine.id)
      .order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [machine.id])

  const filtered = entries.filter((e) => matchesFilter(e.data?.play, filter))

  const startEdit = (entry) => {
    setEditingEntry(entry)
    setEditValues({ ...entry.data })
  }
  const cancelEdit = () => {
    setEditingEntry(null)
    setEditValues({})
  }
  const setField = (key) => (e) => setEditValues((v) => ({ ...v, [key]: e.target.value }))

  const saveEdit = async () => {
    setSaving(true)
    const inV = Number(editValues.in) || 0
    const outV = Number(editValues.out) || 0
    const spin = Number(editValues.spin) || 0
    const dollars = outV - inV
    const units = spin ? dollars / spin : 0
    const { error } = await supabase
      .from('plays')
      .update({ data: editValues, result_units: units, result_dollars: dollars })
      .eq('id', editingEntry.id)
    setSaving(false)
    if (error) { alert(error.message); return }
    setEditingEntry(null)
    setEditValues({})
    load()
  }

  // ---- Editing a single entry: focused form, same style as Tracking ----
  if (editingEntry) {
    return (
      <div>
        <button className="linkbtn" onClick={cancelEdit}>‹ Entries</button>
        <h2 className="screen-title">{editingEntry.data?.play || machine.name}</h2>
        <div className="form">
          {COMMON_FIELDS.map((f) => (
            <Field key={f.key} f={f} value={editValues[f.key]} onChange={setField(f.key)} />
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary" onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn ghost" onClick={cancelEdit} disabled={saving}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  // ---- List of entries: same table style as the game overview,
  // Play name instead of Game name ----
  return (
    <div>
      <button className="linkbtn" onClick={onBack}>‹ Database</button>
      <h2 className="screen-title">{machine.name}</h2>

      <input
        className="input"
        placeholder='Filter by play… (use "exact" for an exact match)'
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      {loading ? (
        <p className="muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="empty">No entries match.</div>
      ) : (
        <table className="results">
          <thead>
            <tr>
              <th className="left">Play</th>
              <th>Units</th>
              <th>$$$</th>
              <th aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="clickable-row" onClick={() => startEdit(e)}>
                <td className="left">{e.data?.play || '—'}</td>
                <td className={`num ${cls(e.result_units)}`}>{sign(e.result_units)}{fmt(e.result_units)}</td>
                <td className={`num ${cls(e.result_dollars)}`}>{sign(e.result_dollars)}{fmt(e.result_dollars)}</td>
                <td className="num row-chev">›</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
