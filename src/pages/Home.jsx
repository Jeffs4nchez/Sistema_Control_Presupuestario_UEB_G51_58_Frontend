import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import {
  Upload, Database, FileText, CheckCircle2,
  Users, ArrowRight, FileDown, DollarSign,
  TrendingUp, BarChart3,
} from 'lucide-react'

const CARD   = 'rgba(255,255,255,0.90)'
const BORDER = 'rgba(46,108,164,0.14)'
const BG     = '#f8fafd'
const ACCENT = '#2e6ca4'
const GREEN  = '#059669'
const RED    = '#b91c1c'
const GOLD   = '#d97706'
const TEAL   = '#0891b2'
const TEXT   = '#1a3a5c'
const MUTED  = '#5a7a9f'
const API    = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const fmtMoney = (n) => {
  const v = parseFloat(n)
  if (!n && n !== 0 || isNaN(v)) return '—'
  return '$' + v.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const pct = (part, total) =>
  !total ? 0 : Math.min(100, Math.round((part / total) * 100))

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function Home() {
  const navigate = useNavigate()
  const { user }  = useAuth()

  const [presupuesto, setPresupuesto] = useState(null)   // totales from /presupuesto-disponible
  const [estructura,  setEstructura]  = useState(null)   // summary from /estructura-presupuestaria/summary
  const [certList,    setCertList]    = useState([])     // list from /certificacion
  const [userCount,   setUserCount]   = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const token   = Cookies.get('auth_token')
    const headers = { Authorization: `Bearer ${token}` }

    const [pRes, eRes, cRes, uRes] = await Promise.allSettled([
      fetch(`${API}/presupuesto-disponible`,          { headers }).then(r => r.json()),
      fetch(`${API}/estructura-presupuestaria/summary`,{ headers }).then(r => r.json()),
      fetch(`${API}/certificacion?limit=500`,         { headers }).then(r => r.json()),
      fetch(`${API}/usuarios`,                        { headers }).then(r => r.json()),
    ])

    if (pRes.status === 'fulfilled' && pRes.value.success)
      setPresupuesto(pRes.value.totales)

    if (eRes.status === 'fulfilled' && (eRes.value.success || eRes.value.status === 'success'))
      setEstructura(eRes.value.data || eRes.value)

    if (cRes.status === 'fulfilled' && cRes.value.success)
      setCertList(cRes.value.data || [])

    if (uRes.status === 'fulfilled') {
      const d = uRes.value.data
      setUserCount(
        Array.isArray(d) ? d.length
          : typeof uRes.value.pagination?.total === 'number' ? uRes.value.pagination.total
          : null
      )
    }

    setLoading(false)
  }

  /* ── Derived values ─────────────────────────────── */
  const codificado   = presupuesto?.total_codificado  || 0
  const certificado  = presupuesto?.total_certificado || 0
  const saldo        = presupuesto?.total_saldo       || 0
  const totalItems   = presupuesto?.total_items       || 0
  const itemsSinSaldo = presupuesto?.items_sin_saldo  || 0

  const certPct      = pct(certificado,  codificado)
  const saldoPct     = pct(saldo,        codificado)
  const itemsConPct  = pct(totalItems - itemsSinSaldo, totalItems)
  const sinSaldoPct  = pct(itemsSinSaldo, totalItems)

  /* ── Monthly bar chart (last 6 months, cert count) ── */
  const monthlyData = (() => {
    const now = new Date()
    const last6 = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { label: MONTHS[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), count: 0 }
    })
    certList.forEach(cert => {
      if (!cert.fecha_elaboracion) return
      const d = new Date(cert.fecha_elaboracion + 'T12:00:00-05:00')
      const slot = last6.find(s => s.year === d.getFullYear() && s.month === d.getMonth())
      if (slot) slot.count++
    })
    return last6
  })()

  const maxCount = Math.max(...monthlyData.map(m => m.count), 1)

  const P = isMobile ? '20px' : '28px'

  return (
    <div style={{ minHeight: '100%', background: 'var(--page-bg)', padding: P, fontFamily: 'var(--font-primary)' }}>

      {/* ── Welcome banner ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg, #0d1f35 0%, #1a3a5c 55%, #2e6ca4 100%)', borderRadius: '16px', padding: isMobile ? '24px' : '28px 36px', marginBottom: '22px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(26,58,92,0.22)' }}
      >
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(84,179,224,0.10)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-30px', left:'38%', width:'160px', height:'160px', borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <p style={{ margin:'0 0 5px', fontSize:'11px', color:'rgba(84,179,224,0.85)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>
            Universidad Estatal de Bolívar
          </p>
          <h1 style={{ margin:'0 0 4px', fontSize: isMobile ? '20px' : '26px', fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>
            Bienvenido, {user?.nombres?.split(' ')[0] || 'Usuario'}
          </h1>
          <p style={{ margin:'0 0 18px', fontSize:'13px', color:'rgba(255,255,255,0.50)' }}>
            Panel de Control — Sistema de Control Presupuestario · Grupos 51 y 58
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
            <span style={{ fontSize:'11px', padding:'3px 12px', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'999px', color:'rgba(255,255,255,0.80)', fontWeight:600 }}>
              Año Fiscal {new Date().getFullYear()}
            </span>
            <span style={{ fontSize:'11px', padding:'3px 12px', background:'rgba(84,179,224,0.15)', border:'1px solid rgba(84,179,224,0.30)', borderRadius:'999px', color:'#54b3e0', fontWeight:600 }}>
              Grupos 51 y 58
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── KPI cards ───────────────────────────────────── */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:'12px', marginBottom:'22px' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:'14px', height:'110px', opacity:0.5 }} />
          ))}
        </div>
      ) : presupuesto && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:'12px', marginBottom:'22px' }}>
          {[
            { label:'Presupuesto Codificado', value: fmtMoney(codificado),  sub:'Total asignado + modificado',      icon:<DollarSign size={18}/>,   color:ACCENT, bar:null        },
            { label:'Total Certificado',      value: fmtMoney(certificado), sub:`${certPct}% del codificado`,        icon:<CheckCircle2 size={18}/>,  color:GOLD,   bar:certPct     },
            { label:'Saldo Disponible',       value: fmtMoney(saldo),       sub:`${saldoPct}% restante`,             icon:<TrendingUp size={18}/>,    color:GREEN,  bar:saldoPct    },
            { label:'Certificaciones',        value: certList.length,       sub:`${totalItems} partidas en sistema`, icon:<FileText size={18}/>,      color:TEAL,   bar:null        },
          ].map((k, i) => (
            <motion.div key={i}
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.07 }}
              style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:'14px', padding:'18px', backdropFilter:'blur(12px)', boxShadow:'0 2px 16px rgba(26,58,92,0.06)', borderTop:`3px solid ${k.color}` }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                <span style={{ fontSize:'10px', color:MUTED, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', lineHeight:1.3 }}>{k.label}</span>
                <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:`${k.color}12`, display:'flex', alignItems:'center', justifyContent:'center', color:k.color, flexShrink:0 }}>
                  {k.icon}
                </div>
              </div>
              <p style={{ margin:'0 0 3px', fontSize: isMobile ? '15px' : '19px', fontWeight:800, color:TEXT, letterSpacing:'-0.02em' }}>{k.value}</p>
              <p style={{ margin:0, fontSize:'10px', color:MUTED }}>{k.sub}</p>
              {k.bar !== null && (
                <div style={{ marginTop:'10px', background:`${k.color}15`, borderRadius:'3px', height:'3px', overflow:'hidden' }}>
                  <motion.div
                    initial={{ width:0 }} animate={{ width:`${k.bar}%` }} transition={{ duration:0.8, delay:0.3 + i*0.07 }}
                    style={{ height:'100%', background:k.color, borderRadius:'3px' }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Chart + Execution ───────────────────────────── */}
      {!loading && presupuesto && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap:'16px', marginBottom:'22px' }}>

          {/* Bar chart */}
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
            style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:'14px', padding:'20px', backdropFilter:'blur(12px)', boxShadow:'0 2px 16px rgba(26,58,92,0.06)' }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
              <div>
                <p style={{ margin:0, fontSize:'13px', fontWeight:700, color:TEXT }}>Certificaciones por Mes</p>
                <p style={{ margin:'2px 0 0', fontSize:'11px', color:MUTED }}>Cantidad emitida — últimos 6 meses</p>
              </div>
              <span style={{ fontSize:'10px', display:'flex', alignItems:'center', gap:'5px', color:MUTED }}>
                <span style={{ width:'8px', height:'8px', borderRadius:'2px', background:ACCENT, display:'inline-block' }} />
                N° certificados
              </span>
            </div>

            {monthlyData.every(m => m.count === 0) ? (
              <div style={{ height:'140px', display:'flex', alignItems:'center', justifyContent:'center', color:MUTED, fontSize:'12px' }}>
                Sin certificaciones en los últimos 6 meses
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'flex-end', gap: isMobile ? '6px' : '10px', height:'140px' }}>
                {monthlyData.map((m, i) => {
                  const barH = Math.max(4, (m.count / maxCount) * 110)
                  return (
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                      <span style={{ fontSize:'10px', color: m.count > 0 ? ACCENT : 'transparent', fontWeight:700 }}>{m.count}</span>
                      <div style={{ width:'100%', background:`${ACCENT}10`, borderRadius:'4px 4px 0 0', height:'110px', display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
                        <motion.div
                          initial={{ height:0 }} animate={{ height:`${barH}px` }} transition={{ duration:0.6, delay:0.4 + i*0.07, ease:[0.4,0,0.2,1] }}
                          style={{ width:'100%', background:`linear-gradient(180deg, #54b3e0, #1a3a5c)`, borderRadius:'4px 4px 0 0' }}
                        />
                      </div>
                      <span style={{ fontSize:'10px', color:MUTED, fontWeight:600 }}>{m.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Execution progress */}
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.42 }}
            style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:'14px', padding:'20px', backdropFilter:'blur(12px)', boxShadow:'0 2px 16px rgba(26,58,92,0.06)' }}
          >
            <p style={{ margin:'0 0 4px', fontSize:'13px', fontWeight:700, color:TEXT }}>Ejecución Presupuestaria</p>
            <p style={{ margin:'0 0 20px', fontSize:'11px', color:MUTED }}>Avance del ejercicio fiscal {new Date().getFullYear()}</p>

            {[
              { label:'Certificado vs Codificado', pct:certPct,   color:GOLD  },
              { label:'Partidas con saldo',         pct:itemsConPct, color:GREEN },
              { label:'Partidas sin saldo',         pct:sinSaldoPct, color:RED   },
            ].map((row, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? '16px' : 0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                  <span style={{ fontSize:'11px', color:MUTED, fontWeight:600 }}>{row.label}</span>
                  <span style={{ fontSize:'12px', color:row.color, fontWeight:700 }}>{row.pct}%</span>
                </div>
                <div style={{ background:`${row.color}15`, borderRadius:'4px', height:'6px', overflow:'hidden' }}>
                  <motion.div
                    initial={{ width:0 }} animate={{ width:`${row.pct}%` }} transition={{ duration:0.8, delay:0.5 + i*0.10 }}
                    style={{ height:'100%', background:row.color, borderRadius:'4px' }}
                  />
                </div>
              </div>
            ))}

            {userCount !== null && (
              <div style={{ marginTop:'20px', padding:'12px', background:BG, border:`1px solid ${BORDER}`, borderRadius:'10px', display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:`${ACCENT}12`, display:'flex', alignItems:'center', justifyContent:'center', color:ACCENT }}>
                  <Users size={16} />
                </div>
                <div>
                  <p style={{ margin:0, fontSize:'20px', fontWeight:800, color:TEXT }}>{userCount}</p>
                  <p style={{ margin:0, fontSize:'10px', color:MUTED }}>Usuarios en el sistema</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ── Structural stats ────────────────────────────── */}
      {!loading && estructura && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.48 }}
          style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:'14px', padding:'18px 20px', marginBottom:'22px', backdropFilter:'blur(12px)', boxShadow:'0 2px 16px rgba(26,58,92,0.06)' }}
        >
          <p style={{ margin:'0 0 14px', fontSize:'11px', fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.07em' }}>Estructura Presupuestaria Cargada</p>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(5,1fr)', gap:'10px' }}>
            {[
              { label:'Programas',    value: estructura.programas_count    || 0, color:ACCENT },
              { label:'Subprogramas', value: estructura.subprogramas_count || 0, color:TEAL   },
              { label:'Proyectos',    value: estructura.proyectos_count    || 0, color:GOLD   },
              { label:'Actividades',  value: estructura.actividades_count  || 0, color:GREEN  },
              { label:'Items',        value: estructura.items_count        || 0, color:RED    },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.50 + i*0.04 }}
                style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:'10px', padding:'12px', textAlign:'center', borderTop:`2px solid ${s.color}` }}
              >
                <p style={{ margin:'0 0 3px', fontSize:'20px', fontWeight:800, color:TEXT }}>{s.value.toLocaleString()}</p>
                <p style={{ margin:0, fontSize:'10px', color:MUTED, fontWeight:600 }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Quick actions ───────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.52 }}>
        <p style={{ margin:'0 0 12px', fontSize:'11px', fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.07em' }}>Acciones Rápidas</p>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:'10px' }}>
          {[
            { title:'Estructura Presupuestaria', desc:'Importar datos desde CSV',      icon:<Upload size={18}/>,      color:ACCENT, path:'/dashboard/estructura-presupuestaria'       },
            { title:'Ver Datos',                  desc:'Visualizar información cargada', icon:<Database size={18}/>,    color:TEAL,   path:'/dashboard/estructura-presupuestaria-data'  },
            { title:'Cédula Presupuestaria',      desc:'Gestionar asignaciones',         icon:<FileText size={18}/>,    color:GOLD,   path:'/dashboard/cedula-presupuestaria'           },
            { title:'Certificaciones',            desc:'Crear y gestionar certificados',  icon:<CheckCircle2 size={18}/>,color:GREEN,  path:'/dashboard/certificacion'                   },
            { title:'Gestionar Usuarios',         desc:'Administrar acceso de usuarios',  icon:<Users size={18}/>,       color:RED,    path:'/dashboard/usuarios'                        },
            { title:'Reportes',                   desc:'Exportar datos y documentos',     icon:<FileDown size={18}/>,    color:'#7c3aed', path:'/dashboard/reportes'                    },
          ].map((a, i) => (
            <motion.button key={i}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.54 + i*0.04 }}
              whileHover={{ y:-2 }} whileTap={{ scale:0.98 }}
              onClick={() => navigate(a.path)}
              style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px', background:CARD, border:`1px solid ${BORDER}`, borderRadius:'12px', cursor:'pointer', textAlign:'left', fontFamily:'var(--font-primary)', backdropFilter:'blur(12px)', boxShadow:'0 2px 8px rgba(26,58,92,0.04)', transition:'border-color 0.18s ease, box-shadow 0.18s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.color+'55'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,58,92,0.10)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(46,108,164,0.14)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,58,92,0.04)' }}
            >
              <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:`${a.color}12`, border:`1px solid ${a.color}25`, display:'flex', alignItems:'center', justifyContent:'center', color:a.color, flexShrink:0 }}>
                {a.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:700, color:TEXT }}>{a.title}</p>
                <p style={{ margin:0, fontSize:'11px', color:MUTED }}>{a.desc}</p>
              </div>
              <ArrowRight size={13} style={{ color:MUTED, flexShrink:0 }} />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Footer ──────────────────────────────────────── */}
      <div style={{ marginTop:'28px', paddingTop:'14px', borderTop:`1px solid ${BORDER}`, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'8px' }}>
        <p style={{ margin:0, fontSize:'11px', color:MUTED }}>Sistema Control Presupuestario © {new Date().getFullYear()} — UEB</p>
        <p style={{ margin:0, fontSize:'11px', color:MUTED }}>Versión 1.0</p>
      </div>
    </div>
  )
}
