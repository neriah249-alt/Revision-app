import { useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { getStyles } from './theme'
import { useTheme } from './ThemeContext'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'
import { useNavigate, Link } from 'react-router-dom'


export default function SignUp() {
  const { T, mode, toggleTheme } = useTheme()
  const { inputStyle, buttonStyle } = getStyles(T)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [domaine, setDomaine] = useState('')
  const [niveau, setNiveau] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')
    const { data, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) { setError(authError.message); return }
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id, nom, domaine_etudes: domaine, niveau,
    })
    if (profileError) { setError(profileError.message); return }
    navigate('/login')
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
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, margin: '6px 0 20px', fontWeight: 600, color: T.text }}>Crée ton compte</h1>
        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={inputStyle} placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
          <input style={inputStyle} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input style={inputStyle} placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input style={inputStyle} placeholder="Domaine d'études" value={domaine} onChange={(e) => setDomaine(e.target.value)} required />
          <select style={inputStyle} value={niveau} onChange={(e) => setNiveau(e.target.value)} required>
            <option value="" disabled>Choisis ton niveau</option>
            <option value="Licence 1">Licence 1</option>
            <option value="Licence 2">Licence 2</option>
            <option value="Licence 3">Licence 3</option>
            <option value="Master 1">Master 1</option>
            <option value="Master 2">Master 2</option>
            <option value="Doctorat">Doctorat</option>
            <option value="Autre">Autre</option>
          </select>
          <button type="submit" style={buttonStyle}>S'inscrire</button>
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
          Déjà un compte ? <a href="/login" style={{ color: T.accent }}>Se connecter</a>
        </p>
      </div>
    </div>
  )
}