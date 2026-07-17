import { useState, useEffect, useRef } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { useNavigate } from "react-router-dom"
import { useFiscalYear } from '../contexts/FiscalYearContext'
import { useAuth } from '../contexts/AuthContext'
import { can } from '../utils/permissions'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Trash2, Edit2, Eye, Banknote, Printer, Search, RefreshCw, Clock, X, CheckCircle, XCircle, AlertCircle, AlertTriangle, RotateCcw } from 'lucide-react'
import { cachedAxiosGet, invalidateCache } from '../utils/apiCache'
import { formatFechaHora } from '../utils/fechaUtils'
import PrintCertificacion from './PrintCertificacion'
import EditCertificacion from './EditCertificacion'

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

const CARD   = 'rgba(255,255,255,0.90)'
const BORDER = 'rgba(46,108,164,0.14)'
const BG     = '#f8fafd'
const ACCENT  = '#2e6ca4'
const GREEN   = '#2ea466'
const RED     = '#a42e2e'
const CYAN    = '#2ea4a1'
const INDIGO  = '#2e31a4'
const PURPLE  = '#662ea4'
const TEXT    = '#1a3a5c'
const MUTED   = '#5a7a9f'

const INPUT_S = {
  padding: '8px 11px',
  background: BG,
  border: '1px solid rgba(46,108,164,0.22)',
  borderRadius: '8px',
  color: TEXT,
  fontSize: '13px',
  fontFamily: 'var(--font-primary)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const estadoMeta = {
  REGISTRADO: { label: 'Registrado', cls: 'badge badge-gold'   },
  APROBADO:   { label: 'Aprobado',   cls: 'badge badge-green'  },
  RECHAZADO:  { label: 'Rechazado',  cls: 'badge badge-red'    },
  LIQUIDADO:  { label: 'Liquidado',  cls: 'badge badge-blue'   },
  ERRADO:     { label: 'Errado',     cls: 'badge badge-orange' },
}

function EstadoBadge({ estado }) {
  const m = estadoMeta[estado] || { label: estado, cls: 'badge' }
  return <span className={m.cls}>{m.label}</span>
}

const parseMonto = (v) => {
  if (!v && v !== 0) return 0
  const s = String(v)
  // Si tiene coma es formato español: "1.000,00" → quitar puntos y cambiar coma
  if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
  // Si no tiene coma es formato numérico/inglés: "10.00" o 10
  return parseFloat(s) || 0
}
const fmtMonto = (v) =>
  parseMonto(v).toLocaleString('es-EC', { style: 'currency', currency: 'USD' })

export default function ListaCertificaciones({ refresh }) {
  const navigate = useNavigate()
  const { selectedCedula, isReadOnly } = useFiscalYear()
  const { user } = useAuth()
  const puedeAprobar   = can.aprobarCertificacion(user)
  const puedeRechazar  = can.rechazarCertificacion(user)
  const isDirector     = puedeAprobar || puedeRechazar
  const puedeAuditoria = can.verAuditoria(user)
  const puedeErrar     = can.marcarErrado(user)
  const puedeEditar    = can.editarCertificacion(user)
  const puedeLiquidar  = can.verLiquidaciones(user)
  const esAnalista     = user?.cargo === 'Analista de presupuesto 1'
  const [certificados, setCertificados] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState("")
  const [page,         setPage]         = useState(1)
  const [total,        setTotal]        = useState(0)
  const [search,       setSearch]       = useState("")
  const [estado,       setEstado]       = useState("")
  const [selectedCert,  setSelectedCert]  = useState(null)
  const [certDetail,    setCertDetail]    = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [printCertId,   setPrintCertId]   = useState(null)
  const [editCertId,    setEditCertId]    = useState(null)
  const [historial,     setHistorial]     = useState({ open: false, cert: null, data: [], loading: false, error: '' })
  const [rechazarModal, setRechazarModal] = useState({ open: false, cert: null, motivo: '', loading: false, error: '' })
  const [errarModal,    setErrarModal]    = useState({ open: false, cert: null, loading: false, error: '' })
  const [aprobarModal,  setAprobarModal]  = useState({ open: false, cert: null, loading: false, error: '' })
  const [reenviarModal, setReenviarModal] = useState({ open: false, cert: null, loading: false, error: '' })

  const limit = 10

  const pollRef     = useRef(null)
  const allCertsRef = useRef([])

  const filterAndPaginate = (s, est, pg) => {
    let items = allCertsRef.current
    if (s) { const q = s.toLowerCase(); items = items.filter(c => c.numero_certificado?.toLowerCase().includes(q) || c.institucion?.toLowerCase().includes(q)) }
    if (est) items = items.filter(c => c.estado === est)
    setTotal(items.length)
    const start = (pg - 1) * limit
    setCertificados(items.slice(start, start + limit))
  }

  useEffect(() => { setPage(1) }, [selectedCedula?.id_cedula_presupuestaria])

  // Carga inicial, refresh o cambio de cédula → fetch al servidor
  useEffect(() => { cargarCertificados(true) }, [refresh, selectedCedula?.id_cedula_presupuestaria])

  // Cambio de página → client-side
  useEffect(() => {
    if (allCertsRef.current.length > 0) filterAndPaginate(search, estado, page)
  }, [page])

  // Búsqueda y estado → filtrado instantáneo client-side
  const searchMounted = useRef(false)
  useEffect(() => {
    if (!searchMounted.current) { searchMounted.current = true; return }
    setPage(1)
    filterAndPaginate(search, estado, 1)
  }, [search, estado])

  // Recarga silenciosa cada 60s solo cuando la pestaña está visible
  useEffect(() => {
    const tick = () => { if (!document.hidden) cargarCertificados(false) }
    const onVisible = () => { if (!document.hidden) cargarCertificados(false) }
    pollRef.current = setInterval(tick, 60000)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(pollRef.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [page, search, estado, selectedCedula?.id_cedula_presupuestaria])


  useEffect(() => {
    if (!selectedCert) { setCertDetail(null); return }
    const fetchDetail = async () => {
      setDetailLoading(true)
      try {
        const token = Cookies.get('auth_token')
        const res = await cachedAxiosGet(`${API_BASE}/certificacion/${selectedCert.id_certificacion}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setCertDetail(res.data.data)
      } catch { /* usa datos del listado como fallback */ }
      finally { setDetailLoading(false) }
    }
    fetchDetail()
  }, [selectedCert?.id_certificacion])

  const cargarCertificados = async (showSkeleton = false, forceRefresh = false) => {
    if (showSkeleton) setLoading(true)
    setError("")
    try {
      const token = Cookies.get("auth_token")
      if (!token) { setError("Sin token de autenticación."); setLoading(false); return }
      if (forceRefresh) invalidateCache('/certificacion')
      const params = { limit: 9999 }
      if (selectedCedula) params.id_cedula_presupuestaria = selectedCedula.id_cedula_presupuestaria
      const res = await cachedAxiosGet(`${API_BASE}/certificacion`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      })
      allCertsRef.current = res.data.data
      filterAndPaginate(search, estado, page)
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar certificados")
    } finally { setLoading(false) }
  }

  const handleHistorial = async (cert) => {
    setHistorial({ open: true, cert, data: [], loading: true, error: '' })
    try {
      const token = Cookies.get('auth_token')
      const res = await axios.get(`${API_BASE}/auditoria/certificacion/${cert.id_certificacion}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHistorial(h => ({ ...h, data: res.data.data, loading: false }))
    } catch {
      setHistorial(h => ({ ...h, loading: false, error: 'Error al cargar el historial.' }))
    }
  }

  const actualizarCertLocal = (id, cambios) => {
    allCertsRef.current = allCertsRef.current.map(c => c.id_certificacion === id ? { ...c, ...cambios } : c)
    setCertificados(prev => prev.map(c => c.id_certificacion === id ? { ...c, ...cambios } : c))
  }

  const refreshCert = async (id) => {
    try {
      const token = Cookies.get('auth_token')
      const res = await axios.get(`${API_BASE}/certificacion/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      const d = res.data.data
      actualizarCertLocal(id, { institucion: d.institucion ?? d.entidad, monto_total: d.monto_total, estado: d.estado })
    } catch { /* silently ignore */ }
  }

  const handleAprobar = (cert) => setAprobarModal({ open: true, cert, loading: false, error: '' })

  const handleConfirmarAprobar = async () => {
    setAprobarModal(m => ({ ...m, loading: true, error: '' }))
    try {
      const token = Cookies.get("auth_token")
      await axios.patch(`${API_BASE}/certificacion/${aprobarModal.cert.id_certificacion}/aprobar`, {}, { headers: { Authorization: `Bearer ${token}` } })
      const certId = aprobarModal.cert.id_certificacion
      setAprobarModal({ open: false, cert: null, loading: false, error: '' })
      actualizarCertLocal(certId, { estado: 'APROBADO' })
      invalidateCache('/certificacion', '/liquidaciones')
    } catch (err) {
      setAprobarModal(m => ({ ...m, loading: false, error: err.response?.data?.message || 'Error al aprobar' }))
    }
  }

  const handleConfirmarRechazo = async () => {
    if (!rechazarModal.motivo.trim()) {
      setRechazarModal(m => ({ ...m, error: 'Debe ingresar el motivo del rechazo.' }))
      return
    }
    setRechazarModal(m => ({ ...m, loading: true, error: '' }))
    try {
      const token = Cookies.get("auth_token")
      await axios.patch(
        `${API_BASE}/certificacion/${rechazarModal.cert.id_certificacion}/rechazar`,
        { motivo: rechazarModal.motivo },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const certId = rechazarModal.cert.id_certificacion
      const motivo = rechazarModal.motivo
      setRechazarModal({ open: false, cert: null, motivo: '', loading: false, error: '' })
      actualizarCertLocal(certId, { estado: 'RECHAZADO', motivo_rechazo: motivo })
      invalidateCache('/certificacion')
    } catch (err) {
      setRechazarModal(m => ({ ...m, loading: false, error: err.response?.data?.message || "Error al rechazar" }))
    }
  }

  const handleReenviar = (cert) => setReenviarModal({ open: true, cert, loading: false, error: '' })

  const handleConfirmarReenviar = async () => {
    setReenviarModal(m => ({ ...m, loading: true, error: '' }))
    try {
      const token = Cookies.get("auth_token")
      await axios.patch(`${API_BASE}/certificacion/${reenviarModal.cert.id_certificacion}/reenviar`, {}, { headers: { Authorization: `Bearer ${token}` } })
      const certId = reenviarModal.cert.id_certificacion
      setReenviarModal({ open: false, cert: null, loading: false, error: '' })
      actualizarCertLocal(certId, { estado: 'REGISTRADO', motivo_rechazo: null })
      invalidateCache('/certificacion')
    } catch (err) {
      setReenviarModal(m => ({ ...m, loading: false, error: err.response?.data?.message || 'Error al reenviar' }))
    }
  }

  const handleErrar = (cert) => {
    setErrarModal({ open: true, cert, loading: false, error: '' })
  }

  const handleConfirmarErrar = async () => {
    setErrarModal(m => ({ ...m, loading: true, error: '' }))
    try {
      const token = Cookies.get("auth_token")
      await axios.patch(`${API_BASE}/certificacion/${errarModal.cert.id_certificacion}/errar`, {}, { headers: { Authorization: `Bearer ${token}` } })
      const certId = errarModal.cert.id_certificacion
      setErrarModal({ open: false, cert: null, loading: false, error: '' })
      actualizarCertLocal(certId, { estado: 'ERRADO' })
      invalidateCache('/certificacion')
    } catch (err) {
      setErrarModal(m => ({ ...m, loading: false, error: err.response?.data?.message || "Error al marcar como errada" }))
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div style={{ fontFamily: 'var(--font-primary)' }}>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.22)', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', color: RED, fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError("")} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer' }}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px', marginBottom: '14px', backdropFilter: 'blur(12px)', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}
      >
        <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: MUTED, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Buscar</label>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
            <input
              type="text" placeholder="Número o institución..." maxLength={150}
              value={search} onChange={(e) => { setSearch(e.target.value.slice(0, 150)); setPage(1) }}
              style={{ ...INPUT_S, paddingLeft: '28px' }}
              onFocus={e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: MUTED, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</label>
          <select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1) }} style={{ ...INPUT_S, cursor: 'pointer' }}
            onFocus={e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }}
          >
            <option value="">Todos</option>
            <option value="REGISTRADO">Registrado</option>
            <option value="APROBADO">Aprobado</option>
            <option value="RECHAZADO">Rechazado</option>
            <option value="LIQUIDADO">Liquidado</option>
            <option value="ERRADO">Errado</option>
          </select>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { setSearch(""); setEstado(""); setPage(1) }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(26,58,92,0.06)', border: '1px solid rgba(26,58,92,0.12)', borderRadius: '8px', color: MUTED, cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-primary)', whiteSpace: 'nowrap', transition: 'all 0.15s ease' }}
        >
          <RefreshCw size={13} /> Limpiar
        </motion.button>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => cargarCertificados(true, true)}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(46,108,164,0.08)', border: '1px solid rgba(46,108,164,0.20)', borderRadius: '8px', color: '#2e6ca4', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'var(--font-primary)', whiteSpace: 'nowrap', transition: 'all 0.15s ease', opacity: loading ? 0.6 : 1 }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refrescar
        </motion.button>

      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '14px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}
      >
        {loading ? (
          <div style={{ padding: '16px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 110px 1fr 100px 90px 90px 100px 80px', gap: '0', borderBottom: i < 5 ? `1px solid ${BORDER}` : 'none', padding: '12px 16px', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: '28px', height: '11px' }} />
                <div className="skeleton" style={{ width: '80px', height: '11px' }} />
                <div className="skeleton" style={{ width: '60%',  height: '11px' }} />
                <div className="skeleton" style={{ width: '70px', height: '11px' }} />
                <div className="skeleton" style={{ width: '65px', height: '11px' }} />
                <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '999px' }} />
                <div className="skeleton" style={{ width: '70px', height: '11px', marginLeft: 'auto' }} />
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  {[0,1,2].map(j => <div key={j} className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />)}
                </div>
              </div>
            ))}
          </div>
        ) : certificados.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: MUTED, fontSize: '13px' }}>
            No hay certificados disponibles
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ueb-table" style={{ minWidth: '700px' }}>
              <thead>
                <tr>
                  {['#', 'Número', 'Unidad Requiriente', 'Usuario', 'Fecha', 'Estado', 'Monto', 'Acciones'].map((h, i) => (
                    <th key={i} style={{ textAlign: i >= 6 ? 'right' : i === 5 ? 'center' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {certificados.map((cert, idx) => (
                  <motion.tr key={cert.id_certificacion}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.22 }}
                  >
                    <td style={{ color: MUTED, fontSize: '12px' }}>{cert.id_certificacion}</td>
                    <td style={{ fontWeight: 700, color: ACCENT }}>
                      {['APROBADO', 'LIQUIDADO'].includes(cert.estado) ? (
                        <button
                          onClick={() => navigate('/dashboard/cedula-presupuestaria', { state: { certId: cert.id_certificacion, numeroCert: cert.numero_certificado } })}
                          title="Ver partidas afectadas en la Cédula Presupuestaria"
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: ACCENT, fontWeight: 700, fontSize: 'inherit', fontFamily: 'inherit', textDecoration: 'underline dotted', textUnderlineOffset: '3px' }}
                        >
                          {cert.numero_certificado}
                        </button>
                      ) : (
                        cert.numero_certificado
                      )}
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cert.institucion}</td>
                    <td style={{ color: MUTED }}>{cert.usuario}</td>
                    <td style={{ color: MUTED, fontSize: '12px', whiteSpace: 'nowrap' }}>{cert.fecha_elaboracion}</td>
                    <td style={{ textAlign: 'center' }}><EstadoBadge estado={cert.estado} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: GREEN, whiteSpace: 'nowrap' }}>{fmtMonto(cert.monto_total)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        {(() => {
                          const esPropio = cert.id_usuario === user?.id_usuario
                          const S = { width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s ease' }
                          const b = (icon, color, bg, bdr, title, action) => ({ icon, color, bg, bdr, title, action, s: { ...S, background: bg, border: `1px solid ${bdr}`, color } })

                          const btnVer      = b(<Eye size={13}/>,              ACCENT,    'rgba(46,108,164,0.10)',  'rgba(46,108,164,0.25)',  'Ver detalles',        () => setSelectedCert(selectedCert?.id_certificacion === cert.id_certificacion ? null : cert))
                          const btnImprimir = b(<Printer size={13}/>,          '#0891b2', 'rgba(8,145,178,0.10)',   'rgba(8,145,178,0.25)',   'Imprimir',            () => setPrintCertId(cert.id_certificacion))
                          const btnLiq      = b(<Banknote size={13}/>,     GREEN,  'rgba(46,164,102,0.10)',  'rgba(46,164,102,0.28)',  'Liquidaciones',          () => navigate('/dashboard/liquidaciones', { state: { id_certificacion: cert.id_certificacion } }))
                          const btnHistorial= b(<Clock size={13}/>,         INDIGO, 'rgba(46,49,164,0.10)',   'rgba(46,49,164,0.28)',   'Historial',              () => handleHistorial(cert))
                          const btnEditar   = b(<Edit2 size={13}/>,         CYAN,   'rgba(46,164,161,0.10)',  'rgba(46,164,161,0.28)',   'Editar',                 () => setEditCertId(cert.id_certificacion))
                          const btnAprobar  = b(<CheckCircle size={13}/>,   GREEN,  'rgba(46,164,102,0.10)',  'rgba(46,164,102,0.30)',   'Aprobar',                () => handleAprobar(cert))
                          const btnRechazar = b(<XCircle size={13}/>,       INDIGO, 'rgba(46,49,164,0.10)',   'rgba(46,49,164,0.30)',    'Rechazar',               () => setRechazarModal({ open: true, cert, motivo: '', loading: false, error: '' }))
                          const btnReenviar = b(<RotateCcw size={13}/>,     CYAN,   'rgba(46,164,161,0.10)',  'rgba(46,164,161,0.30)',   'Reenviar para revisión', () => handleReenviar(cert))
                          const btnErrado   = b(<AlertTriangle size={13}/>, RED,    'rgba(185,28,28,0.10)',   'rgba(185,28,28,0.28)',    'Marcar como Errada',     () => handleErrar(cert))

                          let botones
                          if (isReadOnly) {
                            botones = puedeAuditoria ? [btnVer, btnImprimir, btnHistorial] : [btnVer, btnImprimir]
                          } else if (cert.estado === 'REGISTRADO') {
                            if (puedeAuditoria)  botones = [btnVer, ...(puedeEditar && esPropio ? [btnEditar] : []), ...(puedeAprobar ? [btnAprobar] : []), ...(puedeRechazar ? [btnRechazar] : []), ...(puedeErrar ? [btnErrado] : [])]
                            else if (isDirector) botones = [btnVer, ...(puedeEditar && esPropio ? [btnEditar] : []), ...(puedeAprobar ? [btnAprobar] : []), ...(puedeRechazar ? [btnRechazar] : []), ...(puedeErrar ? [btnErrado] : [])]
                            else if (esPropio)   botones = [btnVer, ...(puedeEditar ? [btnEditar] : []), ...(puedeErrar ? [btnErrado] : [])]
                            else                 botones = [btnVer, ...(puedeErrar ? [btnErrado] : [])]
                          } else if (cert.estado === 'RECHAZADO') {
                            if (puedeAuditoria)  botones = [btnVer, btnHistorial, ...(puedeErrar ? [btnErrado] : [])]
                            else if (isDirector) botones = [btnVer, ...(puedeErrar ? [btnErrado] : [])]
                            else if (esPropio)   botones = [btnVer, ...(puedeEditar ? [btnEditar] : []), btnReenviar]
                            else                 botones = [btnVer, ...(puedeErrar ? [btnErrado] : [])]
                          } else if (cert.estado === 'APROBADO') {
                            if (puedeAuditoria)  botones = [btnVer, btnImprimir, ...(puedeLiquidar ? [btnLiq] : []), btnHistorial, ...(puedeEditar && esPropio ? [btnEditar] : []), ...(puedeErrar ? [btnErrado] : [])]
                            else if (isDirector) botones = [btnVer, btnImprimir, ...(puedeLiquidar ? [btnLiq] : []), ...(puedeEditar && esPropio ? [btnEditar] : []), ...(puedeErrar ? [btnErrado] : [])]
                            else                 botones = esPropio ? [btnVer, btnImprimir, ...(puedeLiquidar ? [btnLiq] : []), ...(puedeEditar ? [btnEditar] : []), ...(puedeErrar ? [btnErrado] : [])] : [btnVer, btnImprimir, ...(puedeLiquidar ? [btnLiq] : []), ...(puedeErrar ? [btnErrado] : [])]
                          } else if (cert.estado === 'LIQUIDADO') {
                            if (puedeAuditoria)  botones = [btnVer, btnImprimir, ...(puedeLiquidar ? [btnLiq] : []), btnHistorial, ...(puedeEditar && esPropio ? [btnEditar] : [])]
                            else if (isDirector) botones = [btnVer, btnImprimir, ...(puedeLiquidar ? [btnLiq] : []), ...(puedeEditar && esPropio ? [btnEditar] : [])]
                            else                 botones = esPropio ? [btnVer, btnImprimir, ...(puedeLiquidar ? [btnLiq] : []), ...(puedeEditar ? [btnEditar] : [])] : [btnVer, btnImprimir, ...(puedeLiquidar ? [btnLiq] : [])]
                          } else {
                            // ERRADO u otros
                            botones = puedeAuditoria ? [btnVer, btnHistorial] : [btnVer]
                          }

                          return botones.map((btn, bi) => (
                            <motion.button key={bi} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.92 }}
                              onClick={btn.action} title={btn.title} style={btn.s}
                            >
                              {btn.icon}
                            </motion.button>
                          ))
                        })()}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal Ver Detalles */}
      <AnimatePresence>
        {selectedCert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedCert(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,55,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
          >
            <motion.div initial={{ scale: 0.88, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}
            >
              {/* Header del modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Eye size={16} color="rgba(255,255,255,0.80)" />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>{selectedCert.numero_certificado}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.60)', marginTop: '2px' }}>{selectedCert.institucion}</div>
                  </div>
                  <EstadoBadge estado={selectedCert.estado} />
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setSelectedCert(null)}
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={15} />
                </motion.button>
              </div>

              {/* Cuerpo scrollable */}
              <div style={{ overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {detailLoading ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: MUTED, fontSize: '13px' }}>Cargando datos…</div>
                ) : (() => {
                  const d = certDetail || {}
                  const campo = (label, value) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <span style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: '13px', color: value ? TEXT : MUTED, fontWeight: value ? 600 : 400, fontStyle: value ? 'normal' : 'italic', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{value || '—'}</span>
                    </div>
                  )
                  return (
                    <>
                      {/* Montos */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                        {[
                          { label: 'Monto Total', value: fmtMonto(selectedCert.monto_total), color: GREEN, bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.22)' },
                          { label: 'Liquidado',   value: fmtMonto(selectedCert.liquidado),   color: GREEN, bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.22)' },
                          { label: 'Pendiente',   value: fmtMonto(selectedCert.pendiente),   color: CYAN,  bg: 'rgba(46,164,161,0.08)', border: 'rgba(46,164,161,0.22)' },
                        ].map(m => (
                          <div key={m.label} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: '10px', padding: '12px 14px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{m.label}</div>
                            <div style={{ fontSize: '17px', fontWeight: 800, color: m.color }}>{m.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Datos principales */}
                      <div style={{ background: '#f8fafd', borderRadius: '12px', padding: '16px', border: '1px solid rgba(46,108,164,0.10)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Datos del Certificado</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', minWidth: 0 }}>
                          {campo('Analista',              selectedCert.usuario)}
                          {campo('Fecha Elaboración',     selectedCert.fecha_elaboracion)}
                          {campo('Clase Registro',        d.clase_registro)}
                          {campo('Clase Gasto',           d.clase_gasto)}
                          {campo('Tipo Doc. Respaldo',    d.tipo_doc_respaldo)}
                          {campo('Clase Doc. Respaldo',   d.clase_doc_respaldo)}
                          {campo('Memorando N°',          d.seccion_memorando)}
                        </div>
                      </div>

                      {/* Ítems */}
                      {d.items && d.items.length > 0 && (
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                            Ítems presupuestarios ({d.items.length})
                          </div>
                          <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(46,108,164,0.12)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                              <thead>
                                <tr style={{ background: 'rgba(46,108,164,0.07)' }}>
                                  {['Cód. Ítem', 'Nombre Ítem', 'Programa', 'Actividad', 'Fuente', 'Monto'].map(h => (
                                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: MUTED, fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid rgba(46,108,164,0.12)' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {d.items.map((it, idx) => (
                                  <tr key={it.id_certificacion_item ?? idx} style={{ borderBottom: '1px solid rgba(46,108,164,0.07)', background: idx % 2 ? 'rgba(46,108,164,0.03)' : 'transparent' }}>
                                    <td style={{ padding: '8px 12px', color: ACCENT, fontWeight: 700, whiteSpace: 'nowrap' }}>{it.item?.cod_item ?? '—'}</td>
                                    <td style={{ padding: '8px 12px', color: TEXT }}>{it.item?.nombre_item ?? '—'}</td>
                                    <td style={{ padding: '8px 12px', color: MUTED, whiteSpace: 'nowrap' }}>{it.programa?.cod_programa?.slice(-3) ?? '—'}</td>
                                    <td style={{ padding: '8px 12px', color: MUTED, whiteSpace: 'nowrap' }}>{it.actividad?.cod_actividad?.slice(-3) ?? '—'}</td>
                                    <td style={{ padding: '8px 12px', color: MUTED, whiteSpace: 'nowrap' }}>{it.fuente?.cod_fuente ?? '—'}</td>
                                    <td style={{ padding: '8px 12px', color: GREEN, fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right' }}>{fmtMonto(it.monto)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Descripción — ancho completo al final */}
                      <div style={{ background: '#f8fafd', borderRadius: '12px', padding: '16px', border: '1px solid rgba(46,108,164,0.10)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Descripción</div>
                        <p style={{ margin: 0, fontSize: '13px', color: d.descripcion ? TEXT : MUTED, fontStyle: d.descripcion ? 'normal' : 'italic', lineHeight: '1.65', wordBreak: 'break-word' }}>
                          {d.descripcion || '—'}
                        </p>
                      </div>

                      {/* Motivo rechazo */}
                      {selectedCert.estado === 'RECHAZADO' && selectedCert.motivo_rechazo && (
                        <div style={{ background: 'rgba(185,28,28,0.06)', border: '1px solid rgba(185,28,28,0.20)', borderRadius: '10px', padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '7px', alignItems: 'center', color: RED, fontWeight: 700, marginBottom: '6px', fontSize: '13px' }}>
                            <XCircle size={13} /> Motivo del rechazo
                          </div>
                          <div style={{ color: TEXT, fontSize: '13px', lineHeight: '1.6' }}>{selectedCert.motivo_rechazo}</div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <PagBtn onClick={() => setPage(1)} disabled={page === 1}>«</PagBtn>
          <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</PagBtn>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
            .reduce((acc, n, idx, arr) => {
              if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...')
              acc.push(n); return acc
            }, [])
            .map((n, i) => n === '...'
              ? <span key={`e${i}`} style={{ padding: '6px 4px', color: MUTED, fontSize: '13px' }}>…</span>
              : <PagBtn key={n} onClick={() => setPage(n)} active={page === n}>{n}</PagBtn>
            )
          }

          <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</PagBtn>
          <PagBtn onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</PagBtn>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {printCertId && <PrintCertificacion certId={printCertId} onClose={() => setPrintCertId(null)} />}
        {editCertId && (
          <EditCertificacion
            certId={editCertId}
            onClose={() => setEditCertId(null)}
            onSaved={() => { const id = editCertId; invalidateCache('/certificacion'); setEditCertId(null); refreshCert(id) }}
          />
        )}
      </AnimatePresence>

      {/* Modal rechazo */}
      <AnimatePresence>
        {rechazarModal.open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,55,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
            onClick={() => !rechazarModal.loading && setRechazarModal(m => ({ ...m, open: false }))}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'linear-gradient(135deg, #0d1035, #2e31a4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <XCircle size={16} color="rgba(255,255,255,0.80)" />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Rechazar Certificación</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.60)', marginTop: '2px' }}>{rechazarModal.cert?.numero_certificado}</div>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setRechazarModal(m => ({ ...m, open: false }))} disabled={rechazarModal.loading}
                  style={{ background: 'rgba(255,255,255,0.10)', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={14} />
                </motion.button>
              </div>
              <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: MUTED, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Motivo del rechazo <span style={{ color: RED }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Indique el motivo del rechazo para que el analista pueda corregir..."
                    value={rechazarModal.motivo}
                    onChange={e => setRechazarModal(m => ({ ...m, motivo: e.target.value, error: '' }))}
                    disabled={rechazarModal.loading}
                    style={{ ...INPUT_S, resize: 'vertical', minHeight: '90px', fontFamily: 'var(--font-primary)' }}
                  />
                </div>
                {rechazarModal.error && (
                  <div style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.22)', borderRadius: '8px', padding: '10px 12px', color: RED, fontSize: '12px', display: 'flex', gap: '7px', alignItems: 'center' }}>
                    <AlertCircle size={13} />{rechazarModal.error}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setRechazarModal(m => ({ ...m, open: false }))} disabled={rechazarModal.loading}
                    style={{ padding: '8px 16px', background: 'rgba(26,58,92,0.06)', border: '1px solid rgba(26,58,92,0.14)', borderRadius: '8px', color: MUTED, cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-primary)' }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmarRechazo} disabled={rechazarModal.loading}
                    style={{ padding: '8px 18px', background: rechazarModal.loading ? 'rgba(46,49,164,0.50)' : INDIGO, border: 'none', borderRadius: '8px', color: '#fff', cursor: rechazarModal.loading ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {rechazarModal.loading ? 'Procesando...' : <><XCircle size={13} /> Rechazar</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal errar */}
      <AnimatePresence>
        {errarModal.open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,55,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
            onClick={() => !errarModal.loading && setErrarModal(m => ({ ...m, open: false }))}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'linear-gradient(135deg, #1a0808, #a42e2e)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={16} color="rgba(255,255,255,0.80)" />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Marcar como Errada</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.60)', marginTop: '2px' }}>{errarModal.cert?.numero_certificado}</div>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.1 }}
                  onClick={() => !errarModal.loading && setErrarModal(m => ({ ...m, open: false }))}
                  disabled={errarModal.loading}
                  style={{ background: 'rgba(255,255,255,0.10)', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={14} />
                </motion.button>
              </div>

              {/* Body */}
              <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Advertencia */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(185,28,28,0.07)', border: '1px solid rgba(185,28,28,0.25)', borderRadius: '12px', padding: '14px 16px' }}>
                  <AlertCircle size={18} color={RED} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: RED, marginBottom: '4px' }}>Acción irreversible</div>
                    <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.6 }}>
                      La certificación <strong style={{ color: TEXT }}>{errarModal.cert?.numero_certificado}</strong> quedará marcada como <strong style={{ color: RED }}>ERRADA</strong> y no podrá ser modificada nuevamente.
                    </div>
                  </div>
                </div>

                {errarModal.error && (
                  <div style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.22)', borderRadius: '8px', padding: '10px 12px', color: RED, fontSize: '12px', display: 'flex', gap: '7px', alignItems: 'center' }}>
                    <AlertCircle size={13} />{errarModal.error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setErrarModal(m => ({ ...m, open: false }))} disabled={errarModal.loading}
                    style={{ padding: '8px 16px', background: 'rgba(26,58,92,0.06)', border: '1px solid rgba(26,58,92,0.14)', borderRadius: '8px', color: MUTED, cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-primary)' }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmarErrar} disabled={errarModal.loading}
                    style={{ padding: '8px 18px', background: errarModal.loading ? 'rgba(185,28,28,0.50)' : RED, border: 'none', borderRadius: '8px', color: '#fff', cursor: errarModal.loading ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {errarModal.loading ? 'Procesando...' : <><AlertTriangle size={13} /> Confirmar</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal aprobar */}
      <AnimatePresence>
        {aprobarModal.open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,55,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
            onClick={() => !aprobarModal.loading && setAprobarModal(m => ({ ...m, open: false }))}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'linear-gradient(135deg, #1a6b3e, #2ea466)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={16} color="rgba(255,255,255,0.85)" />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Aprobar Certificación</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>{aprobarModal.cert?.numero_certificado}</div>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => !aprobarModal.loading && setAprobarModal(m => ({ ...m, open: false }))} disabled={aprobarModal.loading}
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={14} />
                </motion.button>
              </div>
              <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(46,164,102,0.08)', border: '1px solid rgba(46,164,102,0.25)', borderRadius: '12px', padding: '14px 16px' }}>
                  <CheckCircle size={18} color={GREEN} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: GREEN, marginBottom: '4px' }}>Confirmar aprobación</div>
                    <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.6 }}>
                      La certificación <strong style={{ color: TEXT }}>{aprobarModal.cert?.numero_certificado}</strong> pasará a estado <strong style={{ color: GREEN }}>APROBADO</strong> y se reservará el presupuesto correspondiente.
                    </div>
                  </div>
                </div>
                {aprobarModal.error && (
                  <div style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.22)', borderRadius: '8px', padding: '10px 12px', color: RED, fontSize: '12px', display: 'flex', gap: '7px', alignItems: 'center' }}>
                    <AlertCircle size={13} />{aprobarModal.error}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setAprobarModal(m => ({ ...m, open: false }))} disabled={aprobarModal.loading}
                    style={{ padding: '8px 16px', background: 'rgba(26,58,92,0.06)', border: '1px solid rgba(26,58,92,0.14)', borderRadius: '8px', color: MUTED, cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-primary)' }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmarAprobar} disabled={aprobarModal.loading}
                    style={{ padding: '8px 18px', background: aprobarModal.loading ? 'rgba(46,164,102,0.50)' : GREEN, border: 'none', borderRadius: '8px', color: '#fff', cursor: aprobarModal.loading ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {aprobarModal.loading ? 'Aprobando...' : <><CheckCircle size={13} /> Aprobar</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal reenviar */}
      <AnimatePresence>
        {reenviarModal.open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,55,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
            onClick={() => !reenviarModal.loading && setReenviarModal(m => ({ ...m, open: false }))}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'linear-gradient(135deg, #7c4a00, #d97706)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RotateCcw size={16} color="rgba(255,255,255,0.85)" />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Reenviar a Revisión</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>{reenviarModal.cert?.numero_certificado}</div>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => !reenviarModal.loading && setReenviarModal(m => ({ ...m, open: false }))} disabled={reenviarModal.loading}
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={14} />
                </motion.button>
              </div>
              <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: '12px', padding: '14px 16px' }}>
                  <RotateCcw size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#d97706', marginBottom: '4px' }}>Confirmar reenvío</div>
                    <div style={{ fontSize: '12px', color: MUTED, lineHeight: 1.6 }}>
                      La certificación <strong style={{ color: TEXT }}>{reenviarModal.cert?.numero_certificado}</strong> volverá a estado <strong style={{ color: '#d97706' }}>REGISTRADO</strong> para que pueda ser corregida y reenviada al director.
                    </div>
                  </div>
                </div>
                {reenviarModal.error && (
                  <div style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.22)', borderRadius: '8px', padding: '10px 12px', color: RED, fontSize: '12px', display: 'flex', gap: '7px', alignItems: 'center' }}>
                    <AlertCircle size={13} />{reenviarModal.error}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setReenviarModal(m => ({ ...m, open: false }))} disabled={reenviarModal.loading}
                    style={{ padding: '8px 16px', background: 'rgba(26,58,92,0.06)', border: '1px solid rgba(26,58,92,0.14)', borderRadius: '8px', color: MUTED, cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-primary)' }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmarReenviar} disabled={reenviarModal.loading}
                    style={{ padding: '8px 18px', background: reenviarModal.loading ? 'rgba(217,119,6,0.50)' : '#d97706', border: 'none', borderRadius: '8px', color: '#fff', cursor: reenviarModal.loading ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {reenviarModal.loading ? 'Reenviando...' : <><RotateCcw size={13} /> Reenviar</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Historial modal */}
      <AnimatePresence>
        {historial.open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,55,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '40px 16px' }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '620px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'linear-gradient(135deg, #0d1f35, #1a3a5c)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={16} color="#54b3e0" />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Historial de Auditoría</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.60)', marginTop: '2px' }}>{historial.cert?.numero_certificado}</div>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setHistorial(h => ({ ...h, open: false }))}
                  style={{ background: 'rgba(255,255,255,0.10)', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={14} />
                </motion.button>
              </div>

              {/* Body */}
              <div style={{ padding: '22px' }}>
                {historial.loading ? (
                  <div style={{ textAlign: 'center', color: MUTED, padding: '30px', fontSize: '13px' }}>Cargando historial...</div>
                ) : historial.error ? (
                  <div style={{ color: RED, fontSize: '13px', padding: '10px' }}>{historial.error}</div>
                ) : historial.data.length === 0 ? (
                  <div style={{ textAlign: 'center', color: MUTED, padding: '30px', fontSize: '13px' }}>
                    No hay registros de auditoría para este certificado.
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '8px', bottom: '8px', width: '2px', background: 'linear-gradient(to bottom, rgba(46,108,164,0.25), transparent)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                      {historial.data.map((r, i) => {
                        const meta = {
                          'CREACIÓN':      { color: GREEN,   label: 'Creación',         icon: '✦' },
                          'CAMBIO_ESTADO': { color: ACCENT,  label: 'Cambio de Estado', icon: '⇄' },
                          'EDICIÓN':       { color: CYAN,    label: 'Edición',          icon: '✎' },
                          'ELIMINACIÓN':   { color: RED,     label: 'Eliminación',      icon: '✕' },
                        }[r.accion] || { color: MUTED, label: r.accion, icon: '•' }

                        return (
                          <motion.div key={r.id_auditoria} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            style={{ display: 'flex', gap: '14px', paddingBottom: i < historial.data.length - 1 ? '20px' : '0' }}
                          >
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: `${meta.color}15`, border: `2px solid ${meta.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: meta.color, fontWeight: 700, zIndex: 1 }}>
                              {meta.icon}
                            </div>
                            <div style={{ flex: 1, paddingTop: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: meta.color }}>{meta.label}</span>
                                <span style={{ fontSize: '11px', color: MUTED, whiteSpace: 'nowrap' }}>{formatFechaHora(r.fecha_hora)}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: MUTED, marginBottom: '4px' }}>
                                Usuario: <span style={{ color: TEXT, fontWeight: 600 }}>{r.nombre_usuario}</span>
                              </div>
                              {r.accion === 'CAMBIO_ESTADO' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                  <span style={{ background: '#f8fafd', border: '1px solid rgba(46,108,164,0.14)', borderRadius: '4px', padding: '2px 7px', color: TEXT }}>{r.estado_anterior}</span>
                                  <span style={{ color: MUTED }}>→</span>
                                  <span style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}40`, borderRadius: '4px', padding: '2px 7px', color: meta.color, fontWeight: 700 }}>{r.estado_nuevo}</span>
                                </div>
                              )}
                              {r.accion === 'CREACIÓN' && r.estado_nuevo && (
                                <div style={{ fontSize: '12px', color: MUTED }}>
                                  Estado inicial: <span style={{ color: GREEN, fontWeight: 700 }}>{r.estado_nuevo}</span>
                                </div>
                              )}
                              {r.motivo && (
                                <div style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>
                                  Motivo: <span style={{ color: TEXT }}>{r.motivo}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick} disabled={disabled}
      style={{
        minWidth: '32px', height: '32px', padding: '0 8px',
        background: active ? ACCENT : 'rgba(255,255,255,0.90)',
        color: active ? '#fff' : disabled ? MUTED : TEXT,
        border: active ? `1px solid ${ACCENT}` : '1px solid rgba(46,108,164,0.14)',
        borderRadius: '8px', cursor: disabled ? 'default' : 'pointer',
        fontSize: '13px', fontWeight: active ? 700 : 400,
        fontFamily: 'var(--font-primary)', opacity: disabled ? 0.45 : 1,
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </motion.button>
  )
}
