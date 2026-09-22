import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { getStyles } from './theme'
import { useTheme } from './ThemeContext'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'

export default function Login() {
  const { T, mode, toggleTheme } = useTheme()
  const { inputStyle, buttonStyle } = getStyles(T)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); return }
    navigate('/dashboard')
  }

    async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 380, background: T.card, borderRadius: 20, padding: 28, boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.accent, fontWeight: 700, textDecoration: 'none' }}>
            <Logo size={20} />
            Révision
          </Link>
          <ThemeToggle />
        </div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, margin: '6px 0 20px', fontWeight: 600, color: T.text }}>Connexion</h1>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={inputStyle} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input style={inputStyle} placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" style={buttonStyle}>Se connecter</button>
          <a href="/forgot-password" style={{ color: T.sub, fontSize: 12.5, textAlign: 'center' }}>Mot de passe oublié ?</a>
          {error && <p style={{ color: '#E0483C', fontSize: 13, margin: 0 }}>{error}</p>}
        </form>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span style={{ fontSize: 12, color: T.sub }}>ou</span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>
        <button onClick={handleGoogleLogin} type="button" style={{ width: '100%', background: '#fff', color: '#1C1D1F', border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 0', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Continuer avec Google
        </button>
        <p style={{ fontSize: 13, color: T.sub, marginTop: 16, textAlign: 'center' }}>
          Pas encore de compte ? <a href="/signup" style={{ color: T.accent }}>S'inscrire</a>
        </p>
      </div>
    </div>
  )
}