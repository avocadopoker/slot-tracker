import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setMsg('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMsg(error.message)
      else setMsg('Account created. You can log in now.')
    }
    setBusy(false)
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand">AP<span className="brand-dim">PLANET</span></div>
        <p className="muted">{mode === 'login' ? 'Log in to continue' : 'Create your account'}</p>

        <input
          className="input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />

        <button className="btn primary block" onClick={submit} disabled={busy}>
          {busy ? '…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>

        {msg && <p className="msg">{msg}</p>}

        <button
          className="linkbtn center-text"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg('') }}
        >
          {mode === 'login' ? 'No account? Create one' : 'Have an account? Log in'}
        </button>
      </div>
    </div>
  )
}
