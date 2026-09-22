import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { getStyles } from './theme'
import { useTheme } from './ThemeContext'
import ThemeToggle from './ThemeToggle'

export default function ResetPassword() {
  const { inputStyle, buttonStyle } = getStyles(useTheme())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  async function handleUpdate(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => navigate('/login'), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 380, background: T.card, borderRadius: 20, padding: 28, boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, color: T.accent, fontWeight: 700 }}>✦ Révision</div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, margin: '6px 0 16px', fontWeight: 600, color: T.text }}>
          Nouveau mot de passe
        </h1>
        {done ? (
          <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.5 }}>
            Mot de passe mis à jour ! Redirection vers la connexion...
          </p>
        ) : (
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input style={inputStyle} placeholder="Nouveau mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" style={buttonStyle}>Mettre à jour</button>
            {error && <p style={{ color: '#E0483C', fontSize: 13, margin: 0 }}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}