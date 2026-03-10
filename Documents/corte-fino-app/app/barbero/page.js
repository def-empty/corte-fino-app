'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function PanelBarbero() {
  const router = useRouter()
  const [perfil, setPerfil] = useState(null)
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Verificar que sea barbero
      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (perfilData?.rol !== 'barbero') {
        router.push('/dashboard')
        return
      }

      setPerfil(perfilData)

      // Buscar el barbero asociado al perfil
      const { data: barberoData } = await supabase
        .from('barberos')
        .select('*')
        .eq('perfil_id', user.id)
        .single()

      if (!barberoData) {
        setLoading(false)
        return
      }

      // Cargar reservas del barbero
      const { data: reservasData } = await supabase
        .from('reservas')
        .select('*, servicios(nombre, precio), perfiles(nombre, telefono)')
        .eq('barbero_id', barberoData.id)
        .order('fecha', { ascending: true })

      setReservas(reservasData || [])
      setLoading(false)
    }

    cargarDatos()
  }, [router])

  const cambiarEstado = async (reservaId, nuevoEstado) => {
    const { error } = await supabase
      .from('reservas')
      .update({ estado: nuevoEstado })
      .eq('id', reservaId)

    if (error) {
      alert('Error al actualizar la reserva')
      return
    }

    setReservas(prev => prev.map(r =>
      r.id === reservaId ? { ...r, estado: nuevoEstado } : r
    ))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="auth-container">
        <p style={{ color: '#c9a84c' }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <nav className="dash-nav">
        <div className="dash-nav-logo">
          <span>✂</span>
          <h1>Corte <span>Fino</span></h1>
        </div>
        <div className="dash-nav-right">
          <span>✂ {perfil?.nombre}</span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="dash-container">
        <section className="dash-section">
          <h2>Mis <span className="gold">Citas</span></h2>

          {reservas.length === 0 ? (
            <div className="dash-empty">
              <p>No tienes citas asignadas aún.</p>
            </div>
          ) : (
            <div className="reservas-grid">
              {reservas.map((r) => (
                <div key={r.id} className={`reserva-card estado-${r.estado}`}>
                  <div className="reserva-header">
                    <span className="reserva-servicio">{r.servicios?.nombre}</span>
                    <span className={`reserva-estado ${r.estado}`}>{r.estado}</span>
                  </div>
                  <div className="reserva-detalle">
                    <span>👤 {r.perfiles?.nombre}</span>
                    <span>📱 {r.perfiles?.telefono}</span>
                    <span>📅 {r.fecha}</span>
                    <span>🕐 {r.hora}</span>
                    <span>💰 ${r.servicios?.precio?.toLocaleString()}</span>
                  </div>

                  {r.estado === 'pendiente' && (
                    <div className="reserva-acciones">
                      <button
                        onClick={() => cambiarEstado(r.id, 'confirmada')}
                        className="btn-confirmar"
                      >
                        ✓ Confirmar
                      </button>
                      <button
                        onClick={() => cambiarEstado(r.id, 'cancelada')}
                        className="btn-cancelar"
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}