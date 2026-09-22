export const LIGHT = {
  bg: '#F7F5F0',
  card: '#FFFFFF',
  cardSoft: '#F1EFE9',
  accentSoft: '#EAF1FF',
  text: '#1C1D1F',
  sub: '#6B6E76',
  border: '#E7E4DC',
  accent: '#2F6FED',
  shadow: '0 1px 2px rgba(20,20,20,0.04), 0 8px 24px rgba(20,20,20,0.06)',
}

export const DARK = {
  bg: '#15161A',
  card: '#1E2025',
  cardSoft: '#262A31',
  accentSoft: '#1E2A44',
  text: '#F2F2F0',
  sub: '#9B9DA5',
  border: '#2E3038',
  accent: '#5B8DEF',
  shadow: '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.35)',
}

export function getStyles(T) {
  return {
    inputStyle: {
      width: '100%',
      padding: '12px 14px',
      borderRadius: 12,
      border: `1px solid ${T.border}`,
      background: T.cardSoft,
      color: T.text,
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
      boxSizing: 'border-box',
      outline: 'none',
    },
    buttonStyle: {
      marginTop: 8,
      background: T.accent,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: 14,
      padding: '13px 0',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 700,
      fontSize: 15,
      cursor: 'pointer',
    },
  }
}