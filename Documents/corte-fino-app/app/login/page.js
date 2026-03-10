'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

if (error) {
  setError('Email o contraseña incorrectos')
  setLoading(false)
  return
}

// Verificar rol y redirigir
const { data: perfil } = await supabase
  .from('perfiles')
  .select('rol')
  .eq('id', data.user.id)
  .single()

if (perfil?.rol === 'admin') {
  router.push('/admin')
} else if (perfil?.rol === 'barbero') {
  router.push('/barbero')
} else {
  router.push('/dashboard')
}
 }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span>✂</span>
          <h1>Corte <span>Fino</span></h1>
        </div>

        <h2>Iniciar sesión</h2>
        <p className="auth-sub">Bienvenido de vuelta</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-auth"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>

        <p className="auth-link">
          ¿No tienes cuenta?{' '}
          <Link href="/registro">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  )
}