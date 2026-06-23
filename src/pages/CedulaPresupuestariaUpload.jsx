import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Cookies from "js-cookie"
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, AlertCircle, FileSpreadsheet, List, DollarSign, X, AlertTriangle, ArrowRight } from "lucide-react"
import { useFiscalYear } from "../contexts/FiscalYearContext"

const CARD   = 'rgba(255,255,255,0.90)'
const BORDER = 'rgba(46,108,164,0.14)'
const BG     = '#f8fafd'
const ACCENT = '#2e6ca4'
const GREEN  = '#059669'
const RED    = '#b91c1c'
const GOLD   = '#d97706'
const TEXT   = '#1a3a5c'
const MUTED  = '#5a7a9f'

export default function CedulaPresupuestariaUpload() {
  const navigate = useNavigate()
  const { selectedCedula } = useFiscalYear()
  const [file,              setFile]              = useState(null)
  const [loading,           setLoading]           = useState(false)
  const [error,             setError]             = useState(null)
  const [uploadResult,      setUploadResult]      = useState(null)
  const [summary,           setSummary]           = useState(null)
  const [showUploadForm,    setShowUploadForm]    = useState(false)
  const [estructuraItems,   setEstructuraItems]   = useState(null)  // null = cargando, 0 = sin estructura
  const [isMobile,          setIsMobile]          = useState(window.innerWidth < 768)

  const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

  useEffect(() => {
    fetchEstructuraCheck()
    fetchSummary()
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const fetchEstructuraCheck = async () => {
    try {
      const token = Cookies.get("auth_token")
      const res  = await fetch(`${API}/estructura-presupuestaria/summary`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setEstructuraItems((data.success || data.status === 'success') ? (data.data?.items_count ?? 0) : 0)
    } catch { setEstructuraItems(0) }
  }

  const fetchSummary = async () => {
    try {
      const token = Cookies.get("auth_token")
      const res  = await fetch(`${API}/cedula-presupuestaria/summary`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) setSummary(data.data)
    } catch { /* silent */ }
  }

  const validateFile = (f) => {
    if (f && f.name.endsWith('.csv')) { setFile(f); setError(null); return true }
    setError('Por favor selecciona un archivo CSV válido'); setFile(null); return false
  }

  const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) validateFile(f) }

  const uploadFile = async (fileToUpload) => {
    setLoading(true); setError(null)
    try {
      const formData = new FormData()
      formData.append('csv_file', fileToUpload)
      if (selectedCedula?.id_cedula_presupuestaria) {
        formData.append('id_cedula_presupuestaria', selectedCedula.id_cedula_presupuestaria)
      }
      const token = Cookies.get("auth_token")
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/cedula-presupuestaria/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setUploadResult(data.data || null); setFile(null); setShowUploadForm(false)
        fetchSummary()
      } else { setError(data.message || 'Error al cargar el archivo') }
    } catch (err) { setError('Error: ' + (err instanceof Error ? err.message : 'Unknown error')) }
    finally { setLoading(false) }
  }

  const handleUpload = (e) => { e.preventDefault(); if (file) uploadFile(file) }

  const P = isMobile ? '20px' : '28px'
  const summaryItems = summary ? [
    { label: 'Registros',       value: summary.registros_count      || 0, icon: <List size={20} />,            color: ACCENT },
    { label: 'Certificaciones', value: summary.certificaciones_count || 0, icon: <FileSpreadsheet size={20} />, color: GREEN  },
    { label: 'Monto Total',     value: '$' + (summary.monto_total   || 0), icon: <DollarSign size={20} />,      color: GOLD   },
  ] : []

  return (
    <div style={{ minHeight: '100%', background: 'var(--page-bg)', padding: P, fontFamily: 'var(--font-primary)' }}>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '20px', fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>
          Cargar Cédula Presupuestaria
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: MUTED }}>Importar datos desde archivo CSV</p>
      </motion.div>

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
                { label: 'Procesadas',         value: uploadResult.processed_count,      color: ACCENT },
                { label: 'Nuevas insertadas',  value: uploadResult.insert_count,         color: GREEN  },
                { label: 'Actualizadas',       value: uploadResult.update_count,         color: '#0891b2' },
                { label: 'Omitidas',           value: uploadResult.skipped ?? 0,         color: RED    },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${s.color}30`, borderLeft: `3px solid ${s.color}`, borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: MUTED, fontWeight: 600 }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value ?? 0}</p>
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

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: CARD, border: `1px solid ${estructuraItems === 0 ? 'rgba(217,119,6,0.35)' : BORDER}`, borderRadius: '16px', padding: '28px', marginBottom: '20px', backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(26,58,92,0.10)' }}
      >
        <AnimatePresence mode="wait">
          {/* Bloqueo: sin estructura cargada */}
          {estructuraItems === 0 ? (
            <motion.div key="blocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <AlertTriangle size={28} color={GOLD} />
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: GOLD }}>Requisito previo incompleto</h2>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: TEXT, fontWeight: 600 }}>
                No existe Estructura Presupuestaria cargada.
              </p>
              <p style={{ fontSize: '13px', color: MUTED, maxWidth: '400px', margin: '0 auto 24px' }}>
                Debe importar primero el CSV de Estructura Presupuestaria para que el sistema pueda validar actividades, fuentes, ubicaciones e ítems de la cédula.
              </p>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/dashboard/estructura-presupuestaria')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'linear-gradient(135deg, #92400e, #d97706)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', boxShadow: '0 4px 16px rgba(217,119,6,0.30)' }}
              >
                Ir a Estructura Presupuestaria <ArrowRight size={15} />
              </motion.button>
            </motion.div>
          ) : estructuraItems === null ? (
            /* Cargando verificación */
            <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '24px 0', color: MUTED, fontSize: '13px' }}>
              <div style={{ width: '28px', height: '28px', border: '3px solid rgba(46,108,164,0.15)', borderTopColor: ACCENT, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
              Verificando estructura presupuestaria...
            </motion.div>
          ) : !showUploadForm ? (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '12px 0' }}>
              {/* Badge de estructura OK */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.25)', borderRadius: '20px', padding: '4px 12px', marginBottom: '18px', fontSize: '12px', color: GREEN, fontWeight: 600 }}>
                <CheckCircle size={12} /> Estructura cargada — {estructuraItems.toLocaleString()} ítems disponibles
              </div>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(46,108,164,0.10)', border: '1px solid rgba(46,108,164,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Upload size={28} color={ACCENT} />
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: TEXT }}>Importar Archivo CSV</h2>
              <p style={{ margin: '0 0 24px', fontSize: '13px', color: MUTED }}>Carga un archivo CSV con la cédula presupuestaria</p>
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
              <label htmlFor="cedula-file-input"
                style={{ border: '2px dashed rgba(46,108,164,0.35)', borderRadius: '12px', padding: '32px 20px', textAlign: 'center', background: 'rgba(46,108,164,0.05)', cursor: 'pointer', display: 'block', transition: 'all 0.18s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(46,108,164,0.08)'; e.currentTarget.style.borderColor = 'rgba(46,108,164,0.55)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(46,108,164,0.05)'; e.currentTarget.style.borderColor = 'rgba(46,108,164,0.35)' }}
              >
                <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} id="cedula-file-input" />
                <FileText size={36} style={{ color: ACCENT, margin: '0 auto 12px', display: 'block' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: file ? TEXT : MUTED }}>
                  {file ? file.name : 'Haz clic para seleccionar un archivo CSV'}
                </p>
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
                  style={{ padding: '10px 20px', background: 'rgba(26,58,92,0.06)', color: MUTED, border: '1px solid rgba(26,58,92,0.12)', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-primary)' }}
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

      {summary && summaryItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '22px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}
        >
          <p style={{ margin: '0 0 16px', fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Resumen Actual</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '10px' }}>
            {summaryItems.map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.06 }}
                style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '18px', textAlign: 'center', borderTop: `3px solid ${item.color}` }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: item.color }}>
                  {item.icon}
                </div>
                <p style={{ margin: '0 0 4px', fontSize: '11px', color: MUTED, fontWeight: 600 }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: TEXT }}>{item.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
