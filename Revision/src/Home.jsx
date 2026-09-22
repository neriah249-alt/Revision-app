import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from './ThemeContext'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'

const FAQS = [
  { q: "Comment ça marche exactement ?", a: "Tu déposes le texte de ton cours, l'IA te génère un résumé des points clés puis un quiz chronométré pour tester ce que tu as retenu. À la fin, tu vois exactement ce qu'il te reste à réviser." },
  { q: "Est-ce que c'est réservé aux étudiants d'une école en particulier ?", a: "Non, la plateforme est ouverte à tout étudiant, peu importe ton domaine d'études ou ton niveau." },
  { q: "Est-ce que c'est payant ?", a: "L'inscription et l'usage de base sont gratuits. On te préviendra clairement si des options supplémentaires payantes arrivent plus tard." },
  { q: "Mes documents de cours sont-ils partagés avec d'autres étudiants ?", a: "Non, tes documents et tes quiz restent privés, liés à ton compte uniquement." },
  { q: "Est-ce que je peux revoir mes anciens quiz ?", a: "Oui, un historique garde toutes tes sessions passées, consultable à tout moment depuis ton tableau de bord." },
]

function FaqItem({ q, a }) {
  const { T } = useTheme()  
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, padding: '16px 0' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
        <span style={{ fontSize: 15.5, fontWeight: 600, color: T.text, fontFamily: 'Inter, sans-serif' }}>{q}</span>
        <span style={{ color: T.accent, fontSize: 18, flexShrink: 0, marginLeft: 12 }}>{open ? '−' : '+'}</span>
      </button>
      {open && <p style={{ fontSize: 14, color: T.sub, marginTop: 10, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{a}</p>}
    </div>
  )
}

export default function Home({ onGetStarted }) {
  const { T } = useTheme()
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', maxWidth: 960, margin: '0 auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.accent, fontWeight: 700, textDecoration: 'none' }}>
          <Logo size={20} />
          Révision
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle />
          <button onClick={onGetStarted} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
            Se connecter
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '48px auto 0', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ display: 'inline-block', background: T.accentSoft, color: T.accent, fontSize: 12.5, fontWeight: 700, padding: '5px 12px', borderRadius: 999, marginBottom: 16 }}>
          Pour réviser avant un examen, pas pour lire pendant des heures
        </div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 38, fontWeight: 600, lineHeight: 1.25, margin: 0 }}>
          Ton cours devient un test, en 2 minutes
        </h1>
        <p style={{ fontSize: 16, color: T.sub, marginTop: 16, lineHeight: 1.6 }}>
          Tu relis tes notes trois fois et tu n'es toujours pas sûr·e de savoir ce que tu maîtrises vraiment ?
          Dépose ton document de cours : on t'en sort l'essentiel à retenir, puis un quiz chronométré
          qui te dit exactement où tu en es — avant que ce soit l'examen qui te le dise.
        </p>
        <button onClick={onGetStarted} style={{ marginTop: 28, background: T.accent, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 32px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
          Commencer maintenant
        </button>
        <div style={{ fontSize: 12.5, color: T.sub, marginTop: 10 }}>Gratuit pour commencer — aucune carte bancaire requise</div>
      </div>

      <div style={{ maxWidth: 720, margin: '72px auto 0', padding: '0 20px' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, textAlign: 'center', marginBottom: 28 }}>Comment ça marche</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { n: '1', t: 'Dépose ton cours', d: "Colle le texte de ton support — peu importe la matière ou ton niveau d'étude." },
            { n: '2', t: "Retiens l'essentiel", d: "Un résumé clair des notions clés, à relire juste avant de te tester." },
            { n: '3', t: 'Teste-toi pour de vrai', d: "Un quiz chronométré généré sur ton propre cours — pas des questions génériques." },
          ].map((step) => (
            <div key={step.n} style={{ flex: '1 1 200px', background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div style={{ color: T.accent, fontWeight: 700, fontSize: 13 }}>Étape {step.n}</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 600, margin: '6px 0' }}>{step.t}</div>
              <div style={{ fontSize: 13.5, color: T.sub, lineHeight: 1.5 }}>{step.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '64px auto 0', padding: '0 20px' }}>
        <div style={{ background: T.accentSoft, borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Tu te trompes sur une question ?</div>
          <div style={{ fontSize: 13.5, color: T.sub, lineHeight: 1.6 }}>
            On ne se contente pas de te donner un score. Chaque erreur est expliquée simplement,
            et tu peux demander "explique-moi autrement" si ce n'est pas encore clair.
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '72px auto 0', padding: '0 20px 72px' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, textAlign: 'center', marginBottom: 20 }}>Questions fréquentes</h2>
        <div style={{ background: T.card, borderRadius: 16, padding: '4px 20px', border: `1px solid ${T.border}` }}>
          {FAQS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button onClick={onGetStarted} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Se lancer
          </button>
        </div>
      </div>
    </div>
  )
}