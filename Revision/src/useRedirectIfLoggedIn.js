import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

export default function useRedirectIfLoggedIn() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      if (session) navigate('/dashboard', { replace: true })
      else setChecking(false)
    })
    return () => { active = false }
  }, [])

  return checking
}