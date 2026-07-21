import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

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
          if (!map[k]) map[k] = { machine: k, plays: 0, units: 0, dollars: 0 }
          map[k].plays += 1
          map[k].units += Number(p.result_units) || 0
          map[k].dollars += Number(p.result_dollars) || 0
        }
        setRows(Object.values(map).sort((a, b) => b.plays - a.plays))
      }
      setLoading(false)
    })()
  }, [])

  const sign = (n) => (n > 0 ? '+' : '')
  const cls = (n) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '')

  if (loading) return <p className="muted">Loading…</p>
  if (rows.length === 0)
    return (
      <div>
        <h2 className="screen-title">Results</h2>
        <div className="empty">No plays tracked yet. Add one from the Tracking tab.</div>
      </div>
    )

  return (
    <div>
      <h2 className="screen-title">Results</h2>
      <table className="results">
        <thead>
          <tr>
            <th className="left">Machine</th>
            <th>Plays</th>
            <th>± Units</th>
            <th>± $</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.machine}>
              <td className="left">{r.machine}</td>
              <td className="num">{r.plays}</td>
              <td className={`num ${cls(r.units)}`}>{sign(r.units)}{r.units}</td>
              <td className={`num ${cls(r.dollars)}`}>{sign(r.dollars)}{r.dollars.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
