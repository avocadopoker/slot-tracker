import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

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
    return <GameEntries machine={openMachine} onBack={() => setOpenMachine(null)} />
  }

  if (loading) return <p className="muted">Loading…</p>
  if (rows.length === 0) return <div className="empty">No plays tracked yet. Add one from the Tracking tab.</div>

  return (
    <div>
      <table className="results">
        <thead>
          <tr>
            <th className="left">Game</th>
            <th>#</th>
            <th>Units</th>
            <th>$$$</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} onClick={() => setOpenMachine(r)} style={{ cursor: 'pointer' }}>
              <td className="left">{r.name}</td>
              <td className="num">{r.entries}</td>
              <td className={`num ${cls(r.units)}`}>{sign(r.units)}{fmt(r.units)}</td>
              <td className={`num ${cls(r.dollars)}`}>{sign(r.dollars)}{fmt(r.dollars)}</td>
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

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('plays')
        .select('*')
        .eq('machine_id', machine.id)
        .order('created_at', { ascending: false })
      setEntries(data || [])
      setLoading(false)
    })()
  }, [machine.id])

  const filtered = entries.filter((e) => matchesFilter(e.data?.play, filter))

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
        filtered.map((e) => {
          const d = e.data || {}
          return (
            <div key={e.id} className="play-card">
              {d.play && <div className="play-name">{d.play}</div>}
              <div className="play-row">
                <span className="play-label">$-In</span>
                <span className="play-value">{d.in ?? '—'}</span>
              </div>
              <div className="play-row">
                <span className="play-label">$/Spin</span>
                <span className="play-value">{d.spin ?? '—'}</span>
              </div>
              <div className="play-row">
                <span className="play-label">$-Out</span>
                <span className="play-value">{d.out ?? '—'}</span>
              </div>
              <div className="play-row highlight">
                <span className="play-label">Result</span>
                <span className="play-value">
                  {sign(e.result_dollars)}{fmt(e.result_dollars)} ({sign(e.result_units)}{fmt(e.result_units)} units)
                </span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
