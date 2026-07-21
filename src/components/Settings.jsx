import { supabase } from '../supabaseClient'

export default function Settings({ session }) {
  return (
    <div>
      <h2 className="screen-title">Settings</h2>
      <div className="card">
        <div className="setting-row">
          <span className="field-label">Account</span>
          <span className="muted">{session.user.email}</span>
        </div>
      </div>
      <div className="empty small">More settings coming soon.</div>
      <button className="btn ghost block" onClick={() => supabase.auth.signOut()}>
        Sign out
      </button>
    </div>
  )
}
