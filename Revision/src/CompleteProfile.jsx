import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { getStyles } from './theme'
import { useTheme } from './ThemeContext'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'

export default function CompleteProfile() {
  const { T, mode, toggleTheme } = useTheme()
  const { inputStyle, buttonStyle } = getStyles(T)
  const [nom, setNom] = useState('')
  const [domaine, setDomaine] = useState('')
  const [niveau, setNiveau] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ''
      setNom(fullName)
    })()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').insert({
      id: user.id, nom, domaine_etudes: domaine, niveau,
    })
    if (error) { setError(error.message); return }
    navigate('/dashboard')
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
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, margin: '10px 0 6px', fontWeight: 600, color: T.text }}>Complète ton profil</h1>
        <p style={{ fontSize: 13.5, color: T.sub, margin: '0 0 16px' }}>Plus que deux infos avant de commencer.</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={inputStyle} placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
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
          <button type="submit" style={buttonStyle}>Continuer</button>
          {error && <p style={{ color: '#E0483C', fontSize: 13, margin: 0 }}>{error}</p>}
        </form>
      </div>
    </div>
  )
}