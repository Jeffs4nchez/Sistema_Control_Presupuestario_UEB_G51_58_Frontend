import { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Upload, CheckCircle, AlertCircle,
  BarChart3, Layers, GitBranch, Activity, Package,
  X, Lock, ChevronDown, ChevronUp, Info, Table2,
} from "lucide-react"
import EstructuraPresupuestariaData from "./EstructuraPresupuestariaData"
import { useFiscalYear } from '../contexts/FiscalYearContext'

const CARD   = 'rgba(255,255,255,0.90)'
const BORDER = 'rgba(46,108,164,0.14)'
const BG     = '#f8fafd'
const ACCENT = '#2e6ca4'
const GREEN  = '#059669'
const RED    = '#b91c1c'
const TEXT   = '#1a3a5c'
const MUTED  = '#5a7a9f'

const ACCENT_COLORS = {
  blue: '#2e6ca4', teal: '#0891b2', green: '#059669', amber: '#d97706', red: '#b91c1c',
}

const CSV_COLS = [
  { n: 1,  name: 'Código Programa',    ejemplo: '28',                        tipo: 'Código' },
  { n: 2,  name: 'Nombre Programa',    ejemplo: 'GESTIÓN ADMINISTRATIVA',    tipo: 'Texto'  },
  { n: 3,  name: 'Código Subprograma', ejemplo: '01',                        tipo: 'Código' },
  { n: 4,  name: 'Nombre Subprograma', ejemplo: 'PLANIFICACIÓN',             tipo: 'Texto'  },
  { n: 5,  name: 'Código Proyecto',    ejemplo: '01',                        tipo: 'Código' },
  { n: 6,  name: 'Nombre Proyecto',    ejemplo: 'PROYECTO ADMINISTRATIVO',   tipo: 'Texto'  },
  { n: 7,  name: 'Código Actividad',   ejemplo: '8478',                      tipo: 'Código' },
  { n: 8,  name: 'Nombre Actividad',   ejemplo: 'ADMINISTRACIÓN FINANCIERA', tipo: 'Texto'  },
  { n: 9,  name: 'Código Ítem',        ejemplo: '510105',                    tipo: 'Código' },
  { n: 10, name: 'Nombre Ítem',        ejemplo: 'REMUNERACIONES UNIFICADAS', tipo: 'Texto'  },
  { n: 11, name: 'Código Ubicación',   ejemplo: '01',                        tipo: 'Código' },
  { n: 12, name: 'Nombre Ubicación',   ejemplo: 'ADMIN. CENTRAL',            tipo: 'Texto'  },
  { n: 13, name: 'Código Fuente',      ejemplo: '001',                       tipo: 'Código' },
  { n: 14, name: 'Nombre Fuente',      ejemplo: 'RECURSOS FISCALES',         tipo: 'Texto'  },
  { n: 15, name: 'Código Organismo',   ejemplo: '0000',                      tipo: 'Código' },
  { n: 16, name: 'Nombre Organismo',   ejemplo: 'NO APLICA',                 tipo: 'Texto'  },
  { n: 17, name: 'Código Naturaleza',  ejemplo: '01',                        tipo: 'Código' },
  { n: 18, name: 'Nombre Naturaleza',  ejemplo: 'ADMINISTRACIÓN',            tipo: 'Texto'  },
]

function SkeletonSummaryChips() {
  const widths = [160, 180, 150, 165, 120]
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {widths.map((w, i) => (
        <div key={i} className="skeleton" style={{ height: '34px', width: `${w}px`, borderRadius: '8px' }} />
      ))}
    </div>
  )
}

export default function EstructuraPresupuestaria() {
  const { token } = useAuth()
  const { isReadOnly, selectedCedula } = useFiscalYear()

  const [activeTab,      setActiveTab]      = useState('datos')
  const [file,           setFile]           = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [uploadResult,   setUploadResult]   = useState(null)
  const [summary,        setSummary]        = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [showCols,       setShowCols]       = useState(false)
  const [refreshKey,     setRefreshKey]     = useState(0)
  const [isMobile,       setIsMobile]       = useState(window.innerWidth < 768)

  useEffect(() => {
    if (token) fetchSummary()
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [token, selectedCedula])

  // Si cambia a solo lectura y está en upload, volver a datos
  useEffect(() => {
    if (isReadOnly) setActiveTab('datos')
  }, [isReadOnly])

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true)
      const cedulaParam = selectedCedula?.id_cedula_presupuestaria
        ? `?id_cedula_presupuestaria=${selectedCedula.id_cedula_presupuestaria}`
        : ''
      const res = await fetch(`${import.meta.env.VITE_API_URL}/estructura-presupuestaria/summary${cedulaParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.status === 'success' || data.success) setSummary(data.data || data)
    } catch { /* silent */ }
    finally { setSummaryLoading(false) }
  }

  const validateFile = (f) => {
    if (f?.name.endsWith('.csv')) { setFile(f); setError(null) }
    else { setError('Selecciona un archivo CSV válido'); setFile(null) }
  }

  const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) validateFile(f) }
  const handleDrop       = (e)  => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) validateFile(f) }

  const uploadFile = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true); setError(null)
    try {
      const formData = new FormData()
      formData.append('csv_file', file)
      if (selectedCedula?.id_cedula_presupuestaria)
        formData.append('id_cedula_presupuestaria', selectedCedula.id_cedula_presupuestaria)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/estructura-presupuestaria/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      })
      const data = await res.json()
      if (data.success || data.status === 'success') {
        setUploadResult(data.data || null); setFile(null); setShowCols(false)
        fetchSummary(); setRefreshKey(k => k + 1)
        setActiveTab('datos')
      } else { setError(data.message || 'Error al cargar el archivo') }
    } catch (err) { setError('Error: ' + (err instanceof Error ? err.message : 'Unknown error')) }
    finally { setLoading(false) }
  }

  const summaryItems = summary ? [
    { label: 'Programas',    value: summary.programas_count    || 0, icon: <BarChart3 size={14} />, color: ACCENT_COLORS.blue  },
    { label: 'Subprogramas', value: summary.subprogramas_count || 0, icon: <Layers size={14} />,    color: ACCENT_COLORS.teal  },
    { label: 'Proyectos',    value: summary.proyectos_count    || 0, icon: <GitBranch size={14} />, color: ACCENT_COLORS.amber },
    { label: 'Actividades',  value: summary.actividades_count  || 0, icon: <Activity size={14} />,  color: ACCENT_COLORS.green },
    { label: 'Ítems',        value: summary.items_count        || 0, icon: <Package size={14} />,   color: ACCENT_COLORS.red   },
  ] : []

  const P    = isMobile ? '20px' : '28px'
  const tabs = [
    { id: 'datos',  label: 'Datos de Estructura', icon: Table2  },
    ...(!isReadOnly ? [{ id: 'upload', label: 'Importar CSV', icon: Upload }] : []),
  ]

  return (
    <div style={{ minHeight: '100%', background: 'var(--page-bg)', fontFamily: 'var(--font-primary)' }}>

      {/* Sticky header with tabs */}
      <div style={{
        background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(26,58,92,0.08)',
        boxShadow: '0 2px 16px rgba(26,58,92,0.06)',
        padding: `20px ${P} 0`, position: 'sticky', top: 0, zIndex: 40,
      }}>
        {/* Title row */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(46,108,164,0.10)', border: '1px solid rgba(46,108,164,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color={ACCENT} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px', fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>
                Estructura Presupuestaria
              </h1>
              <p style={{ margin: 0, fontSize: '12px', color: MUTED }}>
                {isReadOnly
                  ? `Año fiscal ${selectedCedula?.anio} — Solo visualización`
                  : 'Importar y visualizar la estructura presupuestaria'}
              </p>
            </div>
          </div>
          {isReadOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, color: '#d97706' }}>
              <Lock size={13} /> Año {selectedCedula?.anio} — Solo lectura
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {tabs.map((tab, i) => {
            const active = activeTab === tab.id
            const Icon   = tab.icon
            return (
              <motion.button key={tab.id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '10px 18px', background: 'none', border: 'none',
                  borderBottom: active ? '2.5px solid #2e6ca4' : '2.5px solid transparent',
                  color: active ? '#1a3a5c' : MUTED,
                  cursor: 'pointer', fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  fontFamily: 'var(--font-primary)',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap', marginBottom: '-1px',
                }}
              >
                <span style={{ color: active ? ACCENT : 'inherit', display: 'flex' }}>
                  <Icon size={15} />
                </span>
                {tab.label}
                {active && (
                  <motion.div layoutId="estructura-tab-dot"
                    style={{ display: 'inline-flex', width: '6px', height: '6px', borderRadius: '50%', background: ACCENT, marginLeft: '2px' }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >

          {/* ── TAB: Datos ── */}
          {activeTab === 'datos' && (
            <div style={{ padding: P, display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Resultado de carga */}
              <AnimatePresence>
                {uploadResult && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.28)', borderRadius: '12px', padding: '16px 18px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: GREEN, fontWeight: 700, fontSize: '13px' }}>
                        <CheckCircle size={15} /> Carga completada
                      </div>
                      <button onClick={() => setUploadResult(null)} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', padding: 0 }}>
                        <X size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: '8px' }}>
                      {[
                        { label: 'Filas en CSV',        value: uploadResult.total_rows,   color: TEXT        },
                        { label: 'Procesadas',          value: uploadResult.processed,    color: ACCENT      },
                        { label: 'Nuevas (ítem+fuente)', value: uploadResult.inserted,   color: GREEN       },
                        { label: 'Ya en BD',            value: uploadResult.existing,    color: '#0891b2'   },
                        { label: 'Omitidas',            value: uploadResult.skipped ?? 0, color: '#b91c1c' },
                      ].map((s, i) => (
                        <div key={i} style={{ background: '#fff', border: `1px solid ${s.color}30`, borderLeft: `3px solid ${s.color}`, borderRadius: '8px', padding: '10px 12px' }}>
                          <p style={{ margin: '0 0 2px', fontSize: '11px', color: MUTED, fontWeight: 600 }}>{s.label}</p>
                          <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value ?? 0}</p>
                        </div>
                      ))}
                    </div>
                    {uploadResult.errors?.length > 0 && (
                      <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(185,28,28,0.06)', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filas omitidas ({uploadResult.errors.length})</p>
                        {uploadResult.errors.map((e, i) => (
                          <p key={i} style={{ margin: '2px 0', fontSize: '12px', color: '#7f1d1d' }}>Fila {e.row}: {e.error}</p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Summary cards */}
              {summaryLoading ? (
                <SkeletonSummaryChips />
              ) : summaryItems.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                >
                  {summaryItems.map((item, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${item.color}`, borderRadius: '8px', backdropFilter: 'blur(12px)', boxShadow: '0 1px 8px rgba(26,58,92,0.06)' }}
                    >
                      <span style={{ color: item.color, display: 'flex', opacity: 0.85 }}>
                        {item.icon}
                      </span>
                      <span style={{ fontSize: '11px', color: MUTED, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: item.color }}>{item.value.toLocaleString()}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Data table */}
              <EstructuraPresupuestariaData key={refreshKey} embedded />
            </div>
          )}

          {/* ── TAB: Upload ── */}
          {activeTab === 'upload' && !isReadOnly && (
            <div style={{ padding: P }}>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.22)', borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', color: RED, fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><AlertCircle size={14} /> {error}</div>
                    <button type="button" onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer' }}><X size={14} /></button>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={uploadFile}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px', alignItems: 'start' }}>

                  {/* LEFT — Guía de importación */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    {/* Header card */}
                    <div style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #2e6ca4 100%)', borderRadius: '16px', padding: '28px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                      <div style={{ position: 'absolute', bottom: '-30px', left: '20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                          <FileText size={24} color="#fff" />
                        </div>
                        <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#fff' }}>Importar Estructura</h2>
                        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                          Define la jerarquía completa: programas, subprogramas, proyectos, actividades e ítems presupuestarios.
                        </p>
                      </div>
                    </div>

                    {/* Steps */}
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(26,58,92,0.06)' }}>
                      <p style={{ margin: '0 0 16px', fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pasos a seguir</p>
                      {[
                        { n: '1', title: 'Prepara el archivo CSV',  desc: 'Usa punto y coma (;) como separador. La primera fila debe ser el encabezado.', color: ACCENT_COLORS.blue  },
                        { n: '2', title: 'Verifica las 18 columnas', desc: 'Revisa el formato requerido: programa, subprograma, proyecto, actividad, ítem, ubicación, fuente, organismo y naturaleza.', color: ACCENT_COLORS.teal  },
                        { n: '3', title: 'Sube el archivo',          desc: 'Al finalizar, serás redirigido automáticamente a la tabla de datos actualizada.', color: ACCENT_COLORS.green },
                      ].map(step => (
                        <div key={step.n} style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${step.color}18`, border: `2px solid ${step.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '13px', color: step.color }}>
                            {step.n}
                          </div>
                          <div>
                            <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 700, color: TEXT }}>{step.title}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: MUTED, lineHeight: 1.55 }}>{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Collapsible columns */}
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', overflow: 'hidden', backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(26,58,92,0.06)' }}>
                      <button type="button" onClick={() => setShowCols(v => !v)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-primary)' }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 700, color: TEXT, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(46,108,164,0.10)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={13} color={ACCENT} />
                          </span>
                          Formato de columnas del CSV
                          <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(46,108,164,0.10)', color: ACCENT, borderRadius: '999px', padding: '2px 8px' }}>18 cols</span>
                        </span>
                        {showCols ? <ChevronUp size={15} color={MUTED} /> : <ChevronDown size={15} color={MUTED} />}
                      </button>
                      <AnimatePresence initial={false}>
                        {showCols && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${BORDER}` }}>
                              <p style={{ margin: '14px 0 10px', fontSize: '11.5px', color: MUTED }}>
                                Separador: <code style={{ background: 'rgba(46,108,164,0.08)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>;</code> — La fila 1 es el encabezado y se omite automáticamente
                              </p>
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                                  <thead>
                                    <tr style={{ background: 'rgba(46,108,164,0.06)' }}>
                                      {['#', 'Columna', 'Tipo', 'Ejemplo'].map(h => (
                                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: TEXT, borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {CSV_COLS.map((col, i) => (
                                      <tr key={col.n} style={{ background: i % 2 === 0 ? '#fff' : 'rgba(46,108,164,0.02)' }}>
                                        <td style={{ padding: '6px 10px', color: MUTED, fontWeight: 600 }}>{col.n}</td>
                                        <td style={{ padding: '6px 10px', color: TEXT }}>{col.name}</td>
                                        <td style={{ padding: '6px 10px' }}>
                                          <span style={{ background: col.tipo === 'Código' ? 'rgba(217,119,6,0.10)' : 'rgba(46,108,164,0.08)', color: col.tipo === 'Código' ? '#d97706' : ACCENT, fontSize: '10px', fontWeight: 700, borderRadius: '4px', padding: '2px 7px' }}>
                                            {col.tipo}
                                          </span>
                                        </td>
                                        <td style={{ padding: '6px 10px', color: MUTED, fontStyle: 'italic', fontSize: '11px' }}>{col.ejemplo}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* RIGHT — Zona de carga */}
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: isMobile ? 'static' : 'sticky', top: '90px' }}
                  >
                    {/* Drop zone */}
                    <label htmlFor="estructura-csv"
                      onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                      onDragEnter={e => { e.currentTarget.style.background = 'rgba(46,108,164,0.10)'; e.currentTarget.style.borderColor = 'rgba(46,108,164,0.60)'; e.currentTarget.style.transform = 'scale(1.01)' }}
                      onDragLeave={e => { e.currentTarget.style.background = file ? 'rgba(5,150,105,0.05)' : 'rgba(46,108,164,0.03)'; e.currentTarget.style.borderColor = file ? 'rgba(5,150,105,0.35)' : 'rgba(46,108,164,0.22)'; e.currentTarget.style.transform = 'scale(1)' }}
                      style={{
                        border: `2px dashed ${file ? 'rgba(5,150,105,0.40)' : 'rgba(46,108,164,0.22)'}`,
                        borderRadius: '16px', minHeight: '260px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                        background: file ? 'rgba(5,150,105,0.05)' : 'rgba(46,108,164,0.03)',
                        cursor: 'pointer', transition: 'all 0.22s ease', padding: '32px 24px',
                        boxShadow: file ? '0 0 0 4px rgba(5,150,105,0.08)' : 'none',
                      }}
                      onMouseEnter={e => { if (!file) { e.currentTarget.style.background = 'rgba(46,108,164,0.07)'; e.currentTarget.style.borderColor = 'rgba(46,108,164,0.42)' }}}
                      onMouseLeave={e => { if (!file) { e.currentTarget.style.background = 'rgba(46,108,164,0.03)'; e.currentTarget.style.borderColor = 'rgba(46,108,164,0.22)' }}}
                    >
                      <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} id="estructura-csv" />
                      {file ? (
                        <>
                          <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'rgba(5,150,105,0.12)', border: '2px solid rgba(5,150,105,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={36} color={GREEN} />
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: GREEN }}>{file.name}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: MUTED }}>{(file.size / 1024).toFixed(1)} KB — Haz clic para cambiar</p>
                          </div>
                          <span style={{ fontSize: '11px', padding: '4px 12px', background: 'rgba(5,150,105,0.12)', color: GREEN, borderRadius: '999px', fontWeight: 700, border: '1px solid rgba(5,150,105,0.25)' }}>
                            Archivo listo para subir
                          </span>
                        </>
                      ) : (
                        <>
                          <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'rgba(46,108,164,0.10)', border: '1px solid rgba(46,108,164,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Upload size={34} color={ACCENT} />
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: TEXT }}>Arrastra tu archivo CSV aquí</p>
                            <p style={{ margin: 0, fontSize: '13px', color: MUTED }}>o haz clic para buscarlo en tu equipo</p>
                          </div>
                          <span style={{ fontSize: '11px', padding: '4px 12px', background: 'rgba(46,108,164,0.08)', color: ACCENT, borderRadius: '999px', fontWeight: 600, border: '1px solid rgba(46,108,164,0.18)' }}>
                            Solo archivos .csv
                          </span>
                        </>
                      )}
                    </label>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <motion.button
                        whileHover={file && !loading ? { scale: 1.015, boxShadow: '0 8px 28px rgba(26,58,92,0.32)' } : {}}
                        whileTap={file && !loading ? { scale: 0.985 } : {}}
                        type="submit" disabled={!file || loading}
                        style={{
                          width: '100%', padding: '14px',
                          background: (!file || loading) ? 'rgba(26,58,92,0.07)' : 'linear-gradient(135deg, #1a3a5c 0%, #2e6ca4 100%)',
                          color: (!file || loading) ? MUTED : '#fff',
                          border: 'none', borderRadius: '12px',
                          cursor: (!file || loading) ? 'not-allowed' : 'pointer',
                          fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-primary)',
                          opacity: (!file || loading) ? 0.65 : 1,
                          boxShadow: (!file || loading) ? 'none' : '0 4px 18px rgba(26,58,92,0.28)',
                          transition: 'all 0.2s ease',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        }}
                      >
                        {loading
                          ? <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Subiendo archivo...</>
                          : <><Upload size={16} /> Subir Estructura Presupuestaria</>
                        }
                      </motion.button>
                      {file && (
                        <button type="button"
                          onClick={() => { setFile(null); setError(null) }}
                          style={{ width: '100%', padding: '11px', background: 'none', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-primary)', fontWeight: 600, transition: 'all 0.18s ease' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,58,92,0.05)'; e.currentTarget.style.color = TEXT }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = MUTED }}
                        >
                          Limpiar selección
                        </button>
                      )}
                    </div>

                  </motion.div>
                </div>
              </form>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
