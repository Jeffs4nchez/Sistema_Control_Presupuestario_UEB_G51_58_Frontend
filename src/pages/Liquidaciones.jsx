import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Cookies from 'js-cookie'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ChevronDown, Plus, Trash2,
  Banknote, X, RefreshCw, FileText, Ban, AlertCircle, CheckCircle, Lock, History,
} from 'lucide-react'
import { useFiscalYear } from '../contexts/FiscalYearContext'
import { useAuth } from '../contexts/AuthContext'
import { can } from '../utils/permissions'
import { cachedFetch, invalidateCache } from '../utils/apiCache'
import ConfirmModal from '../components/ConfirmModal'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const CARD   = 'rgba(255,255,255,0.90)'
const BORDER = 'rgba(46,108,164,0.14)'
const BG     = '#f8fafd'
const ACCENT  = '#2e6ca4'
const GREEN   = '#2ea466'
const CYAN    = '#2ea4a1'
const INDIGO  = '#2e31a4'
const RED     = '#a42e2e'
const TEXT    = '#1a3a5c'
const MUTED   = '#5a7a9f'

const INPUT_S = {
  padding: '8px 11px', background: BG,
  border: '1px solid rgba(46,108,164,0.22)',
  borderRadius: '8px', color: TEXT, fontSize: '13px',
  fontFamily: 'var(--font-primary)', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

const LABEL_S = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  color: MUTED, marginBottom: '5px',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

function fmt(v) {
  const s = String(v ?? 0)
  const n = s.includes(',')
    ? parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
    : parseFloat(s) || 0
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}

function today() { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' }) }

function MiniBar({ monto, liquidado }) {
  const pct   = monto > 0 ? Math.min(100, (liquidado / monto) * 100) : 0
  const color = pct >= 100 ? INDIGO : pct >= 75 ? CYAN : GREEN
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '90px' }}>
      <div style={{ flex: 1, height: '5px', background: 'rgba(46,108,164,0.12)', borderRadius: '3px', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: '3px' }}
        />
      </div>
      <span style={{ fontSize: '10px', color, fontWeight: 700, minWidth: '28px', textAlign: 'right' }}>{pct.toFixed(0)}%</span>
    </div>
  )
}

function StatusDot({ pendiente }) {
  const color = pendiente > 0 ? CYAN : GREEN
  const label = pendiente > 0 ? 'Con saldo' : 'Liquidado'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color, fontWeight: 600 }}>
      <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }}
        style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}66` }}
      />
      {label}
    </span>
  )
}

function SkeletonLiqCerts() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(46,108,164,0.14)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="skeleton" style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0 }} />
            <div className="skeleton" style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: '90px', height: '14px', borderRadius: '6px' }} />
                <div className="skeleton" style={{ width: '70px', height: '12px', borderRadius: '6px' }} />
                <div className="skeleton" style={{ width: '50px', height: '18px', borderRadius: '999px' }} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="skeleton" style={{ width: '100px', height: '12px', borderRadius: '6px' }} />
                <div className="skeleton" style={{ width: '100px', height: '12px', borderRadius: '6px' }} />
                <div className="skeleton" style={{ width: '100px', height: '12px', borderRadius: '6px' }} />
              </div>
            </div>
            <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '6px', flexShrink: 0 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Liquidaciones() {
  const { selectedCedula, isReadOnly } = useFiscalYear()
  const { user } = useAuth()
  const puedeAnular = can.anularLiquidacion(user)
  const location = useLocation()
  const autoOpenId  = useRef(location.state?.id_certificacion ?? null)
  const allCertsRef = useRef([])
  const searchValRef = useRef('')

  const [certs,       setCerts]       = useState([])
  const [loading,     setLoading]     = useState(false)
  const [search,      setSearch]      = useState('')
  const [expanded,    setExpanded]    = useState({})
  const [selected,    setSelected]    = useState(null)
  const [liqs,        setLiqs]        = useState([])
  const [resumen,     setResumen]     = useState(null)
  const [loadingLiq,  setLoadingLiq]  = useState(false)
  const [form,        setForm]        = useState({ monto: '', fecha: today(), memorando: '' })
  const [saving,      setSaving]      = useState(false)
  const [formError,   setFormError]   = useState('')
  const [formOk,      setFormOk]      = useState('')
  const [anularModal, setAnularModal] = useState({ open: false, id: null, motivo: '', saving: false, error: '' })
  const [confirmDlg,  setConfirmDlg]  = useState({ open: false, id: null })

  const filterClientSide = (q, source) => {
    const data = source ?? allCertsRef.current
    if (!q.trim()) {
      setCerts(data)
      if (data.length === 1) { const ex = {}; data.forEach(c => { ex[c.id_certificacion] = true }); setExpanded(ex) }
      return
    }
    const s = q.trim().toLowerCase()
    const filtered = data.filter(cert =>
      cert.numero_certificado?.toLowerCase().includes(s) ||
      cert.items?.some(i => i.cod_item?.toLowerCase().includes(s) || i.nombre_item?.toLowerCase().includes(s))
    )
    setCerts(filtered)
    if (filtered.length > 0) { const ex = {}; filtered.forEach(c => { ex[c.id_certificacion] = true }); setExpanded(ex) }
  }

  const fetchCerts = useCallback(async () => {
    setLoading(true)
    try {
      const token  = Cookies.get('auth_token')
      const params = new URLSearchParams()
      if (selectedCedula) params.set('id_cedula_presupuestaria', selectedCedula.id_cedula_presupuestaria)
      const res  = await fetch(`${API}/liquidaciones/certificaciones?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) {
        allCertsRef.current = json.data
        filterClientSide(searchValRef.current, json.data)
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [selectedCedula])

  useEffect(() => { setSelected(null); fetchCerts() }, [selectedCedula?.id_cedula_presupuestaria])

  // Mantener ref de search actualizada para fetchCerts (useCallback no recibe search)
  useEffect(() => { searchValRef.current = search }, [search])

  // Filtrado instantáneo en el cliente
  const searchMounted = useRef(false)
  useEffect(() => {
    if (!searchMounted.current) { searchMounted.current = true; return }
    filterClientSide(search)
  }, [search])

  // Auto-abrir certificado llegado desde ListaCertificaciones
  useEffect(() => {
    const targetId = autoOpenId.current
    if (!targetId || certs.length === 0) return
    const cert = certs.find(c => c.id_certificacion === targetId)
    if (!cert) return
    autoOpenId.current = null
    setExpanded(prev => ({ ...prev, [targetId]: true }))
    if (cert.items?.length === 1) {
      handleSelectItem(cert.items[0])
    }
    setTimeout(() => {
      const el = document.getElementById(`cert-card-${targetId}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [certs])

  const toggleCert = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const handleSelectItem = (item) => {
    setSelected(item); setForm({ monto: '', fecha: today(), memorando: '' })
    setFormError(''); setFormOk(''); fetchLiqs(item)
  }

  const fetchLiqs = async (item) => {
    setLoadingLiq(true); setLiqs([]); setResumen(null)
    try {
      const token = Cookies.get('auth_token')
      const res = await cachedFetch(`${API}/liquidaciones?id_certificacion_item=${item.id_certificacion_item}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) { setLiqs(json.data); setResumen(json.resumen) }
    } catch { /* silent */ }
    finally { setLoadingLiq(false) }
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setFormError(''); setFormOk('')
    if (!form.monto || parseFloat(form.monto.toString().replace(',', '.')) <= 0) { setFormError('Ingrese un monto válido mayor a 0.'); return }
    setSaving(true)
    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${API}/liquidaciones`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_certificacion_item: selected.id_certificacion_item, cantidad_liquidacion: parseFloat(form.monto.toString().replace(',', '.')), fecha_creacion: form.fecha, memorando: form.memorando }),
      })
      const json = await res.json()
      if (json.success) {
        setFormOk('Liquidación registrada correctamente.')
        setForm({ monto: '', fecha: today(), memorando: '' })
        invalidateCache('/liquidaciones')
        fetchLiqs(selected); fetchCerts()
      } else { setFormError(json.message || 'Error al registrar.') }
    } catch { setFormError('Error de conexión.') }
    finally { setSaving(false) }
  }

  // eslint-disable-next-line no-unused-vars
  const handleDelete = (id) => {
    setConfirmDlg({ open: true, id })
  }

  const handleConfirmDelete = async () => {
    const id = confirmDlg.id
    setConfirmDlg({ open: false, id: null })
    try {
      const token = Cookies.get('auth_token')
      await fetch(`${API}/liquidaciones/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      invalidateCache('/liquidaciones')
      fetchLiqs(selected); fetchCerts()
    } catch { /* silent */ }
  }

  const handleAnular = async () => {
    if (!anularModal.motivo.trim()) { setAnularModal(m => ({ ...m, error: 'Debe ingresar el motivo de anulación.' })); return }
    setAnularModal(m => ({ ...m, saving: true, error: '' }))
    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${API}/liquidaciones/${anularModal.id}/anular`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo_anulacion: anularModal.motivo }),
      })
      const json = await res.json()
      if (json.success) {
        setAnularModal({ open: false, id: null, motivo: '', saving: false, error: '' })
        invalidateCache('/liquidaciones')
        fetchLiqs(selected); fetchCerts()
      } else { setAnularModal(m => ({ ...m, saving: false, error: json.message || 'Error al anular.' })) }
    } catch { setAnularModal(m => ({ ...m, saving: false, error: 'Error de conexión.' })) }
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--page-bg)', fontFamily: 'var(--font-primary)' }}>

      <ConfirmModal
        open={confirmDlg.open}
        title="Eliminar liquidación"
        message="¿Está seguro de que desea eliminar esta liquidación? Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDlg({ open: false, id: null })}
      />

      {/* Page header */}
      <div style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(26,58,92,0.08)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)', padding: '20px 28px', marginBottom: '24px' }}>
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(46,164,102,0.12)', border: '1px solid rgba(46,164,102,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Banknote size={18} color={GREEN} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>Liquidaciones</h1>
            <p style={{ margin: 0, fontSize: '12px', color: MUTED }}>
              {isReadOnly
                ? `Año fiscal ${selectedCedula?.anio} — Solo visualización`
                : 'Registra lo que efectivamente se pagó de cada ítem certificado.'}
            </p>
          </div>
          {isReadOnly && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: 'rgba(46,164,161,0.08)', border: '1px solid rgba(46,164,161,0.25)',
              borderRadius: '10px', padding: '7px 14px',
              fontSize: '12px', fontWeight: 700, color: CYAN,
            }}>
              <Lock size={13} />
              Año {selectedCedula?.anio} — Solo lectura
            </div>
          )}
        </motion.div>
      </div>

      {/* Lista de certificaciones — siempre ancho completo */}
      <div style={{ padding: '0 28px 28px' }}>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px', marginBottom: '14px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}
        >
          <form onSubmit={e => { e.preventDefault(); filterClientSide(search) }} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={LABEL_S}>Buscar certificación o ítem</label>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value.slice(0, 150))} placeholder="N° certificación, código ítem o nombre..." maxLength={150}
                  style={{ ...INPUT_S, paddingLeft: '28px' }}
                  onFocus={e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
              style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', whiteSpace: 'nowrap', boxShadow: '0 3px 12px rgba(26,58,92,0.20)' }}
            >
              Buscar
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={() => { setSearch(''); filterClientSide('') }}
              style={{ padding: '8px 12px', background: 'rgba(26,58,92,0.06)', color: MUTED, border: '1px solid rgba(26,58,92,0.12)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <RefreshCw size={13} />
            </motion.button>
          </form>
          {!loading && <div style={{ marginTop: '8px', fontSize: '12px', color: MUTED }}>{certs.length} certificación(es) con ítems certificados</div>}
        </motion.div>

        {/* Certs list */}
        {loading ? (
          <SkeletonLiqCerts />
        ) : certs.length === 0 ? (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '48px', textAlign: 'center', color: MUTED, fontSize: '13px', backdropFilter: 'blur(12px)' }}>
            No hay certificaciones con ítems liquidables.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {certs.map((cert, ci) => {
              const isOpen = !!expanded[cert.id_certificacion]
              return (
                <motion.div key={cert.id_certificacion}
                  id={`cert-card-${cert.id_certificacion}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.04, duration: 0.22 }}
                  style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}
                >
                  <button onClick={() => toggleCert(cert.id_certificacion)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-primary)', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(46,108,164,0.04)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <motion.span animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.2 }} style={{ color: MUTED, flexShrink: 0, display: 'flex' }}>
                      <ChevronDown size={16} />
                    </motion.span>
                    <span style={{ color: ACCENT, flexShrink: 0, display: 'flex' }}><FileText size={16} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>{cert.numero_certificado}</span>
                        <span style={{ fontSize: '11px', color: MUTED }}>{cert.fecha_elaboracion}</span>
                        <span style={{ fontSize: '11px', background: 'rgba(46,108,164,0.08)', border: '1px solid rgba(46,108,164,0.15)', borderRadius: '999px', padding: '1px 7px', color: ACCENT }}>
                          {cert.items_count} ítem{cert.items_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '5px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: MUTED }}>Cert: <span style={{ color: TEXT, fontWeight: 600 }}>{fmt(cert.total_monto)}</span></span>
                        <span style={{ fontSize: '12px', color: MUTED }}>Liq: <span style={{ color: GREEN, fontWeight: 600 }}>{fmt(cert.total_liquidado)}</span></span>
                        <span style={{ fontSize: '12px', color: MUTED }}>Disp: <span style={{ color: cert.total_pendiente > 0 ? CYAN : MUTED, fontWeight: 600 }}>{fmt(cert.total_pendiente)}</span></span>
                      </div>
                    </div>
                    <StatusDot pendiente={cert.total_pendiente} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ borderTop: `1px solid ${BORDER}`, overflow: 'hidden' }}
                      >
                        {/* overflowX en div interno para no bloquear con overflow:hidden del padre animado */}
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                          <table className="ueb-table" style={{ minWidth: '640px', width: '100%', tableLayout: 'fixed' }}>
                            <colgroup>
                              <col style={{ width: '80px' }} />
                              <col style={{ width: '180px' }} />
                              <col style={{ width: '115px' }} />
                              <col style={{ width: '105px' }} />
                              <col style={{ width: '105px' }} />
                              <col style={{ width: '110px' }} />
                              <col style={{ width: '95px' }} />
                            </colgroup>
                            <thead>
                              <tr>
                                {['Código', 'Descripción', 'Monto Cert.', 'Liquidado', 'Disponible', 'Avance', ''].map((h, i) => (
                                  <th key={i} style={{ textAlign: i >= 2 && i <= 4 ? 'right' : 'left' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {cert.items.map((item) => {
                                const isSelected = selected?.id_certificacion_item === item.id_certificacion_item
                                const disponible = parseFloat(item.pendiente ?? 0)
                                return (
                                  <tr key={item.id_certificacion_item}
                                    style={{ background: isSelected ? 'rgba(46,108,164,0.08)' : 'transparent', borderLeft: isSelected ? `3px solid ${ACCENT}` : '3px solid transparent' }}
                                  >
                                    <td style={{ fontFamily: 'monospace', color: ACCENT, fontWeight: 700, fontSize: '11px' }}>{item.cod_item}</td>
                                    <td title={item.nombre_item}>
                                      <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre_item}</div>
                                    </td>
                                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt(item.monto)}</td>
                                    <td style={{ textAlign: 'right', color: GREEN, fontWeight: parseFloat(item.liquidado) > 0 ? 700 : 400, whiteSpace: 'nowrap' }}>{fmt(item.liquidado)}</td>
                                    <td style={{ textAlign: 'right', color: disponible > 0 ? CYAN : MUTED, fontWeight: disponible > 0 ? 700 : 400, whiteSpace: 'nowrap' }}>{fmt(disponible)}</td>
                                    <td><MiniBar monto={parseFloat(item.monto)} liquidado={parseFloat(item.liquidado)} /></td>
                                    <td>
                                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                        onClick={() => handleSelectItem(item)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: isSelected ? 'rgba(46,164,102,0.15)' : disponible > 0 ? 'rgba(46,164,102,0.10)' : 'rgba(46,49,164,0.08)', border: `1px solid ${isSelected ? GREEN : disponible > 0 ? 'rgba(46,164,102,0.30)' : 'rgba(46,49,164,0.28)'}`, borderRadius: '6px', color: isSelected ? GREEN : disponible > 0 ? GREEN : INDIGO, cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-primary)', whiteSpace: 'nowrap' }}
                                      >
                                        {isSelected ? <CheckCircle size={11} /> : disponible > 0 ? <Plus size={11} /> : <History size={11} />}
                                        {isSelected ? 'Seleccionado' : disponible > 0 ? 'Liquidar' : 'Historial'}
                                      </motion.button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Backdrop semitransparente cuando el drawer está abierto */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,47,0.25)', zIndex: 299, backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
          />
        )}
      </AnimatePresence>

      {/* Drawer lateral — se desliza desde la derecha sin comprimir la tabla */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            style={{
              position: 'fixed', right: 0, top: 0, bottom: 0,
              width: 'min(440px, 92vw)',
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '-8px 0 40px rgba(10,25,47,0.14)',
              borderLeft: `1px solid ${BORDER}`,
              overflowY: 'auto',
              zIndex: 300,
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', background: 'linear-gradient(135deg, rgba(26,58,92,0.05), rgba(46,108,164,0.05))', flexShrink: 0, position: 'sticky', top: 0, zIndex: 1, backdropFilter: 'blur(8px)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: MUTED, marginBottom: '3px' }}>
                  Certificación <span style={{ color: ACCENT, fontWeight: 700 }}>{selected.numero_certificado}</span>
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: ACCENT, fontWeight: 700, marginBottom: '3px' }}>{selected.cod_item}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.nombre_item}</div>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} onClick={() => setSelected(null)}
                style={{ background: 'rgba(26,58,92,0.06)', border: '1px solid rgba(26,58,92,0.12)', borderRadius: '8px', color: MUTED, cursor: 'pointer', padding: '6px', flexShrink: 0, display: 'flex', alignItems: 'center' }}
              >
                <X size={15} />
              </motion.button>
            </div>

            {/* Resumen */}
            {resumen && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
                {[
                  { label: 'Monto Cert.', value: fmt(resumen.certificado), color: TEXT },
                  { label: 'Liquidado',   value: fmt(resumen.liquidado),   color: GREEN },
                  { label: 'Disponible',  value: fmt(resumen.pendiente),   color: resumen.pendiente > 0 ? CYAN : MUTED },
                ].map((r, i) => (
                  <div key={i} style={{ background: BG, borderRadius: '10px', padding: '12px 10px', textAlign: 'center', border: '1px solid rgba(46,108,164,0.10)' }}>
                    <div style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>{r.label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: r.color }}>{r.value}</div>
                  </div>
                ))}
              </div>
            )}
            {resumen && (
              <div style={{ padding: '8px 16px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
                <MiniBar monto={resumen.certificado} liquidado={resumen.liquidado} />
              </div>
            )}

            {/* Form — oculto en modo solo lectura */}
            {!isReadOnly && (
              <div style={{ padding: '16px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: TEXT, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={13} color={ACCENT} /> Nueva Liquidación
                </div>

                <AnimatePresence>
                  {formError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.22)', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', color: RED, fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}
                    >
                      <AlertCircle size={12} /> {formError}
                    </motion.div>
                  )}
                  {formOk && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.22)', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', color: GREEN, fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}
                    >
                      <CheckCircle size={12} /> {formOk}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleCreate}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={LABEL_S}>Monto ($)</label>
                      <input type="text" inputMode="decimal" value={form.monto} onChange={e => { const v = e.target.value.replace('.', ','); if (v === '' || /^\d*[,]?\d{0,2}$/.test(v)) setForm(f => ({ ...f, monto: v })) }} placeholder="0,00" style={INPUT_S} required
                        onFocus={e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }}
                      />
                      {resumen && resumen.pendiente > 0 && (
                        <div style={{ fontSize: '11px', color: CYAN, marginTop: '4px' }}>Disponible: {fmt(resumen.pendiente)}</div>
                      )}
                    </div>
                    <div>
                      <label style={LABEL_S}>Fecha</label>
                      <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} style={INPUT_S} required
                        onFocus={e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={LABEL_S}>Memorando / Referencia</label>
                    <input type="text" value={form.memorando} onChange={e => setForm(f => ({ ...f, memorando: e.target.value }))} placeholder="Número de memorando..." style={INPUT_S} maxLength={100} required
                      onFocus={e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }}
                    />
                  </div>
                  <motion.button
                    whileHover={!saving && !(resumen && resumen.pendiente <= 0) ? { scale: 1.02, boxShadow: '0 8px 24px rgba(26,58,92,0.30)' } : {}}
                    whileTap={!saving ? { scale: 0.98 } : {}}
                    type="submit" disabled={saving || (resumen && resumen.pendiente <= 0)}
                    style={{ width: '100%', padding: '10px', background: (saving || (resumen && resumen.pendiente <= 0)) ? 'rgba(26,58,92,0.08)' : 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: (saving || (resumen && resumen.pendiente <= 0)) ? MUTED : '#fff', border: 'none', borderRadius: '8px', cursor: (saving || (resumen && resumen.pendiente <= 0)) ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: (saving || (resumen && resumen.pendiente <= 0)) ? 'none' : '0 4px 16px rgba(26,58,92,0.25)', transition: 'all 0.18s ease' }}
                  >
                    <Plus size={13} />
                    {saving ? 'Guardando...' : resumen && resumen.pendiente <= 0 ? 'Sin saldo disponible' : 'Registrar Liquidación'}
                  </motion.button>
                </form>
              </div>
            )}

            {/* Historial */}
            <div style={{ padding: '16px', flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: TEXT, marginBottom: '10px' }}>Historial ({liqs.length})</div>
              {loadingLiq ? (
                <div style={{ textAlign: 'center', color: MUTED, fontSize: '12px', padding: '12px 0' }}>Cargando...</div>
              ) : liqs.length === 0 ? (
                <div style={{ textAlign: 'center', color: MUTED, fontSize: '12px', padding: '12px 0' }}>Sin liquidaciones registradas.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {liqs.map((liq) => {
                    const anulada = liq.estado === 'ANULADA'
                    return (
                      <div key={liq.id_liquidacion} style={{ background: anulada ? 'rgba(185,28,28,0.05)' : BG, border: `1px solid ${anulada ? 'rgba(185,28,28,0.22)' : BORDER}`, borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', opacity: anulada ? 0.75 : 1 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: anulada ? RED : GREEN, textDecoration: anulada ? 'line-through' : 'none' }}>{fmt(liq.cantidad_liquidacion)}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {anulada && <span className="badge badge-red" style={{ fontSize: '9px' }}>ANULADA</span>}
                              <span style={{ fontSize: '11px', color: MUTED }}>{liq.fecha_creacion}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{liq.memorando}</div>
                          {anulada && liq.motivo_anulacion && (
                            <div style={{ fontSize: '11px', color: RED, marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Motivo: {liq.motivo_anulacion}</div>
                          )}
                        </div>
                        {!anulada && !isReadOnly && puedeAnular && (
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => setAnularModal({ open: true, id: liq.id_liquidacion, motivo: '', saving: false, error: '' })}
                            title="Anular"
                            style={{ width: '28px', height: '28px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(185,28,28,0.10)', border: '1px solid rgba(185,28,28,0.25)', borderRadius: '6px', color: RED, cursor: 'pointer' }}
                          >
                            <Ban size={12} />
                          </motion.button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Anulación */}
      <AnimatePresence>
        {anularModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,55,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
          >
            <motion.div initial={{ scale: 0.88, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}
            >
              <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, #1a0808, #a42e2e)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Ban size={16} color="#fff" />
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Anular Liquidación</span>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setAnularModal({ open: false, id: null, motivo: '', saving: false, error: '' })}
                  style={{ background: 'rgba(255,255,255,0.10)', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={14} />
                </motion.button>
              </div>
              <div style={{ padding: '22px' }}>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: MUTED, lineHeight: 1.6 }}>
                  La liquidación quedará anulada pero el registro se conserva para auditoría. Ingrese el motivo.
                </p>
                <AnimatePresence>
                  {anularModal.error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.22)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', color: RED, fontSize: '12px' }}
                    >
                      {anularModal.error}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div style={{ marginBottom: '16px' }}>
                  <label style={LABEL_S}>Motivo de anulación</label>
                  <textarea value={anularModal.motivo} onChange={e => setAnularModal(m => ({ ...m, motivo: e.target.value }))}
                    placeholder="Describa el motivo..." maxLength={255} rows={3} style={{ ...INPUT_S, resize: 'vertical' }}
                    onFocus={e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setAnularModal({ open: false, id: null, motivo: '', saving: false, error: '' })}
                    style={{ flex: 1, padding: '9px', background: 'rgba(26,58,92,0.06)', color: MUTED, border: '1px solid rgba(26,58,92,0.12)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-primary)' }}
                  >
                    Cancelar
                  </button>
                  <motion.button whileHover={!anularModal.saving ? { scale: 1.02 } : {}} whileTap={!anularModal.saving ? { scale: 0.98 } : {}}
                    onClick={handleAnular} disabled={anularModal.saving}
                    style={{ flex: 1, padding: '9px', background: anularModal.saving ? 'rgba(164,46,46,0.40)' : 'linear-gradient(135deg, #1a0808, #a42e2e)', color: '#fff', border: 'none', borderRadius: '8px', cursor: anularModal.saving ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(164,46,46,0.30)', transition: 'all 0.15s ease' }}
                  >
                    <Ban size={13} /> {anularModal.saving ? 'Anulando...' : 'Confirmar Anulación'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
