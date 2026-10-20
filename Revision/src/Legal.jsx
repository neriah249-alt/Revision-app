import { Link } from 'react-router-dom'
import { useTheme } from './ThemeContext'
import Logo from './Logo'

// À VÉRIFIER / ADAPTER avant publication
const APP_NAME = 'Révision'
const EDITEUR = 'Mauricia OLAFA'
const CONTACT_EMAIL = 'ton-email@exemple.com'
const UPDATED = 'octobre 2026'

function LegalPage({ title, intro, sections }) {
  const { T } = useTheme()
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Inter, sans-serif', padding: '24px 16px 64px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: T.accent, fontWeight: 700, textDecoration: 'none', marginBottom: 24 }}>
          <Logo size={24} /> {APP_NAME}
        </Link>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 600, margin: '0 0 6px' }}>{title}</h1>
        <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 20 }}>Dernière mise à jour : {UPDATED}</div>
        <p style={{ fontSize: 14.5, lineHeight: 1.7 }}>{intro}</p>
        {sections.map((s) => (
          <div key={s.titre} style={{ marginTop: 26 }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 19, fontWeight: 600, margin: '0 0 8px' }}>{s.titre}</h2>
            {s.paragraphes.map((p, i) => (
              <p key={i} style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 10px' }}>{p}</p>
            ))}
          </div>
        ))}
        <div style={{ marginTop: 36, fontSize: 13, color: T.sub }}>
          <Link to="/confidentialite" style={{ color: T.accent }}>Confidentialité</Link> · <Link to="/cgu" style={{ color: T.accent }}>Conditions d'utilisation</Link>
        </div>
      </div>
    </div>
  )
}

export function Confidentialite() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      intro={`Cette page explique quelles données ${APP_NAME} collecte, pourquoi, et comment tu gardes la main dessus.`}
      sections={[
        { titre: 'Qui est responsable ?', paragraphes: [`${APP_NAME} est édité à titre individuel par ${EDITEUR}, basé(e) à Cotonou (Bénin). Contact : ${CONTACT_EMAIL}.`] },
        { titre: 'Les données collectées', paragraphes: [
          'Ton compte : adresse email, nom, domaine d\'études et niveau. Si tu te connectes avec Google, nous recevons ton email et ton nom.',
          'Ton contenu : les documents (texte, PDF, Word, photos) que tu importes, ainsi que les quiz, fiches, questions et conversations générés à partir d\'eux.',
          'Ton usage : le nombre d\'actions utilisées dans le mois, pour appliquer les limites de l\'offre gratuite.',
          'Tes paiements : le paiement est traité par SasPay. Nous ne voyons ni ne conservons ton numéro de carte ou de Mobile Money ; nous gardons seulement une référence, le montant, le statut et la date.',
        ] },
        { titre: 'À quoi servent ces données', paragraphes: ['À fournir le service, générer tes contenus de révision, gérer tes limites et ton accès Premium, assurer la sécurité et répondre à tes demandes. Nous ne vendons pas tes données et nous n\'affichons pas de publicité.'] },
        { titre: 'Traitement par l\'intelligence artificielle', paragraphes: [
          'Pour générer un quiz, une fiche ou une réponse, le contenu de ton document est envoyé au service d\'IA de Google (Gemini), qui le traite pour renvoyer le résultat. Les conditions de Google applicables à ce service s\'appliquent à ce traitement.',
          'N\'importe donc pas de document contenant des informations sensibles sur toi ou sur d\'autres personnes (pièces d\'identité, données de santé, etc.).',
        ] },
        { titre: 'Nos prestataires', paragraphes: ['Supabase (base de données, authentification, fonctions serveur), Vercel (hébergement du site), Google (IA et connexion Google), Resend (envoi d\'emails), SasPay (paiement).'] },
        { titre: 'Durée de conservation et suppression', paragraphes: [
          'Tes données sont conservées tant que ton compte existe. Tu peux supprimer tes cours, quiz, fiches et conversations directement dans l\'application.',
          `Pour supprimer ton compte et toutes tes données, écris à ${CONTACT_EMAIL} : nous y donnons suite dans un délai raisonnable.`,
        ] },
        { titre: 'Tes droits', paragraphes: [`Tu peux demander l'accès à tes données, leur correction ou leur suppression, ou t'opposer à un traitement, en écrivant à ${CONTACT_EMAIL}, conformément à la législation béninoise sur la protection des données personnelles.`] },
        { titre: 'Sécurité', paragraphes: ['Les échanges sont chiffrés (HTTPS), chaque compte n\'accède qu\'à ses propres données et les mots de passe ne sont jamais stockés en clair. Aucun système n\'étant infaillible, nous ne pouvons toutefois pas garantir une sécurité absolue.'] },
        { titre: 'Stockage dans ton navigateur', paragraphes: ['L\'application utilise le stockage de ton navigateur pour te garder connecté·e et mémoriser ton thème clair/sombre. Il n\'y a pas de cookies publicitaires.'] },
        { titre: 'Modifications', paragraphes: ['Cette politique peut évoluer ; la date de mise à jour figure en haut de la page.'] },
      ]}
    />
  )
}

export function CGU() {
  return (
    <LegalPage
      title="Conditions d'utilisation"
      intro={`En utilisant ${APP_NAME}, tu acceptes les conditions ci-dessous. ${APP_NAME} est actuellement en phase bêta : des fonctionnalités peuvent évoluer.`}
      sections={[
        { titre: 'Le service', paragraphes: [`${APP_NAME} t'aide à réviser : à partir de documents que tu fournis, il génère des quiz, des fiches de révision, des explications et des conversations avec un tuteur IA.`] },
        { titre: 'Ton compte', paragraphes: ['Les informations que tu fournis doivent être exactes. Tu es responsable de ton mot de passe et de l\'activité de ton compte. Le service s\'adresse aux étudiants ; si tu es mineur·e, utilise-le avec l\'accord de ton représentant légal.'] },
        { titre: 'Utilisation acceptable', paragraphes: [
          'Tu t\'engages à n\'importer que des documents que tu as le droit d\'utiliser, à ne pas fournir de contenu illégal, à ne pas tenter de contourner les limites du service ni d\'accéder aux données d\'autres personnes, et à ne pas utiliser de moyens automatisés abusifs.',
        ] },
        { titre: 'Tes contenus', paragraphes: ['Tu restes propriétaire de tes documents. Tu nous autorises uniquement à les traiter pour te fournir le service. Les contenus générés sont destinés à ton usage personnel d\'étude.'] },
        { titre: 'L\'intelligence artificielle peut se tromper', paragraphes: ['Les quiz, fiches et réponses sont générés automatiquement et peuvent contenir des erreurs. Vérifie toujours avec ton cours et tes enseignants. Le service ne remplace pas ton travail et ne garantit aucun résultat aux examens.'] },
        { titre: 'Offre gratuite et Premium', paragraphes: [
          'L\'offre gratuite inclut 12 quiz/fiches et 15 questions « Comprendre » ou conversations de tutorat par mois, remis à zéro chaque mois.',
          'Lorsque l\'offre Premium est disponible : 1 000 XOF pour 30 jours d\'accès illimité, sans renouvellement automatique. Le paiement est traité par SasPay (Mobile Money) et l\'accès s\'active après confirmation du paiement.',
          `Les paiements ne sont en principe pas remboursables, sauf erreur de notre part (par exemple un paiement débité sans activation de l'accès) : écris-nous à ${CONTACT_EMAIL}.`,
          'Les limites et les prix peuvent évoluer, avec une information préalable raisonnable.',
        ] },
        { titre: 'Disponibilité', paragraphes: ['Le service est fourni « en l\'état », sans garantie d\'absence d\'interruption ou d\'erreur.'] },
        { titre: 'Responsabilité', paragraphes: ['Dans la limite de ce que permet la loi, notre responsabilité est limitée aux dommages directs et ne couvre pas les pertes indirectes (par exemple un résultat d\'examen).'] },
        { titre: 'Suspension et fin du compte', paragraphes: ['Nous pouvons suspendre un compte en cas d\'abus. Tu peux demander la suppression de ton compte à tout moment.'] },
        { titre: 'Droit applicable et contact', paragraphes: [`Ces conditions sont régies par le droit béninois. Pour toute question : ${CONTACT_EMAIL}.`] },
      ]}
    />
  )
}