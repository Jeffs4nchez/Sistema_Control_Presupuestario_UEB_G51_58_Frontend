import { useState } from 'react'
import { createPortal } from 'react-dom'
import Cookies from 'js-cookie'
import { useAuth } from '../contexts/AuthContext'
import { useFiscalYear } from '../contexts/FiscalYearContext'
import { motion, AnimatePresence } from 'framer-motion'
import { FileDown, Printer, FileText, Banknote, PieChart, ShieldCheck, Loader2, X, Download, SlidersHorizontal, CheckCircle2, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts'
import { formatFechaHora } from '../utils/fechaUtils'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const FONT  = 'Arial, sans-serif'
const BRD   = '1px solid #ccc'
const BEIGE = '#ede8d5'

const TH  = { padding:'5px 6px', textAlign:'center', fontWeight:'bold', fontSize:'8.5px', background:BEIGE, borderBottom:'1.5px solid #000', borderRight:BRD }
const TD  = { padding:'4px 5px', textAlign:'center', fontSize:'8.5px', borderBottom:BRD, borderRight:BRD }
const TDL = { padding:'4px 7px', textAlign:'left',   fontSize:'8.5px', borderBottom:BRD, borderRight:BRD }
const TDR = { padding:'4px 7px', textAlign:'right',  fontSize:'8.5px', borderBottom:BRD, borderRight:BRD }

function fmt(v) {
  const n = parseFloat(v) || 0
  return '$. ' + n.toLocaleString('es-EC', { minimumFractionDigits:2, maximumFractionDigits:2 })
}

function fmtFecha() {
  return new Date().toLocaleDateString('es-EC', { year:'numeric', month:'long', day:'numeric' })
}

function buildQs(params) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString()
  return qs ? '?' + qs : ''
}

async function downloadCsv(endpoint, filename, params = {}) {
  const token = Cookies.get('auth_token')
  const res = await fetch(`${API}${endpoint}${buildQs(params)}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Error al generar el reporte')
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = filename; a.click()
  URL.revokeObjectURL(a.href)
}

/* ── Tablas de impresión ────────────────────────────────────────── */
function TablaCertificaciones({ data }) {
  const total = data.reduce((s,r) => s + parseFloat(r.monto_total||0), 0)
  return (
    <table style={{ width:'100%', borderCollapse:'collapse', border:'1.5px solid #000' }}>
      <thead>
        <tr>
          {['N° Certificado','Fecha','Estado','Unidad Requiriente','Responsable','Año','Memorando','Monto Total','Elaborado Por'].map((h,i)=>(
            <th key={i} style={{...TH, textAlign: i===7?'right':'center'}}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((r,i)=>(
          <tr key={i} style={{ background: r.estado==='ANULADA'?'#fff5f5': i%2===0?'#fff':'#f8faff', opacity: r.estado==='ANULADA'?0.7:1 }}>
            <td style={{...TDL, fontWeight:'bold'}}>{r.numero_certificado}</td>
            <td style={TD}>{r.fecha_elaboracion}</td>
            <td style={{...TD}}>
              <span style={{ padding:'1px 6px', borderRadius:'999px', fontSize:'7.5px', fontWeight:'bold', background: r.estado==='ANULADA'?'#ffe4e6':'#dbeafe', color: r.estado==='ANULADA'?'#be123c':'#1e40af' }}>
                {r.estado}
              </span>
            </td>
            <td style={TDL}>{r.nombre_entidad||'—'}</td>
            <td style={TDL}>{r.responsable_entidad||'—'}</td>
            <td style={TD}>{r.anio||'—'}</td>
            <td style={TDL}>{r.seccion_memorando||'—'}</td>
            <td style={{...TDR, fontWeight:'bold'}}>{fmt(r.monto_total)}</td>
            <td style={TDL}>{r.elaborado_por||'—'}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr style={{ background:BEIGE }}>
          <td colSpan={7} style={{...TDR, fontWeight:'bold', fontSize:'9px', borderTop:'1.5px solid #000'}}>TOTAL PRESUPUESTARIO</td>
          <td style={{...TDR, fontWeight:'bold', fontSize:'9px', borderTop:'1.5px solid #000'}}>{fmt(total)}</td>
          <td style={{...TD, borderTop:'1.5px solid #000'}}></td>
        </tr>
      </tfoot>
    </table>
  )
}

function TablaLiquidaciones({ data }) {
  const totalVig = data.filter(r=>r.estado!=='ANULADA').reduce((s,r)=>s+parseFloat(r.cantidad_liquidacion||0),0)
  return (
    <table style={{ width:'100%', borderCollapse:'collapse', border:'1.5px solid #000' }}>
      <thead>
        <tr>
          {['ID','Fecha','Memorando','Código Ítem','Nombre Ítem','N° Certificado','Estado','Monto Liquidado','Motivo Anulación'].map((h,i)=>(
            <th key={i} style={{...TH, textAlign: i===7?'right':'center'}}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((r,i)=>(
          <tr key={i} style={{ background: r.estado==='ANULADA'?'#fff5f5': i%2===0?'#fff':'#f8faff', opacity: r.estado==='ANULADA'?0.7:1 }}>
            <td style={TD}>{r.id_liquidacion}</td>
            <td style={TD}>{r.fecha_creacion}</td>
            <td style={TDL}>{r.memorando}</td>
            <td style={{...TD, fontFamily:'monospace', fontSize:'7.5px'}}>{r.cod_item}</td>
            <td style={TDL}>{r.nombre_item}</td>
            <td style={TD}>{r.numero_certificado||'—'}</td>
            <td style={TD}>
              <span style={{ padding:'1px 6px', borderRadius:'999px', fontSize:'7.5px', fontWeight:'bold', background: r.estado==='ANULADA'?'#ffe4e6':'#d1fae5', color: r.estado==='ANULADA'?'#be123c':'#065f46' }}>
                {r.estado}
              </span>
            </td>
            <td style={{...TDR, fontWeight:'bold', textDecoration: r.estado==='ANULADA'?'line-through':'none'}}>{fmt(r.cantidad_liquidacion)}</td>
            <td style={TDL}>{r.motivo_anulacion||'—'}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr style={{ background:BEIGE }}>
          <td colSpan={7} style={{...TDR, fontWeight:'bold', fontSize:'9px', borderTop:'1.5px solid #000'}}>TOTAL LIQUIDADO (VIGENTES)</td>
          <td style={{...TDR, fontWeight:'bold', fontSize:'9px', borderTop:'1.5px solid #000'}}>{fmt(totalVig)}</td>
          <td style={{...TD, borderTop:'1.5px solid #000'}}></td>
        </tr>
      </tfoot>
    </table>
  )
}

function TablaPresupuesto({ data }) {
  const totalCod  = data.reduce((s,r)=>s+(r.codificado||0),0)
  const totalCert = data.reduce((s,r)=>s+(r.certificado||0),0)
  const totalSald = data.reduce((s,r)=>s+(r.saldo||0),0)
  return (
    <table style={{ width:'100%', borderCollapse:'collapse', border:'1.5px solid #000' }}>
      <thead>
        <tr>
          {['Código Ítem','Nombre Ítem','Programa','Actividad','Fuente','Codificado','Certificado','Saldo'].map((h,i)=>(
            <th key={i} style={{...TH, textAlign: i>=5?'right':'center'}}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((r,i)=>(
          <tr key={i} style={{ background: r.saldo<=0?'#fff5f5': i%2===0?'#fff':'#f8faff' }}>
            <td style={{...TD, fontFamily:'monospace', fontSize:'7.5px'}}>{r.cod_item}</td>
            <td style={TDL}>{r.nombre_item}</td>
            <td style={{...TD, fontFamily:'monospace', fontSize:'7.5px'}}>{r.cod_programa||'—'}</td>
            <td style={{...TD, fontFamily:'monospace'}}>{r.cod_actividad ? r.cod_actividad.slice(-3) : '—'}</td>
            <td style={TD}>{r.cod_fuente||'—'}</td>
            <td style={TDR}>{fmt(r.codificado)}</td>
            <td style={TDR}>{fmt(r.certificado)}</td>
            <td style={{...TDR, fontWeight: r.saldo<=0?'bold':'normal', color: r.saldo<=0?'#be123c':'inherit'}}>{fmt(r.saldo)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr style={{ background:BEIGE }}>
          <td colSpan={5} style={{...TDR, fontWeight:'bold', fontSize:'9px', borderTop:'1.5px solid #000'}}>TOTALES</td>
          <td style={{...TDR, fontWeight:'bold', fontSize:'9px', borderTop:'1.5px solid #000'}}>{fmt(totalCod)}</td>
          <td style={{...TDR, fontWeight:'bold', fontSize:'9px', borderTop:'1.5px solid #000'}}>{fmt(totalCert)}</td>
          <td style={{...TDR, fontWeight:'bold', fontSize:'9px', borderTop:'1.5px solid #000'}}>{fmt(totalSald)}</td>
        </tr>
      </tfoot>
    </table>
  )
}

function TablaAuditoria({ data }) {
  const ACCION_COLOR = {
    CREACION:     { bg:'#dbeafe', color:'#1e40af' },
    MODIFICACION: { bg:'#fef3c7', color:'#92400e' },
    ANULACION:    { bg:'#ffe4e6', color:'#be123c' },
    ELIMINACION:  { bg:'#fce7f3', color:'#9d174d' },
  }
  return (
    <table style={{ width:'100%', borderCollapse:'collapse', border:'1.5px solid #000' }}>
      <thead>
        <tr>
          {['ID','N° Certificado','Acción','Campo Modificado','Estado Anterior','Estado Nuevo','Monto Anterior','Monto Nuevo','Motivo','Usuario','Fecha y Hora'].map((h,i)=>(
            <th key={i} style={{...TH, textAlign: (i===6||i===7)?'right':'center'}}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((r,i)=>{
          const ac = ACCION_COLOR[r.accion] || { bg:'#f3f4f6', color:'#374151' }
          return (
            <tr key={i} style={{ background: i%2===0?'#fff':'#f8faff' }}>
              <td style={TD}>{r.id_auditoria}</td>
              <td style={{...TD, fontWeight:'bold'}}>{r.numero_certificado||'—'}</td>
              <td style={TD}>
                <span style={{ padding:'1px 6px', borderRadius:'999px', fontSize:'7.5px', fontWeight:'bold', background:ac.bg, color:ac.color }}>{r.accion||'—'}</span>
              </td>
              <td style={TDL}>{r.campo_modificado||'—'}</td>
              <td style={TD}>{r.estado_anterior||'—'}</td>
              <td style={TD}>{r.estado_nuevo||'—'}</td>
              <td style={TDR}>{r.monto_anterior!=null ? fmt(r.monto_anterior) : '—'}</td>
              <td style={TDR}>{r.monto_nuevo!=null    ? fmt(r.monto_nuevo)    : '—'}</td>
              <td style={TDL}>{r.motivo||'—'}</td>
              <td style={TDL}>{r.nombre_usuario||'Sistema'}</td>
              <td style={TD}>{formatFechaHora(r.fecha_hora)}</td>
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr style={{ background:BEIGE }}>
          <td colSpan={11} style={{...TDR, fontWeight:'bold', fontSize:'9px', borderTop:'1.5px solid #000'}}>
            TOTAL REGISTROS: {data.length}
          </td>
        </tr>
      </tfoot>
    </table>
  )
}

const PRINT_CONFIG = {
  certificaciones: { titulo:'REPORTE DE CERTIFICACIONES PRESUPUESTARIAS', endpoint:'/reportes/certificaciones/json', Tabla:TablaCertificaciones },
  liquidaciones:   { titulo:'REPORTE DE LIQUIDACIONES',                   endpoint:'/reportes/liquidaciones/json',  Tabla:TablaLiquidaciones  },
  presupuesto:     { titulo:'REPORTE DE PRESUPUESTO DISPONIBLE',           endpoint:'/reportes/presupuesto/json',    Tabla:TablaPresupuesto    },
  auditoria:       { titulo:'REPORTE DE AUDITORÍA',                        endpoint:'/reportes/auditoria/json',      Tabla:TablaAuditoria      },
}

const MESES = [
  { v:'01', l:'Enero' }, { v:'02', l:'Febrero' }, { v:'03', l:'Marzo' },
  { v:'04', l:'Abril' }, { v:'05', l:'Mayo'    }, { v:'06', l:'Junio'  },
  { v:'07', l:'Julio' }, { v:'08', l:'Agosto'  }, { v:'09', l:'Septiembre' },
  { v:'10', l:'Octubre'},{ v:'11', l:'Noviembre'},{ v:'12', l:'Diciembre'  },
]

const FILTER_CONFIGS = {
  certificaciones: [
    { key:'mes_desde',          label:'Mes desde',      type:'month_select' },
    { key:'mes_hasta',          label:'Mes hasta',       type:'month_select' },
    { key:'estado',             label:'Estado',          type:'select', options:['','REGISTRADO','APROBADO','RECHAZADO','LIQUIDADO','ERRADO'], labels:['Todos','Registrado','Aprobado','Rechazado','Liquidado','Errado'] },
    { key:'numero_certificado', label:'N° Certificado',  type:'text', placeholder:'001', width:'110px' },
  ],
  liquidaciones: [
    { key:'mes_desde',          label:'Mes desde',      type:'month_select' },
    { key:'mes_hasta',          label:'Mes hasta',       type:'month_select' },
    { key:'estado',             label:'Estado',          type:'select', options:['','LIQUIDADO','ANULADA'], labels:['Todos','Vigente','Anulada'] },
    { key:'numero_certificado', label:'N° Certificado',  type:'text', placeholder:'001', width:'110px' },
  ],
  presupuesto: [
    { key:'mes_desde',     label:'Mes desde', type:'month_select' },
    { key:'mes_hasta',     label:'Mes hasta',  type:'month_select' },
    { key:'cod_item',      label:'Ítem',      type:'text', placeholder:'510108', width:'110px', numeric:true, maxLength:6 },
    { key:'cod_programa',  label:'Programa',  type:'text', placeholder:'01',     width:'110px', numeric:true, maxLength:2 },
    { key:'cod_actividad', label:'Actividad', type:'text', placeholder:'001',    width:'110px', numeric:true, maxLength:3 },
    { key:'cod_fuente',    label:'Fuente',    type:'text', placeholder:'001',    width:'110px', numeric:true, maxLength:3 },
    { key:'disponible',    label:'Mostrar',   type:'select', options:['','solo_disponibles','solo_agotados'], labels:['Todos','Solo con saldo','Solo agotados'] },
  ],
  auditoria: [
    { key:'mes_desde',          label:'Mes desde',      type:'month_select' },
    { key:'mes_hasta',          label:'Mes hasta',       type:'month_select' },
    { key:'accion',             label:'Acción',          type:'select', options:['','CREACIÓN','CAMBIO_ESTADO','EDICIÓN','ELIMINACIÓN','CREACION_LIQUIDACION','ANULACION_LIQUIDACION'], labels:['Todos','Creación','Cambio Estado','Edición','Eliminación','Nueva Liquidación','Anulación Liquidación'] },
    { key:'numero_certificado', label:'N° Certificado',  type:'text', placeholder:'001', width:'110px' },
  ],
  ejecucion: [
    { key:'agrupacion', label:'Agrupar por', type:'select', options:['programa','actividad','fuente','item'], labels:['Programa','Actividad','Fuente','Ítem'] },
    { key:'mes_desde',  label:'Mes desde',   type:'month_select' },
    { key:'mes_hasta',  label:'Mes hasta',   type:'month_select' },
  ],
}

const FILTER_INIT = {
  certificaciones: { mes_desde:'', mes_hasta:'', estado:'', numero_certificado:'' },
  liquidaciones:   { mes_desde:'', mes_hasta:'', estado:'', numero_certificado:'' },
  presupuesto:     { mes_desde:'', mes_hasta:'', cod_item:'', cod_programa:'', cod_actividad:'', cod_fuente:'', disponible:'' },
  auditoria:       { mes_desde:'', mes_hasta:'', accion:'', numero_certificado:'' },
  ejecucion:       { agrupacion:'programa', mes_desde:'', mes_hasta:'' },
}

const MESES_ABREV = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const barColor = pct => pct >= 100 ? '#a42e2e' : pct >= 75 ? '#d97706' : '#2ea466'

function EjecTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background:'rgba(255,255,255,0.97)', border:'1px solid rgba(46,49,164,0.18)', borderRadius:'10px', padding:'10px 14px', boxShadow:'0 4px 20px rgba(0,0,0,0.13)', fontSize:'12px', fontFamily:'var(--font-primary)' }}>
      <div style={{ fontWeight:800, marginBottom:'6px', color:'var(--text-heading)', fontSize:'13px' }}>{d.name}</div>
      <div style={{ color:'#374151', marginBottom:'2px' }}>Codificado: <strong>{fmt(d.codificado)}</strong></div>
      <div style={{ color:'#374151', marginBottom:'4px' }}>Certificado: <strong>{fmt(d.certificado_total)}</strong></div>
      <div style={{ fontWeight:800, color: barColor(d.pct), fontSize:'14px' }}>{d.pct}%</div>
    </div>
  )
}

const REPORT_TYPES = [
  {
    tipo: 'presupuesto', key: 'pres',
    icon: PieChart, title: 'Presupuesto Disponible',
    desc: 'Saldos codificado, certificado y disponible por partida',
    color: '#2ea4a1', gradient: 'linear-gradient(135deg,#1a6b69,#2ea4a1)',
    csvEndpoint: '/reportes/presupuesto/csv',
  },
  {
    tipo: 'ejecucion', key: 'ejec',
    icon: BarChart2, title: '% Ejecución Presupuestaria',
    desc: 'Porcentaje certificado vs codificado agrupado por programa, actividad, fuente o ítem',
    color: '#2e31a4', gradient: 'linear-gradient(135deg,#0d1035,#2e31a4)',
  },
  {
    tipo: 'certificaciones', key: 'cert',
    icon: FileText, title: 'Certificaciones',
    desc: 'Listado de certificaciones presupuestarias con montos y estados',
    color: '#2e6ca4', gradient: 'linear-gradient(135deg,#1a3a5c,#2e6ca4)',
    csvEndpoint: '/reportes/certificaciones/csv',
  },
  {
    tipo: 'liquidaciones', key: 'liq',
    icon: Banknote, title: 'Liquidaciones',
    desc: 'Registro de liquidaciones realizadas, incluyendo anuladas',
    color: '#2ea466', gradient: 'linear-gradient(135deg,#1a6b3e,#2ea466)',
    csvEndpoint: '/reportes/liquidaciones/csv',
  },
  {
    tipo: 'auditoria', key: 'audit', auditOnly: true,
    icon: ShieldCheck, title: 'Auditoría',
    desc: 'Historial de acciones: creaciones, cambios de estado y anulaciones',
    color: '#662ea4', gradient: 'linear-gradient(135deg,#2d1045,#662ea4)',
    csvEndpoint: '/reportes/auditoria/csv',
  },
]

/* ── Componente principal ───────────────────────────────────────── */
export default function Reportes() {
  const { user } = useAuth()
  const { selectedCedula } = useFiscalYear()
  const [selected,    setSelected]    = useState(null)
  const [filters,     setFilters]     = useState(FILTER_INIT)
  const [loadingCsv,  setLoadingCsv]  = useState(false)
  const [loadingPrint,setLoadingPrint]= useState(false)
  const [csvError,    setCsvError]    = useState('')
  const [preview,     setPreview]     = useState({ open:false, tipo:null, data:[], error:'' })
  const [ejec,        setEjec]        = useState({ data:[], loading:false, error:'' })
  const [printEjec,   setPrintEjec]   = useState(false)

  const canSeeAuditoria = ['Administrador del sistema', 'Director(a) financiero'].includes(user?.cargo)
  const visibleTypes = REPORT_TYPES.filter(r => !r.auditOnly || canSeeAuditoria)

  const buildFilename = (tipo, ext) => {
    const NOMBRES = { presupuesto:'Presupuesto_Disponible', certificaciones:'Certificaciones', liquidaciones:'Liquidaciones', auditoria:'Auditoria' }
    const parts   = ['UEB_Control_Presupuestario']
    parts.push(NOMBRES[tipo] || tipo)

    if (selectedCedula?.anio) parts.push(`Anio${selectedCedula.anio}`)

    const f = filters[tipo] || {}

    // Rango de meses
    if (f.mes_desde || f.mes_hasta) {
      const d = f.mes_desde ? MESES_ABREV[Number(f.mes_desde)] : ''
      const h = f.mes_hasta ? MESES_ABREV[Number(f.mes_hasta)] : ''
      if (d && h && d === h) parts.push(d)
      else if (d && h)       parts.push(`${d}-${h}`)
      else if (d)            parts.push(`Desde_${d}`)
      else                   parts.push(`Hasta_${h}`)
    }

    // Filtros adicionales relevantes
    if (f.estado)             parts.push(`Est_${f.estado}`)
    if (f.accion)             parts.push(`Acc_${f.accion.replace(/_/g,'-')}`)
    if (f.numero_certificado) parts.push(`N_${f.numero_certificado}`)
    if (f.cod_item)           parts.push(`Item_${f.cod_item}`)
    if (f.cod_programa)       parts.push(`Prog_${f.cod_programa}`)
    if (f.cod_actividad)      parts.push(`Act_${f.cod_actividad}`)
    if (f.cod_fuente)         parts.push(`Fte_${f.cod_fuente}`)
    if (f.disponible === 'solo_disponibles') parts.push('Con_Saldo')
    if (f.disponible === 'solo_agotados')    parts.push('Agotados')

    // Fecha de generación
    parts.push(new Date().toISOString().slice(0,10).replace(/-/g,''))

    return parts.join('_') + '.' + ext
  }

  const yearParams = (tipo) => {
    const f    = { ...filters[tipo] }
    const anio = selectedCedula?.anio
    const params = { ...f }

    if (f.mes_desde && anio) {
      params.desde = `${anio}-${f.mes_desde}-01`
    }
    if (f.mes_hasta && anio) {
      const lastDay = new Date(Number(anio), Number(f.mes_hasta), 0).getDate()
      params.hasta = `${anio}-${f.mes_hasta}-${String(lastDay).padStart(2,'0')}`
    }
    delete params.mes_desde
    delete params.mes_hasta

    if (selectedCedula?.id_cedula_presupuestaria) {
      params.id_cedula_presupuestaria = selectedCedula.id_cedula_presupuestaria
    }
    return params
  }

  const handleCsv = async () => {
    if (!selected) return
    setCsvError(''); setLoadingCsv(true)
    try { await downloadCsv(selected.csvEndpoint, buildFilename(selected.tipo, 'csv'), yearParams(selected.tipo)) }
    catch (e) { setCsvError(e.message || 'Error al descargar.') }
    finally { setLoadingCsv(false) }
  }

  const handlePreview = async () => {
    if (!selected) return
    setLoadingPrint(true)
    const cfg   = PRINT_CONFIG[selected.tipo]
    const token = Cookies.get('auth_token')
    try {
      const res  = await fetch(`${API}${cfg.endpoint}${buildQs(yearParams(selected.tipo))}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      setPreview(json.success
        ? { open:true, tipo:selected.tipo, data:json.data, error:'' }
        : { open:true, tipo:selected.tipo, data:[], error:json.message || 'Error al cargar datos.' })
    } catch {
      setPreview({ open:true, tipo:selected.tipo, data:[], error:'Error de conexión.' })
    } finally { setLoadingPrint(false) }
  }

  const handleEjecucion = async () => {
    setEjec({ data:[], loading:true, error:'' })
    const token = Cookies.get('auth_token')
    const f     = filters.ejecucion
    const anio  = selectedCedula?.anio
    const params = {}
    if (f.mes_desde && anio) params.desde = `${anio}-${f.mes_desde}-01`
    if (f.mes_hasta && anio) { const d = new Date(Number(anio), Number(f.mes_hasta), 0).getDate(); params.hasta = `${anio}-${f.mes_hasta}-${String(d).padStart(2,'0')}` }
    if (selectedCedula?.id_cedula_presupuestaria) params.id_cedula_presupuestaria = selectedCedula.id_cedula_presupuestaria
    try {
      const res  = await fetch(`${API}/reportes/presupuesto/json${buildQs(params)}`, { headers: { Authorization:`Bearer ${token}` } })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      const raw  = json.data
      const agg  = f.agrupacion
      const map  = {}
      raw.forEach(r => {
        let key, label
        if      (agg === 'programa')  { key = r.cod_programa  || 'S/P'; label = key }
        else if (agg === 'actividad') { key = r.cod_actividad ? r.cod_actividad.slice(-3) : 'S/A'; label = key }
        else if (agg === 'fuente')    { key = r.cod_fuente    || 'S/F'; label = key }
        else                          { key = r.cod_item;       label = r.cod_item }
        if (!map[key]) map[key] = { name:label, codificado:0, certificado_total:0 }
        map[key].codificado       += r.codificado       || 0
        map[key].certificado_total += r.certificado_total || 0
      })
      const data = Object.values(map).map(d => ({
        ...d,
        pct: d.codificado > 0 ? Math.round((d.certificado_total / d.codificado) * 100) : 0,
      })).sort((a, b) => b.pct - a.pct)
      setEjec({ data, loading:false, error:'' })
    } catch(e) {
      setEjec({ data:[], loading:false, error: e.message || 'Error al cargar datos.' })
    }
  }

  const handlePrintEjec = () => {
    const prev = document.title
    const agrupadoPor = { programa:'Programa', actividad:'Actividad', fuente:'Fuente', item:'Ítem' }[filters.ejecucion.agrupacion] || ''
    document.title = `UEB_Ejecucion_Presupuestaria_${selectedCedula?.anio || ''}_${agrupadoPor}_${new Date().toISOString().slice(0,10).replace(/-/g,'')}`
    setPrintEjec(true)
    setTimeout(() => {
      window.print()
      setTimeout(() => { document.title = prev; setPrintEjec(false) }, 1000)
    }, 160)
  }

  const closePreview = () => setPreview({ open:false, tipo:null, data:[], error:'' })
  const cfg   = preview.tipo ? PRINT_CONFIG[preview.tipo] : null
  const fecha = fmtFecha()

  const activeCount = selected
    ? Object.entries(filters[selected.tipo] || {}).filter(([k, v]) => v !== '' && k !== 'agrupacion').length
    : 0

  const inputS = {
    fontSize:'12px', padding:'7px 10px',
    border:'1px solid rgba(46,108,164,0.20)', borderRadius:'8px',
    background:'#fff', color:'var(--text-body)',
    fontFamily:'var(--font-primary)', outline:'none', boxSizing:'border-box',
    transition:'border-color 0.18s',
  }

  return (
    <div style={{ background:'var(--page-bg)', minHeight:'100%', padding:'28px', fontFamily:'var(--font-primary)' }}>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        #rpt-print-root { display:none; }
        @media print {
          body { background:#fff !important; color:#000 !important; }
          body > *:not(#rpt-print-root) { display:none !important; }
          #rpt-print-root { display:block !important; background:#fff !important; padding:14mm 12mm; box-sizing:border-box; font-family:Arial,sans-serif; font-size:9px; color:#000; text-transform:uppercase; break-inside:avoid; page-break-inside:avoid; }
          @page { size:A4 landscape; margin:0; }
        }
      `}</style>

      {/* ── Cabecera ── */}
      <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:'28px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'11px', background:'rgba(46,108,164,0.10)', border:'1px solid rgba(46,108,164,0.20)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FileDown size={18} color="#2e6ca4" />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:'20px', fontWeight:800, color:'var(--text-heading)', letterSpacing:'-0.02em' }}>Reportes</h1>
            <p style={{ margin:0, fontSize:'12px', color:'var(--text-muted)' }}>
              Año fiscal&nbsp;<strong style={{ color:'var(--text-heading)' }}>{selectedCedula?.anio || '—'}</strong>
              &nbsp;— Selecciona un reporte, configura los filtros y exporta
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Paso 1: Selector de tipo ── */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }} style={{ marginBottom:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
          <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:'#2e6ca4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:800, color:'#fff', flexShrink:0 }}>1</div>
          <span style={{ fontSize:'13px', fontWeight:700, color:'var(--text-heading)' }}>Selecciona el tipo de reporte</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'12px' }}>
          {visibleTypes.map((rt, i) => {
            const isActive = selected?.tipo === rt.tipo
            return (
              <motion.button
                key={rt.tipo}
                initial={{ opacity:0, y:14 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y:-3, boxShadow:`0 12px 32px ${rt.color}25` }}
                whileTap={{ scale:0.97 }}
                onClick={() => { setSelected(isActive ? null : rt); if (!isActive) setEjec({ data:[], loading:false, error:'' }) }}
                style={{
                  position:'relative', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'10px',
                  padding:'18px 18px 16px',
                  background: isActive ? rt.gradient : 'rgba(255,255,255,0.92)',
                  border: isActive ? `2px solid ${rt.color}` : '2px solid rgba(255,255,255,0.95)',
                  borderRadius:'16px', cursor:'pointer', textAlign:'left',
                  boxShadow: isActive ? `0 8px 28px ${rt.color}35` : '0 2px 12px rgba(26,58,92,0.08)',
                  transition:'all 0.22s ease',
                  backdropFilter:'blur(20px)',
                }}
              >
                {/* check si activo */}
                {isActive && (
                  <div style={{ position:'absolute', top:'10px', right:'10px' }}>
                    <CheckCircle2 size={16} color="#fff" />
                  </div>
                )}
                <div style={{
                  width:'40px', height:'40px', borderRadius:'11px',
                  background: isActive ? 'rgba(255,255,255,0.20)' : rt.gradient,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, boxShadow: isActive ? 'none' : `0 4px 14px ${rt.color}40`,
                }}>
                  <rt.icon size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:800, color: isActive ? '#fff' : 'var(--text-heading)', marginBottom:'3px', letterSpacing:'-0.01em' }}>{rt.title}</div>
                  <div style={{ fontSize:'11px', color: isActive ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)', lineHeight:1.4 }}>{rt.desc}</div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* ── Pasos 2 y 3: Filtros + Exportar (aparecen al seleccionar) ── */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.tipo}
            initial={{ opacity:0, y:-12, scale:0.99 }}
            animate={{ opacity:1, y:0,   scale:1    }}
            exit={{   opacity:0, y:-8,   scale:0.99 }}
            transition={{ type:'spring', stiffness:200, damping:24 }}
            style={{
              background:'rgba(255,255,255,0.93)',
              backdropFilter:'blur(20px)',
              border:`1.5px solid ${selected.color}28`,
              borderRadius:'18px',
              boxShadow:`0 4px 28px ${selected.color}14`,
              overflow:'hidden',
            }}
          >
            {/* Banda de color superior */}
            <div style={{ height:'4px', background:selected.gradient }} />

            <div style={{ padding:'22px 24px 24px' }}>

              {/* ── Paso 2: Filtros ── */}
              <div style={{ marginBottom:'22px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:selected.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:800, color:'#fff' }}>2</div>
                    <span style={{ fontSize:'13px', fontWeight:700, color:'var(--text-heading)' }}>Configura los filtros</span>
                    {activeCount > 0 && (
                      <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', background:`${selected.color}15`, color:selected.color, borderRadius:'999px', border:`1px solid ${selected.color}30` }}>
                        {activeCount} activo{activeCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {activeCount > 0 && (
                    <button
                      onClick={() => {
                      setFilters(f => ({ ...f, [selected.tipo]: Object.fromEntries(Object.keys(f[selected.tipo]).map(k => [k, k === 'agrupacion' ? f[selected.tipo].agrupacion : ''])) }))
                      if (selected.tipo === 'ejecucion') setEjec({ data:[], loading:false, error:'' })
                    }}
                      style={{ fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'7px', cursor:'pointer', border:'1px solid rgba(185,28,28,0.22)', background:'rgba(185,28,28,0.06)', color:'#b91c1c', fontFamily:'var(--font-primary)' }}
                    >
                      ✕ Limpiar filtros
                    </button>
                  )}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'12px', alignItems:'flex-end' }}>
                  {FILTER_CONFIGS[selected.tipo].map(f => (
                    <div key={f.key} style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                      <label style={{ fontSize:'10px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{f.label}</label>
                      {f.type === 'month_select' ? (
                        <select
                          value={filters[selected.tipo][f.key] || ''}
                          onChange={e => setFilters(fi => ({ ...fi, [selected.tipo]: { ...fi[selected.tipo], [f.key]: e.target.value } }))}
                          style={{ ...inputS, minWidth:'130px', cursor:'pointer' }}
                        >
                          <option value=''>Todos los meses</option>
                          {MESES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                        </select>
                      ) : f.type === 'select' ? (
                        <select
                          value={filters[selected.tipo][f.key] || ''}
                          onChange={e => setFilters(fi => ({ ...fi, [selected.tipo]: { ...fi[selected.tipo], [f.key]: e.target.value } }))}
                          style={{ ...inputS, minWidth: f.width || '130px', cursor:'pointer' }}
                        >
                          {f.options.map((o, i) => <option key={o} value={o}>{f.labels ? f.labels[i] : (o || 'Todos')}</option>)}
                        </select>
                      ) : (
                        <input
                          type={f.type}
                          inputMode={f.numeric ? 'numeric' : undefined}
                          maxLength={f.maxLength || undefined}
                          value={filters[selected.tipo][f.key] || ''}
                          onChange={e => {
                            let val = e.target.value
                            if (f.numeric) val = val.replace(/\D/g, '').slice(0, f.maxLength)
                            setFilters(fi => ({ ...fi, [selected.tipo]: { ...fi[selected.tipo], [f.key]: val } }))
                          }}
                          onKeyDown={f.numeric ? (e => { if (!/\d/.test(e.key) && !e.ctrlKey && !e.metaKey && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') e.preventDefault() }) : undefined}
                          placeholder={f.placeholder || ''}
                          style={{ ...inputS, width: f.width || '130px', fontFamily: f.numeric ? 'monospace' : 'var(--font-primary)', letterSpacing: f.numeric ? '0.08em' : 'normal' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ height:'1px', background:'rgba(26,58,92,0.07)', marginBottom:'20px' }} />

              {/* ── Paso 3: Exportar / Gráfico ── */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                  <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:selected.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:800, color:'#fff' }}>3</div>
                  <span style={{ fontSize:'13px', fontWeight:700, color:'var(--text-heading)' }}>
                    {selected.tipo === 'ejecucion' ? 'Generar gráfico' : 'Exportar reporte'}
                  </span>
                </div>

                {selected.tipo === 'ejecucion' ? (
                  <>
                    <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                      <motion.button
                        whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                        onClick={handleEjecucion}
                        disabled={ejec.loading}
                        style={{
                          display:'flex', alignItems:'center', gap:'8px',
                          padding:'10px 20px', borderRadius:'10px', cursor: ejec.loading ? 'default' : 'pointer',
                          background:'linear-gradient(135deg,#0d1035,#2e31a4)', border:'none',
                          color:'#fff', fontSize:'13px', fontWeight:700, fontFamily:'var(--font-primary)',
                          opacity: ejec.loading ? 0.65 : 1, boxShadow:'0 4px 14px rgba(46,49,164,0.30)',
                        }}
                      >
                        {ejec.loading ? <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> : <BarChart2 size={15}/>}
                        {ejec.loading ? 'Cargando datos...' : 'Generar gráfico'}
                      </motion.button>

                      {ejec.data.length > 0 && (
                        <motion.button
                          whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                          onClick={handlePrintEjec}
                          style={{
                            display:'flex', alignItems:'center', gap:'8px',
                            padding:'10px 20px', borderRadius:'10px', cursor:'pointer',
                            background:'rgba(46,49,164,0.10)', border:'1px solid rgba(46,49,164,0.28)',
                            color:'#2e31a4', fontSize:'13px', fontWeight:700, fontFamily:'var(--font-primary)',
                          }}
                        >
                          <Printer size={15}/> Descargar PDF
                        </motion.button>
                      )}
                    </div>

                    <AnimatePresence>
                      {ejec.error && (
                        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                          style={{ marginTop:'12px', background:'rgba(139,15,15,0.08)', border:'1px solid rgba(139,15,15,0.22)', borderRadius:'8px', padding:'9px 13px', color:'#b91c1c', fontSize:'12px', fontWeight:500 }}>
                          {ejec.error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {ejec.data.length > 0 && (
                        <motion.div
                          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}
                          style={{ marginTop:'20px' }}
                        >
                          {/* Leyenda */}
                          <div style={{ display:'flex', gap:'16px', marginBottom:'14px', flexWrap:'wrap', fontSize:'11px', fontWeight:600, color:'var(--text-muted)' }}>
                            <span><span style={{ color:'#2ea466', fontSize:'16px', lineHeight:1 }}>■</span> &lt; 75%</span>
                            <span><span style={{ color:'#d97706', fontSize:'16px', lineHeight:1 }}>■</span> 75 – 99%</span>
                            <span><span style={{ color:'#a42e2e', fontSize:'16px', lineHeight:1 }}>■</span> 100% o más</span>
                          </div>
                          <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={ejec.data} margin={{ top:20, right:20, left:10, bottom:ejec.data.length > 6 ? 70 : 40 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(26,58,92,0.08)" />
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize:10, fill:'#374151', fontFamily:'monospace' }}
                                angle={ejec.data.length > 5 ? -35 : 0}
                                textAnchor={ejec.data.length > 5 ? 'end' : 'middle'}
                                interval={0}
                              />
                              <YAxis
                                tickFormatter={v => `${v}%`}
                                domain={[0, 'auto']}
                                tick={{ fontSize:10, fill:'#6b7280' }}
                              />
                              <RTooltip content={<EjecTooltip />} cursor={{ fill:'rgba(46,49,164,0.05)' }} />
                              <ReferenceLine y={100} stroke="#a42e2e" strokeDasharray="4 3" strokeWidth={1.5} label={{ value:'100%', position:'insideTopRight', fontSize:9, fill:'#a42e2e' }} />
                              <Bar dataKey="pct" radius={[4,4,0,0]} maxBarSize={60}
                                label={{ position:'top', formatter:v=>`${v}%`, fontSize:10, fontWeight:700, fill:'#374151' }}
                              >
                                {ejec.data.map((d, i) => (
                                  <Cell key={i} fill={barColor(d.pct)} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                          <div style={{ textAlign:'center', fontSize:'10px', color:'var(--text-muted)', marginTop:'4px' }}>
                            % Certificado / Codificado — Año {selectedCedula?.anio || '—'}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <>
                    <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                      <motion.button
                        whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                        onClick={handleCsv}
                        disabled={loadingCsv}
                        style={{
                          display:'flex', alignItems:'center', gap:'8px',
                          padding:'10px 20px', borderRadius:'10px', cursor: loadingCsv ? 'default' : 'pointer',
                          background:'rgba(5,150,105,0.09)', border:'1px solid rgba(5,150,105,0.25)',
                          color:'#047857', fontSize:'13px', fontWeight:700, fontFamily:'var(--font-primary)',
                          opacity: loadingCsv ? 0.65 : 1, transition:'all 0.18s',
                        }}
                        onMouseEnter={e => { if (!loadingCsv) e.currentTarget.style.background='rgba(5,150,105,0.16)' }}
                        onMouseLeave={e => { e.currentTarget.style.background='rgba(5,150,105,0.09)' }}
                      >
                        {loadingCsv ? <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> : <Download size={15}/>}
                        {loadingCsv ? 'Generando...' : 'Descargar CSV'}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                        onClick={handlePreview}
                        disabled={loadingPrint}
                        style={{
                          display:'flex', alignItems:'center', gap:'8px',
                          padding:'10px 20px', borderRadius:'10px', cursor: loadingPrint ? 'default' : 'pointer',
                          background:`${selected.color}12`, border:`1px solid ${selected.color}30`,
                          color:selected.color, fontSize:'13px', fontWeight:700, fontFamily:'var(--font-primary)',
                          opacity: loadingPrint ? 0.65 : 1, transition:'all 0.18s',
                        }}
                        onMouseEnter={e => { if (!loadingPrint) e.currentTarget.style.background=`${selected.color}20` }}
                        onMouseLeave={e => { e.currentTarget.style.background=`${selected.color}12` }}
                      >
                        {loadingPrint ? <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> : <Printer size={15}/>}
                        {loadingPrint ? 'Cargando...' : 'Vista previa / PDF'}
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {csvError && (
                        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                          style={{ marginTop:'12px', background:'rgba(139,15,15,0.08)', border:'1px solid rgba(139,15,15,0.22)', borderRadius:'8px', padding:'9px 13px', color:'#b91c1c', fontSize:'12px', fontWeight:500 }}>
                          {csvError}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal vista previa */}
      <AnimatePresence>
        {preview.open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position:'fixed', inset:0,
                background:'rgba(10,25,47,0.65)',
                backdropFilter:'blur(6px)',
                display:'flex', alignItems:'flex-start', justifyContent:'center',
                zIndex:9999, overflowY:'auto', padding:'20px 0',
                paddingLeft:'240px',
              }}
            >
              <motion.div
                initial={{ opacity:0, scale:0.96, y:20 }}
                animate={{ opacity:1, scale:1, y:0 }}
                exit={{ opacity:0, scale:0.96, y:20 }}
                transition={{ type:'spring', stiffness:160, damping:22 }}
                style={{
                  background:'rgba(255,255,255,0.97)',
                  backdropFilter:'blur(20px)',
                  border:'1px solid rgba(255,255,255,0.95)',
                  borderRadius:'18px',
                  padding:'16px',
                  width:1060, maxWidth:'99vw',
                  boxShadow:'0 24px 80px rgba(10,25,47,0.35)',
                  fontFamily:'var(--font-primary)',
                }}
              >
                {/* Toolbar */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                  <span style={{ fontWeight:800, fontSize:'14px', color:'var(--text-heading)' }}>
                    Vista previa — {cfg?.titulo}
                  </span>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <motion.button
                      whileHover={{ scale:1.02 }}
                      whileTap={{ scale:0.98 }}
                      onClick={() => {
                        const prev = document.title
                        document.title = buildFilename(preview.tipo, 'pdf').replace('.pdf','')
                        window.print()
                        setTimeout(() => { document.title = prev }, 1000)
                      }}
                      style={{
                        display:'flex', alignItems:'center', gap:'5px',
                        background:'linear-gradient(135deg, #1a3a5c, #2e6ca4)',
                        color:'#fff', border:'none', padding:'7px 14px',
                        borderRadius:'8px', cursor:'pointer', fontWeight:700,
                        fontSize:'13px', fontFamily:'var(--font-primary)',
                        boxShadow:'0 4px 14px rgba(26,58,92,0.30)',
                      }}
                    >
                      <Printer size={14} /> Imprimir
                    </motion.button>
                    <motion.button
                      whileHover={{ scale:1.02 }}
                      whileTap={{ scale:0.98 }}
                      onClick={closePreview}
                      style={{
                        display:'flex', alignItems:'center', gap:'4px',
                        background:'rgba(26,58,92,0.06)',
                        color:'var(--text-muted)',
                        border:'1px solid rgba(26,58,92,0.12)',
                        padding:'7px 12px', borderRadius:'8px',
                        cursor:'pointer', fontWeight:600, fontSize:'13px',
                        fontFamily:'var(--font-primary)',
                      }}
                    >
                      <X size={14} /> Cerrar
                    </motion.button>
                  </div>
                </div>

                {/* Documento */}
                <div style={{
                  background:'#fff', width:1032, minHeight:730,
                  margin:'0 auto', padding:'32px 30px 28px',
                  fontFamily:FONT, fontSize:'9px', color:'#000',
                  boxSizing:'border-box', textTransform:'uppercase',
                  display:'flex', flexDirection:'column',
                  border:'1px solid rgba(26,58,92,0.10)',
                  borderRadius:'4px',
                }}>
                  {preview.error ? (
                    <div style={{ padding:'40px', textAlign:'center', color:'#be123c', fontSize:'13px' }}>
                      Error: {preview.error}
                    </div>
                  ) : (
                    <>
                      <div style={{ border:'2px solid #000', background:BEIGE, textAlign:'center', fontWeight:'bold', fontSize:'12px', letterSpacing:'2px', padding:'9px 0', marginBottom:'10px' }}>
                        UNIVERSIDAD ESTATAL DE BOLÍVAR
                      </div>
                      <div style={{ border:'2px solid #000', padding:'8px 12px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <div style={{ fontWeight:'bold', fontSize:'10px', letterSpacing:'1px' }}>{cfg?.titulo}</div>
                          <div style={{ fontSize:'8.5px', marginTop:'4px', color:'#444', textTransform:'none' }}>
                            Sistema de Control Presupuestario — Grupos de Gasto 51 y 58
                          </div>
                        </div>
                        <div style={{ textAlign:'right', fontSize:'8.5px', textTransform:'none' }}>
                          <div><strong>Fecha de emisión:</strong></div>
                          <div style={{ fontWeight:'bold' }}>{fecha}</div>
                          <div style={{ marginTop:'3px' }}>Total registros: <strong>{preview.data.length}</strong></div>
                        </div>
                      </div>
                      {cfg && <cfg.Tabla data={preview.data} />}
                      <div style={{ flex:1 }}></div>
                      <div style={{ marginTop:'18px', paddingTop:'8px', borderTop:'1px solid #aaa', display:'flex', justifyContent:'space-between', fontSize:'8px', color:'#777', textTransform:'none' }}>
                        <span>Sistema de Control Presupuestario — UEB</span>
                        <span>Documento generado el {fecha}</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>

        )}
      </AnimatePresence>

      {createPortal(
        <div id="rpt-print-root">
          {preview.open && !preview.error && (
            <>
              <div style={{ border:'2px solid #000', background:BEIGE, textAlign:'center', fontWeight:'bold', fontSize:'12px', letterSpacing:'2px', padding:'9px 0', marginBottom:'10px' }}>
                UNIVERSIDAD ESTATAL DE BOLÍVAR
              </div>
              <div style={{ border:'2px solid #000', padding:'8px 12px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:'bold', fontSize:'10px', letterSpacing:'1px' }}>{cfg?.titulo}</div>
                  <div style={{ fontSize:'8.5px', marginTop:'4px', color:'#444', textTransform:'none' }}>Sistema de Control Presupuestario — Grupos de Gasto 51 y 58</div>
                </div>
                <div style={{ textAlign:'right', fontSize:'8.5px', textTransform:'none' }}>
                  <div><strong>Fecha de emisión:</strong></div>
                  <div style={{ fontWeight:'bold' }}>{fecha}</div>
                  <div style={{ marginTop:'3px' }}>Total registros: <strong>{preview.data.length}</strong></div>
                </div>
              </div>
              {cfg && <cfg.Tabla data={preview.data} />}
              <div style={{ marginTop:'18px', paddingTop:'8px', borderTop:'1px solid #aaa', display:'flex', justifyContent:'space-between', fontSize:'8px', color:'#777', textTransform:'none' }}>
                <span>Sistema de Control Presupuestario — UEB</span>
                <span>Documento generado el {fecha}</span>
              </div>
            </>
          )}

          {printEjec && ejec.data.length > 0 && (() => {
            const agrupadoPor = { programa:'Programa', actividad:'Actividad', fuente:'Fuente', item:'Ítem' }[filters.ejecucion.agrupacion] || ''
            const chartW = 960
            const chartH = Math.max(240, Math.min(ejec.data.length * 36, 490))
            return (
              <>
                <div style={{ border:'2px solid #000', background:BEIGE, textAlign:'center', fontWeight:'bold', fontSize:'12px', letterSpacing:'2px', padding:'9px 0', marginBottom:'10px', fontFamily:FONT }}>
                  UNIVERSIDAD ESTATAL DE BOLÍVAR
                </div>
                <div style={{ border:'2px solid #000', padding:'8px 12px', marginBottom:'14px', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:FONT }}>
                  <div>
                    <div style={{ fontWeight:'bold', fontSize:'10px', letterSpacing:'1px' }}>EJECUCIÓN PRESUPUESTARIA — AGRUPADO POR {agrupadoPor.toUpperCase()}</div>
                    <div style={{ fontSize:'8.5px', marginTop:'4px', color:'#444' }}>Sistema de Control Presupuestario — Grupos de Gasto 51 y 58 — Año {selectedCedula?.anio || '—'}</div>
                  </div>
                  <div style={{ textAlign:'right', fontSize:'8.5px' }}>
                    <div><strong>Fecha de emisión:</strong></div>
                    <div style={{ fontWeight:'bold' }}>{fecha}</div>
                    <div style={{ marginTop:'3px' }}>Grupos: <strong>{ejec.data.length}</strong></div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'18px', marginBottom:'10px', fontSize:'8px', fontFamily:FONT }}>
                  <span><span style={{ color:'#2ea466', fontWeight:'bold' }}>■</span> Menor a 75%</span>
                  <span><span style={{ color:'#d97706', fontWeight:'bold' }}>■</span> Entre 75% y 99%</span>
                  <span><span style={{ color:'#a42e2e', fontWeight:'bold' }}>■</span> 100% o más</span>
                </div>
                <BarChart width={chartW} height={chartH} data={ejec.data}
                  margin={{ top:16, right:56, left:8, bottom: ejec.data.length > 8 ? 60 : 36 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.08)" />
                  <XAxis dataKey="name" tick={{ fontSize:8, fill:'#333', fontFamily:'monospace' }}
                    angle={ejec.data.length > 6 ? -35 : 0}
                    textAnchor={ejec.data.length > 6 ? 'end' : 'middle'}
                    interval={0}
                  />
                  <YAxis tickFormatter={v=>`${v}%`} domain={[0,'auto']} tick={{ fontSize:8, fill:'#555' }} />
                  <ReferenceLine y={100} stroke="#a42e2e" strokeDasharray="4 3" strokeWidth={1.5}
                    label={{ value:'100%', position:'insideTopRight', fontSize:7, fill:'#a42e2e' }}
                  />
                  <Bar dataKey="pct" radius={[3,3,0,0]} maxBarSize={ejec.data.length > 12 ? 30 : 50}
                    label={{ position:'top', formatter:v=>`${v}%`, fontSize:8, fontWeight:700, fill:'#222' }}
                  >
                    {ejec.data.map((d,i) => <Cell key={i} fill={barColor(d.pct)} />)}
                  </Bar>
                </BarChart>
                <div style={{ marginTop:'14px', paddingTop:'7px', borderTop:'1px solid #aaa', display:'flex', justifyContent:'space-between', fontSize:'7px', color:'#777', fontFamily:FONT }}>
                  <span>Sistema de Control Presupuestario — UEB</span>
                  <span>Documento generado el {fecha}</span>
                </div>
              </>
            )
          })()}
        </div>,
        document.body
      )}
    </div>
  )
}
