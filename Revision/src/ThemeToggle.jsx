import { useTheme } from './ThemeContext'

export default function ThemeToggle() {
  const { T, mode, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      style={{
        background: T.cardSoft, border: `1px solid ${T.border}`, borderRadius: 999,
        width: 34, height: 34, fontSize: 15, cursor: 'pointer', flexShrink: 0,
      }}
      title="Changer de thème"
    >
      {mode === 'light' ? '🌙' : '☀️'}
    </button>
  )
}