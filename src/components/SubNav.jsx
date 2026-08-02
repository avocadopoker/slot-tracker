export default function SubNav({ items, active, onChange }) {
  return (
    <div className="subnav">
      {items.map((it) => (
        <button
          key={it.id}
          className={`subtab ${active === it.id ? 'active' : ''}`}
          onClick={() => onChange(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}
