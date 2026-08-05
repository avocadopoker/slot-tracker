import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { MACHINES, COMMON_FIELDS } from '../machines'
import Field from './Field'

const sortedMachines = [...MACHINES].sort((a, b) => a.name.localeCompare(b.name))

export default function Tracking({ session }) {
  const [machine, setMachine] = useState(null)
  const [values, setValues] = useState({})
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState('')

  // Step 1: pick a machine (alphabetical)
  if (!machine) {
    return (
      <div>
        {flash && <div className="flash">{flash}</div>}
        <div className="machine-list">
          {sortedMachines.map((m) => (
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

  // Step 2: the 4 universal fields — $-In, $/Spin, Play, $-Out (in that order)
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
      machine_id: machine.id,
      machine_name: machine.name,
      data: values,
      result_units: units,
      result_dollars: dollars,
    })
    setBusy(false)
    if (error) { alert(error.message); return }
    setFlash(`Play added to ${machine.name}`)
    setMachine(null)
    setValues({})
  }

  return (
    <div>
      <button className="linkbtn" onClick={() => { setMachine(null); setValues({}) }}>‹ Machines</button>
      <h2 className="screen-title">{machine.name}</h2>
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
