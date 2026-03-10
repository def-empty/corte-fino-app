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
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [vistaActiva, setVistaActiva] = useState('reservas')

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: perfilData } = await supabase
        .from('perfiles').select('*').eq('id', user.id).single()

      if (perfilData?.rol !== 'admin') { router.push('/dashboard'); return }
      setPerfil(perfilData)

      const { data: reservasData } = await supabase
        .from('reservas')
        .select('*, servicios(nombre, precio), perfiles(nombre, telefono), barberos(id, perfiles(nombre))')
        .order('fecha', { ascending: true })
      setReservas(reservasData || [])

      const { data: serviciosData } = await supabase.from('servicios').select('*')
      setServicios(serviciosData || [])

      const { data: barberosData } = await supabase
        .from('barberos').select('*, perfiles(nombre, telefono)')
      setBarberos(barberosData || [])

      const { data: usuariosData } = await supabase
        .from('perfiles').select('*').order('nombre')
      setUsuarios(usuariosData || [])

      setLoading(false)
    }
    cargarDatos()
  }, [router])

  const recargarTodo = async () => {
    const { data: reservasData } = await supabase
      .from('reservas')
      .select('*, servicios(nombre, precio), perfiles(nombre, telefono), barberos(id, perfiles(nombre))')
      .order('fecha', { ascending: true })
    setReservas(reservasData || [])

    const { data: serviciosData } = await supabase.from('servicios').select('*')
    setServicios(serviciosData || [])

    const { data: barberosData } = await supabase
      .from('barberos').select('*, perfiles(nombre, telefono)')
    setBarberos(barberosData || [])

    const { data: usuariosData } = await supabase
      .from('perfiles').select('*').order('nombre')
    setUsuarios(usuariosData || [])
  }

  const toggleServicio = async (id, activo) => {
    await supabase.from('servicios').update({ activo: !activo }).eq('id', id)
    setServicios(prev => prev.map(s => s.id === id ? { ...s, activo: !activo } : s))
  }

  const toggleBarbero = async (id, activo) => {
    await supabase.from('barberos').update({ activo: !activo }).eq('id', id)
    setBarberos(prev => prev.map(b => b.id === id ? { ...b, activo: !activo } : b))
  }

  const eliminarBarbero = async (barberoId, perfilId) => {
    const confirmar = window.confirm('¿Eliminar este barbero? Esta acción no se puede deshacer.')
    if (!confirmar) return
    await supabase.from('barberos').delete().eq('id', barberoId)
    await supabase.from('perfiles').update({ rol: 'cliente' }).eq('id', perfilId)
    await recargarTodo()
  }

  const promoverABarbero = async (usuario) => {
    const especialidad = prompt(`Especialidad de ${usuario.nombre}:`, 'Corte clásico y degradados')
    if (!especialidad) return

    // Cambiar rol
    await supabase.from('perfiles')
      .update({ rol: 'barbero' })
      .eq('id', usuario.id)

    // Crear entrada en barberos
    await supabase.from('barberos').insert({
      perfil_id: usuario.id,
      especialidad,
      activo: true
    })

    await recargarTodo()
  }

  const degradarACliente = async (perfilId) => {
    const confirmar = window.confirm('¿Quitar rol de barbero a este usuario?')
    if (!confirmar) return

    await supabase.from('barberos').delete().eq('perfil_id', perfilId)
    await supabase.from('perfiles').update({ rol: 'cliente' }).eq('id', perfilId)
    await recargarTodo()
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
          <button onClick={handleLogout} className="btn-logout">Cerrar sesión</button>
        </div>
      </nav>

      <div className="admin-tabs">
        <button className={`admin-tab ${vistaActiva === 'reservas' ? 'active' : ''}`} onClick={() => setVistaActiva('reservas')}>
          Reservas ({reservas.length})
        </button>
        <button className={`admin-tab ${vistaActiva === 'servicios' ? 'active' : ''}`} onClick={() => setVistaActiva('servicios')}>
          Servicios ({servicios.length})
        </button>
        <button className={`admin-tab ${vistaActiva === 'barberos' ? 'active' : ''}`} onClick={() => setVistaActiva('barberos')}>
          Barberos ({barberos.length})
        </button>
        <button className={`admin-tab ${vistaActiva === 'usuarios' ? 'active' : ''}`} onClick={() => setVistaActiva('usuarios')}>
          Usuarios ({usuarios.length})
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
                    <p style={{fontSize: '0.8rem', color: '#666'}}>{b.perfiles?.telefono}</p>
                    <span className={b.activo ? 'estado-activo' : 'estado-inactivo'}>
                      {b.activo ? '● Activo' : '● Inactivo'}
                    </span>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    <button
                      onClick={() => toggleBarbero(b.id, b.activo)}
                      className={b.activo ? 'btn-desactivar' : 'btn-activar'}
                    >
                      {b.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => degradarACliente(b.perfiles?.id)}
                      className="btn-eliminar"
                    >
                      Quitar rol
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* USUARIOS */}
        {vistaActiva === 'usuarios' && (
          <section className="dash-section">
            <h2>Gestionar <span className="gold">Usuarios</span></h2>
            <div className="admin-grid">
              {usuarios.map((u) => (
                <div key={u.id} className="admin-card">
                  <div className="admin-card-info">
                    <h3>{u.nombre}</h3>
                    <p style={{fontSize: '0.8rem', color: '#888'}}>{u.telefono}</p>
                    <span className={`rol-badge rol-${u.rol}`}>{u.rol}</span>
                  </div>
                  {u.rol === 'cliente' && (
                    <button
                      onClick={() => promoverABarbero(u)}
                      className="btn-activar"
                    >
                      Hacer barbero
                    </button>
                  )}
                  {u.rol === 'barbero' && (
                    <button
                      onClick={() => degradarACliente(u.id)}
                      className="btn-desactivar"
                    >
                      Quitar rol
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}