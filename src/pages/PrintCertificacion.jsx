import { useState, useEffect } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { X, Printer } from 'lucide-react'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

/* ══════════════════════════════════════════
   UTILIDADES
══════════════════════════════════════════ */
function numeroALetras(monto) {
  const num = parseFloat(monto) || 0
  const [entStr, centsStr] = num.toFixed(2).split('.')
  const entero = parseInt(entStr)
  const U = ['','UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE',
             'DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS',
             'DIECISIETE','DIECIOCHO','DIECINUEVE']
  const D = ['','','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA']
  const C = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS',
             'SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS']
  function bl(n) {
    if (!n) return ''
    if (n === 100) return 'CIEN'
    let r = ''
    if (n >= 100) { r += C[Math.floor(n/100)] + ' '; n %= 100 }
    if (n >= 20)  { r += D[Math.floor(n/10)]; if (n%10) r += ' Y ' + U[n%10] }
    else if (n)   r += U[n]
    return r.trim()
  }
  let r = ''
  if (!entero) r = 'CERO'
  else if (entero < 1000) r = bl(entero)
  else if (entero < 1000000) {
    const k = Math.floor(entero/1000), rem = entero%1000
    r = (k===1?'MIL':bl(k)+' MIL') + (rem?' '+bl(rem):'')
  } else {
    const M = Math.floor(entero/1000000), rem = entero%1000000
    r = M===1 ? 'UN MILLÓN' : bl(M)+' MILLONES'
    const k = Math.floor(rem/1000)
    if (k) r += ' '+(k===1?'MIL':bl(k)+' MIL')
    const f = rem%1000
    if (f) r += ' '+bl(f)
  }
  return r.trim()+` DÓLARES ${centsStr}/100`
}

function pFecha(s) {
  if (!s) return { d:'--', m:'--', y:'----', fmt:'--/--/----' }
  const [y,m,d] = String(s).split('T')[0].split('-')
  return { d:d||'--', m:m||'--', y:y||'----', fmt:`${d||'--'}-${m||'--'}-${y||'----'}` }
}

function fmt$(n) {
  const v = parseFloat(n)||0
  return '$. '+v.toLocaleString('es-EC',{minimumFractionDigits:2,maximumFractionDigits:2})
}

/* ══════════════════════════════════════════
   TOKENS DE ESTILO
══════════════════════════════════════════ */
const FONT   = 'Arial, sans-serif'
const BRD    = '2px solid #000'
const BEIGE  = '#ede8d5'          /* fondo de títulos  */
const COLS   = [
  ['PG','4%'],['SP','4%'],['PY','4%'],['ACT','4%'],
  ['ITEM','7%'],['UBG','5%'],['FTE','4%'],['ORG','5%'],
  ['N.Prest','5%'],['DESCRIPCION','46%'],['MONTO','12%'],
]

/* ══════════════════════════════════════════
   COMPONENTE
══════════════════════════════════════════ */
export default function PrintCertificacion({ certId, onClose }) {
  const [cert,    setCert]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/certificacion/${certId}`, {
          headers: { Authorization: `Bearer ${Cookies.get('auth_token')}` },
        })
        setCert(data.data)
      } catch { setError('No se pudo cargar el certificado.') }
      finally  { setLoading(false) }
    })()
  }, [certId])

  if (loading) return <Velo><span style={{color:'#fff',fontSize:16}}>Cargando...</span></Velo>
  if (error)   return <Velo onClick={onClose}><span style={{color:'#fca5a5',fontSize:16}}>{error}</span></Velo>

  const fecha = pFecha(cert.fecha_elaboracion)
  const items = cert.items || []
  const total = items.reduce((s,it)=>s+parseFloat(it.monto||0),0)

  /* estilos tabla ítems — sin bordes de celda */
  const TH  = { borderBottom:BRD, padding:'4px 3px', textAlign:'center', fontWeight:'bold', fontSize:'9px', background:BEIGE }
  const TD  = { padding:'3px 3px', textAlign:'center', fontSize:'9px' }
  const TDL = { padding:'3px 6px', textAlign:'left',   fontSize:'9px' }
  const TDR = { padding:'3px 6px', textAlign:'right',  fontSize:'9px' }

  return (
    <>
      {/* ── print CSS ── */}
      <style>{`
        @media print {
          body * { visibility:hidden !important; }
          #pcdoc, #pcdoc * { visibility:visible !important; }
          #pctoolbar { display:none !important; }
          #pcdoc {
            position:fixed !important; top:0 !important; left:0 !important;
            width:210mm !important; height:297mm !important;
            padding:25mm 14mm 12mm 14mm !important; box-sizing:border-box !important;
            background:#fff !important; color:#000 !important;
            overflow:hidden !important; font-family:Arial,sans-serif !important;
            display:flex !important; flex-direction:column !important;
          }
          @page { size:A4 portrait; margin:0; }
        }
      `}</style>

      {/* ── overlay ── */}
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',display:'flex',
                   alignItems:'flex-start',justifyContent:'center',zIndex:9999,
                   overflowY:'auto',padding:'20px 0'}}>
        <div style={{background:'rgba(255,255,255,0.95)',border:'1px solid rgba(46,108,164,0.18)',borderRadius:8,padding:14,width:920,maxWidth:'99vw'}}>

          {/* toolbar */}
          <div id="pctoolbar" style={{display:'flex',justifyContent:'space-between',
                                      alignItems:'center',marginBottom:10}}>
            <span style={{fontWeight:700,fontSize:14,color:'#1a3a5c'}}>
              Vista previa — {cert.numero_certificado}
            </span>
            <div style={{display:'flex',gap:8}}>
              <button onClick={() => {
                const fechaFmt = fecha.fmt.replace(/\//g, '-')
                const nombre = `UEB_Certificacion_Presupuestaria_${cert.numero_certificado}_${cert.estado}_${fechaFmt}`
                const prev = document.title
                document.title = nombre
                window.print()
                setTimeout(() => { document.title = prev }, 1000)
              }} style={BTNP}><Printer size={14}/> Imprimir</button>
              <button onClick={onClose}             style={BTNC}><X       size={14}/> Cerrar</button>
            </div>
          </div>

          {/* ══════════ DOCUMENTO A4 ══════════ */}
          <div id="pcdoc" style={{
            background:'#fff', width:892, height:1123, margin:'0 auto',
            padding:'78px 38px 28px 38px', fontFamily:FONT, fontSize:'9px', color:'#000',
            boxSizing:'border-box', display:'flex', flexDirection:'column',
            textTransform:'uppercase',
          }}>

            {/* ▌1. TÍTULO ▐ */}
            <div style={{
              border:BRD, background:BEIGE,
              textAlign:'center', fontWeight:'bold',
              fontSize:'13px', letterSpacing:'2px',
              padding:'10px 0',
              marginBottom:'12px',
            }}>
              CERTIFICACION DE RECURSOS-M
            </div>

            {/* ▌2. CONTENEDOR PRINCIPAL ▐ */}
            <div style={{border:BRD, padding:'8px', marginTop:'3px', display:'flex', flexDirection:'column', gap:'14px'}}>

            {/* fila: Institution + NO.CERT + FECHA */}
            <div style={{display:'flex', gap:'14px'}}>

              {/* div: Institution / Sección / Memorando */}
              <div style={{border:BRD, flex:1}}>
                <Row label="Institution:"  val="UNIVERSIDAD ESTATAL DE BOLIVAR" />
                <Row label="Sección:"       val="PRESUPUESTO" />
                <Row label="Memorando N.-"  val={cert.seccion_memorando||'-'} last />
              </div>

              {/* div: NO. CERTIFICACION */}
              <div style={{border:BRD, width:'150px', flexShrink:0, alignSelf:'flex-start'}}>
                <div style={{borderBottom:BRD, padding:'5px 6px', textAlign:'center',
                             fontSize:'7.5px', fontWeight:'bold'}}>
                  NO. CERTIFICACION
                </div>
                <div style={{padding:'6px', textAlign:'center',
                             fontSize:'9px', fontWeight:'bold'}}>
                  {cert.numero_certificado}
                </div>
              </div>

              {/* div: FECHA DE ELABORACION */}
              <div style={{border:BRD, width:'195px', flexShrink:0, alignSelf:'flex-start'}}>
                <div style={{borderBottom:BRD, padding:'5px 8px', textAlign:'center',
                             fontSize:'7.5px', fontWeight:'bold'}}>
                  FECHA DE ELABORACION
                </div>
                <div style={{display:'flex'}}>
                  {[fecha.d, fecha.m, fecha.y].map((v,i)=>(
                    <div key={i} style={{
                      flex: i === 2 ? 2 : 1,
                      borderLeft: i > 0 ? BRD : 'none',
                      padding:'5px 4px',
                      textAlign:'center',
                      fontWeight:'bold',
                      fontSize:'9px',
                    }}>
                      {v}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ── TIPO + CLASE DOC RESPALDO ── */}
            <div style={{border:BRD, display:'flex'}}>

              {/* TIPO DE DOCUMENTO RESPALDO */}
              <div style={{width:'35%'}}>
                <div style={{borderBottom:BRD, padding:'5px 8px',
                             fontSize:'9px', fontWeight:'bold'}}>
                  TIPO DE DOCUMENTO RESPALDO
                </div>
                <div style={{padding:'8px', minHeight:'32px', fontSize:'9px'}}>
                  {cert.tipo_doc_respaldo||''}
                </div>
              </div>

              {/* CLASE DE DOCUMENTO RESPALDO */}
              <div style={{flex:1, borderLeft:BRD}}>
                <div style={{borderBottom:BRD, padding:'5px 8px',
                             fontSize:'9px', fontWeight:'bold'}}>
                  CLASE DE DOCUMENTO RESPALDO
                </div>
                <div style={{padding:'8px', minHeight:'32px', fontSize:'9px'}}>
                  {cert.clase_doc_respaldo||''}
                </div>
              </div>

            </div>

            </div>{/* ── cierre contenedor principal ── */}

            {/* ▌4. CLASE REGISTRO / CLASE GASTO ▐ */}
            <div style={{borderBottom:BRD, borderLeft:BRD, borderRight:BRD, marginTop:0, display:'inline-flex',
                         alignItems:'center', padding:'6px 10px', gap:'8px'}}>
              <span style={{fontWeight:'bold',fontSize:'9px'}}>CLASE DE REGISTRO</span>
              <span style={{display:'inline-block',border:BRD,minWidth:'50px',height:'16px',
                            padding:'1px 4px',fontSize:'9px',verticalAlign:'middle'}}>
                {cert.clase_registro||''}
              </span>
              <span style={{fontWeight:'bold',fontSize:'9px',marginLeft:'10px'}}>CLASE DE GASTO</span>
              <span style={{display:'inline-block',border:BRD,minWidth:'50px',height:'16px',
                            padding:'1px 4px',fontSize:'9px',verticalAlign:'middle'}}>
                {cert.clase_gasto||''}
              </span>
            </div>

            {/* ▌5. SEGUNDO TÍTULO ▐ */}
            <div style={{
              border:BRD, marginTop:'20px', background:BEIGE,
              textAlign:'center', fontWeight:'bold',
              fontSize:'12px', letterSpacing:'1.5px',
              padding:'7px 0',
            }}>
              CERTIFICACION DE RECURSOS-M
            </div>

            {/* ▌6. TABLA DE ÍTEMS ▐ */}
            <table style={{width:'100%',borderCollapse:'collapse',marginTop:'3px'}}>
              <thead>
                <tr>{COLS.map(([h,w])=><th key={h} style={{...TH,width:w}}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {items.map((it,i)=>(
                  <tr key={i}>
                    <td style={TD}>{it.programa?.cod_programa??it.id_programa}</td>
                    <td style={TD}>{String(it.subprograma?.cod_subprograma??it.id_subprograma??'').slice(-2)}</td>
                    <td style={TD}>{String(it.proyecto?.cod_proyecto??it.id_proyecto??'').slice(-3)}</td>
                    <td style={TD}>{String(it.actividad?.cod_actividad??it.id_actividad??'').slice(-3)}</td>
                    <td style={TD}>{it.item?.cod_item??it.id_item}</td>
                    <td style={TD}>{it.ubicacion?.cod_ubicacion??it.id_ubicacion}</td>
                    <td style={TD}>{it.fuente?.cod_fuente??it.id_fuente}</td>
                    <td style={TD}>{it.organismo?.cod_organismo??it.id_organismo}</td>
                    <td style={TD}>{it.naturaleza?.cod_naturaleza??it.id_naturaleza}</td>
                    <td style={TDL}>{it.item?.nombre_item??'-'}</td>
                    <td style={TDR}>{fmt$(it.monto)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={10} style={{borderTop:BRD,textAlign:'right',fontWeight:'bold',
                                           fontSize:'9.5px',padding:'50px 8px 6px 8px'}}>
                    TOTAL PRESUPUESTARIO
                  </td>
                  <td style={{...TDR,borderTop:BRD,fontWeight:'bold',fontSize:'9.5px',paddingTop:'50px'}}>{fmt$(total)}</td>
                </tr>
              </tbody>
            </table>

            {/* ▌7. SON ▐ */}
            <div style={{borderTop:BRD,borderBottom:BRD,marginTop:'20px',padding:'10px 12px',
                         display:'flex',alignItems:'center',gap:'16px'}}>
              <span style={{fontWeight:'bold',fontSize:'9.5px',whiteSpace:'nowrap'}}>SON:</span>
              <span style={{fontWeight:'bold',fontSize:'12px'}}>{numeroALetras(total)}</span>
            </div>

            {/* ▌8. DESCRIPCION ▐ */}
            <div style={{marginTop:'3px',padding:'8px 10px',
                         fontSize:'9px',lineHeight:'1.55',minHeight:'110px'}}>
              <span style={{fontWeight:'bold'}}>DESCRIPCION:</span>
              <div style={{marginTop:'5px'}}>{cert.descripcion||''}</div>
            </div>

            {/* espacio flexible → footer al fondo */}
            <div style={{flex:1}}></div>

            {/* ▌9. FOOTER ▐ */}
            <table style={{width:'100%',borderCollapse:'collapse',marginTop:'3px',marginBottom:'60px'}}>
              <tbody>
                <tr>
                  <td style={{border:BRD,width:'33%',textAlign:'center',fontWeight:'bold',fontSize:'13px',padding:'12px 7px'}}>ESTADO</td>
                  <td style={{border:BRD,width:'33%',textAlign:'center',fontWeight:'bold',fontSize:'13px',padding:'12px 7px'}}>RESGISTRADO:</td>
                  <td style={{border:BRD,width:'34%',textAlign:'center',fontWeight:'bold',fontSize:'13px',padding:'12px 7px'}}>APROBADO:</td>
                </tr>
                <tr>
                  <td style={{border:BRD,height:'110px',verticalAlign:'bottom',padding:'8px 12px',position:'relative'}}>
                    <div style={{
                      position:'absolute',top:'10px',left:'12px',right:'12px',
                      textAlign:'center',fontWeight:'bold',fontSize:'13px',
                      letterSpacing:'1.5px',
                    }}>
                      APROBADO
                    </div>
                    <div style={{fontWeight:'bold',fontSize:'10px'}}>FECHA:</div>
                    <div style={{fontSize:'10px',marginTop:'4px'}}>{fecha.fmt}</div>
                  </td>
                  <td style={{border:BRD,height:'110px',verticalAlign:'bottom',textAlign:'center',paddingBottom:'10px'}}>
                    <div style={{borderTop:BRD,paddingTop:'5px',fontSize:'10px',width:'80%',margin:'0 auto'}}>
                      Funcionario Responsable
                    </div>
                  </td>
                  <td style={{border:BRD,height:'110px',verticalAlign:'bottom',textAlign:'center',paddingBottom:'10px'}}>
                    <div style={{borderTop:BRD,paddingTop:'5px',fontSize:'10px',width:'70%',margin:'0 auto'}}>
                      Director Financiero
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

          </div>{/* fin #pcdoc */}
        </div>
      </div>
    </>
  )
}

/* ── Fila etiqueta + valor (sin celdas, solo línea divisoria inferior) ── */
function Row({ label, val, last }) {
  return (
    <div style={{
      display:'flex', alignItems:'center',
      padding:'6px 10px',
      borderBottom: last ? 'none' : '1px solid #000',
    }}>
      <span style={{fontSize:'9px', flexShrink:0, width:'84px'}}>{label}</span>
      <span style={{fontSize:'9.5px'}}>{val}</span>
    </div>
  )
}

/* ── Overlay de carga/error ── */
function Velo({ children, onClick }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',
                 alignItems:'center',justifyContent:'center',zIndex:9999}} onClick={onClick}>
      {children}
    </div>
  )
}

/* ── Estilos de botones ── */
const BTNP={display:'flex',alignItems:'center',gap:5,background:'linear-gradient(135deg,#1a3a5c,#2e6ca4)',color:'#fff',
            border:'none',padding:'7px 14px',borderRadius:'10px',cursor:'pointer',fontWeight:700,fontSize:13,fontFamily:"'Montserrat',system-ui,sans-serif",boxShadow:'0 3px 10px rgba(26,58,92,0.20)'}
const BTNC={display:'flex',alignItems:'center',gap:4,background:'rgba(26,58,92,0.07)',color:'#5a7a9f',
            border:'1px solid rgba(46,108,164,0.18)',padding:'7px 12px',borderRadius:'10px',cursor:'pointer',fontWeight:600,fontSize:13,fontFamily:"'Montserrat',system-ui,sans-serif"}
