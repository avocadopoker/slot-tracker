import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { MACHINES } from '../machines'

export default function Tracking({ session }) {
  const [machine, setMachine] = useState(null)
  const [values, setValues] = useState({})
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState('')

  // Step 1: pick a machine
  if (!machine) {
    return (
      <div>
        <h2 className="screen-title">Pick a machine</h2>
        {flash && <div className="flash">{flash}</div>}
        <div className="machine-list">
          {MACHINES.map((m) => (
            <button
              key={m.id}
              className="machine-item"
              onClick={() => { setMachine(m); setValues({}); setFlash('') }}
            >
              <span>{m.name}</span>
              <span className="chev">›</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Step 2: fill fields for the picked machine
  const set = (key) => (e) => setValues({ ...values, [key]: e.target.value })

  const addPlay = async () => {
    setBusy(true)
    const unitsField = machine.fields.find((f) => f.role === 'units')
    const dollarsField = machine.fields.find((f) => f.role === 'dollars')
    const row = {
      user_id: session.user.id,
      machine_id: machine.id,
      machine_name: machine.name,
      data: values,
      result_units: unitsField ? Number(values[unitsField.key]) || 0 : 0,
      result_dollars: dollarsField ? Number(values[dollarsField.key]) || 0 : 0,
    }
    const { error } = await supabase.from('plays').insert(row)
    setBusy(false)
    if (error) { alert(error.message); return }
    // back to machine selection with a confirmation
    setFlash(`Play added to ${machine.name}`)
    setMachine(null)
    setValues({})
  }

  return (
    <div>
      <button className="linkbtn" onClick={() => { setMachine(null); setValues({}) }}>
        ‹ Machines
      </button>
      <h2 className="screen-title">{machine.name}</h2>

      <div className="form">
        {machine.fields.map((f) => (
          <label key={f.key} className="field">
            <span className="field-label">{f.label}</span>
            <input
              className="input"
              type={f.type === 'number' ? 'number' : 'text'}
              inputMode={f.type === 'number' ? 'decimal' : 'text'}
              value={values[f.key] ?? ''}
              onChange={set(f.key)}
            />
          </label>
        ))}
        <button className="btn primary block" onClick={addPlay} disabled={busy}>
          {busy ? 'Adding…' : 'Add play'}
        </button>
      </div>
    </div>
  )
}
