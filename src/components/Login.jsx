import { useState } from 'react'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    const response = await fetch('/api/auth-login', { method: 'POST', body: formData })
    const result = await response.json()
    if (!response.ok) setError(result.error || 'Login failed.')
    else onLogin(result.user)
    setLoading(false)
  }

  return <main className="login-page"><section className="login-panel"><div className="brand login-brand"><span className="brand-mark">+</span><span>NOSH</span></div><p className="eyebrow">Admin workspace</p><h1>Welcome back</h1><p className="muted">Sign in to manage your clinic portal.</p><form className="login-form" onSubmit={submit}><label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error && <p className="error-message" role="alert">{error}</p>}<button className="primary-button" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button></form></section></main>
}

export default Login
