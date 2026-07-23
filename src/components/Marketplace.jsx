import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { MACHINES, COMMON_FIELDS, AREAS } from '../machines'
import Field from './Field'

const sortedMachines = [...MACHINES].sort((a, b) => a.name.localeCompare(b.name))
const machineById = Object.fromEntries(MACHINES.map((m) => [m.id, m]))

function statsString(machineId, data) {
  const m = machineById[machineId]
  if (!m) return ''
  return [...COMMON_FIELDS, ...m.fields]
    .map((f) => {
      const v = data?.[f.key]
      if (v === undefined || v === null || v === '') return null
      return `${f.label}: ${v}`
    })
    .filter(Boolean)
    .join(' · ')
}

function timeLeft(expiresAt) {
  const ms = new Date(expiresAt) - new Date()
  if (ms <= 0) return 'expired'
  const mins = Math.floor(ms / 60000)
  const h = Math.floor(mins / 60)
  const mm = mins % 60
  return h > 0 ? `${h}h ${mm}m left` : `${mm}m left`
}

export default function Marketplace({ session }) {
  const [view, setView] = useState('list') // list | post | chat
  const [chatListing, setChatListing] = useState(null)
  const [listings, setListings] = useState([])
  const [area, setArea] = useState('')
  const [minSpin, setMinSpin] = useState('')
  const [maxSpin, setMaxSpin] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    let q = supabase
      .from('listings')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (area) q = q.eq('area', area)
    if (minSpin !== '') q = q.gte('spin', Number(minSpin))
    if (maxSpin !== '') q = q.lte('spin', Number(maxSpin))
    const { data } = await q
    setListings(data || [])
    setLoading(false)
  }
  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [area, minSpin, maxSpin])

  if (view === 'post')
    return <PostFlow session={session} onDone={() => { setView('list'); load() }} onCancel={() => setView('list')} />
  if (view === 'chat' && chatListing)
    return <Chat listing={chatListing} session={session} onBack={() => setView('list')} />

  return (
    <div>
      <div className="row-between">
        <h2 className="screen-title">Marketplace</h2>
        <button className="btn primary small" onClick={() => setView('post')}>+ Post play</button>
      </div>

      <div className="filters">
        <label className="field">
          <span className="field-label">Area</span>
          <select className="input" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">All areas</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <div className="filter-row">
          <label className="field">
            <span className="field-label">Min $/Spin</span>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              value={minSpin}
              onChange={(e) => setMinSpin(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Max $/Spin</span>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              value={maxSpin}
              onChange={(e) => setMaxSpin(e.target.value)}
            />
          </label>
        </div>
        {(area || minSpin !== '' || maxSpin !== '') && (
          <button
            className="linkbtn"
            onClick={() => { setArea(''); setMinSpin(''); setMaxSpin('') }}
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : listings.length === 0 ? (
        <div className="empty">No active plays{area ? ` in ${area}` : ''}. Post one or check back soon.</div>
      ) : (
        listings.map((l) => (
          <button key={l.id} className="listing" onClick={() => { setChatListing(l); setView('chat') }}>
            <div className="listing-head">
              <span className="listing-title">{l.machine_name}</span>
              <span className="time-left">{timeLeft(l.expires_at)}</span>
            </div>
            <div className="muted listing-stats">{statsString(l.machine_id, l.data)}</div>
            <div className="listing-meta">{[l.area, l.casino].filter(Boolean).join(' · ')}</div>
          </button>
        ))
      )}
    </div>
  )
}

function PostFlow({ session, onDone, onCancel }) {
  const [machine, setMachine] = useState(null)
  const [values, setValues] = useState({})
  const [area, setArea] = useState('')
  const [casino, setCasino] = useState('')
  const [busy, setBusy] = useState(false)

  if (!machine) {
    return (
      <div>
        <button className="linkbtn" onClick={onCancel}>‹ Marketplace</button>
        <h2 className="screen-title">Post a play — pick a machine</h2>
        <div className="machine-list">
          {sortedMachines.map((m) => (
            <button key={m.id} className="machine-item" onClick={() => { setMachine(m); setValues({}) }}>
              <span>{m.name}</span>
              <span className="chev">›</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))
  const allFields = [...COMMON_FIELDS, ...machine.fields]

  const post = async () => {
    if (!area) { alert('Pick an area'); return }
    setBusy(true)
    const { error } = await supabase.from('listings').insert({
      user_id: session.user.id,
      machine_id: machine.id,
      machine_name: machine.name,
      data: values,
      spin: Number(values.spin) || null,
      area,
      casino,
    })
    setBusy(false)
    if (error) { alert(error.message); return }
    onDone()
  }

  return (
    <div>
      <button className="linkbtn" onClick={() => setMachine(null)}>‹ Machines</button>
      <h2 className="screen-title">{machine.name}</h2>
      <div className="form">
        {allFields.map((f) => (
          <Field key={f.key} f={f} value={values[f.key]} onChange={set(f.key)} />
        ))}
        <label className="field">
          <span className="field-label">Area</span>
          <select className="input" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="" disabled>Select area…</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Casino</span>
          <input className="input" value={casino} onChange={(e) => setCasino(e.target.value)} />
        </label>
        <button className="btn primary block" onClick={post} disabled={busy}>
          {busy ? 'Posting…' : 'Post play'}
        </button>
        <p className="muted note">Posted plays expire after 2 hours.</p>
      </div>
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
        (payload) => setMessages((m) => (m.some((x) => x.id === payload.new.id) ? m : [...m, payload.new]))
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
    load()
  }

  return (
    <div className="chat">
      <button className="linkbtn" onClick={onBack}>‹ Marketplace</button>
      <div className="chat-head">
        <span className="listing-title">{listing.machine_name}</span>
        <span className="time-left">{timeLeft(listing.expires_at)}</span>
      </div>
      <p className="muted">{statsString(listing.machine_id, listing.data)}</p>
      <p className="muted listing-meta">{[listing.area, listing.casino].filter(Boolean).join(' · ')}</p>

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
