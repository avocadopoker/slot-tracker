import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const fmt = (n) => {
  const r = Math.round(n * 100) / 100
  return Number.isInteger(r) ? String(r) : r.toFixed(2)
}
const sign = (n) => (n > 0 ? '+' : '')
const cls = (n) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '')

export default function Results() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('plays')
        .select('machine_name, result_units, result_dollars')
      if (!error && data) {
        const map = {}
        for (const p of data) {
          const k = p.machine_name
          if (!map[k]) map[k] = { machine: k, entries: 0, units: 0, dollars: 0 }
          map[k].entries += 1
          map[k].units += Number(p.result_units) || 0
          map[k].dollars += Number(p.result_dollars) || 0
        }
        setRows(Object.values(map).sort((a, b) => b.entries - a.entries))
      }
      setLoading(false)
    })()
  }, [])

  if (loading) return <p className="muted">Loading…</p>
  if (rows.length === 0)
    return (
      <div className="empty">No plays tracked yet. Add one from the Tracking tab.</div>
    )

  return (
    <div>
      <table className="results">
        <thead>
          <tr>
            <th className="left">Game</th>
            <th>Entries</th>
            <th>Units</th>
            <th>$$$</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.machine}>
              <td className="left">{r.machine}</td>
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
