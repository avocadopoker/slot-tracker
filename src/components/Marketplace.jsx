import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { MACHINES } from '../machines'

export default function Marketplace({ session }) {
  const [listings, setListings] = useState([])
  const [open, setOpen] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (open) return <Chat listing={open} session={session} onBack={() => setOpen(null)} />

  return (
    <div>
      <div className="row-between">
        <h2 className="screen-title">Marketplace</h2>
        <button className="btn primary small" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Close' : '+ Post'}
        </button>
      </div>

      {showForm && (
        <PostForm session={session} onPosted={() => { setShowForm(false); load() }} />
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : listings.length === 0 ? (
        <div className="empty">No plays listed yet. Be the first to post one.</div>
      ) : (
        listings.map((l) => (
          <button key={l.id} className="listing" onClick={() => setOpen(l)}>
            <div className="listing-head">
              <span className="listing-title">{l.machine_name}</span>
              <span className="price">${Number(l.price_usd).toFixed(2)}</span>
            </div>
            {l.stats && <div className="muted listing-stats">{l.stats}</div>}
          </button>
        ))
      )}
    </div>
  )
}

function PostForm({ session, onPosted }) {
  const [machineName, setMachineName] = useState(MACHINES[0]?.name || '')
  const [stats, setStats] = useState('')
  const [price, setPrice] = useState('')
  const [busy, setBusy] = useState(false)

  const post = async () => {
    if (!machineName) return
    setBusy(true)
    const { error } = await supabase.from('listings').insert({
      user_id: session.user.id,
      machine_name: machineName,
      stats,
      price_usd: Number(price) || 0,
    })
    setBusy(false)
    if (error) { alert(error.message); return }
    onPosted()
  }

  return (
    <div className="form card">
      <label className="field">
        <span className="field-label">Machine</span>
        <select className="input" value={machineName} onChange={(e) => setMachineName(e.target.value)}>
          {MACHINES.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Stats</span>
        <textarea
          className="input"
          rows={3}
          value={stats}
          onChange={(e) => setStats(e.target.value)}
          placeholder="e.g. must-hit-by $1,200 — current meter $980"
        />
      </label>
      <label className="field">
        <span className="field-label">Asking price ($)</span>
        <input className="input" type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
      </label>
      <button className="btn primary block" onClick={post} disabled={busy}>
        {busy ? 'Posting…' : 'Post play'}
      </button>
    </div>
  )
}

function Chat({ listing, session, onBack }) {
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const endRef = useRef(null)

  const load = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('listing_id', listing.id)
      .order('created_at')
    setMessages(data || [])
  }

  useEffect(() => {
    load()
    const ch = supabase
      .channel(`listing-${listing.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `listing_id=eq.${listing.id}` },
        (payload) => {
          setMessages((m) => (m.some((x) => x.id === payload.new.id) ? m : [...m, payload.new]))
        }
      )
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [listing.id])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const text = body.trim()
    if (!text) return
    setBody('')
    const { error } = await supabase.from('messages').insert({
      listing_id: listing.id,
      user_id: session.user.id,
      sender_email: session.user.email,
      body: text,
    })
    if (error) { alert(error.message); return }
    load() // works even if realtime isn't enabled
  }

  return (
    <div className="chat">
      <button className="linkbtn" onClick={onBack}>‹ Marketplace</button>
      <div className="chat-head">
        <span className="listing-title">{listing.machine_name}</span>
        <span className="price">${Number(listing.price_usd).toFixed(2)}</span>
      </div>
      {listing.stats && <p className="muted">{listing.stats}</p>}

      <div className="messages">
        {messages.length === 0 && <div className="empty small">No messages yet. Start negotiating.</div>}
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.user_id === session.user.id ? 'mine' : ''}`}>
            <div className="sender">{m.user_id === session.user.id ? 'You' : (m.sender_email || 'User')}</div>
            <div className="bubble-body">{m.body}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="composer">
        <input
          className="input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message…"
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn primary" onClick={send}>Send</button>
      </div>
    </div>
  )
}
