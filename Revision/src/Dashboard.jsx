import { useState, useEffect, useRef } from 'react'
import { getStyles } from './theme'
import { useTheme } from './ThemeContext'
import ThemeToggle from './ThemeToggle'
import { supabase } from './lib/supabaseClient'
import Logo from './Logo'
import { useNavigate } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import pdfjsWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

const SIDEBAR_W = 240

const NAV_ITEMS = [
  { key: 'accueil', label: 'Accueil', icon: '🏠', premium: false },
  { key: 'mes-cours', label: 'Mes cours', icon: '📚', premium: false },
  { key: 'quiz', label: 'Créer un quiz', icon: '📝', premium: false },
  { key: 'fiches', label: 'Fiches de révision', icon: '📄', premium: false },
  { key: 'comprendre', label: 'Comprendre', icon: '🧠', premium: false },
  { key: 'tuteur', label: 'Mon tuteur IA', icon: '🤖', premium: false },
  { key: 'progression', label: 'Ma progression', icon: '📈', premium: false },
  { key: 'historique', label: 'Historique', icon: '🕘', premium: false },
]

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

function ProgressRing({ pct, T, size = 120 }) {
  const r = 46
  const c = 2 * Math.PI * r
  const color = pct >= 70 ? '#1E9E5A' : pct >= 40 ? '#E8A33D' : '#E0483C'
  return (
    <svg width={size} height={size} viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke={T.border} strokeWidth="9" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 55 55)" />
      <text x="55" y="61" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="24" fontWeight="600" fill={T.text}>{pct}%</text>
    </svg>
  )
}

function formatAIText(text) {
  if (!text) return null
  const segments = text.split(/```/g)
  return segments.map((seg, i) => {
    if (i % 2 === 1) {
      const cleaned = seg.replace(/^[a-zA-Z]*\n/, '')
      return (
        <pre key={i} style={{ background: 'rgba(0,0,0,0.3)', color: 'inherit', padding: '10px 12px', borderRadius: 10, overflowX: 'auto', fontSize: 12.5, margin: '8px 0', whiteSpace: 'pre-wrap' }}>
          <code>{cleaned}</code>
        </pre>
      )
    }
    const parts = seg.split(/(\*\*[^*]+\*\*)/g)
    return (
      <span key={i} style={{ whiteSpace: 'pre-wrap' }}>
        {parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j}>{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>
        )}
      </span>
    )
  })
}

export default function Dashboard() {
  const { T } = useTheme()
  const { inputStyle, buttonStyle } = getStyles(T)
  const navigate = useNavigate()

  const [view, setView] = useState('accueil')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [premiumMsg, setPremiumMsg] = useState(false)

  const [nom, setNom] = useState('')
  const [domaine, setDomaine] = useState('')
  const [niveau, setNiveau] = useState('')

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
  const [summary, setSummary] = useState([])
  const [questions, setQuestions] = useState([])
  const [genError, setGenError] = useState('')
  const [fileName, setFileName] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [docImages, setDocImages] = useState([])
  const [aiTitre, setAiTitre] = useState('')
  const [ficheStage, setFicheStage] = useState('input')
  const [ficheDocText, setFicheDocText] = useState('')
  const [ficheFileName, setFicheFileName] = useState('')
  const [ficheExtracting, setFicheExtracting] = useState(false)
  const [ficheDocImages, setFicheDocImages] = useState([])
  const [ficheData, setFicheData] = useState(null)
  const [ficheError, setFicheError] = useState('')
  const [ficheHistory, setFicheHistory] = useState([])
  const [loadingFicheHistory, setLoadingFicheHistory] = useState(true)

  const [comprendreStage, setComprendreStage] = useState('input')
  const [comprendreDocText, setComprendreDocText] = useState('')
  const [comprendreFileName, setComprendreFileName] = useState('')
  const [comprendreExtracting, setComprendreExtracting] = useState(false)
  const [comprendreDocImages, setComprendreDocImages] = useState([])
  const [comprendreQuestion, setComprendreQuestion] = useState('')
  const [comprendreData, setComprendreData] = useState(null)
  const [comprendreError, setComprendreError] = useState('')
  const [comprendreHistory, setComprendreHistory] = useState([])
  const [loadingComprendreHistory, setLoadingComprendreHistory] = useState(true)

  const [tuteurStage, setTuteurStage] = useState('input')
  const [tuteurDocText, setTuteurDocText] = useState('')
  const [tuteurFileName, setTuteurFileName] = useState('')
  const [tuteurExtracting, setTuteurExtracting] = useState(false)
  const [tuteurDocImages, setTuteurDocImages] = useState([])
  const [tuteurMessages, setTuteurMessages] = useState([])
  const [tuteurInput, setTuteurInput] = useState('')
  const [tuteurSending, setTuteurSending] = useState(false)
  const [tuteurError, setTuteurError] = useState('')
  const [tuteurConversationId, setTuteurConversationId] = useState(null)
  const [tuteurHistory, setTuteurHistory] = useState([])
  const [loadingTuteurHistory, setLoadingTuteurHistory] = useState(true)

  const [progData, setProgData] = useState(null)
  const [loadingProg, setLoadingProg] = useState(false)

  const [mesCours, setMesCours] = useState([])
  const [loadingMesCours, setLoadingMesCours] = useState(true)

  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

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

  useEffect(() => { loadHistory(); loadFicheHistory(); loadComprendreHistory(); loadTuteurHistory(); loadMesCours() }, [])

  async function loadMesCours() {
    setLoadingMesCours(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingMesCours(false); return }
    const { data } = await supabase
      .from('documents')
      .select('id, titre, contenu_texte, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMesCours(data || [])
    setLoadingMesCours(false)
  }

  function goToMesCoursView() {
    setView('mes-cours')
    setSidebarOpen(false)
  }

  async function deleteDocument(id, e) {
    e.stopPropagation()
    if (!window.confirm('Supprimer ce cours ? Les quiz déjà générés dessus resteront dans ton historique.')) return
    const { error } = await supabase.from('documents').delete().eq('id', id)
    if (error) { alert('La suppression a échoué : ' + error.message); return }
    setMesCours((prev) => prev.filter((d) => d.id !== id))
  }

  function useCourseFor(doc, destination) {
    if (destination === 'quiz') { setView('quiz'); startNewCourse(); setDocText(doc.contenu_texte); setFileName(doc.titre) }
    else if (destination === 'fiches') { setView('fiches'); setFicheStage('input'); setFicheDocText(doc.contenu_texte); setFicheFileName(doc.titre); setFicheData(null); setFicheError('') }
    else if (destination === 'comprendre') { setView('comprendre'); setComprendreStage('input'); setComprendreDocText(doc.contenu_texte); setComprendreFileName(doc.titre); setComprendreData(null); setComprendreError('') }
    else if (destination === 'tuteur') { setView('tuteur'); setTuteurStage('input'); setTuteurDocText(doc.contenu_texte); setTuteurFileName(doc.titre); setTuteurMessages([]); setTuteurConversationId(null) }
  }

  async function loadTuteurHistory() {
    setLoadingTuteurHistory(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingTuteurHistory(false); return }
    const { data } = await supabase
      .from('tuteur_conversations')
      .select('id, titre, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setTuteurHistory(data || [])
    setLoadingTuteurHistory(false)
  }

  async function loadComprendreHistory() {
    setLoadingComprendreHistory(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingComprendreHistory(false); return }
    const { data } = await supabase
      .from('comprendre_entries')
      .select('id, titre, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setComprendreHistory(data || [])
    setLoadingComprendreHistory(false)
  }

  async function loadFicheHistory() {
    setLoadingFicheHistory(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingFicheHistory(false); return }
    const { data } = await supabase
      .from('fiches')
      .select('id, titre, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setFicheHistory(data || [])
    setLoadingFicheHistory(false)
  }

  async function loadHistory() {
    setLoadingHistory(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingHistory(false); return }
    const { data } = await supabase
      .from('quiz_sessions')
      .select('id, titre, score, total_questions, created_at')
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
    setStage('input')
    setDocText(''); setCurrent(0); setAnswers([]); setAskAnswer('')
    setSummary([]); setQuestions([]); setGenError(''); setAiTitre(''); setFileName(''); setDocImages([])
  }

  function goToQuizView() {
    setView('quiz')
    startNewCourse()
    setSidebarOpen(false)
  }

  function goToFichesView() {
    setView('fiches')
    setFicheStage('input')
    setFicheDocText(''); setFicheFileName(''); setFicheData(null); setFicheError(''); setFicheDocImages([])
    setSidebarOpen(false)
  }

  function goToComprendreView() {
    setView('comprendre')
    setComprendreStage('input')
    setComprendreDocText(''); setComprendreFileName(''); setComprendreQuestion(''); setComprendreData(null); setComprendreError(''); setComprendreDocImages([])
    setSidebarOpen(false)
  }

  async function handleComprendreFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setComprendreFileName(file.name)
    setComprendreError('')
    setComprendreExtracting(true)
    try {
      const result = await extractFromFile(file)
      if (result.mode === 'text') {
        setComprendreDocText(result.text)
        setComprendreDocImages([])
      } else {
        setComprendreDocImages(result.images)
        setComprendreDocText('')
      }
    } catch (err) {
      setComprendreError(err.message === 'FORMAT_NON_SUPPORTE' ? 'Formats acceptés : PDF ou Word (.docx) uniquement.' : "Échec de la lecture du fichier. Réessaie ou colle le texte manuellement.")
    }
    setComprendreExtracting(false)
  }

  async function askComprendre() {
    setComprendreError('')
    if ((!comprendreDocText.trim() || comprendreDocText.trim().length < 20) && comprendreDocImages.length === 0) {
      setComprendreError('Colle un texte de cours un peu plus long, ou importe un fichier, avant de poser ta question.')
      return
    }
    if (!comprendreQuestion.trim() || comprendreQuestion.trim().length < 3) {
      setComprendreError('Écris une vraie question avant d\'envoyer.')
      return
    }
    setComprendreStage('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explain-question`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ docText: comprendreDocText, images: comprendreDocImages, question: comprendreQuestion, domaine, niveau }),
        }
      )
      const data = await response.json()
      if (data.error) { setComprendreError(data.error); setComprendreStage('input'); return }
      setComprendreData(data)
      setComprendreStage('result')
      saveComprendre(data)
    } catch (e) {
      setComprendreError('Une erreur est survenue. Réessaie.')
      setComprendreStage('input')
    }
  }

  async function saveComprendre(data) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await getOrCreateDocument(comprendreDocText, data.titre || comprendreQuestion.slice(0, 60))
      const { error } = await supabase.from('comprendre_entries').insert({
        user_id: user.id,
        titre: data.titre || comprendreQuestion.slice(0, 60),
        contenu_texte: comprendreDocText,
        question: comprendreQuestion,
        reponse: data.reponse,
      })
      if (error) console.error('Erreur enregistrement comprendre:', error)
      loadComprendreHistory()
    } catch (e) {
      console.error('Erreur sauvegarde comprendre', e)
    }
  }

  async function openComprendre(id) {
    setView('comprendre')
    setComprendreStage('loading')
    setSidebarOpen(false)
    const { data: entry } = await supabase.from('comprendre_entries').select('*').eq('id', id).single()
    if (!entry) { setComprendreStage('input'); return }
    setComprendreData({ titre: entry.titre, reponse: entry.reponse })
    setComprendreDocText(entry.contenu_texte)
    setComprendreQuestion(entry.question)
    setComprendreStage('result')
  }

  async function deleteComprendre(id, e) {
    e.stopPropagation()
    if (!window.confirm('Supprimer cette entrée ?')) return
    const { error } = await supabase.from('comprendre_entries').delete().eq('id', id)
    if (error) { alert('La suppression a échoué : ' + error.message); return }
    setComprendreHistory((prev) => prev.filter((c) => c.id !== id))
  }

  function goToTuteurView() {
    setView('tuteur')
    setTuteurStage('input')
    setTuteurDocText(''); setTuteurFileName(''); setTuteurMessages([]); setTuteurInput('')
    setTuteurError(''); setTuteurConversationId(null); setTuteurDocImages([])
    setSidebarOpen(false)
  }

  async function handleTuteurFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setTuteurFileName(file.name)
    setTuteurError('')
    setTuteurExtracting(true)
    try {
      const result = await extractFromFile(file)
      if (result.mode === 'text') {
        setTuteurDocText(result.text)
        setTuteurDocImages([])
      } else {
        setTuteurDocImages(result.images)
        setTuteurDocText('')
      }
    } catch (err) {
      setTuteurError(err.message === 'FORMAT_NON_SUPPORTE' ? 'Formats acceptés : PDF ou Word (.docx) uniquement.' : "Échec de la lecture du fichier. Réessaie ou colle le texte manuellement.")
    }
    setTuteurExtracting(false)
  }

  async function startTuteurConversation() {
    setTuteurError('')
    if ((!tuteurDocText.trim() || tuteurDocText.trim().length < 20) && tuteurDocImages.length === 0) {
      setTuteurError('Colle un texte de cours un peu plus long, ou importe un fichier, avant de commencer.')
      return
    }
    setTuteurStage('chat')
  }

  async function sendTuteurMessage() {
    if (!tuteurInput.trim() || tuteurSending) return
    const messageText = tuteurInput.trim()
    setTuteurInput('')
    setTuteurError('')

    const newHistory = [...tuteurMessages, { role: 'user', contenu: messageText }]
    setTuteurMessages(newHistory)
    setTuteurSending(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const isFirstMessage = tuteurMessages.length === 0
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tuteur-chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            docText: tuteurDocText, images: tuteurDocImages, message: messageText, history: tuteurMessages,
            domaine, niveau, wantTitle: isFirstMessage,
          }),
        }
      )
      const data = await response.json()
      if (data.error) {
        setTuteurError(data.error)
        setTuteurSending(false)
        return
      }
      const updatedHistory = [...newHistory, { role: 'assistant', contenu: data.reponse }]
      setTuteurMessages(updatedHistory)

      let convId = tuteurConversationId
      const { data: { user } } = await supabase.auth.getUser()

      if (!convId) {
        await getOrCreateDocument(tuteurDocText, data.titre || messageText.slice(0, 60))
        const { data: conv, error: convError } = await supabase.from('tuteur_conversations').insert({
          user_id: user.id,
          titre: data.titre || messageText.slice(0, 60),
          contenu_texte: tuteurDocText,
        }).select().single()
        if (convError) { console.error('Erreur création conversation:', convError) }
        else { convId = conv.id; setTuteurConversationId(conv.id) }
        loadTuteurHistory()
      }

      if (convId) {
        await supabase.from('tuteur_messages').insert([
          { conversation_id: convId, role: 'user', contenu: messageText },
          { conversation_id: convId, role: 'assistant', contenu: data.reponse },
        ])
      }
    } catch (e) {
      setTuteurError('Une erreur est survenue. Réessaie.')
    }
    setTuteurSending(false)
  }

  async function openTuteurConversation(id) {
    setView('tuteur')
    setTuteurStage('chat')
    setSidebarOpen(false)
    const { data: conv } = await supabase.from('tuteur_conversations').select('*').eq('id', id).single()
    const { data: msgs } = await supabase.from('tuteur_messages').select('*').eq('conversation_id', id).order('created_at')
    if (!conv) return
    setTuteurDocText(conv.contenu_texte)
    setTuteurConversationId(conv.id)
    setTuteurMessages((msgs || []).map((m) => ({ role: m.role, contenu: m.contenu })))
  }

  async function deleteTuteurConversation(id, e) {
    e.stopPropagation()
    if (!window.confirm('Supprimer cette conversation ?')) return
    const { error } = await supabase.from('tuteur_conversations').delete().eq('id', id)
    if (error) { alert('La suppression a échoué : ' + error.message); return }
    setTuteurHistory((prev) => prev.filter((t) => t.id !== id))
  }

    function goToProgressionView() {
    setView('progression')
    setSidebarOpen(false)
    loadProgression()
  }

  async function loadProgression() {
    setLoadingProg(true)
    const { data } = await supabase
      .from('quiz_questions')
      .select('question, options, correct_index, explication, reponse_etudiant, quiz_sessions(titre, created_at)')
      .limit(1000)
    const rows = data || []
    let correct = 0, wrong = 0, unknown = 0
    const missed = []
    rows.forEach((r) => {
      if (r.reponse_etudiant === null || r.reponse_etudiant === undefined) { unknown++; missed.push({ ...r, kind: 'unknown' }) }
      else if (r.reponse_etudiant === r.correct_index) { correct++ }
      else { wrong++; missed.push({ ...r, kind: 'wrong' }) }
    })
    missed.sort((a, b) => new Date(b.quiz_sessions?.created_at || 0) - new Date(a.quiz_sessions?.created_at || 0))
    setProgData({ total: rows.length, correct, wrong, unknown, missed: missed.slice(0, 6) })
    setLoadingProg(false)
  }

    async function generateFiche() {
    setFicheError('')
    if ((!ficheDocText.trim() || ficheDocText.trim().length < 20) && ficheDocImages.length === 0) {
      setFicheError('Colle un texte de cours un peu plus long, ou importe un fichier, avant de générer.')
      return
    }
    setFicheStage('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-fiche`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ docText: ficheDocText, images: ficheDocImages, domaine, niveau }),
        }
      )
      const data = await response.json()
      if (data.error) { setFicheError(data.error); setFicheStage('input'); return }
      setFicheData(data)
      setFicheStage('result')
      saveFiche(data)
    } catch (e) {
      setFicheError('Une erreur est survenue. Réessaie.')
      setFicheStage('input')
    }
  }

  async function saveFiche(data) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await getOrCreateDocument(ficheDocText, data.titre || 'Fiche sans titre')
      const { error } = await supabase.from('fiches').insert({
        user_id: user.id,
        titre: data.titre || 'Fiche sans titre',
        contenu_texte: ficheDocText,
        sections: data.sections || [],
      })
      if (error) console.error('Erreur enregistrement fiche:', error)
      loadFicheHistory()
    } catch (e) {
      console.error('Erreur sauvegarde fiche', e)
    }
  }

  async function openFiche(id) {
    setView('fiches')
    setFicheStage('loading')
    setSidebarOpen(false)
    const { data: fiche } = await supabase.from('fiches').select('*').eq('id', id).single()
    if (!fiche) { setFicheStage('input'); return }
    setFicheData({ titre: fiche.titre, sections: fiche.sections })
    setFicheDocText(fiche.contenu_texte)
    setFicheStage('result')
  }

  async function deleteFiche(id, e) {
    e.stopPropagation()
    if (!window.confirm('Supprimer cette fiche ?')) return
    const { error } = await supabase.from('fiches').delete().eq('id', id)
    if (error) { alert('La suppression a échoué : ' + error.message); return }
    setFicheHistory((prev) => prev.filter((f) => f.id !== id))
  }

  function goHome() {
    setView('accueil')
    setSidebarOpen(false)
  }

  function showPremiumTeaser() {
    setPremiumMsg(true)
    setTimeout(() => setPremiumMsg(false), 2500)
  }

    function handleNavClick(item) {
    if (item.premium) { showPremiumTeaser(); return }
    if (item.key === 'accueil') goHome()
    else if (item.key === 'quiz') goToQuizView()
    else if (item.key === 'fiches') goToFichesView()
    else if (item.key === 'comprendre') goToComprendreView()
    else if (item.key === 'tuteur') goToTuteurView()
    else if (item.key === 'mes-cours') goToMesCoursView()
    else if (item.key === 'historique') { setView('historique'); setSidebarOpen(false) }
  }

  async function generateQuiz() {
    setGenError('')
    if ((!docText.trim() || docText.trim().length < 20) && docImages.length === 0) {
      setGenError('Colle un texte de cours un peu plus long, ou importe un fichier, avant de générer.')
      return
    }
    setStage('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ docText, images: docImages, numQuestions, domaine, niveau }),
        }
      )
      const data = await response.json()
      if (data.error) { setGenError(data.error); setStage('input'); return }
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

  async function extractFromFile(file) {
    if (file.type.startsWith('image/')) {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            canvas.getContext('2d').drawImage(img, 0, 0)
            resolve(canvas.toDataURL('image/jpeg', 0.8))
          }
          img.onerror = reject
          img.src = reader.result
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      return { mode: 'images', images: [dataUrl.split(',')[1]] }
    }
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let text = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((item) => item.str).join(' ') + '\n'
      }
      if (text.trim().length >= 30) {
        return { mode: 'text', text: text.trim() }
      }
      // PDF scanné/image : on transforme les pages en images pour que l'IA les lise directement
      const maxPages = Math.min(pdf.numPages, 8)
      const images = []
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport }).promise
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
        images.push(dataUrl.split(',')[1])
      }
      return { mode: 'images', images }
    } else if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return { mode: 'text', text: result.value }
    }
    throw new Error('FORMAT_NON_SUPPORTE')
  }

  async function hashText(text) {
    const enc = new TextEncoder().encode(text)
    const buf = await crypto.subtle.digest('SHA-256', enc)
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  async function getOrCreateDocument(text, titre) {
    const { data: { user } } = await supabase.auth.getUser()
    const hash = await hashText(text)
    const { data: existing } = await supabase.from('documents').select('id, titre').eq('user_id', user.id).eq('contenu_hash', hash).maybeSingle()
    if (existing) return existing.id
    const { data: created, error } = await supabase.from('documents').insert({
      user_id: user.id, titre, contenu_texte: text, contenu_hash: hash,
    }).select().single()
    if (error) { console.error('Erreur enregistrement document:', error); return null }
    loadMesCours()
    return created.id
  }

    async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setGenError('')
    setExtracting(true)
    try {
      const result = await extractFromFile(file)
      if (result.mode === 'text') {
        setDocText(result.text)
        setDocImages([])
      } else {
        setDocImages(result.images)
        setDocText('')
      }
    } catch (err) {
      setGenError(err.message === 'FORMAT_NON_SUPPORTE' ? 'Formats acceptés : PDF ou Word (.docx) uniquement.' : "Échec de la lecture du fichier. Réessaie ou colle le texte manuellement.")
    }
    setExtracting(false)
  }

    async function handleFicheFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setFicheFileName(file.name)
    setFicheError('')
    setFicheExtracting(true)
    try {
      const result = await extractFromFile(file)
      if (result.mode === 'text') {
        setFicheDocText(result.text)
        setFicheDocImages([])
      } else {
        setFicheDocImages(result.images)
        setFicheDocText('')
      }
    } catch (err) {
      setFicheError(err.message === 'FORMAT_NON_SUPPORTE' ? 'Formats acceptés : PDF ou Word (.docx) uniquement.' : "Échec de la lecture du fichier. Réessaie ou colle le texte manuellement.")
    }
    setFicheExtracting(false)
  }

  function handleHeroUpload(e) {
    setView('quiz')
    setStage('input')
    handleFileUpload(e)
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

      const documentId = await getOrCreateDocument(docText, titre)
      if (!documentId) return

      const { data: session, error: sessionError } = await supabase.from('quiz_sessions').insert({
        user_id: user.id, document_id: documentId, titre,
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
    setView('quiz')
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

  async function confirmLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const score = answers.filter((a, i) => a === questions[i]?.correctIndex).length
  const letters = ['A', 'B', 'C', 'D']

  const cardStyle = { background: T.card, borderRadius: 20, padding: 24, border: `1px solid ${T.border}`, boxShadow: T.shadow }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', fontFamily: 'Inter, sans-serif', color: T.text }}>

      {/* Sidebar à icônes */}
      <div style={{
        width: SIDEBAR_W, flexShrink: 0, background: T.card, borderRight: `1px solid ${T.border}`,
        padding: 16, display: 'flex', flexDirection: 'column', gap: 4,
        position: 'fixed', top: 0, bottom: 0, left: 0,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease', zIndex: 40,
      }} className="sidebar-responsive">
        <button
          onClick={() => setSidebarOpen(false)}
          className="sidebar-close-btn"
          style={{ display: 'none', alignSelf: 'flex-end', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.sub, marginBottom: -4 }}
        >
          ✕
        </button>

        <div onClick={goHome} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: T.accent, fontWeight: 700, cursor: 'pointer', padding: '4px 8px 16px' }}>
          <Logo size={24} />
          Révision
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = view === item.key
          return (
            <button
              key={item.key}
              onClick={() => handleNavClick(item)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                background: isActive ? T.accentSoft : 'transparent',
                color: isActive ? T.accent : item.premium ? T.sub : T.text,
                border: 'none', borderRadius: 10, padding: '10px 10px',
                fontFamily: 'Inter, sans-serif', fontWeight: isActive ? 700 : 600, fontSize: 13.5,
                cursor: 'pointer', opacity: item.premium ? 0.65 : 1,
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.premium && (
                <span style={{ fontSize: 9.5, fontWeight: 700, color: T.accent, background: T.accentSoft, borderRadius: 999, padding: '2px 6px' }}>
                  PRO
                </span>
              )}
            </button>
          )
        })}

        <div style={{ flex: 1 }} />
        <button onClick={() => setShowLogoutConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 10px', fontWeight: 600, fontSize: 13, color: T.sub, cursor: 'pointer' }}>
          <span>🚪</span> Se déconnecter
        </button>
      </div>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="sidebar-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 35, display: 'none' }} />
      )}

      {/* Contenu principal */}
      <div style={{ flex: 1, padding: '28px 28px', width: '100%' }} className="main-content">
        <button
          onClick={() => setSidebarOpen(true)}
          className="menu-toggle-btn"
          style={{ display: 'none', position: 'fixed', top: 16, left: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, width: 36, height: 36, fontSize: 16, cursor: 'pointer', zIndex: 30 }}
        >
          ☰
        </button>

        {premiumMsg && (
          <div style={{ position: 'fixed', top: 20, right: 20, background: T.text, color: T.bg, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 60 }}>
            🔒 Fonctionnalité Premium — bientôt disponible
          </div>
        )}

        {/* En-tête commun */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, maxWidth: 1000, margin: '0 auto 24px' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 600, margin: 0 }}>
              {view === 'accueil' && `Bonjour ${nom || ''} 👋`}
              {view === 'quiz' && 'Créer un quiz'}
              {view === 'fiches' && 'Fiches de révision'}
              {view === 'comprendre' && 'Comprendre'}
              {view === 'tuteur' && 'Mon tuteur IA'}
              {view === 'progression' && 'Ma progression'}
              {view === 'mes-cours' && 'Mes cours'}
              {view === 'historique' && 'Historique'}
            </h1>
            {view === 'accueil' && <p style={{ color: T.sub, fontSize: 14, margin: '4px 0 0' }}>Prête à progresser ? Ton cours t'attend !</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle />
            {nom && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{nom}</div>
                <div style={{ fontSize: 11.5, color: T.sub }}>{niveau}</div>
              </div>
            )}
          </div>
        </div>

        {/* VUE ACCUEIL */}
        {view === 'accueil' && (
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 560px' }}>
              <div style={{ ...cardStyle, background: T.accentSoft, border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ maxWidth: 340 }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 19, fontWeight: 600, marginBottom: 6 }}>
                    Transforme ton cours en quiz avec l'IA
                  </div>
                  <div style={{ fontSize: 13.5, color: T.sub, marginBottom: 16 }}>
                    Importe ton document et laisse l'IA préparer ta révision.
                  </div>
                  <label style={{ display: 'inline-block', background: T.accent, color: '#fff', borderRadius: 12, padding: '11px 18px', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
                    + Importer un PDF / Word
                    <input type="file" accept=".pdf,.docx,image/*" onChange={handleHeroUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                <div style={{ fontSize: 46 }}>📘</div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, margin: '24px 0 12px' }}>QUE VEUX-TU FAIRE AUJOURD'HUI ?</div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {[
                  { icon: '📝', t: 'Créer un quiz', d: 'Génère des QCM à partir de ton cours.', action: goToQuizView, premium: false },
                  { icon: '📄', t: 'Fiche de révision', d: 'Transforme ton cours en résumé structuré.', action: goToFichesView, premium: false },
                  { icon: '🧠', t: 'Comprendre', d: 'Pose une question et obtiens une explication.', action: goToComprendreView, premium: false },
                  { icon: '🤖', t: 'Mon tuteur IA', d: 'Discute avec ton cours comme avec un vrai tuteur.', action: goToTuteurView, premium: false },
                  { icon: '📚', t: 'Mes cours', d: 'Retrouve tous tes documents déjà importés.', action: goToMesCoursView, premium: false },
                ].map((tile) => (
                  <div key={tile.t} onClick={tile.action} style={{ ...cardStyle, flex: '1 1 200px', cursor: 'pointer', opacity: tile.premium ? 0.75 : 1 }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{tile.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{tile.t} {tile.premium && '🔒'}</div>
                    <div style={{ fontSize: 12.5, color: T.sub, lineHeight: 1.4 }}>{tile.d}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, margin: '24px 0 12px' }}>MES COURS RÉCENTS</div>
              <div style={cardStyle}>
                {loadingHistory ? (
                  <div style={{ fontSize: 13, color: T.sub }}>Chargement...</div>
                ) : history.length === 0 ? (
                  <div style={{ fontSize: 13, color: T.sub }}>Aucun cours pour l'instant — importe ton premier document !</div>
                ) : (
                  history.slice(0, 5).map((h, i) => (
                    <div
                      key={h.id}
                      onClick={() => openSession(h.id)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 4px', cursor: 'pointer',
                        borderBottom: i < Math.min(history.length, 5) - 1 ? `1px solid ${T.border}` : 'none',
                      }}
                    >
                      <div style={{ fontSize: 13.5 }}>📘 {h.titre}</div>
                      <div style={{ fontSize: 12, color: T.sub }}>{h.score}/{h.total_questions}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ ...cardStyle, background: T.accentSoft, border: 'none' }}>
                <div style={{ fontSize: 13.5, fontStyle: 'italic', lineHeight: 1.5 }}>
                  Un grand rêve commence toujours par une petite action. 💙
                </div>
              </div>

              <div style={{ ...cardStyle, textAlign: 'center', cursor: 'pointer' }} onClick={goToProgressionView}>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>📈 Ma progression</div>
                {history.length === 0 ? (
                  <div style={{ fontSize: 12, color: T.sub }}>Fais ton premier quiz pour suivre ta maîtrise.</div>
                ) : (
                  <>
                    <ProgressRing
                      T={T} size={96}
                      pct={Math.round(history.reduce((s, h) => s + (h.score || 0), 0) / Math.max(1, history.reduce((s, h) => s + (h.total_questions || 0), 0)) * 100)}
                    />
                    <div style={{ fontSize: 12, color: T.accent, fontWeight: 700, marginTop: 8 }}>Voir le détail →</div>
                  </>
                )}
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>🕘 Mon historique</div>
                  <button onClick={() => setView('historique')} style={{ background: 'none', border: 'none', color: T.accent, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Voir tout →</button>
                </div>
                {history.slice(0, 4).map((h) => (
                  <div key={h.id} onClick={() => openSession(h.id)} style={{ fontSize: 12.5, padding: '6px 0', cursor: 'pointer', color: T.sub }}>
                    {h.titre} — <strong style={{ color: T.text }}>{h.score}/{h.total_questions}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VUE HISTORIQUE */}
        {view === 'historique' && (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={cardStyle}>
              {loadingHistory || loadingFicheHistory ? (
                <div style={{ fontSize: 13, color: T.sub }}>Chargement...</div>
              ) : history.length === 0 && ficheHistory.length === 0 ? (
                <div style={{ fontSize: 13, color: T.sub }}>Aucune session pour l'instant.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ...history.map((h) => ({ ...h, type: 'quiz' })),
                    ...ficheHistory.map((f) => ({ ...f, type: 'fiche' })),
                    ...comprendreHistory.map((c) => ({ ...c, type: 'comprendre' })),
                    ...tuteurHistory.map((t) => ({ ...t, type: 'tuteur' })),
                  ]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((item) => (
                      <div key={`${item.type}-${item.id}`} style={{ position: 'relative' }}>
                        <button
                          onClick={() => item.type === 'quiz' ? openSession(item.id) : item.type === 'fiche' ? openFiche(item.id) : item.type === 'comprendre' ? openComprendre(item.id) : openTuteurConversation(item.id)}
                          style={{ width: '100%', textAlign: 'left', background: T.cardSoft, border: 'none', borderRadius: 12, padding: '14px 40px 14px 14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                        >
                          <div style={{ fontSize: 14, marginBottom: 4 }}>
                            {item.type === 'quiz' ? '📝' : item.type === 'fiche' ? '📄' : item.type === 'comprendre' ? '📚' : '💬'} {item.titre}
                          </div>
                          {item.type === 'quiz' && <div style={{ fontSize: 12, color: T.sub }}>{item.score}/{item.total_questions}</div>}
                        </button>
                        <button
                          onClick={(e) => item.type === 'quiz' ? deleteSession(item.id, e) : item.type === 'fiche' ? deleteFiche(item.id, e) : item.type === 'comprendre' ? deleteComprendre(item.id, e) : deleteTuteurConversation(item.id, e)}
                          style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: T.sub, fontSize: 14, cursor: 'pointer' }}
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VUE FICHES DE RÉVISION */}
        {view === 'fiches' && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>

            {ficheStage === 'input' && (
              <>
              {ficheHistory.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, fontSize: 13 }}>
                  <span style={{ color: T.sub }}>{ficheHistory.length} fiche{ficheHistory.length > 1 ? 's' : ''} déjà créée{ficheHistory.length > 1 ? 's' : ''}</span>
                  <button onClick={() => setView('historique')} style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                    Voir mes fiches →
                  </button>
                </div>
              )}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Contenu du cours</div>
                  <label style={{ fontSize: 12.5, color: T.accent, fontWeight: 700, cursor: 'pointer' }}>
                    {ficheExtracting ? 'Lecture en cours...' : '📎 Importer un PDF/Word'}
                    <input type="file" accept=".pdf,.docx,image/*" onChange={handleFicheFileUpload} style={{ display: 'none' }} disabled={ficheExtracting} />
                  </label>
                </div>
                {ficheFileName && !ficheExtracting && <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>Fichier : {ficheFileName}</div>}
                <textarea value={ficheDocText} onChange={(e) => setFicheDocText(e.target.value)} placeholder="Colle ici le texte de ton cours, ou importe un fichier ci-dessus..." rows={8} style={{ ...inputStyle, resize: 'vertical' }} />
                  <button onClick={generateFiche} style={{ ...buttonStyle, width: '100%', marginTop: 20 }}>Générer ma fiche</button>
                {ficheError && <p style={{ color: '#E0483C', fontSize: 13, marginTop: 10 }}>{ficheError}</p>}
              </div>
              </>
            )}

            {ficheStage === 'loading' && (
              <div style={{ ...cardStyle, padding: 48, textAlign: 'center' }}>
                <div style={{ color: T.sub, fontSize: 14 }}>Lecture du cours et préparation de la fiche...</div>
              </div>
            )}

            {ficheStage === 'result' && ficheData && (
              <div style={cardStyle}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 19, fontWeight: 600, marginBottom: 20 }}>{ficheData.titre}</div>
                {(ficheData.sections || []).map((section, si) => (
                  <div key={si} style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.accent, marginBottom: 8 }}>{section.titre_section}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(section.points || []).map((point, pi) => (
                        <div key={pi} style={{ display: 'flex', gap: 8, fontSize: 13.5, lineHeight: 1.5 }}>
                          <span style={{ color: T.accent }}>•</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={goToFichesView} style={{ ...buttonStyle, width: '100%', marginTop: 8 }}>Nouvelle fiche</button>
              </div>
            )}
          </div>
        )}

         {/* VUE COMPRENDRE */}
        {view === 'comprendre' && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>

            {comprendreStage === 'input' && (
              <div style={cardStyle}>
                {comprendreHistory.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: 13 }}>
                    <span style={{ color: T.sub }}>{comprendreHistory.length} question{comprendreHistory.length > 1 ? 's' : ''} déjà posée{comprendreHistory.length > 1 ? 's' : ''}</span>
                    <button onClick={() => setView('historique')} style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                      Voir l'historique →
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Contenu du cours</div>
                  <label style={{ fontSize: 12.5, color: T.accent, fontWeight: 700, cursor: 'pointer' }}>
                    {comprendreExtracting ? 'Lecture en cours...' : '📎 Importer un PDF/Word'}
                    <input type="file" accept=".pdf,.docx,image/*" onChange={handleComprendreFileUpload} style={{ display: 'none' }} disabled={comprendreExtracting} />
                  </label>
                </div>
                {comprendreFileName && !comprendreExtracting && (
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>
                    Fichier : {comprendreFileName} {comprendreDocImages.length > 0 && '(lu comme scan)'}
                  </div>
                )}
                <textarea value={comprendreDocText} onChange={(e) => setComprendreDocText(e.target.value)} placeholder="Colle ici le texte de ton cours, ou importe un fichier ci-dessus..." rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
                <div style={{ fontSize: 13, color: T.sub, fontWeight: 600, margin: '16px 0 8px' }}>Ta question</div>
                <input type="text" value={comprendreQuestion} onChange={(e) => setComprendreQuestion(e.target.value)} placeholder="Ex : c'est quoi la différence entre..." style={inputStyle} />
                <button onClick={askComprendre} style={{ ...buttonStyle, width: '100%', marginTop: 20 }}>Obtenir une explication</button>
                {comprendreError && <p style={{ color: '#E0483C', fontSize: 13, marginTop: 10 }}>{comprendreError}</p>}
              </div>
            )}

            {comprendreStage === 'loading' && (
              <div style={{ ...cardStyle, padding: 48, textAlign: 'center' }}>
                <div style={{ color: T.sub, fontSize: 14 }}>Réflexion en cours...</div>
              </div>
            )}

            {comprendreStage === 'result' && comprendreData && (
              <div style={cardStyle}>
                <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 4 }}>Ta question</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 600, marginBottom: 18 }}>{comprendreQuestion}</div>
                <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 6 }}>Réponse</div>
                <div style={{ background: T.accentSoft, borderRadius: 12, padding: '14px 16px', fontSize: 14, lineHeight: 1.6 }}>
                  {formatAIText(comprendreData.reponse)}
                </div>
                <button onClick={goToComprendreView} style={{ ...buttonStyle, width: '100%', marginTop: 20 }}>Poser une nouvelle question</button>
              </div>
            )}
          </div>
        )}

        {/* VUE MON TUTEUR IA */}
        {view === 'tuteur' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>

            {tuteurStage === 'input' && (
              <div style={cardStyle}>
                {tuteurHistory.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: 13 }}>
                    <span style={{ color: T.sub }}>{tuteurHistory.length} conversation{tuteurHistory.length > 1 ? 's' : ''}</span>
                    <button onClick={() => setView('historique')} style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                      Voir l'historique →
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Sur quel cours veux-tu discuter ?</div>
                  <label style={{ fontSize: 12.5, color: T.accent, fontWeight: 700, cursor: 'pointer' }}>
                    {tuteurExtracting ? 'Lecture en cours...' : '📎 Importer un PDF/Word'}
                    <input type="file" accept=".pdf,.docx,image/*" onChange={handleTuteurFileUpload} style={{ display: 'none' }} disabled={tuteurExtracting} />
                  </label>
                </div>
                {tuteurFileName && !tuteurExtracting && (
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>
                    Fichier : {tuteurFileName} {tuteurDocImages.length > 0 && '(lu comme scan)'}
                  </div>
                )}
                <textarea value={tuteurDocText} onChange={(e) => setTuteurDocText(e.target.value)} placeholder="Colle ici le texte de ton cours, ou importe un fichier ci-dessus..." rows={8} style={{ ...inputStyle, resize: 'vertical' }} />
                <button onClick={startTuteurConversation} style={{ ...buttonStyle, width: '100%', marginTop: 20 }}>Commencer la discussion</button>
                {tuteurError && <p style={{ color: '#E0483C', fontSize: 13, marginTop: 10 }}>{tuteurError}</p>}
              </div>
            )}

            {tuteurStage === 'chat' && (
              <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', height: '65vh' }}>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
                  {tuteurMessages.length === 0 && (
                    <div style={{ fontSize: 13, color: T.sub, textAlign: 'center', marginTop: 20 }}>
                      Pose ta première question sur ce cours 👇
                    </div>
                  )}
                  {tuteurMessages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '80%', padding: '10px 14px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.5,
                        background: m.role === 'user' ? T.accent : T.cardSoft,
                        color: m.role === 'user' ? '#fff' : T.text,
                      }}>
                        {formatAIText(m.contenu)}
                      </div>
                    </div>
                  ))}
                  {tuteurSending && (
                    <div style={{ fontSize: 12.5, color: T.sub, fontStyle: 'italic' }}>Le tuteur réfléchit...</div>
                  )}
                </div>
                {tuteurError && <p style={{ color: '#E0483C', fontSize: 12.5, marginBottom: 8 }}>{tuteurError}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text" value={tuteurInput} onChange={(e) => setTuteurInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendTuteurMessage()}
                    placeholder="Écris ta question..." style={{ ...inputStyle, flex: 1 }} disabled={tuteurSending}
                  />
                  <button onClick={sendTuteurMessage} disabled={tuteurSending} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '0 18px', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
                    Envoyer
                  </button>
                </div>
                <button onClick={goToTuteurView} style={{ background: 'none', border: 'none', color: T.sub, fontSize: 12.5, cursor: 'pointer', marginTop: 10 }}>
                  ← Nouvelle conversation
                </button>
              </div>
            )}
          </div>
        )}

                {/* VUE MA PROGRESSION */}
        {view === 'progression' && (() => {
          const totalQuestionsHist = history.reduce((s, h) => s + (h.total_questions || 0), 0)
          const correctHist = history.reduce((s, h) => s + (h.score || 0), 0)
          const globalPct = totalQuestionsHist ? Math.round((correctHist / totalQuestionsHist) * 100) : 0
          const recent = [...history].slice(0, 10).reverse()
          const byCourse = [...history]
            .map((h) => ({ ...h, pct: h.total_questions ? Math.round((h.score / h.total_questions) * 100) : 0 }))
            .sort((a, b) => a.pct - b.pct)
          const hasDetail = progData && progData.total > 0
          const barColor = (p) => (p >= 70 ? '#1E9E5A' : p >= 40 ? '#E8A33D' : '#E0483C')

          return (
            <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {loadingProg || loadingHistory ? (
                <div style={{ ...cardStyle, padding: 48, textAlign: 'center', color: T.sub, fontSize: 14 }}>Calcul de ta progression...</div>
              ) : history.length === 0 ? (
                <div style={{ ...cardStyle, padding: 40, textAlign: 'center' }}>
                  <div style={{ fontSize: 34, marginBottom: 10 }}>📈</div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Pas encore de données</div>
                  <div style={{ fontSize: 13.5, color: T.sub, marginBottom: 18 }}>Fais ton premier quiz : ta maîtrise apparaîtra ici.</div>
                  <button onClick={goToQuizView} style={{ ...buttonStyle, padding: '12px 24px', marginTop: 0 }}>Créer un quiz</button>
                </div>
              ) : (
                <>
                  {/* Anneau + compteurs */}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ ...cardStyle, flex: '1 1 220px', textAlign: 'center' }}>
                      <div style={{ fontSize: 12.5, color: T.sub, fontWeight: 600, marginBottom: 12 }}>Maîtrise globale</div>
                      <ProgressRing pct={globalPct} T={T} />
                      <div style={{ fontSize: 12, color: T.sub, marginTop: 10 }}>{correctHist} bonnes réponses sur {totalQuestionsHist}</div>
                    </div>
                    <div style={{ flex: '2 1 320px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {[
                        { icon: '📝', label: 'Quiz réalisés', value: history.length },
                        { icon: '❓', label: 'Questions répondues', value: totalQuestionsHist },
                        { icon: '📄', label: 'Fiches créées', value: ficheHistory.length },
                        { icon: '💬', label: 'Explications & discussions', value: comprendreHistory.length + tuteurHistory.length },
                      ].map((s) => (
                        <div key={s.label} style={{ ...cardStyle, padding: 18 }}>
                          <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 600 }}>{s.value}</div>
                          <div style={{ fontSize: 12, color: T.sub }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Répartition des réponses */}
                  <div style={cardStyle}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Comment tu réponds</div>
                    {hasDetail ? (
                      <>
                        <div style={{ display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden', background: T.border }}>
                          <div style={{ width: `${(progData.correct / progData.total) * 100}%`, background: '#1E9E5A' }} />
                          <div style={{ width: `${(progData.wrong / progData.total) * 100}%`, background: '#E0483C' }} />
                          <div style={{ width: `${(progData.unknown / progData.total) * 100}%`, background: '#9AA0A6' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 12, fontSize: 12.5 }}>
                          <span><span style={{ color: '#1E9E5A' }}>●</span> Bonnes réponses : <strong>{progData.correct}</strong></span>
                          <span><span style={{ color: '#E0483C' }}>●</span> Réponses fausses : <strong>{progData.wrong}</strong></span>
                          <span><span style={{ color: '#9AA0A6' }}>●</span> « Je ne sais pas » / temps écoulé : <strong>{progData.unknown}</strong></span>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 13, color: T.sub }}>Le détail par question apparaîtra dès ton prochain quiz terminé.</div>
                    )}
                  </div>

                  {/* Évolution */}
                  <div style={cardStyle}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Évolution de tes derniers quiz</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
                      {recent.map((h, i) => {
                        const p = h.total_questions ? Math.round((h.score / h.total_questions) * 100) : 0
                        return (
                          <div key={h.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }} title={`${h.titre} — ${p}%`}>
                            <div style={{ fontSize: 10.5, color: T.sub, marginBottom: 3 }}>{p}%</div>
                            <div style={{ width: '100%', maxWidth: 34, height: `${Math.max(p, 4)}%`, background: barColor(p), borderRadius: '6px 6px 0 0' }} />
                            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>{i + 1}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Par cours */}
                  <div style={cardStyle}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Par cours</div>
                    <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 14 }}>Du plus fragile au plus solide — clique pour revoir la correction.</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {byCourse.slice(0, 8).map((c) => (
                        <div key={c.id} onClick={() => openSession(c.id)} style={{ cursor: 'pointer' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5, gap: 10 }}>
                            <span>
                              {c.titre}
                              {c.pct < 50 && <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 700, color: '#E0483C', background: 'rgba(224,72,60,0.12)', padding: '2px 7px', borderRadius: 999 }}>À retravailler</span>}
                            </span>
                            <strong>{c.pct}%</strong>
                          </div>
                          <div style={{ height: 8, background: T.border, borderRadius: 999 }}>
                            <div style={{ width: `${c.pct}%`, height: '100%', background: barColor(c.pct), borderRadius: 999 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Points faibles */}
                  {hasDetail && progData.missed.length > 0 && (
                    <div style={cardStyle}>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>À revoir en priorité</div>
                      <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 14 }}>Tes dernières questions ratées.</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {progData.missed.map((m, i) => (
                          <div key={i} style={{ background: T.cardSoft, borderRadius: 14, padding: '14px 16px', borderLeft: `3px solid ${m.kind === 'unknown' ? '#9AA0A6' : '#E0483C'}` }}>
                            <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 4 }}>
                              {m.quiz_sessions?.titre} · {m.kind === 'unknown' ? 'Je ne savais pas' : 'Réponse incorrecte'}
                            </div>
                            <div style={{ fontSize: 14, marginBottom: 6 }}>{m.question}</div>
                            <div style={{ fontSize: 12.5, color: T.sub }}>Bonne réponse : <strong style={{ color: T.text }}>{m.options?.[m.correct_index]}</strong></div>
                            {m.explication && <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.5, color: T.sub }}>{m.explication}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })()}

                {/* VUE MES COURS */}
        {view === 'mes-cours' && (
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {loadingMesCours ? (
              <div style={{ ...cardStyle, textAlign: 'center', color: T.sub, fontSize: 14 }}>Chargement...</div>
            ) : mesCours.length === 0 ? (
              <div style={{ ...cardStyle, padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 34, marginBottom: 10 }}>📚</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Aucun cours pour l'instant</div>
                <div style={{ fontSize: 13.5, color: T.sub, marginBottom: 18 }}>Importe un document depuis n'importe quelle fonctionnalité — il apparaîtra ici automatiquement.</div>
                <button onClick={goToQuizView} style={{ ...buttonStyle, padding: '12px 24px', marginTop: 0 }}>Créer un quiz</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {mesCours.map((doc) => (
                  <div key={doc.id} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>📘 {doc.titre}</div>
                      <button onClick={(e) => deleteDocument(doc.id, e)} style={{ background: 'none', border: 'none', color: T.sub, fontSize: 14, cursor: 'pointer', flexShrink: 0 }} title="Supprimer">✕</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => useCourseFor(doc, 'quiz')} style={{ background: T.accentSoft, color: T.accent, border: 'none', borderRadius: 10, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>📝 Quiz</button>
                      <button onClick={() => useCourseFor(doc, 'fiches')} style={{ background: T.accentSoft, color: T.accent, border: 'none', borderRadius: 10, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>📄 Fiche</button>
                      <button onClick={() => useCourseFor(doc, 'comprendre')} style={{ background: T.accentSoft, color: T.accent, border: 'none', borderRadius: 10, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>🧠 Comprendre</button>
                      <button onClick={() => useCourseFor(doc, 'tuteur')} style={{ background: T.accentSoft, color: T.accent, border: 'none', borderRadius: 10, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>🤖 Tuteur</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VUE QUIZ (parcours existant) */}
        {view === 'quiz' && (
          <div style={{ maxWidth: 520, margin: '0 auto' }}>

            {stage === 'input' && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Contenu du cours</div>
                  <label style={{ fontSize: 12.5, color: T.accent, fontWeight: 700, cursor: 'pointer' }}>
                    {extracting ? 'Lecture en cours...' : '📎 Importer un PDF/Word'}
                    <input type="file" accept=".pdf,.docx,image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={extracting} />
                  </label>
                </div>
                  {fileName && !extracting && (
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>
                    Fichier : {fileName} {docImages.length > 0 && '(lu comme scan)'}
                  </div>
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
              <div style={{ ...cardStyle, padding: 48, textAlign: 'center' }}>
                <div style={{ color: T.sub, fontSize: 14 }}>Lecture du cours et préparation des questions...</div>
              </div>
            )}

            {stage === 'revision' && (
              <div style={cardStyle}>
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
              <div style={cardStyle}>
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
              <div style={cardStyle}>
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
        )}
      </div>

      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: T.card, borderRadius: 16, padding: 24, maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Se déconnecter ?</div>
            <div style={{ fontSize: 13.5, color: T.sub, marginBottom: 20 }}>Tu devras te reconnecter pour accéder à ton tableau de bord.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, background: T.cardSoft, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 0', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', color: T.text }}>Annuler</button>
              <button onClick={confirmLogout} style={{ flex: 1, background: '#E0483C', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 0', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Se déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}