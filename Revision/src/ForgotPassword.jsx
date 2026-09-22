import { useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { getStyles } from './theme'
import { useTheme } from './ThemeContext'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'
import { useNavigate, Link } from 'react-router-dom'

export default function ForgotPassword() {
  const { T, mode, toggleTheme } = useTheme()
  const { inputStyle, buttonStyle } = getStyles(T)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); return }
    setSent(true)
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
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, margin: '6px 0 16px', fontWeight: 600, color: T.text }}>Mot de passe oublié</h1>
        {sent ? (
          <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.5 }}>
            Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.
          </p>
        ) : (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13.5, color: T.sub, margin: 0 }}>
              Indique ton email, on t'envoie un lien pour choisir un nouveau mot de passe.
            </p>
            <input style={inputStyle} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button type="submit" style={buttonStyle}>Envoyer le lien</button>
            {error && <p style={{ color: '#E0483C', fontSize: 13, margin: 0 }}>{error}</p>}
          </form>
        )}
        <p style={{ fontSize: 13, color: T.sub, marginTop: 16, textAlign: 'center' }}>
          <a href="/login" style={{ color: T.accent }}>Retour à la connexion</a>
        </p>
      </div>
    </div>
  )
}