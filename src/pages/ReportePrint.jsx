import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Cookies from 'js-cookie'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function fmt(v) {
  const n = parseFloat(v) || 0
  return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })
}

// ── Tablas por tipo ──────────────────────────────────────────────────────────

function TablaCertificaciones({ data }) {
  const total = data.reduce((s, r) => s + parseFloat(r.monto_total || 0), 0)
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>N° Certificado</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Unidad Requiriente</th>
            <th>Año Cédula</th>
            <th>Memorando</th>
            <th style={{ textAlign: 'right' }}>Monto Total</th>
            <th>Elaborado Por</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} className={r.estado === 'ANULADA' ? 'anulada' : ''}>
              <td><strong>{r.numero_certificado}</strong></td>
              <td>{r.fecha_elaboracion}</td>
              <td><span className={`badge badge-${r.estado?.toLowerCase()}`}>{r.estado}</span></td>
              <td>{r.nombre_entidad || '—'}</td>
              <td>{r.anio || '—'}</td>
              <td>{r.seccion_memorando || '—'}</td>
              <td style={{ textAlign: 'right' }}>{fmt(r.monto_total)}</td>
              <td>{r.elaborado_por || '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6}><strong>TOTAL</strong></td>
            <td style={{ textAlign: 'right' }}><strong>{fmt(total)}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </>
  )
}

function TablaLiquidaciones({ data }) {
  const totalLiq  = data.filter(r => r.estado !== 'ANULADA').reduce((s, r) => s + parseFloat(r.cantidad_liquidacion || 0), 0)
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Memorando</th>
            <th>Código Ítem</th>
            <th>Nombre Ítem</th>
            <th>N° Certificado</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right' }}>Monto Liquidado</th>
            <th>Motivo Anulación</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} className={r.estado === 'ANULADA' ? 'anulada' : ''}>
              <td>{r.id_liquidacion}</td>
              <td>{r.fecha_creacion}</td>
              <td>{r.memorando}</td>
              <td><code>{r.cod_item}</code></td>
              <td>{r.nombre_item}</td>
              <td>{r.numero_certificado || '—'}</td>
              <td><span className={`badge badge-${r.estado?.toLowerCase()}`}>{r.estado}</span></td>
              <td style={{ textAlign: 'right' }}>{fmt(r.cantidad_liquidacion)}</td>
              <td>{r.motivo_anulacion || '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={7}><strong>TOTAL LIQUIDADO (vigentes)</strong></td>
            <td style={{ textAlign: 'right' }}><strong>{fmt(totalLiq)}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </>
  )
}

function TablaPresupuesto({ data }) {
  const totalCod  = data.reduce((s, r) => s + (r.codificado  || 0), 0)
  const totalCert = data.reduce((s, r) => s + (r.certificado || 0), 0)
  const totalSald = data.reduce((s, r) => s + (r.saldo       || 0), 0)
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Código Ítem</th>
            <th>Nombre Ítem</th>
            <th>Programa</th>
            <th>Actividad</th>
            <th>Fuente</th>
            <th style={{ textAlign: 'right' }}>Codificado</th>
            <th style={{ textAlign: 'right' }}>Certificado</th>
            <th style={{ textAlign: 'right' }}>Saldo</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} className={r.saldo <= 0 ? 'sin-saldo' : ''}>
              <td><code>{r.cod_item}</code></td>
              <td>{r.nombre_item}</td>
              <td>{r.nombre_programa || '—'}</td>
              <td>{r.cod_actividad || '—'}</td>
              <td>{r.cod_fuente || '—'}</td>
              <td style={{ textAlign: 'right' }}>{fmt(r.codificado)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(r.certificado)}</td>
              <td style={{ textAlign: 'right', fontWeight: r.saldo <= 0 ? 700 : 400 }}>{fmt(r.saldo)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5}><strong>TOTALES</strong></td>
            <td style={{ textAlign: 'right' }}><strong>{fmt(totalCod)}</strong></td>
            <td style={{ textAlign: 'right' }}><strong>{fmt(totalCert)}</strong></td>
            <td style={{ textAlign: 'right' }}><strong>{fmt(totalSald)}</strong></td>
          </tr>
        </tfoot>
      </table>
    </>
  )
}

// ── Configuración por tipo ────────────────────────────────────────────────────

const CONFIG = {
  certificaciones: {
    titulo: 'Reporte de Certificaciones Presupuestarias',
    endpoint: '/reportes/certificaciones/json',
    Tabla: TablaCertificaciones,
  },
  liquidaciones: {
    titulo: 'Reporte de Liquidaciones',
    endpoint: '/reportes/liquidaciones/json',
    Tabla: TablaLiquidaciones,
  },
  presupuesto: {
    titulo: 'Reporte de Presupuesto Disponible',
    endpoint: '/reportes/presupuesto/json',
    Tabla: TablaPresupuesto,
  },
}

export default function ReportePrint() {
  const [params]  = useSearchParams()
  const tipo      = params.get('tipo') || 'certificaciones'
  const config    = CONFIG[tipo] || CONFIG.certificaciones

  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const token = Cookies.get('auth_token')
    fetch(`${API}${config.endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setData(json.data)
        } else {
          setError(json.message || 'Error al cargar datos')
        }
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setLoading(false))
  }, [tipo])

  useEffect(() => {
    if (!loading && !error && data.length > 0) {
      setTimeout(() => window.print(), 400)
    }
  }, [loading, error, data])

  const fecha = new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }
        .page { padding: 24px; max-width: 1100px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 2px solid #1a4f9c; }
        .header-left h1 { font-size: 15px; font-weight: 700; color: #1a4f9c; }
        .header-left p { font-size: 11px; color: #555; margin-top: 3px; }
        .header-right { text-align: right; font-size: 10px; color: #555; }
        .meta { display: flex; gap: 20px; margin-bottom: 14px; font-size: 11px; color: #444; }
        .meta span { background: #f0f4ff; border: 1px solid #c8d8f8; border-radius: 4px; padding: 3px 10px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #1a4f9c; color: #fff; padding: 6px 8px; text-align: left; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; }
        td { padding: 5px 8px; border-bottom: 1px solid #e5e9f0; }
        tr:nth-child(even) td { background: #f8faff; }
        tfoot td { background: #edf2ff !important; font-weight: 700; border-top: 2px solid #1a4f9c; }
        code { font-family: monospace; font-size: 9px; background: #f0f4ff; padding: 1px 4px; border-radius: 3px; }
        .badge { display: inline-block; padding: 1px 7px; border-radius: 999px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
        .badge-anulada { background: #ffe4e6; color: #be123c; }
        .badge-liquidado { background: #d1fae5; color: #065f46; }
        .badge-arobado, .badge-registrado, .badge-aprobado { background: #dbeafe; color: #1e40af; }
        .anulada td { opacity: 0.6; background: #fff5f5 !important; }
        .sin-saldo td { background: #fff5f5 !important; color: #be123c; }
        .sin-saldo td:last-child { font-weight: 700; color: #be123c; }
        .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 9px; color: #888; display: flex; justify-content: space-between; }
        .loading { padding: 60px; text-align: center; font-size: 14px; color: #555; }
        .error { padding: 40px; text-align: center; color: #be123c; }
        @media print {
          @page { margin: 1.2cm; size: A4 landscape; }
          body { font-size: 9px; }
          .no-print { display: none !important; }
          table { font-size: 8px; }
          th { font-size: 7px; padding: 4px 6px; }
          td { padding: 3px 6px; }
        }
      `}</style>

      <div className="page">
        {loading ? (
          <div className="loading">Cargando datos...</div>
        ) : error ? (
          <div className="error">Error: {error}</div>
        ) : (
          <>
            <div className="header">
              <div className="header-left">
                <h1>Universidad Estatal de Bolívar</h1>
                <p>Sistema de Control Presupuestario — Grupos de Gasto 51 y 58</p>
                <p style={{ marginTop: '6px', fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>
                  {config.titulo}
                </p>
              </div>
              <div className="header-right">
                <div>Fecha de emisión:</div>
                <div style={{ fontWeight: 700 }}>{fecha}</div>
                <div style={{ marginTop: '6px' }}>Total registros: <strong>{data.length}</strong></div>
              </div>
            </div>

            <config.Tabla data={data} />

            <div className="footer">
              <span>Sistema de Control Presupuestario — UEB</span>
              <span>Documento generado el {fecha}</span>
            </div>

            <div className="no-print" style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={() => window.print()}
                style={{ padding: '10px 24px', background: '#1a4f9c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                Imprimir / Guardar PDF
              </button>
              <button
                onClick={() => window.close()}
                style={{ marginLeft: '10px', padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
