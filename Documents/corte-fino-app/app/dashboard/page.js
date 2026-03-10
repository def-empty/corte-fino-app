'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [perfil, setPerfil] = useState(null)
  const [servicios, setServicios] = useState([])
  const [reservas, setReservas] = useState([])
  const [barberos, setBarberos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null)
  const [barberoSeleccionado, setBarberoSeleccionado] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [loadingReserva, setLoadingReserva] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')

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
      setPerfil(perfilData)

      const { data: serviciosData } = await supabase
        .from('servicios')
        .select('*')
        .eq('activo', true)
      setServicios(serviciosData || [])

      const { data: barberosData } = await supabase
        .from('barberos')
        .select('*, perfiles(nombre)')
        .eq('activo', true)
      setBarberos(barberosData || [])

      const { data: reservasData } = await supabase
        .from('reservas')
        .select('*, servicios(nombre, precio), barberos(id, perfiles(nombre))')
        .eq('cliente_id', user.id)
        .order('fecha', { ascending: true })
      setReservas(reservasData || [])
      setLoading(false)
    }

    cargarDatos()
  }, [router])

  const horasDisponibles = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ]

  const abrirModal = (servicio) => {
    setServicioSeleccionado(servicio)
    setModalAbierto(true)
    setFecha('')
    setHora('')
    setBarberoSeleccionado('')
    setMensajeExito('')
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setServicioSeleccionado(null)
  }

  const confirmarReserva = async () => {
    if (!fecha || !hora || !barberoSeleccionado) {
      alert('Por favor completa todos los campos')
      return
    }

    setLoadingReserva(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('reservas').insert({
      cliente_id: user.id,
      barbero_id: barberoSeleccionado,
      servicio_id: servicioSeleccionado.id,
      fecha,
      hora,
      estado: 'pendiente'
    })

    if (error) {
      alert('Error al crear la reserva')
      setLoadingReserva(false)
      return
    }

    const { data: reservasData } = await supabase
      .from('reservas')
      .select('*, servicios(nombre, precio), barberos(id, perfiles(nombre))')
      .eq('cliente_id', user.id)
      .order('fecha', { ascending: true })

    setReservas(reservasData || [])
    setLoadingReserva(false)
    setMensajeExito('¡Reserva creada! Te confirmaremos pronto. ✅')
    setFecha('')
    setHora('')
    setBarberoSeleccionado('')
  }

  const cancelarReserva = async (reservaId) => {
    const confirmar = window.confirm('¿Estás segura que deseas cancelar esta reserva?')
    if (!confirmar) return

    const { error } = await supabase
      .from('reservas')
      .update({ estado: 'cancelada' })
      .eq('id', reservaId)

    if (error) {
      alert('Error al cancelar la reserva')
      return
    }

    setReservas(prev => prev.map(r =>
      r.id === reservaId ? { ...r, estado: 'cancelada' } : r
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
          <span>Hola, {perfil?.nombre} 👋</span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="dash-container">
        <section className="dash-section">
          <h2>Mis <span className="gold">Reservas</span></h2>
          {reservas.length === 0 ? (
            <div className="dash-empty">
              <p>No tienes reservas aún.</p>
              <p>¡Agenda tu primer turno abajo! 👇</p>
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
                    <span>✂ {r.barberos?.perfiles?.nombre}</span>
                    <span>📅 {r.fecha}</span>
                    <span>🕐 {r.hora}</span>
                    <span>💰 ${r.servicios?.precio?.toLocaleString()}</span>
                  </div>
                  {r.estado === 'pendiente' && (
                    <button
                      onClick={() => cancelarReserva(r.id)}
                      className="btn-cancelar"
                    >
                      Cancelar reserva
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dash-section">
          <h2>Agendar <span className="gold">Turno</span></h2>
          <div className="servicios-grid-dash">
            {servicios.map((s) => (
              <div key={s.id} className="servicio-dash-card">
                <h3>{s.nombre}</h3>
                <p>{s.descripcion}</p>
                <div className="servicio-dash-footer">
                  <span className="precio-dash">${s.precio.toLocaleString()}</span>
                  <span className="duracion-dash">⏱ {s.duracion} min</span>
                </div>
                <button
                  className="btn-agendar"
                  onClick={() => abrirModal(s)}
                >
                  Agendar
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{servicioSeleccionado?.nombre}</h3>
              <button onClick={cerrarModal} className="modal-close">✕</button>
            </div>

            <div className="modal-precio">
              <span>${servicioSeleccionado?.precio?.toLocaleString()}</span>
              <span>⏱ {servicioSeleccionado?.duracion} min</span>
            </div>

            {mensajeExito ? (
              <div className="modal-exito">
                <p>{mensajeExito}</p>
                <button onClick={cerrarModal} className="btn-auth" style={{ marginTop: '20px' }}>
                  Cerrar
                </button>
              </div>
            ) : (
              <div className="modal-form">
                <div className="form-group">
                  <label>Barbero</label>
                  <select
                    value={barberoSeleccionado}
                    onChange={(e) => setBarberoSeleccionado(e.target.value)}
                    className="select-hora"
                  >
                    <option value="">Selecciona un barbero</option>
                    {barberos.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.perfiles?.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Hora</label>
                  <select
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="select-hora"
                  >
                    <option value="">Selecciona una hora</option>
                    {horasDisponibles.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={confirmarReserva}
                  disabled={loadingReserva}
                  className="btn-auth"
                >
                  {loadingReserva ? 'Agendando...' : 'Confirmar reserva'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}