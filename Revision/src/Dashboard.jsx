import { useState, useEffect, useRef } from 'react'
import { getStyles } from './theme'
import { useTheme } from './ThemeContext'
import ThemeToggle from './ThemeToggle'
import { supabase } from './lib/supabaseClient'
import Logo from './Logo'
import { useNavigate } from 'react-router-dom'

const MOCK_HISTORY = []

const MOCK_SUMMARY = [
  "Un système d'exploitation gère les ressources matérielles de l'ordinateur.",
  "Un processus est un programme en cours d'exécution avec son propre espace mémoire.",
  "L'ordonnanceur décide quel processus s'exécute sur le CPU à un instant donné.",
  "La mémoire virtuelle simule plus de RAM que ce qui est physiquement disponible.",
]

const MOCK_QUESTIONS = [
  { question: "Que gère principalement un système d'exploitation ?", options: ["Les ressources matérielles", "Uniquement l'affichage", "La connexion internet", "Les mises à jour logicielles"], correctIndex: 0, explanation: "Le système d'exploitation fait l'intermédiaire entre le matériel et les logiciels applicatifs." },
  { question: "Qu'est-ce qu'un processus ?", options: ["Un fichier texte", "Un programme en cours d'exécution", "Un type de mémoire", "Un composant physique"], correctIndex: 1, explanation: "Un processus est une instance active d'un programme, avec son propre espace mémoire." },
  { question: "Quel est le rôle de l'ordonnanceur (scheduler) ?", options: ["Stocker les fichiers", "Décider quel processus s'exécute sur le CPU", "Gérer l'affichage", "Chiffrer les données"], correctIndex: 1, explanation: "L'ordonnanceur choisit, à chaque instant, quel processus a accès au processeur." },
]

const SIDEBAR_W = 260

function TimerRing({ pct, danger, seconds }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <svg width="60" height="60" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} fill="none" stroke={T.border} strokeWidth="5" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={danger ? '#E0483C' : T.accent} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
      <text x="32" y="37" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700" fill={danger ? '#E0483C' : T.text}>{seconds}</text>
    </svg>
  )
}

export default function Dashboard() {
  const { T, mode, toggleTheme } = useTheme()
  const { inputStyle, buttonStyle } = getStyles(T)
  const [stage, setStage] = useState('input')
  const [docText, setDocText] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [secondsPerQ, setSecondsPerQ] = useState(30)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [askText, setAskText] = useState('')
  const [askAnswer, setAskAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [nom, setNom] = useState('')
  const [domaine, setDomaine] = useState('')
  const [niveau, setNiveau] = useState('')
  const navigate = useNavigate()

    useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      const { data, error } = await supabase.from('profiles').select('nom, domaine_etudes, niveau').eq('id', user.id).single()
      if (error || !data) { navigate('/complete-profile'); return }
      setNom(data.nom)
      setDomaine(data.domaine_etudes)
      setNiveau(data.niveau)
    })()
  }, [])

  useEffect(() => {
    if (stage !== 'quiz') return
    setTimeLeft(secondsPerQ)
  }, [current, stage, secondsPerQ])

  useEffect(() => {
    if (stage !== 'quiz') return
    if (timeLeft <= 0) { handleAnswer(null); return }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, stage])

  function startNewCourse() {
    setStage('input'); setDocText(''); setCurrent(0); setAnswers([]); setAskAnswer('')
  }

  function simulateGenerate() {
    setStage('loading')
    setTimeout(() => {
      setAnswers(new Array(MOCK_QUESTIONS.length).fill(null))
      setCurrent(0)
      setStage('revision')
    }, 900)
  }

  function handleAnswer(idx) {
    clearTimeout(timerRef.current)
    setAnswers((prev) => { const copy = [...prev]; copy[current] = idx; return copy })
    if (current + 1 < MOCK_QUESTIONS.length) setCurrent((c) => c + 1)
    else setStage('result')
  }

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    async function confirmLogout() {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

  const score = answers.filter((a, i) => a === MOCK_QUESTIONS[i]?.correctIndex).length
  const letters = ['A', 'B', 'C', 'D']

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', fontFamily: 'Inter, sans-serif', color: T.text }}>
        <div style={{
        width: SIDEBAR_W, flexShrink: 0, background: T.card, borderRight: `1px solid ${T.border}`,
        padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
        position: 'fixed', top: 0, bottom: 0, left: 0,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease', zIndex: 40,
        }} className="sidebar-responsive">
        <button
          onClick={() => setSidebarOpen(false)}
          className="sidebar-close-btn"
          style={{ display: 'none', alignSelf: 'flex-end', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.sub, marginBottom: -8 }}
        >
          ✕
        </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div onClick={startNewCourse} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.accent, fontWeight: 700, cursor: 'pointer' }}>
            <Logo size={20} />
            Révision
          </div>
          <ThemeToggle />
        </div>
        <button onClick={startNewCourse} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 0', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
          + Nouveau cours
        </button>
        <div style={{ fontSize: 11.5, color: T.sub, fontWeight: 700, marginTop: 10, letterSpacing: 0.4 }}>HISTORIQUE</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {MOCK_HISTORY.length === 0 ? (
            <div style={{ fontSize: 12.5, color: T.sub, padding: '8px 4px' }}>Aucune session pour l'instant. Dépose ton premier cours !</div>
          ) : (
            MOCK_HISTORY.map((h) => (
              <button key={h.id} style={{ textAlign: 'left', background: T.cardSoft, border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ fontSize: 13, color: T.text, marginBottom: 2 }}>{h.titre}</div>
                <div style={{ fontSize: 11.5, color: T.sub }}>{h.score}/{h.total}</div>
              </button>
            ))
          )}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowLogoutConfirm(true)} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 0', fontWeight: 600, fontSize: 13, color: T.sub, cursor: 'pointer' }}>
          Se déconnecter
        </button>
      </div>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="sidebar-overlay"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 35, display: 'none' }}
        />
      )}

        <div style={{ flex: 1, padding: '32px 24px', display: 'flex', justifyContent: 'center', width: '100%' }} className="main-content">
        <button
          onClick={() => setSidebarOpen(true)}
          className="menu-toggle-btn"
          style={{ display: 'none', position: 'fixed', top: 16, left: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, width: 36, height: 36, fontSize: 16, cursor: 'pointer', zIndex: 30 }}
        >
          ☰
        </button>
        <div style={{ width: '100%', maxWidth: 520 }}>

          {stage === 'input' && (
            <div style={{ background: T.card, borderRadius: 20, padding: 24, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              {nom && (
                <div style={{ fontSize: 14, color: T.sub, marginBottom: 4 }}>
                  Bonjour {nom} 👋 {niveau && domaine ? `· ${niveau}, ${domaine}` : ''}
                </div>
              )}
              <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, margin: '0 0 16px', fontWeight: 600 }}>Dépose ton cours</h1>
              <div style={{ fontSize: 13, color: T.sub, marginBottom: 8, fontWeight: 600 }}>Contenu du cours</div>
              <textarea value={docText} onChange={(e) => setDocText(e.target.value)} placeholder="Colle ici le texte de ton cours..." rows={7} style={{ ...inputStyle, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600 }}>Questions</div>
                  <input type="number" min={3} max={10} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600 }}>Secondes / question</div>
                  <input type="number" min={10} max={90} step={5} value={secondsPerQ} onChange={(e) => setSecondsPerQ(Number(e.target.value))} style={inputStyle} />
                </div>
              </div>
              <button onClick={simulateGenerate} style={{ ...buttonStyle, width: '100%', marginTop: 20 }}>Générer mon quiz</button>
            </div>
          )}

          {stage === 'loading' && (
            <div style={{ background: T.card, borderRadius: 20, padding: 48, textAlign: 'center', border: `1px solid ${T.border}` }}>
              <div style={{ color: T.sub, fontSize: 14 }}>Lecture du cours et préparation des questions...</div>
            </div>
          )}

          {stage === 'revision' && (
            <div style={{ background: T.card, borderRadius: 20, padding: 24, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, marginBottom: 14 }}>À retenir avant le quiz</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MOCK_SUMMARY.map((point, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, background: T.accentSoft, borderRadius: 12, padding: '12px 14px' }}>
                    <span style={{ color: T.accent, fontWeight: 700, fontSize: 13 }}>{idx + 1}</span>
                    <span style={{ fontSize: 14, lineHeight: 1.5 }}>{point}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setStage('quiz')} style={{ ...buttonStyle, width: '100%', marginTop: 20 }}>Je suis prêt·e, lancer le quiz</button>
            </div>
          )}

          {stage === 'quiz' && MOCK_QUESTIONS[current] && (
            <div style={{ background: T.card, borderRadius: 20, padding: 24, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: T.sub }}>Question {current + 1} / {MOCK_QUESTIONS.length}</div>
                <TimerRing pct={timeLeft / secondsPerQ} danger={timeLeft <= 5} seconds={timeLeft} />
              </div>
              <div style={{ fontSize: 17, marginBottom: 18, lineHeight: 1.4 }}>{MOCK_QUESTIONS[current].question}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MOCK_QUESTIONS[current].options.map((opt, idx) => (
                  <button key={idx} onClick={() => handleAnswer(idx)} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', background: T.cardSoft, color: T.text, border: `1px solid ${T.border}`, borderRadius: 14, padding: '13px 14px', fontFamily: 'Inter, sans-serif', fontSize: 14.5, cursor: 'pointer' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: T.accent, flexShrink: 0 }}>{letters[idx]}</span>
                    {opt}
                  </button>
                ))}
                <button onClick={() => handleAnswer(null)} style={{ textAlign: 'center', background: 'transparent', color: T.sub, border: `1px dashed ${T.border}`, borderRadius: 14, padding: '11px 12px', fontFamily: 'Inter, sans-serif', fontSize: 13.5, cursor: 'pointer' }}>
                  🤷 Je ne sais pas
                </button>
              </div>
            </div>
          )}

          {stage === 'result' && (
            <div style={{ background: T.card, borderRadius: 20, padding: 24, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 8, fontWeight: 600 }}>Résultat</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 44, fontWeight: 600, color: score / MOCK_QUESTIONS.length >= 0.5 ? '#1E9E5A' : '#E0483C' }}>
                  {score} / {MOCK_QUESTIONS.length}
                </div>
              </div>
              {MOCK_QUESTIONS.some((q, i) => answers[i] !== q.correctIndex) && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>À revoir</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {MOCK_QUESTIONS.map((q, i) => answers[i] !== q.correctIndex ? (
                      <div key={i} style={{ background: T.cardSoft, borderRadius: 14, padding: '14px 16px', borderLeft: '3px solid #E0483C' }}>
                        <div style={{ fontSize: 14, marginBottom: 6 }}>{q.question}</div>
                        <div style={{ fontSize: 12.5, color: T.sub }}>bonne réponse : <strong style={{ color: T.text }}>{q.options[q.correctIndex]}</strong></div>
                        <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.5, color: T.sub }}>{q.explanation}</div>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Une question sur ce cours ?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" value={askText} onChange={(e) => setAskText(e.target.value)} placeholder="Ex : c'est quoi la différence entre..." style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => setAskAnswer("(réponse simulée pour l'instant — sera générée par l'IA une fois branchée)")} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '0 16px', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Envoyer</button>
                </div>
                {askAnswer && <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.5, background: T.accentSoft, borderRadius: 12, padding: '12px 14px' }}>{askAnswer}</div>}
              </div>
              <button onClick={startNewCourse} style={{ ...buttonStyle, width: '100%', marginTop: 22 }}>Réviser un autre cours</button>
            </div>
          )}

        </div>
      </div>
        {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: T.card, borderRadius: 16, padding: 24, maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Se déconnecter ?</div>
            <div style={{ fontSize: 13.5, color: T.sub, marginBottom: 20 }}>Tu devras te reconnecter pour accéder à ton tableau de bord.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, background: T.cardSoft, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 0', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', color: T.text }}>
                Annuler
              </button>
              <button onClick={confirmLogout} style={{ flex: 1, background: '#E0483C', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 0', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}