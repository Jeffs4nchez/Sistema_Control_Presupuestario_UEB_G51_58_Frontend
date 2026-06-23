import React, { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { motion } from 'framer-motion'
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useFiscalYear } from '../contexts/FiscalYearContext'

const CARD   = 'rgba(255,255,255,0.90)'
const BORDER = 'rgba(46,108,164,0.14)'
const BG     = '#f8fafd'
const ACCENT = '#2e6ca4'
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

const tableConfig = {
  programas: {
    cols: [
      { k: 'cod_programa',    l: 'Código' },
      { k: 'nombre_programa', l: 'Nombre del Programa' },
    ],
  },
  subprogramas: {
    cols: [
      { k: 'cod_subprograma',   l: 'Código' },
      { k: 'nombre_subprograma', l: 'Nombre del Subprograma' },
      { k: 'programa',           l: 'Programa', r: (v) => v?.nombre_programa },
    ],
  },
  proyectos: {
    cols: [
      { k: 'cod_proyecto',   l: 'Código' },
      { k: 'nombre_proyecto', l: 'Nombre del Proyecto' },
      { k: 'subprograma',     l: 'Subprograma', r: (v) => v?.nombre_subprograma },
    ],
  },
  actividades: {
    cols: [
      { k: 'cod_actividad',   l: 'Código' },
      { k: 'nombre_actividad', l: 'Nombre de Actividad' },
      { k: 'proyecto',         l: 'Proyecto', r: (v) => v?.nombre_proyecto },
    ],
  },
  items: {
    cols: [
      { k: 'actividad', l: 'PG',  r: (v) => v?.proyecto?.subprograma?.programa?.cod_programa },
      { k: 'actividad', l: 'SP',  r: (v) => v?.proyecto?.subprograma?.cod_subprograma?.slice(-2) },
      { k: 'actividad', l: 'PY',  r: (v) => v?.proyecto?.cod_proyecto?.slice(-3) },
      { k: 'actividad', l: 'ACT', r: (v) => v?.cod_actividad?.slice(-3) },
      { k: 'cod_item',  l: 'Item' },
      { k: 'nombre_item', l: 'Descripción del Item', r: (v) => v },
      { k: 'ubicacion', l: 'Ubicación', r: (v) => v ? `${v.cod_ubicacion} — ${v.nombre_ubicacion}` : '—' },
      { k: '_fuente', l: 'Fuente', r: (v) => v ? (v.cod_fuente || v.nombre_fuente || '?') : '—' },
      { k: 'organismo', l: 'Organismo', r: (v) => v ? (v.cod_organismo || v.nombre_organismo || '?') : '—' },
      { k: 'naturaleza_prestacion', l: 'N. Prestación', r: (v) => v ? (v.cod_naturaleza || v.nombre_naturaleza || '?') : '—' },
    ],
  },
}

const tiposDisponibles = [
  { key: 'items',        label: 'Items (Vista Completa)' },
  { key: 'programas',    label: 'Programas' },
  { key: 'subprogramas', label: 'Subprogramas' },
  { key: 'proyectos',    label: 'Proyectos' },
  { key: 'actividades',  label: 'Actividades' },
]

export default function EstructuraPresupuestariaData({ embedded = false }) {
  const { selectedCedula } = useFiscalYear()
  const [data,       setData]       = useState([])
  const [loading,    setLoading]    = useState(false)
  const [search,     setSearch]     = useState('')
  const [tipo,       setTipo]       = useState('items')
  const [page,       setPage]       = useState(1)
  const [pagination, setPagination] = useState(null)
  const [limit,      setLimit]      = useState(50)
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 768)

  useEffect(() => {
    fetchData()
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [page, tipo, limit, selectedCedula])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = Cookies.get('auth_token')
      const cedulaParam = selectedCedula?.id_cedula_presupuestaria
        ? `&id_cedula_presupuestaria=${selectedCedula.id_cedula_presupuestaria}`
        : ''
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/estructura-presupuestaria/data?tipo=${tipo}&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${cedulaParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const result = await res.json()
      if (result.success) { setData(result.data); setPagination(result.pagination) }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchData() }

  const config    = tableConfig[tipo]
  const P         = isMobile ? '20px' : '28px'
  const isItems   = tipo === 'items'
  const isCodeCol = (l) => ['PG', 'SP', 'PY', 'ACT', 'Item'].includes(l)

  // Expand items with multiple fuentes into one row per fuente
  const rows = isItems
    ? data.flatMap(row => {
        const fuentes = row.fuentes_financiamiento
        if (!fuentes || fuentes.length === 0) return [{ ...row, _fuente: null }]
        return fuentes.map(f => ({ ...row, _fuente: f }))
      })
    : data

  const totalPages = pagination ? (pagination.pages || pagination.last_page || 1) : 1

  return (
    <div style={{ minHeight: embedded ? 0 : '100%', background: embedded ? 'none' : 'var(--page-bg)', padding: embedded ? 0 : P, fontFamily: 'var(--font-primary)' }}>

      {/* Title — hidden when embedded */}
      {!embedded && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '20px', fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>
          Estructura Presupuestaria — Datos
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: MUTED }}>
          Programas › Subprogramas › Proyectos › Actividades › Items
        </p>
      </motion.div>}

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px', marginBottom: '14px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Filter size={14} style={{ color: MUTED }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filtros</span>
          {pagination && (
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: MUTED }}>
              {isItems ? rows.length : pagination.total || 0} registros
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
          <div>
            <label style={LABEL_S}>Vista</label>
            <select value={tipo} onChange={e => { setTipo(e.target.value); setPage(1); setSearch('') }} style={{ ...INPUT_S, cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }}
            >
              {tiposDisponibles.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
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
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Código o nombre..." style={{ ...INPUT_S, paddingLeft: '28px' }}
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

        {isItems && (
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[['PG','Programa'],['SP','Subprograma'],['PY','Proyecto'],['ACT','Actividad'],['Item','Código Item'],['Ubicación','Ubicación Geográfica'],['Fuente','Fuente Financiamiento'],['Organismo','Organismo Financiador'],['N. Prestación','Naturaleza Prestación']].map(([abbr, full]) => (
              <span key={abbr} style={{ fontSize: '10px', padding: '2px 7px', background: 'rgba(46,108,164,0.08)', border: '1px solid rgba(46,108,164,0.15)', borderRadius: '999px', color: MUTED }}>
                <span style={{ color: ACCENT, fontWeight: 700 }}>{abbr}</span> = {full}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
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
          <div style={{ overflowX: 'auto' }}>
            <table className="ueb-table" style={{ minWidth: isItems ? '1100px' : '500px', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ color: MUTED, whiteSpace: 'nowrap', borderRight: `1px solid ${BORDER}`, width: '36px', textAlign: 'center' }}>#</th>
                  {config.cols.map((col, i) => (
                    <th key={i} style={{ color: isCodeCol(col.l) ? ACCENT : undefined, borderRight: i < config.cols.length - 1 ? `1px solid ${BORDER}` : 'none', whiteSpace: 'nowrap' }}>
                      {col.l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => {
                  const rowNum = (page - 1) * limit + rowIdx + 1
                  return (
                  <motion.tr key={rowIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(rowIdx * 0.008, 0.3) }}>
                    <td style={{ color: MUTED, fontSize: '11px', textAlign: 'center', borderRight: `1px solid ${BORDER}`, fontVariantNumeric: 'tabular-nums' }}>{rowNum}</td>
                    {config.cols.map((col, colIdx) => {
                      const raw = row[col.k]; const val = col.r ? col.r(raw) : raw
                      const isCode = isCodeCol(col.l); const isDesc = col.l === 'Descripción del Item'
                      return (
                        <td key={colIdx} style={{ color: isCode ? ACCENT : undefined, fontWeight: isCode ? 700 : undefined, fontFamily: isCode ? 'monospace' : undefined, fontSize: isCode ? '11px' : '12px', maxWidth: isDesc ? '260px' : undefined, overflow: isDesc ? 'hidden' : undefined, textOverflow: isDesc ? 'ellipsis' : undefined, whiteSpace: isDesc ? 'nowrap' : undefined, borderRight: colIdx < config.cols.length - 1 ? `1px solid ${BORDER}` : 'none' }}
                          title={isDesc ? String(val || '') : undefined}
                        >
                          {val || '—'}
                        </td>
                      )
                    })}
                  </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: MUTED }}>
            Página {pagination.page || pagination.current_page || page} de {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <motion.button whileHover={page > 1 ? { scale: 1.02 } : {}} whileTap={page > 1 ? { scale: 0.98 } : {}}
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: page === 1 ? 'rgba(26,58,92,0.06)' : 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: page === 1 ? MUTED : '#fff', border: 'none', borderRadius: '8px', cursor: page === 1 ? 'default' : 'pointer', fontSize: '13px', opacity: page === 1 ? 0.5 : 1, fontFamily: 'var(--font-primary)', boxShadow: page === 1 ? 'none' : '0 3px 10px rgba(26,58,92,0.20)' }}
            >
              <ChevronLeft size={14} /> Anterior
            </motion.button>
            <motion.button whileHover={page < totalPages ? { scale: 1.02 } : {}} whileTap={page < totalPages ? { scale: 0.98 } : {}}
              onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: page === totalPages ? 'rgba(26,58,92,0.06)' : 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: page === totalPages ? MUTED : '#fff', border: 'none', borderRadius: '8px', cursor: page === totalPages ? 'default' : 'pointer', fontSize: '13px', opacity: page === totalPages ? 0.5 : 1, fontFamily: 'var(--font-primary)', boxShadow: page === totalPages ? 'none' : '0 3px 10px rgba(26,58,92,0.20)' }}
            >
              Siguiente <ChevronRight size={14} />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}
