import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import Guide from './components/Guide'
import Tracking from './components/Tracking'
import Results from './components/Results'
import Marketplace from './components/Marketplace'
import Settings from './components/Settings'
import './styles.css'

const TABS = [
  { id: 'guide', label: 'Guide' },
  { id: 'sell', label: 'Sell' },
  { id: 'tracking', label: 'Track' },
  { id: 'results', label: 'Results' },
  { id: 'settings', label: 'Settings' },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('guide')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (loading) return <div className="center muted">Loading…</div>
  if (!session) return <Auth />

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">SLOT<span className="brand-dim">TRACKER</span></span>
        <button className="linkbtn" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </header>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === 'guide' && <Guide />}
        {tab === 'sell' && <Marketplace session={session} />}
        {tab === 'tracking' && <Tracking session={session} />}
        {tab === 'results' && <Results session={session} />}
        {tab === 'settings' && <Settings session={session} />}
      </main>
    </div>
  )
}
