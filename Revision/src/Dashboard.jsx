import { useState, useEffect, useRef } from 'react'
import { getStyles } from './theme'
import { useTheme } from './ThemeContext'
import ThemeToggle from './ThemeToggle'
import { supabase } from './lib/supabaseClient'
import Logo from './Logo'
import { useNavigate } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const SIDEBAR_W = 260

function TimerRing({ pct, danger, seconds, T }) {
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
    loadHistory()
  }, [])

  async function loadHistory() {
    setLoadingHistory(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingHistory(false); return }
    const { data } = await supabase
      .from('quiz_sessions')
      .select('id, titre, score, total_questions')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setHistory(data || [])
    setLoadingHistory(false)
  }

  useEffect(() => {
    if (stage !== 'quiz') return
    setTimeLeft(secondsPerQ)
    const start = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000)
      const remaining = secondsPerQ - elapsed
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        setTimeLeft(0)
        handleAnswer(null)
      } else {
        setTimeLeft(remaining)
      }
    }, 250)
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, stage])
  
  function startNewCourse() {
    setStage('input'); setDocText(''); setCurrent(0); setAnswers([]); setAskAnswer(''); setSummary([]); setQuestions([]); setGenError(''); setAiTitre(''); setFileName('')
  }

  const [summary, setSummary] = useState([])
  const [questions, setQuestions] = useState([])
  const [genError, setGenError] = useState('')
  const [fileName, setFileName] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [aiTitre, setAiTitre] = useState('')

  async function generateQuiz() {
    setGenError('')
    if (!docText.trim() || docText.trim().length < 20) {
      setGenError('Colle un texte de cours un peu plus long avant de générer.')
      return
    }
    setStage('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ docText, numQuestions, domaine, niveau }),
        }
      )
      const data = await response.json()
      if (data.error) {
        setGenError(data.error)
        setStage('input')
        return
      }
      setSummary(data.summary || [])
      setQuestions(data.questions || [])
      setAiTitre(data.titre || '')
      setAnswers(new Array((data.questions || []).length).fill(null))
      setCurrent(0)
      setStage('revision')
    } catch (e) {
      setGenError('Une erreur est survenue. Réessaie.')
      setStage('input')
    }
  }

    async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setGenError('')
    setExtracting(true)
    try {
      let text = ''
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map((item) => item.str).join(' ') + '\n'
        }
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        text = result.value
      } else {
        setGenError('Formats acceptés : PDF ou Word (.docx) uniquement.')
        setExtracting(false)
        return
      }
      if (!text.trim()) {
        setGenError("Impossible d'extraire du texte de ce fichier — il contient peut-être des pages scannées (images).")
      } else {
        setDocText(text.trim())
      }
    } catch (err) {
      setGenError("Échec de la lecture du fichier. Réessaie ou colle le texte manuellement.")
    }
    setExtracting(false)
  }

    function handleAnswer(idx) {
    clearTimeout(timerRef.current)
    const updated = [...answers]
    updated[current] = idx
    setAnswers(updated)
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1)
    } else {
      setStage('result')
      saveSession(updated)
    }
  }

    async function saveSession(finalAnswers) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const finalScore = finalAnswers.filter((a, i) => a === questions[i]?.correctIndex).length
      const titre = aiTitre || (docText.trim().slice(0, 60) + (docText.trim().length > 60 ? '...' : ''))

      const { data: doc, error: docError } = await supabase.from('documents').insert({
        user_id: user.id, titre, contenu_texte: docText,
      }).select().single()
      if (docError) { console.error('Erreur enregistrement document:', docError); return }

      const { data: session, error: sessionError } = await supabase.from('quiz_sessions').insert({
        user_id: user.id, document_id: doc.id, titre,
        resume_revision: summary, score: finalScore, total_questions: questions.length,
        secondes_par_question: secondsPerQ,
      }).select().single()
      if (sessionError) { console.error('Erreur enregistrement session:', sessionError); return }

      const rows = questions.map((q, i) => ({
        session_id: session.id, ordre: i, question: q.question, options: q.options,
        correct_index: q.correctIndex, explication: q.explanation, reponse_etudiant: finalAnswers[i],
      }))
      const { error: questionsError } = await supabase.from('quiz_questions').insert(rows)
      if (questionsError) { console.error('Erreur enregistrement questions:', questionsError) }

      loadHistory()
    } catch (e) {
      console.error('Erreur sauvegarde session', e)
    }
  }

    async function openSession(id) {
    setStage('loading')
    setSidebarOpen(false)
    const { data: session } = await supabase.from('quiz_sessions').select('*, documents(contenu_texte)').eq('id', id).single()
    const { data: qs } = await supabase.from('quiz_questions').select('*').eq('session_id', id).order('ordre')
    setSummary(session?.resume_revision || [])
    setQuestions((qs || []).map((q) => ({
      question: q.question, options: q.options, correctIndex: q.correct_index, explanation: q.explication,
    })))
    setAnswers((qs || []).map((q) => q.reponse_etudiant))
    setSecondsPerQ(session?.secondes_par_question || 30)
    setDocText(session?.documents?.contenu_texte || '')
    setStage('result')
  }

  async function deleteSession(id, e) {
    e.stopPropagation()
    if (!window.confirm('Supprimer cette session ?')) return
    const { error } = await supabase.from('quiz_sessions').delete().eq('id', id)
    if (error) {
      console.error('Erreur suppression:', error)
      alert('La suppression a échoué : ' + error.message)
      return
    }
    setHistory((prev) => prev.filter((h) => h.id !== id))
  }

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    async function confirmLogout() {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

  const score = answers.filter((a, i) => a === questions[i]?.correctIndex).length
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
          {loadingHistory ? (
            <div style={{ fontSize: 12.5, color: T.sub, padding: '8px 4px' }}>Chargement...</div>
          ) : history.length === 0 ? (
            <div style={{ fontSize: 12.5, color: T.sub, padding: '8px 4px' }}>Aucune session pour l'instant. Dépose ton premier cours !</div>
          ) : (
            history.map((h) => (
              <div key={h.id} style={{ position: 'relative' }}>
                <button onClick={() => openSession(h.id)} style={{ width: '100%', textAlign: 'left', background: T.cardSoft, border: 'none', borderRadius: 10, padding: '10px 32px 10px 12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ fontSize: 13, color: T.text, marginBottom: 2 }}>{h.titre}</div>
                  <div style={{ fontSize: 11.5, color: T.sub }}>{h.score}/{h.total_questions}</div>
                </button>
                <button
                  onClick={(e) => deleteSession(h.id, e)}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: T.sub, fontSize: 13, cursor: 'pointer', padding: 4 }}
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Contenu du cours</div>
                <label style={{ fontSize: 12.5, color: T.accent, fontWeight: 700, cursor: 'pointer' }}>
                  {extracting ? 'Lecture en cours...' : '📎 Importer un PDF/Word'}
                  <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} style={{ display: 'none' }} disabled={extracting} />
                </label>
              </div>
              {fileName && !extracting && (
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>Fichier : {fileName}</div>
              )}
              <textarea value={docText} onChange={(e) => setDocText(e.target.value)} placeholder="Colle ici le texte de ton cours, ou importe un fichier ci-dessus..." rows={7} style={{ ...inputStyle, resize: 'vertical' }} />
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
              <button onClick={generateQuiz} style={{ ...buttonStyle, width: '100%', marginTop: 20 }}>Générer mon quiz</button>
              {genError && <p style={{ color: '#E0483C', fontSize: 13, marginTop: 10 }}>{genError}</p>}
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
                  {summary.map((point, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, background: T.accentSoft, borderRadius: 12, padding: '12px 14px' }}>
                    <span style={{ color: T.accent, fontWeight: 700, fontSize: 13 }}>{idx + 1}</span>
                    <span style={{ fontSize: 14, lineHeight: 1.5 }}>{point}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setStage('quiz')} style={{ ...buttonStyle, width: '100%', marginTop: 20 }}>Je suis prêt·e, lancer le quiz</button>
            </div>
          )}

            {stage === 'quiz' && questions[current] && (
            <div style={{ background: T.card, borderRadius: 20, padding: 24, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: T.sub }}>Question {current + 1} / {questions.length}</div>
                  <TimerRing pct={timeLeft / secondsPerQ} danger={timeLeft <= 5} seconds={timeLeft} T={T} />
              </div>
              <div style={{ fontSize: 17, marginBottom: 18, lineHeight: 1.4 }}>{questions[current].question}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {questions[current].options.map((opt, idx) => (
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
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 44, fontWeight: 600, color: score / questions.length >= 0.5 ? '#1E9E5A' : '#E0483C' }}>
                  {score} / {questions.length}
                </div>
              </div>
              {questions.some((q, i) => answers[i] !== q.correctIndex) && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>À revoir</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {questions.map((q, i) => answers[i] !== q.correctIndex ? (
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