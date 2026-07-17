import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFiscalYear } from '../contexts/FiscalYearContext';
import { can } from '../utils/permissions';
import { cachedFetch } from '../utils/apiCache';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import {
  Upload, Database, FileText, CheckCircle2, Users,
  ArrowRight, TrendingUp, BarChart3, Activity, Shield,
  DollarSign, Target, Zap,
} from 'lucide-react';

const InicioChart = lazy(() => import('./InicioChart'));

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/* ── Single RAF loop drives all four counters simultaneously ─── */
function useAnimatedCounters(t0, t1, t2, t3, duration = 1400, delay = 400) {
  const [vals, setVals] = useState([0, 0, 0, 0]);

  useEffect(() => {
    if (t0 === 0 && t1 === 0 && t2 === 0 && t3 === 0) { setVals([0, 0, 0, 0]); return; }
    const timer = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1);
        const e = 1 - Math.pow(1 - p, 3);
        setVals(p < 1
          ? [Math.floor(e * t0), Math.floor(e * t1), Math.floor(e * t2), Math.floor(e * t3)]
          : [t0, t1, t2, t3]
        );
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timer);
  }, [t0, t1, t2, t3]);

  return vals;
}


/* ── 3D Flip KPI card ────────────────────────────────────────── */
function FlipCard({ front, back }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      style={{ perspective: '1000px', cursor: 'pointer', height: '100%' }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d', height: '100%', position: 'relative' }}
      >
        <div style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          height: '100%',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.95)',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(26,58,92,0.10)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {front}
        </div>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'linear-gradient(135deg, #1a3a5c 0%, #2e6ca4 100%)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(26,58,92,0.25)',
        }}>
          {back}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Skeleton card glassmorphism ─────────────────────────────── */
function SkeletonKpiCards({ isMobile, cols = 4 }) {
  const cardStyle = {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.95)',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(26,58,92,0.10)',
    padding: '20px',
    height: isMobile ? '120px' : '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${cols}, 1fr)`, gap: '14px', height: isMobile ? 'auto' : '130px' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="skeleton" style={{ width: '70px', height: '10px' }} />
            <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '9px' }} />
          </div>
          <div>
            <div className="skeleton" style={{ width: '110px', height: '26px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '55px', height: '10px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonChart({ isMobile }) {
  const panelStyle = {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.95)',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(26,58,92,0.10)',
    padding: '20px',
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: '16px' }}>
      {/* Gráfico */}
      <div style={panelStyle}>
        <div className="skeleton" style={{ width: '180px', height: '14px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ width: '140px', height: '11px', marginBottom: '20px' }} />
        {/* Barras simuladas */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '180px', padding: '0 4px' }}>
          {[110, 110, 110, 110, 140].map((h, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch', height: '100%', justifyContent: 'flex-end' }}>
              <div className="skeleton" style={{ height: `${Math.round(h * 0.5)}px`, borderRadius: '6px 6px 0 0' }} />
              <div className="skeleton" style={{ height: `${Math.round(h * 0.18)}px`, borderRadius: '6px 6px 0 0', opacity: 0.5 }} />
            </div>
          ))}
        </div>
      </div>
      {/* Barras de progreso */}
      <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column' }}>
        <div className="skeleton" style={{ width: '160px', height: '14px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ width: '120px', height: '11px', marginBottom: '24px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', flex: 1, justifyContent: 'center' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                <div className="skeleton" style={{ width: '110px', height: '11px' }} />
                <div className="skeleton" style={{ width: '28px', height: '11px' }} />
              </div>
              <div className="skeleton" style={{ width: '100%', height: '7px', borderRadius: '999px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonQuickActions({ isMobile }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '16px 18px',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.95)',
          borderRadius: '14px',
          boxShadow: '0 4px 20px rgba(26,58,92,0.08)',
        }}>
          <div className="skeleton" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '70%', height: '13px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '50%', height: '10px' }} />
          </div>
          <div className="skeleton" style={{ width: '15px', height: '15px', borderRadius: '4px', flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export const Inicio = () => {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const { selectedCedula } = useFiscalYear();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading,  setLoading]  = useState(true);

  const [totales, setTotales] = useState({
    total_codificado: 0, total_certificado: 0, total_saldo: 0,
    total_items: 0, items_sin_saldo: 0,
  });
  const [usuariosCount,  setUsuariosCount]  = useState(0);
  const [chartData,      setChartData]      = useState([]);
  const [progressBars,   setProgressBars]   = useState({
    certVsCod: 0, partidasSaldo: 0, certAprobadas: 0, liqActivas: 0,
  });

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => { fetchDashboard(); }, [selectedCedula]);

  const fetchDashboard = async () => {
    try {
      const token   = Cookies.get('auth_token');
      const authHdr = { Authorization: `Bearer ${token}` };
      const cedulaQ = selectedCedula
        ? `?id_cedula_presupuestaria=${selectedCedula.id_cedula_presupuestaria}`
        : '';

      const puedeVerUsuarios = can.verUsuarios(user);

      const fetches = [
        cachedFetch(`${API}/presupuesto-disponible${cedulaQ}`, { headers: authHdr }),
        puedeVerUsuarios ? cachedFetch(`${API}/usuarios`, { headers: authHdr }) : Promise.resolve(null),
        cachedFetch(`${API}/reportes/certificaciones/json`, { headers: authHdr }),
        cachedFetch(`${API}/reportes/liquidaciones/json`,   { headers: authHdr }),
      ];

      const [presRes, usersRes, certRes, liqRes] = await Promise.all(fetches);

      const [presJson, usersJson, certJson, liqJson] = await Promise.all([
        presRes.json(),
        usersRes ? usersRes.json() : Promise.resolve(null),
        certRes.json(),
        liqRes.json(),
      ]);

      /* ── Presupuesto totales ── */
      if (presJson.success) {
        setTotales(presJson.totales);

        const t = presJson.totales;
        const certVsCod     = t.total_codificado  > 0 ? Math.min(100, Math.round((t.total_certificado / t.total_codificado) * 100)) : 0;
        const partidasSaldo = t.total_items        > 0 ? Math.round(((t.total_items - t.items_sin_saldo) / t.total_items) * 100) : 0;

        /* ── Certificaciones ── */
        let certAprobadas = 0;
        const currentYear  = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const byMonth = {};

        if (certJson.success && certJson.data?.length) {
          const total   = certJson.data.length;
          const activas = certJson.data.filter(c => c.estado !== 'ANULADA' && c.estado !== 'ERRADO').length;
          certAprobadas = total > 0 ? Math.round((activas / total) * 100) : 0;

          certJson.data.forEach(c => {
            if (['ANULADA', 'RECHAZADO', 'ERRADO'].includes(c.estado)) return;
            const d = new Date(c.fecha_elaboracion + 'T12:00:00-05:00');
            if (d.getFullYear() !== currentYear) return;
            const m = d.getMonth();
            byMonth[m] = (byMonth[m] || 0) + parseFloat(c.monto_total || 0);
          });
        }

        /* Certificado por mes (no acumulado) — solo lo certificado en ese mes */
        const months = Array.from({ length: currentMonth + 1 }, (_, i) => ({
          name:        MONTH_NAMES[i],
          Certificado: Math.round(byMonth[i] || 0),
        }));
        setChartData(months);

        /* ── Liquidaciones ── */
        let liqActivas = 0;
        if (liqJson.success && liqJson.data?.length) {
          const total   = liqJson.data.length;
          const activas = liqJson.data.filter(l => l.estado !== 'ANULADA').length;
          liqActivas    = total > 0 ? Math.round((activas / total) * 100) : 0;
        }

        setProgressBars({ certVsCod, partidasSaldo, certAprobadas, liqActivas });
      }

      /* ── Usuarios activos ── */
      if (usersJson?.status === 'success' && usersJson.data?.length) {
        const activos = usersJson.data.filter(u => u.estado === 'activo').length;
        setUsuariosCount(activos);
      }
    } catch {
      // dashboard data unavailable — counters stay at 0
    } finally {
      setLoading(false);
    }
  };

  /* Single RAF loop drives all four counters */
  const [animTotal, animUsado, animDisp, animUsuarios] = useAnimatedCounters(
    totales.total_codificado,
    totales.total_certificado,
    totales.total_saldo,
    usuariosCount,
  );

  const pctUsado = totales.total_codificado > 0
    ? Math.round((totales.total_certificado / totales.total_codificado) * 100)
    : 0;
  const pctDisp  = totales.total_codificado > 0
    ? Math.round((totales.total_saldo       / totales.total_codificado) * 100)
    : 0;

  const P = isMobile ? '20px' : '28px 32px';

  const quickActions = [
    { title: 'Cédula Presupuestaria',     desc: 'Importar y gestionar presupuesto', icon: FileText,     color: '#d97706', path: '/dashboard/cedula-presupuestaria',  check: can.verCedula },
    { title: 'Certificaciones',           desc: 'Crear y gestionar certificados',   icon: CheckCircle2, color: '#059669', path: '/dashboard/certificacion',          check: can.verCertificacion },
    { title: 'Gestionar Usuarios',        desc: 'Administrar acceso de usuarios',   icon: Users,        color: '#8b0f0f', path: '/dashboard/usuarios',               check: can.verUsuarios },
    { title: 'Reportes',                  desc: 'Exportar datos y documentos',      icon: BarChart3,    color: '#7c3aed', path: '/dashboard/reportes',               check: can.verReportes },
  ].filter(a => a.check(user));

  return (
    <div style={{ background: 'var(--page-bg)', minHeight: '100%', padding: P, fontFamily: 'var(--font-primary)' }}>
      <style>{`
        @keyframes ini-down  { from { opacity:0; transform:translateY(-20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes ini-up    { from { opacity:0; transform:translateY(24px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes ini-left  { from { opacity:0; transform:translateX(-20px) } to { opacity:1; transform:translateX(0) } }
        @keyframes ini-right { from { opacity:0; transform:translateX(20px)  } to { opacity:1; transform:translateX(0) } }
        @keyframes ini-fade  { from { opacity:0 } to { opacity:1 } }
      `}</style>

      {/* ── Hero Welcome Banner ────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0d1f35 0%, #1a3a5c 45%, #2e6ca4 100%)',
          borderRadius: '20px',
          padding: isMobile ? '24px 20px' : '32px 40px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(13,31,53,0.35)',
          animation: 'ini-down 0.5s cubic-bezier(0.4,0,0.2,1) both',
        }}
      >
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(84,179,224,0.10)', backdropFilter: 'blur(8px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: '160px', height: '160px', borderRadius: '30px', background: 'rgba(255,255,255,0.04)', transform: 'rotate(25deg)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', right: '15%', width: '80px', height: '80px', borderRadius: '15px', border: '2px solid rgba(84,179,224,0.15)', transform: 'rotate(15deg)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(84,179,224,0.12)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ margin: '0 0 6px', fontSize: '10.5px', color: 'rgba(84,179,224,0.85)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', animation: 'ini-left 0.4s 0.15s both' }}>
            Universidad Estatal de Bolívar
          </p>
          <h1 style={{ margin: '0 0 8px', fontSize: isMobile ? '22px' : '30px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, animation: 'ini-left 0.4s 0.22s both' }}>
            Bienvenido, {[user?.nombres?.split(' ')[0], user?.apellidos?.split(' ')[0]].filter(Boolean).join(' ') || 'Usuario'}
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, animation: 'ini-fade 0.4s 0.32s both' }}>
            Panel de Control — Sistema de Control Presupuestario · Grupos 51 y 58
          </p>

          <div style={{ marginTop: '18px', display: 'flex', gap: '8px', flexWrap: 'wrap', animation: 'ini-up 0.4s 0.4s both' }}>
            {[
              { icon: Zap,    label: `Año Fiscal ${new Date().getFullYear()}`, color: '#54b3e0' },
              { icon: Target, label: 'Grupos 51 y 58',                         color: 'rgba(255,255,255,0.6)' },
            ].map((tag, i) => {
              const TagIcon = tag.icon;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11px', color: tag.color, fontWeight: 600,
                }}>
                  <TagIcon size={11} />
                  {tag.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.09em', textTransform: 'uppercase', animation: 'ini-fade 0.4s 0.3s both' }}>
          Resumen Presupuestario
        </p>

        {loading ? <SkeletonKpiCards isMobile={isMobile} cols={can.verUsuarios(user) ? 4 : 3} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${can.verUsuarios(user) ? 4 : 3}, 1fr)`, gap: '14px', height: isMobile ? 'auto' : '130px' }}>
          {[
            {
              label: 'Presupuesto Total', value: animTotal,    prefix: '$', icon: DollarSign, color: '#2e6ca4',
              frontSub: 'Codificado total',
              backLabel: 'Distribución', backVal: '100% asignado', backSub: 'Codificado total del año fiscal',
            },
            {
              label: 'Certificado',       value: animUsado,    prefix: '$', icon: TrendingUp,  color: '#d97706',
              frontSub: `${pctUsado}% del total`,
              backLabel: 'Estado', backVal: `${pctUsado}% ejecutado`, backSub: 'Certificaciones emitidas acumuladas',
            },
            {
              label: 'Disponible',        value: animDisp,     prefix: '$', icon: Activity,    color: '#059669',
              frontSub: `${pctDisp}% restante`,
              backLabel: 'Saldo libre', backVal: `${pctDisp}% disponible`, backSub: 'Partidas con saldo para certificar',
            },
            ...(can.verUsuarios(user) ? [{
              label: 'Usuarios Activos',  value: animUsuarios, prefix: '', icon: Shield,       color: '#7c3aed',
              frontSub: 'En el sistema',
              backLabel: 'Accesos', backVal: 'Activos hoy', backSub: 'Usuarios con sesión habilitada',
            }] : []),
          ].map((card, i) => {
            const CardIcon = card.icon;
            return (
              <div
                key={i}
                style={{
                  height: isMobile ? '120px' : '100%',
                  animation: 'ini-up 0.45s ease both',
                  animationDelay: `${i * 0.09}s`,
                }}
              >
                <FlipCard
                  front={
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {card.label}
                        </span>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '9px',
                          background: `${card.color}15`, border: `1px solid ${card.color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <CardIcon size={15} color={card.color} />
                        </div>
                      </div>
                      <div style={{ marginTop: 'auto' }}>
                        <p style={{ margin: '0 0 2px', fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                          {`${card.prefix}${card.value.toLocaleString('es-EC')}`}
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: card.color, fontWeight: 600 }}>
                          {card.frontSub}
                        </p>
                      </div>
                    </>
                  }
                  back={
                    <>
                      <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: 'rgba(84,179,224,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {card.backLabel}
                      </p>
                      <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                        {card.backVal}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                        {card.backSub}
                      </p>
                    </>
                  }
                />
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* ── Chart + Progress ──────────────────────────────── */}
      {loading ? (
        <div style={{ marginBottom: '24px' }}><SkeletonChart isMobile={isMobile} /></div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: '16px', marginBottom: '24px' }}>

        {/* Bar Chart */}
        <div
          style={{
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.95)', borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(26,58,92,0.10)', padding: '20px',
            animation: 'ini-left 0.4s 0.5s both',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 3px', fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>
              Evolución Presupuestaria
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Certificado mensual ({new Date().getFullYear()})
            </p>
          </div>

          <Suspense fallback={<div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando gráfico…</div>}>
            <InicioChart chartData={chartData} loading={loading} />
          </Suspense>

          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#54b3e0' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Certificado</span>
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div
          style={{
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.95)', borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(26,58,92,0.10)', padding: '20px',
            display: 'flex', flexDirection: 'column',
            animation: 'ini-right 0.4s 0.55s both',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 3px', fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>
              Ejecución Presupuestaria
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Avance del ejercicio fiscal {new Date().getFullYear()}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'center' }}>
            {[
              { label: 'Certificado vs Codificado', pct: progressBars.certVsCod,    color: '#2e6ca4', gradient: 'linear-gradient(90deg, #1a3a5c, #2e6ca4)' },
              { label: 'Certificaciones Activas',   pct: progressBars.certAprobadas, color: '#059669', gradient: 'linear-gradient(90deg, #047857, #059669)' },
              { label: 'Partidas con Saldo',        pct: progressBars.partidasSaldo, color: '#54b3e0', gradient: 'linear-gradient(90deg, #2e6ca4, #54b3e0)' },
              { label: 'Liquidaciones Activas',     pct: progressBars.liqActivas,    color: '#d97706', gradient: 'linear-gradient(90deg, #b45309, #d97706)' },
            ].map((bar, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{bar.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: bar.color }}>
                    {`${bar.pct}%`}
                  </span>
                </div>
                <div style={{ width: '100%', height: '7px', background: 'rgba(26,58,92,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${bar.pct}%` }}
                    transition={{ duration: 1.2, delay: 0.7 + i * 0.15, ease: 'easeOut' }}
                    style={{ height: '100%', background: bar.gradient, borderRadius: '999px', boxShadow: `0 2px 8px ${bar.color}55` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* ── Quick Actions ─────────────────────────────────── */}
      <div>
        <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.09em', textTransform: 'uppercase', animation: 'ini-fade 0.4s 0.6s both' }}>
          Acciones Rápidas
        </p>

        {loading ? <SkeletonQuickActions isMobile={isMobile} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={i}
                whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(26,58,92,0.16)', scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '16px 18px',
                  background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.95)', borderRadius: '14px',
                  boxShadow: '0 4px 20px rgba(26,58,92,0.08)',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-primary)',
                  transition: 'border-color 0.18s ease',
                  animation: 'ini-up 0.45s ease both',
                  animationDelay: `${0.65 + i * 0.07}s`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${action.color}40`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.95)'; }}
              >
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: `${action.color}12`, border: `1px solid ${action.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: action.color, flexShrink: 0, transition: 'all 0.18s ease',
                }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.2 }}>
                    {action.title}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {action.desc}
                  </p>
                </div>
                <ArrowRight size={15} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
              </motion.button>
            );
          })}
        </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '28px', paddingTop: '16px', borderTop: '1px solid rgba(26,58,92,0.08)',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
          animation: 'ini-fade 0.4s 0.9s both',
        }}
      >
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-light)' }}>
          Sistema Control Presupuestario © {new Date().getFullYear()} — UEB
        </p>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-light)' }}>
          Versión 1.0
        </p>
      </div>
    </div>
  );
};
