import { useState } from 'react'
import api from '../lib/api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  // email removed per request
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)

  const doLogin = async () => {
    setLoading(true)
    setError(null)
    const res = await api.post('/auth/token/login/', { username, password })
    setLoading(false)
    if (res.ok && res.body && res.body.auth_token) {
      localStorage.setItem('authToken', res.body.auth_token)
      window.location.href = '/'
    } else {
      // Show backend-provided error when available
      const msg = res.body && typeof res.body === 'object' ? JSON.stringify(res.body) : 'Login failed'
      setError(msg)
    }
  }

  const doRegister = async () => {
    setError(null)
    if (!username || !password) {
      setError('Username and password are required')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
  // Djoser expects username and password
  const res = await api.post('/auth/users/', { username, password })
    setLoading(false)
    if (res.ok) {
      // registration created. Try to login and redirect
      const r2 = await api.post('/auth/token/login/', { username, password })
      if (r2.ok && r2.body && r2.body.auth_token) {
        localStorage.setItem('authToken', r2.body.auth_token)
        window.location.href = '/'
        return
      }
      setError('Registered but login failed')
    } else {
      // show helpful backend error
      const body = res.body
      let msg = 'Registration failed'
      if (body && typeof body === 'object') {
        // Djoser often returns a dict of field errors
        msg = Object.entries(body).map(([k,v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join('; ')
      } else if (typeof body === 'string') msg = body
      setError(msg)
    }
  }

  return (
    <div className="login-page-root">
      <div className="site-title-bar" style={{marginBottom:16}}>
        <h1 className="site-title">HiveMind</h1>
      </div>
      <div className="login-card">
        <h2>{isRegistering ? 'Create account' : 'Sign in'}</h2>

        <div className="login-field">
          <label><strong>Username</strong></label>
          <input placeholder="username" value={username} onChange={(e)=>setUsername(e.target.value)} />
        </div>

        <div className="login-field">
          <label><strong>Password</strong></label>
          <input type="password" placeholder="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>

        {isRegistering && (
          <div className="login-field">
            <label><strong>Confirm password</strong></label>
            <input type="password" placeholder="confirm password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
          </div>
        )}

        <div className="login-actions">
          <button onClick={isRegistering ? doRegister : doLogin} disabled={loading} className="btn primary">{loading ? '...' : (isRegistering ? 'Register' : 'Sign in')}</button>
          <button className="btn" onClick={()=>{ setIsRegistering(!isRegistering); setError(null); }}>
            {isRegistering ? 'Back to login' : "Don't have an account? Register"}
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  )
}
