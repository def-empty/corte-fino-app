'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (!perfil) {
        router.push('/login')
        return
      }

      if (perfil.rol === 'admin') {
        router.push('/admin')
      } else if (perfil.rol === 'barbero') {
        router.push('/barbero')
      } else {
        router.push('/dashboard')
      }
    }

    verificarSesion()
  }, [router])

  return (
    <div className="auth-container">
      <p style={{ color: '#c9a84c' }}>Cargando...</p>
    </div>
  )
}