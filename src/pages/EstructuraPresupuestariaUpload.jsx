import { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, AlertCircle, BarChart3, Layers, GitBranch, Activity, Package, X, Lock } from "lucide-react"
import { useFiscalYear } from '../contexts/FiscalYearContext'

const CARD   = 'rgba(255,255,255,0.90)'
const BORDER = 'rgba(46,108,164,0.14)'
const BG     = '#f8fafd'
const ACCENT = '#2e6ca4'
const GREEN  = '#059669'
const RED    = '#b91c1c'
const GOLD   = '#d97706'
const TEXT   = '#1a3a5c'
const MUTED  = '#5a7a9f'

const ACCENT_COLORS = {
  blue: '#2e6ca4', teal: '#0891b2', green: '#059669', amber: '#d97706', red: '#b91c1c',
}

export default function EstructuraPresupuestariaUpload() {
  const { token } = useAuth()
  const { isReadOnly, selectedCedula } = useFiscalYear()
  const [file,           setFile]           = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [uploadResult,   setUploadResult]   = useState(null)
  const [summary,        setSummary]        = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [isMobile,       setIsMobile]       = useState(window.innerWidth < 768)

  useEffect(() => {
    if (token) fetchSummary()
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [token])

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/estructura-presupuestaria/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.status === 'success' || data.success) setSummary(data.data || data)
    } catch { /* silent */ }
    finally { setSummaryLoading(false) }
  }

  const validateFile = (f) => {
    if (f && f.name.endsWith('.csv')) { setFile(f); setError(null); return true }
    setError('Por favor selecciona un archivo CSV válido'); setFile(null); return false
  }

  const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) validateFile(f) }

  const uploadFile = async (fileToUpload) => {
    setLoading(true); setError(null); setUploadResult(null)
    try {
      const formData = new FormData()
      formData.append('csv_file', fileToUpload)
      if (selectedCedula?.id_cedula_presupuestaria) {
        formData.append('id_cedula_presupuestaria', selectedCedula.id_cedula_presupuestaria)
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/estructura-presupuestaria/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (data.success || data.status === 'success') {
        setUploadResult(data.data || null); setFile(null); setShowUploadForm(false)
        fetchSummary()
      } else { setError(data.message || 'Error al cargar el archivo') }
    } catch (err) { setError('Error: ' + (err instanceof Error ? err.message : 'Unknown error')) }
    finally { setLoading(false) }
  }

  const handleUpload = (e) => { e.preventDefault(); if (file) uploadFile(file) }

  const P = isMobile ? '20px' : '28px'
  const summaryItems = summary ? [
    { label: 'Programas',    value: summary.programas_count    || 0, icon: <BarChart3 size={20} />, color: ACCENT_COLORS.blue  },
    { label: 'Subprogramas', value: summary.subprogramas_count || 0, icon: <Layers size={20} />,    color: ACCENT_COLORS.teal  },
    { label: 'Proyectos',    value: summary.proyectos_count    || 0, icon: <GitBranch size={20} />, color: ACCENT_COLORS.amber },
    { label: 'Actividades',  value: summary.actividades_count  || 0, icon: <Activity size={20} />,  color: ACCENT_COLORS.green },
    { label: 'Items',        value: summary.items_count        || 0, icon: <Package size={20} />,   color: ACCENT_COLORS.red   },
  ] : []

  return (
    <div style={{ minHeight: '100%', background: 'var(--page-bg)', padding: P, fontFamily: 'var(--font-primary)' }}>

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '20px', fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>
          Cargar Estructura Presupuestaria
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: MUTED }}>Importar datos presupuestarios desde archivo CSV</p>
      </motion.div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.22)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: RED, fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><AlertCircle size={14} /> {error}</div>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer' }}><X size={14} /></button>
          </motion.div>
        )}
        {uploadResult && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.28)', borderRadius: '12px', padding: '16px 18px', marginBottom: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: GREEN, fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>
                <CheckCircle size={15} /> Carga completada
              </div>
              <button onClick={() => setUploadResult(null)} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', padding: 0 }}><X size={14} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: '8px' }}>
              {[
                { label: 'Filas en CSV',      value: uploadResult.total_rows,           color: TEXT   },
                { label: 'Procesadas',         value: uploadResult.processed,            color: ACCENT },
                { label: 'Nuevas insertadas',  value: uploadResult.inserted,             color: GREEN  },
                { label: 'Ya existían',        value: uploadResult.existing,             color: '#0891b2' },
                { label: 'Omitidas',           value: uploadResult.skipped ?? 0,         color: RED    },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${s.color}30`, borderLeft: `3px solid ${s.color}`, borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: MUTED, fontWeight: 600 }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
            {uploadResult.errors?.length > 0 && (
              <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(185,28,28,0.06)', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Detalle de errores</p>
                {uploadResult.errors.map((e, i) => (
                  <p key={i} style={{ margin: '2px 0', fontSize: '12px', color: '#7f1d1d' }}>Fila {e.row}: {e.error}</p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: CARD, border: `1px solid ${isReadOnly ? 'rgba(217,119,6,0.25)' : BORDER}`, borderRadius: '16px', padding: '28px', marginBottom: '20px', backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(26,58,92,0.10)' }}
      >
        <AnimatePresence mode="wait">
          {isReadOnly ? (
            <motion.div key="readonly" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '16px 0' }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Lock size={28} color="#d97706" />
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#d97706' }}>Año {selectedCedula?.anio} — Solo lectura</h2>
              <p style={{ fontSize: '13px', color: MUTED, maxWidth: '380px', margin: '0 auto' }}>
                No se puede cargar una nueva estructura presupuestaria para un año fiscal anterior. Solo es posible visualizar los datos ya registrados.
              </p>
            </motion.div>
          ) : !showUploadForm ? (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '12px 0' }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(46,108,164,0.10)', border: '1px solid rgba(46,108,164,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Upload size={28} color={ACCENT} />
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: TEXT }}>Importar Archivo CSV</h2>
              <p style={{ margin: '0 0 24px', fontSize: '13px', color: MUTED }}>Carga un archivo CSV con la estructura presupuestaria completa</p>
              <motion.button whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(26,58,92,0.30)' }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowUploadForm(true)}
                style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', boxShadow: '0 4px 16px rgba(26,58,92,0.25)' }}
              >
                Seleccionar Archivo
              </motion.button>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <label htmlFor="file-input"
                style={{ border: `2px dashed rgba(46,108,164,0.35)`, borderRadius: '12px', padding: '32px 20px', textAlign: 'center', background: 'rgba(46,108,164,0.05)', cursor: 'pointer', display: 'block', transition: 'all 0.18s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(46,108,164,0.08)'; e.currentTarget.style.borderColor = 'rgba(46,108,164,0.55)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(46,108,164,0.05)'; e.currentTarget.style.borderColor = 'rgba(46,108,164,0.35)' }}
              >
                <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} id="file-input" />
                <FileText size={36} style={{ color: ACCENT, margin: '0 auto 12px', display: 'block' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: file ? TEXT : MUTED }}>
                  {file ? file.name : 'Haz clic para seleccionar un archivo CSV'}
                </p>
                {!file && <p style={{ margin: '6px 0 0', fontSize: '12px', color: MUTED }}>Solo archivos .csv</p>}
                {file && <p style={{ margin: '6px 0 0', fontSize: '12px', color: GREEN }}>✓ Archivo seleccionado</p>}
              </label>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <motion.button whileHover={file && !loading ? { scale: 1.02, boxShadow: '0 8px 24px rgba(26,58,92,0.30)' } : {}} whileTap={file && !loading ? { scale: 0.98 } : {}}
                  type="submit" disabled={!file || loading}
                  style={{ padding: '10px 24px', background: (!file || loading) ? 'rgba(26,58,92,0.08)' : 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: (!file || loading) ? MUTED : '#fff', border: 'none', borderRadius: '10px', cursor: (!file || loading) ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', opacity: (!file || loading) ? 0.7 : 1, boxShadow: (!file || loading) ? 'none' : '0 4px 16px rgba(26,58,92,0.25)', transition: 'all 0.18s ease' }}
                >
                  {loading ? 'Cargando...' : 'Subir Archivo'}
                </motion.button>
                <button type="button" onClick={() => { setShowUploadForm(false); setFile(null); setError(null) }}
                  style={{ padding: '10px 20px', background: 'rgba(26,58,92,0.06)', color: MUTED, border: '1px solid rgba(26,58,92,0.12)', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-primary)', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.color = TEXT }}
                  onMouseLeave={e => { e.currentTarget.style.color = MUTED }}
                >
                  Cancelar
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Summary */}
      {summaryLoading ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px', textAlign: 'center', color: MUTED, fontSize: '13px', backdropFilter: 'blur(12px)' }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid rgba(46,108,164,0.15)', borderTopColor: ACCENT, borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.8s linear infinite' }} />
          Cargando resumen...
        </div>
      ) : summaryItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '22px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}
        >
          <p style={{ margin: '0 0 16px', fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Resumen de Datos Cargados
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: '10px' }}>
            {summaryItems.map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}
                style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px', textAlign: 'center', borderTop: `3px solid ${item.color}` }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: item.color }}>
                  {item.icon}
                </div>
                <p style={{ margin: '0 0 4px', fontSize: '11px', color: MUTED, fontWeight: 600 }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: TEXT }}>{item.value.toLocaleString()}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
