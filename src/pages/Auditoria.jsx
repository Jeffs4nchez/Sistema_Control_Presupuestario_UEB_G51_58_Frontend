import { useState, useEffect, useCallback, useRef } from 'react'
import Cookies from 'js-cookie'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatFechaHora } from '../utils/fechaUtils'

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

const ACCION_META = {
  'CREACIÓN':              { cls: 'badge-green',  label: 'Creación'             },
  'CAMBIO_ESTADO':         { cls: 'badge-blue',   label: 'Cambio de Estado'     },
  'EDICIÓN':               { cls: 'badge-gold',   label: 'Edición'              },
  'ELIMINACIÓN':           { cls: 'badge-red',    label: 'Eliminación'          },
  'ANULACION_LIQUIDACION': { cls: 'badge-orange', label: 'Anulación Liquidación'},
  'CREACION_LIQUIDACION':  { cls: 'badge-purple', label: 'Nueva Liquidación'    },
}

const ACCION_TEXT = {
  'CREACIÓN':              '#059669',
  'CAMBIO_ESTADO':         '#2e6ca4',
  'EDICIÓN':               '#b45309',
  'ELIMINACIÓN':           '#b91c1c',
  'ANULACION_LIQUIDACION': '#ea580c',
  'CREACION_LIQUIDACION':  '#7c3aed',
}

function AccionBadge({ accion }) {
  const m = ACCION_META[accion] || { cls: 'badge-blue', label: accion }
  return <span className={`badge ${m.cls}`}>{m.label}</span>
}

function Detalle({ r }) {
  const navy   = '#1a3a5c'
  const muted  = '#5a7a9f'
  const textColor = (a) => ACCION_TEXT[a] || navy

  if (r.accion === 'CAMBIO_ESTADO') {
    return (
      <span style={{ fontSize: '12px', color: muted }}>
        <span style={{ color: navy, fontWeight: 600 }}>{r.estado_anterior}</span>
        {' → '}
        <span style={{ color: textColor(r.accion), fontWeight: 700 }}>{r.estado_nuevo}</span>
      </span>
    )
  }
  if (r.accion === 'EDICIÓN' && r.campo_modificado) {
    const campo = r.campo_modificado
    if (r.monto_anterior != null) {
      const fmt = (v) => parseFloat(v).toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
      return <span style={{ fontSize: '12px', color: muted }}>{campo}: {fmt(r.monto_anterior)} → {fmt(r.monto_nuevo)}</span>
    }
    return <span style={{ fontSize: '12px', color: muted }}>Campo: <span style={{ color: navy, fontWeight: 600 }}>{campo}</span></span>
  }
  if (r.accion === 'CREACIÓN') {
    return (
      <span style={{ fontSize: '12px', color: muted }}>
        Estado: <span style={{ color: '#059669', fontWeight: 700 }}>{r.estado_nuevo}</span>
        {r.monto_nuevo != null && (
          <> · Monto: <span style={{ color: navy, fontWeight: 600 }}>{parseFloat(r.monto_nuevo).toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}</span></>
        )}
      </span>
    )
  }
  if (r.accion === 'ELIMINACIÓN') {
    return (
      <span style={{ fontSize: '12px', color: muted }}>
        <span style={{ color: navy, fontWeight: 600 }}>{r.estado_anterior}</span>
        {' → '}
        <span style={{ color: '#b91c1c', fontWeight: 700 }}>{r.estado_nuevo || 'ELIMINADO'}</span>
      </span>
    )
  }
  if (r.accion === 'CREACION_LIQUIDACION') {
    const fmt = (v) => v != null ? parseFloat(v).toLocaleString('es-EC', { style: 'currency', currency: 'USD' }) : ''
    return (
      <span style={{ fontSize: '12px', color: muted }}>
        Memorando: <span style={{ color: navy, fontWeight: 600 }}>{r.campo_modificado}</span>
        {r.monto_nuevo != null && <> · Monto: <span style={{ color: '#7c3aed', fontWeight: 700 }}>{fmt(r.monto_nuevo)}</span></>}
      </span>
    )
  }
  if (r.accion === 'ANULACION_LIQUIDACION') {
    const fmt = (v) => v != null ? parseFloat(v).toLocaleString('es-EC', { style: 'currency', currency: 'USD' }) : ''
    return (
      <span style={{ fontSize: '12px', color: muted }}>
        Memorando: <span style={{ color: navy, fontWeight: 600 }}>{r.campo_modificado}</span>
        {r.monto_anterior != null && <> · Monto: <span style={{ color: '#ea580c' }}>{fmt(r.monto_anterior)}</span></>}
        {r.motivo && <> · Motivo: <span style={{ color: navy }}>{r.motivo}</span></>}
      </span>
    )
  }
  return <span style={{ fontSize: '12px', color: muted }}>—</span>
}

function SkeletonAuditoriaRows() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
        <thead>
          <tr style={{ background: '#f0f4f8', borderBottom: '2px solid rgba(26,58,92,0.08)' }}>
            {['Fecha / Hora', 'Certificado', 'Acción', 'Detalle', 'Usuario'].map((h, i) => (
              <th key={i} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(26,58,92,0.07)' }}>
              <td style={{ padding: '11px 16px' }}><div className="skeleton" style={{ width: '120px', height: '12px', borderRadius: '6px' }} /></td>
              <td style={{ padding: '11px 16px' }}><div className="skeleton" style={{ width: '80px', height: '13px', borderRadius: '6px' }} /></td>
              <td style={{ padding: '11px 16px' }}><div className="skeleton" style={{ width: '90px', height: '20px', borderRadius: '999px' }} /></td>
              <td style={{ padding: '11px 16px' }}><div className="skeleton" style={{ width: '180px', height: '12px', borderRadius: '6px' }} /></td>
              <td style={{ padding: '11px 16px' }}><div className="skeleton" style={{ width: '100px', height: '13px', borderRadius: '6px' }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Auditoria() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [search,  setSearch]  = useState('')
  const [accion,  setAccion]  = useState('')
  const [desde,   setDesde]   = useState('')
  const [hasta,   setHasta]   = useState('')
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)
  const limit = 20
  const allDataRef = useRef([])

  const filterAndPaginate = (s, ac, de, ha, pg) => {
    let items = allDataRef.current
    if (s) { const q = s.toLowerCase(); items = items.filter(r => r.numero_certificado?.toLowerCase().includes(q) || r.nombre_usuario?.toLowerCase().includes(q)) }
    if (ac) items = items.filter(r => r.accion === ac)
    if (de) items = items.filter(r => r.fecha_hora?.slice(0, 10) >= de)
    if (ha) items = items.filter(r => r.fecha_hora?.slice(0, 10) <= ha)
    setTotal(items.length)
    const start = (pg - 1) * limit
    setData(items.slice(start, start + limit))
  }

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${API}/auditoria?limit=9999`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) {
        allDataRef.current = json.data
        filterAndPaginate(search, accion, desde, hasta, page)
      } else {
        setError(json.message || 'Error al cargar auditoría')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  // Carga inicial
  useEffect(() => { cargar() }, [])

  // Filtros → instantáneo client-side
  const filterMounted = useRef(false)
  useEffect(() => {
    if (!filterMounted.current) { filterMounted.current = true; return }
    setPage(1)
    filterAndPaginate(search, accion, desde, hasta, 1)
  }, [search, accion, desde, hasta])

  // Página → client-side
  useEffect(() => {
    if (allDataRef.current.length > 0) filterAndPaginate(search, accion, desde, hasta, page)
  }, [page])

  const limpiar = () => {
    setSearch(''); setAccion(''); setDesde(''); setHasta(''); setPage(1)
    filterAndPaginate('', '', '', '', 1)
  }
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const focusStyle = (e) => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }
  const blurStyle  = (e) => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }

  return (
    <div style={{ minHeight: '100%', background: 'var(--page-bg)', padding: '28px', fontFamily: 'var(--font-primary)' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={18} color="#7c3aed" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Auditoría
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Historial completo de acciones sobre certificados presupuestarios
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.95)',
          borderRadius: '14px',
          boxShadow: '0 4px 20px rgba(26,58,92,0.08)',
          padding: '16px',
          marginBottom: '14px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Buscar
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#8fa3c0', pointerEvents: 'none' }} />
            <input
              type="text" placeholder="N° certificado o usuario..." maxLength={50}
              value={search}
              onChange={(e) => setSearch(e.target.value.slice(0, 50))}
              style={{ ...inputStyle, paddingLeft: '28px' }}
              onFocus={focusStyle} onBlur={blurStyle}
            />
          </div>
        </div>

        <div style={{ flex: '0 1 160px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Acción
          </label>
          <select value={accion} onChange={(e) => { setAccion(e.target.value); setPage(1) }} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
            <option value="">Todas</option>
            <option value="CREACIÓN">Creación</option>
            <option value="CAMBIO_ESTADO">Cambio de Estado</option>
            <option value="EDICIÓN">Edición</option>
            <option value="ELIMINACIÓN">Eliminación</option>
            <option value="ANULACION_LIQUIDACION">Anulación Liquidación</option>
            <option value="CREACION_LIQUIDACION">Nueva Liquidación</option>
          </select>
        </div>

        <div style={{ flex: '0 1 140px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Desde
          </label>
          <input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPage(1) }} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
        </div>

        <div style={{ flex: '0 1 140px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Hasta
          </label>
          <input type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setPage(1) }} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={limpiar}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px',
            background: 'rgba(26,58,92,0.06)',
            border: '1px solid rgba(26,58,92,0.12)',
            borderRadius: '8px',
            color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            fontFamily: 'var(--font-primary)', whiteSpace: 'nowrap',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(26,58,92,0.10)'; e.currentTarget.style.color = 'var(--text-heading)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(26,58,92,0.06)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <RefreshCw size={13} /> Limpiar
        </motion.button>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.95)',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(26,58,92,0.10)',
          overflow: 'hidden',
          marginBottom: '14px',
        }}
      >
        {loading ? (
          <SkeletonAuditoriaRows />
        ) : error ? (
          <div style={{ padding: '24px', color: '#b91c1c', fontSize: '13px', background: 'rgba(139,15,15,0.05)', borderRadius: '16px' }}>{error}</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Clock size={36} color="rgba(26,58,92,0.15)" style={{ marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay registros de auditoría.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
              <thead>
                <tr style={{ background: '#f0f4f8', borderBottom: '2px solid rgba(26,58,92,0.08)' }}>
                  {['Fecha / Hora', 'Certificado', 'Acción', 'Detalle', 'Usuario'].map((h, i) => (
                    <th key={i} style={{
                      padding: '11px 16px', textAlign: 'left',
                      fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((r, idx) => (
                  <motion.tr
                    key={r.id_auditoria}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.025, type: 'spring', stiffness: 200, damping: 25 }}
                    style={{ borderBottom: '1px solid rgba(26,58,92,0.07)', transition: 'background 0.12s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(240,244,248,0.85)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 16px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {formatFechaHora(r.fecha_hora)}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: 700, color: '#2e6ca4', whiteSpace: 'nowrap' }}>
                      {r.numero_certificado}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <AccionBadge accion={r.accion} />
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <Detalle r={r} />
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>
                      {r.nombre_usuario}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {total} registro{total !== 1 ? 's' : ''} en total
        </span>
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14}/></PagBtn>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i-1] > 1) acc.push('…'); acc.push(n); return acc }, [])
              .map((n, i) => n === '…'
                ? <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '13px', alignSelf: 'center' }}>…</span>
                : <PagBtn key={n} onClick={() => setPage(n)} active={page === n}>{n}</PagBtn>
              )
            }
            <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14}/></PagBtn>
          </div>
        )}
      </div>
    </div>
  )
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: '34px', height: '34px', padding: '0 8px',
        background: active
          ? 'linear-gradient(135deg, #1a3a5c, #2e6ca4)'
          : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(10px)',
        color: active ? '#fff' : disabled ? 'var(--text-light)' : 'var(--text-body)',
        border: active ? 'none' : '1px solid rgba(26,58,92,0.12)',
        borderRadius: '8px',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '13px', fontWeight: active ? 700 : 500,
        fontFamily: 'var(--font-primary)',
        opacity: disabled ? 0.45 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active ? '0 4px 14px rgba(26,58,92,0.25)' : 'none',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </motion.button>
  )
}
