import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { apiRequest, saveSession } from '../lib/api.js'
import Navbar from '../components/Navbar.jsx'
import './Auth.css'

export default function AcceptInvite() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''

  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token in the URL.')
      return
    }
    apiRequest(`/api/auth/invitations/${encodeURIComponent(token)}`)
      .then((data) => setInvitation(data.invitation))
      .catch((err) => setError(err.message))
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await apiRequest(`/api/auth/invitations/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        body: { password },
      })
      setOkMsg('Account activated! Redirecting you to the login page…')
      setTimeout(() => navigate('/login'), 1600)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <Navbar />
      <main className="auth-main">
        <div className="card">
          <h1>Accept your invitation</h1>
          <p className="sub">Verify your email invitation and set a password to activate your account.</p>

          {error && <div className="alert error">{error}</div>}
          {okMsg && <div className="alert ok">{okMsg}</div>}

          {invitation && (
            <>
              <p style={{ marginBottom: 16, fontSize: '0.95rem' }}>
                Invited: <strong>{invitation.name}</strong><br />
                Email: <strong>{invitation.email}</strong><br />
                Role: <strong>{invitation.role}</strong>
              </p>
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="password">Choose a password (min. 8 characters)</label>
                  <input type="password" id="password" minLength="8" required placeholder="••••••••"
                    autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button type="submit" className="btn full" disabled={busy || !!okMsg}>Activate account</button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
