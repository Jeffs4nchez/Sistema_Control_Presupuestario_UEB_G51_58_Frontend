import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from 'react-router-dom'
import Cookies from "js-cookie"
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart2, Upload, CheckCircle, AlertCircle,
  X, Lock, ChevronDown, ChevronUp, FileText,
  PieChart, Search, RefreshCw, AlertTriangle, CheckCircle2, ArrowRight,
} from 'lucide-react'
import { useFiscalYear } from '../contexts/FiscalYearContext'
import { useAuth } from '../contexts/AuthContext'
import { can } from '../utils/permissions'

const CARD   = 'rgba(255,255,255,0.90)'
const BORDER = 'rgba(46,108,164,0.14)'
const ACCENT = '#2e6ca4'
const GREEN  = '#059669'
const RED    = '#b91c1c'
const TEXT   = '#1a3a5c'
const MUTED  = '#5a7a9f'

const ACCENT_COLORS = {
  blue: '#2e6ca4', teal: '#0891b2', green: '#059669', amber: '#d97706', red: '#b91c1c',
}

const PD_INPUT = {
  padding: '8px 11px', background: '#f8fafd',
  border: '1px solid rgba(46,108,164,0.22)',
  borderRadius: '8px', color: '#1a3a5c', fontSize: '13px',
  fontFamily: 'var(--font-primary)', outline: 'none',
  width: '100%', boxSizing: 'border-box',
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
}

const PD_LABEL = {
  display: 'block', fontSize: '10px', fontWeight: 700,
  color: '#5a7a9f', marginBottom: '5px',
  textTransform: 'uppercase', letterSpacing: '0.07em',
}

function fmt(v) {
  const n = parseFloat(v) || 0
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}

function SaldoBar({ codificado, certificado }) {
  const pct   = codificado > 0 ? Math.min(100, (certificado / codificado) * 100) : 0
  const color = pct >= 100 ? '#b91c1c' : pct >= 75 ? '#d97706' : '#059669'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
      <div style={{ flex: 1, height: '5px', background: 'rgba(26,58,92,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: color, borderRadius: '3px',
          width: `${pct}%`, transition: 'width 1s ease-out',
        }} />
      </div>
      <span style={{ fontSize: '10px', color, fontWeight: 700, width: '28px', flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

const CSV_COLS = [
  { n: 1,  name: 'Descripción Programa',     tipo: 'Texto',    req: true,  ejemplo: 'ADMINISTRACION CENTRAL'      },
  { n: 2,  name: 'Descripción Subprograma',  tipo: 'Texto',    req: true,  ejemplo: 'SIN SUBPROGRAMA'             },
  { n: 3,  name: 'Descripción Proyecto',     tipo: 'Texto',    req: true,  ejemplo: 'SIN PROYECTO'                },
  { n: 4,  name: 'Descripción Actividad',    tipo: 'Texto',    req: true,  ejemplo: 'ADMINISTRACION DE LA GESTION'},
  { n: 5,  name: 'Descripción Ítem',         tipo: 'Texto',    req: true,  ejemplo: 'Decimo Cuarto Sueldo'        },
  { n: 6,  name: 'Descripción Ubicación',    tipo: 'Texto',    req: true,  ejemplo: 'BOLIVAR'                     },
  { n: 7,  name: 'Descripción Fuente',       tipo: 'Texto',    req: true,  ejemplo: 'Recursos Provenientes...'    },
  { n: 8,  name: 'Descripción Organismo',    tipo: 'Texto',    req: true,  ejemplo: 'SIN ORGANISMO'               },
  { n: 9,  name: 'Descripción N Prestación', tipo: 'Texto',    req: true,  ejemplo: 'SIN N PRESTACION'            },
  { n: 10, name: 'Asignado (COL1)',          tipo: 'Numérico', req: true,  ejemplo: '93060'                       },
  { n: 11, name: 'Modificado (COL2)',        tipo: 'Numérico', req: true,  ejemplo: '17748'                       },
  { n: 12, name: 'Codificado (COL3)',        tipo: '—',        req: false, ejemplo: '110808'                      },
  { n: 13, name: 'Certificado (COL4)',        tipo: '—',        req: false, ejemplo: '0'                           },
  { n: 14, name: 'Comprometido (COL5)',      tipo: 'Numérico', req: true,  ejemplo: '17332,02'                    },
  { n: 15, name: 'Devengado (COL6)',         tipo: 'Numérico', req: true,  ejemplo: '17332,02'                    },
  { n: 16, name: 'Pagado (COL7)',            tipo: 'Numérico', req: true,  ejemplo: '17332,02'                    },
  { n: 17, name: 'Por Comprometer (COL8)',   tipo: 'Numérico', req: true,  ejemplo: '93475,98'                    },
  { n: 18, name: 'Por Devengar (COL9)',      tipo: 'Numérico', req: true,  ejemplo: '93475,98'                    },
  { n: 19, name: 'Por Pagar (COL10)',        tipo: 'Numérico', req: true,  ejemplo: '0'                           },
  { n: 20, name: 'Porcentaje (COL20)',       tipo: '—',        req: false, ejemplo: '15,64'                       },
  { n: 21, name: 'Código Programa',          tipo: 'Código',   req: true,  ejemplo: '01'                          },
  { n: 22, name: 'Código Subprograma',       tipo: 'Código',   req: true,  ejemplo: '01 00'                       },
  { n: 23, name: 'Código Proyecto',          tipo: 'Código',   req: true,  ejemplo: '01 00 000'                   },
  { n: 24, name: 'Código Actividad',         tipo: 'Código',   req: true,  ejemplo: '01 00 000 001'               },
  { n: 25, name: 'Código Ítem',              tipo: 'Código',   req: true,  ejemplo: '510204'                      },
  { n: 26, name: 'Código Ubicación',         tipo: 'Código',   req: true,  ejemplo: '0200'                        },
  { n: 27, name: 'Código Fuente',            tipo: 'Código',   req: true,  ejemplo: '003'                         },
  { n: 28, name: 'Código Organismo',         tipo: 'Código',   req: true,  ejemplo: '0000'                        },
  { n: 29, name: 'Código N Prestación',      tipo: 'Código',   req: true,  ejemplo: '0000'                        },
]

function SkeletonPdCards({ isMobile }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: '12px' }}>
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(46,108,164,0.14)', borderRadius: '14px', padding: '16px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}>
          <div className="skeleton" style={{ width: '70px', height: '10px', borderRadius: '5px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '8px' }} />
        </div>
      ))}
    </div>
  )
}

function SkeletonPdRows() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#f0f4f8', borderBottom: '2px solid rgba(26,58,92,0.08)' }}>
            {['#', 'Código', 'Nombre Ítem', 'Prg.', 'Act.', 'Fte.', 'Codificado', 'Certificado', 'Saldo', 'Avance', ''].map((h, i) => (
              <th key={i} style={{ padding: '9px 6px', textAlign: i >= 6 && i <= 8 ? 'right' : 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(26,58,92,0.07)' }}>
              <td style={{ padding: '9px 6px', textAlign: 'center' }}><div className="skeleton" style={{ width: '16px', height: '12px', borderRadius: '4px', margin: '0 auto' }} /></td>
              <td style={{ padding: '9px 6px' }}><div className="skeleton" style={{ width: '55px', height: '13px', borderRadius: '4px' }} /></td>
              <td style={{ padding: '9px 6px' }}><div className="skeleton" style={{ width: '140px', height: '13px', borderRadius: '6px' }} /></td>
              <td style={{ padding: '9px 5px' }}><div className="skeleton" style={{ width: '24px', height: '12px', borderRadius: '4px' }} /></td>
              <td style={{ padding: '9px 5px' }}><div className="skeleton" style={{ width: '30px', height: '12px', borderRadius: '4px' }} /></td>
              <td style={{ padding: '9px 5px' }}><div className="skeleton" style={{ width: '24px', height: '12px', borderRadius: '4px' }} /></td>
              <td style={{ padding: '9px 6px', textAlign: 'right' }}><div className="skeleton" style={{ width: '70px', height: '12px', borderRadius: '4px', marginLeft: 'auto' }} /></td>
              <td style={{ padding: '9px 6px', textAlign: 'right' }}><div className="skeleton" style={{ width: '70px', height: '12px', borderRadius: '4px', marginLeft: 'auto' }} /></td>
              <td style={{ padding: '9px 6px', textAlign: 'right' }}><div className="skeleton" style={{ width: '70px', height: '12px', borderRadius: '4px', marginLeft: 'auto' }} /></td>
              <td style={{ padding: '9px 6px' }}><div className="skeleton" style={{ width: '80px', height: '5px', borderRadius: '3px' }} /></td>
              <td style={{ padding: '9px 4px', textAlign: 'center' }}><div className="skeleton" style={{ width: '14px', height: '14px', borderRadius: '50%', margin: '0 auto' }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CedulaPresupuestaria() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const fromCert  = location.state?.certId     || null
  const fromLabel = location.state?.numeroCert || null
  const { isReadOnly, selectedCedula, loading: fiscalLoading, refetchCedulas } = useFiscalYear()
  const { user } = useAuth()
  const puedeCargar = can.verEstructura(user)

  const [activeTab,       setActiveTab]       = useState('datos')
  const [highlightKeys,   setHighlightKeys]   = useState(new Set())
  const [file,            setFile]            = useState(null)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState(null)
  const [uploadResult,    setUploadResult]    = useState(null)
  const [showCols,        setShowCols]        = useState(false)
  const [isMobile,        setIsMobile]        = useState(window.innerWidth < 768)

  // Presupuesto Disponible state
  const [pdItems,           setPdItems]           = useState([])
  const [pdTotales,         setPdTotales]         = useState(null)
  const [pdLoading,         setPdLoading]         = useState(false)
  const [pdSearch,          setPdSearch]          = useState('')
  const [pdShowSuggestions, setPdShowSuggestions] = useState(false)
  const [pdPrograma,        setPdPrograma]        = useState('')
  const [pdShowProg,        setPdShowProg]        = useState(false)
  const [pdActividad,       setPdActividad]       = useState('')
  const [pdShowAct,         setPdShowAct]         = useState(false)
  const [pdFuente,          setPdFuente]          = useState('')
  const [pdShowFte,         setPdShowFte]         = useState(false)
  const searchRef   = useRef(null)
  const progRef     = useRef(null)
  const actRef      = useRef(null)
  const fteRef      = useRef(null)
  const allItemsRef = useRef([])

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setPdShowSuggestions(false)
      if (progRef.current   && !progRef.current.contains(e.target))   setPdShowProg(false)
      if (actRef.current    && !actRef.current.contains(e.target))    setPdShowAct(false)
      if (fteRef.current    && !fteRef.current.contains(e.target))    setPdShowFte(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Volver a datos si cambia a solo lectura
  useEffect(() => {
    if (isReadOnly) setActiveTab('datos')
  }, [isReadOnly])

  // Cargar ítems del certificado para resaltar filas
  useEffect(() => {
    if (!fromCert) { setHighlightKeys(new Set()); return }
    const token = Cookies.get('auth_token')
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/certificacion/${fromCert}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.items) {
          setHighlightKeys(new Set(json.data.items.map(i => `${i.id_item}_${i.id_fuente}`)))
        }
      })
      .catch(() => {})
  }, [fromCert])

  // Cargar datos al montar y cuando cambia la cédula seleccionada
  useEffect(() => {
    fetchPresupuesto()
  }, [selectedCedula?.id_cedula_presupuestaria])

  // Filtrado en el cliente — sin llamada API, instantáneo
  const filterClientSide = (search, programa, actividad, fuente, source) => {
    const data = source ?? allItemsRef.current
    if (!data.length) return
    let items = data
    if (search.trim()) {
      const s = search.trim()
      if (/^\d+$/.test(s)) {
        items = items.filter(i => i.cod_item?.includes(s))
      } else {
        items = items.filter(i => i.nombre_item?.toLowerCase().includes(s.toLowerCase()))
      }
    }
    if (programa)  items = items.filter(i => i.cod_programa?.includes(programa))
    if (actividad) items = items.filter(i => i.cod_actividad?.includes(actividad))
    if (fuente)    items = items.filter(i => i.cod_fuente?.includes(fuente))
    setPdItems(items)
    setPdTotales({
      total_items:       items.length,
      total_codificado:  Math.round(items.reduce((s, i) => s + i.codificado,  0) * 100) / 100,
      total_certificado: Math.round(items.reduce((s, i) => s + i.certificado, 0) * 100) / 100,
      total_liquidado:   Math.round(items.reduce((s, i) => s + i.liquidado,   0) * 100) / 100,
      total_saldo:       Math.round(items.reduce((s, i) => s + i.saldo,       0) * 100) / 100,
      items_sin_saldo:   items.filter(i => i.sin_saldo).length,
    })
  }

  useEffect(() => {
    filterClientSide(pdSearch, pdPrograma, pdActividad, pdFuente)
  }, [pdSearch, pdPrograma, pdActividad, pdFuente])

  const fetchPresupuesto = async () => {
    setPdLoading(true)
    try {
      const qp = {}
      if (selectedCedula) qp.id_cedula_presupuestaria = selectedCedula.id_cedula_presupuestaria
      const q     = new URLSearchParams(qp).toString()
      const token = Cookies.get('auth_token')
      const res   = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/presupuesto-disponible?${q}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const json = await res.json()
      if (json.success) {
        allItemsRef.current = json.data
        filterClientSide(pdSearch, pdPrograma, pdActividad, pdFuente, json.data)
      }
    } catch { /* silent */ }
    finally { setPdLoading(false) }
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
      const token = Cookies.get('auth_token')
      const formData = new FormData()
      formData.append('csv_file', file)
      if (selectedCedula?.id_cedula_presupuestaria) {
        formData.append('id_cedula_presupuestaria', selectedCedula.id_cedula_presupuestaria)
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/cedula-presupuestaria/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setUploadResult(data.data || null); setFile(null); setShowCols(false)
        fetchPresupuesto()
        refetchCedulas()
        setActiveTab('datos')
      } else { setError(data.message || 'Error al cargar el archivo') }
    } catch (err) { setError('Error: ' + (err instanceof Error ? err.message : 'Unknown error')) }
    finally { setLoading(false) }
  }

  const P    = isMobile ? '20px' : '28px'
  const tabs = [
    { id: 'datos',  label: 'Ver Datos',    icon: PieChart },
    ...(!isReadOnly && puedeCargar ? [{ id: 'upload', label: 'Cargar Datos', icon: Upload }] : []),
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
              <BarChart2 size={18} color={ACCENT} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px', fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>
                Cédula Presupuestaria
              </h1>
              <p style={{ margin: 0, fontSize: '12px', color: MUTED }}>
                {isReadOnly
                  ? `Año fiscal ${selectedCedula?.anio} — Solo visualización`
                  : 'Cargar y visualizar datos de la cédula presupuestaria'}
              </p>
            </div>
          </div>
          {isReadOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, color: '#d97706' }}>
              <Lock size={13} /> Año {selectedCedula?.anio} — No se puede cargar datos
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
                  <motion.div layoutId="cedula-tab-dot"
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
            <div style={{ padding: P, display: 'flex', flexDirection: 'column', gap: '16px' }}>

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
                        { label: 'Filas en CSV',     value: uploadResult.total_rows,      color: TEXT      },
                        { label: 'Procesadas',        value: uploadResult.processed_count, color: ACCENT    },
                        { label: 'Nuevas',            value: uploadResult.insert_count,    color: GREEN     },
                        { label: 'Actualizadas',      value: uploadResult.update_count,    color: '#0891b2' },
                        { label: 'Omitidas',          value: uploadResult.skipped ?? 0,    color: RED       },
                      ].map((s, i) => (
                        <div key={i} style={{ background: '#fff', border: `1px solid ${s.color}30`, borderLeft: `3px solid ${s.color}`, borderRadius: '8px', padding: '10px 12px' }}>
                          <p style={{ margin: '0 0 2px', fontSize: '11px', color: MUTED, fontWeight: 600 }}>{s.label}</p>
                          <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value ?? 0}</p>
                        </div>
                      ))}
                    </div>
                    {uploadResult.errors?.length > 0 && (
                      <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(185,28,28,0.06)', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filas omitidas ({uploadResult.errors.length})</p>
                        {uploadResult.errors.map((e, i) => (
                          <p key={i} style={{ margin: '2px 0', fontSize: '12px', color: '#7f1d1d' }}>Fila {e.row}: {e.error}</p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Banner: viniendo desde una certificación */}
              {fromCert && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                    padding: '10px 16px', background: 'rgba(46,108,164,0.08)',
                    border: '1px solid rgba(46,108,164,0.25)', borderRadius: '10px',
                    fontSize: '13px', color: '#1a3a5c',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowRight size={14} color={ACCENT} />
                    <span>Partidas afectadas por <strong>{fromLabel}</strong> — resaltadas en azul</span>
                    <span style={{ fontSize: '11px', background: 'rgba(46,108,164,0.12)', color: ACCENT, borderRadius: '999px', padding: '2px 8px', fontWeight: 700 }}>
                      {highlightKeys.size} partida{highlightKeys.size !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => { setHighlightKeys(new Set()); navigate('/dashboard/cedula-presupuestaria', { replace: true, state: {} }) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center' }}
                    title="Quitar resaltado"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}

              {/* Summary cards */}
              {pdLoading && !pdTotales ? (
                <SkeletonPdCards isMobile={isMobile} />
              ) : pdTotales && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: '12px' }}>
                  {[
                    { label: 'Total Ítems',       value: pdTotales.total_items,                 color: ACCENT,    raw: true },
                    { label: 'Total Codificado',  value: fmt(pdTotales.total_codificado),        color: TEXT                },
                    { label: 'Total Certificado', value: fmt(pdTotales.total_certificado),       color: '#d97706'           },
                    { label: 'Saldo Total',       value: fmt(pdTotales.total_saldo),             color: GREEN               },
                    { label: 'Ítems Sin Saldo',   value: pdTotales.items_sin_saldo,              color: RED,       raw: true },
                  ].map((card, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '16px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)', borderTop: `3px solid ${card.color}` }}
                    >
                      <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{card.label}</p>
                      <p style={{ margin: 0, fontSize: card.raw ? '24px' : '15px', fontWeight: 800, color: card.color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{card.value}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Filters */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
                style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}
              >
                <form onSubmit={e => { e.preventDefault(); fetchPresupuesto() }}>
                  {/* Fila única: Buscar ítem + Programa + Actividad + Fuente */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    {/* Campo búsqueda con sugerencias */}
                    <div ref={searchRef} style={{ position: 'relative' }}>
                      <label style={PD_LABEL}>Buscar ítem</label>
                      <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
                        <input
                          type="text"
                          value={pdSearch}
                          onChange={e => { setPdSearch(e.target.value.slice(0, 150)); setPdShowSuggestions(true) }}
                          onFocus={() => { if (pdSearch) setPdShowSuggestions(true) }}
                          placeholder="Código o nombre del ítem..."
                          maxLength={150}
                          autoComplete="off"
                          style={{ ...PD_INPUT, paddingLeft: '28px' }}
                          onFocus={e => { e.target.style.borderColor = '#54b3e0'; e.target.style.boxShadow = '0 0 0 3px rgba(84,179,224,0.18)'; if (pdSearch) setPdShowSuggestions(true) }}
                          onBlur={e => { e.target.style.borderColor = 'rgba(46,108,164,0.22)'; e.target.style.boxShadow = 'none' }}
                        />
                      </div>
                      {/* Dropdown de sugerencias */}
                      <AnimatePresence>
                        {pdShowSuggestions && pdSearch.trim() && pdItems.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                              background: '#fff', border: '1px solid rgba(46,108,164,0.22)',
                              borderRadius: '10px', boxShadow: '0 8px 28px rgba(26,58,92,0.14)',
                              overflow: 'hidden', marginTop: '4px',
                            }}
                          >
                            {pdItems.slice(0, 8).map((item, i) => (
                              <button
                                key={`${item.id_item}_${item.id_fuente}`}
                                type="button"
                                onMouseDown={() => {
                                  setPdSearch(item.cod_item)
                                  setPdShowSuggestions(false)
                                }}
                                style={{
                                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                  padding: '9px 12px', background: 'none', border: 'none',
                                  borderBottom: i < Math.min(pdItems.length, 8) - 1 ? '1px solid rgba(26,58,92,0.06)' : 'none',
                                  cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-primary)',
                                  transition: 'background 0.12s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(46,108,164,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: ACCENT, flexShrink: 0 }}>
                                  {item.cod_item}
                                </span>
                                <span style={{ fontSize: '12px', color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.nombre_item}
                                </span>
                              </button>
                            ))}
                            {pdItems.length > 8 && (
                              <div style={{ padding: '7px 12px', fontSize: '11px', color: MUTED, background: 'rgba(26,58,92,0.03)', textAlign: 'center' }}>
                                +{pdItems.length - 8} más — refina la búsqueda
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Programa */}
                    {(() => {
                      const sugs = pdPrograma
                        ? [...new Map(allItemsRef.current.filter(i => i.cod_programa?.includes(pdPrograma)).map(i => [i.cod_programa, i])).values()].slice(0, 8)
                        : []
                      return (
                        <div ref={progRef} style={{ position: 'relative' }}>
                          <label style={PD_LABEL}>Programa</label>
                          <input type="text" inputMode="numeric" value={pdPrograma} maxLength={2} placeholder="Código..."
                            onChange={e => { setPdPrograma(e.target.value.replace(/\D/g,'').slice(0,2)); setPdShowProg(true) }}
                            style={PD_INPUT}
                            onFocus={e => { e.target.style.borderColor='#54b3e0'; e.target.style.boxShadow='0 0 0 3px rgba(84,179,224,0.18)'; if(pdPrograma) setPdShowProg(true) }}
                            onBlur={e => { e.target.style.borderColor='rgba(46,108,164,0.22)'; e.target.style.boxShadow='none' }}
                          />
                          <AnimatePresence>
                            {pdShowProg && sugs.length > 0 && (
                              <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.15}}
                                style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100, background:'#fff', border:'1px solid rgba(46,108,164,0.22)', borderRadius:'10px', boxShadow:'0 8px 28px rgba(26,58,92,0.14)', overflow:'hidden', marginTop:'4px' }}
                              >
                                {sugs.map((item, i) => (
                                  <button key={item.cod_programa} type="button"
                                    onMouseDown={() => { setPdPrograma(item.cod_programa); setPdShowProg(false) }}
                                    style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', background:'none', border:'none', borderBottom: i<sugs.length-1?'1px solid rgba(26,58,92,0.06)':'none', cursor:'pointer', textAlign:'left', fontFamily:'var(--font-primary)' }}
                                    onMouseEnter={e=>e.currentTarget.style.background='rgba(46,108,164,0.06)'}
                                    onMouseLeave={e=>e.currentTarget.style.background='none'}
                                  >
                                    <span style={{fontFamily:'monospace',fontSize:'12px',fontWeight:700,color:ACCENT,flexShrink:0}}>{item.cod_programa}</span>
                                    <span style={{fontSize:'12px',color:TEXT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.nombre_programa}</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })()}

                    {/* Actividad */}
                    {(() => {
                      const sugs = pdActividad
                        ? [...new Map(allItemsRef.current.filter(i => i.cod_actividad?.slice(-3).includes(pdActividad)).map(i => [i.cod_actividad, i])).values()].slice(0, 8)
                        : []
                      return (
                        <div ref={actRef} style={{ position: 'relative' }}>
                          <label style={PD_LABEL}>Actividad</label>
                          <input type="text" inputMode="numeric" value={pdActividad} maxLength={3} placeholder="Código..."
                            onChange={e => { setPdActividad(e.target.value.replace(/\D/g,'').slice(0,3)); setPdShowAct(true) }}
                            style={PD_INPUT}
                            onFocus={e => { e.target.style.borderColor='#54b3e0'; e.target.style.boxShadow='0 0 0 3px rgba(84,179,224,0.18)'; if(pdActividad) setPdShowAct(true) }}
                            onBlur={e => { e.target.style.borderColor='rgba(46,108,164,0.22)'; e.target.style.boxShadow='none' }}
                          />
                          <AnimatePresence>
                            {pdShowAct && sugs.length > 0 && (
                              <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.15}}
                                style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100, background:'#fff', border:'1px solid rgba(46,108,164,0.22)', borderRadius:'10px', boxShadow:'0 8px 28px rgba(26,58,92,0.14)', overflow:'hidden', marginTop:'4px' }}
                              >
                                {sugs.map((item, i) => (
                                  <button key={item.cod_actividad} type="button"
                                    onMouseDown={() => { setPdActividad(item.cod_actividad?.slice(-3) || ''); setPdShowAct(false) }}
                                    style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', background:'none', border:'none', borderBottom: i<sugs.length-1?'1px solid rgba(26,58,92,0.06)':'none', cursor:'pointer', textAlign:'left', fontFamily:'var(--font-primary)' }}
                                    onMouseEnter={e=>e.currentTarget.style.background='rgba(46,108,164,0.06)'}
                                    onMouseLeave={e=>e.currentTarget.style.background='none'}
                                  >
                                    <span style={{fontFamily:'monospace',fontSize:'12px',fontWeight:700,color:ACCENT,flexShrink:0}}>{item.cod_actividad?.slice(-3)}</span>
                                    <span style={{fontSize:'12px',color:TEXT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.nombre_actividad}</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })()}

                    {/* Fuente */}
                    {(() => {
                      const sugs = pdFuente
                        ? [...new Map(allItemsRef.current.filter(i => i.cod_fuente?.includes(pdFuente)).map(i => [i.cod_fuente, i])).values()].slice(0, 8)
                        : []
                      return (
                        <div ref={fteRef} style={{ position: 'relative' }}>
                          <label style={PD_LABEL}>Fuente</label>
                          <input type="text" inputMode="numeric" value={pdFuente} maxLength={3} placeholder="Código..."
                            onChange={e => { setPdFuente(e.target.value.replace(/\D/g,'').slice(0,3)); setPdShowFte(true) }}
                            style={PD_INPUT}
                            onFocus={e => { e.target.style.borderColor='#54b3e0'; e.target.style.boxShadow='0 0 0 3px rgba(84,179,224,0.18)'; if(pdFuente) setPdShowFte(true) }}
                            onBlur={e => { e.target.style.borderColor='rgba(46,108,164,0.22)'; e.target.style.boxShadow='none' }}
                          />
                          <AnimatePresence>
                            {pdShowFte && sugs.length > 0 && (
                              <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.15}}
                                style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100, background:'#fff', border:'1px solid rgba(46,108,164,0.22)', borderRadius:'10px', boxShadow:'0 8px 28px rgba(26,58,92,0.14)', overflow:'hidden', marginTop:'4px' }}
                              >
                                {sugs.map((item, i) => (
                                  <button key={item.cod_fuente} type="button"
                                    onMouseDown={() => { setPdFuente(item.cod_fuente); setPdShowFte(false) }}
                                    style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', background:'none', border:'none', borderBottom: i<sugs.length-1?'1px solid rgba(26,58,92,0.06)':'none', cursor:'pointer', textAlign:'left', fontFamily:'var(--font-primary)' }}
                                    onMouseEnter={e=>e.currentTarget.style.background='rgba(46,108,164,0.06)'}
                                    onMouseLeave={e=>e.currentTarget.style.background='none'}
                                  >
                                    <span style={{fontFamily:'monospace',fontSize:'12px',fontWeight:700,color:ACCENT,flexShrink:0}}>{item.cod_fuente}</span>
                                    <span style={{fontSize:'12px',color:TEXT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.nombre_fuente}</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                      style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #1a3a5c, #2e6ca4)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)', boxShadow: '0 3px 12px rgba(26,58,92,0.20)' }}
                    >
                      Filtrar
                    </motion.button>
                    <button type="button"
                      onClick={() => {
                        setPdSearch(''); setPdPrograma(''); setPdActividad(''); setPdFuente('')
                        filterClientSide('', '', '', '')
                      }}
                      title="Limpiar filtros"
                      style={{ padding: '8px 10px', background: 'rgba(26,58,92,0.06)', color: MUTED, border: `1px solid rgba(26,58,92,0.12)`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,58,92,0.10)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(26,58,92,0.06)'}
                    >
                      <RefreshCw size={13} />
                    </button>
                    {!pdLoading && (
                      <span style={{ fontSize: '12px', color: MUTED, marginLeft: '4px' }}>
                        {pdItems.length} partida{pdItems.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </form>
              </motion.div>

              {/* Table */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px', overflow: 'hidden', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(26,58,92,0.06)' }}
              >
                {pdLoading ? (
                  <SkeletonPdRows />
                ) : pdItems.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: MUTED, fontSize: '13px' }}>No se encontraron partidas presupuestarias</div>
                ) : (
                  <div style={{ width: '100%' }}>
                    <table className="ueb-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '9px 6px', color: MUTED, textAlign: 'center', overflow: 'hidden' }}>#</th>
                          {[
                            { label: 'Código',      align: 'left'   },
                            { label: 'Nombre Ítem', align: 'left'   },
                            { label: 'Prg.',        align: 'left'   },
                            { label: 'Act.',        align: 'left'   },
                            { label: 'Fte.',        align: 'left'   },
                            { label: 'Codificado',  align: 'right'  },
                            { label: 'Certificado', align: 'right'  },
                            { label: 'Saldo',       align: 'right'  },
                            { label: 'Avance',      align: 'left'   },
                            { label: '',            align: 'center' },
                          ].map((h, i) => (
                            <th key={i} style={{ padding: '9px 6px', textAlign: h.align, whiteSpace: 'nowrap', overflow: 'hidden' }}>{h.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pdItems.map((item, idx) => {
                          const rowKey        = `${item.id_item}_${item.id_fuente}`
                          const isHighlighted = highlightKeys.size > 0 && highlightKeys.has(rowKey)
                          return (
                          <tr
                            key={`${item.id_item}-${item.cod_fuente ?? idx}`}
                            style={{
                              background: isHighlighted
                                ? 'rgba(46,108,164,0.28)'
                                : item.sin_saldo ? 'rgba(185,28,28,0.04)' : undefined,
                              outline: isHighlighted ? '2px solid rgba(46,108,164,0.70)' : 'none',
                              outlineOffset: '-1px',
                            }}
                          >
                            <td style={{ padding: '9px 6px', color: MUTED, fontSize: '12px', textAlign: 'center', overflow: 'hidden', fontVariantNumeric: 'tabular-nums' }}>{idx + 1}</td>
                            <td style={{ padding: '9px 6px', fontFamily: 'monospace', color: ACCENT, fontWeight: 700, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.cod_item}</td>
                            <td style={{ padding: '9px 6px', fontSize: '13px', color: TEXT, fontWeight: 500, lineHeight: 1.4, maxWidth: '200px' }}>{item.nombre_item}</td>
                            <td style={{ padding: '9px 5px', fontFamily: 'monospace', color: MUTED, fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.cod_programa || '—'}</td>
                            <td style={{ padding: '9px 5px', fontFamily: 'monospace', color: MUTED, fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.cod_actividad?.slice(-3) || '—'}</td>
                            <td style={{ padding: '9px 5px', fontFamily: 'monospace', color: MUTED, fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.cod_fuente || '—'}</td>
                            <td style={{ padding: '9px 6px', textAlign: 'right', fontWeight: 600, fontSize: '12px', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', whiteSpace: 'nowrap' }}>{fmt(item.codificado)}</td>
                            <td style={{ padding: '9px 6px', textAlign: 'right', color: '#d97706', fontWeight: 600, fontSize: '12px', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', whiteSpace: 'nowrap' }}>{fmt(item.certificado)}</td>
                            <td style={{ padding: '9px 6px', textAlign: 'right', fontWeight: 800, fontSize: '12px', color: item.sin_saldo ? RED : GREEN, fontVariantNumeric: 'tabular-nums', overflow: 'hidden', whiteSpace: 'nowrap' }}>{fmt(item.saldo)}</td>
                            <td style={{ padding: '9px 6px' }}>
                              <SaldoBar codificado={item.codificado} certificado={item.certificado} />
                            </td>
                            <td style={{ padding: '9px 4px', textAlign: 'center' }}>
                              {item.sin_saldo
                                ? <AlertTriangle size={14} color={RED} title="Sin saldo disponible" />
                                : <CheckCircle2 size={14} color={GREEN} title="Saldo disponible" />
                              }
                            </td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* ── TAB: Upload ── */}
          {activeTab === 'upload' && !isReadOnly && puedeCargar && (
            <div style={{ padding: P }}>

              {/* Cargando cédula */}
              {fiscalLoading && (
                <div style={{ textAlign: 'center', padding: '72px 20px', color: MUTED, fontSize: '13px' }}>
                  <div style={{ width: '28px', height: '28px', border: '3px solid rgba(46,108,164,0.15)', borderTopColor: ACCENT, borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
                  Cargando...
                </div>
              )}

              {!fiscalLoading && <>

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
                          <BarChart2 size={24} color="#fff" />
                        </div>
                        <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#fff' }}>Importar Cédula Presupuestaria</h2>
                        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                          Un solo CSV crea la estructura jerárquica y carga los valores financieros en un único paso.
                        </p>
                      </div>
                    </div>

                    {/* Steps */}
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px', backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(26,58,92,0.06)' }}>
                      <p style={{ margin: '0 0 16px', fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pasos a seguir</p>
                      {[
                        { n: '1', title: 'Prepara el archivo CSV', desc: 'Usa coma (,) como separador. Decimales con coma europea — Ej: 17.332,02. El archivo debe tener exactamente 29 columnas con encabezado DESCRIPCIONG1-9, COL1-10/COL20 y CODIGOG1-9.', color: ACCENT_COLORS.blue },
                        { n: '2', title: 'Sube el archivo',        desc: 'El sistema construye automáticamente la jerarquía (programas, actividades, ítems) y registra los valores financieros en un solo paso.', color: ACCENT_COLORS.green },
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
                          <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(46,108,164,0.10)', color: ACCENT, borderRadius: '999px', padding: '2px 8px' }}>29 cols</span>
                        </span>
                        {showCols ? <ChevronUp size={15} color={MUTED} /> : <ChevronDown size={15} color={MUTED} />}
                      </button>
                      <AnimatePresence initial={false}>
                        {showCols && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${BORDER}` }}>
                              <p style={{ margin: '14px 0 10px', fontSize: '11.5px', color: MUTED }}>
                                Separador: <code style={{ background: 'rgba(46,108,164,0.08)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>,</code> — La fila 1 es el encabezado y se omite automáticamente
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
                                      <tr key={col.n} style={{ background: !col.req ? 'rgba(0,0,0,0.02)' : i % 2 === 0 ? '#fff' : 'rgba(46,108,164,0.02)' }}>
                                        <td style={{ padding: '6px 10px', color: MUTED, fontWeight: 600 }}>{col.n}</td>
                                        <td style={{ padding: '6px 10px', color: col.req ? TEXT : MUTED, fontStyle: col.req ? 'normal' : 'italic' }}>{col.name}</td>
                                        <td style={{ padding: '6px 10px' }}>
                                          {col.req ? (
                                            <span style={{
                                              background: col.tipo === 'Código' ? 'rgba(217,119,6,0.10)' : col.tipo === 'Numérico' ? 'rgba(8,145,178,0.10)' : 'rgba(46,108,164,0.08)',
                                              color: col.tipo === 'Código' ? '#d97706' : col.tipo === 'Numérico' ? '#0891b2' : ACCENT,
                                              fontSize: '10px', fontWeight: 700, borderRadius: '4px', padding: '2px 7px',
                                            }}>{col.tipo}</span>
                                          ) : <span style={{ fontSize: '11px', color: MUTED }}>—</span>}
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
                    <label htmlFor="cedula-csv"
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
                      <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} id="cedula-csv" />
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
                            Solo archivos .csv — 29 columnas
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
                          : <><Upload size={16} /> Subir Cédula Presupuestaria</>
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
              </>}

            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
