import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function News() {
  const [view, setView] = useState('published') // published | queue
  const [published, setPublished] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [pub, pend] = await Promise.all([
      supabase.from('news_articles').select('*').order('published_at', { ascending: false }),
      supabase.from('news_drafts').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ])
    setPublished(pub.data || [])
    setPending(pend.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const approve = async (id) => {
    const { error } = await supabase.rpc('approve_news_draft', { draft_id: id })
    if (error) { alert(error.message); return }
    load()
  }
  const reject = async (id) => {
    const { error } = await supabase.rpc('reject_news_draft', { draft_id: id })
    if (error) { alert(error.message); return }
    load()
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 14 }}>
        <div className="subnav" style={{ marginBottom: 0 }}>
          <button className={`subtab ${view === 'published' ? 'active' : ''}`} onClick={() => setView('published')}>
            Feed
          </button>
          <button className={`subtab ${view === 'queue' ? 'active' : ''}`} onClick={() => setView('queue')}>
            Approve {pending.length > 0 ? `(${pending.length})` : ''}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : view === 'published' ? (
        published.length === 0 ? (
          <div className="empty">No news posted yet.</div>
        ) : (
          published.map((a) => <NewsCard key={a.id} item={a} />)
        )
      ) : pending.length === 0 ? (
        <div className="empty">Nothing waiting for review.</div>
      ) : (
        pending.map((d) => (
          <div key={d.id} className="play-card">
            <div className="play-name">{d.headline}</div>
            <p style={{ fontSize: 15, margin: '8px 0' }}>{d.summary}</p>
            <SourceLinks links={d.source_links} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn primary small" onClick={() => approve(d.id)}>Approve</button>
              <button className="btn ghost small" onClick={() => reject(d.id)}>Reject</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function NewsCard({ item }) {
  return (
    <div className="play-card">
      <div className="play-name">{item.headline}</div>
      <p style={{ fontSize: 15, margin: '8px 0' }}>{item.summary}</p>
      <SourceLinks links={item.source_links} />
    </div>
  )
}

function SourceLinks({ links }) {
  if (!links || links.length === 0) return null
  return (
    <div className="muted" style={{ fontSize: 13 }}>
      Sources:{' '}
      {links.map((l, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          <a href={l.url} target="_blank" rel="noreferrer" style={{ color: 'var(--red)' }}>
            {l.name}
          </a>
        </span>
      ))}
    </div>
  )
}
