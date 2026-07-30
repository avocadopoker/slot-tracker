import { useState } from 'react'
import { MACHINES } from '../machines'
import { GUIDE } from '../guide'

const sortedMachines = [...MACHINES].sort((a, b) => a.name.localeCompare(b.name))

export default function Guide() {
  const [machine, setMachine] = useState(null)

  // Machine list
  if (!machine) {
    return (
      <div>
        <div className="machine-list">
          {sortedMachines.map((m) => {
            const count = (GUIDE[m.id] || []).length
            return (
              <button key={m.id} className="machine-item" onClick={() => setMachine(m)}>
                <span>{m.name}</span>
                <span className="guide-count">
                  {count > 0 ? `${count} play${count > 1 ? 's' : ''}` : '—'}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Machine detail
  const plays = GUIDE[machine.id] || []

  return (
    <div>
      <button className="linkbtn" onClick={() => setMachine(null)}>‹ All machines</button>
      <h2 className="screen-title">{machine.name}</h2>

      {plays.length === 0 ? (
        <div className="empty">Not documented yet.</div>
      ) : (
        plays.map((p, i) => (
          <div key={i} className="play-card">
            {p.name && <div className="play-name">{p.name}</div>}
            {p.condition && <Row label="Advantage when" value={p.condition} highlight />}
            {p.variance && <Row label="Variance" value={p.variance} />}
            {p.bankroll && <Row label="Bankroll" value={p.bankroll} />}
            {p.edge && <Row label="Edge" value={p.edge} />}
            {p.notes && <Row label="Notes" value={p.notes} />}
          </div>
        ))
      )}

      <p className="muted note">
        Slotly recommendations — a starting point from our own testing and AP consultation, not a guarantee.
      </p>
    </div>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className={`play-row ${highlight ? 'highlight' : ''}`}>
      <span className="play-label">{label}</span>
      <span className="play-value">{value}</span>
    </div>
  )
}
