'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Registro() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegistro = async () => {
    setLoading(true)
    setError('')

    if (!nombre || !email || !password) {
      setError('Por favor completa todos los campos obligatorios')
      setLoading(false)
      return
    }

const { data, error } = await supabase.auth.signUp({
  email,
  password
})

if (error) {
  setError('Error al crear la cuenta. Intenta con otro email.')
  setLoading(false)
  return
}

// Crear perfil en la tabla perfiles
const { error: perfilError } = await supabase.from('perfiles').insert({
  id: data.user.id,
  nombre,
  telefono,
  rol: 'cliente'
})

if (perfilError) {
  setError('Cuenta creada pero hubo un problema con el perfil. Contacta soporte.')
  setLoading(false)
  return
}

    router.push('/dashboard')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span>✂</span>
          <h1>Corte <span>Fino</span></h1>
        </div>

        <h2>Crear cuenta</h2>
        <p className="auth-sub">Únete a Corte Fino</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-form">
          <div className="form-group">
            <label>Nombre completo *</label>
            <input
              type="text"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              placeholder="+56 9 1234 5678"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Contraseña *</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            onClick={handleRegistro}
            disabled={loading}
            className="btn-auth"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </div>

        <p className="auth-link">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}