import { useEffect, useState } from 'react'
import Logo from './Logo'
import { useTheme } from './ThemeContext'

export default function SplashScreen({ onDone }) {
  const { T } = useTheme()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 1300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: T.bg, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 999,
      opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease',
    }}>
      <div style={{ animation: 'splash-pulse 1s ease-in-out infinite' }}>
        <Logo size={72} />
      </div>
      <div style={{
        fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, color: T.accent,
        opacity: 0, animation: 'splash-text-in 0.6s ease forwards 0.3s',
      }}>
        Révision
      </div>
      <style>{`
        @keyframes splash-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes splash-text-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}