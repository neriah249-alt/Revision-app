import { createContext, useContext, useState, useEffect } from 'react'
import { LIGHT, DARK } from './theme'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('theme') || 'light')

    useEffect(() => {
    localStorage.setItem('theme', mode)
    document.body.style.backgroundColor = mode === 'dark' ? '#15161A' : '#F7F5F0'
  }, [mode])

  const T = mode === 'dark' ? DARK : LIGHT
  const toggleTheme = () => setMode((m) => (m === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ T, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}