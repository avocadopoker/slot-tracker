import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import Slots from './components/Slots'
import TableGames from './components/TableGames'
import Sportsbook from './components/Sportsbook'
import Poker from './components/Poker'
import Settings from './components/Settings'
import './styles.css'

const CATEGORIES = [
  { id: 'slots', label: 'Slots' },
  { id: 'tables', label: 'Table games' },
  { id: 'sportsbook', label: 'Sportsbook' },
  { id: 'poker', label: 'Poker' },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('slots')
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

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
        <span className="brand">AP<span className="brand-dim">PLANET</span></span>
        <div className="menu-wrap">
          <button className="menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">⋯</button>
          {menuOpen && (
            <>
              <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="menu">
                <button className="menu-item" onClick={() => { setSettingsOpen(true); setMenuOpen(false) }}>
                  Settings
                </button>
                <button className="menu-item" onClick={() => supabase.auth.signOut()}>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <nav className="tabbar cats">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`tab ${cat === c.id ? 'active' : ''}`}
            onClick={() => setCat(c.id)}
          >
            {c.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {cat === 'slots' && <Slots session={session} />}
        {cat === 'tables' && <TableGames session={session} />}
        {cat === 'sportsbook' && <Sportsbook session={session} />}
        {cat === 'poker' && <Poker session={session} />}
      </main>

      {settingsOpen && (
        <div className="overlay">
          <div className="overlay-bar">
            <button className="linkbtn" onClick={() => setSettingsOpen(false)}>‹ Back</button>
          </div>
          <div className="overlay-body">
            <Settings session={session} />
          </div>
        </div>
      )}
    </div>
  )
}
