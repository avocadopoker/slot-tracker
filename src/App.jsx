import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [tab, setTab] = useState('tracker')
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 640, margin: '0 auto', padding: '1rem' }}>
      <h1>Slot Tracker</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab('tracker')} style={tabStyle(tab === 'tracker')}>Tracker</button>
        <button onClick={() => setTab('market')} style={tabStyle(tab === 'market')}>Marketplace</button>
      </div>
      {tab === 'tracker' ? <Tracker /> : <Marketplace />}
    </div>
  )
}

const tabStyle = (active) => ({
  padding: '8px 16px',
  border: '1px solid #333',
  background: active ? '#333' : '#fff',
  color: active ? '#fff' : '#333',
  cursor: 'pointer',
})

function Tracker() {
  return <p>Tracking setup TBD — fields depend on game type. Coming next session.</p>
}

function Marketplace() {
  const [plays, setPlays] = useState([])
  const [form, setForm] = useState({ title: '', game: '', location: '', description: '', price_usd: '' })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data, error } = await supabase
      .from('plays')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (!error) setPlays(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const submit = async () => {
    if (!form.title.trim()) return
    const { error } = await supabase.from('plays').insert({
      ...form,
      price_usd: Number(form.price_usd) || 0,
    })
    if (!error) {
      setForm({ title: '', game: '', location: '', description: '', price_usd: '' })
      load()
    }
  }

  const buy = async (play) => {
    await supabase.from('purchases').insert({ play_id: play.id, price_paid: play.price_usd })
    await supabase.from('plays').update({ status: 'sold' }).eq('id', play.id)
    load()
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div>
      <h2>Post a play</h2>
      <div style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
        <input placeholder="Title" value={form.title} onChange={set('title')} />
        <input placeholder="Game" value={form.game} onChange={set('game')} />
        <input placeholder="Location / casino" value={form.location} onChange={set('location')} />
        <textarea placeholder="Description" value={form.description} onChange={set('description')} rows={3} />
        <input placeholder="Price (USD)" type="number" value={form.price_usd} onChange={set('price_usd')} />
        <button onClick={submit}>Post play</button>
      </div>

      <h2>Active plays</h2>
      {loading ? <p>Loading…</p> : plays.length === 0 ? <p>No active plays.</p> : plays.map((p) => (
        <div key={p.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 8 }}>
          <strong>{p.title}</strong> — ${Number(p.price_usd).toFixed(2)}
          <div style={{ fontSize: 14, color: '#555' }}>
            {[p.game, p.location].filter(Boolean).join(' · ')}
          </div>
          {p.description && <p style={{ fontSize: 14 }}>{p.description}</p>}
          <button onClick={() => buy(p)}>Buy</button>
        </div>
      ))}
    </div>
  )
}
