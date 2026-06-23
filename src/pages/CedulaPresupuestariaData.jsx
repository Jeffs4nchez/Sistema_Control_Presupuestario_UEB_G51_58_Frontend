import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import { motion } from 'framer-motion'
import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { cachedFetch } from '../utils/apiCache'

const CARD   = 'rgba(255,255,255,0.90)'
const BORDER = 'rgba(46,108,164,0.14)'
const BG     = '#f8fafd'
const ACCENT = '#2e6ca4'
const GREEN  = '#059669'
const GOLD   = '#d97706'
const RED    = '#b91c1c'
const TEAL   = '#0891b2'
const TEXT   = '#1a3a5c'
const MUTED  = '#5a7a9f'

const INPUT_S = {
  padding: '8px 11px', background: BG,
  border: '1px solid rgba(46,108,164,0.22)',
  borderRadius: '8px', color: TEXT, fontSize: '13px',
  fontFamily: 'var(--font-primary)', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

const LABEL_S = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  color: MUTED, marginBottom: '6px',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

export default function CedulaPresupuestariaData({ embedded = false }) {
  const [data,       setData]       = useState([])
  const [loading,    setLoading]    = useState(false)
  const [search,     setSearch]     = useState("")
  const [page,       setPage]       = useState(1)
  const [pagination, setPagination] = useState(null)
  const [limit,      setLimit]      = useState(50)
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 768)

  useEffect(() => {
    fetchData()
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [page, limit])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = Cookies.get("auth_token")
      const res = await cachedFetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/cedula-presupuestaria/data?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const result = await res.json()
      if (result.success) { setData(result.data); setPagination(result.pagination) }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchData() }

  const fmtCurrency = (value) => {
    if (value === null || value === undefined || value === '-') return "—"
    const n = parseFloat(value); if (isNaN(n)) return "—"
    return `$${n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const calcSaldo = (item) => {
    const cod  = (parseFloat(item.asignado) || 0) + (parseFloat(item.modificado) || 0)
    const saldo = Math.max(0, cod - (parseFloat(item.certificado) || 0))
    return `$${saldo.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const P = isMobile ? '20px' : '28px'

  return (
    <div style={{ minHeight: embedded ? 0 : '100%', background: embedded ? 'none' : 'var(--page-bg)', padding: embedded ? 0 : P, fontFamily: 'var(--font-primary)', flex: embedded ? 1 : undefined, overflowX: 'hidden' }}>

      {!embedded && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '20px', fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>
          Cédula Presupuestaria — Datos
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: MUTED }}>Items con sus valores financieros: asignado, modificado, codificado, certificado</p>
      </motion.div>}

      {/* Leyenda de colores */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        {[
          { label: 'Asignado',   color: GREEN  },
          { label: 'Modificado', color: GOLD   },
          { label: 'Codificado', color: ACCENT },
          { label: 'Certificado', color: TEAL  },
          { label: 'Saldo',      color: RED    },
        ].map(({ label, color }) => (
          <span key={label} style={{ fontSize: '11px', padding: '3px 10px', background: `${color}12`, border: `1px solid ${color}30`, borderRadius: '999px', color, fontWeight: 700 }}>
            {label}
          </span>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
        style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px', marginBottom: '14px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Filter size={14} style={{ color: MUTED }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filtros</span>
          {pagination && <span style={{ marginLeft: 'auto', fontSize: '12px', color: MUTED }}>{pagination.total || 0} registros</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
          <div>
            <label style={LABEL_S}>Por Página</label>
            <select value={limit} onChange={e => { setLimit(parseInt(e.target.value)); setPage(1) }} style={{ ...INPUT_S, cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }}
            >
              {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n} registros</option>)}
            </select>
          </div>
          <form onSubmit={handleSearch} style={{ display: 'contents' }}>
            <div>
              <label style={LABEL_S}>Buscar</label>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Código o descripción..." style={{ ...INPUT_S, paddingLeft: '28px' }}
                  onFocus={e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
              style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', whiteSpace: 'nowrap', alignSelf: 'flex-end', boxShadow: '0 3px 12px rgba(26,58,92,0.20)' }}
            >
              Buscar
            </motion.button>
          </form>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '14px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}
      >
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: MUTED, fontSize: '13px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid rgba(46,108,164,0.15)', borderTopColor: ACCENT, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
            Cargando datos...
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: MUTED, fontSize: '13px' }}>No hay datos disponibles</div>
        ) : (
          <div style={{ width: '100%', overflowX: 'hidden' }}>
            <table className="ueb-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>
                  {[
                    { label: 'Prog.',       align: 'left',  color: undefined },
                    { label: 'Act.',        align: 'left',  color: undefined },
                    { label: 'Fte.',        align: 'left',  color: undefined },
                    { label: 'Ítem',        align: 'left',  color: undefined },
                    { label: 'Descripción', align: 'left',  color: undefined },
                    { label: 'Asignado',    align: 'right', color: GREEN  },
                    { label: 'Modificado',  align: 'right', color: GOLD   },
                    { label: 'Codificado',  align: 'right', color: ACCENT },
                    { label: 'Certificado', align: 'right', color: TEAL   },
                    { label: 'Saldo',       align: 'right', color: RED    },
                  ].map((h, i) => (
                    <th key={i} style={{ textAlign: h.align, whiteSpace: 'nowrap', overflow: 'hidden', color: h.color, padding: '9px 6px', fontSize: '11px' }}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <motion.tr key={item.id_item || idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(idx * 0.008, 0.3) }}>
                    <td style={{ padding: '9px 5px', fontFamily: 'monospace', color: MUTED, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.cod_programa || '—'}</td>
                    <td style={{ padding: '9px 5px', fontFamily: 'monospace', color: MUTED, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(item.cod_actividad || '—').slice(-3)}</td>
                    <td style={{ padding: '9px 5px', fontFamily: 'monospace', color: MUTED, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.cod_fuente || '—'}</td>
                    <td style={{ padding: '9px 6px', fontFamily: 'monospace', color: ACCENT, fontWeight: 700, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.cod_item}</td>
                    <td style={{ padding: '9px 6px', fontSize: '13px', color: TEXT, fontWeight: 500, lineHeight: 1.4, maxWidth: '200px' }}>{item.nombre_item}</td>
                    <td style={{ padding: '9px 6px', textAlign: 'right', color: GREEN,  fontWeight: 600, fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(item.asignado)}</td>
                    <td style={{ padding: '9px 6px', textAlign: 'right', color: GOLD,   fontWeight: 600, fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(item.modificado)}</td>
                    <td style={{ padding: '9px 6px', textAlign: 'right', color: ACCENT, fontWeight: 600, fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtCurrency((parseFloat(item.asignado) || 0) + (parseFloat(item.modificado) || 0))}
                    </td>
                    <td style={{ padding: '9px 6px', textAlign: 'right', color: TEAL,   fontWeight: 600, fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(item.certificado)}</td>
                    <td style={{ padding: '9px 6px', textAlign: 'right', color: RED,    fontWeight: 700, fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{calcSaldo(item)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {pagination && !loading && data.length > 0 && pagination.last_page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: MUTED }}>
            Página {pagination.current_page} de {pagination.last_page} ({pagination.total} registros)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <motion.button whileHover={page > 1 ? { scale: 1.02 } : {}} whileTap={page > 1 ? { scale: 0.98 } : {}}
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: page === 1 ? 'rgba(26,58,92,0.06)' : 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: page === 1 ? MUTED : '#fff', border: 'none', borderRadius: '8px', cursor: page === 1 ? 'default' : 'pointer', fontSize: '13px', opacity: page === 1 ? 0.5 : 1, fontFamily: 'var(--font-primary)', boxShadow: page === 1 ? 'none' : '0 3px 10px rgba(26,58,92,0.20)' }}
            >
              <ChevronLeft size={14} /> Anterior
            </motion.button>
            <motion.button whileHover={page < pagination.last_page ? { scale: 1.02 } : {}} whileTap={page < pagination.last_page ? { scale: 0.98 } : {}}
              onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))} disabled={page === pagination.last_page}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: page === pagination.last_page ? 'rgba(26,58,92,0.06)' : 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: page === pagination.last_page ? MUTED : '#fff', border: 'none', borderRadius: '8px', cursor: page === pagination.last_page ? 'default' : 'pointer', fontSize: '13px', opacity: page === pagination.last_page ? 0.5 : 1, fontFamily: 'var(--font-primary)', boxShadow: page === pagination.last_page ? 'none' : '0 3px 10px rgba(26,58,92,0.20)' }}
            >
              Siguiente <ChevronRight size={14} />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}
