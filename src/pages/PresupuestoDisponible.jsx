import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Search, RefreshCw, AlertTriangle, CheckCircle2, X, FileText, ExternalLink, CheckCircle } from 'lucide-react'
import { cachedFetch } from '../utils/apiCache'
import { useFiscalYear } from '../contexts/FiscalYearContext'
import { useNavigate, useLocation } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const inputStyle = {
  padding: '8px 11px',
  background: '#f8fafd',
  border: '1px solid rgba(46,108,164,0.22)',
  borderRadius: '8px',
  color: '#1a3a5c',
  fontSize: '13px',
  fontFamily: 'var(--font-primary)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
}

const labelStyle = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 700,
  color: '#5a7a9f',
  marginBottom: '5px',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  fontFamily: 'var(--font-primary)',
}

function fmt(v) {
  const n = parseFloat(v) || 0
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}

function SaldoBar({ codificado, certificado, liquidado }) {
  const neto = Math.max(0, (parseFloat(certificado) || 0) - (parseFloat(liquidado) || 0))
  const pct = codificado > 0 ? Math.min(100, (neto / codificado) * 100) : 0
  const color = pct >= 100 ? '#b91c1c' : pct >= 75 ? '#d97706' : '#059669'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
      <div style={{ flex: 1, height: '5px', background: 'rgba(26,58,92,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: '3px' }}
        />
      </div>
      <span style={{ fontSize: '10px', color, fontWeight: 700, width: '28px', flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

const ESTADO_COLORS = { APROBADO: '#059669', LIQUIDADO: '#0891b2' }
const ESTADO_BG     = { APROBADO: 'rgba(5,150,105,0.10)', LIQUIDADO: 'rgba(8,145,178,0.10)' }

export default function PresupuestoDisponible() {
  const { selectedCedula } = useFiscalYear()
  const navigate  = useNavigate()
  const location  = useLocation()
  const fromCert  = location.state?.certId     || null
  const fromLabel = location.state?.numeroCert || null
  const [items,      setItems]    = useState([])
  const [totales,    setTotales]  = useState(null)
  const [loading,    setLoading]  = useState(false)
  const [search,     setSearch]   = useState('')
  const [fPrograma,  setPrograma] = useState('')
  const [fActividad, setActividad]= useState('')
  const [fFuente,    setFuente]   = useState('')

  // Partidas resaltadas al venir desde una certificación
  const [highlightKeys, setHighlightKeys] = useState(new Set())

  useEffect(() => {
    if (!fromCert) return
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    fetch(`${API}/certificacion/${fromCert}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.items) {
          const keys = new Set(json.data.items.map(i => `${i.id_item}_${i.id_fuente}`))
          setHighlightKeys(keys)
        }
      })
      .catch(() => {})
  }, [fromCert])

  // Modal de certificaciones por ítem
  const [modal, setModal] = useState(null) // { item } | null
  const [modalData,    setModalData]    = useState([])
  const [modalLoading, setModalLoading] = useState(false)

  const openModal = async (item) => {
    setModal(item)
    setModalData([])
    setModalLoading(true)
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const params = new URLSearchParams({ id_item: item.id_item, id_fuente: item.id_fuente })
      if (selectedCedula) params.set('id_cedula_presupuestaria', selectedCedula.id_cedula_presupuestaria)
      const res  = await fetch(`${API}/presupuesto/certificaciones-por-item?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const json = await res.json()
      if (json.success) setModalData(json.data)
    } catch { /* silent */ }
    finally { setModalLoading(false) }
  }

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const qParams = {
        search:    params.search    ?? search,
        programa:  params.programa  ?? fPrograma,
        actividad: params.actividad ?? fActividad,
        fuente:    params.fuente    ?? fFuente,
      }
      if (selectedCedula) qParams.id_cedula_presupuestaria = selectedCedula.id_cedula_presupuestaria
      const q = new URLSearchParams(qParams).toString()
      const res  = await cachedFetch(`${API}/presupuesto-disponible?${q}`)
      const json = await res.json()
      if (json.success) {
        setItems(json.data)
        setTotales(json.totales)
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [search, fPrograma, fActividad, fFuente, selectedCedula])

  useEffect(() => { fetchData() }, [selectedCedula?.id_cedula_presupuestaria])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchData({ search, programa: fPrograma, actividad: fActividad, fuente: fFuente })
  }

  const handleReset = () => {
    setSearch('')
    setPrograma('')
    setActividad('')
    setFuente('')
    fetchData({ search: '', programa: '', actividad: '', fuente: '' })
  }

  const focusStyle = (e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }
  const blurStyle  = (e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }

  const summaryCards = totales ? [
    { label: 'Total Ítems',       value: totales.total_items,              color: '#2e6ca4', raw: true },
    { label: 'Total Codificado',  value: fmt(totales.total_codificado),    color: '#1a3a5c' },
    { label: 'Certificado',       value: fmt(totales.total_certificado),   color: '#d97706' },
    { label: 'Liquidado',         value: fmt(totales.total_liquidado),     color: '#0891b2' },
    { label: 'Saldo Disponible',  value: fmt(totales.total_saldo),         color: '#059669' },
    { label: 'Ítems Sin Saldo',   value: totales.items_sin_saldo,          color: '#b91c1c', raw: true },
  ] : []

  return (
    <div style={{ background: 'var(--page-bg)', minHeight: '100%', padding: '20px', fontFamily: 'var(--font-primary)', overflowX: 'hidden' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'rgba(5,150,105,0.10)', border: '1px solid rgba(5,150,105,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PieChart size={18} color="#059669" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Presupuesto Disponible
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Saldo = Codificado − Certificado − Liquidado
            </p>
          </div>
        </div>
      </motion.div>

      {/* Banner: viniendo desde una certificación */}
      {fromCert && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '10px', padding: '10px 16px', marginBottom: '14px',
            background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.25)',
            borderRadius: '10px', fontSize: '13px', color: '#065f46',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={14} color="#059669" />
            <span>Mostrando partidas certificadas en <strong>{fromLabel}</strong> (resaltadas en verde)</span>
          </div>
          <button
            onClick={() => { setHighlightKeys(new Set()); navigate('/dashboard/presupuesto-disponible', { replace: true, state: {} }) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', display: 'flex', alignItems: 'center' }}
            title="Quitar filtro"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* Summary cards */}
      {totales && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {summaryCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 120, damping: 18 }}
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.95)',
                borderRadius: '14px',
                boxShadow: '0 4px 20px rgba(26,58,92,0.08)',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: card.raw ? '24px' : '16px', fontWeight: 800, color: card.color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {card.value}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.95)',
          borderRadius: '14px',
          boxShadow: '0 4px 20px rgba(26,58,92,0.08)',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={labelStyle}>Buscar ítem</label>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#8fa3c0', pointerEvents: 'none' }} />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Código o nombre..." maxLength={6} style={{ ...inputStyle, paddingLeft: '28px' }} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Programa</label>
              <input type="text" value={fPrograma} onChange={(e) => setPrograma(e.target.value)} placeholder="Código de programa..." maxLength={2} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={labelStyle}>Actividad</label>
              <input type="text" value={fActividad} onChange={(e) => setActividad(e.target.value)} placeholder="Código de actividad..." maxLength={3} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fuente</label>
              <input type="text" value={fFuente} onChange={(e) => setFuente(e.target.value)} placeholder="Código de fuente..." maxLength={3} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              style={{
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #1a3a5c, #2e6ca4)',
                color: '#fff', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                fontFamily: 'var(--font-primary)',
                boxShadow: '0 4px 14px rgba(26,58,92,0.25)',
              }}
            >
              Filtrar
            </motion.button>
            <button
              type="button"
              onClick={handleReset}
              title="Limpiar filtros"
              style={{
                padding: '8px 10px', background: 'rgba(26,58,92,0.06)', color: 'var(--text-muted)',
                border: '1px solid rgba(26,58,92,0.12)', borderRadius: '8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(26,58,92,0.10)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(26,58,92,0.06)'; }}
            >
              <RefreshCw size={13} />
            </button>
            {!loading && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                {items.length} partida{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </form>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.95)',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(26,58,92,0.10)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid rgba(46,108,164,0.12)', borderTopColor: '#2e6ca4', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Cargando partidas...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <PieChart size={36} color="rgba(26,58,92,0.15)" style={{ marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No se encontraron partidas presupuestarias.</p>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f0f4f8', borderBottom: '2px solid rgba(26,58,92,0.08)' }}>
                  {[
                    { label: 'Código',      align: 'left'  },
                    { label: 'Nombre Ítem', align: 'left'  },
                    { label: 'Prg.',        align: 'left'  },
                    { label: 'Act.',        align: 'left'  },
                    { label: 'Fte.',        align: 'left'  },
                    { label: 'Codificado',  align: 'right', color: 'var(--text-muted)' },
                    { label: 'Certif.',     align: 'right', color: '#d97706' },
                    { label: 'Liquidado',   align: 'right', color: '#0891b2' },
                    { label: 'Saldo',       align: 'right', color: '#059669' },
                    { label: 'Avance',      align: 'left'  },
                    { label: '',            align: 'center'},
                  ].map((h, i) => (
                    <th key={i} style={{
                      padding: '9px 6px',
                      textAlign: h.align,
                      fontSize: '11px', fontWeight: 700,
                      color: h.color || 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      overflow: 'hidden', whiteSpace: 'nowrap',
                    }}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const rowKey       = `${item.id_item}_${item.id_fuente}`
                  const isHighlighted = highlightKeys.size > 0 && highlightKeys.has(rowKey)
                  const baseBg = isHighlighted
                    ? 'rgba(5,150,105,0.08)'
                    : item.sin_saldo ? 'rgba(139,15,15,0.04)' : 'transparent'
                  const hoverBg = isHighlighted
                    ? 'rgba(5,150,105,0.14)'
                    : item.sin_saldo ? 'rgba(139,15,15,0.08)' : 'rgba(240,244,248,0.85)'
                  return (
                  <motion.tr
                    key={`${item.id_item}-${item.cod_fuente ?? idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02, type: 'spring', stiffness: 200, damping: 25 }}
                    style={{
                      borderBottom: '1px solid rgba(26,58,92,0.07)',
                      background: baseBg,
                      transition: 'background 0.15s ease',
                      outline: isHighlighted ? '2px solid rgba(5,150,105,0.30)' : 'none',
                      outlineOffset: '-1px',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = baseBg }}
                  >
                    <td style={{ padding: '9px 6px', fontSize: '13px', fontFamily: 'monospace', color: '#2e6ca4', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.cod_item}
                    </td>
                    <td style={{ padding: '9px 6px', fontSize: '13px', color: 'var(--text-heading)', fontWeight: 500, lineHeight: 1.4, maxWidth: '200px' }}>
                      {item.nombre_item}
                    </td>
                    <td style={{ padding: '9px 5px', fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.cod_programa || '—'}</td>
                    <td style={{ padding: '9px 5px', fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', whiteSpace: 'nowrap' }}>{(item.cod_actividad || '—').slice(-3)}</td>
                    <td style={{ padding: '9px 5px', fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.cod_fuente || '—'}</td>
                    <td style={{ padding: '9px 6px', textAlign: 'right', fontSize: '12px', color: 'var(--text-heading)', fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmt(item.codificado)}</td>
                    <td
                      onClick={() => item.certificado > 0 && openModal(item)}
                      title={item.certificado > 0 ? 'Ver certificaciones de esta partida' : undefined}
                      style={{
                        padding: '9px 6px', textAlign: 'right', fontSize: '12px',
                        color: '#d97706', fontWeight: 600,
                        overflow: 'hidden', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
                        cursor: item.certificado > 0 ? 'pointer' : 'default',
                        textDecoration: item.certificado > 0 ? 'underline dotted' : 'none',
                      }}
                    >
                      {fmt(item.certificado)}
                    </td>
                    <td style={{ padding: '9px 6px', textAlign: 'right', fontSize: '12px', color: '#0891b2', fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmt(item.liquidado)}</td>
                    <td style={{ padding: '9px 6px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: item.sin_saldo ? '#b91c1c' : '#059669', overflow: 'hidden', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(item.saldo)}
                    </td>
                    <td style={{ padding: '9px 8px' }}>
                      <SaldoBar codificado={item.codificado} certificado={item.certificado} liquidado={item.liquidado} />
                    </td>
                    <td style={{ padding: '9px 4px', textAlign: 'center' }}>
                      {item.sin_saldo
                        ? <AlertTriangle size={13} color="#b91c1c" title="Sin saldo disponible" />
                        : <CheckCircle2 size={13} color="#059669" title="Saldo disponible" />
                      }
                    </td>
                  </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal: certificaciones por ítem */}
      <AnimatePresence>
        {modal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,47,0.45)', zIndex: 200, backdropFilter: 'blur(3px)' }}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(640px, 95vw)', maxHeight: '80vh',
                background: '#fff', borderRadius: '18px',
                boxShadow: '0 24px 64px rgba(10,25,47,0.22)',
                zIndex: 201, display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header del modal */}
              <div style={{
                padding: '18px 20px 16px',
                background: 'linear-gradient(135deg, #0d1f35, #1a3a5c)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                    background: 'rgba(255,179,71,0.15)', border: '1px solid rgba(255,179,71,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileText size={16} color="#d97706" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                      Certificaciones — {modal.cod_item}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(200,220,255,0.70)', marginTop: '2px', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {modal.nombre_item} · Fte. {modal.cod_fuente}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setModal(null)}
                  style={{ background: 'rgba(255,255,255,0.10)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Cuerpo */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                {modalLoading ? (
                  <div style={{ padding: '32px', textAlign: 'center' }}>
                    <div style={{ width: '32px', height: '32px', border: '3px solid rgba(46,108,164,0.12)', borderTopColor: '#2e6ca4', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 10px' }} />
                    <p style={{ color: '#8fa3c0', fontSize: '13px' }}>Cargando...</p>
                  </div>
                ) : modalData.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#8fa3c0', fontSize: '13px' }}>
                    No se encontraron certificaciones activas para esta partida.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(26,58,92,0.08)' }}>
                        {['Nro. Certificado', 'Fecha', 'Unidad Requiriente', 'Estado', 'Monto'].map((h, i) => (
                          <th key={i} style={{
                            padding: '7px 8px', textAlign: i === 4 ? 'right' : 'left',
                            fontSize: '10px', fontWeight: 700, color: '#8fa3c0',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.map((row, idx) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: '1px solid rgba(26,58,92,0.06)', transition: 'background 0.12s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(240,244,248,0.85)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '9px 8px' }}>
                            <button
                              onClick={() => { setModal(null); navigate('/dashboard/certificacion') }}
                              style={{
                                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '5px',
                                color: '#2e6ca4', fontWeight: 700, fontSize: '13px', fontFamily: 'monospace',
                              }}
                            >
                              {row.numero_certificado}
                              <ExternalLink size={11} />
                            </button>
                          </td>
                          <td style={{ padding: '9px 8px', fontSize: '12px', color: '#4a6580', whiteSpace: 'nowrap' }}>
                            {row.fecha_elaboracion ? new Date(row.fecha_elaboracion).toLocaleDateString('es-EC') : '—'}
                          </td>
                          <td style={{ padding: '9px 8px', fontSize: '12px', color: '#1a3a5c', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.unidad_requiriente || '—'}
                          </td>
                          <td style={{ padding: '9px 8px' }}>
                            <span style={{
                              display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                              color: ESTADO_COLORS[row.estado] || '#6b7280',
                              background: ESTADO_BG[row.estado]  || 'rgba(107,114,128,0.10)',
                            }}>
                              {row.estado}
                            </span>
                          </td>
                          <td style={{ padding: '9px 8px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#d97706', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                            {fmt(row.monto)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid rgba(26,58,92,0.10)' }}>
                        <td colSpan={4} style={{ padding: '9px 8px', fontSize: '11px', fontWeight: 700, color: '#8fa3c0', textTransform: 'uppercase' }}>
                          Total certificado
                        </td>
                        <td style={{ padding: '9px 8px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: '#d97706', fontVariantNumeric: 'tabular-nums' }}>
                          {fmt(modalData.reduce((s, r) => s + parseFloat(r.monto || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
