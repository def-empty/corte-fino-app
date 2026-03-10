'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function PanelAdmin() {
  const router = useRouter()
  const [perfil, setPerfil] = useState(null)
  const [reservas, setReservas] = useState([])
  const [servicios, setServicios] = useState([])
  const [barberos, setBarberos] = useState([])
  const [loading, setLoading] = useState(true)
  const [vistaActiva, setVistaActiva] = useState('reservas')

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (perfilData?.rol !== 'admin') {
        router.push('/dashboard')
        return
      }

      setPerfil(perfilData)

      // Cargar todas las reservas
      const { data: reservasData } = await supabase
        .from('reservas')
        .select('*, servicios(nombre, precio), perfiles(nombre, telefono), barberos(id, perfiles(nombre))')
        .order('fecha', { ascending: true })
      setReservas(reservasData || [])

      // Cargar servicios
      const { data: serviciosData } = await supabase
        .from('servicios')
        .select('*')
      setServicios(serviciosData || [])

      // Cargar barberos
      const { data: barberosData } = await supabase
        .from('barberos')
        .select('*, perfiles(nombre)')
      setBarberos(barberosData || [])

      setLoading(false)
    }

    cargarDatos()
  }, [router])

  const toggleServicio = async (id, activo) => {
    await supabase
      .from('servicios')
      .update({ activo: !activo })
      .eq('id', id)

    setServicios(prev => prev.map(s =>
      s.id === id ? { ...s, activo: !activo } : s
    ))
  }

  const toggleBarbero = async (id, activo) => {
    await supabase
      .from('barberos')
      .update({ activo: !activo })
      .eq('id', id)

    setBarberos(prev => prev.map(b =>
      b.id === id ? { ...b, activo: !activo } : b
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
          <h1>Corte <span>Fino</span> — Admin</h1>
        </div>
        <div className="dash-nav-right">
          <span>👑 {perfil?.nombre}</span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* TABS */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${vistaActiva === 'reservas' ? 'active' : ''}`}
          onClick={() => setVistaActiva('reservas')}
        >
          Reservas ({reservas.length})
        </button>
        <button
          className={`admin-tab ${vistaActiva === 'servicios' ? 'active' : ''}`}
          onClick={() => setVistaActiva('servicios')}
        >
          Servicios ({servicios.length})
        </button>
        <button
          className={`admin-tab ${vistaActiva === 'barberos' ? 'active' : ''}`}
          onClick={() => setVistaActiva('barberos')}
        >
          Barberos ({barberos.length})
        </button>
      </div>

      <div className="dash-container">

        {/* RESERVAS */}
        {vistaActiva === 'reservas' && (
          <section className="dash-section">
            <h2>Todas las <span className="gold">Reservas</span></h2>
            {reservas.length === 0 ? (
              <div className="dash-empty"><p>No hay reservas aún.</p></div>
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
                      <span>✂ {r.barberos?.perfiles?.nombre}</span>
                      <span>📅 {r.fecha}</span>
                      <span>🕐 {r.hora}</span>
                      <span>💰 ${r.servicios?.precio?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SERVICIOS */}
        {vistaActiva === 'servicios' && (
          <section className="dash-section">
            <h2>Gestionar <span className="gold">Servicios</span></h2>
            <div className="admin-grid">
              {servicios.map((s) => (
                <div key={s.id} className="admin-card">
                  <div className="admin-card-info">
                    <h3>{s.nombre}</h3>
                    <p>{s.descripcion}</p>
                    <span className="precio-dash">${s.precio.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => toggleServicio(s.id, s.activo)}
                    className={s.activo ? 'btn-desactivar' : 'btn-activar'}
                  >
                    {s.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BARBEROS */}
        {vistaActiva === 'barberos' && (
          <section className="dash-section">
            <h2>Gestionar <span className="gold">Barberos</span></h2>
            <div className="admin-grid">
              {barberos.map((b) => (
                <div key={b.id} className="admin-card">
                  <div className="admin-card-info">
                    <h3>{b.perfiles?.nombre}</h3>
                    <p>{b.especialidad}</p>
                    <span className={b.activo ? 'estado-activo' : 'estado-inactivo'}>
                      {b.activo ? '● Activo' : '● Inactivo'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleBarbero(b.id, b.activo)}
                    className={b.activo ? 'btn-desactivar' : 'btn-activar'}
                  >
                    {b.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}