import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { MACHINES, COMMON_FIELDS } from '../machines'
import Field from './Field'

const catalogSorted = [...MACHINES].sort((a, b) => a.name.localeCompare(b.name))

const fmt = (n) => {
  const r = Math.round(n * 100) / 100
  return Number.isInteger(r) ? String(r) : r.toFixed(2)
}
const sign = (n) => (n > 0 ? '+' : '')
const cls = (n) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '')

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function Tracking({ session }) {
  const [userMachines, setUserMachines] = useState(null) // null = loading
  const [machine, setMachine] = useState(null) // currently entering a play for this one
  const [showAdd, setShowAdd] = useState(false)
  const [values, setValues] = useState({})
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState(null) // { machineName, dollars, units }

  const loadUserMachines = async () => {
    const { data } = await supabase
      .from('user_machines')
      .select('*')
      .order('machine_name', { ascending: true })
    setUserMachines(data || [])
  }
  useEffect(() => { loadUserMachines() }, [])

  const removeMachine = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Remove this game from your list? Past entries are kept.')) return
    await supabase.from('user_machines').delete().eq('id', id)
    loadUserMachines()
  }

  // ---- Add-game picker ----
  if (showAdd) {
    return (
      <AddGamePicker
        session={session}
        already={userMachines || []}
        onDone={() => { setShowAdd(false); loadUserMachines() }}
        onCancel={() => setShowAdd(false)}
      />
    )
  }

  // ---- Confirmation after adding a play ----
  if (summary) {
    return (
      <div>
        <h2 className="screen-title">Play added</h2>
        <div className="play-card">
          <div className="play-name">{summary.machineName}</div>
          <div className="play-row highlight">
            <span className="play-label">Result</span>
            <span className="play-value">
              {sign(summary.dollars)}{fmt(summary.dollars)}
            </span>
          </div>
          <div className="play-row highlight">
            <span className="play-label">Units</span>
            <span className="play-value">
              {sign(summary.units)}{fmt(summary.units)}
            </span>
          </div>
        </div>
        <button className="btn primary block" onClick={() => { setSummary(null); setMachine(null); setValues({}) }}>
          Back to my games
        </button>
      </div>
    )
  }

  // ---- Step 2: entry form for a picked machine ----
  if (machine) {
    const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

    const addPlay = async () => {
      setBusy(true)
      const inV = Number(values.in) || 0
      const outV = Number(values.out) || 0
      const spin = Number(values.spin) || 0
      const dollars = outV - inV
      const units = spin ? dollars / spin : 0
      const { error } = await supabase.from('plays').insert({
        user_id: session.user.id,
        machine_id: machine.machine_id,
        machine_name: machine.machine_name,
        data: values,
        result_units: units,
        result_dollars: dollars,
      })
      setBusy(false)
      if (error) { alert(error.message); return }
      setSummary({ machineName: machine.machine_name, dollars, units })
    }

    return (
      <div>
        <button className="linkbtn" onClick={() => { setMachine(null); setValues({}) }}>‹ My games</button>
        <h2 className="screen-title">{machine.machine_name}</h2>
        <div className="form">
          {COMMON_FIELDS.map((f) => (
            <Field key={f.key} f={f} value={values[f.key]} onChange={set(f.key)} />
          ))}
          <button className="btn primary block" onClick={addPlay} disabled={busy}>
            {busy ? 'Adding…' : 'Add play'}
          </button>
        </div>
      </div>
    )
  }

  // ---- Step 1: my games list (personal, starts empty) ----
  if (userMachines === null) return <p className="muted">Loading…</p>

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 14 }}>
        <h2 className="screen-title" style={{ margin: 0 }}>My games</h2>
        <button className="btn primary small" onClick={() => setShowAdd(true)}>+ Add game</button>
      </div>

      {userMachines.length === 0 ? (
        <div className="empty">
          No games added yet. Tap <strong>+ Add game</strong> to start tracking the ones you actually play.
        </div>
      ) : (
        <div className="machine-list">
          {userMachines.map((m) => (
            <button key={m.id} className="machine-item" onClick={() => { setMachine(m); setValues({}) }}>
              <span>{m.machine_name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="chev">›</span>
                <span
                  role="button"
                  onClick={(e) => removeMachine(m.id, e)}
                  style={{ color: 'var(--muted)', fontSize: 18, padding: '0 4px' }}
                >
                  ×
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AddGamePicker({ session, already, onDone, onCancel }) {
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const alreadyIds = new Set(already.map((m) => m.machine_id))

  const filtered = catalogSorted.filter(
    (m) => !alreadyIds.has(m.id) && m.name.toLowerCase().includes(search.toLowerCase())
  )

  const add = async (machineId, machineName) => {
    setBusy(true)
    const { error } = await supabase.from('user_machines').insert({
      user_id: session.user.id,
      machine_id: machineId,
      machine_name: machineName,
    })
    setBusy(false)
    if (error) { alert(error.message); return }
    onDone()
  }

  const addCustom = async () => {
    const name = search.trim()
    if (!name) return
    let id = slugify(name)
    if (alreadyIds.has(id)) id = `${id}-${Date.now().toString(36).slice(-4)}`
    await add(id, name)
  }

  const exactCatalogMatch = catalogSorted.some((m) => m.name.toLowerCase() === search.trim().toLowerCase())

  return (
    <div>
      <button className="linkbtn" onClick={onCancel}>‹ My games</button>
      <h2 className="screen-title">Add a game</h2>

      <input
        className="input"
        placeholder="Search or type a new game name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      {search.trim() && !exactCatalogMatch && (
        <button className="machine-item" onClick={addCustom} disabled={busy} style={{ marginBottom: 14 }}>
          <span>Add "{search.trim()}" as a new game</span>
          <span className="chev">+</span>
        </button>
      )}

      <div className="machine-list">
        {filtered.map((m) => (
          <button key={m.id} className="machine-item" onClick={() => add(m.id, m.name)} disabled={busy}>
            <span>{m.name}</span>
            <span className="chev">+</span>
          </button>
        ))}
        {filtered.length === 0 && !search.trim() && (
          <div className="empty small">Every catalog game is already on your list — or type a name above to add your own.</div>
        )}
      </div>
    </div>
  )
}
