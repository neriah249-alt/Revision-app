import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from './ThemeContext'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'

const FAQS = [
  { q: "Comment ça marche exactement ?", a: "Tu déposes le texte de ton cours (ou tu importes un PDF/Word), l'IA te génère un résumé des points clés puis un quiz chronométré pour tester ce que tu as retenu. À la fin, tu vois exactement ce qu'il te reste à réviser." },
  { q: "Est-ce que c'est réservé aux étudiants d'une école en particulier ?", a: "Non, la plateforme est ouverte à tout étudiant, peu importe ton domaine d'études ou ton niveau." },
  { q: "Est-ce que c'est payant ?", a: "L'inscription et l'usage de base sont gratuits. On te préviendra clairement si des options supplémentaires payantes arrivent plus tard." },
  { q: "Mes documents de cours sont-ils partagés avec d'autres étudiants ?", a: "Non, tes documents et tes quiz restent privés, liés à ton compte uniquement." },
  { q: "Est-ce que je peux revoir mes anciens quiz ?", a: "Oui, un historique garde toutes tes sessions passées, consultable à tout moment depuis ton tableau de bord." },
]

function FaqItem({ q, a, T }) {
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
      {/* Barre de navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', maxWidth: 1040, margin: '0 auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: T.accent, fontWeight: 700, textDecoration: 'none' }}>
          <Logo size={26} />
          Révision
        </Link>
        <div style={{ display: 'flex', gap: 24, fontSize: 14, fontWeight: 600 }}>
          <a href="#accueil" style={{ color: T.accent, textDecoration: 'none' }}>Accueil</a>
          <a href="#comment-ca-marche" style={{ color: T.sub, textDecoration: 'none' }}>Comment ça marche</a>
          <a href="#faq" style={{ color: T.sub, textDecoration: 'none' }}>FAQ</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle />
          <Link to="/login" style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>
            Se connecter
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div id="accueil" style={{ maxWidth: 1040, margin: '40px auto 0', padding: '0 24px', display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 380px' }}>
          <div style={{ display: 'inline-block', background: T.accentSoft, color: T.accent, fontSize: 12.5, fontWeight: 700, padding: '5px 12px', borderRadius: 999, marginBottom: 16 }}>
            ✦ IA · Révision · Réussite
          </div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 40, fontWeight: 600, lineHeight: 1.2, margin: 0 }}>
            Ton cours devient un test, en 2 minutes.
          </h1>
          <p style={{ fontSize: 16, color: T.sub, marginTop: 16, lineHeight: 1.6 }}>
            Dépose ton cours, l'IA en extrait l'essentiel et crée un quiz chronométré sur mesure.
            Apprends plus vite, retiens mieux, réussis.
          </p>
          <Link to="/signup" style={{ display: 'inline-block', marginTop: 24, background: T.accent, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 28px', fontWeight: 700, fontSize: 15.5, textDecoration: 'none' }}>
            ⬆ Importer un PDF / Word
          </Link>
          <div style={{ fontSize: 12.5, color: T.sub, marginTop: 10 }}>C'est rapide, simple et gratuit pour commencer.</div>
        </div>

        <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 22, boxShadow: T.shadow, width: '100%', maxWidth: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: T.sub, marginBottom: 14 }}>
              📄 Mon_cours.pdf
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <div style={{ height: 8, background: T.cardSoft, borderRadius: 4, width: '90%' }} />
              <div style={{ height: 8, background: T.cardSoft, borderRadius: 4, width: '75%' }} />
              <div style={{ height: 8, background: T.cardSoft, borderRadius: 4, width: '82%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.accentSoft, borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: T.accent }}>
                📋 Résumé clair
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.accentSoft, borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: T.accent }}>
                🎯 Quiz personnalisé
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.accentSoft, borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: T.accent }}>
                💡 Explications simples
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment ça marche */}
      <div id="comment-ca-marche" style={{ maxWidth: 900, margin: '88px auto 0', padding: '0 24px' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 600, textAlign: 'center', marginBottom: 8 }}>Comment ça marche ?</h2>
        <p style={{ textAlign: 'center', color: T.sub, fontSize: 14, marginBottom: 32 }}>En 3 étapes, transforme ton cours en outil de révision efficace.</p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { n: '1', t: 'Dépose ton cours', d: "Importe ton document PDF ou Word en quelques clics." },
            { n: '2', t: "L'IA analyse et prépare", d: "Elle extrait les notions clés et génère ton quiz." },
            { n: '3', t: 'Révise et progresse', d: "Teste tes connaissances et revois l'essentiel." },
          ].map((step) => (
            <div key={step.n} style={{ flex: '1 1 220px', maxWidth: 240, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: T.accentSoft, color: T.accent, fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                {step.n}
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{step.t}</div>
              <div style={{ fontSize: 13.5, color: T.sub, lineHeight: 1.5 }}>{step.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pourquoi nous choisir */}
      <div style={{ maxWidth: 900, margin: '80px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'inline-block', background: T.accentSoft, color: T.accent, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, marginBottom: 10 }}>
          ✦ Pourquoi nous choisir ?
        </div>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, marginBottom: 28 }}>Une méthode simple, adaptée à toi.</h2>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { icon: '⚡', t: 'Gain de temps', d: "L'essentiel en un clin d'œil." },
            { icon: '🎯', t: 'Adapté à ton niveau', d: "Du débutant à l'avancé." },
            { icon: '💙', t: 'Accessible partout', d: 'Sur ton téléphone ou ton ordi.' },
          ].map((item) => (
            <div key={item.t} style={{ flex: '1 1 200px', display: 'flex', gap: 12 }}>
              <div style={{ fontSize: 22 }}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 2 }}>{item.t}</div>
                <div style={{ fontSize: 13, color: T.sub }}>{item.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" style={{ maxWidth: 640, margin: '88px auto 0', padding: '0 24px 88px' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, textAlign: 'center', marginBottom: 20 }}>Questions fréquentes</h2>
        <div style={{ background: T.card, borderRadius: 16, padding: '4px 20px', border: `1px solid ${T.border}` }}>
          {FAQS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} T={T} />)}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/signup" style={{ display: 'inline-block', background: T.accent, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            Se lancer
          </Link>
        </div>
      </div>
    </div>
  )
}