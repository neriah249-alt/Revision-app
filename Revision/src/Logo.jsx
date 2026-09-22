export default function Logo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <rect x="20" y="20" width="160" height="160" rx="34" fill="#2F6FED" />
      <path d="M52 66 C52 60 57 56 64 56 L98 56 L98 152 L68 152 C59 152 52 145 52 136 Z" fill="white" />
      <path d="M148 66 C148 60 143 56 136 56 L102 56 L102 152 L132 152 C141 152 148 145 148 136 Z" fill="white" fillOpacity="0.9" />
      <line x1="100" y1="56" x2="100" y2="152" stroke="#2F6FED" strokeWidth="2.5" />
      <line x1="62" y1="80" x2="90" y2="80" stroke="#2F6FED" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.35" />
      <line x1="62" y1="94" x2="90" y2="94" stroke="#2F6FED" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.35" />
      <line x1="62" y1="108" x2="82" y2="108" stroke="#2F6FED" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.35" />
      <line x1="110" y1="80" x2="138" y2="80" stroke="#2F6FED" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.3" />
      <line x1="110" y1="94" x2="138" y2="94" stroke="#2F6FED" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.3" />
      <line x1="110" y1="108" x2="130" y2="108" stroke="#2F6FED" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.3" />
      <circle cx="100" cy="58" r="26" fill="#2F6FED" stroke="white" strokeWidth="5" />
      <path d="M100 58 L100 44" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <path d="M100 58 L111 66" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy="58" r="3.5" fill="white" />
    </svg>
  )
}