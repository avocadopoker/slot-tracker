import { useState } from 'react'
import { MACHINES, COMMON_FIELDS } from '../machines'

const sorted = [...MACHINES].sort((a, b) => a.name.localeCompare(b.name))

export default function Database() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)

  const list = sorted.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))

  if (open) {
    const fields = [...COMMON_FIELDS, ...open.fields]
    return (
      <div>
        <button className="linkbtn" onClick={() => setOpen(null)}>‹ Database</button>
        <h2 className="screen-title">{open.name}</h2>
        <div className="play-card">
          {fields.map((f) => (
            <div key={f.key} className="play-row">
              <span className="play-label">{f.label}</span>
              <span className="play-value">
                {f.type === 'select' ? f.options.join(' · ') : f.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <input
        className="input"
        placeholder="Search machines…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginBottom: 14 }}
      />
      <div className="machine-list">
        {list.map((m) => (
          <button key={m.id} className="machine-item" onClick={() => setOpen(m)}>
            <span>{m.name}</span>
            <span className="chev">›</span>
          </button>
        ))}
        {list.length === 0 && <div className="empty">No machines match “{q}”.</div>}
      </div>
    </div>
  )
}
