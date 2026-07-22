export default function Field({ f, value, onChange }) {
  if (f.type === 'select') {
    return (
      <label className="field">
        <span className="field-label">{f.label}</span>
        <select className="input" value={value ?? ''} onChange={onChange}>
          <option value="" disabled>Select…</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    )
  }
  return (
    <label className="field">
      <span className="field-label">{f.label}</span>
      <input
        className="input"
        type={f.type === 'number' ? 'number' : 'text'}
        inputMode={f.type === 'number' ? 'decimal' : 'text'}
        value={value ?? ''}
        onChange={onChange}
      />
    </label>
  )
}
